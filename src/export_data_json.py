"""
Export analytical summaries and historical records to JSON for easy rendering
in both Streamlit and the web dashboard.
"""

import json
import pandas as pd

def export_summaries():
    df = pd.read_csv("dataset/processed/cleaned_sales_data.csv")
    df['date'] = pd.to_datetime(df['date'])
    
    # 1. Daily overall demand
    daily_sales = df.groupby('date')['quantity_sold'].sum().reset_index()
    daily_sales['date_str'] = daily_sales['date'].dt.strftime('%Y-%m-%d')
    
    # 2. Dish stats
    dish_stats = df.groupby('menu_item_name').agg(
        total_sold=('quantity_sold', 'sum'),
        avg_sold=('quantity_sold', 'mean'),
        avg_price=('actual_selling_price', 'mean'),
        unit_cost=('typical_ingredient_cost', 'mean'),
        records=('quantity_sold', 'count')
    ).reset_index()
    
    dish_stats['margin'] = dish_stats['avg_price'] - dish_stats['unit_cost']
    dish_stats['margin_pct'] = (dish_stats['margin'] / dish_stats['avg_price']) * 100
    dish_stats = dish_stats.sort_values(by='total_sold', ascending=False)
    
    # 3. Meal type distribution
    meal_stats = df.groupby('meal_type')['quantity_sold'].sum().reset_index()
    
    # 4. Restaurant type distribution
    rest_stats = df.groupby('restaurant_type')['quantity_sold'].sum().reset_index()
    
    # 5. Promo impact
    promo_stats = df.groupby('has_promotion')['quantity_sold'].mean().reset_index()
    
    # 6. Sample records for waste audit
    sample_records = df.tail(60).to_dict(orient='records')
    for r in sample_records:
        r['date'] = str(r['date'])[:10]
        
    export_payload = {
        "total_records": len(df),
        "start_date": df['date'].min().strftime('%Y-%m-%d'),
        "end_date": df['date'].max().strftime('%Y-%m-%d'),
        "total_volume": int(df['quantity_sold'].sum()),
        "avg_daily_volume": round(float(daily_sales['quantity_sold'].mean()), 1),
        "dishes": dish_stats.round(2).to_dict(orient='records'),
        "daily_trends": daily_sales[['date_str', 'quantity_sold']].to_dict(orient='records'),
        "meal_distribution": meal_stats.to_dict(orient='records'),
        "restaurant_distribution": rest_stats.to_dict(orient='records'),
        "promo_impact": promo_stats.round(2).to_dict(orient='records'),
        "recent_sales": sample_records
    }
    
    with open("dataset/processed/analytics_summary.json", "w") as f:
        json.dump(export_payload, f, indent=2)
        
    print("[EXPORT] Exported analytics_summary.json successfully.")

if __name__ == "__main__":
    export_summaries()
