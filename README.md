# ⚽ FootballPost v2 — 100% Free AI Facebook Publisher

Post live football news to your Facebook page automatically — **completely free**.

## 🆓 What's free

| Service | Free Tier | Used For |
|---------|-----------|----------|
| [API-Football](https://www.api-football.com) | 100 req/day | Live scores, fixtures, standings, transfers, top scorers |
| [Unsplash](https://unsplash.com/developers) | 50 req/hr | Football images for each post |
| [Facebook Graph API](https://developers.facebook.com) | Free | Posting to your page |
| [GitHub Pages](https://pages.github.com) | Free | Hosting the app |

**No Anthropic / paid AI API needed.**

---

## 🚀 Deploy to GitHub Pages

### 1. Create repo
- GitHub → **New repository** → name it `footballpost`

### 2. Upload files
Use one of these methods:

**Method A — GitHub web (recommended for beginners):**
Upload all files EXCEPT the `.github` folder via drag-and-drop, then manually create `.github/workflows/deploy.yml`:
- Click **Add file → Create new file**
- Type the path: `.github/workflows/deploy.yml`
- Paste the contents of that file and commit

**Method B — Git CLI:**
```bash
git init
git add -A          # includes hidden .github folder
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/footballpost.git
git push -u origin main
```

### 3. Enable GitHub Pages
- Repo → **Settings** → **Pages** → Source: **GitHub Actions** → Save

Your live URL: `https://YOUR_USERNAME.github.io/footballpost/`

---

## 🔑 API Keys (enter inside the app)

### API-Football
1. Go to [api-sports.io](https://www.api-sports.io) → Sign up free
2. Dashboard → copy your **API Key**
3. Free plan: 100 requests/day

### Unsplash
1. Go to [unsplash.com/developers](https://unsplash.com/developers) → New Application
2. Copy the **Access Key**
3. Free plan: 50 requests/hour

### Facebook Page ID + Token
1. Open [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app → **Generate Access Token**
3. Add permissions: `pages_manage_posts`, `pages_read_engagement`
4. Exchange for a **Page Access Token**
5. Your Page ID is in your Facebook Page → **About** section

---

## 📱 Use on Phone
Open your GitHub Pages URL in Chrome/Safari → Share → **Add to Home Screen**

## 💻 Local Development
```bash
npm install
npm run dev
# Open http://localhost:5173/footballpost/
```
