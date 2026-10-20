// v0.9.2 updates (Android app only).
// (a) APK update check: GitHub Releases "latest" → notify + download link.
// (b) Live web update without reinstall: GitHub Pages publishes bundle/manifest.json (per-file SHA-256).
//     Changed files are downloaded from the same Pages site, every file is hash-verified, the new bundle is
//     written to app storage and switched to on the NEXT cold start by MainActivity. If that bundle fails to
//     report healthy 3 starts in a row, MainActivity falls back to the assets bundled in the APK.
import { registerPlugin } from '@capacitor/core';
const REPO = 'zixutang1996-eng/roadglow', PAGES = 'https://zixutang1996-eng.github.io/roadglow/';
const WebView = registerPlugin('WebView');
const cmp = (a, b) => { const x = String(a).split(/[.+-]/).map(Number), y = String(b).split(/[.+-]/).map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const b64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const SAFE = /^[A-Za-z0-9._@\- \/]+$/;

export async function initUpdates({ toast, L, store }) {
  const [{ App }, { Preferences }, { Filesystem, Directory }] = await Promise.all([import('@capacitor/app'), import('@capacitor/preferences'), import('@capacitor/filesystem')]);
  const info = await App.getInfo(); // version "0.9.2", build "92"
  // healthy start → tell MainActivity this bundle works
  try { const bp = (await WebView.getServerBasePath()).path || ''; await Preferences.set({ key: 'lu_ok', value: bp }); } catch {}
  const now = Date.now(); if (now - (store.get('updChecked', 0)) < 6 * 3600e3 && !location.search.includes('updcheck')) return;
  store.set('updChecked', now);

  // (a) APK
  try {
    const r = await (await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })).json();
    const v = (r.tag_name || '').replace(/^v/, ''), apk = (r.assets || []).find(a => /\.apk$/i.test(a.name));
    if (v && cmp(v, info.version) > 0 && apk && store.get('apkSkip') !== v) showApk(v, r.html_url, `https://github.com/${REPO}/releases/latest/download/RoadGlow.apk`, L, store);
  } catch {}

  // (b) live web bundle
  try {
    const remote = await (await fetch(`${PAGES}bundle/manifest.json?t=${now}`, { cache: 'no-store' })).json();
    const local = await (await fetch('./bundle/manifest.json', { cache: 'no-store' })).json();
    if (remote.app !== 'roadglow' || !(remote.build > local.build) || +remote.minNative > +info.build) return;
    if ((await Preferences.get({ key: 'lu_bad' })).value?.endsWith(`/live/${remote.build}`)) return; // already rolled back once
    const dir = `live/${remote.build}`; let changed = 0;
    for (const [p, h] of Object.entries(remote.files)) {
      if (!SAFE.test(p) || p.includes('..')) throw new Error('bad path ' + p);
      const same = local.files[p] === h;
      const buf = await (await fetch(same ? './' + encodeURI(p) : `${PAGES}${encodeURI(p)}?b=${remote.build}`, { cache: 'no-store' })).arrayBuffer();
      if (hex(await crypto.subtle.digest('SHA-256', buf)) !== h) throw new Error('hash mismatch ' + p);
      await Filesystem.writeFile({ path: `${dir}/${p}`, data: b64(buf), directory: Directory.Data, recursive: true }); if (!same) changed++;
    }
    await Filesystem.writeFile({ path: `${dir}/bundle/manifest.json`, data: JSON.stringify(remote), directory: Directory.Data, recursive: true, encoding: 'utf8' });
    const uri = (await Filesystem.getUri({ path: dir, directory: Directory.Data })).uri.replace(/^file:\/\//, '');
    await Preferences.set({ key: 'lu_next', value: uri });
    toast(L(`网页内容更新已下载（${changed} 个文件），下次启动生效`, `Web update downloaded (${changed} files); applies next launch`), 4000);
  } catch (e) { console.warn('live update', e.message); }
}
function showApk(v, page, url, L, store) {
  const el = document.createElement('div'); el.className = 'card'; el.id = 'apkUpd'; el.setAttribute('role', 'dialog');
  el.style.cssText = 'position:absolute;left:12px;right:12px;bottom:calc(90px + var(--sab,0px));z-index:30;padding:14px 16px;max-width:520px';
  el.innerHTML = `<b>${L('有新版本', 'Update available')}: v${v}</b><div class="sub" style="padding:6px 0">${L('下载 APK 后点按安装（签名相同，数据保留）。', 'Download the APK and tap to install (same signature, your data is kept).')}</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="${url}" target="_blank" rel="noopener">${L('下载', 'Download')}</a><a class="btn ghost" href="${page}" target="_blank" rel="noopener">${L('更新说明', 'Notes')}</a><button class="btn ghost x" data-close="1">${L('稍后', 'Later')}</button><button class="btn ghost" data-skip="1">${L('跳过此版本', 'Skip')}</button></div>`;
  el.onclick = e => { if (e.target.dataset.skip) { store.set('apkSkip', v); el.remove(); } if (e.target.dataset.close) el.remove(); };
  document.body.appendChild(el);
}
