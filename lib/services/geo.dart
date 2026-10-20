import 'dart:convert';
import 'dart:math' as math;
import 'package:http/http.dart' as http;

const _ua = {'User-Agent': 'RoadGlow-personal/0.1 (personal sideload app)'};

class LatLon {
  final double lat, lon;
  const LatLon(this.lat, this.lon);
}

double haversine(LatLon a, LatLon b) {
  const r = 6371000.0;
  final dLat = (b.lat - a.lat) * math.pi / 180, dLon = (b.lon - a.lon) * math.pi / 180;
  final h = math.pow(math.sin(dLat / 2), 2) +
      math.cos(a.lat * math.pi / 180) * math.cos(b.lat * math.pi / 180) * math.pow(math.sin(dLon / 2), 2);
  return 2 * r * math.asin(math.sqrt(h));
}

/// Distance (m) from p to segment a-b using local equirectangular projection.
double distToSegment(LatLon p, LatLon a, LatLon b) {
  final k = math.cos(p.lat * math.pi / 180) * 111320.0;
  final ax = (a.lon - p.lon) * k, ay = (a.lat - p.lat) * 110540.0;
  final bx = (b.lon - p.lon) * k, by = (b.lat - p.lat) * 110540.0;
  final dx = bx - ax, dy = by - ay;
  final len2 = dx * dx + dy * dy;
  var t = len2 == 0 ? 0.0 : -(ax * dx + ay * dy) / len2;
  t = t.clamp(0.0, 1.0);
  final x = ax + t * dx, y = ay + t * dy;
  return math.sqrt(x * x + y * y);
}

class Place {
  final String name, subtitle;
  final LatLon pos;
  final String? osmType; // N/W/R
  final int? osmId;
  Place(this.name, this.subtitle, this.pos, {this.osmType, this.osmId});
}

/// Photon (komoot) geocoder. Fair use only, no SLA.
class PhotonService {
  static const base = 'https://photon.komoot.io/api/';
  Future<List<Place>> search(String q, {LatLon? near, String lang = 'en'}) async {
    final params = {'q': q, 'limit': '10', 'lang': lang == 'zh' ? 'default' : 'en'};
    if (near != null) { params['lat'] = '${near.lat}'; params['lon'] = '${near.lon}'; }
    final r = await http.get(Uri.parse(base).replace(queryParameters: params), headers: _ua);
    if (r.statusCode != 200) throw Exception('Photon ${r.statusCode}');
    final j = jsonDecode(utf8.decode(r.bodyBytes));
    return [
      for (final f in j['features'])
        Place(
          (f['properties']['name'] ?? f['properties']['street'] ?? '?').toString(),
          [f['properties']['street'], f['properties']['housenumber'], f['properties']['city'], f['properties']['state']]
              .where((e) => e != null).join(' · '),
          LatLon((f['geometry']['coordinates'][1] as num).toDouble(), (f['geometry']['coordinates'][0] as num).toDouble()),
          osmType: f['properties']['osm_type'], osmId: f['properties']['osm_id'],
        )
    ];
  }
}

/// Overpass: fetch OSM tags of a single element.
class OverpassService {
  static const base = 'https://overpass-api.de/api/interpreter';
  Future<Map<String, String>> tags(String osmType, int id) async {
    final t = {'N': 'node', 'W': 'way', 'R': 'relation'}[osmType] ?? 'node';
    final r = await http.post(Uri.parse(base), body: {'data': '[out:json][timeout:15];$t($id);out tags;'}, headers: _ua);
    if (r.statusCode != 200) throw Exception('Overpass ${r.statusCode}');
    final els = jsonDecode(utf8.decode(r.bodyBytes))['elements'] as List;
    if (els.isEmpty) return {};
    return (els.first['tags'] as Map? ?? {}).map((k, v) => MapEntry(k.toString(), v.toString()));
  }
}

enum TravelMode { driving, walking } // later: transit, ferry (Transitous/MOTIS)

class RouteStep {
  final LatLon location;
  final String type, modifier, name;
  final double distance; // metres of this step
  final int? exit;
  RouteStep(this.location, this.type, this.modifier, this.name, this.distance, this.exit);
}

class NavRoute {
  final List<LatLon> geometry;
  final List<RouteStep> steps;
  final double distance, duration;
  NavRoute(this.geometry, this.steps, this.distance, this.duration);
}

abstract class NavRouter { Future<NavRoute> route(LatLon from, LatLon to, TravelMode mode); }

/// FOSSGIS-hosted OSRM (routing.openstreetmap.de). Free, fair use, no SLA.
class OsrmRouter implements NavRouter {
  @override
  Future<NavRoute> route(LatLon from, LatLon to, TravelMode mode) async {
    final prof = mode == TravelMode.walking ? 'routed-foot' : 'routed-car';
    final url = 'https://routing.openstreetmap.de/$prof/route/v1/driving/'
        '${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true';
    final r = await http.get(Uri.parse(url), headers: _ua);
    if (r.statusCode != 200) throw Exception('OSRM ${r.statusCode}');
    final j = jsonDecode(r.body);
    if (j['code'] != 'Ok') throw Exception('OSRM ${j['code']}');
    final rt = j['routes'][0];
    final geom = [for (final c in rt['geometry']['coordinates']) LatLon((c[1] as num).toDouble(), (c[0] as num).toDouble())];
    final steps = <RouteStep>[];
    for (final leg in rt['legs']) {
      for (final s in leg['steps']) {
        final m = s['maneuver'];
        steps.add(RouteStep(LatLon((m['location'][1] as num).toDouble(), (m['location'][0] as num).toDouble()),
            m['type'] ?? '', m['modifier'] ?? '', (s['name'] ?? '').toString(), (s['distance'] as num).toDouble(), m['exit']));
      }
    }
    return NavRoute(geom, steps, (rt['distance'] as num).toDouble(), (rt['duration'] as num).toDouble());
  }
}
