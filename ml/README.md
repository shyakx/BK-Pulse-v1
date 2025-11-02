# Machine Learning Pipeline

This directory contains scripts for training churn prediction models for BK Pulse.

## Setup

1. Install Python dependencies:

**Option 1: Install all packages (recommended if you have a C compiler):**
```bash
pip install -r requirements.txt
```

**Option 2: Install minimal essential packages (Windows-friendly, no compiler needed):**
```bash
# Windows
install_minimal.bat

# Linux/Mac
bash install_minimal.sh

# Or manually:
pip install pandas numpy scikit-learn matplotlib seaborn joblib python-dateutil
```

**Option 3: Install essential packages first, then optional ones:**
```bash
# Essential packages
pip install pandas numpy scikit-learn matplotlib seaborn joblib python-dateutil

# Optional (for advanced models)
pip install xgboost lightgbm imbalanced-learn
```

**Note:** If you encounter build errors (especially on Windows with Python 3.13), use Option 2 or 3. The essential packages are sufficient for basic model training (Logistic Regression, Random Forest, Gradient Boosting).

2. Ensure your dataset is in `../data/raw/bk_simulated_churn_dataset_with_segment_200k.csv`

## Workflow

### Option 1: Run Complete Pipeline (Recommended)
```bash
python run_pipeline.py
```
This will automatically run preprocessing and training in sequence.

### Option 2: Run Steps Individually

#### 1. Exploratory Data Analysis (EDA) - Optional
```bash
python explore_data.py
```
- Analyzes dataset structure
- Generates statistics and visualizations
- Outputs saved to `../data/processed/eda_results/`

#### 2. Data Preprocessing (Required before training)
```bash
python preprocess.py
```
- Cleans and transforms raw data
- Handles missing values
- Encodes categorical variables
- Scales numerical features
- Splits data into train/test sets
- Outputs saved to `../data/processed/`

#### 3. Model Training (Requires preprocessing)
```bash
python train_model.py
```
- Trains multiple models (Logistic Regression, Random Forest, Gradient Boosting, XGBoost, LightGBM)
- Evaluates model performance
- Selects best model
- Saves models and metrics to `../data/models/`

**Note:** You must run `preprocess.py` before `train_model.py` as the training script requires the preprocessed data files.

## Output Structure

```
data/
├── processed/
│   ├── X_train.csv
│   ├── X_test.csv
│   ├── y_train.csv
│   ├── y_test.csv
│   ├── processed_data.csv
│   ├── scaler.pkl
│   ├── encoders.pkl
│   └── eda_results/
│       ├── *.png (visualizations)
│       └── eda_report_*.txt
└── models/
    ├── *.pkl (trained models)
    └── metrics/
        ├── *.json (model metrics)
        └── model_comparison_*.json
```

## Model Evaluation Metrics

Models are evaluated using:
- Accuracy
- Precision
- Recall
- F1-Score
- ROC-AUC Score
- Cross-validation scores
- Confusion Matrix

## Notes

- The pipeline handles class imbalance using SMOTE (if available) or class weights
- Feature engineering includes date parsing and categorical encoding
- Models are saved with timestamps for version tracking
- Best model is saved as `latest_*.pkl` for easy access

