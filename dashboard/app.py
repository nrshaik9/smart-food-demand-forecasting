"""
Streamlit Web Dashboard for AI-Based Smart Food Demand Forecasting System
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# Add root directory to sys.path for modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.predict import predict_demand, load_artifacts

# Page Configuration
st.set_page_config(
    page_title="AI Smart Food Demand Forecasting",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-title { font-size: 2.2rem; font-weight: 700; color: #1e293b; margin-bottom: 0.2rem; }
    .subtitle { color: #64748b; font-size: 1.05rem; margin-bottom: 1.5rem; }
    .metric-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.2rem; }
    .kpi-val { font-size: 1.8rem; font-weight: bold; color: #0f172a; }
    .kpi-lbl { font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
</style>
""", unsafe_allow_html=True)

# Load data helper
@st.cache_data
def get_data():
    df = pd.read_csv("dataset/processed/cleaned_sales_data.csv")
    df['date'] = pd.to_datetime(df['date'])
    with open("models/model_metrics.json", "r") as f:
        metrics = json.load(f)
    with open("models/dish_metadata.json", "r") as f:
        dish_meta = json.load(f)
    return df, metrics, dish_meta

try:
    df, metrics, dish_meta = get_data()
except Exception as e:
    st.error(f"Error loading data: {e}. Make sure you ran data_preprocessing.py, feature_engineering.py, and train_model.py first.")
    st.stop()

# Sidebar Navigation
st.sidebar.title("🍽️ Smart Food AI")
st.sidebar.caption("Demand Forecasting & Waste Reduction")

section = st.sidebar.radio(
    "Navigation",
    [
        "1. Overview",
        "2. Demand Forecast",
        "3. Demand Trends",
        "4. Food Waste Analytics",
        "5. Dish Analytics",
        "6. Model Insights"
    ]
)

st.sidebar.markdown("---")
st.sidebar.info("""
**Target Environment:**
- College Canteen / Hostel Mess
- Restaurants & Cafeterias
- Food Stalls & Food Courts
""")

