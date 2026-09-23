# Alpha International

Site for **alphainternational.energy**, hosted on Cloudflare Workers.

## Status

A placeholder "under construction" page is the entire site right now. The real
site has not been started.

## Structure

```
.
├── public/             # Everything in here is served as-is by the Worker
│   ├── index.html      # Holding page (self-contained, inline CSS)
│   ├── robots.txt
│   ├── _headers        # Security + cache headers
│   └── assets/
│       └── logo.png    # Primary logo, 2640x840, dark background baked in
├── wrangler.jsonc      # Worker + custom domain config
└── package.json
```

This is an **assets-only Worker** — there is no `main` script, so Cloudflare
serves `public/` directly with no code in the request path. Add a `main` entry
to `wrangler.jsonc` if the site ever needs server-side logic.

## Local development

```bash
npm install
npm run dev          # http://localhost:8787
```

`wrangler dev` runs the real Workers runtime locally, so `_headers` and the
not-found behaviour match production.

## Deploying

First time only — authenticate and make sure the zone exists:

```bash
npx wrangler login
```

`alphainternational.energy` must already be an active zone in the same
Cloudflare account, otherwise the `routes` block in `wrangler.jsonc` will fail
to attach. Then:

```bash
npm run deploy
npm run tail         # live request logs
```

## Things to revisit before the real site ships

- **`not_found_handling` is `single-page-application`**, so *every* unmatched
  path returns the holding page with a `200`. That's deliberate while this is a
  placeholder, but it produces soft-404s. Switch to `404-page` (and add
  `public/404.html`) once there is real content.
- **`index.html` carries `<meta name="robots" content="noindex, nofollow">`** to
  keep the placeholder out of search results. Remove it at launch. `robots.txt`
  intentionally allows crawling so that tag can actually be read.
- **The favicon reuses the full 2640x840 logo**, which renders as an illegible
  smear in a browser tab. Cut a square version of the circular mark.
- **The page has no contact route.** Add one once an address exists (the
  markup has no `.contact` block or link styles any more; both were removed).
- **Inter is loaded from Google Fonts**, so the page needs network access to
  render as designed; it falls back to system sans otherwise.

## Brand

| Token       | Value     | Use                            |
| ----------- | --------- | ------------------------------ |
| Background  | `#14181D` | Page background (matches logo) |
| Accent      | `#2B9ADB` | Links, highlights, the mark    |
| Accent deep | `#1E7EC1` | Gradients, hover depth         |
| Text        | `#F2F5F8` | Headings and body              |
| Muted text  | `#93A1B0` | Secondary copy                 |

Typeface: Inter (Google Fonts).
