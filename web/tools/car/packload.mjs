// v0.9.11 test helper: load a real .rgpack through src/packs.js readPack (incl. sanitizeCss + asset data URLs)
// and shape it like storeSkin() does for the runtime (css / cssModes / tokens / modes).
import fs from 'node:fs';
if (!globalThis.FileReader) globalThis.FileReader = class { readAsDataURL(b) { b.arrayBuffer().then(a => { this.result = `data:${b.type};base64,` + Buffer.from(a).toString('base64'); this.onload?.(); }); } };
const { readPack } = await import('../../src/packs.js');
export async function loadPk(file) {
  const { pack: p } = await readPack(new Uint8Array(fs.readFileSync(file)), { appVer: '0.9.11' }); const k = p.skin;
  return { id: p.id, base: k.base, modes: k.modes, tokens: k.tokens || {}, css: k.css || '', cssModes: { light: k.modes.light?.css || '', dark: k.modes.dark?.css || '' } };
}
