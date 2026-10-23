package com.personal.nav.roadglow.car;

import android.app.Presentation;
import android.content.Context;
import android.graphics.Rect;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.car.app.AppManager;
import androidx.car.app.CarContext;
import androidx.car.app.SurfaceCallback;
import androidx.car.app.SurfaceContainer;
import com.personal.nav.roadglow.CarState;
import java.util.ArrayList;
import java.util.List;
import org.maplibre.android.MapLibre;
import org.maplibre.android.camera.CameraPosition;
import org.maplibre.android.camera.CameraUpdateFactory;
import org.maplibre.android.geometry.LatLng;
import org.maplibre.android.maps.MapLibreMap;
import org.maplibre.android.maps.MapLibreMapOptions;
import org.maplibre.android.maps.MapView;
import org.maplibre.android.maps.Style;
import org.maplibre.android.style.layers.LineLayer;
import org.maplibre.android.style.layers.Property;
import org.maplibre.android.style.layers.PropertyFactory;
import org.maplibre.android.style.layers.SymbolLayer;
import org.maplibre.android.style.sources.GeoJsonSource;
import org.maplibre.geojson.Feature;
import org.maplibre.geojson.FeatureCollection;
import org.maplibre.geojson.LineString;
import org.maplibre.geojson.Point;

/**
 * Draws the car map: the car host gives us a Surface; we wrap it in a VirtualDisplay and show a Presentation that
 * holds a MapLibre Native MapView with the phone's active skin style. Route line, "me" marker and place pins are
 * extra layers on top. Pan / zoom come from the host's SurfaceCallback gestures and the map action strip.
 */
final class CarMap implements SurfaceCallback, CarState.Listener {
    static final String DEFAULT_STYLE = "asset://public/styles/neon_dark.json";
    private final CarContext ctx; private final Handler ui = new Handler(Looper.getMainLooper());
    private VirtualDisplay vd; private Presentation pres; private MapView mv; private MapLibreMap map;
    private String loadedStyle = null; private Rect visible = null, stable = null; private int w, h;
    boolean follow = true; private List<double[]> pins = new ArrayList<>();
    private static CarMap I; static CarMap get(CarContext c) { if (I == null || I.ctx != c) I = new CarMap(c); return I; }
    private CarMap(CarContext c) { ctx = c; MapLibre.getInstance(c.getApplicationContext()); CarState.listen(this); }
    void register() { ctx.getCarService(AppManager.class).setSurfaceCallback(this); }

    @Override public void onSurfaceAvailable(@NonNull SurfaceContainer sc) {
        if (sc.getSurface() == null) return;
        w = sc.getWidth(); h = sc.getHeight();
        DisplayManager dm = ctx.getSystemService(DisplayManager.class);
        vd = dm.createVirtualDisplay("RoadGlowCar", w, h, sc.getDpi(), sc.getSurface(), DisplayManager.VIRTUAL_DISPLAY_FLAG_OWN_CONTENT_ONLY);
        pres = new Presentation(ctx, vd.getDisplay());
        MapLibreMapOptions o = MapLibreMapOptions.createFromAttributes(ctx).textureMode(false).attributionEnabled(true).logoEnabled(false).compassEnabled(false);
        mv = new MapView(pres.getContext(), o);
        pres.setContentView(mv, new ViewGroup.LayoutParams(w, h));
        pres.show(); mv.onCreate(null); mv.onStart(); mv.onResume();
        mv.getMapAsync(m -> { map = m; m.getUiSettings().setAttributionMargins(16, 0, 0, 16); applyStyle(); });
    }
    @Override public void onVisibleAreaChanged(@NonNull Rect r) { visible = r; padCamera(); }
    @Override public void onStableAreaChanged(@NonNull Rect r) { stable = r; }
    @Override public void onSurfaceDestroyed(@NonNull SurfaceContainer sc) {
        try { if (mv != null) { mv.onPause(); mv.onStop(); mv.onDestroy(); } } catch (Exception ignored) {}
        try { if (pres != null) pres.dismiss(); } catch (Exception ignored) {}
        if (vd != null) vd.release(); vd = null; pres = null; mv = null; map = null; loadedStyle = null;
    }
    @Override public void onScroll(float dx, float dy) { if (map == null) return; follow = false; map.scrollBy(-dx, -dy, 0); }
    @Override public void onScale(float fx, float fy, float s) { if (map == null) return; map.moveCamera(CameraUpdateFactory.zoomBy(Math.log(s) / Math.log(2))); }
    @Override public void onFling(float vx, float vy) {}

    void zoom(double d) { if (map != null) map.animateCamera(CameraUpdateFactory.zoomBy(d), 300); }
    void recenter() { follow = true; camera(500); }
    void setPins(List<double[]> p) { pins = p; ui.post(this::drawOverlays); if (!p.isEmpty() && map != null) { follow = false; map.animateCamera(CameraUpdateFactory.newLatLngZoom(new LatLng(p.get(0)[1], p.get(0)[0]), 13), 500); } }

