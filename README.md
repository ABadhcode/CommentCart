# CommentCart

Turn a messy product comment section into structured insights: what people love, common complaints, real experiences, alternatives and trust signals.

Design Thinking (MDM 15) FA2 prototype, PCCoE Pune.
Team: Roshani Endole, Tanmay Rane, Tanishka Nikam, Arnav Badhan.

## How it works
1. Type a product name to get search links for YouTube, Reddit, TikTok and Instagram.
2. Open a post, copy its comments, paste them into the app (one per line).
3. Press **Analyse comments**. Noise and promotional comments are filtered, and the rest are grouped into themes.

CommentCart does not scrape any site. It only reads comments you paste.

## Run it on your PC
It is plain HTML, CSS and JavaScript, so there is nothing to install.

**Easiest:** double-click `index.html`. (Needs internet only for the Google Fonts.)

**Local server (recommended):**
```bash
cd commentcart
python -m http.server 8000      # Windows: py -m http.server 8000
```
Then open http://localhost:8000. If you have Node instead: `npx serve .`

**VS Code:** install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server".

## Put it on GitHub
```bash
cd commentcart
git init
git add .
git commit -m "CommentCart prototype"
git branch -M main
git remote add origin https://github.com/<your-username>/commentcart.git
git push -u origin main
```
Create the empty repo on github.com first (no README, no .gitignore). To get a live link: repo **Settings > Pages > Deploy from a branch > main / (root)**. Your site appears at `https://<your-username>.github.io/commentcart/`.

## Analysis engine
The app uses keyword rules (English plus some Hinglish) in `js/app.js` (`RX` and `TH`). Inside claude.ai it can use Claude instead; outside it, the rules run. To improve accuracy, add words to those lists.

## Structure
```
index.html      page and method sections
css/style.css   styles (light and dark)
js/app.js       parsing, analysis, rendering, export
```
