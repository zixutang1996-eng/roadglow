import 'package:flutter_test/flutter_test.dart';
import 'package:roadglow/nav/engine.dart';
import 'package:roadglow/services/geo.dart';

void main() {
  final geom = [const LatLon(53.5, -113.5), const LatLon(53.5, -113.49), const LatLon(53.51, -113.49)];
  NavRoute r() => NavRoute(geom, [
        RouteStep(geom[0], 'depart', '', 'A', 664, null),
        RouteStep(geom[1], 'turn', 'left', 'B', 1112, null),
        RouteStep(geom[2], 'arrive', '', '', 0, null),
      ], 1776, 120);
  test('announces, advances, arrives', () {
    final said = <String>[];
    final e = NavEngine(r(), speak: said.add, onOffRoute: () async {}, describe: (s) => s.type, fmt: (d) => 'in ${d.round()} ');
    e.update(const LatLon(53.5, -113.4985), 5); // ~100m before turn
    expect(said.last, startsWith('in '));
    e.update(const LatLon(53.5, -113.49), 5);
    expect(e.state.step, 2);
    e.update(const LatLon(53.51, -113.49), 5);
    expect(e.state.arrived, true);
  });
  test('off-route triggers reroute after 3 fixes', () async {
    var n = 0;
    final e = NavEngine(r(), speak: (_) {}, onOffRoute: () async => n++, describe: (s) => '', fmt: (d) => '');
    for (var i = 0; i < 4; i++) { e.update(const LatLon(53.52, -113.52), 5); }
    expect(n, 1);
  });
}
