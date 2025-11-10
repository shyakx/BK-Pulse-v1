# BK Churn Classification Rules

## Business Rules for Account Status

### 1. Active Accounts
- **Definition**: Customer has made a transaction in the past 6 months
- **Criteria**: `days_since_last_transaction < 180`
- **Applies to**: All account types (Current, Savings, Fixed Deposit)

### 2. Inactive Accounts
- **Definition**: Customer has NOT made a transaction in the past 6 months, but less than 12 months
- **Criteria**: `180 <= days_since_last_transaction < 365`
- **Applies to**: All account types (Current, Savings, Fixed Deposit)

### 3. Churned Accounts
- **Definition**: Customer has NOT made a transaction in the past 12 months
- **Criteria**: `days_since_last_transaction >= 365`
- **Applies to**: **ONLY Current accounts**
- **Important**: Savings and Fixed Deposit accounts **CANNOT churn** per BNR (Bank of National Rwanda) regulations

## Churn Flag Logic

```sql
actual_churn_flag = 
  CASE
    WHEN product_type = 'Current' AND days_since_last_transaction >= 365 THEN true
    WHEN product_type = 'Current' AND days_since_last_transaction < 365 THEN false
    WHEN product_type IN ('Savings', 'Fixed Deposit') THEN false
    ELSE NULL
  END
```

## Account Status Logic

### For Current Accounts:
```sql
account_status = 
  CASE
    WHEN days_since_last_transaction < 180 THEN 'Active'
    WHEN days_since_last_transaction >= 180 AND days_since_last_transaction < 365 THEN 'Inactive'
    WHEN days_since_last_transaction >= 365 THEN 'Churned'
  END
```

### For Savings and Fixed Deposit Accounts:
```sql
account_status = 
  CASE
    WHEN days_since_last_transaction < 180 THEN 'Active'
    WHEN days_since_last_transaction >= 180 THEN 'Inactive'
    -- Note: Cannot be 'Churned' per BNR rules
  END
```

## Impact on Model Training

1. **Dataset Update Required**: The training dataset must be updated to reflect these rules
   - Only Current accounts with `days_since_last_transaction >= 365` should have `Churn_Flag = 1`
   - All Savings and Fixed Deposit accounts should have `Churn_Flag = 0`

2. **Model Retraining**: After updating the dataset, the model should be retrained to learn the correct churn patterns

3. **Prediction Logic**: The prediction system should respect these rules:
   - Never predict churn for Savings or Fixed Deposit accounts
   - Only predict churn for Current accounts based on transaction patterns

## Database Updates

**Note:** All database updates have been completed. The dataset has been corrected and follows BK rules.

If you need to audit or fix dataset issues in the future, use:
```bash
node server/scripts/auditAndFixDataset.js
```

This comprehensive script will:
- Check all account_status values match days_since_last_transaction
- Verify churn_flag is correct for all records
- Fix any inconsistencies according to BK rules

