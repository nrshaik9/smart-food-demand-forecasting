"""
Prediction and Forecasting Module
Loads the trained model and performs single or batch inference with recommended preparation
buffer and ingredient breakdown calculations.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np

def load_artifacts(models_dir="models"):
    model_path = os.path.join(models_dir, "best_demand_model.pkl")
    metadata_path = os.path.join(models_dir, "dish_metadata.json")
    metrics_path = os.path.join(models_dir, "model_metrics.json")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Run train_model.py first.")
        
    model = joblib.load(model_path)
    with open(metadata_path, "r") as f:
        dish_meta = json.load(f)
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
        
    return model, dish_meta, metrics

def predict_demand(
    menu_item_name: str,
    restaurant_type: str = "Food Stall",
    meal_type: str = "Lunch",
    weather_condition: str = "Sunny",
    has_promotion: bool = False,
    special_event: bool = False,
    actual_selling_price: float = None,
    safety_buffer_pct: float = 10.0,
    forecast_date_str: str = "2024-02-15",
    models_dir="models"
):
    model, dish_meta, _ = load_artifacts(models_dir)
    
    if menu_item_name not in dish_meta:
        raise ValueError(f"Unknown dish: {menu_item_name}. Available: {list(dish_meta.keys())}")
        
    info = dish_meta[menu_item_name]
    typical_cost = info['typical_cost']
    market_price = info['market_price']
    
    if actual_selling_price is None:
        actual_selling_price = info['avg_selling_price']
        
    date_dt = pd.to_datetime(forecast_date_str)
    day_of_week = date_dt.dayofweek
    is_weekend = int(day_of_week in [5, 6])
    day_of_month = date_dt.day
    month = date_dt.month
    
    price_diff = actual_selling_price - market_price
    price_ratio = actual_selling_price / max(market_price, 0.1)
    unit_margin = actual_selling_price - typical_cost
    unit_margin_pct = unit_margin / max(actual_selling_price, 0.1)
    
    dish_avg = info['avg_quantity_sold']
    dish_lag_1 = dish_avg
    dish_rolling_mean_3 = dish_avg
    dish_rolling_mean_7 = dish_avg
    ingredient_count = len(info['ingredients'])
    
    input_row = pd.DataFrame([{
        'restaurant_type': restaurant_type,
        'menu_item_name': menu_item_name,
        'meal_type': meal_type,
        'weather_condition': weather_condition,
        'typical_ingredient_cost': typical_cost,
        'observed_market_price': market_price,
        'actual_selling_price': actual_selling_price,
        'has_promotion': int(has_promotion),
        'special_event': int(special_event),
        'day_of_week': day_of_week,
        'is_weekend': is_weekend,
        'day_of_month': day_of_month,
        'month': month,
        'price_diff': price_diff,
        'price_ratio': price_ratio,
        'unit_margin': unit_margin,
        'unit_margin_pct': unit_margin_pct,
        'dish_lag_1': dish_lag_1,
        'dish_rolling_mean_3': dish_rolling_mean_3,
        'dish_rolling_mean_7': dish_rolling_mean_7,
        'ingredient_count': ingredient_count
    }])
    
    pred_raw = float(model.predict(input_row)[0])
    predicted_demand = max(int(round(pred_raw)), 0)
    
    # Recommended Preparation = Predicted Demand * (1 + Safety Buffer / 100)
    buffer_mult = 1.0 + (safety_buffer_pct / 100.0)
    recommended_prep = int(np.ceil(predicted_demand * buffer_mult))
    safety_units = recommended_prep - predicted_demand
    
    # Ingredient Breakdown calculation
    # Standard portion assumption: 1 dish portion uses balanced constituent ingredients
    ingredients_needed = []
    for ing in info['ingredients']:
        ingredients_needed.append({
            "ingredient": ing,
            "units_needed": recommended_prep,
            "unit_cost_est": round(typical_cost / max(len(info['ingredients']), 1), 2),
            "total_ingredient_cost_est": round(recommended_prep * (typical_cost / max(len(info['ingredients']), 1)), 2)
        })
        
    return {
        "menu_item_name": menu_item_name,
        "forecast_date": date_dt.strftime('%Y-%m-%d'),
        "predicted_demand": predicted_demand,
        "safety_buffer_pct": safety_buffer_pct,
        "safety_buffer_units": safety_units,
        "recommended_preparation": recommended_prep,
        "unit_ingredient_cost": typical_cost,
        "selling_price": actual_selling_price,
        "estimated_cost": round(recommended_prep * typical_cost, 2),
        "estimated_revenue_at_demand": round(predicted_demand * actual_selling_price, 2),
        "estimated_profit_at_demand": round((predicted_demand * actual_selling_price) - (recommended_prep * typical_cost), 2),
        "ingredients": ingredients_needed
    }

if __name__ == "__main__":
    result = predict_demand("Nasi Lemak", safety_buffer_pct=10.0)
    print(json.dumps(result, indent=2))
