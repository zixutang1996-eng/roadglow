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

export async function initUpdates({ toast, L, store, openUpd }) {
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
    if (v && cmp(v, info.version) > 0 && apk && store.get('apkSkip') !== v) showApk(v, r.html_url, `https://github.com/${REPO}/releases/latest/download/RoadGlow.apk`, L, store, openUpd);
  } catch {}

  // (b) live web bundle
  try {
    const remote = await (await fetch(`${PAGES}bundle/manifest.json?t=${now}`, { cache: 'no-store' })).json();
    const local = await (await fetch('./bundle/manifest.json', { cache: 'no-store' })).json();
    if (remote.app !== 'roadglow' || !(remote.build > local.build) || +remote.minNative > +info.build) return;
    if (Object.entries(remote.files).every(([p, h]) => local.files[p] === h)) return; // same content
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
function showApk(v, page, url, L, store, openUpd) {
  const el = document.createElement('div'); el.className = 'card'; el.id = 'apkUpd'; el.setAttribute('role', 'dialog');
  el.style.cssText = 'position:absolute;left:12px;right:12px;bottom:calc(90px + var(--sab,0px));z-index:30;padding:14px 16px;max-width:520px';
  el.innerHTML = `<b>${L('有新版本', 'Update available')}: v${v}</b><div class="sub" style="padding:6px 0">${L('下载 APK 后点按安装（签名相同，数据保留）。', 'Download the APK and tap to install (same signature, your data is kept).')}</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-open="1">${L('查看并更新', 'View & update')}</button><a class="btn ghost" href="${page}" target="_blank" rel="noopener">${L('更新说明', 'Notes')}</a><button class="btn ghost x" data-close="1">${L('稍后', 'Later')}</button><button class="btn ghost" data-skip="1">${L('跳过此版本', 'Skip')}</button></div>`;
  el.onclick = e => { if (e.target.dataset.open) { el.remove(); openUpd?.(); return; } if (e.target.dataset.skip) { store.set('apkSkip', v); el.remove(); } if (e.target.dataset.close) el.remove(); };
  document.body.appendChild(el);
}

// ---------- v0.9.4 dedicated update screen (drawer → 检查更新) ----------
// Checks GitHub Releases "latest" on demand; downloads the APK inside the app (ApkUpdater native plugin, progress),
// then opens the system installer. Older APKs without the plugin fall back to the browser download link.
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const APK_URL = `https://github.com/${REPO}/releases/latest/download/RoadGlow.apk`;
const mb = n => (n / 1048576).toFixed(1) + ' MB';
export async function openUpdater({ openPanel, L, $, native, bj, webVer }) {
  const Up = native ? registerPlugin('ApkUpdater') : null;
  let me = { versionName: null, canInstall: true, plugin: false };
  if (native) { try { me = { ...(await Up.info()), plugin: true }; } catch { try { const { App } = await import('@capacitor/app'); me.versionName = (await App.getInfo()).version; } catch {} } }
  const cur = me.versionName || webVer || '?';
  const head = `<div class="upd"><div class="updv"><div><div class="updk">${L('当前版本', 'Installed')}</div><b>v${esc(cur)}</b></div><div><div class="updk">${L('网页内容', 'Web content')}</div><b>${esc(webVer || '–')}</b></div></div><div id="updBody"></div></div>`;
  openPanel(head, L('检查更新', 'Check for updates'), 'upd');
  const body = $('#updBody'), set = h => { if ($('#updBody')) $('#updBody').innerHTML = h; };
  if (bj) return set(`<div class="updn">${L('北京版不联网检查更新：GitHub 在中国大陆通常无法访问。有新版本时，家人会把安装包直接发给您，点开安装即可（数据保留）。', 'The Beijing edition does not check online: GitHub is usually unreachable in mainland China. New versions are sent to you as an APK file; tap it to install (your data is kept).')}</div>`);
  set(`<div class="updn"><span class="updspin"></span>${L('正在检查…', 'Checking…')}</div>`);
  let r;
  try { const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' }); if (!res.ok) throw new Error('HTTP ' + res.status); r = await res.json(); }
  catch (e) { return set(`<div class="updn">${L('无法连接更新服务器（GitHub），请检查网络后重试。', 'Couldn’t reach the update server (GitHub). Check your connection and try again.')}<div class="updsub">${esc(e.message)}</div></div><div class="updbtns"><button class="btn" id="updRetry">${L('重试', 'Retry')}</button></div>`), $('#updRetry').onclick = () => openUpdater({ openPanel, L, $, native, bj, webVer }); }
  const v = (r.tag_name || '').replace(/^v/, ''), asset = (r.assets || []).find(a => a.name === 'RoadGlow.apk');
  const notes = `<div class="updnotes"><div class="updk">${L('更新说明', 'Release notes')} · ${esc(r.name || 'v' + v)}${r.published_at ? ' · ' + esc(r.published_at.slice(0, 10)) : ''}</div><div class="updtxt">${esc((r.body || '').trim()).replace(/^#+\s*/gm, '').replace(/\*\*/g, '')}</div></div>`;
  if (!v || cmp(v, cur) <= 0 || !asset) return set(`<div class="updn updok">✓ ${L('已是最新版本', 'You’re up to date')} <span class="updsub">v${esc(cur)}</span></div>${notes}<div class="updbtns"><button class="btn ghost" id="updRetry">${L('再次检查', 'Check again')}</button></div>`), $('#updRetry').onclick = () => openUpdater({ openPanel, L, $, native, bj, webVer });
  const size = asset.size ? ' · ' + mb(asset.size) : '';
  const ready = () => {
    set(`<div class="updn"><b>${L('发现新版本', 'New version')} v${esc(v)}</b><span class="updsub">${size}</span></div>${notes}
      <div id="updAct"><div class="updbtns"><button class="btn" id="updGo">${L('下载并安装', 'Download & install')}</button></div><div class="updsub">${L('签名相同，直接覆盖安装，数据保留。', 'Same signature: installs over this version and keeps your data.')}</div></div>`);
    $('#updGo').onclick = go;
  };
  const act = h => { if ($('#updAct')) $('#updAct').innerHTML = h; };
  const permUi = () => act(`<div class="updn">${L('需要允许 RoadGlow “安装未知应用”。点下方按钮打开设置，打开开关后返回这里，再点“安装”。', 'RoadGlow needs permission to “Install unknown apps”. Open settings, turn it on, come back and tap Install.')}</div><div class="updbtns"><button class="btn" id="updPerm">${L('去设置', 'Open settings')}</button><button class="btn ghost" id="updInst">${L('安装', 'Install')}</button></div>`);
  const install = async () => {
    try { const i = await Up.info(); if (!i.canInstall) { permUi(); $('#updPerm').onclick = () => Up.openInstallSettings(); $('#updInst').onclick = install; return; }
      await Up.install(); act(`<div class="updn">${L('已打开系统安装程序。安装完成后重新打开 RoadGlow。', 'The system installer is open. Reopen RoadGlow when it finishes.')}</div><div class="updbtns"><button class="btn ghost" id="updInst">${L('再次安装', 'Install again')}</button></div>`); $('#updInst').onclick = install; }
    catch (e) { if (/NEED_PERMISSION/.test(e.message)) { permUi(); $('#updPerm').onclick = () => Up.openInstallSettings(); $('#updInst').onclick = install; } else act(`<div class="updn">${L('无法启动安装：', 'Couldn’t start the installer: ')}${esc(e.message)}</div>`); }
  };
  async function go() {
    if (!native) { location.href = APK_URL; return; }
    if (!me.plugin) { window.open(APK_URL, '_blank'); return act(`<div class="updn">${L('此旧版本只能用浏览器下载：下载完成后点通知栏里的文件安装。装好 0.9.4 之后，更新会在应用内完成。', 'This older version can only download through the browser: tap the file in the notification when it finishes. From 0.9.4 on, updates install inside the app.')}</div>`); }
    act(`<div class="updn">${L('正在下载…', 'Downloading…')} <span id="updPct">0%</span><span class="updsub" id="updMb"></span></div><div class="prog"><i id="updBar" style="width:0"></i></div><div class="updbtns"><button class="btn ghost" id="updCancel">${L('取消', 'Cancel')}</button></div>`);
    $('#updCancel').onclick = () => Up.cancel();
    const h = await Up.addListener('progress', p => { const t = p.total > 0 ? p.total : asset.size || 0, f = t ? Math.min(1, p.loaded / t) : 0; const b = $('#updBar'); if (!b) return; b.style.transform = `scaleX(${f.toFixed(4)})`; $('#updPct').textContent = Math.round(f * 100) + '%'; $('#updMb').textContent = ' ' + mb(p.loaded) + (t ? ' / ' + mb(t) : ''); });
    try { await Up.download({ url: APK_URL }); h.remove(); await install(); }
    catch (e) { h.remove(); if (/cancelled/.test(e.message)) return ready(); act(`<div class="updn">${L('下载失败：', 'Download failed: ')}${esc(e.message)}</div><div class="updbtns"><button class="btn" id="updGo">${L('重试', 'Retry')}</button></div>`); $('#updGo').onclick = go; }
  }
  ready();
}
