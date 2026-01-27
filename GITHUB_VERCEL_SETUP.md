# 🚀 AI Task Master - Deployment Guide

> **Follow these steps to deploy your project to GitHub and Vercel**

## Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top-right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `ai-task-master` (or your choice)
   - **Description**: "AI-powered task management system"
   - **Public** (for portfolio)
   - Leave other options as default
4. Click **"Create repository"**
5. Copy the repository URL (you'll need it next)

## Step 2: Push Code to GitHub

Run these commands in your terminal:

```bash
cd c:\Users\User\OneDrive\Desktop\react\react

# Set the remote URL (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/ai-task-master.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

⚠️ **Replace**:
- `YOUR_USERNAME` with your GitHub username
- `ai-task-master` with your repository name

## Step 3: Deploy to Vercel

### Option 1: Automatic (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub
4. Click **"Add New"** → **"Project"**
5. Select your `ai-task-master` repository
6. Click **"Import"**
7. **Important**: Add Environment Variables:
   - Click **"Environment Variables"**
   - Add: `VITE_GOOGLE_GEMINI_API_KEY` = your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
8. Click **"Deploy"**

Your app will be live at: `https://your-project-name.vercel.app`

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel (opens browser)
vercel login

# Deploy to Vercel
vercel --prod

# Add environment variable when prompted
```

## Step 4: Set Your Gemini API Key

### Get Your API Key:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Get API Key"**
3. Create a new API key in Google Cloud Console
4. Copy the full key

### Add to Vercel:

1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. **Name**: `VITE_GOOGLE_GEMINI_API_KEY`
6. **Value**: Paste your API key
7. Click **"Save"**
8. Click **"Redeploy"** to apply changes

## Step 5: Verify Deployment ✅

Check these points:

- [ ] Visit your Vercel URL (no 404 errors)
- [ ] App loads without errors
- [ ] Upload a test file (PDF, DOCX, etc.)
- [ ] AI summary generates correctly
- [ ] All features work (buttons, modals, etc.)
- [ ] Check browser console (F12) - no red errors

## 🛠️ If You Get 404 Errors

The `vercel.json` file is already configured to prevent 404 errors:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes go to `/index.html` for React Router (SPA).

## 🔐 Important Security Notes

⚠️ **NEVER**:
- Commit `.env` files to git (already in `.gitignore`)
- Share API keys in code or screenshots
- Post API keys in GitHub issues

✅ **DO**:
- Add API key via Vercel dashboard only
- Keep `.env.local` local only
- Use different keys for dev and production (optional)

## 📊 Monitoring Your Deployment

After deployment, check:

1. **Vercel Dashboard**:
   - Deployments tab → Check latest deployment
   - Analytics tab → View performance metrics
   - Settings → Verify environment variables

2. **Build Logs**:
   - If deployment fails, check "Build & Development Settings"
   - Build Command: `npm run build`
   - Output Directory: `dist`

## 🐛 Troubleshooting

### Build Failed
- Check build logs in Vercel dashboard
- Run `npm run build` locally
- Verify all dependencies installed: `npm install`

### 404 Errors After Deploy
- Verify `vercel.json` is committed to git
- Check rewrites configuration
- Clear Vercel cache: Settings → scroll to "Danger Zone"

### API Key Not Working
- Verify key is added to Vercel environment variables
- Check key is correct from Google AI Studio
- Redeploy after adding key

### Slow Performance
- Check Vercel Analytics
- Optimize images in `public/` folder
- Monitor API response times

## ✅ Success Checklist

- [x] Git repository initialized
- [x] Code committed locally
- [x] GitHub repository created
- [x] Code pushed to GitHub
- [x] Vercel account created
- [x] Project imported to Vercel
- [x] Environment variable added
- [x] Deployment completed
- [x] App is live and working

## 🎉 You're Done!

Your AI Task Master is now live on the internet! 🚀

**Share your URL**: `https://your-project-name.vercel.app`

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- GitHub Help: https://docs.github.com
- Google AI: https://ai.google.dev
