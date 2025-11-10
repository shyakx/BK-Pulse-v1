"""
Model Training Script for BK Pulse Churn Prediction
Trains multiple models and selects the best one
"""

import pandas as pd
import numpy as np
import os
import json
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix
)
from sklearn.model_selection import cross_val_score, StratifiedKFold
import joblib

# Optional imports for advanced models
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("XGBoost not available. Install with: pip install xgboost")

try:
    from lightgbm import LGBMClassifier
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("LightGBM not available. Install with: pip install lightgbm")

try:
    from imblearn.over_sampling import SMOTE
    SMOTE_AVAILABLE = True
except ImportError:
    SMOTE_AVAILABLE = False
    print("imbalanced-learn not available. Install with: pip install imbalanced-learn")


# Configuration
# Use absolute paths
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, 'data', 'processed')
MODELS_DIR = os.path.join(BASE_DIR, 'data', 'models')
METRICS_DIR = os.path.join(BASE_DIR, 'data', 'models', 'metrics')


def load_processed_data():
    """Load preprocessed training and test data"""
    print("Loading processed data...")
    
    # Check if files exist
    required_files = [
        os.path.join(PROCESSED_DATA_DIR, 'X_train.csv'),
        os.path.join(PROCESSED_DATA_DIR, 'X_test.csv'),
        os.path.join(PROCESSED_DATA_DIR, 'y_train.csv'),
        os.path.join(PROCESSED_DATA_DIR, 'y_test.csv')
    ]
    
    for file_path in required_files:
        if not os.path.exists(file_path):
            raise FileNotFoundError(
                f"Processed data file not found: {file_path}\n"
                "Please run preprocess.py first to generate the processed data files."
            )
    
    X_train = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'X_train.csv'))
    X_test = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'X_test.csv'))
    # Use iloc[:, 0] to get first column as Series (replaces deprecated squeeze parameter)
    y_train = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'y_train.csv')).iloc[:, 0]
    y_test = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'y_test.csv')).iloc[:, 0]
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    return X_train, X_test, y_train, y_test


def evaluate_model(model, X_train, X_test, y_train, y_test, model_name):
    """Evaluate a model and return metrics"""
    # Train
    model.fit(X_train, y_train)
    
    # Predictions
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    
    # Probabilities
    if hasattr(model, 'predict_proba'):
        y_train_proba = model.predict_proba(X_train)[:, 1]
        y_test_proba = model.predict_proba(X_test)[:, 1]
    else:
        y_train_proba = None
        y_test_proba = None
    
    # Metrics
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    
    metrics = {
        'model_name': model_name,
        'train_accuracy': train_acc,
        'test_accuracy': test_acc,
        'train_precision': precision_score(y_train, y_train_pred, average='binary', zero_division=0),
        'test_precision': precision_score(y_test, y_test_pred, average='binary', zero_division=0),
        'train_recall': recall_score(y_train, y_train_pred, average='binary', zero_division=0),
        'test_recall': recall_score(y_test, y_test_pred, average='binary', zero_division=0),
        'train_f1': f1_score(y_train, y_train_pred, average='binary', zero_division=0),
        'test_f1': f1_score(y_test, y_test_pred, average='binary', zero_division=0),
        'overfitting_gap': train_acc - test_acc,  # Track overfitting
    }
    
    if y_test_proba is not None:
        metrics['test_roc_auc'] = roc_auc_score(y_test, y_test_proba)
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc', n_jobs=-1)
    metrics['cv_mean'] = cv_scores.mean()
    metrics['cv_std'] = cv_scores.std()
    
    # Classification report
    metrics['classification_report'] = classification_report(y_test, y_test_pred, output_dict=True)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_test_pred)
    metrics['confusion_matrix'] = {
        'tn': int(cm[0, 0]),
        'fp': int(cm[0, 1]),
        'fn': int(cm[1, 0]),
        'tp': int(cm[1, 1])
    }
    
    return metrics, model


