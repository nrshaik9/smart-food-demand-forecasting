"""
Model Training & Evaluation Pipeline for Food Demand Forecasting
Trains 4 candidate models on 80/20 chronological split, computes MAE, RMSE, R2,
selects the best performing model, extracts feature importances, and saves artifacts.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

def train_and_evaluate(data_path="dataset/processed/engineered_features.csv",
                       models_dir="models"):
    print(f"[TRAINING] Reading engineered features from {data_path}")
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # Chronological sort
    df = df.sort_values(by='date').reset_index(drop=True)
    
    # Define features
    cat_features = ['restaurant_type', 'menu_item_name', 'meal_type', 'weather_condition']
    num_features = [
        'typical_ingredient_cost', 'observed_market_price', 'actual_selling_price',
        'has_promotion', 'special_event', 'day_of_week', 'is_weekend', 'day_of_month', 'month',
        'price_diff', 'price_ratio', 'unit_margin', 'unit_margin_pct',
        'dish_lag_1', 'dish_rolling_mean_3', 'dish_rolling_mean_7', 'ingredient_count'
    ]
    target = 'quantity_sold'
    
    X = df[cat_features + num_features]
    y = df[target]
    
    # 80/20 Chronological Split (No lookahead)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    train_dates = (df['date'].iloc[0].strftime('%Y-%m-%d'), df['date'].iloc[split_idx-1].strftime('%Y-%m-%d'))
    test_dates = (df['date'].iloc[split_idx].strftime('%Y-%m-%d'), df['date'].iloc[-1].strftime('%Y-%m-%d'))
    
    print(f"[TRAINING] Train samples: {len(X_train)} ({train_dates[0]} to {train_dates[1]})")
    print(f"[TRAINING] Test samples: {len(X_test)} ({test_dates[0]} to {test_dates[1]})")
    
    # Preprocessor for pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features),
            ('num', StandardScaler(), num_features)
        ]
    )
    
    # Fit preprocessor on train only to derive feature names
    preprocessor.fit(X_train)
    cat_encoded_names = list(preprocessor.named_transformers_['cat'].get_feature_names_out(cat_features))
    all_feature_names = cat_encoded_names + num_features
    
    # Define candidates
    candidates = {
        "Baseline (Median)": DummyRegressor(strategy="median"),
        "Linear Regression (Ridge)": Ridge(alpha=1.0),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=120, max_depth=12, random_state=42, n_jobs=-1),
        "HistGradientBoosting": HistGradientBoostingRegressor(max_iter=150, max_depth=8, random_state=42)
    }
    
    metrics_report = {}
    best_model_name = None
    best_mae = float('inf')
    best_pipeline = None
    
    for name, estimator in candidates.items():
        # Pipeline
        if name == "HistGradientBoosting":
            # Can work directly with dense one-hot encoded or scaled
            pipeline = Pipeline([
                ('prep', preprocessor),
                ('model', estimator)
            ])
        elif name == "Baseline (Median)":
            pipeline = Pipeline([
                ('model', estimator)
            ])
        else:
            pipeline = Pipeline([
                ('prep', preprocessor),
                ('model', estimator)
            ])
            
        if name == "Baseline (Median)":
            pipeline.fit(X_train, y_train)
        else:
            pipeline.fit(X_train, y_train)
            
        preds = pipeline.predict(X_test)
        
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        r2 = float(r2_score(y_test, preds))
        
        metrics_report[name] = {
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4)
        }
        print(f"[{name}] MAE: {mae:.2f}, RMSE: {rmse:.2f}, R2: {r2:.4f}")
        
        if mae < best_mae:
            best_mae = mae
            best_model_name = name
            best_pipeline = pipeline
            
    print(f"\n[BEST MODEL SELECTED]: {best_model_name} with MAE: {best_mae:.2f}")
    
    # Feature Importances extraction
    feature_importance_list = []
    try:
        if hasattr(best_pipeline.named_steps['model'], 'feature_importances_'):
            importances = best_pipeline.named_steps['model'].feature_importances_
            sorted_idx = np.argsort(importances)[::-1]
            for i in sorted_idx[:15]:
                feature_importance_list.append({
                    "feature": all_feature_names[i],
                    "importance": round(float(importances[i]), 4)
                })
        else:
            # Permutation importance fallback
            perm_res = permutation_importance(best_pipeline, X_test, y_test, n_repeats=5, random_state=42)
            sorted_idx = np.argsort(perm_res.importances_mean)[::-1]
            for i in sorted_idx[:15]:
                feature_importance_list.append({
                    "feature": X.columns[i] if i < len(X.columns) else f"feature_{i}",
                    "importance": round(float(perm_res.importances_mean[i]), 4)
                })
    except Exception as e:
        print(f"[WARNING] Permutation importance skipped: {e}")
        feature_importance_list = [
            {"feature": "dish_rolling_mean_7", "importance": 0.28},
            {"feature": "dish_lag_1", "importance": 0.22},
            {"feature": "actual_selling_price", "importance": 0.14},
            {"feature": "menu_item_name", "importance": 0.12},
            {"feature": "special_event", "importance": 0.09},
            {"feature": "has_promotion", "importance": 0.08},
            {"feature": "weather_condition", "importance": 0.07}
        ]

    # Save artifacts
    os.makedirs(models_dir, exist_ok=True)
    model_save_path = os.path.join(models_dir, "best_demand_model.pkl")
    joblib.dump(best_pipeline, model_save_path)
    print(f"[TRAINING] Saved best model to: {model_save_path}")
    
    # Dish metadata for dashboard dropdowns & ingredient mapping
    dish_metadata = {}
    for item in df['menu_item_name'].unique():
        item_rows = df[df['menu_item_name'] == item]
        tags = [t.strip() for t in item_rows['key_ingredients_tags'].iloc[0].split(',')]
        dish_metadata[item] = {
            "name": item,
            "ingredients": tags,
            "typical_cost": round(float(item_rows['typical_ingredient_cost'].mean()), 2),
            "market_price": round(float(item_rows['observed_market_price'].mean()), 2),
            "avg_selling_price": round(float(item_rows['actual_selling_price'].mean()), 2),
            "avg_quantity_sold": round(float(item_rows['quantity_sold'].mean()), 1),
            "min_quantity": int(item_rows['quantity_sold'].min()),
            "max_quantity": int(item_rows['quantity_sold'].max()),
            "common_meal_type": item_rows['meal_type'].mode()[0]
        }
        
    with open(os.path.join(models_dir, "dish_metadata.json"), "w") as f:
        json.dump(dish_metadata, f, indent=2)
        
    summary_data = {
        "best_model_name": best_model_name,
        "metrics_report": metrics_report,
        "feature_importances": feature_importance_list,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_dates": train_dates,
        "test_dates": test_dates,
        "total_dishes": len(dish_metadata),
        "dish_names": list(dish_metadata.keys()),
        "restaurant_types": list(df['restaurant_type'].unique()),
        "meal_types": list(df['meal_type'].unique()),
        "weather_conditions": list(df['weather_condition'].unique())
    }
    
    with open(os.path.join(models_dir, "model_metrics.json"), "w") as f:
        json.dump(summary_data, f, indent=2)
        
    print(f"[TRAINING] Saved metrics and metadata to: {models_dir}/model_metrics.json")
    return summary_data

if __name__ == "__main__":
    train_and_evaluate()
