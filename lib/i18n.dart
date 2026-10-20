import 'services/geo.dart';

class T {
  final bool zh;
  T(this.zh);
  String s(String k) => (zh ? _zh : _en)[k] ?? k;
  static const _en = {
    'search': 'Search places', 'drive': 'Drive', 'walk': 'Walk', 'go': 'Start', 'stop': 'End',
    'route': 'Route', 'neon': 'Neon City', 'west': 'Frontier Ink', 'details': 'Details',
    'noloc': 'Waiting for GPS…', 'reroute': 'Rerouting', 'arrived': 'You have arrived',
    'navtitle': 'Navigating', 'navtext': 'Route guidance is active', 'battery_t': 'Keep navigation alive',
    'battery_b': 'On vivo/OriginOS, background navigation may be killed. Please allow: Settings → Battery → Background power consumption management → this app → "Allow high background power consumption"; also enable Auto-start in i Manager → App manager.',
    'open_settings': 'Open settings', 'later': 'Later', 'bg_loc': 'For lock-screen navigation, choose "Allow all the time" for location.',
    'err': 'Error', 'mins': 'min', 'km': 'km', 'm': 'm', 'lightdark': 'Light / Dark',
  };
  static const _zh = {
    'search': '搜索地点', 'drive': '驾车', 'walk': '步行', 'go': '开始导航', 'stop': '结束',
    'route': '路线', 'neon': '霓虹都市', 'west': '荒野墨图', 'details': '详情',
    'noloc': '正在等待 GPS…', 'reroute': '正在重新规划路线', 'arrived': '已到达目的地',
    'navtitle': '导航中', 'navtext': '路线引导进行中', 'battery_t': '保持后台导航',
    'battery_b': 'vivo/OriginOS 可能会在后台结束导航。请设置：设置 → 电池 → 后台耗电管理 → 本应用 → “允许后台高耗电”；并在 i管家 → 应用管理 → 自启动 中开启本应用。',
    'open_settings': '去设置', 'later': '稍后', 'bg_loc': '如需锁屏导航，请将定位权限设为“始终允许”。',
    'err': '出错了', 'mins': '分钟', 'km': '公里', 'm': '米', 'lightdark': '浅色 / 深色',
  };

  String dist(double m) => m >= 1000 ? '${(m / 1000).toStringAsFixed(1)} ${s('km')}' : '${(m / 10).round() * 10} ${s('m')}';

  String instruction(RouteStep st) {
    final n = st.name;
    const dirZh = {'left': '左转', 'right': '右转', 'slight left': '稍向左', 'slight right': '稍向右', 'sharp left': '向左急转',
      'sharp right': '向右急转', 'straight': '直行', 'uturn': '掉头'};
    const dirEn = {'left': 'Turn left', 'right': 'Turn right', 'slight left': 'Bear left', 'slight right': 'Bear right',
      'sharp left': 'Sharp left', 'sharp right': 'Sharp right', 'straight': 'Continue straight', 'uturn': 'Make a U-turn'};
    final d = (zh ? dirZh : dirEn)[st.modifier] ?? (zh ? '继续' : 'Continue');
    switch (st.type) {
      case 'depart': return zh ? '出发${n.isEmpty ? '' : '，沿$n行驶'}' : 'Head out${n.isEmpty ? '' : ' on $n'}';
      case 'arrive': return s('arrived');
      case 'roundabout': case 'rotary':
        return zh ? '进入环岛，第${st.exit ?? 1}个出口驶出${n.isEmpty ? '' : '，进入$n'}' : 'At the roundabout take exit ${st.exit ?? 1}${n.isEmpty ? '' : ' onto $n'}';
      case 'merge': return zh ? '并入${n.isEmpty ? '道路' : n}' : 'Merge${n.isEmpty ? '' : ' onto $n'}';
      case 'on ramp': return zh ? '$d，驶入匝道' : '$d onto the ramp';
      case 'off ramp': return zh ? '$d，驶出匝道${n.isEmpty ? '' : '前往$n'}' : '$d to take the exit${n.isEmpty ? '' : ' to $n'}';
      default: return zh ? '$d${n.isEmpty ? '' : '，进入$n'}' : '$d${n.isEmpty ? '' : ' onto $n'}';
    }
  }
}
