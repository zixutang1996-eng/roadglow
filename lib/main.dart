import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:permission_handler/permission_handler.dart' as ph;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'i18n.dart';
import 'nav/engine.dart';
import 'services/geo.dart';
import 'styles.dart';

void main() => runApp(const RoadGlowApp());

class RoadGlowApp extends StatelessWidget {
  const RoadGlowApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'RoadGlow',
        debugShowCheckedModeBanner: false,
        supportedLocales: const [Locale('zh'), Locale('en')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.amber),
        darkTheme: ThemeData(useMaterial3: true, brightness: Brightness.dark, colorSchemeSeed: Colors.amber),
        home: const MapPage(),
      );
}

class MapPage extends StatefulWidget {
  const MapPage({super.key});
  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> with WidgetsBindingObserver {
  final styles = StyleRepo();
  final photon = PhotonService();
  final overpass = OverpassService();
  final NavRouter router = OsrmRouter();
  final tts = FlutterTts();
  MapLibreMapController? map;
  String? styleJson;
  String routeColor = '#ffcc00';
  MapTheme theme = MapTheme.neon;
  bool? darkOverride; // null = follow system
  late T t;
  bool zh = true;

  LatLon? me;
  double myAcc = 30;
  final searchCtl = TextEditingController();
  List<Place> results = [];
  Place? selected;
  Map<String, String>? tags;
  TravelMode mode = TravelMode.driving;
  NavRoute? route;
  NavEngine? engine;
  StreamSubscription<Position>? posSub;
  bool navigating = false;
  String? banner;
  Timer? _debounce;

  bool get dark => darkOverride ?? (WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.dark);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    final loc = WidgetsBinding.instance.platformDispatcher.locale;
    zh = loc.languageCode == 'zh';
    t = T(zh);
    _restore();
    tts.setLanguage(zh ? 'zh-CN' : 'en-US');
    tts.awaitSpeakCompletion(false);
    _initLocation();
  }

  @override
  void didChangePlatformBrightness() { if (darkOverride == null) _reloadStyle(); }

  @override
  void didChangeLocales(List<Locale>? locales) {
    final z = (locales?.first.languageCode ?? 'en') == 'zh';
    if (z != zh) { setState(() { zh = z; t = T(z); }); tts.setLanguage(zh ? 'zh-CN' : 'en-US'); _reloadStyle(); }
  }

  Future<void> _restore() async {
    final p = await SharedPreferences.getInstance();
    theme = MapTheme.values[p.getInt('theme') ?? 0];
    final d = p.getInt('dark') ?? -1;
    darkOverride = d < 0 ? null : d == 1;
    await _reloadStyle();
  }

  Future<void> _save() async {
    final p = await SharedPreferences.getInstance();
    p.setInt('theme', theme.index);
    p.setInt('dark', darkOverride == null ? -1 : (darkOverride! ? 1 : 0));
  }

  Future<void> _reloadStyle() async {
    final (s, c) = await styles.load(theme, dark, zh);
    routeColor = c;
    if (map != null && styleJson != null) {
      styleJson = s;
      await map!.setStyle(s);
    } else {
      setState(() => styleJson = s);
    }
  }

  Future<void> _initLocation() async {
    if (!kIsWeb) {
      if (defaultTargetPlatform == TargetPlatform.android) await ph.Permission.notification.request();
    }
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
    if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return;
    try {
      final p = await Geolocator.getCurrentPosition();
      _onPos(p);
      map?.animateCamera(CameraUpdate.newLatLngZoom(LatLng(p.latitude, p.longitude), 14));
    } catch (_) {}
    _listen(false);
  }

