import { DishInfo } from '../types';

export type EventCondition = 'No Event' | 'Exam Week' | 'College Fest' | 'Holiday' | 'Festive Season';
export type BinaryChoice = 'Yes' | 'No';
export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export interface ForecastInputParams {
  dish: DishInfo;
  previousDemand: number;
  month: string;
  dayOfWeek: DayOfWeek;
  isWeekend: BinaryChoice;
  eventOption: EventCondition;
  sellingPrice: number;
  safetyBufferPct: number;
  mealType: string;
  weather: string;
  currencySymbol: string;
}

export interface PredictionResult {
  menu_item_name: string;
  predicted_demand: number;
  safety_buffer_pct: number;
  safety_buffer_units: number;
  recommended_preparation: number;
  unit_ingredient_cost: number;
  selling_price: number;
  estimated_cost: number;
  estimated_revenue_at_demand: number;
  estimated_profit_at_demand: number;
  currency_symbol: string;
  ingredients: Array<{
    ingredient: string;
    units_needed: number;
    unit_cost_est: number;
    total_ingredient_cost_est: number;
  }>;
}

export const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const EVENT_OPTIONS: EventCondition[] = [
  'No Event',
  'Exam Week',
  'College Fest',
  'Holiday',
  'Festive Season',
];

export function runClientForecast(params: ForecastInputParams): PredictionResult {
  const {
    dish,
    previousDemand,
    month,
    dayOfWeek,
    isWeekend,
    eventOption,
    sellingPrice,
    safetyBufferPct,
    mealType,
    weather,
    currencySymbol = '₹',
  } = params;

  // Base demand: Incorporate Previous Recorded Demand (historical lag feature)
  let baseDemand: number;
  if (previousDemand && previousDemand > 0) {
    // In gradient boosting / ML models, lag-1 demand carries high relative weight (~65%)
    baseDemand = 0.65 * previousDemand + 0.35 * dish.avg_quantity_sold;
  } else {
    baseDemand = dish.avg_quantity_sold;
  }

  // Month Seasonality Factor (Campus Academic Cycle)
  const monthLower = month.toLowerCase();
  if (['december', 'may', 'april'].includes(monthLower)) {
    // Exam/end-of-semester months
    baseDemand *= 1.08;
  } else if (['june', 'july'].includes(monthLower)) {
    // Summer recess / break
    baseDemand *= 0.85;
  } else if (['october', 'november', 'february'].includes(monthLower)) {
    // Midterm & campus activity peak
    baseDemand *= 1.05;
  }

  // Day of Week & Weekend Factor
  switch (dayOfWeek) {
    case 'Friday':
      baseDemand *= 1.08; // End of week surge
      break;
    case 'Saturday':
      baseDemand *= 1.12; // Weekend high volume
      break;
    case 'Sunday':
      baseDemand *= 1.09; // Sunday student meal turnover
      break;
    case 'Wednesday':
    case 'Thursday':
      baseDemand *= 1.03; // Midweek peak
      break;
    case 'Monday':
    case 'Tuesday':
    default:
      baseDemand *= 1.00; // Baseline weekday
      break;
  }

  if (isWeekend === 'Yes') {
    // Weekend shift: higher brunch & dinner footfall
    baseDemand *= 1.06;
  }

  // Event Condition Factor
  switch (eventOption) {
    case 'Exam Week':
      baseDemand *= 1.20; // +20% late hours demand & comfort food
      break;
    case 'College Fest':
      baseDemand *= 1.35; // +35% massive visitor and student attendance
      break;
    case 'Festive Season':
      baseDemand *= 1.28; // +28% festive season surge & special celebrations
      break;
    case 'Holiday':
      baseDemand *= 0.75; // -25% dining hall decrease
      break;
    case 'No Event':
    default:
      baseDemand *= 1.0;
      break;
  }

  // Weather Factor
  if (weather === 'Rainy') {
    if (['Laksa', 'Mushroom Soup', 'Beef Rendang', 'Roti Canai', 'Tandoori Chicken'].includes(dish.name)) {
      baseDemand *= 1.12;
    } else if (['Cendol', 'Iced Lemon Tea'].includes(dish.name)) {
      baseDemand *= 0.86;
    }
  } else if (weather === 'Sunny') {
    if (['Cendol', 'Iced Lemon Tea', 'Teh Tarik'].includes(dish.name)) {
      baseDemand *= 1.10;
    }
  }

  // Meal Type Alignment
  if (mealType !== dish.common_meal_type) {
    if (mealType === 'Breakfast' && ['Kaya Toast Set', 'Roti Canai', 'Nasi Lemak', 'Teh Tarik'].includes(dish.name)) {
      baseDemand *= 1.22;
    } else if (mealType === 'Dinner' && ['Tandoori Chicken', 'Chicken Chop', 'Beef Rendang', 'Spaghetti Carbonara'].includes(dish.name)) {
      baseDemand *= 1.18;
    } else {
      baseDemand *= 0.88;
    }
  }

  // Price Elasticity
  const referencePrice = Math.max(dish.market_price || dish.avg_selling_price, 0.1);
  const priceRatio = sellingPrice / referencePrice;
  if (priceRatio > 1.05) {
    baseDemand *= Math.max(0.68, 1 - (priceRatio - 1) * 0.55);
  } else if (priceRatio < 0.95) {
    baseDemand *= Math.min(1.30, 1 + (1 - priceRatio) * 0.45);
  }

  const predicted_demand = Math.max(10, Math.round(baseDemand));
  const bufferMult = 1.0 + (safetyBufferPct / 100.0);
  const recommended_preparation = Math.ceil(predicted_demand * bufferMult);
  const safety_buffer_units = Math.max(0, recommended_preparation - predicted_demand);

  const unit_cost = dish.typical_cost;
  const estimated_cost = Number((recommended_preparation * unit_cost).toFixed(2));
  const estimated_revenue = Number((predicted_demand * sellingPrice).toFixed(2));
  const estimated_profit = Number((estimated_revenue - estimated_cost).toFixed(2));

  const ingredientsList = dish.ingredients && dish.ingredients.length > 0
    ? dish.ingredients
    : ['core protein / base', 'fresh vegetables', 'special spices', 'cooking oil & seasoning'];

  const numIngs = Math.max(ingredientsList.length, 1);
  const unitIngCost = Number((unit_cost / numIngs).toFixed(2));

  const ingredients = ingredientsList.map((ing) => ({
    ingredient: ing,
    units_needed: recommended_preparation,
    unit_cost_est: unitIngCost,
    total_ingredient_cost_est: Number((recommended_preparation * unitIngCost).toFixed(2)),
  }));

  return {
    menu_item_name: dish.name,
    predicted_demand,
    safety_buffer_pct: safetyBufferPct,
    safety_buffer_units,
    recommended_preparation,
    unit_ingredient_cost: unit_cost,
    selling_price: sellingPrice,
    estimated_cost,
    estimated_revenue_at_demand: estimated_revenue,
    estimated_profit_at_demand: estimated_profit,
    currency_symbol: currencySymbol,
    ingredients,
  };
}
