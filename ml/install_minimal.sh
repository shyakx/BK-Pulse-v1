#!/bin/bash
# Minimal installation script for Unix/Mac
# Installs only essential packages with pre-built wheels

echo "Installing essential ML packages..."
pip install pandas numpy scikit-learn matplotlib seaborn joblib python-dateutil

echo ""
echo "Essential packages installed!"
echo ""
echo "To install optional packages (XGBoost, LightGBM, SMOTE):"
echo "  pip install xgboost lightgbm imbalanced-learn"

