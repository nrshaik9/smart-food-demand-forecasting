# AI-Based Smart Food Demand Forecasting System

A complete, production-ready AI demand forecasting and kitchen preparation system built from scratch using real historical restaurant and canteen sales data (`restaurant_sales_data.csv`).

The system is specifically engineered for **College Canteens / Hostel Messes** and easily adaptable to **Restaurants, Cafeterias, Hotels, and Food Stalls** to prevent food surplus waste and stockouts.

---

## 1. System Highlights & Machine Learning Results

Four candidate machine learning models were trained from scratch using a strict **80/20 chronological time-series train/test split** (877 training records from 2024-01-01 to 2024-02-03, and 220 test records from 2024-02-03 to 2024-02-10) with no future data leakage.

### Benchmark Evaluation Table

| Model Architecture | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | R² Score | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline (Median Regressor)** | 179.30 | 235.55 | -0.0110 | Heuristic Baseline |
| **Linear Regression (Ridge)** | 98.71 | 127.64 | 0.7031 | Linear Benchmark |
| **Random Forest Regressor** | 85.60 | 114.41 | 0.7615 | Non-linear Ensemble |
| **HistGradientBoosting** | **78.97** | **105.78** | **0.7961** | **Selected Best Model** |

- **Best Model**: `HistGradientBoostingRegressor` achieved an **$R^2$ score of ~0.80**, reducing prediction error by over **56%** compared to the baseline median.
- **Artifact**: Serialized pipeline containing one-hot categorical transformers, numerical standard scalers, and trained estimators saved to `models/best_demand_model.pkl`.

---

## 2. Operational Calculations & Food Waste Logic

All forecasting and auditing calculations are grounded in real operational data:

1. **Recommended Preparation Formula**:
   $$\text{Recommended Preparation} = \left\lceil \text{Predicted Demand} \times (1 + \text{Safety Buffer}) \right\rceil$$
   *Where $\text{Safety Buffer}$ defaults to 10% (configurable 0%–30%).*

2. **Food Waste Calculation**:
   $$\text{Food Waste Units} = \max(0, \text{Quantity Prepared} - \text{Quantity Sold})$$

3. **Financial Loss Calculation**:
   $$\text{Financial Ingredient Loss} = \text{Food Waste Units} \times \text{Typical Unit Ingredient Cost}$$
   $$\text{Unrealized Potential Revenue} = \text{Food Waste Units} \times \text{Actual Selling Price}$$

4. **Ingredient Procurement Breakdown**:
   The system decomposes portion demand into exact required quantities for each raw constituent ingredient (e.g., rice, chicken, spices, vegetables) along with itemized cost budgets.

---

## 3. Project Architecture

```
├── dataset/
│   ├── original/
│   │   └── restaurant_sales_data.csv     # Real 1,097-row multi-outlet dataset
│   └── processed/
│       ├── cleaned_sales_data.csv        # Preprocessed & validated dataset
│       ├── engineered_features.csv       # Lag, rolling, & price elasticity features
│       └── analytics_summary.json        # Precomputed analytics for dashboard
├── src/
│   ├── data_preprocessing.py             # Data loader, cleaner, type caster
│   ├── feature_engineering.py            # Temporal, price, and causal lag features
│   ├── train_model.py                    # 4-model trainer, cross-validator & exporter
│   ├── predict.py                        # Single/batch inference & ingredient engine
│   └── export_data_json.py               # Summary generator
├── models/
│   ├── best_demand_model.pkl             # Trained pipeline artifact
│   ├── dish_metadata.json                # Ingredient tags & dish cost structures
│   └── model_metrics.json                # Model benchmark metrics & feature importances
├── dashboard/
│   └── app.py                            # Interactive Streamlit application
├── requirements.txt                      # Python dependencies
└── README.md                             # Documentation & user guide
```

---

## 4. How to Run the Project

### Prerequisites
Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Step 1: Preprocess Data
```bash
python3 src/data_preprocessing.py
```

### Step 2: Extract Features
```bash
python3 src/feature_engineering.py
```

### Step 3: Train Machine Learning Models
```bash
python3 src/train_model.py
```

### Step 4: Launch Streamlit Dashboard
```bash
streamlit run dashboard/app.py
```

The interactive dashboard will open at `http://localhost:8501` featuring:
1. **Overview**: Key performance indicators, system architecture, model benchmark.
2. **Demand Forecast**: Portion prediction, safety buffer control, ingredient procurement breakdown.
3. **Demand Trends**: Historical daily volume by meal period, weather, and outlet types.
4. **Food Waste Analytics**: Real operational food waste auditor and financial loss tracker.
5. **Dish Analytics**: Popularity rankings, profit margins, and price sensitivity.
6. **Model Insights**: MAE/RMSE/R² comparison chart, chronological test validation, and feature importances.
