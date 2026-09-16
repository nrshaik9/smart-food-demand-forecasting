"""
Feature Engineering Pipeline for Food Demand Forecasting
Extracts temporal patterns, pricing elasticity metrics, and historical lag/rolling statistics
without data leakage.
"""

import os
import pandas as pd
import numpy as np

def build_features(input_path="dataset/processed/cleaned_sales_data.csv",
                   output_path="dataset/processed/engineered_features.csv"):
    print(f"[FEATURE ENGINEERING] Reading cleaned data from: {input_path}")
    df = pd.read_csv(input_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # Sort strictly by date, restaurant, and dish to maintain causal sequence
    df = df.sort_values(by=['date', 'restaurant_id', 'menu_item_name']).reset_index(drop=True)
    
    # 1. Temporal Features
    df['day_of_week'] = df['date'].dt.dayofweek # 0=Monday, 6=Sunday
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['day_of_month'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    
    # 2. Economic & Pricing Features
    df['price_diff'] = df['actual_selling_price'] - df['observed_market_price']
    df['price_ratio'] = df['actual_selling_price'] / np.maximum(df['observed_market_price'], 0.1)
    df['unit_margin'] = df['actual_selling_price'] - df['typical_ingredient_cost']
    df['unit_margin_pct'] = df['unit_margin'] / np.maximum(df['actual_selling_price'], 0.1)
    
    # 3. Historical Demand Signals (Strictly shifted to prevent lookahead leakage)
    # Dish-level rolling and lag metrics across restaurants
    # First, calculate daily total demand per dish to capture aggregate popularity
    daily_dish_sales = df.groupby(['date', 'menu_item_name'])['quantity_sold'].mean().reset_index()
    daily_dish_sales = daily_dish_sales.sort_values(by=['menu_item_name', 'date'])
    
    daily_dish_sales['dish_lag_1'] = daily_dish_sales.groupby('menu_item_name')['quantity_sold'].shift(1)
    daily_dish_sales['dish_rolling_mean_3'] = daily_dish_sales.groupby('menu_item_name')['quantity_sold'].shift(1).rolling(3, min_periods=1).mean()
    daily_dish_sales['dish_rolling_mean_7'] = daily_dish_sales.groupby('menu_item_name')['quantity_sold'].shift(1).rolling(7, min_periods=1).mean()
    
    # Merge back
    df = pd.merge(df, daily_dish_sales[['date', 'menu_item_name', 'dish_lag_1', 'dish_rolling_mean_3', 'dish_rolling_mean_7']], 
                  on=['date', 'menu_item_name'], how='left')
    
    # Item-level mean baseline (computed on prior history or median)
    dish_medians = df.groupby('menu_item_name')['quantity_sold'].median()
    df['dish_lag_1'] = df['dish_lag_1'].fillna(df['menu_item_name'].map(dish_medians)).fillna(df['quantity_sold'].median())
    df['dish_rolling_mean_3'] = df['dish_rolling_mean_3'].fillna(df['menu_item_name'].map(dish_medians)).fillna(df['quantity_sold'].median())
    df['dish_rolling_mean_7'] = df['dish_rolling_mean_7'].fillna(df['menu_item_name'].map(dish_medians)).fillna(df['quantity_sold'].median())
    
    # 4. Ingredient Count Tag
    df['ingredient_count'] = df['key_ingredients_tags'].apply(lambda x: len(str(x).split(',')))
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[FEATURE ENGINEERING] Created engineered dataset with shape: {df.shape}")
    print(f"[FEATURE ENGINEERING] Saved to: {output_path}")
    return df

if __name__ == "__main__":
    build_features()
