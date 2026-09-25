# Alpha International

Site for **alphainternational.energy**, hosted on Cloudflare Workers.

## Status

`site-v1` holds the first real site: a single long-form page covering the
opportunity, the edge, track record, global mandate, platform, principals and
investor contact. It replaced the under-construction holding page, which is
still on `main` and in history if it is ever needed again.

The page was imported verbatim in 75a5afd so that subsequent fixes read as a
clean diff. The open items below are not yet addressed.

## Structure

```
.
├── public/             # Everything in here is served as-is by the Worker
│   ├── index.html      # Homepage, served at /
│   ├── contact.html    # Contact page, served at /contact
│   ├── news.html       # News and announcements, served at /news
│   ├── robots.txt
│   ├── _headers        # Security + cache headers
│   └── assets/
│       ├── site.css    # All styles, shared by all pages
│       ├── site.js     # Footer year, mobile menu, contact form
│       ├── mark.svg    # Circular mark, traced from logo.png. Favicon + chrome
│       └── logo.png    # Full lockup, 2640x840. Used for og:image
├── wrangler.jsonc      # Worker + custom domain config
└── package.json
```

Styles and behaviour live in `assets/site.css` and `assets/site.js`, shared by
all three pages so they cannot drift apart. Every graphic is still inline SVG —
there are no `<img>` tags anywhere. The header and footer *markup* is duplicated
across the three HTML files, since there is no build step; a nav change has to be
made in each of them by hand.

This is an **assets-only Worker** — there is no `main` script, so Cloudflare
serves `public/` directly with no code in the request path. Add a `main` entry
to `wrangler.jsonc` if the site ever needs server-side logic.

## Adding a news item

`news.html` currently shows an empty state. The markup for a list item sits
directly above it in an HTML comment, with notes on which variant to use:
`<a>` when the item links to a full article or PDF, `<div class="inner">` when
the summary is the whole thing. Delete the `.empty` block, uncomment the
`<ul class="newslist">`, and add one `<li class="item">` per entry, newest
first. Set `<time datetime="YYYY-MM-DD">` to the real date — that attribute is
what machines read, the visible text is for people.

Articles that need their own page have nowhere to live yet; `/news/<slug>`
would need a file per article under `public/news/`.

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

## Open items

### Needs a decision or sign-off, not a code change

- **The contact form has no destination.** `CONTACT_ENDPOINT` at the top of the
  contact-form block in `assets/site.js` is an empty string, so the form shows a
  "not connected" notice and its submit button is disabled. It will not silently
  drop what someone types, but nobody can reach you through it either. Set that
  constant to the receiving URL and both the notice and the disabled state clear
  themselves. **This must be done before the site goes live.**
- **Named third parties.** ExxonMobil Trading and Halliburton are presented as
  commercial and technical partners, and a production-partnership framework
  with PDVSA is described. These imply relationships those parties may want to
  approve in writing.
- **Sanctions citation.** The footer asserts compliance under OFAC General
  Licences 52 and 56. General licences are amended and revoked, so counsel
  should confirm this is current as at the publication date.

### Functional

- **Section 02 is unreachable from the nav.** "The edge" has `id="edge"` and a
  full section, but is absent from the header nav, so the visible numbering
  jumps 01 → 03 for anyone navigating by menu.

### Accessibility

- Contact card links inherit body colour with `text-decoration:none`, so the
  email and both websites render as plain text with no affordance.
- No skip link to main content.
- The horizontally scrolling comparison table (`.tblwrap`) has no `tabindex`,
  so it cannot be scrolled by keyboard.
- The copy button's "Copied" state change has no `aria-live` announcement.

### Polish

- **The Joe Mach attribution is now inconsistent.** The track record intro no
  longer names him, but two case cards still read "Led by Joe Mach and Don
  Wolcott" and "with Mach and Wolcott". Decide whether the name stays or goes
  throughout.

- Section 07 uses `.eyebrow` where 01–06 use `.num`, so its label is styled
  differently from every other section.
- Straight quotes throughout (`"Why?"`, `"Cheap"`, `"illustrative"`) on a page
  that otherwise uses proper em-dashes and middots.
- No `scroll-margin-top` under the 68px sticky header, so anchor jumps tuck
  each section's top border beneath it.

### Worth re-checking at launch

- `not_found_handling` is `single-page-application`, so every unmatched path
  returns the page with a `200`. That suits a genuine one-page site, but it
  does mean typos and stale links resolve silently instead of 404ing.
- `index.html` no longer carries a `noindex` tag — the v1 page is meant to be
  indexed. `robots.txt` allows crawling. Confirm that is intended before the
  first deploy.

## Brand

Tokens as defined in `index.html`:

| Token        | Value     | Use                                   |
| ------------ | --------- | ------------------------------------- |
| `--carbon`   | `#16181D` | Body text, philosophy section         |
| `--navy`     | `#0B2A45` | Hero and global-mandate backgrounds   |
| `--navy-deep`| `#071D31` | Footer                                |
| `--blue`     | `#1B8DD1` | Accent, links, emphasis               |
| `--vapor`    | `#E9F4FB` | Highlighted cells and panels          |
| `--steel`    | `#5C6B78` | Eyebrows, captions                    |
| `--ink-soft` | `#3A4048` | Body copy                             |
| `--brass`    | `#B5894A` | Acquisition marker, live-status accent|
| `--line`     | `#D9DEE4` | Rules and borders                     |

Typefaces: Cormorant Garamond (display serif) and Inter (UI sans), both from
Google Fonts.

`assets/mark.svg` is the circular mark, auto-traced from `logo.png` by
classifying pixels against the three source colours and contour-following the
result. It is flat `--blue`, where the source PNG has a subtle gradient across
the ring; at header and favicon sizes that difference is not visible. It is
inlined once in the page as a `<symbol>` and referenced twice with `<use>`.

Note that `assets/logo.png` was built on `#14181D` with a `#2B9ADB` accent,
which is close to but not the same as `--carbon` and `--blue`. Re-export the
mark against the site tokens if it is ever placed next to page chrome.
