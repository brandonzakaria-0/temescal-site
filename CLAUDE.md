# Temescal Insurance website

Static marketing site for Temescal Insurance (working name), a licensed California insurance brokerage
for high-value homes in wildfire country. Owner: Brandon Zakaria. Hosted on Cloudflare Workers (static
assets only, see `wrangler.jsonc`) from this repo's `docs/` folder; every push to `main` redeploys.
Deploy results show up as the "Workers Builds: temescal-site" check run on each commit
(`gh api repos/brandonzakaria-0/temescal-site/commits/<sha>/check-runs`).

## How to make a change

1. Edit sources, never `docs/` directly: `config.json`, `src/pages/*.html`, `src/pages.json`,
   `src/partials/*.html`, `src/assets/`.
2. Run `python3 build.py` (Python 3, no dependencies). It regenerates `docs/`.
3. Commit sources and `docs/` together, then push to `main`.

Site-wide values (brand name, phone, email, license number, Calendly link, form endpoint, site URL,
`noindex` staging switch, licensee legal name, location) live only in `config.json` and reach pages as `{{tokens}}`.
Use the tokens; do not hard-code those values in pages.

## Hard rules for all copy and content

- No em dashes anywhere. Use commas, colons, periods, or parentheses.
- Every page must keep the footer license disclosure (`src/partials/footer.html`).
- No guarantees of coverage, approval, price, or timing. No "cheapest", "save X%", "only", "first",
  "best", "#1", or bargain language ("deals", "affordable", "low cost").
- Temescal is a broker, not an insurer: never "our policies".
- Surplus lines copy must say these insurers are not licensed by California and not backed by the
  state guarantee fund.
- No AI-generated photos or illustrations. Real licensed or commissioned photography only. No fire,
  smoke, or burned-home imagery.
- Numbers need a documented source. Unproven pilot targets (response time, quote speed) stay off the
  site until Brandon approves a number. No [bracketed] placeholders on any page (Brandon, Nov 2026).
- Advisers, partners, insurer names or logos, and testimonials appear only with written permission.
- Keep `noindex: true` until Brandon says the site is launching.
