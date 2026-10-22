const D = {
  zh: {search:'搜索地点或地址', menu:'菜单', saved:'已保存', recents:'最近', styles:'地图风格', neon:'霓虹都市', west:'荒野墨图', space:'深空', nord:'北境', tac:'战术',
    auto:'跟随系统', light:'浅色', dark:'深色', offline:'离线地图', offline_soon:'即将推出：按区域下载 PMTiles 离线地图', settings:'设置',
    language:'语言', lang_auto:'跟随浏览器', about:'关于与版权', directions:'路线', start:'开始', save:'保存', saved_ok:'已保存', share:'分享',
    copied:'链接已复制', drive:'驾车', walk:'步行', transit:'公交', from:'起点', to:'终点', mylocation:'我的位置',
    open:'营业中', closed:'已打烊', closes:'关门时间', opens:'开门时间', hours:'营业时间', phone:'电话', website:'网站',
    address:'地址', dropped:'已放置的图钉', whats_here:'这是哪里？', noresults:'没有结果', searching:'搜索中…', err:'出错了',
    restaurant:'餐厅', cafe:'咖啡', supermarket:'超市', fuel:'加油站', hotel:'酒店', park:'公园', pharmacy:'药店', atm:'ATM',
    charging:'充电站', parking:'停车场', min:'分钟', h:'小时', km:'公里', m:'米', steps:'路线步骤', arrive:'到达目的地',
    reroute:'正在重新规划路线', nav_end:'结束导航', clear_history:'清除历史', empty:'空', locate:'定位', layers:'图层', zoomin:'放大', zoomout:'缩小', compass:'指北',
    nominatim:'使用 Nominatim 补充搜索', coords:'坐标', nearby:'附近', more:'更多',
    about_text:'个人使用的导航应用。地图数据 © OpenStreetMap 贡献者 (ODbL)；矢量瓦片 OpenFreeMap / OpenMapTiles；搜索 Photon (komoot)、Nominatim；地点详情 Overpass；路线 FOSSGIS OSRM；照片 Wikimedia Commons；支线任务 Wikidata (CC0)；公交 Transitous (MOTIS)；天气 Open-Meteo (CC BY 4.0)；图标 Maki (CC0)；字体 Rajdhani、IM FELL English (OFL)。埃德蒙顿门牌地址：Contains information licensed under the Open Government Licence – City of Edmonton（市政府开放数据 Parcel Addresses，不含邮编）。' },
  en: {search:'Search places or addresses', menu:'Menu', saved:'Saved', recents:'Recents', styles:'Map style', neon:'Neon City', west:'Frontier Ink', space:'Deep Space', nord:'Northland', tac:'Tactical',
    auto:'System', light:'Light', dark:'Dark', offline:'Offline maps', offline_soon:'Coming soon: download PMTiles regions', settings:'Settings',
    language:'Language', lang_auto:'Browser default', about:'About & attribution', directions:'Directions', start:'Start', save:'Save', saved_ok:'Saved', share:'Share',
    copied:'Link copied', drive:'Drive', walk:'Walk', transit:'Transit', from:'From', to:'To', mylocation:'Your location',
    open:'Open', closed:'Closed', closes:'Closes', opens:'Opens', hours:'Hours', phone:'Phone', website:'Website',
    address:'Address', dropped:'Dropped pin', whats_here:"What's here?", noresults:'No results', searching:'Searching…', err:'Error',
    restaurant:'Restaurants', cafe:'Coffee', supermarket:'Groceries', fuel:'Gas', hotel:'Hotels', park:'Parks', pharmacy:'Pharmacy', atm:'ATMs',
    charging:'EV charging', parking:'Parking', min:'min', h:'h', km:'km', m:'m', steps:'Steps', arrive:'You have arrived',
    reroute:'Rerouting', nav_end:'End', clear_history:'Clear history', empty:'Empty', locate:'Locate', layers:'Layers', zoomin:'Zoom in', zoomout:'Zoom out', compass:'Reset north',
    nominatim:'Search more with Nominatim', coords:'Coordinates', nearby:'Nearby', more:'More',
    about_text:'Personal navigation app. Map data © OpenStreetMap contributors (ODbL); vector tiles OpenFreeMap / OpenMapTiles; search Photon (komoot), Nominatim; details Overpass; routing FOSSGIS OSRM; photos Wikimedia Commons; side quests Wikidata (CC0); transit Transitous (MOTIS); weather Open-Meteo (CC BY 4.0); icons Maki (CC0); fonts Rajdhani, IM FELL English (OFL). Edmonton address points: Contains information licensed under the Open Government Licence – City of Edmonton (Open Data "Parcel Addresses"; no postal codes).' },
};
export let lang = (localStorage.getItem('lang') || ((import.meta.env||{}).VITE_EDITION === 'beijing' ? 'zh' : navigator.language || 'en')).toLowerCase().startsWith('zh') ? 'zh' : 'en';
export const setLang = l => { if (l) localStorage.setItem('lang', l); else localStorage.removeItem('lang'); location.reload(); };
// v0.9.6: skin packs may override Chinese UI strings (poetic wording). OV.t: i18n keys; OV.L: inline L('中文', 'en') strings.
export const OV = { t: {}, L: {}, dir: {} };
const clean = o => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}).filter(([k, v]) => typeof k === 'string' && typeof v === 'string' && k.length <= 200 && v.length <= 300).slice(0, 2000).map(([k, v]) => [k, v.replace(/[<>&"'`]/g, '')]));
export function setOverrides(s) { const z = lang === 'zh' && s && s.zh ? s.zh : {}; OV.t = clean(z.t); OV.L = clean(z.L); OV.dir = clean(z.dir); OV.units = z.units === 'classical' ? 'classical' : ''; }
export const tz = (k, def) => (lang === 'zh' && OV.t[k]) || def;
// classical Chinese numerals / units (skin option "units":"classical"): 1 步 ≈ 1.5 m, 1 里 = 500 m, 1 刻 = 15 min, 1 时辰 = 2 h
const CN = '〇一二三四五六七八九';
export function cnNum(n) { n = Math.round(n); if (n < 10) return CN[n]; if (n < 20) return '十' + (n % 10 ? CN[n % 10] : ''); if (n < 100) return CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : '');
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return CN[h] + '百' + (r ? (r < 10 ? '零' + CN[r] : (r < 20 ? '一' : '') + cnNum(r)) : ''); }
  if (n < 10000) { const k = Math.floor(n / 1000), r = n % 1000; return CN[k] + '千' + (r ? (r < 100 ? '零' : '') + cnNum(r) : ''); } return String(n); }
const classical = () => lang === 'zh' && OV.units === 'classical';
export const t = k => (lang === 'zh' && OV.t[k]) || (D[lang][k] ?? k);
export const fmtDist = m => classical() ? (m < 750 ? `${cnNum(Math.max(10, Math.round(m / 1.5 / (m < 150 ? 10 : 50)) * (m < 150 ? 10 : 50)))}步` : (h => (h >> 1 ? (h >> 1 === 2 ? '两' : cnNum(h >> 1)) + '里' + (h & 1 ? '半' : '') : '半里'))(Math.round(m / 250))) : m >= 1000 ? `${(m / 1000).toFixed(1)} ${t('km')}` : `${Math.round(m / 10) * 10} ${t('m')}`;
export const fmtDur = s => { if (classical()) { const m = s / 60; return m < 10 ? '片刻' : m < 105 ? `${cnNum(Math.max(1, Math.round(m / 15)))}刻钟` : (h => `${h >> 1 === 2 ? '两' : cnNum(h >> 1)}${h & 1 ? '个半时辰' : '个时辰'}`)(Math.round(m / 60)); } const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)} ${t('h')} ${m % 60} ${t('min')}` : `${m} ${t('min')}`; };

const dirZh = {left:'左转', right:'右转', 'slight left':'稍向左', 'slight right':'稍向右', 'sharp left':'向左急转', 'sharp right':'向右急转', straight:'直行', uturn:'掉头'};
const dirEn = {left:'Turn left', right:'Turn right', 'slight left':'Bear left', 'slight right':'Bear right', 'sharp left':'Sharp left', 'sharp right':'Sharp right', straight:'Continue straight', uturn:'Make a U-turn'};
export function instruction(s) {
  const zh = lang === 'zh', n = s.name || '', d = (zh && OV.dir[s.modifier]) || (zh ? dirZh : dirEn)[s.modifier] || (zh ? (OV.dir.cont || '继续') : 'Continue');
  switch (s.type) {
    case 'depart': return zh ? `${OV.t.depart || '出发'}${n ? (OV.t.along || '，沿') + n + (OV.t.along2 ?? '行驶') : ''}` : `Head out${n ? ' on ' + n : ''}`;
    case 'arrive': return t('arrive');
    case 'roundabout': case 'rotary': return zh ? `进入环岛，第${s.exit || 1}个出口驶出${n ? '，进入' + n : ''}` : `At the roundabout take exit ${s.exit || 1}${n ? ' onto ' + n : ''}`;
    case 'merge': return zh ? `并入${n || '道路'}` : `Merge${n ? ' onto ' + n : ''}`;
    case 'on ramp': return zh ? `${d}，驶入匝道` : `${d} onto the ramp`;
    case 'off ramp': return zh ? `${d}，驶出匝道${n ? '前往' + n : ''}` : `${d} to take the exit${n ? ' to ' + n : ''}`;
    default: return zh ? `${d}${n ? (OV.t.onto || '，进入') + n : ''}` : `${d}${n ? ' onto ' + n : ''}`;
  }
}