    @Override public void onCarState(String what) { ui.post(() -> { if ("style".equals(what)) applyStyle(); else { drawOverlays(); if (follow) camera(800); } }); }

    private void padCamera() { if (map == null || visible == null) return; map.setPadding(visible.left, visible.top + (CarState.navActive ? (visible.height() / 3) : 0), w - visible.right, h - visible.bottom); }

    private void applyStyle() {
        if (map == null) return;
        String js = CarState.styleJson; String key = js != null ? js : DEFAULT_STYLE;
        if (key.equals(loadedStyle)) return; loadedStyle = key;
        Style.Builder b = js != null ? new Style.Builder().fromJson(js) : new Style.Builder().fromUri(DEFAULT_STYLE);
        map.setStyle(b, st -> {
            st.addImage("rg-me", Icons.me(CarState.skin, CarState.dark, CarState.ink));
            st.addImage("rg-pin", Icons.arrow("arrive", CarState.ink ? 0xffa0281e : 0xffe0457a));
            st.addSource(new GeoJsonSource("rg-route")); st.addSource(new GeoJsonSource("rg-me")); st.addSource(new GeoJsonSource("rg-pins"));
            int rc = routeColor();
            st.addLayer(new LineLayer("rg-route-case", "rg-route").withProperties(PropertyFactory.lineColor(CarState.dark ? 0xff05070c : 0xffffffff), PropertyFactory.lineWidth(13f), PropertyFactory.lineCap(Property.LINE_CAP_ROUND), PropertyFactory.lineJoin(Property.LINE_JOIN_ROUND)));
            st.addLayer(new LineLayer("rg-route-line", "rg-route").withProperties(PropertyFactory.lineColor(rc), PropertyFactory.lineWidth(8f), PropertyFactory.lineCap(Property.LINE_CAP_ROUND), PropertyFactory.lineJoin(Property.LINE_JOIN_ROUND)));
            st.addLayer(new SymbolLayer("rg-pins", "rg-pins").withProperties(PropertyFactory.iconImage("rg-pin"), PropertyFactory.iconAllowOverlap(true), PropertyFactory.iconSize(0.6f), PropertyFactory.iconAnchor(Property.ICON_ANCHOR_BOTTOM_LEFT)));
            st.addLayer(new SymbolLayer("rg-me", "rg-me").withProperties(PropertyFactory.iconImage("rg-me"), PropertyFactory.iconAllowOverlap(true), PropertyFactory.iconIgnorePlacement(true), PropertyFactory.iconSize(0.5f), PropertyFactory.iconRotationAlignment(Property.ICON_ROTATION_ALIGNMENT_MAP), PropertyFactory.iconRotate(org.maplibre.android.style.expressions.Expression.get("b"))));
            drawOverlays(); camera(0);
        });
    }
    private int routeColor() {
        if (CarState.ink) return CarState.dark ? 0xffc8a46a : 0xffa0281e;
        switch (CarState.skin) { case "west": return 0xff8a2f1c; case "nord": return 0xff7fb6d8; case "tac": return 0xffd9ff4a; case "space": return 0xfff2a33a; default: return 0xff4fd6e8; }
    }
    private void drawOverlays() {
        if (map == null || map.getStyle() == null || !map.getStyle().isFullyLoaded()) return;
        Style st = map.getStyle();
        GeoJsonSource r = st.getSourceAs("rg-route"), me = st.getSourceAs("rg-me"), pp = st.getSourceAs("rg-pins");
        double[] rt = CarState.route;
        if (r != null) { if (rt != null && rt.length >= 4) { List<Point> pts = new ArrayList<>(); for (int i = 0; i + 1 < rt.length; i += 2) pts.add(Point.fromLngLat(rt[i], rt[i + 1])); r.setGeoJson(LineString.fromLngLats(pts)); } else r.setGeoJson(FeatureCollection.fromFeatures(new Feature[0])); }
        if (me != null && !Double.isNaN(CarState.lat)) { Feature f = Feature.fromGeometry(Point.fromLngLat(CarState.lng, CarState.lat)); f.addNumberProperty("b", CarState.bearing); me.setGeoJson(f); }
        if (pp != null) { List<Feature> fs = new ArrayList<>(); for (double[] p : pins) fs.add(Feature.fromGeometry(Point.fromLngLat(p[0], p[1]))); pp.setGeoJson(FeatureCollection.fromFeatures(fs)); }
        padCamera();
    }
    private void camera(int ms) {
        if (map == null || Double.isNaN(CarState.lat)) return;
        CameraPosition.Builder b = new CameraPosition.Builder().target(new LatLng(CarState.lat, CarState.lng));
        if (CarState.navActive) b.zoom(16.5).tilt(45).bearing(CarState.bearing); else b.zoom(Math.max(map.getCameraPosition().zoom, 13)).tilt(0).bearing(0);
        if (ms <= 0) map.moveCamera(CameraUpdateFactory.newCameraPosition(b.build())); else map.animateCamera(CameraUpdateFactory.newCameraPosition(b.build()), ms);
    }
}
