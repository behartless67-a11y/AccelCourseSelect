# Deployment Guide - Accelerated Course Selection System

## Option 1: Deploy to Render.com (Recommended - All-in-One)

### Backend Deployment

1. **Push code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create Render Account**:
   - Go to https://render.com
   - Sign up with GitHub

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `accel-course-api`
     - **Region**: Oregon (US West)
     - **Branch**: `main`
     - **Root Directory**: leave blank
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server/index-mock.js`
     - **Instance Type**: Free

4. **Add Environment Variables**:
   - Click "Environment" tab
   - Add these variables:
     ```
     NODE_ENV=production
     JWT_SECRET=[Generate a random string]
     CORS_ORIGIN=[Will add after frontend deploy]
     ```

5. **Deploy**: Click "Create Web Service"
   - Note the URL (e.g., `https://accel-course-api.onrender.com`)

### Frontend Deployment

1. **Create Static Site**:
   - Click "New +" → "Static Site"
   - Connect same GitHub repository
   - Configure:
     - **Name**: `accel-course-frontend`
     - **Branch**: `main`
     - **Root Directory**: `client`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`

2. **Add Environment Variable**:
   - Add:
     ```
     VITE_API_URL=https://accel-course-api.onrender.com/api
     ```
     (Replace with your actual backend URL from step 5 above)

3. **Deploy**: Click "Create Static Site"
   - Note the URL (e.g., `https://accel-course-frontend.onrender.com`)

4. **Update Backend CORS**:
   - Go back to backend service
   - Update `CORS_ORIGIN` environment variable with frontend URL
   - Service will auto-redeploy

---

## Option 2: Deploy Frontend to Vercel + Backend to Render

### Backend (Render)

Follow steps 1-5 from Option 1 above.

### Frontend (Vercel)

1. **Push to GitHub** (if not done)

2. **Go to Vercel**:
   - https://vercel.com
   - Login with GitHub

3. **Import Project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

4. **Add Environment Variable**:
   - Go to Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://accel-course-api.onrender.com/api
     ```

5. **Deploy**
   - Note the URL (e.g., `https://accel-course.vercel.app`)

6. **Update Backend CORS**:
   - Go to Render backend service
   - Update `CORS_ORIGIN` with Vercel URL
   - Save (auto-redeploys)

---

## Testing the Deployment

1. Visit your frontend URL
2. Try logging in with:
   - Email: `student1@virginia.edu`
   - Password: (anything - TEST MODE)
3. You should see all 18 courses!

---

## Important Notes

- **Free tier limits**:
  - Render free services sleep after 15 min of inactivity (first request takes ~30 seconds to wake up)
  - 750 hours/month of runtime

- **For production**:
  - Remove TEST MODE login (add password validation back)
  - Add PostgreSQL database
  - Use paid tier for always-on service

---

## Troubleshooting

### Backend won't start
- Check environment variables are set
- Check build logs in Render dashboard

### Frontend can't connect to backend
- Verify `VITE_API_URL` is correct
- Check CORS_ORIGIN on backend matches frontend URL
- Open browser console for errors

### WebSocket issues
- Ensure backend URL uses `https://` not `http://`
- WebSockets automatically upgrade to `wss://` in production

---

## Next Steps After Deployment

1. Share URL with your colleague
2. Test with multiple users simultaneously
3. Plan PostgreSQL migration for real data
4. Add proper authentication (remove TEST MODE)
