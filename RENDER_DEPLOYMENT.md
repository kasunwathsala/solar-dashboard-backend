# Render Deployment Guide - Solar Dashboard Backend

## Prerequisites
- GitHub repository with your code
- MongoDB Atlas database (free tier works)
- Clerk account for authentication
- Stripe account (optional - for payments)

## Step 1: Prepare Your Repository
1. Ensure all changes are committed and pushed to GitHub
2. Verify `.env.example` is in the repository (for reference)
3. Make sure `.env` is in `.gitignore` (never commit secrets!)

## Step 2: Create Web Service on Render

### Basic Settings
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Choose the repository: `solar-dashboard-backend`

### Service Configuration
- **Name**: `solar-dashboard-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `core_backend/solar-dashboard-backend`
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free` (or paid if needed)

## Step 3: Environment Variables

Add ALL these environment variables in Render:

### Required Variables
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/core?retryWrites=true&w=majority
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxx
PORT=8002
FRONTEND_URL=https://your-frontend-url.netlify.app/
```

### Optional (Stripe - leave empty if not using)
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx
```

### How to Add Environment Variables in Render:
1. In your Render service dashboard
2. Go to "Environment" tab
3. Click "Add Environment Variable"
4. Add each variable one by one
5. Click "Save Changes"

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Start the server (`npm start`)

## Step 5: Verify Deployment

### Check Logs
1. Go to your service dashboard
2. Click "Logs" tab
3. Look for:
   - ✅ "Connected to MongoDB successfully!"
   - ✅ "Server running on port 8002"
   - ⚠️ If you see "STRIPE_SECRET_KEY not found" - that's OK if not using Stripe

### Test Your API
Your API will be available at: `https://your-service-name.onrender.com`

Test endpoints:
```bash
# Health check
curl https://your-service-name.onrender.com/api/solar-units

# Should return empty array or your data
```

## Step 6: Update Frontend

Update your frontend `.env` to point to the Render URL:
```
VITE_API_BASE_URL=https://your-service-name.onrender.com
```

## Common Issues and Solutions

### Issue 1: "Neither apiKey nor config.authenticator provided"
**Solution**: Make sure `STRIPE_SECRET_KEY` is set in Render environment variables
- If not using Stripe, that's fine - the app will work without it
- The warning is expected if Stripe is not configured

### Issue 2: Cannot connect to MongoDB
**Solution**: 
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Go to MongoDB Atlas → Network Access → Add IP Address → "Allow Access from Anywhere"

### Issue 3: Build fails
**Solution**:
- Check that `Root Directory` is set to `core_backend/solar-dashboard-backend`
- Verify `package.json` scripts are correct
- Check logs for specific TypeScript errors

### Issue 4: Server crashes on start
**Solution**:
- Check logs for specific error
- Ensure all required environment variables are set
- Verify MongoDB connection string is correct

## Free Tier Limitations

Render's free tier:
- ✅ Spins down after 15 minutes of inactivity
- ⚠️ First request after sleep takes ~30 seconds to wake up
- ✅ 750 hours/month free (enough for one service)
- ✅ Automatic HTTPS

## Upgrading to Paid Plan

For production:
- No sleep/spin down
- Better performance
- Custom domains
- More resources

## Need Help?

1. Check Render logs first (most issues show up there)
2. Verify environment variables are set correctly
3. Test MongoDB connection separately
4. Check GitHub repository has latest code

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] All environment variables added
- [ ] Build successful (green status)
- [ ] No errors in logs
- [ ] API responds to requests
- [ ] Frontend connected to backend
- [ ] Database connected successfully

## Your Deployed URLs

After deployment, save these:
- **Backend API**: https://your-service-name.onrender.com
- **Frontend**: https://your-frontend-url.netlify.app
- **MongoDB**: (your Atlas connection string)

---

**Note**: First deployment takes 5-10 minutes. Subsequent deployments are faster.
