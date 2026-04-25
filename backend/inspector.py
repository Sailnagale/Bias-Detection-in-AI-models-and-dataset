import pandas as pd
import numpy as np

def inspect_dataset(df: pd.DataFrame):
    """
    Returns high-level statistics about the dataset.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    
    missing_values = df.isnull().sum().to_dict()
    missing_percent = (df.isnull().sum() / total_rows * 100).round(2).to_dict()
    
    feature_types = df.dtypes.astype(str).to_dict()
    
    # Class distribution (assuming categorical or low-unique-value columns)
    categorical_dist = {}
    for col in df.columns:
        if df[col].nunique() < 20: 
            categorical_dist[col] = df[col].value_counts().to_dict()
            
    return {
        "total_rows": total_rows,
        "total_cols": total_cols,
        "missing_values": missing_values,
        "missing_percent": missing_percent,
        "feature_types": feature_types,
        "categorical_dist": categorical_dist
    }

def get_correlation_matrix(df: pd.DataFrame):
    """
    Returns Pearson correlation matrix for numeric columns.
    """
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return {}
    
    corr = numeric_df.corr().round(3)
    return corr.to_dict()
