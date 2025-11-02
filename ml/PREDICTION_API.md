# ML Prediction API Integration

This document explains how to use the ML model predictions in the BK Pulse application.

## Python Prediction Script

The `predict.py` script can be used in two ways:

### 1. Command Line Usage

```bash
python ml/predict.py '{"Age": 45, "Tenure_Months": 60, "Customer_Segment": "Retail", ...}'
```

Returns JSON with prediction results.

### 2. Import as Module

```python
from predict import predict_churn

customer_data = {
    "Age": 45,
    "Tenure_Months": 60,
    "Customer_Segment": "Retail",
    # ... other fields
}

result = predict_churn(customer_data)
print(result)
# {
#   "churn_probability": 0.35,
#   "churn_prediction": 0,
#   "churn_score": 35,
#   "risk_level": "medium"
# }
```

## Node.js API Integration

The server exposes REST endpoints for predictions:

### Single Prediction

```javascript
POST /api/predictions/single
Headers: { Authorization: 'Bearer <token>' }
Body: {
  "Age": 45,
  "Tenure_Months": 60,
  "Customer_Segment": "Retail",
  ...
}
```

### Predict by Customer ID

```javascript
POST /api/predictions/customer/:id
Headers: { Authorization: 'Bearer <token>' }
```

Automatically fetches customer from database, predicts, and updates the churn_score.

### Batch Prediction

```javascript
POST /api/predictions/batch
Headers: { Authorization: 'Bearer <token>' }
Body: {
  "customer_ids": ["CUST001", "CUST002"],  // Optional
  "limit": 100  // Optional, defaults to 100
}
```

## Batch Update Script

To update all customer churn scores in the database:

```bash
node server/scripts/updateChurnScores.js [limit]
```

This script:
1. Fetches customers with outdated or missing churn scores
2. Generates predictions using the ML model
3. Updates the database with new churn scores and risk levels

## Required Customer Data Fields

The model requires the following fields (some have defaults):

### Required
- `Age` (default: 50)
- `Tenure_Months` (default: 0)
- `Customer_Segment` (default: "Retail")
- `Account_Type` (default: "Savings")
- `Balance` (default: 0)

### Optional (with defaults)
- `Gender` (default: "Male")
- `Nationality` (default: "Rwandan")
- `Branch` (default: "Kigali Main")
- `Currency` (default: "RWF")
- `Num_Products` (default: 1)
- `Has_Credit_Card` (default: 0)
- `Account_Status` (default: "Active")
- `Transaction_Frequency` (default: 0)
- `Average_Transaction_Value` (default: 0)
- `Mobile_Banking_Usage` (default: 0)
- `Branch_Visits` (default: 0)
- `Complaint_History` (default: 0)
- `Account_Age_Months` (default: 0)
- `Days_Since_Last_Transaction` (default: 0)
- `Activity_Score` (default: 0)
- `Account_Open_Date` (optional)
- `Last_Transaction_Date` (optional)

## Response Format

```json
{
  "success": true,
  "prediction": {
    "churn_probability": 0.65,      // Probability (0-1)
    "churn_prediction": 1,          // Binary prediction (0 or 1)
    "churn_score": 65,              // Score (0-100) for display
    "risk_level": "high"            // "low", "medium", or "high"
  }
}
```

## Risk Level Thresholds

- **Low**: churn_probability < 0.4 (churn_score < 40)
- **Medium**: 0.4 <= churn_probability < 0.7 (40 <= churn_score < 70)
- **High**: churn_probability >= 0.7 (churn_score >= 70)

## Error Handling

If the Python script fails, the API will return:

```json
{
  "success": false,
  "message": "Failed to generate prediction",
  "error": "Error message details"
}
```

Common errors:
- Missing model files: Run `ml/train_model.py` first
- Invalid customer data: Check field names and types
- Python not found: Ensure Python is in PATH

