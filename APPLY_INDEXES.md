# How to Apply Performance Indexes

## Step 1: Get Your Render Database Connection Details

1. Go to your Render Dashboard
2. Navigate to your PostgreSQL database
3. Copy the **External Database URL** (it looks like: `postgresql://user:password@host:port/database`)

## Step 2: Apply the Indexes

### Option A: Using psql Command Line (Recommended)

**On Windows (PowerShell):**
```powershell
# Extract connection details from your External Database URL
# Format: postgresql://user:password@host:port/database

# Example command (replace with your actual values):
$env:PGPASSWORD="your_password"
psql -h dpg-xxxxx-xxxxx.oregon-postgres.render.com -U your_user -d bk_pulse -f server\sql\add_performance_indexes.sql
```

**On Mac/Linux:**
```bash
# Extract connection details from your External Database URL
# Format: postgresql://user:password@host:port/database

# Example command (replace with your actual values):
PGPASSWORD=your_password psql -h dpg-xxxxx-xxxxx.oregon-postgres.render.com -U your_user -d bk_pulse -f server/sql/add_performance_indexes.sql
```

### Option B: Using Render Shell (If Available)

1. Go to your Render Dashboard
2. Click on your PostgreSQL database
3. Go to "Shell" or "Console" tab
4. Run:
```sql
\i /path/to/server/sql/add_performance_indexes.sql
```

**Note:** If you're on free tier, Render Shell might not be available. Use Option A instead.

### Option C: Copy-Paste SQL Directly

1. Open `server/sql/add_performance_indexes.sql` in a text editor
2. Copy all the SQL content
3. Go to your Render Dashboard → PostgreSQL database → "Query" or "SQL Editor"
4. Paste the SQL and click "Run" or "Execute"

**Note:** The `pg_trgm` extension line is commented out. If you get an error about text search, uncomment that line and run it first.

## Step 3: Verify Indexes Were Created

Run this query to verify:

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('customers', 'actions', 'recommendations')
ORDER BY tablename, indexname;
```

You should see the new indexes listed:
- `idx_customers_risk_officer`
- `idx_customers_segment_risk`
- `idx_customers_churn_risk`
- `idx_customers_updated_at`
- `idx_customers_created_at`
- `idx_customers_branch`
- `idx_customers_email`
- `idx_actions_officer_status`
- `idx_actions_customer_status`
- `idx_actions_created_at`
- `idx_recommendations_status`
- `idx_recommendations_customer`
- `idx_customers_risk_trend`

## Expected Time

- **Small database (< 10k customers)**: 10-30 seconds
- **Medium database (10k-100k customers)**: 30-60 seconds
- **Large database (100k+ customers)**: 1-3 minutes

The indexes are created in the background, so your database will remain available during creation.

## Troubleshooting

### Error: "extension pg_trgm does not exist"
If you need text search, uncomment this line in the SQL file:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Then run it separately before running the rest of the indexes.

### Error: "index already exists"
This is fine! The SQL uses `IF NOT EXISTS`, so it will skip existing indexes.

### Error: "permission denied"
Make sure you're using the correct database user credentials from your External Database URL.

## After Applying Indexes

1. **Clear browser cache** to ensure fresh data
2. **Test the dashboard** - it should load much faster
3. **Check Network tab** in DevTools to see improved load times

The performance improvements will be immediately noticeable!

