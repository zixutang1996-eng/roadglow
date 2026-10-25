// v0.9.13 unit tests: general Canadian street-address parsing + street matching (no network)
import { parseAddress as P, streetMatch as M } from '../src/geoaddr.js'; import assert from 'node:assert/strict';
const cases = [
  ['1581 coalbanks blvd w, lethbridge', { hn: '1581', name: 'coalbanks', type: 'boulevard', dir: 'w', city: 'Lethbridge' }],
  ['1581 Coalbanks Boulevard West Lethbridge AB', { hn: '1581', name: 'coalbanks', type: 'boulevard', dir: 'w', city: 'Lethbridge', prov: 'Alberta' }],
  ['1581 Coalbanks Blvd W, Lethbridge, AB T1J 5J7', { hn: '1581', dir: 'w', city: 'Lethbridge', prov: 'Alberta', post: 'T1J 5J7' }],
  ['10220 104 Ave NW, Edmonton', { hn: '10220', name: '104', type: 'avenue', dir: 'nw', city: 'Edmonton' }],
  ['8770 170th St NW', { hn: '8770', name: '170', type: 'street', dir: 'nw' }],
  ['301 7 st s lethbridge', { hn: '301', name: '7', type: 'street', dir: 's', city: 'Lethbridge' }],
  ['1 Dundas St W, Toronto, ON', { hn: '1', name: 'dundas', type: 'street', dir: 'w', city: 'Toronto', prov: 'Ontario' }],
  ['800 Robson St, Vancouver BC', { hn: '800', name: 'robson', type: 'street', city: 'Vancouver', prov: 'British Columbia' }],
  ['1234 Kensington Rd NW Calgary', { hn: '1234', name: 'kensington', type: 'road', dir: 'nw', city: 'Calgary' }],
  ['12-345 Main St, Winnipeg MB', { hn: '345', unit: '12', name: 'main', city: 'Winnipeg', prov: 'Manitoba' }],
  ['Apt 4 55 Queen St E, Toronto', { hn: '55', name: 'queen', dir: 'e', city: 'Toronto' }],
  ['55 rue de la gauchetière o, montréal', { hn: '55', dir: 'w', city: 'Montreal' }],
  ['123 Jasper Ave', { hn: '123', name: 'jasper', type: 'avenue' }],
];
let n = 0; for (const [q, exp] of cases) { const r = P(q); assert.ok(r, q); for (const k in exp) assert.equal(r[k], exp[k], `${q} → ${k}=${r[k]}`); n++; }
assert.equal(P('Real Canadian Superstore'), null); assert.equal(P('superstore'), null);
const c = P('1581 coalbanks blvd w, lethbridge');
assert.ok(M(c, 'Coalbanks Boulevard W')); assert.ok(M(c, 'Coalbanks Blvd West')); assert.ok(!M(c, 'Coalbanks Link W')); assert.ok(!M(c, 'Coalbanks Boulevard E'));
const s7 = P('301 7 st s lethbridge'); assert.ok(M(s7, '7 Street S')); assert.ok(!M(s7, '5 Street S'), 'must not accept the wrong numbered street (Photon fuzzy hit)');
console.log(`geoaddr: ${n} parse cases + 6 match cases OK`);
