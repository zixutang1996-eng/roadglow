package com.personal.nav.roadglow;

import java.util.ArrayList;
import java.util.List;

/**
 * v0.9.8 Android Auto bridge state. The phone UI (WebView, src/car.js) pushes the active skin's map style and the
 * navigation state here via CarBridgePlugin; the car screen (src/standard/.../car) reads it and listens for changes.
 * Destinations picked on the car screen go the other way (CarBridgePlugin → JS "carDest" event).
 */
public final class CarState {
    private CarState() {}
    public static volatile String styleJson = null;   // resolved MapLibre style of the active skin (phone-side)
    public static volatile String skin = "neon";       // skin id, e.g. neon / west / space / nord / tac / sanguo
    public static volatile boolean dark = true, ink = false, zh = false;
    // v0.9.10: exported skin (CarSkinStore) — phone day/night setting ("auto" → follow the car's own night mode), route colours
    public static volatile String mode = "auto";
    public static volatile String routeLight = null, routeDark = null;
    public static volatile int skinRev = 0;            // bumped whenever a new skin export lands
    public static volatile boolean fromWeb = false;    // true once the WebView pushed state in this process
    // position
    public static volatile double lat = Double.NaN, lng = Double.NaN, bearing = 0;
    // navigation
    public static volatile boolean navActive = false;
    public static volatile String cue = "", road = "", turn = "straight", destName = "", distText = "", remText = "", etaText = "";
    public static volatile double stepDist = 0, remDist = 0, etaSec = 0;
    public static volatile double[] route = null;      // flat [lng,lat,lng,lat,...]

    public interface Listener { void onCarState(String what); }
    private static final List<Listener> L = new ArrayList<>();
    public static synchronized void listen(Listener l) { if (!L.contains(l)) L.add(l); }
    public static synchronized void unlisten(Listener l) { L.remove(l); }
    public static void emit(String what) { List<Listener> c; synchronized (CarState.class) { c = new ArrayList<>(L); } for (Listener l : c) try { l.onCarState(what); } catch (Exception ignored) {} }

    /** destination chosen on the car screen → phone JS (set by CarBridgePlugin while the app is running) */
    public interface DestSink { void dest(String name, double lat, double lng); }
    public static volatile DestSink sink = null;
    public static volatile String pendingDest = null; // JSON, delivered when the WebView attaches
}
