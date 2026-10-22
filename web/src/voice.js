// Navigation voice packs. Phrase tables are plain data so they can be reused by flutter_tts later.
// All wording is original. Accent/timbre depends on the device's installed TTS voices.
import { lang, instruction, fmtDist } from './i18n.js';

export const PACKS = {
  standard: { label: { zh: '标准', en: 'Standard' }, pitch: 1, rate: 1, prefer: { en: /en-(US|GB|CA)/i, zh: /zh/i } },
  frontier: { label: { zh: '边疆牛仔（墨图）', en: 'Frontier (ink-west)' }, pitch: 0.72, rate: 0.88, prefer: { en: /en-US/i, zh: /zh/i }, deep: true,
    en: { left: ['Reckon ya oughta take a left up yonder', 'Hang a left, partner'], right: ['Bear right, partner', 'Swing on over to the right'], slight_left: ['Ease a touch left'], slight_right: ['Ease a touch right'],
      sharp_left: ['Hard left, hold on to yer hat'], sharp_right: ['Hard right, hold on to yer hat'], straight: ['Keep on straight down the trail'], uturn: ['Turn this wagon clean around'],
      depart: ['Saddle up, we ride'], roundabout: ['Circle the corral and take exit {exit}'], ferry: ['Load up on the ferry, partner'], merge: ['Fall in with the herd'],
      in: 'In {dist}, {what}', onto: ', onto {name}', reroute: ['Lost the trail. Findin\' a new one'], better: ['Found a quicker trail, saves {min} minutes'], arrive: ['We\'re here.', 'End of the trail, partner'], gpslost: ['Can\'t see the stars no more. GPS is gone'], test: 'Howdy. This here\'s yer trail guide.' },
    zh: { left: ['伙计，前头往左拐'], right: ['往右边走，老伙计'], slight_left: ['稍微往左偏点儿'], slight_right: ['稍微往右偏点儿'], sharp_left: ['抓紧缰绳，急左转'], sharp_right: ['抓紧缰绳，急右转'],
      straight: ['顺着这条道一直走'], uturn: ['掉转马头'], depart: ['上马，出发'], roundabout: ['绕着这圈走，第{exit}个口出去'], ferry: ['牵马上渡船'], merge: ['跟上大队'],
      in: '再走{dist}，{what}', onto: '，上{name}', reroute: ['跑岔了，换条道'], better: ['找到条近道，能省{min}分钟'], arrive: ['到地方了，伙计'], gpslost: ['看不着星星了，定位丢了'], test: '你好，伙计，我给你带路。' } },
  street: { label: { zh: '街头（霓虹）', en: 'Street (neon)' }, pitch: 1.18, rate: 1.12, prefer: { en: /en-(US|GB)/i, zh: /zh/i },
    en: { left: ['Cut left at the junction, runner'], right: ['Hard line right, runner'], slight_left: ['Drift left'], slight_right: ['Drift right'], sharp_left: ['Snap left. Now.'], sharp_right: ['Snap right. Now.'],
      straight: ['Hold the line straight ahead'], uturn: ['Flip it. One-eighty.'], depart: ['Route locked. Move out.'], roundabout: ['Loop the ring, exit {exit}'], ferry: ['Board the ferry. Water crossing.'], merge: ['Slide into traffic'],
      in: '{dist} out: {what}', onto: ', to {name}', reroute: ['Route recalculated. Stay sharp.'], better: ['Faster line found. Minus {min} minutes.'], arrive: ['Target reached. Clean run.'], gpslost: ['Signal lost. Running dark.'], test: 'Link up. Voice online.' },
    zh: { left: ['路口左切'], right: ['右线切入'], slight_left: ['向左微调'], slight_right: ['向右微调'], sharp_left: ['急左，立刻'], sharp_right: ['急右，立刻'], straight: ['保持直线'], uturn: ['原地掉头'],
      depart: ['路线锁定，出发'], roundabout: ['绕环，第{exit}出口'], ferry: ['登船，水路穿越'], merge: ['切入车流'], in: '{dist}后，{what}', onto: '，进{name}', reroute: ['路线已重算，保持警惕'], better: ['发现更快线路，省{min}分钟'], arrive: ['目标抵达，干净利落'], gpslost: ['信号丢失，进入静默'], test: '连接成功，语音上线。' } },
  canuck: { label: { zh: '加拿大老铁（搞笑）', en: 'Canuck (comedy)' }, pitch: 1.05, rate: 1, prefer: { en: /en-CA/i, zh: /zh/i },
    en: { left: ['Turn left there, eh?', 'Left up here, bud'], right: ['Hang a right there, eh?', 'Right turn, beauty'], slight_left: ['Little bit left, eh'], slight_right: ['Little bit right, eh'],
      sharp_left: ['Sharp left, like a slapshot'], sharp_right: ['Sharp right, like a slapshot'], straight: ['Keep straight, like the Trans-Canada'], uturn: ['Oh geez, flip a U-ey there'], depart: ['Alright, let\'s get \'er going'],
      roundabout: ['Round the roundabout, take exit {exit}, eh'], ferry: ['Ferry time, grab a double-double'], merge: ['Merge in nice and polite now'], in: 'In {dist}, {what}', onto: ', onto {name}',
      reroute: ['Sorry, recalculating, bud'], better: ['Found a quicker way, saves {min} minutes. Beauty!'], arrive: ['We made it, eh? Take off, you\'re here'], gpslost: ['Sorry, lost the GPS there, bud'], test: 'Hey there, how\'s it going, eh?' },
    zh: { left: ['老铁，左转哈'], right: ['右转哈，兄弟'], slight_left: ['稍微靠左哈'], slight_right: ['稍微靠右哈'], sharp_left: ['急左转，跟打冰球似的'], sharp_right: ['急右转，跟打冰球似的'], straight: ['一直走哈'], uturn: ['哎呀，掉个头吧'],
      depart: ['走起，整一杯热咖啡'], roundabout: ['转个圈，第{exit}个口出去哈'], ferry: ['上渡船啦'], merge: ['客客气气并个道'], in: '{dist}后，{what}', onto: '，上{name}', reroute: ['不好意思哈，重新算一下'], better: ['找到条快的，省{min}分钟，巴适'], arrive: ['到啦！辛苦辛苦'], gpslost: ['不好意思，定位丢了'], test: '你好呀老铁，今天咋样？' } },
};
const pick = a => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
export const voicePack = () => localStorage.getItem('voicePack') || 'standard';
function key(st) {
  if (st.type === 'roundabout' || st.type === 'rotary') return 'roundabout';
  if (st.mode === 'ferry' || st.type === 'ferry') return 'ferry';
  if (st.type === 'depart') return 'depart'; if (st.type === 'merge') return 'merge';
  const m = st.modifier || '';
  if (m === 'uturn') return 'uturn'; if (m.includes('sharp')) return m.includes('left') ? 'sharp_left' : 'sharp_right';
  if (m.includes('slight')) return m.includes('left') ? 'slight_left' : 'slight_right';
  if (m.includes('left')) return 'left'; if (m.includes('right')) return 'right'; return 'straight';
}
/** Text for an event. ev: 'step' (st, dist?), 'arrive', 'reroute', 'better' (min), 'gpslost', 'test' */
let clip = null; // v0.9.5 voice packs may ship recorded clips per event/manoeuvre key; say() plays it instead of TTS
export function phrase(ev, { st, dist, min } = {}) {
  const P = PACKS[voicePack()] || PACKS.standard, T = P[lang === 'zh' ? 'zh' : 'en'];
  clip = P.clips ? (P.clips[`${lang === 'zh' ? 'zh' : 'en'}.${ev === 'step' ? (st?.type === 'arrive' ? 'arrive' : key(st)) : ev}`] || P.clips[ev === 'step' ? (st?.type === 'arrive' ? 'arrive' : key(st)) : ev] || null) : null;
  if (!T) { // standard
    if (ev === 'step') { const i = key(st) === 'ferry' ? (lang === 'zh' ? '乘坐渡轮' : 'Take the ferry') : instruction(st); return dist ? (lang === 'zh' ? `${fmtDist(dist)}后，${i}` : `In ${fmtDist(dist)}, ${i}`) : i; }
    return { arrive: lang === 'zh' ? '到达目的地' : 'You have arrived', reroute: lang === 'zh' ? '正在重新规划路线' : 'Rerouting', better: lang === 'zh' ? `找到更快的路线，节省${min}分钟` : `Faster route found, saves ${min} min`, gpslost: lang === 'zh' ? 'GPS 信号丢失' : 'GPS signal lost', test: lang === 'zh' ? '这是标准导航语音。' : 'This is the standard navigation voice.' }[ev];
  }
  if (ev === 'step') {
    if (st.type === 'arrive') return pick(T.arrive);
    const what = fill(pick(T[key(st)]), { exit: st.exit || 1 }) + (st.name && key(st) !== 'depart' ? fill(T.onto, { name: st.name }) : '');
    return dist ? fill(T.in, { dist: fmtDist(dist), what }) : what;
  }
  return fill(pick(T[ev]), { min });
}
export function voices() { const l = lang === 'zh' ? /^zh/i : /^en/i; return (window.speechSynthesis?.getVoices() || []).filter(v => l.test(v.lang)); }
function chooseVoice(P) {
  const saved = localStorage.getItem('voiceName'), vs = voices(); if (saved) { const v = vs.find(x => x.name === saved); if (v) return v; }
  const pref = vs.filter(v => (P.prefer?.[lang === 'zh' ? 'zh' : 'en'] || (lang === 'zh' ? /zh/i : /en/i)).test(v.lang));
  const pool = pref.length ? pref : vs;
  if (P.deep) { const m = pool.find(v => /male|david|guy|fred|daniel|alex|aaron|james|ralph|bruce/i.test(v.name) && !/female/i.test(v.name)); if (m) return m; }
  return pool[0] || null;
}
export function say(text) {
  if (clip) { const c = clip; clip = null; try { const a = new Audio(c); a.play().catch(() => say(text)); return; } catch {} }
  if (text && window.__nativeSay) { const P = PACKS[voicePack()] || PACKS.standard; return window.__nativeSay(text, lang === 'zh' ? 'zh-CN' : (P === PACKS.canuck ? 'en-CA' : 'en-US'), P.rate, P.pitch); }
  if (!text || !window.speechSynthesis) return;
  try { const P = PACKS[voicePack()] || PACKS.standard, u = new SpeechSynthesisUtterance(text); u.lang = lang === 'zh' ? 'zh-CN' : (P === PACKS.canuck ? 'en-CA' : 'en-US');
    const v = chooseVoice(P); if (v) u.voice = v; u.pitch = P.pitch; u.rate = P.rate; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
}
