"""
Data Preprocessing Pipeline for Food Demand Forecasting
Loads raw restaurant sales data, validates schema and types, handles anomalies,
and exports cleaned dataset for feature engineering.
"""

import os
import pandas as pd
import numpy as np

def preprocess_data(input_path="dataset/original/restaurant_sales_data.csv",
                    output_path="dataset/processed/cleaned_sales_data.csv"):
    print(f"[PREPROCESSING] Loading dataset from: {input_path}")
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found at {input_path}")
    
    df = pd.read_csv(input_path)
    print(f"[PREPROCESSING] Initial records: {len(df)}")
    
    # 1. Validate required columns
    expected_cols = [
        'date', 'restaurant_id', 'restaurant_type', 'menu_item_name', 
        'meal_type', 'key_ingredients_tags', 'typical_ingredient_cost', 
        'observed_market_price', 'actual_selling_price', 'quantity_sold', 
        'has_promotion', 'special_event', 'weather_condition'
    ]
    missing_cols = [c for c in expected_cols if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing expected columns: {missing_cols}")
        
    # 2. Parse Date
    df['date'] = pd.to_datetime(df['date'], format='%m/%d/%Y', errors='coerce')
    null_dates = df['date'].isna().sum()
    if null_dates > 0:
        print(f"[PREPROCESSING] Warning: Dropping {null_dates} rows with invalid dates")
        df = df.dropna(subset=['date'])
        
    # 3. Handle Types & Missing Values
    # Numeric conversions
    num_cols = ['typical_ingredient_cost', 'observed_market_price', 'actual_selling_price', 'quantity_sold']
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    # Boolean conversions
    bool_cols = ['has_promotion', 'special_event']
    for col in bool_cols:
        df[col] = df[col].astype(str).str.strip().str.upper().map({'TRUE': 1, 'FALSE': 0, '1': 1, '0': 0}).fillna(0).astype(int)
        
    # String cleans
    str_cols = ['restaurant_type', 'menu_item_name', 'meal_type', 'weather_condition', 'key_ingredients_tags']
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()
        
    # Filter non-negative quantities and prices
    df = df[df['quantity_sold'] >= 0]
    df = df[df['actual_selling_price'] > 0]
    
    # Sort chronologically
    df = df.sort_values(by=['date', 'restaurant_id', 'menu_item_name']).reset_index(drop=True)
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[PREPROCESSING] Completed successfully. Cleaned records: {len(df)}")
    print(f"[PREPROCESSING] Saved cleaned dataset to: {output_path}")
    return df

if __name__ == "__main__":
    preprocess_data()