def train_models(X_train, X_test, y_train, y_test):
    """Train multiple models with regularization to prevent overfitting"""
    # Calculate class weight for imbalanced data
    pos_weight = len(y_train[y_train==0]) / len(y_train[y_train==1])
    
    models = {
        'Logistic Regression': LogisticRegression(
            max_iter=1000, 
            random_state=42, 
            class_weight='balanced',
            C=0.01,  # More aggressive regularization - lower C = more regularization
            penalty='l2'
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=10,  # Very few trees
            max_depth=3,  # Very shallow - only 3 levels
            min_samples_split=500,  # Extremely high - require many samples to split
            min_samples_leaf=250,  # Extremely high - require many samples in leaf
            max_features=0.3,  # Use only 30% of features
            max_samples=0.4,  # Use only 40% of samples per tree (bootstrap)
            random_state=42, 
            class_weight='balanced', 
            n_jobs=-1
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=10,  # Very few
            max_depth=2,  # Very shallow trees (stumps)
            min_samples_split=500,  # Extremely high
            min_samples_leaf=250,  # Extremely high
            learning_rate=0.01,  # Very slow learning
            subsample=0.4,  # Use only 40% of samples per tree
            max_features=0.3,  # Use only 30% of features
            random_state=42
        ),
    }
    
    if XGBOOST_AVAILABLE:
        models['XGBoost'] = XGBClassifier(
            n_estimators=30,  # Further reduced
            max_depth=2,  # Very shallow
            min_child_weight=20,  # Much higher
            learning_rate=0.03,  # Even slower
            subsample=0.6,  # More aggressive subsampling
            colsample_bytree=0.6,  # More aggressive feature sampling
            reg_alpha=1.0,  # Much more L1 regularization
            reg_lambda=3.0,  # Much more L2 regularization
            random_state=42, 
            eval_metric='logloss', 
            scale_pos_weight=pos_weight
        )
    
    if LIGHTGBM_AVAILABLE:
        models['LightGBM'] = LGBMClassifier(
            n_estimators=30,  # Further reduced
            max_depth=2,  # Very shallow
            min_child_samples=100,  # Much higher
            learning_rate=0.03,  # Even slower
            subsample=0.6,  # More aggressive subsampling
            colsample_bytree=0.6,  # More aggressive feature sampling
            reg_alpha=1.0,  # Much more L1 regularization
            reg_lambda=3.0,  # Much more L2 regularization
            random_state=42, 
            verbose=-1, 
            class_weight='balanced'
        )
    
    results = []
    trained_models = {}
    
    print("\n" + "="*60)
    print("Training Models")
    print("="*60)
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        metrics, trained_model = evaluate_model(model, X_train, X_test, y_train, y_test, name)
        results.append(metrics)
        trained_models[name] = trained_model
        
        print(f"  Train Accuracy: {metrics['train_accuracy']:.4f}")
        print(f"  Test Accuracy: {metrics['test_accuracy']:.4f}")
        print(f"  Overfitting Gap: {metrics['overfitting_gap']:.4f} (train - test)")
        print(f"  Test F1-Score: {metrics['test_f1']:.4f}")
        if 'test_roc_auc' in metrics:
            print(f"  Test ROC-AUC: {metrics['test_roc_auc']:.4f}")
        if metrics['overfitting_gap'] > 0.05:
            print(f"  ⚠️  WARNING: High overfitting gap detected!")
    
    # Find best model - prefer models with lower overfitting gap
    # Score = test_roc_auc - (overfitting_gap * 10) to penalize overfitting
    for r in results:
        r['score'] = r.get('test_roc_auc', r['test_f1']) - (r['overfitting_gap'] * 10)
    
    best_model_name = max(results, key=lambda x: x['score'])['model_name']
    best_model = trained_models[best_model_name]
    
    print(f"\nBest model selected based on: test_roc_auc - (overfitting_gap * 10)")
    best_metrics = next(r for r in results if r['model_name'] == best_model_name)
    print(f"  Score: {best_metrics['score']:.4f}")
    print(f"  Overfitting Gap: {best_metrics['overfitting_gap']:.4f}")
    
    print("\n" + "="*60)
    print(f"Best Model: {best_model_name}")
    print("="*60)
    
    return results, trained_models, best_model_name, best_model


def save_model(model, model_name, metrics, version=None):
    """Save trained model and metrics"""
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(METRICS_DIR, exist_ok=True)
    
    if version is None:
        version = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Save model
    model_path = f'{MODELS_DIR}/{model_name.lower().replace(" ", "_")}_{version}.pkl'
    joblib.dump(model, model_path)
    print(f"\nModel saved to: {model_path}")
    
    # Save metrics
    metrics_path = f'{METRICS_DIR}/{model_name.lower().replace(" ", "_")}_{version}.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to: {metrics_path}")
    
    # Save latest version reference
    latest_path = f'{MODELS_DIR}/latest_{model_name.lower().replace(" ", "_")}.pkl'
    joblib.dump(model, latest_path)
    
    return model_path, metrics_path


def save_all_results(results, trained_models, best_model_name, best_model):
    """Save all model results"""
    # Save best model
    best_metrics = next(r for r in results if r['model_name'] == best_model_name)
    save_model(best_model, best_model_name, best_metrics, version='best')
    
    # Save comparison report
    comparison_path = f'{METRICS_DIR}/model_comparison_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(comparison_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Comparison report saved to: {comparison_path}")
    
    # Print summary
    print("\n" + "="*60)
    print("Model Comparison Summary")
    print("="*60)
    df_results = pd.DataFrame(results)
    print(df_results[['model_name', 'test_accuracy', 'test_f1', 'test_roc_auc', 'cv_mean']].to_string(index=False))
    
    return comparison_path


def main():
    """Main training function"""
    print("="*60)
    print("BK Pulse - Churn Prediction Model Training")
    print("="*60)
    
    # Load data
    X_train, X_test, y_train, y_test = load_processed_data()
    
    # Handle class imbalance with SMOTE if available
    if SMOTE_AVAILABLE:
        print("\nApplying SMOTE to handle class imbalance...")
        smote = SMOTE(random_state=42)
        X_train, y_train = smote.fit_resample(X_train, y_train)
        print(f"After SMOTE - Training set: {len(X_train)} samples")
    
    # Train models
    results, trained_models, best_model_name, best_model = train_models(
        X_train, X_test, y_train, y_test
    )
    
    # Save results
    save_all_results(results, trained_models, best_model_name, best_model)
    
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)


if __name__ == '__main__':
    main()

