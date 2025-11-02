# 📋 Post-Seeding Guide - What to Do After Adding 170,000 Customers

After successfully seeding 170,000 customers, here are the recommended next steps:

## ✅ Step 1: Verify Data Seeding

Check that all customers were inserted correctly:

```bash
# Connect to PostgreSQL and check
psql -U postgres -d bk_pulse

# Run these queries:
SELECT COUNT(*) FROM customers;
SELECT segment, COUNT(*) FROM customers GROUP BY segment;
SELECT risk_level, COUNT(*) FROM customers GROUP BY risk_level;
```

**Expected Results:**
- Total customers: ~170,000
- Segment distribution: ~60% retail, ~25% SME, ~12% corporate, ~3% institutional
- Risk levels should be distributed across high/medium/low

---

## 🎯 Step 2: Update Churn Scores with ML Model Predictions

**Important:** The seeded customers have **placeholder churn scores**. Update them with **real ML model predictions**.

### Option A: Update All at Once (Recommended for Fresh Data)

Run the batch prediction script to update all customers:

```bash
# Update first 1000 customers (all, not just those needing updates)
node server/scripts/updateChurnScores.js 1000 --all

# Then continue with more batches
node server/scripts/updateChurnScores.js 10000 --all
# ... continue until all are updated
```

**⚠️ Important:** 
- Use `--all` flag to update ALL customers, not just those needing updates
- Processes ~100 customers/minute
- For 170,000 customers, this may take ~28 hours if done sequentially
- **Recommendation:** Run overnight or in smaller batches

### Option B: Update in Smaller Batches (Better for Testing)

```bash
# Test with first 100 customers
node server/scripts/updateChurnScores.js 100 --all

# Then scale up
node server/scripts/updateChurnScores.js 1000 --all
node server/scripts/updateChurnScores.js 5000 --all
# ... and so on
```

### Option C: Update Only Customers Needing Updates (Normal Mode)

```bash
# Only updates customers with NULL churn_score or outdated predictions
node server/scripts/updateChurnScores.js 1000
```

### Option D: Use UI Batch Prediction (For Testing)

1. Log in as Analyst/Manager/Admin
2. Go to **Customers** page
3. Click **"Update All Predictions"** button
4. Note: This only updates 100 customers at a time via API

---

## 🔍 Step 3: Verify Dashboard Stats Update

**Yes, the stats cards will automatically update!** Here's how:

1. **Refresh the Dashboard** (F5 or reload page)
2. The stats cards pull data from the database in real-time:
   - **Assigned Customers**: Count of customers assigned to you
   - **High Risk Cases**: Count where `risk_level = 'high'`
   - **Retention Rate**: Calculated from actions completed
   - **Actions Completed**: Count from actions table

3. **The Risk Trend Chart** will also update with new prediction data

**Note:** The dashboard only shows customers **assigned to the logged-in user**. If you have 170K customers but only see 84K, it means:
- Other customers are assigned to other officers, OR
- Some customers don't have `assigned_officer_id` set

---

## 📊 Step 4: Verify Database Performance

With 170,000 customers, ensure indexes are optimized:

```sql
-- Check existing indexes
\d customers

-- Ensure these indexes exist (they should be in schema.sql):
CREATE INDEX IF NOT EXISTS idx_customers_churn_score ON customers(churn_score);
CREATE INDEX IF NOT EXISTS idx_customers_risk_level ON customers(risk_level);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_officer ON customers(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at);
```

---

## 🧪 Step 5: Test the Application

### 5.1 Test Dashboard

1. **Login** to the application
2. **Navigate to Dashboard**
3. **Refresh the page** (F5)
4. Check that:
   - Customer counts display correctly
   - Risk trend chart shows real data
   - Statistics reflect updated predictions

### 5.2 Test Customer Search/Filtering

1. Go to **Customers** page
2. Test filters:
   - Filter by segment
   - Filter by risk level
   - Search by name/customer ID
   - Filter by churn score range
3. Verify pagination works (should show many pages)

### 5.3 Test Performance

- Check page load times
- Verify queries are fast (< 2 seconds)
- Test sorting and filtering performance

---

## 👥 Step 6: Assign Customers to Officers (Important!)

**Current Situation:** The dashboard shows customers assigned to the logged-in user only.

To see all 170K customers in your dashboard, you can:

### Option A: Assign All Customers to Current User (For Testing)