  LocationSettings _settings(bool nav) {
    if (kIsWeb) return const LocationSettings(accuracy: LocationAccuracy.best);
    if (defaultTargetPlatform == TargetPlatform.android) {
      return AndroidSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: nav ? 3 : 10,
        intervalDuration: Duration(milliseconds: nav ? 1000 : 3000),
        // Android 14+/16: foreground service of type "location" with persistent notification.
        foregroundNotificationConfig: nav
            ? ForegroundNotificationConfig(
                notificationTitle: t.s('navtitle'), notificationText: t.s('navtext'),
                notificationChannelName: t.s('navtitle'), enableWakeLock: true, setOngoing: true)
            : null,
      );
    }
    return AppleSettings(
      accuracy: LocationAccuracy.bestForNavigation, activityType: ActivityType.automotiveNavigation,
      distanceFilter: nav ? 3 : 10, pauseLocationUpdatesAutomatically: false,
      allowBackgroundLocationUpdates: nav, showBackgroundLocationIndicator: nav);
  }

  void _listen(bool nav) {
    posSub?.cancel();
    posSub = Geolocator.getPositionStream(locationSettings: _settings(nav)).listen(_onPos, onError: (_) {});
  }

  void _onPos(Position p) {
    me = LatLon(p.latitude, p.longitude);
    myAcc = p.accuracy;
    if (navigating && engine != null) {
      engine!.update(me!, myAcc);
      final b = (p.heading >= 0 && p.speed > 1) ? p.heading : null;
      map?.animateCamera(CameraUpdate.newCameraPosition(CameraPosition(
          target: LatLng(p.latitude, p.longitude), zoom: 17, tilt: 50, bearing: b ?? map!.cameraPosition?.bearing ?? 0)),
          duration: const Duration(milliseconds: 900));
      if (engine!.state.arrived) _stopNav();
      if (mounted) setState(() {});
    }
  }

  // ---------- route drawing ----------
  Future<void> _drawRoute() async {
    final m = map;
    if (m == null) return;
    for (final id in ['route-casing', 'route-line', 'dest']) { try { await m.removeLayer(id); } catch (_) {} }
    for (final id in ['route', 'destsrc']) { try { await m.removeSource(id); } catch (_) {} }
    if (route != null) {
      await m.addGeoJsonSource('route', {
        'type': 'FeatureCollection',
        'features': [{'type': 'Feature', 'properties': {}, 'geometry': {'type': 'LineString', 'coordinates': [for (final p in route!.geometry) [p.lon, p.lat]]}}]
      });
      await m.addLineLayer('route', 'route-casing', LineLayerProperties(
          lineColor: dark ? '#000000' : '#ffffff', lineWidth: 11, lineOpacity: 0.7, lineJoin: 'round', lineCap: 'round'));
      await m.addLineLayer('route', 'route-line', LineLayerProperties(
          lineColor: routeColor, lineWidth: 6, lineJoin: 'round', lineCap: 'round', lineBlur: theme == MapTheme.neon ? 1.5 : 0));
    }
    if (selected != null) {
      await m.addGeoJsonSource('destsrc', {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {}, 'geometry': {'type': 'Point', 'coordinates': [selected!.pos.lon, selected!.pos.lat]}}]});
      await m.addCircleLayer('destsrc', 'dest', CircleLayerProperties(
          circleRadius: 9, circleColor: routeColor, circleStrokeWidth: 3, circleStrokeColor: dark ? '#000000' : '#ffffff'));
    }
  }

  // ---------- search / details ----------
  void _onQuery(String q) {
    _debounce?.cancel();
    if (q.trim().length < 2) { setState(() => results = []); return; }
    _debounce = Timer(const Duration(milliseconds: 450), () async {
      try {
        final r = await photon.search(q, near: me ?? const LatLon(53.5461, -113.4938), lang: zh ? 'zh' : 'en');
        if (mounted) setState(() => results = r);
      } catch (e) { _toast('${t.s('err')}: $e'); }
    });
  }

  Future<void> _select(Place p) async {
    FocusScope.of(context).unfocus();
    setState(() { selected = p; results = []; tags = null; route = null; });
    map?.animateCamera(CameraUpdate.newLatLngZoom(LatLng(p.pos.lat, p.pos.lon), 15.5));
    _drawRoute();
    if (p.osmType != null && p.osmId != null) {
      try { final tg = await overpass.tags(p.osmType!, p.osmId!); if (mounted && selected == p) setState(() => tags = tg); } catch (_) {}
    }
  }

  Future<void> _planRoute() async {
    if (selected == null) return;
    if (me == null) { _toast(t.s('noloc')); return; }
    try {
      final r = await router.route(me!, selected!.pos, mode);
      setState(() => route = r);
      await _drawRoute();
      final lats = r.geometry.map((e) => e.lat), lons = r.geometry.map((e) => e.lon);
      map?.animateCamera(CameraUpdate.newLatLngBounds(
          LatLngBounds(southwest: LatLng(lats.reduce(math.min), lons.reduce(math.min)), northeast: LatLng(lats.reduce(math.max), lons.reduce(math.max))),
          left: 40, right: 70, top: 140, bottom: 260));
    } catch (e) { _toast('${t.s('err')}: $e'); }
  }

  // ---------- navigation ----------
  Future<void> _startNav() async {
    if (route == null) return;
    if (!kIsWeb) await _backgroundPermissionFlow();
    engine = NavEngine(route!,
        speak: (s) => tts.speak(s),
        describe: t.instruction,
        fmt: (d) => zh ? '${t.dist(d)}后，' : 'In ${t.dist(d)}, ',
        onOffRoute: () async {
          setState(() => banner = t.s('reroute'));
          tts.speak(t.s('reroute'));
          try {
            final r = await router.route(me!, selected!.pos, mode);
            route = r; engine!.replace(r); await _drawRoute();
          } catch (_) {}
          if (mounted) setState(() => banner = null);
        });
    setState(() => navigating = true);
    WakelockPlus.enable();
    _listen(true);
    tts.speak(t.instruction(route!.steps.first));
  }

  void _stopNav() {
    WakelockPlus.disable();
    setState(() { navigating = false; engine = null; });
    _listen(false); // restarting without foreground config removes the FGS notification
    map?.animateCamera(CameraUpdate.tiltTo(0));
  }

  Future<void> _backgroundPermissionFlow() async {
    if (defaultTargetPlatform != TargetPlatform.android) return; // iOS: "When In Use" + background mode suffices for active nav
    final prefs = await SharedPreferences.getInstance();
    if (!await ph.Permission.locationAlways.isGranted && !(prefs.getBool('askedAlways') ?? false)) {
      prefs.setBool('askedAlways', true);
      if (!mounted) return;
      _toast(t.s('bg_loc'));
      await ph.Permission.locationAlways.request();
    }
    if (!await ph.Permission.ignoreBatteryOptimizations.isGranted) {
      await ph.Permission.ignoreBatteryOptimizations.request();
    }
    if (!(prefs.getBool('vivoTip') ?? false) && mounted) {
      prefs.setBool('vivoTip', true);
      await showDialog(context: context, builder: (c) => AlertDialog(
        title: Text(t.s('battery_t')), content: Text(t.s('battery_b')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: Text(t.s('later'))),
          FilledButton(onPressed: () { Navigator.pop(c); ph.openAppSettings(); }, child: Text(t.s('open_settings'))),
        ]));
    }
  }

  void _toast(String s) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s)));

  // ---------- UI ----------
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final pad = MediaQuery.of(context).padding;
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(children: [
        if (styleJson != null)
          MapLibreMap(
            styleString: styleJson!,
            initialCameraPosition: const CameraPosition(target: LatLng(53.5461, -113.4938), zoom: 12),
            myLocationEnabled: true,
            myLocationRenderMode: MyLocationRenderMode.normal,
            trackCameraPosition: true,
            compassEnabled: true,
            compassViewPosition: CompassViewPosition.topRight,
            compassViewMargins: math.Point(12, pad.top + 76),
            attributionButtonPosition: AttributionButtonPosition.bottomLeft,
            onMapCreated: (c) => map = c,
            onStyleLoadedCallback: _drawRoute,
            onMapLongClick: (pt, ll) => _select(Place(zh ? '地图上的点' : 'Dropped pin',
                '${ll.latitude.toStringAsFixed(5)}, ${ll.longitude.toStringAsFixed(5)}', LatLon(ll.latitude, ll.longitude))),
          ),
        if (theme == MapTheme.west)
          IgnorePointer(child: Opacity(opacity: dark ? 0.35 : 0.6, child: Container(
              decoration: const BoxDecoration(image: DecorationImage(image: AssetImage('assets/paper.png'), repeat: ImageRepeat.repeat))))),
        // top: search (hidden while navigating) or nav banner
        Positioned(left: 12, right: 12, top: pad.top + 8, child: navigating ? _navBanner(cs) : _searchBox(cs)),
        // right edge, vertically centered: compact quick buttons so the map centre stays clear
        Positioned(right: 10, top: 0, bottom: 0, child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          _qb(theme == MapTheme.neon ? Icons.bolt : Icons.history_edu, theme == MapTheme.neon ? t.s('neon') : t.s('west'), () {
            setState(() => theme = theme == MapTheme.neon ? MapTheme.west : MapTheme.neon); _save(); _reloadStyle(); }),
          _qb(dark ? Icons.dark_mode : Icons.light_mode, t.s('lightdark'), () {
            setState(() => darkOverride = !dark); _save(); _reloadStyle(); }),
          _qb(Icons.my_location, 'GPS', () {
            if (me != null) map?.animateCamera(CameraUpdate.newLatLngZoom(LatLng(me!.lat, me!.lon), 16)); }),
        ]))),
        if (!navigating && selected != null) Positioned(left: 0, right: 0, bottom: 0, child: _placeCard(cs, pad)),
        if (navigating) Positioned(left: 12, right: 12, bottom: pad.bottom + 12, child: _navFooter(cs)),
      ]),
    );
  }

  Widget _qb(IconData i, String tip, VoidCallback f) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Material(
          color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.85), shape: const CircleBorder(), elevation: 2,
          child: IconButton(icon: Icon(i, size: 20), tooltip: tip, onPressed: f, visualDensity: VisualDensity.compact)),
      );

  Widget _searchBox(ColorScheme cs) => Column(children: [
        Material(elevation: 3, borderRadius: BorderRadius.circular(28), color: cs.surface,
          child: TextField(controller: searchCtl, onChanged: _onQuery, textInputAction: TextInputAction.search,
            decoration: InputDecoration(hintText: t.s('search'), prefixIcon: const Icon(Icons.search), border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
              suffixIcon: searchCtl.text.isEmpty ? null : IconButton(icon: const Icon(Icons.close), onPressed: () {
                searchCtl.clear(); setState(() { results = []; selected = null; route = null; }); _drawRoute(); })))),
        if (results.isNotEmpty)
          Container(margin: const EdgeInsets.only(top: 6), constraints: const BoxConstraints(maxHeight: 320),
            decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(16)),
            child: ListView(shrinkWrap: true, padding: EdgeInsets.zero, children: [
              for (final r in results) ListTile(dense: true, title: Text(r.name), subtitle: Text(r.subtitle, maxLines: 1), onTap: () => _select(r))
            ])),
      ]);

  Widget _placeCard(ColorScheme cs, EdgeInsets pad) {
    final p = selected!;
    final info = <String>[];
    if (tags != null) {
      for (final k in ['amenity', 'shop', 'tourism', 'cuisine', 'opening_hours', 'phone', 'website', 'addr:street']) {
        if (tags![k] != null) info.add('$k: ${tags![k]}');
      }
    }
    return Container(
      padding: EdgeInsets.fromLTRB(16, 14, 16, 12 + pad.bottom),
      decoration: BoxDecoration(color: cs.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          boxShadow: const [BoxShadow(blurRadius: 8, color: Colors.black26)]),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(p.name, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
        Text(p.subtitle, style: Theme.of(context).textTheme.bodySmall, maxLines: 1),
        if (info.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4),
            child: Text(info.take(4).join('\n'), style: Theme.of(context).textTheme.bodySmall)),
        const SizedBox(height: 8),
        Row(children: [
          SegmentedButton<TravelMode>(
            segments: [ButtonSegment(value: TravelMode.driving, icon: const Icon(Icons.directions_car), label: Text(t.s('drive'))),
              ButtonSegment(value: TravelMode.walking, icon: const Icon(Icons.directions_walk), label: Text(t.s('walk')))],
            selected: {mode}, showSelectedIcon: false,
            onSelectionChanged: (s) { setState(() => mode = s.first); if (route != null) _planRoute(); }),
          const Spacer(),
          route == null
              ? FilledButton.tonal(onPressed: _planRoute, child: Text(t.s('route')))
              : FilledButton(onPressed: _startNav, child: Text(t.s('go'))),
        ]),
        if (route != null) Padding(padding: const EdgeInsets.only(top: 6),
            child: Text('${t.dist(route!.distance)} · ${(route!.duration / 60).round()} ${t.s('mins')}')),
      ]),
    );
  }

  Widget _navBanner(ColorScheme cs) {
    final e = engine;
    final st = (e != null && e.state.step < e.route.steps.length) ? e.route.steps[e.state.step] : null;
    return Material(elevation: 4, borderRadius: BorderRadius.circular(16), color: cs.primaryContainer,
      child: Padding(padding: const EdgeInsets.all(14), child: Row(children: [
        Icon(_icon(st), size: 36),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(banner ?? (st == null ? '' : t.dist(e!.state.toNext)), style: Theme.of(context).textTheme.titleLarge),
          if (st != null) Text(t.instruction(st), maxLines: 2),
        ])),
      ])));
  }

  IconData _icon(RouteStep? s) {
    if (s == null) return Icons.navigation;
    if (s.type == 'arrive') return Icons.flag;
    if (s.type.contains('roundabout') || s.type == 'rotary') return Icons.roundabout_right;
    if (s.modifier.contains('left')) return Icons.turn_left;
    if (s.modifier.contains('right')) return Icons.turn_right;
    if (s.modifier == 'uturn') return Icons.u_turn_left;
    return Icons.straight;
  }

  Widget _navFooter(ColorScheme cs) => Material(elevation: 4, borderRadius: BorderRadius.circular(16), color: cs.surface,
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), child: Row(children: [
        Text('${t.dist(engine?.state.remaining ?? 0)}', style: Theme.of(context).textTheme.titleMedium),
        const Spacer(),
        FilledButton.icon(style: FilledButton.styleFrom(backgroundColor: cs.error), onPressed: _stopNav,
            icon: const Icon(Icons.close), label: Text(t.s('stop'))),
      ])));

  @override
  void dispose() { posSub?.cancel(); WidgetsBinding.instance.removeObserver(this); super.dispose(); }
}