# ==========================================
# 1. OVERVIEW
# ==========================================
if section == "1. Overview":
    st.markdown('<div class="main-title">AI-Based Smart Food Demand Forecasting System</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Operational demand forecasting & food waste reduction platform powered by trained machine learning.</div>', unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Sales Records", f"{len(df):,}")
    with col2:
        st.metric("Menu Items Modeled", f"{len(dish_meta)}")
    with col3:
        st.metric("Total Quantity Sold", f"{int(df['quantity_sold'].sum()):,} units")
    with col4:
        best_r2 = metrics['metrics_report'][metrics['best_model_name']]['R2']
        st.metric("Best Model R² Score", f"{best_r2:.4f}")

    st.markdown("---")
    
    st.subheader("System Architecture & Operational Pipeline")
    col_a, col_b = st.columns([1.5, 1])
    with col_a:
        st.markdown("""
        This platform forecasts meal demand to optimize kitchen preparation and eliminate surplus food waste:
        
        1. **Data Ingestion & Cleaning**: Ingests actual multi-outlet sales history with dish ingredients, weather conditions, price elasticity, and promotional tags.
        2. **Causal Feature Engineering**: Extracts temporal indicators and rolling consumption signals strictly on historical observations (`shift(1)`) to avoid lookahead leakage.
        3. **Machine Learning Core**: Evaluates 4 candidate estimators (`DummyRegressor Baseline`, `Ridge Linear Regression`, `Random Forest`, and `HistGradientBoosting`) across a chronological 80/20 train-test split.
        4. **Production Planning**: Automatically computes the **Recommended Preparation** formula:
        """)
        st.latex(r"\text{Recommended Preparation} = \lceil \text{Predicted Demand} \times (1 + \text{Safety Buffer}) \rceil")
        st.markdown("""
        5. **Ingredient Procurement**: Translates portions directly into constituent ingredient counts for purchasing teams.
        """)
    with col_b:
        st.subheader("Key Model Benchmark")
        m_df = pd.DataFrame(metrics['metrics_report']).T.reset_index()
        m_df.columns = ["Model", "MAE", "RMSE", "R² Score"]
        st.dataframe(m_df, hide_index=True, use_container_width=True)
        st.success(f"Selected Production Model: **{metrics['best_model_name']}**")

# ==========================================
# 2. DEMAND FORECAST
# ==========================================
elif section == "2. Demand Forecast":
    st.markdown('<div class="main-title">Real-Time Demand Forecast & Prep Planner</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Generate accurate portion demand and calculate raw ingredient procurement with safety buffers.</div>', unsafe_allow_html=True)

    c1, c2, c3 = st.columns(3)
    with c1:
        dish_selected = st.selectbox("Select Menu Item", options=sorted(list(dish_meta.keys())))
        dish_info = dish_meta[dish_selected]
        rest_type = st.selectbox("Establishment / Facility Type", options=metrics['restaurant_types'], index=0)
        meal_type = st.selectbox("Meal Period", options=metrics['meal_types'], index=metrics['meal_types'].index(dish_info['common_meal_type']) if dish_info['common_meal_type'] in metrics['meal_types'] else 0)
    with c2:
        weather = st.selectbox("Forecasted Weather", options=metrics['weather_conditions'], index=0)
        forecast_date = st.date_input("Target Service Date", pd.to_datetime("2024-02-15"))
        selling_price = st.number_input("Selling Price ($)", value=float(dish_info['avg_selling_price']), step=0.5)
    with c3:
        safety_buffer = st.slider("Kitchen Safety Buffer (%)", min_value=0, max_value=30, value=10, step=1,
                                 help="Extra margin prepared to guard against sudden stockouts without generating excessive waste.")
        has_promo = st.checkbox("Promotion Active (Discount / Coupon)", value=False)
        special_event = st.checkbox("Special Event / Exam Day / Festival", value=False)

    if st.button("Generate Forecast & Kitchen Sheet", type="primary"):
        with st.spinner("Executing model pipeline..."):
            pred_res = predict_demand(
                menu_item_name=dish_selected,
                restaurant_type=rest_type,
                meal_type=meal_type,
                weather_condition=weather,
                has_promotion=has_promo,
                special_event=special_event,
                actual_selling_price=selling_price,
                safety_buffer_pct=safety_buffer,
                forecast_date_str=forecast_date.strftime('%Y-%m-%d')
            )

        st.markdown("---")
        st.subheader("Forecast Results")
        
        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.metric("Predicted Demand", f"{pred_res['predicted_demand']} portions")
        with m2:
            st.metric("Safety Buffer (+)", f"{pred_res['safety_buffer_units']} portions ({safety_buffer}%)")
        with m3:
            st.metric("Recommended Preparation", f"{pred_res['recommended_preparation']} portions")
        with m4:
            st.metric("Est. Expected Profit", f"${pred_res['estimated_profit_at_demand']:,.2f}")

        # Ingredients Table
        st.subheader(f"Procurement Sheet for {pred_res['recommended_preparation']} Portions of {dish_selected}")
        ing_df = pd.DataFrame(pred_res['ingredients'])
        ing_df.columns = ["Constituent Ingredient", "Portion Units Needed", "Est. Unit Cost ($)", "Subtotal Cost ($)"]
        st.dataframe(ing_df, hide_index=True, use_container_width=True)

        st.caption(f"Estimated Total Raw Ingredient Cost: **${pred_res['estimated_cost']:,.2f}** | Anticipated Revenue: **${pred_res['estimated_revenue_at_demand']:,.2f}**")

# ==========================================
# 3. DEMAND TRENDS
# ==========================================
elif section == "3. Demand Trends":
    st.markdown('<div class="main-title">Historical Demand Trends & Patterns</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Explore empirical sales trajectories across dates, meal services, and facility types.</div>', unsafe_allow_html=True)

    filter_dish = st.multiselect("Filter by Dishes (leave blank for all)", options=sorted(df['menu_item_name'].unique()))
    
    plot_df = df.copy()
    if filter_dish:
        plot_df = plot_df[plot_df['menu_item_name'].isin(filter_dish)]

    daily_chart = plot_df.groupby(['date', 'meal_type'])['quantity_sold'].sum().reset_index()
    fig_time = px.line(daily_chart, x='date', y='quantity_sold', color='meal_type',
                       title="Daily Portions Sold by Meal Type Over Time",
                       labels={'quantity_sold': 'Units Sold', 'date': 'Date', 'meal_type': 'Meal Period'})
    st.plotly_chart(fig_time, use_container_width=True)

    c1, c2 = st.columns(2)
    with c1:
        rest_vol = plot_df.groupby('restaurant_type')['quantity_sold'].sum().reset_index()
        fig_rest = px.bar(rest_vol, x='restaurant_type', y='quantity_sold', color='restaurant_type',
                          title="Demand Distribution by Facility Type",
                          labels={'quantity_sold': 'Units Sold', 'restaurant_type': 'Facility Type'})
        st.plotly_chart(fig_rest, use_container_width=True)
    with c2:
        weather_vol = plot_df.groupby('weather_condition')['quantity_sold'].mean().reset_index()
        fig_w = px.bar(weather_vol, x='weather_condition', y='quantity_sold', color='weather_condition',
                       title="Average Sales Volume by Weather Condition",
                       labels={'quantity_sold': 'Avg Units Sold', 'weather_condition': 'Weather'})
        st.plotly_chart(fig_w, use_container_width=True)

# ==========================================
# 4. FOOD WASTE ANALYTICS
# ==========================================
elif section == "4. Food Waste Analytics":
    st.markdown('<div class="main-title">Food Waste Auditing & Financial Loss Calculator</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Audit food waste strictly from actual logged sales and kitchen preparation logs.</div>', unsafe_allow_html=True)

    st.markdown("""
    **Governing Waste Formulas:**
    - $\\text{Food Waste Units} = \\max(0, \\text{Quantity Prepared} - \\text{Quantity Sold})$
    - $\\text{Food Waste Percentage} = \\frac{\\text{Food Waste Units}}{\\text{Quantity Prepared}} \\times 100$
    - $\\text{Financial Cost of Waste} = \\text{Food Waste Units} \\times \\text{Typical Unit Ingredient Cost}$
    - $\\text{Potential Lost Revenue} = \\text{Food Waste Units} \\times \\text{Actual Selling Price}$
    """)

    st.subheader("Audit a Service Period / Log Kitchen Preparation")
    
    col1, col2 = st.columns(2)
    with col1:
        selected_dish = st.selectbox("Dish to Audit", options=sorted(list(dish_meta.keys())))
        dish_info = dish_meta[selected_dish]
        actual_sold = st.number_input("Actual Quantity Sold (from register/dataset)", min_value=0, value=int(dish_info['avg_quantity_sold']), step=5)
    with col2:
        qty_prepared = st.number_input("Actual Quantity Prepared by Kitchen", min_value=0, value=int(np.ceil(dish_info['avg_quantity_sold'] * 1.15)), step=5)
        unit_cost = float(dish_info['typical_cost'])
        unit_price = float(dish_info['avg_selling_price'])

    waste_units = max(0, qty_prepared - actual_sold)
    waste_pct = (waste_units / qty_prepared * 100) if qty_prepared > 0 else 0.0
    direct_loss = waste_units * unit_cost
    lost_revenue = waste_units * unit_price

    st.markdown("---")
    res1, res2, res3, res4 = st.columns(4)
    with res1:
        st.metric("Surplus / Wasted Units", f"{waste_units} units")
    with res2:
        st.metric("Waste Percentage", f"{waste_pct:.1f}%")
    with res3:
        st.metric("Direct Ingredient Loss", f"${direct_loss:,.2f}")
    with res4:
        st.metric("Unrealized Revenue Value", f"${lost_revenue:,.2f}")

    if waste_units > 0:
        st.warning(f"Preparing {qty_prepared} portions against {actual_sold} sold resulted in {waste_units} unsold portions (${direct_loss:,.2f} ingredient loss). Utilizing our AI model with a 10% safety buffer would have reduced this surplus significantly.")
    else:
        st.success("Zero food waste recorded! Kitchen preparation matched or was below consumer demand.")

# ==========================================
# 5. DISH ANALYTICS
# ==========================================
elif section == "5. Dish Analytics":
    st.markdown('<div class="main-title">Dish Performance & Profitability Analytics</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Examine popularity rankings, ingredient costs, and contribution margins.</div>', unsafe_allow_html=True)

    dish_df = df.groupby('menu_item_name').agg(
        Total_Volume=('quantity_sold', 'sum'),
        Average_Demand=('quantity_sold', 'mean'),
        Avg_Selling_Price=('actual_selling_price', 'mean'),
        Unit_Ingredient_Cost=('typical_ingredient_cost', 'mean')
    ).reset_index()

    dish_df['Unit_Margin'] = dish_df['Avg_Selling_Price'] - dish_df['Unit_Ingredient_Cost']
    dish_df['Margin_Percent'] = (dish_df['Unit_Margin'] / dish_df['Avg_Selling_Price']) * 100
    dish_df = dish_df.sort_values(by='Total_Volume', ascending=False)

    col1, col2 = st.columns(2)
    with col1:
        fig_vol = px.bar(dish_df, x='Total_Volume', y='menu_item_name', orientation='h',
                         title="Rank of Dishes by Total Volume Sold",
                         color='Total_Volume', color_continuous_scale='Teal')
        st.plotly_chart(fig_vol, use_container_width=True)
    with col2:
        fig_margin = px.scatter(dish_df, x='Avg_Selling_Price', y='Unit_Margin', size='Total_Volume',
                                hover_name='menu_item_name', color='Margin_Percent',
                                title="Dish Pricing vs. Profit Contribution",
                                labels={'Avg_Selling_Price': 'Selling Price ($)', 'Unit_Margin': 'Unit Profit Margin ($)'})
        st.plotly_chart(fig_margin, use_container_width=True)

    st.subheader("Dish Performance Table")
    st.dataframe(dish_df.round(2), hide_index=True, use_container_width=True)

# ==========================================
# 6. MODEL INSIGHTS
# ==========================================
elif section == "6. Model Insights":
    st.markdown('<div class="main-title">Machine Learning Model Insights & Validation</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Complete transparent evaluation across 4 candidate models with chronological holdout testing.</div>', unsafe_allow_html=True)

    st.subheader("Chronological Holdout Evaluation Table")
    st.markdown(f"""
    - **Training Set**: {metrics['train_samples']} samples ({metrics['train_dates'][0]} to {metrics['train_dates'][1]})
    - **Evaluation Test Set**: {metrics['test_samples']} samples ({metrics['test_dates'][0]} to {metrics['test_dates'][1]})
    - **Split Strategy**: Chronological 80/20 partition preserving temporal order (no data leakage).
    """)

    m_df = pd.DataFrame(metrics['metrics_report']).T.reset_index()
    m_df.columns = ["Model Architecture", "Mean Absolute Error (MAE)", "Root Mean Squared Error (RMSE)", "R² Score"]
    st.dataframe(m_df, hide_index=True, use_container_width=True)

    col1, col2 = st.columns(2)
    with col1:
        fig_comp = px.bar(m_df, x='Model Architecture', y='Mean Absolute Error (MAE)',
                          color='Model Architecture', title="Model Accuracy Comparison (Lower MAE is better)")
        st.plotly_chart(fig_comp, use_container_width=True)
    with col2:
        fi_df = pd.DataFrame(metrics['feature_importances']).head(10)
        fig_fi = px.bar(fi_df, x='importance', y='feature', orientation='h',
                        title="Top 10 Feature Importances",
                        labels={'importance': 'Relative Importance', 'feature': 'Feature Name'})
        st.plotly_chart(fig_fi, use_container_width=True)
