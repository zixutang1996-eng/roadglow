import 'dart:async';
import '../services/geo.dart';

/// Pure-Dart turn-by-turn state machine (platform independent, unit-testable).
class NavState {
  int step = 1; // next maneuver index (0 is depart)
  double toNext = 0, remaining = 0;
  bool arrived = false;
}

class NavEngine {
  NavRoute route;
  final void Function(String text) speak;
  final Future<void> Function() onOffRoute;
  final NavState state = NavState();
  final Set<String> _spoken = {};
  int _offCount = 0;
  bool _rerouting = false;
  String Function(RouteStep) describe;
  String Function(double) fmt;

  NavEngine(this.route, {required this.speak, required this.onOffRoute, required this.describe, required this.fmt});

  void replace(NavRoute r) { route = r; state.step = 1; _spoken.clear(); _offCount = 0; _rerouting = false; }

  double distanceToRoute(LatLon p) {
    var best = double.infinity;
    final g = route.geometry;
    for (var i = 0; i + 1 < g.length; i++) {
      final d = distToSegment(p, g[i], g[i + 1]);
      if (d < best) best = d;
    }
    return best;
  }

  void update(LatLon p, double accuracy) {
    if (state.arrived || route.steps.length < 2) return;
    final off = distanceToRoute(p);
    final thr = 40.0 + accuracy.clamp(0, 60);
    if (off > thr) {
      if (++_offCount >= 3 && !_rerouting) { _rerouting = true; onOffRoute(); }
    } else { _offCount = 0; }

    // advance step when we pass close to the maneuver point
    while (state.step < route.steps.length) {
      final d = haversine(p, route.steps[state.step].location);
      if (d < 18 && state.step < route.steps.length - 1) { state.step++; continue; }
      state.toNext = d;
      break;
    }
    final s = route.steps[state.step];
    var rem = state.toNext;
    for (var i = state.step; i < route.steps.length; i++) rem += route.steps[i].distance;
    state.remaining = rem;

    if (s.type == 'arrive' && state.toNext < 25) {
      state.arrived = true; speak(describe(s)); return;
    }
    for (final th in [800.0, 200.0, 40.0]) {
      final key = '${state.step}@$th';
      if (state.toNext <= th && !_spoken.contains(key)) {
        _spoken.addAll([for (final t in [800.0, 200.0, 40.0]) if (t >= th) '${state.step}@$t']);
        speak(th == 40 ? describe(s) : fmt(state.toNext) + describe(s));
        break;
      }
    }
  }
}
