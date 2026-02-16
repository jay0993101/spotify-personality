# Deployment Guide: Spotify Personality to GitHub Pages

Follow these steps in order to deploy your app.

---

## Prerequisites

- [ ] Node.js installed and `npm install` completed
- [ ] Spotify app created with Client ID
- [ ] `.env` file with `VITE_SPOTIFY_CLIENT_ID` set
- [ ] GitHub account

---

## Step 1: Create a GitHub Repository and Push

### 1a. Create the repository on GitHub

1. Go to **https://github.com**
2. Log in to your account
3. Click the **+** in the top-right → **New repository**
4. Fill in:
   - **Repository name:** `spotify-personality` (or any name you prefer)
   - **Description:** (optional) e.g. "Music personality profile from Spotify"
   - **Visibility:** Public
   - Leave **README**, **.gitignore**, and **License** unchecked (you already have these)
5. Click **Create repository**

### 1b. Push your local project

GitHub will show you commands. Use these (replace `YOUR_USERNAME` with your GitHub username):

```bash
cd /Users/moja/Documents/monty_cursor_projects/spotify-personality

# Add GitHub as remote (use your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/spotify-personality.git

# Rename branch to main if needed
git branch -M main

# Push
git push -u origin main
```

If your repo has a different name than `spotify-personality`, update the URL and the `base` in `vite.config.ts` to match (e.g. `/your-repo-name/`).

---

## Step 2: Add VITE_SPOTIFY_CLIENT_ID as a GitHub Secret

1. Open your repository on GitHub
2. Click **Settings** (top tabs)
3. In the left sidebar, under **Security**, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:
   - **Name:** `VITE_SPOTIFY_CLIENT_ID`
   - **Value:** Your Spotify Client ID (from the Spotify Developer Dashboard)
6. Click **Add secret**

---

## Step 3: Enable GitHub Pages (GitHub Actions)

1. Stay in your repo **Settings**
2. In the left sidebar, click **Pages** (under **Code and automation**)
3. Under **Build and deployment**:
   - **Source:** Select **GitHub Actions**
4. No other configuration needed; the workflow will deploy when you push to `main`

---

## Step 4: Add Production URL to Spotify Redirect URIs

1. Go to **https://developer.spotify.com/dashboard**
2. Open your app
3. Click **Settings**
4. In **Redirect URIs**, click **Add** and add:
   ```
   https://YOUR_USERNAME.github.io/spotify-personality/
   ```
   Replace `YOUR_USERNAME` with your GitHub username.
5. If your repo has a different name, use:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```
6. Click **Save**

---

## Step 5: Trigger the Deployment

1. Push any commit to `main`, or
2. Manually run the workflow:
   - Go to the **Actions** tab in your repo
   - Select **Deploy to GitHub Pages**
   - Click **Run workflow** → **Run workflow**

---

## Step 6: View Your Live App

After the workflow finishes (usually 1–2 minutes):

- **URL:** `https://YOUR_USERNAME.github.io/spotify-personality/`
- Open it and click **Connect with Spotify** to test

---

## Troubleshooting

| Problem | Solution |
|--------|----------|
| Build fails with "Missing VITE_SPOTIFY_CLIENT_ID" | Add the secret in Settings → Secrets and variables → Actions |
| "Invalid redirect URI" when connecting Spotify | Add the exact production URL to your Spotify app's Redirect URIs |
| 404 or blank page | Confirm the repo name matches `base` in `vite.config.ts` |
| Workflow doesn’t run | Check that it’s in `.github/workflows/deploy.yml` and committed |

---

## Changing the Repo Name

If you use a different repository name (e.g. `my-spotify-app`):

1. Update `vite.config.ts`:
   ```ts
   base: command === 'build' ? '/my-spotify-app/' : '/',
   ```
2. Add the matching redirect URI in Spotify: `https://YOUR_USERNAME.github.io/my-spotify-app/`
