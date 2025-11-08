# Customer Assignment System Setup Guide

## Overview
This system automatically assigns high-risk customers (churn_score >= 70) to retention officers, with assignments expiring after 24 hours. Each officer receives up to 100 customers per day, distributed in a round-robin fashion.

## Database Setup

### 1. Create the Assignments Table
Run the SQL script to create the `customer_assignments` table:

```bash
# Using psql
psql -U your_username -d bk_pulse -f server/sql/add_customer_assignments_table.sql

# Or using Node.js
cd server
node -e "const pool = require('./config/database'); const fs = require('fs'); const sql = fs.readFileSync('./sql/add_customer_assignments_table.sql', 'utf8'); pool.query(sql).then(() => { console.log('Table created successfully'); pool.end(); }).catch(err => { console.error('Error:', err); process.exit(1); });"
```

## Auto-Assignment Setup

### Option 1: Manual Run (Testing)
```bash
cd server
node scripts/autoAssignCustomers.js
```

### Option 2: Cron Job (Production - Linux/Mac)
Add to crontab to run every day at midnight:
```bash
crontab -e
```

Add this line:
```
0 0 * * * cd /path/to/BK-PULSE && node server/scripts/autoAssignCustomers.js >> /var/log/bk-pulse-assignments.log 2>&1
```

### Option 3: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 00:00
4. Action: Start a program
5. Program: `node`
6. Arguments: `server/scripts/autoAssignCustomers.js`
7. Start in: `D:\Projects\BK-PULSE` (or your project path)

### Option 4: API Endpoint (For Manual Trigger)
Admins can manually trigger auto-assignment via API:
```bash
POST /api/assignments/auto-assign
Authorization: Bearer <admin_token>
```

## Features Implemented

### 1. Analysis Page (for Officers)
- Shows only assigned customers (churn_score >= 70)
- Displays up to 100 customers per officer
- "Add Task" button replaces "View" button
- Customer removed from list after task creation
- Search functionality added
- Assignments expire after 24 hours

### 2. Customers Page
- Shows all customers (no expiration)
- "Add Task" button replaces "Send Email" button
- Customer remains visible after task creation (master list)

### 3. My Tasks Page
- Updated to show customer details:
  - Segment
  - Branch
  - Churn Score
  - Risk Level
  - Balance
- Tasks created from both Analysis and Customers pages appear here

### 4. Assignment Logic
- Only high-risk customers (churn_score >= 70) are assigned
- 100 customers per officer per day
- Round-robin distribution among 12 officers
- Prevents duplicates (customers not assigned if already assigned in last 24 hours)
- Expired assignments are automatically deactivated
- Unassigned customers can be reassigned the next day

## API Endpoints

### GET /api/assignments/my-assigned
Get assigned customers for logged-in officer
- **Access**: Officers only
- **Query Params**: `page`, `limit`, `search`
- **Returns**: List of assigned customers with churn_score >= 70

### POST /api/assignments/auto-assign
Manually trigger auto-assignment
- **Access**: Admin only
- **Returns**: Assignment summary

### DELETE /api/assignments/:customer_id
Remove assignment (called automatically when task is created)
- **Access**: Officers only

## Workflow

1. **Daily Auto-Assignment** (Midnight):
   - System finds all high-risk customers (churn_score >= 70)
   - Excludes customers already assigned or assigned in last 24 hours
   - Distributes 100 customers per officer (round-robin)
   - Assignments expire in 24 hours

2. **Officer Views Analysis Page**:
   - Sees only their assigned customers
   - Can search within assigned customers
   - Sorted by churn_score DESC (highest first)

3. **Officer Adds Task**:
   - Clicks "Add Task" button
   - Task created with auto-set priority based on churn_score
   - Customer removed from Analysis page
   - Customer appears in My Tasks page

4. **Next Day**:
   - Expired assignments are deactivated
   - Unassigned customers (not converted to tasks) can be reassigned
   - New batch of 100 customers assigned to each officer

## Testing

1. **Test Auto-Assignment**:
   ```bash
   node server/scripts/autoAssignCustomers.js
   ```

2. **Verify Assignments**:
   - Login as an officer
   - Go to Analysis page
   - Should see up to 100 assigned customers

3. **Test Task Creation**:
   - Click "Add Task" on a customer
   - Customer should disappear from Analysis page
   - Check My Tasks page - task should appear with customer details

4. **Test Search**:
   - Use search box in Analysis page
   - Should filter assigned customers

## Notes

- Assignments are automatically removed when a task is created
- Customers in My Tasks have no expiration (tasks persist)
- Customers page shows all customers (no assignment filtering)
- Only officers see assigned customers in Analysis page
- Analysts/Managers see all high-risk customers in Analysis page

