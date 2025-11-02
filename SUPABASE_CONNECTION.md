# 🔐 Supabase Database Connection

## ⚠️ Important: Password Encoding

Your password contains special characters (`@`) that need to be URL-encoded in the connection string.

**Your Password:** `0782194138@Steve`

**URL-Encoded Password:** `0782194138%40Steve`
- `@` becomes `%40`

## ✅ Correct Connection String

Use this URL-encoded connection string:

```
postgresql://postgres:0782194138%40Steve@db.uevcwhvpvflejgagjher.supabase.co:5432/postgres
```

## 📋 How to Use This Connection String

### Option 1: Railway Backend Deployment

1. Go to your Railway project
2. Select your backend service
3. Go to **Variables** tab
4. Add/Update:
   ```
   DATABASE_URL=postgresql://postgres:0782194138%40Steve@db.uevcwhvpvflejgagjher.supabase.co:5432/postgres
   ```
5. Railway will automatically redeploy

### Option 2: Fly.io Backend Deployment

```bash
flyctl secrets set DATABASE_URL="postgresql://postgres:0782194138%40Steve@db.uevcwhvpvflejgagjher.supabase.co:5432/postgres"
```

### Option 3: Render Backend Deployment

1. Go to your Render service
2. Environment tab
3. Add/Update:
   ```
   DATABASE_URL=postgresql://postgres:0782194138%40Steve@db.uevcwhvpvflejgagjher.supabase.co:5432/postgres
   ```

## 🔒 Security Note

**Important:** This connection string contains your database password. 
- ✅ Safe to use in environment variables on hosting platforms
- ❌ Never commit this to Git
- ✅ Already in `.gitignore` (`.env` files are ignored)

## ✅ Verify Connection

After setting the environment variable, your backend should automatically connect. Check:
1. Backend logs for "Connected to PostgreSQL database" message
2. Test API endpoints that require database access
3. Check Supabase dashboard → Database → Connections to see active connections

## 🛠️ Troubleshooting

**Connection fails?**
- Make sure password is URL-encoded (`%40` instead of `@`)
- Verify no extra spaces in connection string
- Check Supabase project is active (not paused)

**Still having issues?**
- Try using Supabase connection pooler instead (better for serverless)
- Go to Supabase → Settings → Database → Connection Pooling
- Use the pooler connection string (port 6543 instead of 5432)

