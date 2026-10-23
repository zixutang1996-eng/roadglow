package com.personal.nav.roadglow;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/** v0.9.8: WebView ⇄ Android Auto bridge (see CarState and src/car.js). */
@CapacitorPlugin(name = "CarBridge")
public class CarBridgePlugin extends Plugin {
    @Override
    public void load() {
        CarState.sink = (name, lat, lng) -> {
            JSObject o = new JSObject(); o.put("name", name); o.put("lat", lat); o.put("lng", lng);
            notifyListeners("carDest", o, true);
        };
    }

    @PluginMethod
    public void setStyle(PluginCall c) {
        CarState.styleJson = c.getString("json", CarState.styleJson);
        CarState.skin = c.getString("skin", CarState.skin);
        CarState.dark = Boolean.TRUE.equals(c.getBoolean("dark", CarState.dark));
        CarState.ink = Boolean.TRUE.equals(c.getBoolean("ink", CarState.ink));
        CarState.zh = Boolean.TRUE.equals(c.getBoolean("zh", CarState.zh));
        CarState.fromWeb = true;
        CarState.emit("style"); c.resolve();
    }

    /** v0.9.10: persist the active skin's car styles (light + dark, + pack sprite sheets) for the car map. Older natives lack this → JS falls back to setStyle. */
    @PluginMethod
    public void setSkin(PluginCall c) {
        JSObject d = c.getData();
        final android.content.Context ctx = getContext();
        new Thread(() -> {
            boolean ok = CarSkinStore.save(ctx, d);
            if (ok) {
                CarState.skin = d.optString("id", CarState.skin); CarState.ink = d.optBoolean("ink", CarState.ink); CarState.zh = d.optBoolean("zh", CarState.zh);
                CarState.mode = d.optString("mode", CarState.mode); CarState.dark = d.optBoolean("dark", CarState.dark);
                CarState.routeLight = d.optString("route", null); CarState.routeDark = d.optString("routeDark", null);
                if (d.has("panelOn")) CarState.panelOn = d.optBoolean("panelOn", true);
                CarState.fromWeb = true; CarState.skinRev++; CarState.emit("style");
                c.resolve(new JSObject().put("ok", true));
            } else c.reject("invalid car style");
        }).start();
    }

    @PluginMethod
    public void pos(PluginCall c) {
        CarState.lat = c.getDouble("lat", CarState.lat); CarState.lng = c.getDouble("lng", CarState.lng);
        CarState.bearing = c.getDouble("bearing", CarState.bearing); CarState.emit("pos"); c.resolve();
    }

    @PluginMethod
    public void nav(PluginCall c) {
        CarState.navActive = Boolean.TRUE.equals(c.getBoolean("active", false));
        CarState.cue = c.getString("cue", ""); CarState.road = c.getString("road", ""); CarState.turn = c.getString("turn", "straight");
        CarState.destName = c.getString("dest", ""); CarState.distText = c.getString("distText", ""); CarState.remText = c.getString("remText", "");
        CarState.etaText = c.getString("etaText", ""); CarState.lanes = c.getString("lanes", "");
        CarState.stepDist = c.getDouble("stepDist", 0.0); CarState.remDist = c.getDouble("remDist", 0.0); CarState.etaSec = c.getDouble("eta", 0.0);
        if (c.hasOption("lat")) { CarState.lat = c.getDouble("lat"); CarState.lng = c.getDouble("lng"); CarState.bearing = c.getDouble("bearing", CarState.bearing); }
        try {
            JSArray r = c.getArray("route");
            if (r != null) { double[] f = new double[r.length()]; for (int i = 0; i < f.length; i++) f[i] = r.getDouble(i); CarState.route = f; }
            else if (!CarState.navActive) CarState.route = null;
        } catch (Exception ignored) {}
        CarState.emit("nav"); c.resolve();
    }

    /** JS asks for a destination picked on the car screen before the WebView was listening */
    @PluginMethod
    public void takePending(PluginCall c) {
        JSObject o = new JSObject();
        try { if (CarState.pendingDest != null) { o = JSObject.fromJSONObject(new JSONObject(CarState.pendingDest)); CarState.pendingDest = null; } } catch (Exception ignored) {}
        c.resolve(o);
    }
}
