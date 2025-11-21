"""
Clean Dataset Script
Prepares dataset for model training by removing non-feature columns.
"""

import pandas as pd
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_DATA_PATH = BASE_DIR / 'data' / 'raw' / 'bk_pulse_customer_dataset.csv'
CLEAN_DATA_PATH = RAW_DATA_PATH
BACKUP_PATH = BASE_DIR / 'data' / 'raw' / 'bk_pulse_customer_dataset_backup.csv'

# Feature columns that should be kept (all others will be removed)
FEATURE_COLUMNS = [
    'Customer_ID', 'Customer_Segment', 'Gender', 'Age', 'Nationality',
    'Account_Type', 'Branch', 'Currency', 'Balance', 'Tenure_Months',
    'Num_Products', 'Has_Credit_Card', 'Account_Status', 'Account_Open_Date',
    'Last_Transaction_Date', 'Transaction_Frequency', 'Average_Transaction_Value',
    'Mobile_Banking_Usage', 'Branch_Visits', 'Complaint_History',
    'Account_Age_Months', 'Days_Since_Last_Transaction',
    'Churn_Flag'
]

def clean_dataset():
    """Clean dataset by keeping only feature columns"""
    print("="*60)
    print("Dataset Cleaning")
    print("="*60)
    
    if not RAW_DATA_PATH.exists():
        print(f"❌ Error: Raw dataset not found at {RAW_DATA_PATH}")
        return False
    
    print(f"\n📖 Loading dataset from: {RAW_DATA_PATH}")
    df = pd.read_csv(RAW_DATA_PATH)
    print(f"✅ Loaded {len(df):,} records")
    print(f"   Original columns: {len(df.columns)}")
    
    # Keep only feature columns
    columns_to_keep = [col for col in FEATURE_COLUMNS if col in df.columns]
    columns_to_remove = [col for col in df.columns if col not in columns_to_keep]
    
    if not columns_to_remove:
        print("\n✅ Dataset already clean")
        return True
    
    print(f"\n📊 Columns in dataset: {len(df.columns)}")
    
    print(f"\n💾 Creating backup...")
    import shutil
    shutil.copy2(RAW_DATA_PATH, BACKUP_PATH)
    print(f"✅ Backup created: {BACKUP_PATH}")
    
    print(f"\n🗑️  Removing non-feature columns...")
    df_clean = df[columns_to_keep]
    print(f"✅ Removed {len(columns_to_remove)} column(s)")
    print(f"   New column count: {len(df_clean.columns)}")
    
    if 'Churn_Flag' not in df_clean.columns:
        print("❌ Error: Churn_Flag column missing after cleaning!")
        return False
    
    print(f"\n💾 Saving cleaned dataset...")
    df_clean.to_csv(CLEAN_DATA_PATH, index=False)
    print(f"✅ Cleaned dataset saved: {CLEAN_DATA_PATH}")
    
    print(f"\n" + "="*60)
    print("Cleaning Summary")
    print("="*60)
    print(f"Original dataset: {RAW_DATA_PATH}")
    print(f"  - Records: {len(df):,}")
    print(f"  - Columns: {len(df.columns)}")
    print(f"\nCleaned dataset: {CLEAN_DATA_PATH}")
    print(f"  - Records: {len(df_clean):,}")
    print(f"  - Columns: {len(df_clean.columns)}")
    print(f"\nBackup: {BACKUP_PATH}")
    print(f"\n✅ Dataset cleaning complete!")
    print(f"\n📝 Next steps:")
    print(f"   1. Update preprocess.py to use cleaned dataset")
    print(f"   2. Run: python ml/preprocess.py")
    print(f"   3. Run: python ml/train_model.py")
    
    return True

if __name__ == '__main__':
    success = clean_dataset()
    if not success:
        exit(1)

