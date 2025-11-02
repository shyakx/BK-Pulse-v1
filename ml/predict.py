"""
Prediction Script for BK Pulse Churn Prediction
Can be called from command line or imported as a module
"""

import sys
import json
import pandas as pd
import joblib
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / '../data/models/gradient_boosting_best.pkl'
SCALER_PATH = BASE_DIR / '../data/processed/scaler.pkl'
ENCODER_PATH = BASE_DIR / '../data/processed/encoders.pkl'


def load_artifacts():
    """Load model, scaler, and encoders"""
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        encoders = joblib.load(ENCODER_PATH)
        return model, scaler, encoders
    except FileNotFoundError as e:
        raise FileNotFoundError(f"Model artifacts not found: {e}. Please run training first.")


def clean_balance(value):
    """Clean balance values"""
    if pd.isna(value) or value == '' or value is None:
        return 0.0
    if isinstance(value, str):
        value = str(value).replace(' ', '').replace(',', '').replace('RWF', '').replace('USD', '').replace('EUR', '').strip()
        try:
            return float(value)
        except:
            return 0.0
    return float(value)


def clean_transaction_value(value):
    """Clean average transaction value"""
    if pd.isna(value) or value == '' or value is None:
        return 0.0
    if isinstance(value, str):
        value = str(value).replace(' ', '').replace(',', '').strip()
        try:
            return float(value)
        except:
            return 0.0
    return float(value)


def parse_date(date_str):
    """Parse date string to datetime"""
    if pd.isna(date_str) or date_str == '' or date_str is None:
        return None
    try:
        for fmt in ['%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d']:
            try:
                return pd.to_datetime(date_str, format=fmt)
            except:
                continue
        return pd.to_datetime(date_str)
    except:
        return None


def prepare_features(customer_data, encoders):
    """Transform customer data into model features"""
    # Create a DataFrame from customer data
    df = pd.DataFrame([customer_data])
    
    # Clean balance and transaction values
    if 'Balance' in df.columns:
        df['Balance'] = df['Balance'].apply(clean_balance)
    elif 'balance' in df.columns:
        df['Balance'] = df['balance'].apply(clean_balance)
    
    if 'Average_Transaction_Value' in df.columns:
        df['Average_Transaction_Value'] = df['Average_Transaction_Value'].apply(clean_transaction_value)
    elif 'average_transaction_value' in df.columns:
        df['Average_Transaction_Value'] = df['average_transaction_value'].apply(clean_transaction_value)
    
    # Parse dates
    if 'Account_Open_Date' in df.columns:
        df['Account_Open_Date'] = df['Account_Open_Date'].apply(parse_date)
    if 'Last_Transaction_Date' in df.columns:
        df['Last_Transaction_Date'] = df['Last_Transaction_Date'].apply(parse_date)
    
    # Extract date features
    if 'Account_Open_Date' in df.columns and df['Account_Open_Date'].notna().any():
        df['Account_Open_Month'] = df['Account_Open_Date'].dt.month
        df['Account_Open_Year'] = df['Account_Open_Date'].dt.year
    else:
        df['Account_Open_Month'] = 0
        df['Account_Open_Year'] = 0
    
    if 'Last_Transaction_Date' in df.columns and df['Last_Transaction_Date'].notna().any():
        df['Last_Transaction_Month'] = df['Last_Transaction_Date'].dt.month
        df['Last_Transaction_Year'] = df['Last_Transaction_Date'].dt.year
    else:
        df['Last_Transaction_Month'] = 0
        df['Last_Transaction_Year'] = 0
    
    # Encode categorical variables
    categorical_cols = {
        'Customer_Segment': 'Customer_Segment',
        'Gender': 'Gender',
        'Nationality': 'Nationality',
        'Account_Type': 'Account_Type',
        'Branch': 'Branch',
        'Currency': 'Currency',
        'Account_Status': 'Account_Status'
    }
    
    for col_name, col_key in categorical_cols.items():
        if col_key in df.columns or col_key.lower() in df.columns:
            key = col_key if col_key in df.columns else col_key.lower()
            if col_name in encoders:
                # Handle unknown categories
                try:
                    df[col_name + '_encoded'] = encoders[col_name].transform(df[key].astype(str))
                except ValueError:
                    # Unknown category, use most common
                    df[col_name + '_encoded'] = 0
            else:
                df[col_name + '_encoded'] = 0
    
    # Feature columns (must match training)
    feature_cols = [
        'Customer_Segment_encoded', 'Gender_encoded', 'Age', 'Nationality_encoded',
        'Account_Type_encoded', 'Branch_encoded', 'Currency_encoded',
        'Balance', 'Tenure_Months', 'Num_Products', 'Has_Credit_Card',
        'Account_Status_encoded', 'Transaction_Frequency', 'Average_Transaction_Value',
        'Mobile_Banking_Usage', 'Branch_Visits', 'Complaint_History',
        'Account_Age_Months', 'Days_Since_Last_Transaction', 'Activity_Score',
        'Account_Open_Month', 'Account_Open_Year', 'Last_Transaction_Month', 'Last_Transaction_Year'
    ]
    
    # Map column names (handle both camelCase and snake_case)
    column_mapping = {
        'age': 'Age',
        'tenure_months': 'Tenure_Months',
        'tenureMonths': 'Tenure_Months',
        'num_products': 'Num_Products',
        'numProducts': 'Num_Products',
        'has_credit_card': 'Has_Credit_Card',
        'hasCreditCard': 'Has_Credit_Card',
        'transaction_frequency': 'Transaction_Frequency',
        'transactionFrequency': 'Transaction_Frequency',
        'mobile_banking_usage': 'Mobile_Banking_Usage',
        'mobileBankingUsage': 'Mobile_Banking_Usage',
        'branch_visits': 'Branch_Visits',
        'branchVisits': 'Branch_Visits',
        'complaint_history': 'Complaint_History',
        'complaintHistory': 'Complaint_History',
        'account_age_months': 'Account_Age_Months',
        'accountAgeMonths': 'Account_Age_Months',
        'days_since_last_transaction': 'Days_Since_Last_Transaction',
        'daysSinceLastTransaction': 'Days_Since_Last_Transaction',
        'activity_score': 'Activity_Score',
        'activityScore': 'Activity_Score'
    }
    
    # Normalize column names
    df_normalized = df.copy()
    for old_name, new_name in column_mapping.items():
        if old_name in df_normalized.columns:
            df_normalized[new_name] = df_normalized[old_name]
    
    # Build feature vector
    features = {}
    for col in feature_cols:
        base_col = col.replace('_encoded', '')
        if col in df_normalized.columns:
            features[col] = df_normalized[col].iloc[0]
        elif base_col in df_normalized.columns:
            features[col] = df_normalized[base_col].iloc[0]
        else:
            # Default values for missing features
            if 'encoded' in col:
                features[col] = 0
            elif col == 'Age':
                features[col] = 50
            elif col in ['Balance', 'Average_Transaction_Value']:
                features[col] = 0.0
            else:
                features[col] = 0
    
    # Create feature DataFrame
    feature_df = pd.DataFrame([features])
    
    # Fill missing values
    feature_df = feature_df.fillna(0)
    
    # Ensure correct order
    feature_df = feature_df[feature_cols]
    
    return feature_df


