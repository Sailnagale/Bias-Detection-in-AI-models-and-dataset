import pandas as pd
import numpy as np

def detect_biases(df: pd.DataFrame, target_col: str = None, sensitive_col: str = None):
    """
    Detects potential biases based on heuristics.
    """
    biases = []
    
    # 1. Class Imbalance
    if target_col and target_col in df.columns:
        dist = df[target_col].value_counts(normalize=True)
        min_class_ratio = dist.min()
        if min_class_ratio < 0.2:
            biases.append({
                "type": "Class Imbalance",
                "severity": "High" if min_class_ratio < 0.1 else "Medium",
                "explanation": f"Target column '{target_col}' is imbalanced. Least represented class has {min_class_ratio*100:.1f}% share."
            })
            
    # 2. Sampling Bias (Missing Values)
    missing_percent = df.isnull().sum() / len(df)
    high_missing_cols = missing_percent[missing_percent > 0.1].index.tolist()
    if high_missing_cols:
         biases.append({
                "type": "Sampling Bias",
                "severity": "High" if len(high_missing_cols) > len(df.columns) * 0.3 else "Medium",
                "explanation": f"High rate of missing values found in columns: {', '.join(high_missing_cols)}."
         })
            
    # 3. Proxy Bias (Correlation with sensitive attribute)
    if sensitive_col and sensitive_col in df.columns:
        # Convert sensitive to numeric for correlation mapping if binary categorical
        temp_df = df.copy()
        if temp_df[sensitive_col].dtype == 'object':
            temp_df[sensitive_col] = temp_df[sensitive_col].astype('category').cat.codes
            
        numeric_cols = temp_df.select_dtypes(include=[np.number]).columns
        if sensitive_col in numeric_cols:
            corr = temp_df[numeric_cols].corr()
            sensitive_corr = corr[sensitive_col].abs().sort_values(ascending=False)
            proxies = sensitive_corr[(sensitive_corr > 0.5) & (sensitive_corr < 1.0)].index.tolist()
            if proxies:
                biases.append({
                    "type": "Proxy Bias",
                    "severity": "Medium",
                    "explanation": f"Features highly correlated with sensitive attribute '{sensitive_col}' detected: {', '.join(proxies)}."
                })
                
    # 4. Outlier detection indicating potential measurement bias
    numeric_df = df.select_dtypes(include=[np.number])
    outliers = {}
    for col in numeric_df.columns:
        mean, std = numeric_df[col].mean(), numeric_df[col].std()
        outlier_count = ((numeric_df[col] < mean - 3*std) | (numeric_df[col] > mean + 3*std)).sum()
        if outlier_count > len(df) * 0.05: # more than 5% outliers
            outliers[col] = outlier_count
            
    if outliers:
         biases.append({
                "type": "Measurement Bias",
                "severity": "Low",
                "explanation": f"Large number of outliers detected in: {', '.join(outliers.keys())}."
         })

    return biases
