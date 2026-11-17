import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const root = process.cwd();
const pages = ['index.html','products.html','praecura.html','pilot-program.html','es/index.html','es/products.html','es/praecura.html','es/pilot-program.html'];
let links = 0;
for (const page of pages) {
  const text = await readFile(page, 'utf8');
  assert.equal((text.match(/<h1(?:\s|>)/g) ?? []).length, 1, `${page}: one h1`);
  assert(text.includes('aria-controls="main-navigation"'), `${page}: menu control`);
  assert(text.includes('type="module"'), `${page}: module loaded`);
  assert(!/CONCEPT VIEW|Preocura|Procura/.test(text), `${page}: obsolete labels`);
  if (page.endsWith('index.html')) {
    const heading = text.match(/<h1[^>]*>(.*?)<\/h1>/s)[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim();
    assert.equal(heading, 'Better Diagnostics. Better Decisions. Better Lives.');
    const es = page.startsWith('es/');
    assert(!/hero-visual|field-technician-noir/.test(text), `${page}: hero photograph removed`);
    assert(text.includes('class="network-canvas"'), `${page}: network canvas`);
    const labels = [...text.matchAll(/<li><svg[^>]*>.*?<\/svg><span>(.*?)<\/span><\/li>/g)].map(m => m[1].replace(/&amp;/g, '&'));
    assert.deepEqual(labels, es
      ? ['Aire acondicionado comercial','Refrigeración comercial e industrial','Chillers','Calderas','Diagnóstico','Ciberseguridad']
      : ['Commercial Air Conditioning','Commercial & Industrial Refrigeration','Chillers','Boilers','Diagnostics','Cybersecurity'], `${page}: six network disciplines`);
    assert.equal((text.match(/class="principle"/g) ?? []).length, 5, `${page}: five engineering principles`);
    assert.equal((text.match(/id="cybersecurity"/g) ?? []).length, 1, `${page}: one cybersecurity strip`);
    assert(text.includes(es ? 'Red ilustrativa; sin telemetría en vivo.' : 'Illustrative network; not live telemetry.'), `${page}: telemetry disclaimer`);
    assert(text.includes(es ? 'EN EVALUACIÓN DE LABORATORIO' : 'UNDER LABORATORY EVALUATION'), `${page}: Brújula evaluation status`);
    assert(text.includes('data-pause=') && text.includes('data-play='), `${page}: animation control`);
  }
  assert(text.includes('assets/templogic-emblem.svg'), `${page}: new emblem`);
  for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|data:|#)/.test(href)) continue;
    const [path, anchor] = href.split('#');
    let target = resolve(path.startsWith('/') ? root : dirname(resolve(page)), path.replace(/^\//,''));
    if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
    assert((await stat(target)).isFile(), `${page}: missing ${href}`);
    if (anchor) assert((await readFile(target,'utf8')).includes(`id="${anchor}"`), `${page}: missing anchor ${href}`);
    links++;
  }
}
const emblem = await readFile('assets/templogic-emblem.svg','utf8');
assert(emblem.includes('#bca6ff') && emblem.includes('#f7f5fa'), 'emblem uses lilac and white');
assert((await stat('assets/field-technician-noir.svg')).isFile(), 'original hero asset preserved on disk');
const net = await readFile('network.js','utf8');
assert(net.includes('prefers-reduced-motion') && net.includes('network-paused'), 'network honours reduced motion and the pause control');
const fonts = await readFile('assets/fonts.css','utf8');
assert(fonts.includes('Space Grotesk') && fonts.includes('JetBrains Mono'));
assert(fonts.includes('data:font/woff2;base64,'));
console.log(`Passed: eight corporate pages; ${links} local links/assets; exact bilingual hero slogan; animated-network hero (photo removed, six disciplines, controls, disclaimer); navigation, anchor and self-hosted font checks.`);