def predict_churn(customer_data, include_shap=False):
    """Predict churn probability for a customer"""
    # Load artifacts
    model, scaler, encoders = load_artifacts()
    
    # Prepare features
    features = prepare_features(customer_data, encoders)
    feature_cols = list(features.columns)
    
    # Scale features
    features_scaled = scaler.transform(features)
    
    # Predict
    churn_probability = model.predict_proba(features_scaled)[0][1]
    churn_prediction = model.predict(features_scaled)[0]
    
    result = {
        'churn_probability': float(churn_probability),
        'churn_prediction': int(churn_prediction),
        'churn_score': int(churn_probability * 100),  # Convert to 0-100 scale
        'risk_level': 'high' if churn_probability > 0.7 else ('medium' if churn_probability > 0.4 else 'low')
    }
    
    # Add SHAP values if requested
    if include_shap:
        try:
            import shap
            # Create SHAP explainer (TreeExplainer for gradient boosting)
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(features_scaled[0])
            
            # Handle binary classification (SHAP returns values for both classes)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # Use positive class (churn=1)
            
            # Map SHAP values to feature names
            shap_dict = {}
            for i, col in enumerate(feature_cols):
                if i < len(shap_values):
                    # Clean feature name for display
                    display_name = col.replace('_encoded', '').replace('_', ' ').title()
                    shap_dict[display_name] = float(shap_values[i])
            
            # Sort by absolute value and get top features
            sorted_shap = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
            result['shap_values'] = [
                {
                    'feature': name,
                    'impact': round(abs(value) * 100, 1),  # Convert to percentage impact
                    'direction': 'increases' if value > 0 else 'decreases',
                    'value': round(float(value), 4)
                }
                for name, value in sorted_shap[:10]  # Top 10 features
            ]
        except ImportError:
            # SHAP not installed, use feature importance as fallback
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                feature_importance = dict(zip(feature_cols, importances))
                sorted_importance = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
                result['shap_values'] = [
                    {
                        'feature': name.replace('_encoded', '').replace('_', ' ').title(),
                        'impact': round(value * 100, 1),
                        'direction': 'increases',  # Can't determine direction from importance alone
                        'value': round(float(value), 4)
                    }
                    for name, value in sorted_importance[:10]
                ]
        except Exception as e:
            # If SHAP calculation fails, just skip it
            print(f"Warning: Could not calculate SHAP values: {e}", file=sys.stderr)
    
    return result


def predict_batch(customers_data):
    """Predict churn for multiple customers"""
    results = []
    for customer_data in customers_data:
        try:
            prediction = predict_churn(customer_data)
            prediction['customer_id'] = customer_data.get('customer_id') or customer_data.get('Customer_ID') or customer_data.get('id')
            results.append(prediction)
        except Exception as e:
            results.append({
                'customer_id': customer_data.get('customer_id') or customer_data.get('Customer_ID') or customer_data.get('id'),
                'error': str(e)
            })
    return results


if __name__ == '__main__':
    # Command line usage
    if len(sys.argv) < 2:
        print("Usage: python predict.py <json_data>")
        print("Example: python predict.py '{\"Age\": 45, \"Tenure_Months\": 60, ...}'")
        sys.exit(1)
    
    try:
        # Parse JSON input
        input_data = json.loads(sys.argv[1])
        customer_data = input_data.get('customer_data', input_data) if isinstance(input_data, dict) else input_data
        include_shap = input_data.get('include_shap', False) if isinstance(input_data, dict) else False
        
        # Predict
        result = predict_churn(customer_data, include_shap=include_shap)
        
        # Output as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        print(json.dumps({'error': 'Invalid JSON input'}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

