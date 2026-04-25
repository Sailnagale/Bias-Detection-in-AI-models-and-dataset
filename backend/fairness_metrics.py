import pandas as pd
import numpy as np

def calculate_fairness(df: pd.DataFrame, target_col: str, sensitive_col: str):
    """
    Computes dataset-level fairness metrics. Since there is no model prediction, 
    we compute fairness based on the base rates of the target variable.
    """
    if target_col not in df.columns or sensitive_col not in df.columns:
        return {}

    # Ensure target is binary for simplicity
    target_values = df[target_col].unique()
    if len(target_values) != 2:
        return {"error": f"Target column '{target_col}' must be binary for fairness metrics compute."}
    
    # Assume 1 is positive outcome, or the more frequent is positive, or just take the max value (if numeric)
    # Convert to 1/0
    try:
        max_val = df[target_col].max()
        df_temp = df.copy()
        df_temp['target_binary'] = (df_temp[target_col] == max_val).astype(int)
    except:
        val1, val2 = data_values = df[target_col].dropna().unique()[:2]
        df_temp = df.copy()
        df_temp['target_binary'] = (df_temp[target_col] == val1).astype(int) # Just pick one as 1

    # Base rates per group
    group_rates = df_temp.groupby(sensitive_col)['target_binary'].mean().to_dict()
    
    # Demographic Parity Difference (Disparate Impact)
    rates = list(group_rates.values())
    demographic_parity_diff = max(rates) - min(rates) if rates else 0
    disparate_impact_ratio = min(rates) / max(rates) if rates and max(rates) > 0 else 0
    
    # Calculate a mock score (100 - DP_diff)
    score = max(0, 100 - (demographic_parity_diff * 100))
    
    risk_level = "Low"
    if score < 80:
        risk_level = "High"
    elif score < 95:
        risk_level = "Medium"

    return {
        "score": round(score, 1),
        "risk_level": risk_level,
        "demographic_parity_diff": round(demographic_parity_diff, 3),
        "disparate_impact_ratio": round(disparate_impact_ratio, 3),
        "group_rates": {str(k): round(v, 3) for k, v in group_rates.items()}
    }
