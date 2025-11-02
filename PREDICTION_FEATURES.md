# 🎯 Prediction Features in UI

You can now make churn predictions directly from the UI! Here are all the available prediction features:

## ✅ Available Prediction Features

### 1. **Single Customer Prediction** (Customer Details Page)
- **Location**: Click on any customer → View Details page
- **Button**: "Update Prediction" (top right)
- **Who can use**: Retention Analysts, Managers, and Admins
- **What it does**: 
  - Runs the ML model on that specific customer
  - Updates their churn score and risk level
  - Refreshes the page with new predictions

**How to use:**
1. Go to Customers page
2. Click on a customer (eye icon or customer name)
3. On the Customer Details page, click "Update Prediction"
4. Wait a few seconds
5. See updated churn score!

---

### 2. **Batch Prediction** (Customers Page)
- **Location**: Customers page → Top toolbar
- **Button**: "Update All Predictions" (yellow/warning button)
- **Who can use**: Retention Analysts, Managers, and Admins
- **What it does**:
  - Runs ML predictions for up to 100 customers at once
  - Updates all churn scores in the database
  - Refreshes the customer list automatically

**How to use:**
1. Go to Customers page
2. Click "Update All Predictions" button
3. Confirm the action
4. Wait for completion (may take 30-60 seconds)
5. See updated scores for all customers!

---

### 3. **Real-time Display** (Automatic)
- **Location**: Customers table and Customer Details
- **What it shows**:
  - Current churn scores (0-100%)
  - Risk levels (Low/Medium/High)
  - Color-coded progress bars
  - Last updated timestamp

---

## 🔐 Permission Levels

| Role | Single Prediction | Batch Prediction | View Scores |
|------|------------------|------------------|-------------|
| **Retention Officer** | ❌ | ❌ | ✅ |
| **Retention Analyst** | ✅ | ✅ | ✅ |
| **Retention Manager** | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ |

---

## 🎨 Visual Indicators

### Churn Score Colors:
- **🟢 Green (0-40%)**: Low risk
- **🟡 Yellow (41-70%)**: Medium risk  
- **🔴 Red (71-100%)**: High risk

### Risk Level Badges:
- **Low Risk**: Green badge
- **Medium Risk**: Yellow badge
- **High Risk**: Red badge

---

## 📊 What Happens Behind the Scenes

When you click "Update Prediction":

1. **Frontend** → Sends request to `/api/customers/:id/predict` or `/api/predictions/batch`
2. **Backend** → Fetches customer data from PostgreSQL
3. **ML Engine** → Runs Python `predict.py` script with customer features
4. **Model** → Returns churn probability (0-1)
5. **Backend** → Converts to percentage and determines risk level
6. **Database** → Updates `churn_score` and `risk_level` in database
7. **Frontend** → Refreshes and displays new scores

---

## ⚡ Performance Tips

- **Single predictions**: Usually take 1-3 seconds
- **Batch predictions**: 
  - ~100 customers: 30-60 seconds
  - Larger batches may take longer
  - Consider filtering customers first

---

## 🐛 Troubleshooting

### Prediction button not showing?
- Check your role: Only Analysts, Managers, and Admins can predict
- Make sure you're logged in with correct credentials

### "Failed to update prediction" error?
- Check backend server is running: `npm run server`
- Check Python ML model files exist: `ml/predict.py` should be present
- Check database connection in `server/.env`

### Scores not updating?
- Wait a few seconds and refresh the page
- Check browser console for errors (F12)
- Verify backend logs for ML prediction errors

---

## 🚀 Example Workflow

**Scenario**: You want to check and update predictions for high-risk customers

1. **Login** as Analyst/Manager/Admin
2. **Go to Customers** page
3. **Filter by Risk Level** = "High" (if available)
4. **Click "Update All Predictions"** to refresh all scores
5. **Wait** for batch update to complete
6. **Review** updated scores in the table
7. **Click individual customers** to see detailed predictions
8. **Use "Update Prediction"** on specific customers as needed

---

## 📝 Future Enhancements (Potential)

- ⏳ **Scheduled Batch Updates**: Auto-update predictions daily/weekly
- 📈 **Prediction History**: Track how scores change over time
- 🎯 **Custom Predictions**: Enter customer data manually to predict
- 📊 **Bulk Export**: Export predictions with scores
- 🔔 **Alerts**: Get notified when scores change significantly

---

## 💡 Quick Reference

| Action | Page | Button | Time |
|--------|------|--------|------|
| Predict one customer | Customer Details | "Update Prediction" | 1-3 sec |
| Predict all customers | Customers | "Update All Predictions" | 30-60 sec |
| View scores | Customers/Customer Details | Automatic | Instant |

---

**Happy Predicting! 🎯**

