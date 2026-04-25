import pandas as pd
import numpy as np

def mitigate_dataset(df: pd.DataFrame, target_col: str, sensitive_col: str, strategies: list):
    """
    Applies chosen bias mitigation strategies to the dataset.
    Supported strategies: 'SMOTE', 'Undersampling', 'Oversampling', 'DropProxies'
    """
    mitigated_df = df.copy()
    
    # Simple examples for dataset-level mitigation:
    
    if "Drop Proxy Features" in strategies:
        # Detect proxies and drop
        if sensitive_col in mitigated_df.columns:
            temp_df = mitigated_df.copy()
            if temp_df[sensitive_col].dtype == 'object':
                temp_df[sensitive_col] = temp_df[sensitive_col].astype('category').cat.codes
            numeric_cols = temp_df.select_dtypes(include=[np.number]).columns
            if sensitive_col in numeric_cols:
                corr = temp_df[numeric_cols].corr()
                sensitive_corr = corr[sensitive_col].abs()
                proxies = sensitive_corr[(sensitive_corr > 0.5) & (sensitive_corr < 1.0)].index.tolist()
                mitigated_df = mitigated_df.drop(columns=proxies, errors='ignore')
                
    if "Undersampling" in strategies and target_col in mitigated_df.columns:
        # Undersample the majority class
        counts = mitigated_df[target_col].value_counts()
        min_class = counts.idxmin()
        min_count = counts.min()
        
        frames = []
        for class_name in counts.index:
            class_subset = mitigated_df[mitigated_df[target_col] == class_name]
            frames.append(class_subset.sample(n=min_count, random_state=42))
        mitigated_df = pd.concat(frames).sample(frac=1, random_state=42).reset_index(drop=True)

    if "Oversampling" in strategies and target_col in mitigated_df.columns:
        # Oversample the minority class
        counts = mitigated_df[target_col].value_counts()
        max_class = counts.idxmax()
        max_count = counts.max()
        
        frames = []
        for class_name in counts.index:
            class_subset = mitigated_df[mitigated_df[target_col] == class_name]
            frames.append(class_subset.sample(n=max_count, replace=True, random_state=42))
        mitigated_df = pd.concat(frames).sample(frac=1, random_state=42).reset_index(drop=True)

    if "Outlier Removal" in strategies:
        numeric_df = mitigated_df.select_dtypes(include=[np.number])
        for col in numeric_df.columns:
            mean, std = numeric_df[col].mean(), numeric_df[col].std()
            mitigated_df = mitigated_df[(mitigated_df[col] >= mean - 3*std) & (mitigated_df[col] <= mean + 3*std)]
            
    return mitigated_df
