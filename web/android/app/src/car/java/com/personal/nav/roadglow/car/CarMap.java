package com.personal.nav.roadglow.car;

import android.app.Presentation;
import android.content.Context;
import android.graphics.Rect;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import com.personal.nav.roadglow.CarLayout;
import androidx.annotation.NonNull;
import androidx.car.app.AppManager;
import androidx.car.app.CarContext;
import androidx.car.app.SurfaceCallback;
import androidx.car.app.SurfaceContainer;
import com.personal.nav.roadglow.CarState;
import com.personal.nav.roadglow.CarSkinStore;
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
    static final String DEFAULT_STYLE = "asset://public/car_default.json";
    private final CarContext ctx; private final Handler ui = new Handler(Looper.getMainLooper());
    private VirtualDisplay vd; private Presentation pres; private MapView mv; private MapLibreMap map;
    private String loadedStyle = null; private Rect visible = null, stable = null; private int w, h, dpi = 160;
    private PanelView panel; private PanelSkin skin = null; private CarLayout lay = null; private boolean skinDark = false;
    boolean follow = true; private List<double[]> pins = new ArrayList<>();
    private static CarMap I;
    static synchronized CarMap get(CarContext c) { if (I == null || I.ctx != c) { if (I != null) I.dispose(); I = new CarMap(c); } return I; }
    /** old session's instance: stop listening and drop its surface (a new CarContext means a new session) */
    private void dispose() { CarState.unlisten(this); ui.post(this::release); }
    private CarMap(CarContext c) { ctx = c; MapLibre.getInstance(c.getApplicationContext()); CarState.listen(this); restoreMeta(); }
    /** car started without the phone UI in this process: take skin id / ink / mode / route colours from the last export */
    private void restoreMeta() {
        if (CarState.fromWeb) return; org.json.JSONObject m = CarSkinStore.meta(ctx); if (m == null) return;
        CarState.skin = m.optString("id", CarState.skin); CarState.ink = m.optBoolean("ink", false); CarState.zh = m.optBoolean("zh", false);
        CarState.mode = m.optString("mode", "auto"); CarState.routeLight = m.optString("route", null); CarState.routeDark = m.optString("routeDark", null);
        CarState.panelOn = m.optBoolean("panelOn", true);
    }
    void restyle() { ui.post(this::applyStyle); }
    /** effective night mode: phone setting, or the car's own day/night when the phone is on auto */
    private boolean dark() {
        if ("light".equals(CarState.mode)) return false; if ("dark".equals(CarState.mode)) return true;
        try { return ctx.isDarkMode(); } catch (Exception e) { return CarState.dark; }
    }
    void register() { ctx.getCarService(AppManager.class).setSurfaceCallback(this); }

    @Override public void onSurfaceAvailable(@NonNull SurfaceContainer sc) {
        if (sc.getSurface() == null || sc.getWidth() <= 0 || sc.getHeight() <= 0) return;
        w = sc.getWidth(); h = sc.getHeight(); dpi = sc.getDpi() > 0 ? sc.getDpi() : 160;
        if (vd != null && pres != null && mv != null) { // v0.9.11: size / surface change (layout switch) → keep the map, resize the display
            try { vd.setSurface(sc.getSurface()); vd.resize(w, h, dpi); View root = (View) mv.getParent(); if (root != null) { root.setLayoutParams(new ViewGroup.LayoutParams(w, h)); root.requestLayout(); } relayout(); return; }
            catch (Exception e) { release(); }
        }
        DisplayManager dm = ctx.getSystemService(DisplayManager.class); if (dm == null) return;
        vd = dm.createVirtualDisplay("RoadGlowCar", w, h, sc.getDpi(), sc.getSurface(), DisplayManager.VIRTUAL_DISPLAY_FLAG_OWN_CONTENT_ONLY);
        if (vd == null) return;
        pres = new Presentation(ctx, vd.getDisplay());
        MapLibreMapOptions o = MapLibreMapOptions.createFromAttributes(ctx).textureMode(false).attributionEnabled(true).logoEnabled(false).compassEnabled(false);
        mv = new MapView(pres.getContext(), o);
        FrameLayout root = new FrameLayout(pres.getContext()); panel = new PanelView(pres.getContext());
        root.addView(mv, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(panel, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        pres.setContentView(root, new ViewGroup.LayoutParams(w, h));
        try { pres.show(); } catch (Exception e) { release(); return; }
        mv.onCreate(null); mv.onStart(); mv.onResume();
        relayout();
        mv.getMapAsync(m -> { if (mv == null) return; map = m; m.getUiSettings().setAttributionMargins(16, 0, 0, 16); applyStyle(); });
    }
    @Override public void onVisibleAreaChanged(@NonNull Rect r) { visible = new Rect(r); relayout(); }
    @Override public void onStableAreaChanged(@NonNull Rect r) { stable = new Rect(r); relayout(); }
    @Override public void onSurfaceDestroyed(@NonNull SurfaceContainer sc) { release(); }
    /** frees the MapLibre view, the Presentation and the VirtualDisplay (surface gone: disconnect, screen off, session end) */
    private void release() {
        try { if (mv != null) { mv.onPause(); mv.onStop(); mv.onDestroy(); } } catch (Exception ignored) {}
        try { if (pres != null) pres.dismiss(); } catch (Exception ignored) {}
        try { if (vd != null) vd.release(); } catch (Exception ignored) {}
        vd = null; pres = null; mv = null; map = null; panel = null; loadedStyle = null;
    }
    private int[] colors = null; private int colorsRev = -1;
    /** v0.9.11 template colours from the exported panel specs: {bgLight, bgDark, accentLight, accentDark} */
    int[] skinColors() {
        if (colors != null && colorsRev == CarState.skinRev) return colors;
        PanelSkin l = PanelSkin.from(ctx, CarSkinStore.panel(ctx, false), false), d = PanelSkin.from(ctx, CarSkinStore.panel(ctx, true), true);
        colors = new int[]{l.bg, d.bg, l.accent, d.accent}; colorsRev = CarState.skinRev; return colors;
    }
    /** whether the skinned panel replaces the template's routing card (NavScreen asks) */
    boolean panelActive() { return CarState.panelOn && panel != null; }
    private static int[] arr(Rect r) { return r == null ? null : new int[]{r.left, r.top, r.right, r.bottom}; }
    /** v0.9.11: layout for the current surface / visible area → panel rect + text sizes + camera padding */
    private void relayout() {
        if (w <= 0 || h <= 0) return;
        lay = CarLayout.compute(w, h, arr(visible), arr(stable), dpi / 160f, CarState.navActive, panelActive(), CarLayout.lanes(CarState.lanes).length > 1);
        if (panel != null) { boolean dk = dark(); if (skin == null || skinDark != dk) { skin = PanelSkin.from(ctx, CarSkinStore.panel(ctx, dk), dk); skinDark = dk; } panel.set(lay, skin); }
        padCamera();
    }
    @Override public void onScroll(float dx, float dy) { if (map == null) return; follow = false; map.scrollBy(-dx, -dy, 0); }
    @Override public void onScale(float fx, float fy, float s) { if (map == null) return; map.moveCamera(CameraUpdateFactory.zoomBy(Math.log(s) / Math.log(2))); }
    @Override public void onFling(float vx, float vy) {}

    void zoom(double d) { ui.post(() -> { if (map != null) map.animateCamera(CameraUpdateFactory.zoomBy(d), 300); }); }
    void recenter() { follow = true; ui.post(() -> camera(500)); }
    /** may be called from the search IO thread → all map work is posted to the UI thread (MapLibre is single-threaded) */
    void setPins(List<double[]> p) { final List<double[]> c = p == null ? new ArrayList<>() : new ArrayList<>(p); ui.post(() -> { pins = c; drawOverlays();
        if (!c.isEmpty() && map != null) { follow = false; map.animateCamera(CameraUpdateFactory.newLatLngZoom(new LatLng(c.get(0)[1], c.get(0)[0]), 13), 500); } }); }

    private boolean lastNav = false; private String lastLanes = "";
    @Override public void onCarState(String what) { ui.post(() -> {
        if ("style".equals(what)) { skin = null; relayout(); applyStyle(); return; }
        if (CarState.navActive != lastNav || !lastLanes.equals(CarState.lanes)) { lastNav = CarState.navActive; lastLanes = CarState.lanes; relayout(); }
        if (panel != null && "nav".equals(what)) panel.invalidate();
        drawOverlays(); if (follow) camera(800); }); }

    private void padCamera() { if (map == null || lay == null) return; map.setPadding(lay.padL, lay.padT, lay.padR, lay.padB); }

    private void applyStyle() {
        if (map == null) return;
        final boolean dk = dark(); if (skin == null || skinDark != dk) { skin = null; relayout(); }
        // 1) exported skin files (v0.9.10)  2) legacy in-memory style pushed by an older web bundle  3) built-in default
        String js = CarSkinStore.load(ctx, dk); String src = "file";
        if (js == null && CarState.styleJson != null && CarSkinStore.valid(CarState.styleJson)) { js = CarState.styleJson; src = "mem"; }
        String key = js != null ? src + CarState.skinRev + dk + js.length() + js.hashCode() : DEFAULT_STYLE + dk;
        if (key.equals(loadedStyle)) return; loadedStyle = key;
        Style.Builder b = js != null ? new Style.Builder().fromJson(js) : new Style.Builder().fromUri(DEFAULT_STYLE);
        map.setStyle(b, st -> {
            st.addImage("rg-me", Icons.me(CarState.skin, dk, CarState.ink));
            st.addImage("rg-pin", Icons.arrow("arrive", CarState.ink ? 0xffa0281e : 0xffe0457a));
            st.addSource(new GeoJsonSource("rg-route")); st.addSource(new GeoJsonSource("rg-me")); st.addSource(new GeoJsonSource("rg-pins"));
            int rc = routeColor(dk);
            st.addLayer(new LineLayer("rg-route-case", "rg-route").withProperties(PropertyFactory.lineColor(dk ? 0xff05070c : 0xffffffff), PropertyFactory.lineWidth(13f), PropertyFactory.lineCap(Property.LINE_CAP_ROUND), PropertyFactory.lineJoin(Property.LINE_JOIN_ROUND)));
            st.addLayer(new LineLayer("rg-route-line", "rg-route").withProperties(PropertyFactory.lineColor(rc), PropertyFactory.lineWidth(8f), PropertyFactory.lineCap(Property.LINE_CAP_ROUND), PropertyFactory.lineJoin(Property.LINE_JOIN_ROUND)));
            st.addLayer(new SymbolLayer("rg-pins", "rg-pins").withProperties(PropertyFactory.iconImage("rg-pin"), PropertyFactory.iconAllowOverlap(true), PropertyFactory.iconSize(0.6f), PropertyFactory.iconAnchor(Property.ICON_ANCHOR_BOTTOM_LEFT)));
            st.addLayer(new SymbolLayer("rg-me", "rg-me").withProperties(PropertyFactory.iconImage("rg-me"), PropertyFactory.iconAllowOverlap(true), PropertyFactory.iconIgnorePlacement(true), PropertyFactory.iconSize(0.5f), PropertyFactory.iconRotationAlignment(Property.ICON_ROTATION_ALIGNMENT_MAP), PropertyFactory.iconRotate(org.maplibre.android.style.expressions.Expression.get("b"))));
            drawOverlays(); camera(0);
        });
    }
    private int routeColor(boolean dk) {
        String t = dk ? CarState.routeDark : CarState.routeLight;
        if (t != null && t.matches("#[0-9a-fA-F]{6}")) return 0xff000000 | Integer.parseInt(t.substring(1), 16);
        if (CarState.ink) return dk ? 0xffc8a46a : 0xffa0281e;
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
