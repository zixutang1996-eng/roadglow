import 'dart:convert';
import 'dart:io' show File, Directory;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

enum MapTheme { neon, west }

/// Loads bundled style JSON and patches glyph URL + label language.
/// Same JSON files are shared by Android, iOS and Web.
class StyleRepo {
  String? _glyphBase;

  Future<String> _glyphs() async {
    if (_glyphBase != null) return _glyphBase!;
    if (kIsWeb) {
      final b = Uri.base.resolve('assets/assets/glyphs/').toString();
      return _glyphBase = '${b}{fontstack}/{range}.pbf';
    }
    // Native SDKs can read file:// URLs; copy bundled glyph PBFs once.
    final dir = Directory('${(await getApplicationSupportDirectory()).path}/glyphs_v1');
    final marker = File('${dir.path}/.done');
    if (!await marker.exists()) {
      final manifest = await AssetManifest.loadFromAssetBundle(rootBundle);
      for (final a in manifest.listAssets().where((a) => a.startsWith('assets/glyphs/'))) {
        final f = File('${dir.path}/${a.substring('assets/glyphs/'.length)}');
        await f.parent.create(recursive: true);
        final data = await rootBundle.load(a);
        await f.writeAsBytes(data.buffer.asUint8List(), flush: false);
      }
      await marker.writeAsString('1');
    }
    return _glyphBase = 'file://${dir.path}/{fontstack}/{range}.pbf';
  }

  Future<(String, String)> load(MapTheme t, bool dark, bool zh) async {
    final file = '${t.name}_${dark ? 'dark' : 'light'}';
    final raw = await rootBundle.loadString('assets/styles/$file.json');
    final j = jsonDecode(raw) as Map<String, dynamic>;
    j['glyphs'] = await _glyphs();
    final nameExpr = zh
        ? ['coalesce', ['get', 'name:zh-Hans'], ['get', 'name:zh'], ['get', 'name'], ['get', 'name:en']]
        : ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
    for (final l in j['layers'] as List) {
      final lay = l['layout'];
      if (lay is Map && lay.containsKey('text-field')) lay['text-field'] = nameExpr;
    }
    return (jsonEncode(j), (j['metadata']?['route'] ?? '#ffcc00') as String);
  }
}
