export interface DishInfo {
  name: string;
  ingredients: string[];
  typical_cost: number;
  market_price: number;
  avg_selling_price: number;
  avg_quantity_sold: number;
  min_quantity: number;
  max_quantity: number;
  common_meal_type: string;
}

export interface ModelMetric {
  MAE: number;
  RMSE: number;
  R2: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ModelMetricsData {
  best_model_name: string;
  metrics_report: Record<string, ModelMetric>;
  feature_importances: FeatureImportance[];
  train_samples: number;
  test_samples: number;
  train_dates: [string, string];
  test_dates: [string, string];
  total_dishes: number;
  dish_names: string[];
  restaurant_types: string[];
  meal_types: string[];
  weather_conditions: string[];
}

export interface DishStat {
  menu_item_name: string;
  total_sold: number;
  avg_sold: number;
  avg_price: number;
  unit_cost: number;
  records: number;
  margin: number;
  margin_pct: number;
}

export interface AnalyticsSummary {
  total_records: number;
  start_date: string;
  end_date: string;
  total_volume: number;
  avg_daily_volume: number;
  avg_weekly_volume: number;
  dishes: DishStat[];
  daily_trends: Array<{ date_str: string; quantity_sold: number }>;
  weekly_trends?: Array<{ date_str: string; quantity_sold: number }>;
  monthly_trends?: Array<{ date_str: string; quantity_sold: number }>;
  meal_distribution: Array<{ meal_type: string; quantity_sold: number }>;
  restaurant_distribution: Array<{ restaurant_type: string; quantity_sold: number }>;
  promo_impact: Array<{ has_promotion: number | boolean; quantity_sold: number }>;
  recent_sales: Array<{
    date: string;
    restaurant_id: number;
    restaurant_type: string;
    menu_item_name: string;
    meal_type: string;
    quantity_sold: number;
    actual_selling_price: number;
    typical_ingredient_cost: number;
    has_promotion: number | boolean;
    special_event: number | boolean;
    weather_condition: string;
  }>;
}
