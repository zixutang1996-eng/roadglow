// Writes dist/bundle/manifest.json: per-file SHA-256 of the built web app (used by the Android live updater).
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { execSync } from 'child_process';
const D = 'dist', files = {}; const pkg = JSON.parse(fs.readFileSync('package.json'));
const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else { const r = path.relative(D, p).split(path.sep).join('/'); if (!r.startsWith('bundle/') && r !== 'sw.js') files[r] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } } };
walk(D);
let build; try { build = +execSync('git log -1 --format=%ct', { encoding: 'utf8' }).trim(); } catch { build = Math.floor(Date.now() / 1000); }
fs.mkdirSync(`${D}/bundle`, { recursive: true });
fs.writeFileSync(`${D}/bundle/manifest.json`, JSON.stringify({ app: 'roadglow', version: pkg.version, build, minNative: pkg.minNative || 9020, files }));
console.log('manifest', Object.keys(files).length, 'files, build', build);
