// v0.8 iPhone / iOS Safari PWA helpers (no Apple account needed; all standard Web APIs).
import { ic } from './uiicons.js';
const ua = navigator.userAgent;
export const IOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const SAFARI = IOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
export const STANDALONE = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const ZH = (navigator.language || 'zh').startsWith('zh'); const L = (z, e) => ZH ? z : e;

// one-time themed "Add to Home Screen" guide (iOS Safari, not yet installed)
export function maybeShowA2HS(force = false) {
  if (!force && (!SAFARI || STANDALONE || localStorage.getItem('a2hsSeen'))) return false;
  const el = document.createElement('div'); el.id = 'iosGuide'; el.className = 'card'; el.setAttribute('role', 'dialog');
  el.innerHTML = `<button class="xbig x" aria-label="close">✕</button><b>${L('把 RoadGlow 装到主屏幕', 'Install RoadGlow on your Home Screen')}</b>
    <div class="row">1. ${L('点按底部的', 'Tap')} ${ic('share')} <b>${L('分享', 'Share')}</b></div>
    <div class="row">2. ${L('选择', 'Choose')} ${ic('add')} <b>${L('添加到主屏幕', 'Add to Home Screen')}</b></div>
    <div class="iosnote">${L('全屏打开、离线可用、更像原生 App。只提示一次。', 'Opens full-screen and works offline. Shown once.')}</div>`;
  el.querySelector('.x').onclick = () => { localStorage.setItem('a2hsSeen', '1'); el.remove(); };
  document.body.appendChild(el); return true;
}

// Screen Wake Lock during navigation, re-acquired when the page becomes visible again
let lock = null, want = false;
async function grab() { try { if (want && 'wakeLock' in navigator && document.visibilityState === 'visible') { lock = await navigator.wakeLock.request('screen'); lock.addEventListener?.('release', () => { lock = null; }); } } catch { lock = null; } }
document.addEventListener('visibilitychange', () => { if (want && !lock) grab(); });
export async function wakeOn(toast) {
  want = true; await grab();
  if (IOS && !lock) toast?.(L('iOS 需要保持屏幕常亮才能持续导航与语音：请勿锁屏（或在 设置 › 显示与亮度 › 自动锁定 中延长）', 'iOS needs the screen on for navigation and voice: keep it unlocked (or extend Settings › Display & Brightness › Auto-Lock)'), 6000);
  else if (IOS) toast?.(L('导航中屏幕将保持常亮；锁屏后 iOS 会暂停定位与语音', 'Screen stays on while navigating; iOS pauses GPS and voice when locked'), 4000);
  return !!lock;
}
export function wakeOff() { want = false; lock?.release?.(); lock = null; }
export const wakeState = () => ({ want, held: !!lock });

// iOS only lets speechSynthesis speak after a user gesture: speak a silent utterance on the Start tap
export function unlockSpeech() {
  if (!window.speechSynthesis) return;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.cancel(); speechSynthesis.speak(u); speechSynthesis.getVoices(); } catch {}
}
// voices load late on iOS/Safari: resolve when available (or after timeout)
export function voicesReady(ms = 3000) {
  return new Promise(res => { const v = speechSynthesis?.getVoices?.() || []; if (v.length) return res(v);
    const t = setTimeout(() => res(speechSynthesis?.getVoices?.() || []), ms);
    speechSynthesis?.addEventListener?.('voiceschanged', () => { clearTimeout(t); res(speechSynthesis.getVoices()); }, { once: true }); });
}

// compass: iOS 13+ needs DeviceOrientationEvent.requestPermission() from a tap; heading from webkitCompassHeading
let compassOn = false;
export async function enableCompass(onHeading) {
  if (compassOn) return true;
  const DOE = window.DeviceOrientationEvent; if (!DOE) return false;
  try { if (typeof DOE.requestPermission === 'function') { const r = await DOE.requestPermission(); if (r !== 'granted') return false; } } catch { return false; }
  const h = e => { let hd = null;
    if (typeof e.webkitCompassHeading === 'number') hd = e.webkitCompassHeading;               // iOS: degrees from north, clockwise
    else if (e.absolute && typeof e.alpha === 'number') hd = (360 - e.alpha) % 360;             // others
    if (hd != null) onHeading((hd + (screen.orientation?.angle || window.orientation || 0) + 360) % 360); };
  window.addEventListener('deviceorientation', h, true); window.addEventListener('deviceorientationabsolute', h, true); compassOn = true; return true;
}

// geolocation error guide, iOS-specific wording
export function geoHelp(err, openPanel) {
  const denied = err?.code === 1;
  const steps = IOS ? (denied
      ? L(`<ol><li>打开 <b>设置 › 隐私与安全性 › 定位服务</b>，确认已开启</li><li>向下找到 <b>Safari 网站</b>，选 <b>使用 App 期间</b> 并打开 <b>精确位置</b></li><li>回到 Safari：点地址栏左侧 <b>ᴀA › 网站设置 › 位置</b> → <b>允许</b></li>${STANDALONE ? '<li>主屏幕 App 使用 Safari 的网站权限；改完后彻底关闭并重新打开 RoadGlow</li>' : ''}</ol>`,
          `<ol><li>Open <b>Settings › Privacy & Security › Location Services</b> and turn it on</li><li>Find <b>Safari Websites</b> → <b>While Using the App</b>, enable <b>Precise Location</b></li><li>In Safari tap <b>ᴀA › Website Settings › Location</b> → <b>Allow</b></li>${STANDALONE ? '<li>Home-Screen apps use Safari\'s website permission; fully close and reopen RoadGlow afterwards</li>' : ''}</ol>`)
      : L('<p>暂时无法获得定位（信号弱或超时）。请到开阔处，关闭低电量模式，并确认 Wi-Fi 已开启以加快定位。</p>', '<p>Could not get a fix (weak signal or timeout). Move to open sky, turn off Low Power Mode, and keep Wi-Fi on to speed up positioning.</p>'))
    : (denied ? L('<p>定位权限被拒绝：请在浏览器的网站设置中允许“位置”。</p>', '<p>Location permission denied: allow Location in the browser’s site settings.</p>') : L('<p>暂时无法获得定位，请稍后重试。</p>', '<p>Could not get your location; try again shortly.</p>'));
  openPanel(`<div class="pc" id="geoHelp"><h2>${L('需要定位权限', 'Location needed')}</h2>${steps}<div class="iosnote">${L('RoadGlow 只在本机使用你的位置，不上传。', 'Your location stays on this device.')}</div></div>`, L('定位帮助', 'Location help'));
}

// offline downloads in standalone iOS: warn above ~50 MB and ask for persistent storage
export async function offlineGuard(estBytes, confirmFn) {
  let persisted = false; try { persisted = await navigator.storage?.persist?.() || false; } catch {}
  let quota = null; try { const e = await navigator.storage?.estimate?.(); quota = e?.quota ?? null; } catch {}
  const big = estBytes > 50e6;
  if (big && (IOS || (quota && estBytes > quota * 0.5))) {
    const ok = await confirmFn(L(`这个区域约 ${Math.round(estBytes / 1e6)} MB。iOS 对网页/主屏幕 App 的存储有限，空间不足或长期不用时可能被系统清除${persisted ? '' : '（未获得持久存储）'}。继续下载？`,
      `This area is about ${Math.round(estBytes / 1e6)} MB. iOS limits storage for web/Home-Screen apps and may evict it when space is low or the app is unused${persisted ? '' : ' (persistent storage not granted)'}. Continue?`));
    if (!ok) return { ok: false, persisted };
  }
  return { ok: true, persisted, quota };
}
