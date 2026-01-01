# Deployment Guide

## Backend
The backend is a Node.js/Express app.

### Option 1: Render / Heroku
1. Connect your repository.
2. Set Build Command: `npm install`
3. Set Start Command: `npm start`
4. **Environment Variables**:
   - `PORT`: (Set by host)
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to secret json, OR provide raw JSON in a variable and write it to file on start.
   - `FIREBASE_PROJECT_ID`: Your project ID.

### Option 2: Docker
1. Create `Dockerfile` in `backend/`.
2. Build: `docker build -t neet-backend backend/`
3. Run: `docker run -p 5000:5000 --env-file .env neet-backend`

## Frontend
The frontend is a Vite Static Site.

### Vercel / Netlify
1. Connect repository.
2. Root directory: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. **Environment Variables**:
   - Copy all `VITE_FIREBASE_...` variables from your local `.env`.

## Database (Firestore)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Deploy Rules: `firebase deploy --only firestore:rules`
4. Deploy Indexes: `firebase deploy --only firestore:indexes`

## Post-Deployment Setup (Critical)
1.  **Create Admin**: After deploying, you must grant yourself admin access.
    -   Run locally: `node backend/setAdminClaim.js <your-email> true`
    -   Or use the Firebase Console if you know how to set custom claims.
2.  **Upload Data**:
    -   Login to your live site.
    -   Go to **Admin Panel**.
    -   Upload `distribution_2024.json` (General fallback).
    -   Upload `distribution_2024_OBC.json` (Specific category data).
    -   *If you skip this, predictions will fail or use empty data.*