```sql
-- Assign all customers to user ID 1 (John MUGISHA)
UPDATE customers 
SET assigned_officer_id = 1 
WHERE assigned_officer_id IS NULL;
```

### Option B: Distribute Customers Evenly Across Officers

Create a script to evenly distribute customers:

```sql
-- Get officer IDs
SELECT id FROM users WHERE role = 'retentionOfficer';

-- Example: Assign customers to officers 1 and 2 evenly
UPDATE customers 
SET assigned_officer_id = CASE 
  WHEN MOD(id, 2) = 0 THEN 1 
  ELSE 2 
END
WHERE assigned_officer_id IS NULL;
```

### Option C: Use Round-Robin Assignment

I can create a script to assign customers evenly across all retention officers.

---

## 📈 Step 7: Generate Analytics Insights

Once predictions are updated, check:

### Risk Distribution
```sql
SELECT 
  risk_level, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers), 2) as percentage
FROM customers
WHERE churn_score IS NOT NULL
GROUP BY risk_level
ORDER BY 
  CASE risk_level 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'low' THEN 3 
  END;
```

### Segment Analysis
```sql
SELECT 
  segment,
  COUNT(*) as total,
  AVG(churn_score) as avg_churn_score,
  COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count
FROM customers
WHERE churn_score IS NOT NULL
GROUP BY segment
ORDER BY avg_churn_score DESC;
```

---

## ⚡ Step 8: Optimize for Large Dataset (Optional)

### 8.1 Increase Batch Sizes

For faster updates, you can modify `server/scripts/updateChurnScores.js` to process larger batches:

```javascript
// In updateChurnScores.js, you could increase limit parameter
// But be careful - ML predictions are CPU intensive
```

### 8.2 Database Connection Pool

Ensure your database connection pool is sized appropriately in `server/config/database.js`:

```javascript
max: 20, // Increase if needed
```

### 8.3 Consider Background Jobs

For production, consider setting up:
- Scheduled jobs to update predictions nightly
- Queue system for batch predictions
- Async processing for large updates

---

## 🎨 Step 9: Update Charts and Visualizations

After updating predictions:

1. **Refresh Dashboard** - Risk trend chart should now show meaningful data
2. **Check Analytics Pages** - All statistics should reflect real data
3. **Verify Reports** - Generate reports to see full dataset insights

---

## 🔧 Step 10: Performance Monitoring

Monitor these metrics:

- **Database query times** - Should be < 2 seconds for most queries
- **API response times** - Should be < 1 second for most endpoints
- **Page load times** - Should be < 3 seconds
- **Memory usage** - Monitor server memory with 170K customers

---

## 📝 Step 11: Document Your Data

Create documentation of your dataset:

```markdown
## Dataset Statistics
- Total Customers: 170,000
- Segments: Retail (60%), SME (25%), Corporate (12%), Institutional (3%)
- Date Seeded: [Date]
- Predictions Updated: [Date]
- Average Churn Score: [Calculate]
- High Risk Customers: [Count]
```

---

## 🐛 Troubleshooting

### Issue: Slow queries
**Solution:** Add indexes (see Step 3)

### Issue: Predictions taking too long
**Solution:** Process in smaller batches, or run overnight

### Issue: Out of memory errors
**Solution:** Reduce batch sizes, increase server memory

### Issue: Missing data in charts
**Solution:** Ensure predictions are updated (Step 2)

### Issue: Dashboard shows fewer customers than expected
**Solution:** Check customer assignments (Step 6)

---

## ✅ Checklist

- [ ] Verified customer count = 170,000
- [ ] Updated churn scores with ML model
- [ ] Checked database indexes
- [ ] Tested dashboard with real data
- [ ] Tested customer search/filtering
- [ ] Verified performance is acceptable
- [ ] Updated customer assignments (optional)
- [ ] Reviewed analytics and insights
- [ ] Documented dataset statistics

---

## 🎉 You're Done!

Your BK Pulse system now has 170,000 diverse customers with realistic data. The system should be fully functional and ready for testing or production use!

---

**Quick Reference Commands:**

```bash
# Generate customers
node server/scripts/generateCustomers.js

# Update predictions - all customers mode (1000 at a time)
node server/scripts/updateChurnScores.js 1000 --all

# Update predictions - only those needing updates
node server/scripts/updateChurnScores.js 1000

# Check database stats
psql -U postgres -d bk_pulse -c "SELECT COUNT(*) FROM customers;"
```
