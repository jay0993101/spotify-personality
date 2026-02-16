# Spotify Personality

A minimal web app that connects to Spotify and generates a personality profile from your listening habits. Uses top artists, tracks, and audio features to identify your music archetype.

## Features

- **Spotify OAuth (PKCE)** – Secure login, no backend required
- **Personality profile** – Archetypes like Energy Seeker, Chill Seeker, Melancholic, Groove Master, and more
- **Audio analysis** – Energy, danceability, mood, and acousticness from your top tracks
- **Top genres** – See what you listen to most
- **Deploy to GitHub Pages** – Static build, works with GitHub Actions

## Setup

### 1. Create a Spotify app

1. Go to [Spotify for Developers](https://developer.spotify.com/dashboard)
2. Create an app
3. Add redirect URIs:
   - Local: `http://localhost:5173` or `http://127.0.0.1:5173`
   - Production: `https://YOUR_USERNAME.github.io/spotify-personality/`
4. Copy the **Client ID**

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your Client ID:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy to GitHub Pages

1. Create a new repo (e.g. `spotify-personality`) and push this project.
2. Add a GitHub secret:
   - Settings → Secrets and variables → Actions
   - New repository secret: `VITE_SPOTIFY_CLIENT_ID` = your Spotify Client ID
3. Enable GitHub Pages:
   - Settings → Pages → Source: **GitHub Actions**
4. Push to `main` – the workflow will build and deploy.

Your app will be at: `https://YOUR_USERNAME.github.io/spotify-personality/`

Make sure this exact URL is in your Spotify app’s Redirect URIs.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- Spotify Web API (PKCE auth, top artists/tracks, audio features)
