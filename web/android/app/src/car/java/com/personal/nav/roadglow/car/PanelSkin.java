package com.personal.nav.roadglow.car;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import com.personal.nav.roadglow.CarState;
import java.io.File;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.json.JSONObject;

/** v0.9.11: colours / nine-slice frame / fonts of the skinned car turn panel (exported by the phone, CarSkinStore.panel). */
final class PanelSkin {
    int bg = 0xff0b1622, bg2 = 0xff12324a, fg = 0xffe8fbff, muted = 0xff8fb3c4, accent = 0xff4fd6e8, border = 0xff4fd6e8, shadow = 0;
    float bw = 1.5f, radius = 12, sx = 0, sy = 0, fw = 0, outset = 0; int[] slice = null; Bitmap frame = null;
    Typeface head = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD), body = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD);
    boolean exported = false;

    static PanelSkin from(Context c, JSONObject p, boolean dark) {
        PanelSkin s = new PanelSkin();
        if (p == null) { s.fallback(dark); return s; }
        s.exported = true;
        s.bg = col(p, "bg", s.bg); s.bg2 = col(p, "bg2", s.bg); s.fg = col(p, "fg", s.fg); s.muted = col(p, "muted", s.muted); s.accent = col(p, "accent", s.accent);
        s.border = p.isNull("border") ? 0 : col(p, "border", 0); s.shadow = p.isNull("shadow") ? 0 : col(p, "shadow", 0);
        s.bw = (float) p.optDouble("bw", 0); s.radius = (float) p.optDouble("radius", 10); s.sx = (float) p.optDouble("sx", 0); s.sy = (float) p.optDouble("sy", 0);
        s.fw = (float) p.optDouble("fw", 30); s.outset = (float) p.optDouble("outset", 0);
        String ff = p.optString("frameFile", null);
        if (ff != null) try { s.frame = BitmapFactory.decodeFile(ff); org.json.JSONArray a = p.optJSONArray("slice");
            s.slice = new int[4]; for (int i = 0; i < 4; i++) s.slice[i] = a != null ? a.optInt(i, a.optInt(0, 40)) : 40;
            if (s.frame != null) for (int i = 0; i < 4; i++) s.slice[i] = Math.max(1, Math.min(s.slice[i], (i % 2 == 0 ? s.frame.getHeight() : s.frame.getWidth()) / 2 - 1));
        } catch (Exception | OutOfMemoryError e) { s.frame = null; }
        Typeface own = null; String fo = p.optString("fontFile", null);
        if (fo != null) try { own = Typeface.createFromFile(new File(fo)); } catch (Exception ignored) {}
        s.head = own != null ? own : font(c, p.optString("head", null), s.head);
        s.body = own != null ? own : font(c, p.optString("body", null), s.head);
        return s;
    }
    /** no export yet (phone UI never opened since install / older bundle): built-in look per skin id */
    private void fallback(boolean dark) {
        if (CarState.ink) { bg = dark ? 0xff1c1a18 : 0xffefe6d2; bg2 = bg; fg = dark ? 0xffddd3bf : 0xff221e1a; muted = dark ? 0xff9a9080 : 0xff5e5446; accent = dark ? 0xffd0583f : 0xffac3024; border = fg; bw = 2; radius = 4; }
        else if (!dark) { bg = 0xfff4fbfc; bg2 = 0xffdff1f3; fg = 0xff0b2a33; muted = 0xff4b6b74; accent = 0xff0b6f75; border = accent; }
    }
    static int col(JSONObject p, String k, int d) {
        String v = p.optString(k, null); if (v == null || !v.matches("#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?")) return d;
        long x = Long.parseLong(v.substring(1), 16); return v.length() == 7 ? (int) (0xff000000L | x) : (int) (((x & 0xff) << 24) | (x >> 8)); // #rrggbbaa → argb
    }
    private static Map<String, String> IDX = null; private static final Map<String, Typeface> CACHE = new HashMap<>();
    /** bundled ttf (assets/carfonts, converted from the phone's woff2) by CSS family; else the default */
    static synchronized Typeface font(Context c, String fam, Typeface d) {
        if (fam == null || fam.isEmpty()) return d; String k = fam.toLowerCase(Locale.ROOT);
        if (CACHE.containsKey(k)) { Typeface t = CACHE.get(k); return t != null ? t : d; }
        Typeface t = null;
        try {
            if (IDX == null) { IDX = new HashMap<>(); try (InputStream in = c.getAssets().open("carfonts/index.json")) {
                byte[] b = new byte[in.available()]; int n = in.read(b); JSONObject o = new JSONObject(new String(b, 0, Math.max(n, 0), "UTF-8"));
                for (java.util.Iterator<String> it = o.keys(); it.hasNext(); ) { String x = it.next(); IDX.put(x, o.getString(x)); } } }
            String f = IDX.get(k); if (f != null) t = Typeface.createFromAsset(c.getAssets(), "carfonts/" + f);
        } catch (Exception ignored) {}
        CACHE.put(k, t); return t != null ? t : d;
    }
    static int alpha(int c, float a) { return Color.argb(Math.round(Color.alpha(c) * a), Color.red(c), Color.green(c), Color.blue(c)); }
}
