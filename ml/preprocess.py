"""
Data Preprocessing Script for BK Pulse Churn Prediction
Preprocesses raw dataset for model training
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os
from datetime import datetime

# Configuration
# Using the fixed dataset that follows BK business rules
# Path is relative to the script location (ml/ directory)
RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw', 'bk_simulated_churn_dataset_with_segment_200k_FINAL.csv')
# Paths relative to script location
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DATA_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'processed_data.csv')
SCALER_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'scaler.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'encoders.pkl')


def clean_balance(value):
    """Clean balance values that have commas and spaces"""
    if pd.isna(value) or value == '':
        return 0
    if isinstance(value, str):
        # Remove spaces and commas
        value = value.replace(' ', '').replace(',', '')
        try:
            return float(value)
        except:
            return 0
    return float(value)


def clean_transaction_value(value):
    """Clean average transaction value"""
    if pd.isna(value) or value == '':
        return 0
    if isinstance(value, str):
        value = value.replace(' ', '').replace(',', '')
        try:
            return float(value)
        except:
            return 0
    return float(value)


def parse_date(date_str):
    """Parse date string to datetime"""
    if pd.isna(date_str):
        return None
    try:
        # Try different date formats
        for fmt in ['%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d', '%d-%m-%Y']:
            try:
                return pd.to_datetime(date_str, format=fmt)
            except:
                continue
        return pd.to_datetime(date_str)
    except:
        return None


def preprocess_data():
    """Main preprocessing function"""
    print("Loading raw data...")
    df = pd.read_csv(RAW_DATA_PATH)
    print(f"Loaded {len(df)} records")
    
    # Create a copy for processing
    df_processed = df.copy()
    
    # Clean Balance column (handle both formats: with/without spaces)
    print("Cleaning balance values...")
    balance_col = ' Balance ' if ' Balance ' in df_processed.columns else 'Balance'
    if balance_col != 'Balance':
        df_processed['Balance'] = df_processed[balance_col].apply(clean_balance)
        df_processed = df_processed.drop(columns=[balance_col])
    else:
        df_processed['Balance'] = df_processed['Balance'].apply(clean_balance)
    
    # Clean Average Transaction Value (handle both formats: with/without spaces)
    print("Cleaning transaction values...")
    trans_val_col = ' Average_Transaction_Value ' if ' Average_Transaction_Value ' in df_processed.columns else 'Average_Transaction_Value'
    if trans_val_col != 'Average_Transaction_Value':
        df_processed['Average_Transaction_Value'] = df_processed[trans_val_col].apply(clean_transaction_value)
        df_processed = df_processed.drop(columns=[trans_val_col])
    else:
        df_processed['Average_Transaction_Value'] = df_processed['Average_Transaction_Value'].apply(clean_transaction_value)
    
    # Parse dates
    print("Parsing dates...")
    df_processed['Account_Open_Date'] = df_processed['Account_Open_Date'].apply(parse_date)
    df_processed['Last_Transaction_Date'] = df_processed['Last_Transaction_Date'].apply(parse_date)
    
    # Extract features from dates
    if df_processed['Account_Open_Date'].notna().any():
        df_processed['Account_Open_Month'] = df_processed['Account_Open_Date'].dt.month
        df_processed['Account_Open_Year'] = df_processed['Account_Open_Date'].dt.year
    else:
        df_processed['Account_Open_Month'] = 0
        df_processed['Account_Open_Year'] = 0
    
    if df_processed['Last_Transaction_Date'].notna().any():
        df_processed['Last_Transaction_Month'] = df_processed['Last_Transaction_Date'].dt.month
        df_processed['Last_Transaction_Year'] = df_processed['Last_Transaction_Date'].dt.year
    else:
        df_processed['Last_Transaction_Month'] = 0
        df_processed['Last_Transaction_Year'] = 0
    
    # Handle missing values in Days_Since_Last_Transaction
    if df_processed['Days_Since_Last_Transaction'].isna().any():
        df_processed['Days_Since_Last_Transaction'] = df_processed['Days_Since_Last_Transaction'].fillna(
            df_processed['Days_Since_Last_Transaction'].median()
        )
    
    # Encode categorical variables
    print("Encoding categorical variables...")
    categorical_cols = ['Customer_Segment', 'Gender', 'Nationality', 'Account_Type', 
                       'Branch', 'Currency', 'Account_Status']
    
    encoders = {}
    for col in categorical_cols:
        if col in df_processed.columns:
            le = LabelEncoder()
            df_processed[col + '_encoded'] = le.fit_transform(df_processed[col].astype(str))
            encoders[col] = le
    
    # Select features for modeling (excluding ID, dates, and target-related columns)
    # NOTE: Removed 'Account_Status_encoded' as it's derived from 'Days_Since_Last_Transaction'
    # and creates data leakage (we set account_status based on days_since_last_transaction)
    feature_cols = [
        'Customer_Segment_encoded', 'Gender_encoded', 'Age', 'Nationality_encoded',
        'Account_Type_encoded', 'Branch_encoded', 'Currency_encoded',
        'Balance', 'Tenure_Months', 'Num_Products', 'Has_Credit_Card',
        # 'Account_Status_encoded',  # REMOVED: Data leakage - derived from Days_Since_Last_Transaction
        'Transaction_Frequency', 'Average_Transaction_Value',
        'Mobile_Banking_Usage', 'Branch_Visits', 'Complaint_History',
        'Account_Age_Months', 'Days_Since_Last_Transaction', 'Activity_Score',
        'Account_Open_Month', 'Account_Open_Year', 'Last_Transaction_Month', 'Last_Transaction_Year'
    ]
    
    # Prepare features and target
    X = df_processed[feature_cols].copy()
    y = df_processed['Churn_Flag'].copy()
    
    # Handle missing values
    print("Handling missing values...")
    X = X.fillna(X.median())
    
    # Remove Churn_Probability from features if accidentally included (it's a leak)
    if 'Churn_Probability' in X.columns:
        X = X.drop(columns=['Churn_Probability'])
    
    # Save encoders
    print("Saving encoders...")
    os.makedirs(os.path.dirname(ENCODER_PATH), exist_ok=True)
    joblib.dump(encoders, ENCODER_PATH)
    
    # Split data
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train),
        columns=X_train.columns,
        index=X_train.index
    )
    X_test_scaled = pd.DataFrame(
        scaler.transform(X_test),
        columns=X_test.columns,
        index=X_test.index
    )
    
    # Save scaler
    os.makedirs(os.path.dirname(SCALER_PATH), exist_ok=True)
    joblib.dump(scaler, SCALER_PATH)
    
    # Save processed data
    print("Saving processed data...")
    os.makedirs(os.path.dirname(PROCESSED_DATA_PATH), exist_ok=True)
    
    # Save train/test sets
    processed_dir = os.path.dirname(PROCESSED_DATA_PATH)
    # Ensure directory exists
    os.makedirs(processed_dir, exist_ok=True)
    # Use absolute paths and normalize
    train_path = os.path.normpath(os.path.join(processed_dir, 'X_train.csv'))
    test_path = os.path.normpath(os.path.join(processed_dir, 'X_test.csv'))
    y_train_path = os.path.normpath(os.path.join(processed_dir, 'y_train.csv'))
    y_test_path = os.path.normpath(os.path.join(processed_dir, 'y_test.csv'))
    
    X_train_scaled.to_csv(train_path, index=False)
    X_test_scaled.to_csv(test_path, index=False)
    # Save y as DataFrame with column name for easier loading
    y_train.to_frame('Churn_Flag').to_csv(y_train_path, index=False)
    y_test.to_frame('Churn_Flag').to_csv(y_test_path, index=False)
    
    # Also save combined processed dataset
    df_processed['Churn_Flag'] = y
    df_processed.to_csv(PROCESSED_DATA_PATH, index=False)
    
    print(f"\nPreprocessing complete!")
    print(f"Training set: {len(X_train_scaled)} samples")
    print(f"Test set: {len(X_test_scaled)} samples")
    print(f"Features: {len(feature_cols)}")
    print(f"Churn rate in training: {y_train.mean():.2%}")
    print(f"Churn rate in test: {y_test.mean():.2%}")
    
    return X_train_scaled, X_test_scaled, y_train, y_test


if __name__ == '__main__':
    preprocess_data()

