// v0.9.14 search: case-insensitive matching/aliases, viewport box, locality labels
import assert from 'node:assert/strict';
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.location = { href: 'http://x/', origin: 'http://x', search: '', hostname: 'x', protocol: 'http:' }; globalThis.window = globalThis; globalThis.document = { documentElement: {}, querySelector: () => null };
if (!globalThis.navigator) globalThis.navigator = { language: 'en' };
import { build } from 'esbuild';
const bundle = async f => { const r = await build({ entryPoints: [f], bundle: true, write: false, format: 'esm', define: { 'import.meta.env': '{}' }, platform: 'neutral' }); return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64')); };
const AC = await bundle(new URL('../src/ac.js', import.meta.url).pathname);
for (const v of ['superstore', 'Superstore', 'SUPERSTORE', 'SuPeRsToRe']) assert.equal(AC.aliasOf(v), 'Real Canadian Superstore', v);
for (const v of ['timmies', 'TIMMIES', 'Timmies']) assert.equal(AC.aliasOf(v), 'Tim Hortons');
assert.equal(AC.textScore(AC.norm('SUPERSTORE'), 'Real Canadian Superstore'), AC.textScore(AC.norm('superstore'), 'Real Canadian Superstore'));
assert.ok(AC.textScore(AC.norm('REAL CANADIAN'), 'real canadian superstore') > 0);
assert.equal(AC.intentOf('GAS')?.id, 'gas'); assert.equal(AC.intentOf('Coffee')?.id, 'coffee');
const { parseAddress } = await bundle(new URL('../src/geoaddr.js', import.meta.url).pathname);
assert.deepEqual(parseAddress('1581 COALBANKS BLVD W, LETHBRIDGE'), parseAddress('1581 coalbanks blvd w, lethbridge'));
const B = { getEast: () => -112.80, getWest: () => -112.88, getNorth: () => 49.72, getSouth: () => 49.68 };
const vb = AC.viewBox({ c: { lat: 49.70, lng: -112.84 }, B }); // tight zoom → ~city-sized box around the view, not Edmonton
assert.ok(vb[0] < -112.88 && vb[2] > -112.80 && vb[2] - vb[0] < 0.5 && vb[1] > 49.5 && vb[3] < 49.9, String(vb));
assert.equal(AC.locality({ city: 'Lethbridge', state: 'Alberta' }), 'Lethbridge, AB');
assert.equal(AC.locality({ city: 'Seattle', state: 'Washington' }), 'Seattle, WA');
assert.equal(AC.locality({}), '');
console.log('search0914: OK');
// v0.9.14 typo forgiveness
assert.equal(AC.correct('walmrat'), 'walmart'); assert.equal(AC.correct('COSTOC'), 'costco');
for (const [typo, want] of [['supestore', 'Real Canadian Superstore'], ['superstor', 'Real Canadian Superstore'], ['SUPRESTORE', 'Real Canadian Superstore'], ['timmes', 'Tim Hortons']]) assert.equal(AC.aliasOf(typo), want, typo);
for (const [typo, name] of [['real canadain superstore', 'Real Canadian Superstore'], ['lethbrige', 'Lethbridge Centre'], ['starbuks', 'Starbucks'], ['hospitl', 'Chinook Regional Hospital'], ['universty of lethbridge', 'University of Lethbridge']]) assert.ok(AC.textScore(AC.norm(typo), name) > 0, typo);
assert.equal(AC.correct('lethbrige'), 'lethbridge'); assert.equal(AC.correct('Lethbridge'), null);
assert.equal(AC.dl('walmrat', 'walmart'), 1);
console.log('search0914 typo: OK');
