# Alpha International

Marketing site for Alpha International.

## Status

Placeholder "under construction" page is live in [`index.html`](index.html). The
full site has not been started yet.

## Structure

```
.
├── index.html      # Under-construction landing page (self-contained, inline CSS)
├── assets/
│   └── logo.png    # Primary logo, 2640x840, dark background baked in
└── README.md
```

## Local preview

No build step — it's a static page. Either open `index.html` directly, or serve it:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Brand

| Token       | Value     | Use                          |
| ----------- | --------- | ---------------------------- |
| Background  | `#14181D` | Page background (matches logo) |
| Accent      | `#2B9ADB` | Links, highlights, the mark   |
| Accent deep | `#1E7EC1` | Gradients, hover depth        |
| Text        | `#F2F5F8` | Headings and body             |
| Muted text  | `#93A1B0` | Secondary copy               |

Typeface: Inter (Google Fonts).

## TODO

- [ ] Replace the placeholder contact address in `index.html`
- [ ] Decide on the stack for the real site
- [ ] Add a favicon at proper sizes (currently reuses the full logo)
