# Vercel Environment Variables Setup

You need to update/add these environment variables in your Vercel dashboard:

## Required Variables:

1. **DATABASE_URL**
   ```
   postgresql://postgres.jzncnaeucojqpnyndxkz:rjm8zwv*RVB-uvk9tea@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
   This uses the Transaction Pooler which is ideal for serverless functions.

2. **DIRECT_URL** (ADD THIS - Currently missing)
   ```
   postgresql://postgres:rjm8zwv*RVB-uvk9tea@db.jzncnaeucojqpnyndxkz.supabase.co:5432/postgres
   ```
   This is used for migrations only.

3. **SESSION_SECRET_KEY** (Already set correctly)
   ```
   8b92e271b91bfaababbf32be3487d304c0fc2e7b01776eb87a48ff42c254848c
   ```

4. **ENVIRONMENT** (Already set correctly)
   ```
   production
   ```

## Variables to Remove:

Remove these individual database variables as they're not needed:
- dbname
- user  
- host
- port
- password

## How to Update:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Delete the individual db variables (dbname, user, host, port, password)
4. Update DATABASE_URL to the full connection string above
5. Add DIRECT_URL with the value above
6. Redeploy

The application uses the full connection string, not individual parameters.