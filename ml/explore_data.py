"""
Exploratory Data Analysis Script for BK Pulse Churn Dataset
Generates insights and visualizations about the dataset
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
from datetime import datetime

# Configuration
RAW_DATA_PATH = '../data/raw/bk_simulated_churn_dataset_with_segment_200k_FINAL.csv'
OUTPUT_DIR = '../data/processed/eda_results'


def clean_balance(value):
    """Clean balance values"""
    if pd.isna(value) or value == '':
        return 0
    if isinstance(value, str):
        value = value.replace(' ', '').replace(',', '')
        try:
            return float(value)
        except:
            return 0
    return float(value)


def load_data():
    """Load raw dataset"""
    print("Loading dataset...")
    df = pd.read_csv(RAW_DATA_PATH)
    print(f"Dataset shape: {df.shape}")
    return df


def basic_statistics(df):
    """Generate basic statistics"""
    print("\n" + "="*60)
    print("Basic Statistics")
    print("="*60)
    
    # Dataset info
    print(f"\nDataset Shape: {df.shape}")
    print(f"Total Records: {len(df):,}")
    print(f"Total Features: {len(df.columns)}")
    
    # Missing values
    print("\nMissing Values:")
    missing = df.isnull().sum()
    missing_pct = (missing / len(df)) * 100
    missing_df = pd.DataFrame({
        'Missing Count': missing,
        'Missing Percentage': missing_pct
    })
    missing_df = missing_df[missing_df['Missing Count'] > 0].sort_values('Missing Count', ascending=False)
    if len(missing_df) > 0:
        print(missing_df.to_string())
    else:
        print("No missing values found!")
    
    # Churn distribution
    print("\nChurn Distribution:")
    churn_counts = df['Churn_Flag'].value_counts()
    churn_pct = df['Churn_Flag'].value_counts(normalize=True) * 100
    print(f"Non-Churn (0): {churn_counts[0]:,} ({churn_pct[0]:.2f}%)")
    print(f"Churn (1): {churn_counts[1]:,} ({churn_pct[1]:.2f}%)")
    
    return {
        'shape': df.shape,
        'missing_values': missing.to_dict(),
        'churn_distribution': churn_counts.to_dict()
    }


def categorical_analysis(df):
    """Analyze categorical variables"""
    print("\n" + "="*60)
    print("Categorical Variables Analysis")
    print("="*60)
    
    categorical_cols = ['Customer_Segment', 'Gender', 'Nationality', 'Account_Type', 
                       'Branch', 'Currency', 'Account_Status']
    
    results = {}
    for col in categorical_cols:
        if col in df.columns:
            print(f"\n{col}:")
            value_counts = df[col].value_counts()
            print(value_counts.head(10).to_string())
            
            # Churn rate by category
            if 'Churn_Flag' in df.columns:
                churn_by_cat = df.groupby(col)['Churn_Flag'].agg(['count', 'mean'])
                churn_by_cat.columns = ['Count', 'Churn_Rate']
                churn_by_cat = churn_by_cat.sort_values('Churn_Rate', ascending=False)
                print(f"\nChurn Rate by {col}:")
                print(churn_by_cat.head(10).to_string())
                results[col] = churn_by_cat.to_dict()
    
    return results


def numerical_analysis(df):
    """Analyze numerical variables"""
    print("\n" + "="*60)
    print("Numerical Variables Analysis")
    print("="*60)
    
    # Clean balance for analysis
    df_temp = df.copy()
    df_temp['Balance'] = df_temp[' Balance '].apply(clean_balance)
    
    numerical_cols = ['Age', 'Tenure_Months', 'Num_Products', 'Balance',
                     'Transaction_Frequency', 'Mobile_Banking_Usage', 'Branch_Visits',
                     'Complaint_History', 'Account_Age_Months', 'Days_Since_Last_Transaction',
                     'Activity_Score', 'Churn_Probability']
    
    print("\nNumerical Variables Summary:")
    summary_stats = df_temp[numerical_cols].describe()
    print(summary_stats.to_string())
    
    # Correlation with churn
    print("\nCorrelation with Churn Flag:")
    correlations = df_temp[numerical_cols + ['Churn_Flag']].corr()['Churn_Flag'].sort_values(ascending=False)
    print(correlations.to_string())
    
    return {
        'summary_stats': summary_stats.to_dict(),
        'correlations': correlations.to_dict()
    }


def create_visualizations(df):
    """Create visualization plots"""
    print("\n" + "="*60)
    print("Creating Visualizations...")
    print("="*60)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Clean data for visualization
    df_temp = df.copy()
    df_temp['Balance'] = df_temp[' Balance '].apply(clean_balance)
    
    # Set style
    sns.set_style("whitegrid")
    plt.rcParams['figure.figsize'] = (12, 6)
    
    # 1. Churn Distribution
    plt.figure(figsize=(8, 6))
    churn_counts = df['Churn_Flag'].value_counts()
    plt.pie(churn_counts, labels=['Non-Churn', 'Churn'], autopct='%1.1f%%', startangle=90)
    plt.title('Churn Distribution')
    plt.savefig(f'{OUTPUT_DIR}/churn_distribution.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 2. Churn by Customer Segment
    plt.figure(figsize=(10, 6))
    segment_churn = df.groupby('Customer_Segment')['Churn_Flag'].agg(['count', 'mean'])
    segment_churn['mean'].plot(kind='bar')
    plt.title('Churn Rate by Customer Segment')
    plt.xlabel('Customer Segment')
    plt.ylabel('Churn Rate')
    plt.xticks(rotation=45)
    plt.savefig(f'{OUTPUT_DIR}/churn_by_segment.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 3. Balance Distribution
    plt.figure(figsize=(10, 6))
    df_temp['Balance'].hist(bins=50, edgecolor='black')
    plt.title('Balance Distribution')
    plt.xlabel('Balance')
    plt.ylabel('Frequency')
    plt.yscale('log')
    plt.savefig(f'{OUTPUT_DIR}/balance_distribution.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 4. Correlation Heatmap
    numerical_cols = ['Age', 'Tenure_Months', 'Num_Products', 'Balance',
                     'Transaction_Frequency', 'Activity_Score', 'Churn_Flag']
    plt.figure(figsize=(12, 10))
    corr_matrix = df_temp[numerical_cols].corr()
    sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='coolwarm', center=0)
    plt.title('Correlation Heatmap')
    plt.savefig(f'{OUTPUT_DIR}/correlation_heatmap.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 5. Age Distribution by Churn
    plt.figure(figsize=(10, 6))
    df_temp.boxplot(column='Age', by='Churn_Flag', ax=plt.gca())
    plt.title('Age Distribution by Churn Status')
    plt.suptitle('')
    plt.xlabel('Churn Flag')
    plt.ylabel('Age')
    plt.savefig(f'{OUTPUT_DIR}/age_by_churn.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"Visualizations saved to: {OUTPUT_DIR}")


def generate_report(stats, categorical, numerical):
    """Generate EDA report"""
    report_path = f'{OUTPUT_DIR}/eda_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    
    with open(report_path, 'w') as f:
        f.write("="*60 + "\n")
        f.write("BK Pulse - Exploratory Data Analysis Report\n")
        f.write("="*60 + "\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("Basic Statistics:\n")
        f.write(f"  Dataset Shape: {stats['shape']}\n")
        f.write(f"  Total Records: {stats['shape'][0]:,}\n")
        f.write(f"  Total Features: {stats['shape'][1]}\n\n")
        
        f.write("Churn Distribution:\n")
        for key, value in stats['churn_distribution'].items():
            f.write(f"  {key}: {value:,}\n")
        
        f.write("\n" + "="*60 + "\n")
        f.write("Report saved successfully.\n")
    
    print(f"\nEDA Report saved to: {report_path}")


def main():
    """Main EDA function"""
    print("="*60)
    print("BK Pulse - Exploratory Data Analysis")
    print("="*60)
    
    # Load data
    df = load_data()
    
    # Generate statistics
    stats = basic_statistics(df)
    
    # Categorical analysis
    categorical = categorical_analysis(df)
    
    # Numerical analysis
    numerical = numerical_analysis(df)
    
    # Create visualizations
    create_visualizations(df)
    
    # Generate report
    generate_report(stats, categorical, numerical)
    
    print("\n" + "="*60)
    print("EDA Complete!")
    print("="*60)


if __name__ == '__main__':
    main()

