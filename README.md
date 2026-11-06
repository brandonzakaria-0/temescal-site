# Temescal Insurance website

Static site for Temescal Insurance (working name). Plain HTML, CSS and a little JavaScript, built by a
small Python script with no dependencies. Cloudflare Workers serves the `docs/` folder as static assets
(`wrangler.jsonc`; no build command, deploy command `npx wrangler deploy`).

## Edit and publish

1. Change what you need (see below).
2. Run `python3 build.py`. It rebuilds `docs/`.
3. Commit and push. Cloudflare redeploys automatically in a minute or two.

## Where things live

| What | File |
| --- | --- |
| Company name, phone, license number, Calendly link, form endpoint, site URL, staging switch | `config.json` |
| Page text and layout | `src/pages/<page>.html` |
| Page titles and search descriptions | `src/pages.json` |
| Header and footer (including the license disclosure) | `src/partials/header.html`, `src/partials/footer.html` |
| Shared styles | `src/assets/css/site.css` |
| Intake flow and referral form logic | `src/assets/js/site.js` |
| Photos | `src/assets/img/` |

Tokens like `{{brand}}`, `{{phone}}` and `{{license_individual}}` are filled in from `config.json` at build time,
so a rename or a new number is a one-line change.

## Settings in config.json

- `noindex`: `true` keeps search engines out while the site is in staging. Set to `false` at launch.
- `form_endpoint`: where the private review and referral forms are sent (for example a Formspree form URL).
  While it is empty, the forms show visitors your phone number and Calendly link instead of submitting.
- `site_url`: the public address, used for canonical links, the sitemap and social previews. Change it when the
  custom domain is connected.
- `base_path`: leave as `""` when the site is served from the root of a domain.
- `legal_name` and `location`: the licensee's legal name and principal place of business, used in the footer
  disclosure and on the About and Legal pages. Update both when the agency entity is licensed.

## Photo credits (Unsplash License)

Home: Jessica Christian. How it works: Kellen Riggin. Buying a home: Jakub Zerdzicki. Non-renewed: Spencer DeMera.
FAIR Plan: Julian Myles. Rebuilding: Hunter Owens. Make your home insurable: Don Stouder. Partners: GoodLifeConstruction.
About: Nick Mollenbeck. Portrait of Brandon Zakaria: supplied by Brandon.
