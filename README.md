# stargazinghyderabad.com

Astro site for Stargazing Hyderabad (sessions by Beyond The Sky).

## Edit content
Most things you'll change are in **`src/data/site.ts`**: phone, WhatsApp, email,
prices, launch offer, programmes, meteor shower dates and FAQs.

| What | Where |
|---|---|
| Text in each section | `src/components/*.astro` |
| Page title / description (Google) | `src/pages/index.astro` |
| Colours, fonts, layout | `src/styles/global.css` |
| Star sky, meteors, constellations | `src/scripts/sky.ts` |
| Moon phase, best nights, booking form | `src/scripts/page.ts` |

## Run on your computer
```bash
npm install
npm run dev
```
Open http://localhost:4321. Changes show up as you save.

## Publish
Push to `main` on GitHub. The workflow in `.github/workflows/deploy.yml`
builds the site and uploads `dist/` to Hostinger over FTP.

One-time setup on GitHub → Settings → Secrets and variables → Actions:
- `FTP_SERVER` – from Hostinger hPanel → Files → FTP Accounts
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_DIR` (optional) – folder on the server, default `/public_html/`
