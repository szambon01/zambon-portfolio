# Steven Zambon Portfolio — Setup Guide

## File Structure
```
zambon-site/
├── index.html              ← Your portfolio site
├── admin.html              ← Admin dashboard (password protected)
├── projects.json           ← Your project data
├── netlify.toml            ← Netlify config
└── netlify/
    └── functions/
        ├── projects.js     ← Serves projects.json
        ├── save-projects.js ← Saves edits back to GitHub
        └── upload-image.js  ← Uploads images to Cloudinary
```

---

## One-Time Setup (30 minutes)

### 1. Create accounts (all free)
- **GitHub** — github.com (stores your code and projects.json)
- **Netlify** — netlify.com (hosts the site)
- **Cloudinary** — cloudinary.com (stores your thumbnail images)

### 2. Push to GitHub
1. Create a new repository on GitHub (e.g. `zambon-portfolio`)
2. Upload all files in this folder to that repo

### 3. Connect to Netlify
1. Go to netlify.com → "Add new site" → "Import from Git"
2. Choose your GitHub repo
3. Build settings: leave blank (no build command needed)
4. Click "Deploy site"

### 4. Set Environment Variables
In Netlify: Site Settings → Environment Variables → Add:

| Key | Value |
|-----|-------|
| `ADMIN_PASSWORD` | A strong password you choose |
| `GITHUB_TOKEN` | Your GitHub personal access token (Settings → Developer settings → Personal access tokens → Tokens classic → generate with `repo` scope) |
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | `zambon-portfolio` (your repo name) |
| `GITHUB_BRANCH` | `main` |
| `CLOUDINARY_CLOUD_NAME` | Found in your Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Found in your Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Found in your Cloudinary dashboard |

### 5. Redeploy
After adding env vars: Deploys → "Trigger deploy" → "Deploy site"

---

## Using the Admin
1. Go to `yoursite.netlify.app/admin.html`
2. Enter your `ADMIN_PASSWORD`
3. Edit titles, directors, years, video URLs, and upload thumbnails
4. Click **Save & Publish** — changes go live in ~30 seconds

## Adding a Custom Domain
Netlify: Domain Settings → Add custom domain → follow the DNS instructions.
