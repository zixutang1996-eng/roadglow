package com.personal.nav.roadglow;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * v0.9.10: the phone's active skin (built-in or downloaded .rgpack) exported for the car map.
 * src/car.js sends both modes' MapLibre style (+ the pack's own sprite sheet, if any) via CarBridge.setSkin; it is stored
 * under files/car/skin/ so the car screen works offline and even before the phone UI has been opened in this process.
 * Styles keep two placeholders, resolved at load time:
 *   {CAR}/  → file:// of the exported skin dir (pack sprite sheets)
 *   {WEB}/  → the web bundle actually in use: live-update dir (file://) or the APK's asset://public/ (glyphs, base sprites)
 */
public final class CarSkinStore {
    private CarSkinStore() {}
    public static File dir(Context c) { return new File(c.getFilesDir(), "car/skin"); }

    /** Writes a skin atomically (tmp dir + rename). Returns false if any style is invalid (nothing is replaced then). */
    public static boolean save(Context c, JSONObject skin) {
        try {
            File root = new File(c.getFilesDir(), "car"), tmp = new File(root, "skin.tmp"), dst = dir(c), old = new File(root, "skin.old");
            del(tmp); tmp.mkdirs();
            for (String m : new String[]{"light", "dark"}) {
                JSONObject md = skin.optJSONObject(m); if (md == null) continue;
                String st = md.optString("style", null); if (!valid(st)) return false;
                write(new File(tmp, m + ".json"), st.getBytes(StandardCharsets.UTF_8));
                String sj = md.optString("spriteJson", null), sp = md.optString("spritePng", null);
                if (sj != null && sp != null && !sj.isEmpty() && !sp.isEmpty()) {
                    byte[] png = Base64.decode(sp.replaceFirst("^data:image/png;base64,", ""), Base64.DEFAULT);
                    for (String sfx : new String[]{"", "@2x"}) { write(new File(tmp, "sprite_" + m + sfx + ".json"), sj.getBytes(StandardCharsets.UTF_8)); write(new File(tmp, "sprite_" + m + sfx + ".png"), png); }
                }
            }
            JSONObject pan = skin.optJSONObject("panel"); // v0.9.11 skinned turn panel spec per mode (+ nine-slice art, optional ttf/otf)
            if (pan != null) for (String m : new String[]{"light", "dark"}) {
                JSONObject p = pan.optJSONObject(m); if (p == null) continue; p = new JSONObject(p.toString());
                for (String k : new String[]{"frame", "font"}) {
                    String[] du = dataUrl(p.optString(k, null)); p.remove(k);
                    if (du != null && (k.equals("frame") ? du[0].matches("image/(png|webp)") : du[0].matches("font/(ttf|otf)|application/(x-font-ttf|font-sfnt)"))) {
                        String fn = "panel_" + m + (k.equals("frame") ? ".img" : ".font"); write(new File(tmp, fn), Base64.decode(du[1], Base64.DEFAULT)); p.put(k + "File", fn); }
                }
                write(new File(tmp, "panel_" + m + ".json"), p.toString().getBytes(StandardCharsets.UTF_8));
            }
            JSONObject meta = new JSONObject(); for (String k : new String[]{"id", "version", "mode", "ink", "zh", "route", "routeDark", "panelOn"}) if (skin.has(k)) meta.put(k, skin.get(k));
            write(new File(tmp, "meta.json"), meta.toString().getBytes(StandardCharsets.UTF_8));
            del(old); if (dst.exists() && !dst.renameTo(old)) return false;
            if (!tmp.renameTo(dst)) { old.renameTo(dst); return false; }
            del(old); return true;
        } catch (Exception e) { return false; }
    }

    /** Resolved style for the mode (falls back to the other mode), or null if nothing valid is stored. */
    public static String load(Context c, boolean dark) {
        File d = dir(c);
        for (String m : dark ? new String[]{"dark", "light"} : new String[]{"light", "dark"}) {
            try { File f = new File(d, m + ".json"); if (!f.exists()) continue;
                String r = resolve(new String(readAll(f), StandardCharsets.UTF_8), "file://" + d.getAbsolutePath() + "/", webBase(c));
                if (valid(r)) return r;
            } catch (Exception ignored) {}
        }
        return null;
    }
    /** "data:image/png;base64,AAA" → {"image/png", "AAA"}; null if not a base64 data URL */
    public static String[] dataUrl(String s) {
        if (s == null) return null; java.util.regex.Matcher m = java.util.regex.Pattern.compile("^data:([\\w.+-]+/[\\w.+-]+);base64,(.+)$", java.util.regex.Pattern.DOTALL).matcher(s);
        return m.matches() ? new String[]{m.group(1).toLowerCase(java.util.Locale.ROOT), m.group(2)} : null;
    }
    /** v0.9.11 panel spec for the mode (falls back to the other mode); "frameFile"/"fontFile" become absolute paths. Null if none. */
    public static JSONObject panel(Context c, boolean dark) {
        File d = dir(c);
        for (String m : dark ? new String[]{"dark", "light"} : new String[]{"light", "dark"}) {
            try { JSONObject p = new JSONObject(new String(readAll(new File(d, "panel_" + m + ".json")), StandardCharsets.UTF_8));
                for (String k : new String[]{"frameFile", "fontFile"}) if (p.has(k)) { File f = new File(d, new File(p.getString(k)).getName()); if (f.exists()) p.put(k, f.getAbsolutePath()); else p.remove(k); }
                return p; } catch (Exception ignored) {}
        }
        return null;
    }
    public static JSONObject meta(Context c) {
        try { return new JSONObject(new String(readAll(new File(dir(c), "meta.json")), StandardCharsets.UTF_8)); } catch (Exception e) { return null; }
    }
    /** asset://public/ or the live-update bundle dir chosen by MainActivity (Capacitor serverBasePath) */
    public static String webBase(Context c) {
        SharedPreferences wv = c.getSharedPreferences("CapWebViewSettings", Context.MODE_PRIVATE);
        String p = wv.getString("serverBasePath", "");
        return p != null && !p.isEmpty() && new File(p, "index.html").exists() ? "file://" + new File(p).getAbsolutePath() + "/" : "asset://public/";
    }

    // ---- pure helpers (unit-tested on the JVM) ----
    public static String resolve(String raw, String carBase, String webBase) { return raw.replace("{CAR}/", carBase).replace("{WEB}/", webBase); }
    /** minimal MapLibre style sanity: version 8, sources object, non-empty layers, every layer source exists */
    public static boolean valid(String json) {
        if (json == null || json.length() > 8_000_000) return false;
        try { JSONObject o = new JSONObject(json); if (o.optInt("version") != 8) return false;
            JSONObject src = o.optJSONObject("sources"); JSONArray ls = o.optJSONArray("layers"); if (src == null || ls == null || ls.length() == 0) return false;
            for (int i = 0; i < ls.length(); i++) { JSONObject l = ls.getJSONObject(i); String s = l.optString("source", ""); if (!s.isEmpty() && !src.has(s)) return false; }
            return true;
        } catch (Exception e) { return false; }
    }
    /** API 24+ safe (java.nio.file needs API 26; NoSuchMethodError is not an Exception and would crash) */
    static byte[] readAll(File f) throws java.io.IOException {
        try (java.io.FileInputStream in = new java.io.FileInputStream(f)) { java.io.ByteArrayOutputStream o = new java.io.ByteArrayOutputStream(); byte[] b = new byte[16384]; int n; while ((n = in.read(b)) > 0) o.write(b, 0, n); return o.toByteArray(); }
    }
    private static void write(File f, byte[] b) throws Exception { try (FileOutputStream o = new FileOutputStream(f)) { o.write(b); } }
    private static void del(File f) { if (f == null || !f.exists()) return; File[] k = f.listFiles(); if (k != null) for (File x : k) del(x); f.delete(); }
}
