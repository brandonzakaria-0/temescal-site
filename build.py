#!/usr/bin/env python3
"""Builds the static site into docs/ (what GitHub Pages serves).

    python3 build.py

Edit config.json for site-wide settings (name, phone, license, Calendly, form endpoint),
src/pages/*.html for page content, and src/partials/ for the header and footer.
No dependencies beyond Python 3.
"""
import json, os, re, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'docs')

cfg = json.load(open(os.path.join(ROOT, 'config.json')))
pages = json.load(open(os.path.join(SRC, 'pages.json')))
base = cfg['base_path'].rstrip('/')
site = cfg['site_url'].rstrip('/') + base

TOKENS = {
    'base': base,
    'brand': cfg['brand'],
    'phone': cfg['phone'],
    'phone_tel': cfg['phone_tel'],
    'email': cfg['email'] or '[Email]',
    'email_address': cfg['email'],
    'license_individual': cfg['license_individual'],
    'calendly_url': cfg['calendly_url'],
}

FONTS = ('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'
         '&family=Inter:wght@400;500;600&display=swap')


def read(*p):
    return open(os.path.join(SRC, *p), encoding='utf-8').read()


def fill(s):
    if not cfg['email']:
        # no public email yet: drop email links rather than show a placeholder
        s = re.sub(r'<a href="mailto:\{\{email_address\}\}"[^>]*>\{\{email\}\}</a>( or )?', '', s)
    s = re.sub(r'<!--if:(\w+)-->(.*?)<!--endif-->',
               lambda m: m.group(2) if cfg.get(m.group(1)) else '', s, flags=re.S)
    for k, v in TOKENS.items():
        s = s.replace('{{%s}}' % k, v)
    return s


def esc(s):
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


header = '<div class="site-header">\n' + read('partials', 'header.html') + '</div>'
footer = read('partials', 'footer.html')

JSONLD = {
    '@context': 'https://schema.org',
    '@type': 'InsuranceAgency',
    'name': cfg['brand'] + ' Insurance',
    'url': site + '/',
    'telephone': cfg['phone_tel'],
    'image': site + '/assets/img/og-image.jpg',
    'areaServed': {'@type': 'State', 'name': 'California'},
    'founder': {'@type': 'Person', 'name': 'Brandon Zakaria'},
}


def layout(slug, meta, body):
    title = fill(meta['title'])
    desc = fill(meta['description'])
    url = site + meta['path']
    robots = '<meta name="robots" content="noindex, nofollow">\n' if cfg['noindex'] else ''
    jsonld = ('<script type="application/ld+json">%s</script>\n' % json.dumps(JSONLD)) if slug == 'index' else ''
    site_js = {
        'formEndpoint': cfg['form_endpoint'], 'phone': cfg['phone'], 'phoneTel': cfg['phone_tel'],
        'calendlyUrl': cfg['calendly_url'],
    }
    body = body.replace('{{> header}}', header if meta.get('header', True) else '')
    body = body.replace('{{> footer}}', footer)
    if 'id="main"' not in body:
        body = re.sub(r'<main\b', '<main id="main"', body, count=1)
    body = fill(body)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
{robots}<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{esc(cfg['brand'])} Insurance">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}/assets/img/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F6F3EC">
<link rel="icon" href="{base}/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{base}/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS.replace('&', '&amp;')}">
<link rel="stylesheet" href="{base}/assets/css/site.css">
{jsonld}<script>window.SITE = {json.dumps(site_js)};</script>
</head>
<body class="{meta.get('body_class', '')}">
<a class="skip-link" href="#main">Skip to content</a>
{body}
<script src="{base}/assets/js/site.js" defer></script>
</body>
</html>
'''


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    shutil.copytree(os.path.join(SRC, 'assets'), os.path.join(OUT, 'assets'))
    for slug, meta in pages.items():
        html = layout(slug, meta, read('pages', slug + '.html'))
        target = os.path.join(OUT, meta['path'].strip('/'), 'index.html')
        os.makedirs(os.path.dirname(target), exist_ok=True)
        open(target, 'w', encoding='utf-8').write(html)
        print('built', meta['path'])
    # 404 page
    nf = ('{{> header}}<main style="max-width: 820px; margin: 0 auto; padding: 120px 24px; text-align: center; '
          'font-family: Inter, Arial, sans-serif"><h1 style="font-family: \'Cormorant Garamond\', serif; font-weight: 500; '
          'font-size: 56px; margin: 0 0 16px">Page not found</h1><p style="color: #4B4A43">That page has moved or never existed. '
          '<a href="{{base}}/">Return home</a> or call <a href="tel:{{phone_tel}}">{{phone}}</a>.</p></main>{{> footer}}')
    open(os.path.join(OUT, '404.html'), 'w').write(layout('404', {
        'path': '/404.html', 'title': 'Page not found | {{brand}} Insurance',
        'description': 'Page not found.'}, nf))
    # robots and sitemap
    robots = 'User-agent: *\nDisallow: /\n' if cfg['noindex'] else 'User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n' % site
    open(os.path.join(OUT, 'robots.txt'), 'w').write(robots)
    urls = ''.join('  <url><loc>%s%s</loc></url>\n' % (site, m['path']) for m in pages.values())
    open(os.path.join(OUT, 'sitemap.xml'), 'w').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n')
    open(os.path.join(OUT, '.nojekyll'), 'w').write('')
    if cfg.get('custom_domain'):
        open(os.path.join(OUT, 'CNAME'), 'w').write(cfg['custom_domain'] + '\n')
    print('done ->', OUT)


if __name__ == '__main__':
    main()
