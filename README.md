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
│   ├── news/
│   │   ├── index.html  # News listing, served at /news/
│   │   └── <slug>.html # One file per article, served at /news/<slug>
│   ├── robots.txt
│   ├── _headers        # Security + cache headers
│   └── assets/
│       ├── site.css    # All styles, shared by all pages
│       ├── site.js     # Footer year, mobile menu, contact form
│       ├── mark.svg    # Circular mark, traced from logo.png. Favicon + chrome
│       └── logo.png    # Full lockup, 2640x840. Used for og:image
├── templates/
│   └── article.html    # Article template. NOT served — it sits outside public/
├── wrangler.jsonc      # Worker + custom domain config
└── package.json
```

Styles and behaviour live in `assets/site.css` and `assets/site.js`, shared by
every page so they cannot drift apart. All asset references are root-relative
(`/assets/…`) so that pages work at any depth — that matters now that articles
live one level down. Every graphic is inline SVG; there are no `<img>` tags.

The header and footer *markup* is duplicated across the HTML files, since there
is no build step; a nav change has to be made in each of them by hand. That is
the main cost of staying build-free, and it grows with each article.

This is an **assets-only Worker** — there is no `main` script, so Cloudflare
serves `public/` directly with no code in the request path. Add a `main` entry
to `wrangler.jsonc` if the site ever needs server-side logic.

## The contact form

The form on `/contact` POSTs JSON to a HighLevel inbound webhook, set as
`CONTACT_ENDPOINT` in `assets/site.js`. The endpoint answers CORS preflight
with `Allow-Origin: *`, so the browser posts to it directly and the site stays
assets-only with no Worker code.

Payload, one key per field:

```json
{
  "name":         "Jane Smith",
  "organisation": "Example Capital",
  "email":        "jane@example.com",
  "phone":        "+1 555 0100",
  "enquiry_type": "Investor briefing",
  "message":      "...",
  "source":       "alphainternational.energy"
}
```

`source` is added by the script so leads from this site can be told apart from
alpha.energy and alphalatinamerica.com in the same CRM. The honeypot field
`company_website` is stripped before sending; if it arrives filled the submit
is dropped silently, so it never reaches HighLevel.

If HighLevel needs to create contacts automatically it may want `first_name`
and `last_name` rather than a single `name` — map it in the workflow, or say
so and the form can send both.

Emptying `CONTACT_ENDPOINT` disables the form and falls back to a notice
pointing at `CONTACT_EMAIL`, rather than accepting input it cannot deliver.

## Publishing an article

Two files are involved: the article itself, and its entry in the listing.

1. **Write the page.** Copy `templates/article.html` to
   `public/news/<slug>.html`. It is then live at `/news/<slug>`. The template
   carries the full page chrome and a comment at the top explaining every
   `{{PLACEHOLDER}}`. Replace them all, then search the file for `{{` — nothing
   should be left.
2. **Add it to the listing.** `public/news/index.html` currently shows an empty
   state, with the list markup sitting above it in a comment. Delete the
   `.empty` block, uncomment `<ul class="newslist">`, and add one
   `<li class="item">` per entry, newest first.

Use the `<a href="/news/<slug>">` variant of a list item when there is a full
article to click through to, and the `<div class="inner">` variant when the
summary in the listing is the whole announcement and there is nowhere to go.

Set `<time datetime="YYYY-MM-DD">` to the real publication date in both places —
that attribute is what machines read, the visible text is for people. Keep the
listing summary and the article's `{{EXCERPT}}` saying the same thing, since the
excerpt is also what search results and social cards show.

Body helpers available inside `.article`: `<blockquote>` with `<cite>`,
`<div class="pull">` for a highlighted aside, `<figure>` with `<figcaption>`,
`<p class="note">` for small print, `<hr>` for a section break, and
`class="first"` on the opening paragraph for a drop cap.

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

- **The contact webhook URL is public.** It sits in `assets/site.js`, which is
  the only place a browser-side form can keep it, so anyone reading the page
  source can POST to it directly and flood the CRM. The honeypot field only
  stops naive bots that fill every input. If junk starts arriving, the fixes
  are Cloudflare Turnstile in front of the submit, or moving the POST behind a
  Worker so the URL never reaches the page.
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

- No skip link to main content.
- The horizontally scrolling comparison table (`.tblwrap`) has no `tabindex`,
  so it cannot be scrolled by keyboard.

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
