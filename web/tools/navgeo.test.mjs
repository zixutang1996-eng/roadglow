// v0.9.13 unit tests: route projection / consumed-route trim / turn-arrow kind / lanes (no faked lanes)
import { project, ahead, kindOf, lanesHtml, roadArrow } from '../src/navgeo.js'; import assert from 'node:assert/strict';
const R = [[-112.90, 49.66], [-112.89, 49.66], [-112.89, 49.67], [-112.88, 49.67]]; // lng,lat L-shaped route
let pr = project({ lng: -112.895, lat: 49.6601 }, R, 0); assert.equal(pr.i, 0); assert.ok(pr.d < 20, 'near route: ' + pr.d);
let a = ahead(R, pr); assert.equal(a.length, 4); assert.ok(Math.abs(a[0][0] + 112.895) < 1e-4, 'trim starts at snapped point');
pr = project({ lng: -112.8899, lat: 49.668 }, R, pr.i); assert.equal(pr.i, 1); a = ahead(R, pr); assert.equal(a.length, 3, 'first segment consumed');
pr = project({ lng: -112.881, lat: 49.67 }, R, pr.i); assert.equal(pr.i, 2); assert.equal(ahead(R, pr).length, 2);
const far = project({ lng: -112.5, lat: 49.9 }, R, 2); assert.ok(far.d > 1000, 'off-route distance reported');
assert.equal(kindOf({ type: 'turn', modifier: 'left' }), 'left'); assert.equal(kindOf({ type: 'arrive' }), 'arrive'); assert.equal(kindOf({ type: 'turn', modifier: 'uturn' }), 'uturn');
assert.equal(lanesHtml(''), ''); assert.equal(lanesHtml(undefined), ''); assert.ok(lanesHtml('left|*straight,*straight,right').includes('<'), 'real lanes render');
assert.ok(roadArrow('right').startsWith('<svg'));
console.log('navgeo: OK');
