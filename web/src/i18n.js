const D = {
  zh: {search:'搜索地点或地址', menu:'菜单', saved:'已保存', recents:'最近', styles:'地图风格', neon:'霓虹都市', west:'荒野墨图',
    auto:'跟随系统', light:'浅色', dark:'深色', offline:'离线地图', offline_soon:'即将推出：按区域下载 PMTiles 离线地图', settings:'设置',
    language:'语言', lang_auto:'跟随浏览器', about:'关于与版权', directions:'路线', start:'开始', save:'保存', saved_ok:'已保存', share:'分享',
    copied:'链接已复制', drive:'驾车', walk:'步行', transit:'公交（即将推出）', from:'起点', to:'终点', mylocation:'我的位置',
    open:'营业中', closed:'已打烊', closes:'关门时间', opens:'开门时间', hours:'营业时间', phone:'电话', website:'网站',
    address:'地址', dropped:'已放置的图钉', whats_here:'这是哪里？', noresults:'没有结果', searching:'搜索中…', err:'出错了',
    restaurant:'餐厅', cafe:'咖啡', supermarket:'超市', fuel:'加油站', hotel:'酒店', park:'公园', pharmacy:'药店', atm:'ATM',
    charging:'充电站', parking:'停车场', min:'分钟', h:'小时', km:'公里', m:'米', steps:'路线步骤', arrive:'到达目的地',
    reroute:'正在重新规划路线', nav_end:'结束导航', clear_history:'清除历史', empty:'空', locate:'定位', layers:'图层', zoomin:'放大', zoomout:'缩小', compass:'指北',
    nominatim:'使用 Nominatim 补充搜索', coords:'坐标', nearby:'附近', more:'更多',
    about_text:'个人使用的导航应用。地图数据 © OpenStreetMap 贡献者 (ODbL)；矢量瓦片 OpenFreeMap / OpenMapTiles；搜索 Photon (komoot)、Nominatim；地点详情 Overpass；路线 FOSSGIS OSRM；照片 Wikimedia Commons；图标 Maki (CC0)；字体 Rajdhani、IM FELL English (OFL)。' },
  en: {search:'Search places or addresses', menu:'Menu', saved:'Saved', recents:'Recents', styles:'Map style', neon:'Neon City', west:'Frontier Ink',
    auto:'System', light:'Light', dark:'Dark', offline:'Offline maps', offline_soon:'Coming soon: download PMTiles regions', settings:'Settings',
    language:'Language', lang_auto:'Browser default', about:'About & attribution', directions:'Directions', start:'Start', save:'Save', saved_ok:'Saved', share:'Share',
    copied:'Link copied', drive:'Drive', walk:'Walk', transit:'Transit (soon)', from:'From', to:'To', mylocation:'Your location',
    open:'Open', closed:'Closed', closes:'Closes', opens:'Opens', hours:'Hours', phone:'Phone', website:'Website',
    address:'Address', dropped:'Dropped pin', whats_here:"What's here?", noresults:'No results', searching:'Searching…', err:'Error',
    restaurant:'Restaurants', cafe:'Coffee', supermarket:'Groceries', fuel:'Gas', hotel:'Hotels', park:'Parks', pharmacy:'Pharmacy', atm:'ATMs',
    charging:'EV charging', parking:'Parking', min:'min', h:'h', km:'km', m:'m', steps:'Steps', arrive:'You have arrived',
    reroute:'Rerouting', nav_end:'End', clear_history:'Clear history', empty:'Empty', locate:'Locate', layers:'Layers', zoomin:'Zoom in', zoomout:'Zoom out', compass:'Reset north',
    nominatim:'Search more with Nominatim', coords:'Coordinates', nearby:'Nearby', more:'More',
    about_text:'Personal navigation app. Map data © OpenStreetMap contributors (ODbL); vector tiles OpenFreeMap / OpenMapTiles; search Photon (komoot), Nominatim; details Overpass; routing FOSSGIS OSRM; photos Wikimedia Commons; icons Maki (CC0); fonts Rajdhani, IM FELL English (OFL).' },
};
export let lang = (localStorage.getItem('lang') || (navigator.language || 'en')).toLowerCase().startsWith('zh') ? 'zh' : 'en';
export const setLang = l => { if (l) localStorage.setItem('lang', l); else localStorage.removeItem('lang'); location.reload(); };
export const t = k => D[lang][k] ?? k;
export const fmtDist = m => m >= 1000 ? `${(m / 1000).toFixed(1)} ${t('km')}` : `${Math.round(m / 10) * 10} ${t('m')}`;
export const fmtDur = s => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)} ${t('h')} ${m % 60} ${t('min')}` : `${m} ${t('min')}`; };

const dirZh = {left:'左转', right:'右转', 'slight left':'稍向左', 'slight right':'稍向右', 'sharp left':'向左急转', 'sharp right':'向右急转', straight:'直行', uturn:'掉头'};
const dirEn = {left:'Turn left', right:'Turn right', 'slight left':'Bear left', 'slight right':'Bear right', 'sharp left':'Sharp left', 'sharp right':'Sharp right', straight:'Continue straight', uturn:'Make a U-turn'};
export function instruction(s) {
  const zh = lang === 'zh', n = s.name || '', d = (zh ? dirZh : dirEn)[s.modifier] || (zh ? '继续' : 'Continue');
  switch (s.type) {
    case 'depart': return zh ? `出发${n ? '，沿' + n + '行驶' : ''}` : `Head out${n ? ' on ' + n : ''}`;
    case 'arrive': return t('arrive');
    case 'roundabout': case 'rotary': return zh ? `进入环岛，第${s.exit || 1}个出口驶出${n ? '，进入' + n : ''}` : `At the roundabout take exit ${s.exit || 1}${n ? ' onto ' + n : ''}`;
    case 'merge': return zh ? `并入${n || '道路'}` : `Merge${n ? ' onto ' + n : ''}`;
    case 'on ramp': return zh ? `${d}，驶入匝道` : `${d} onto the ramp`;
    case 'off ramp': return zh ? `${d}，驶出匝道${n ? '前往' + n : ''}` : `${d} to take the exit${n ? ' to ' + n : ''}`;
    default: return zh ? `${d}${n ? '，进入' + n : ''}` : `${d}${n ? ' onto ' + n : ''}`;
  }
}
