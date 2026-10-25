// Build check: run with `node tests/check.mjs`. Exits 1 on any violation.
// Covers: STR keys EN = NL, banned writing patterns, internal links, sitemap = pages,
// strict-CSP readiness (no inline styles/scripts/handlers, no external requests), required headers.
// Engine render checks follow once the engine has its single entry point (phase 1).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const SITE = path.join(ROOT, 'site');
const fails = [];
const fail = (area, msg) => fails.push(`[${area}] ${msg}`);
const read = p => fs.readFileSync(p, 'utf8');

// ---------- STR: same keys in EN and NL ----------
const app = read(path.join(SITE, 'src/app.js'));
const strSrc = app.slice(app.indexOf('const STR='), app.indexOf('let LANGUI'));
const STR = vm.runInNewContext(strSrc.replace('const STR=', '(').replace(/;\s*$/, '') + ')');
const en = Object.keys(STR.en), nl = Object.keys(STR.nl);
en.filter(k => !(k in STR.nl)).forEach(k => fail('i18n', `missing in nl: ${k}`));
nl.filter(k => !(k in STR.en)).forEach(k => fail('i18n', `missing in en: ${k}`));

// ---------- banned writing patterns ----------
const BANNED = [
  [/—/, 'em dash'],
  [/niet alleen\b.*\bmaar ook/i, '"niet alleen X maar ook Y"'],
  [/\bvan [a-z]+ tot [a-z]+/i, '"van X tot Y"'],
  [/\bof je nu\b/i, '"of je nu"'],
  [/\bontdek/i, '"ontdek"'], [/\bveelzijdig/i, '"veelzijdig"'], [/\bperfect/i, '"perfect"'],
  [/\bideaal/i, '"ideaal"'], [/\buniek/i, '"uniek"'], [/\bessentieel/i, '"essentieel"'], [/\bnaadloos/i, '"naadloos"'],
  [/\bdiscover/i, '"discover"'], [/\bseamless/i, '"seamless"'], [/\bunique/i, '"unique"'], [/\bwhether you'?re\b/i, '"whether you\'re"'],
  [/\bnot only\b.*\bbut also\b/i, '"not only X but also Y"'],
];
const scan = (label, text) => BANNED.forEach(([re, name]) => { const m = text.match(re); if (m) fail('copy', `${label}: ${name} in "${m[0]}"`) });
for (const lang of ['en', 'nl']) for (const [k, v] of Object.entries(STR[lang])) scan(`STR.${lang}.${k}`, v);
// style descriptions and other copy outside STR live in app.js string literals: check those too
for (const m of app.matchAll(/(en|nl):'((?:[^'\\]|\\.)*)'/g)) scan(`app.js ${m[1]}`, m[2]);

// ---------- pages ----------
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(SITE);
const html = files.filter(f => f.endsWith('.html'));
const textOf = h => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
for (const f of html) {
  const rel = path.relative(SITE, f).replace(/\\/g, '/'), h = read(f);
  scan(rel, textOf(h));
  const meta = [...h.matchAll(/<(?:title>([^<]*)<\/title|meta name="description" content="([^"]*)")/g)];
  meta.forEach(m => scan(rel + ' meta', m[1] || m[2]));
  // strict CSP: nothing inline
  if (/\sstyle\s*=/.test(h)) fail('csp', `${rel}: inline style attribute`);
  if (/\son[a-z]+\s*=\s*["']/i.test(h)) fail('csp', `${rel}: inline event handler`);
  for (const m of h.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))
    if (m[2].trim() && !/type="application\/ld\+json"/.test(m[1])) fail('csp', `${rel}: inline script`);
  if (/<style[\s>]/.test(h)) fail('csp', `${rel}: <style> block`);
  // no requests to other hosts (links to other sites with <a> are fine)
  for (const m of h.matchAll(/<(script|link|img|audio|video|source|iframe)\b[^>]*\b(?:src|href)="(https?:)?\/\/[^"]*"/g))
    if (!/rel="canonical"/.test(m[0])) fail('privacy', `${rel}: external resource ${m[0].slice(0, 90)}`);
  // internal links resolve
  for (const m of h.matchAll(/\b(?:src|href)="([^"#?]+)[^"]*"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|data:|blob:)/.test(u) || u === '') continue;
    const target = u.startsWith('/') ? path.join(SITE, u) : path.join(path.dirname(f), u);
    const ok = fs.existsSync(target) && (fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html')));
    if (!ok) fail('links', `${rel}: ${u} does not resolve`);
  }
  if (rel !== '404.html') {
    const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '', d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    if (t.length < 50 || t.length > 60) fail('seo', `${rel}: title is ${t.length} chars (50 to 60)`);
    if (d.length < 140 || d.length > 155) fail('seo', `${rel}: description is ${d.length} chars (140 to 155)`);
    if (!/<link rel="canonical" href="https:\/\/babbleengine\.wrongfloor\.studio\/[^"]*">/.test(h)) fail('seo', `${rel}: no canonical`);
  }
}
for (const f of files.filter(f => /\.(css|js)$/.test(f))) {
  const rel = path.relative(SITE, f).replace(/\\/g, '/'), s = read(f);
  if (/fonts\.googleapis|fonts\.gstatic/.test(s)) fail('privacy', `${rel}: Google Fonts reference`);
  if (/\bfetch\(|XMLHttpRequest|sendBeacon|new WebSocket/.test(s)) fail('privacy', `${rel}: network call`);
}
for (const f of ['llms.txt', 'robots.txt']) scan(f, read(path.join(SITE, f)));

// ---------- sitemap = public pages ----------
const sitemap = read(path.join(SITE, 'sitemap.xml'));
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const pages = html.map(f => path.relative(SITE, f).replace(/\\/g, '/')).filter(p => p !== '404.html');
const pageUrls = pages.map(p => 'https://babbleengine.wrongfloor.studio/' + p.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, ''));
if (locs.length !== pages.length) fail('sitemap', `${locs.length} URLs in sitemap.xml, ${pages.length} pages`);
pageUrls.filter(u => !locs.includes(u)).forEach(u => fail('sitemap', `missing ${u}`));
if (!/Sitemap: https:\/\/babbleengine\.wrongfloor\.studio\/sitemap\.xml/.test(read(path.join(SITE, 'robots.txt')))) fail('sitemap', 'robots.txt does not name sitemap.xml');

// ---------- headers ----------
const headers = read(path.join(SITE, '_headers'));
['Strict-Transport-Security', 'X-Content-Type-Options: nosniff', 'Referrer-Policy: strict-origin-when-cross-origin',
  'Permissions-Policy: microphone=(self), camera=(), geolocation=()', 'X-Frame-Options: DENY', "frame-ancestors 'none'", 'X-Robots-Tag: noindex']
  .forEach(h => { if (!headers.includes(h)) fail('headers', `missing ${h}`) });
if (!fs.existsSync(path.join(SITE, '404.html'))) fail('headers', 'no 404.html');
for (const f of ['dossier', 'metingen', 'tests', 'CLAUDE.md', 't2.html']) if (fs.existsSync(path.join(SITE, f))) fail('publish', `${f} is inside site/`);

if (fails.length) { console.log(fails.join('\n')); console.log(`\n${fails.length} problem(s)`); process.exit(1) }
console.log(`check ok: ${en.length} text keys in EN and NL, ${pages.length} page(s), ${html.length} html file(s)`);
