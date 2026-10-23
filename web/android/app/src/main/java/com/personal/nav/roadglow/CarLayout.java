package com.personal.nav.roadglow;

/**
 * v0.9.11 car-screen layout math (pure Java, unit-tested; also run on the JVM to lay out the preview mockups).
 * Input: surface size, the host's visible / stable areas (may be null) and density. Output: the skinned turn panel
 * rectangle + text sizes, and the map camera padding (which places the "me" marker so the route ahead stays clear).
 *
 * Classes by the usable area's aspect: WIDE (full-width landscape, ≥ 2:1), SPLIT (Coolwalk map card / 16:9-ish),
 * NARROW (portrait-ish or < 520 dp wide: panel becomes a top band). The panel sits top-left in the usable area; in
 * WIDE/SPLIT the camera is padded to the right of it, in NARROW below it. Text scales with the panel width.
 */
public final class CarLayout {
    public static final int WIDE = 0, SPLIT = 1, NARROW = 2;
    // reference sizes in dp at scale 1 (panel 360 dp wide)
    static final float REF_W = 360, PAD = 16, ARROW = 76, DIST = 46, STREET = 26, INFO = 22, LANE = 30, GAP = 8, MARGIN = 12;
    static final float MIN_SCALE = 0.8f, MAX_SCALE = 1.4f;

    public int kind; public int al, at, ar, ab;              // usable area
    public int pl, pt, pr, pb; public boolean panel;          // panel rect (px)
    public float scale, pad, arrow, dist, street, info, lane, gap; // px
    public int padL, padT, padR, padB;                        // camera padding (px from the surface edges)
    public float meX, meY;                                    // where the "me" marker lands (centre of the padded area)

    public static CarLayout compute(int w, int h, int[] visible, int[] stable, float density, boolean nav, boolean panel, boolean lanes) {
        CarLayout o = new CarLayout(); float d = density > 0 ? density : 1f;
        int[] a = usable(w, h, visible, stable); o.al = a[0]; o.at = a[1]; o.ar = a[2]; o.ab = a[3];
        int aw = o.ar - o.al, ah = o.ab - o.at; float ratio = ah > 0 ? (float) aw / ah : 1f;
        o.kind = (ratio < 1.25f || aw / d < 520) ? NARROW : ratio >= 2.0f ? WIDE : SPLIT;
        o.panel = panel && nav && aw > 0 && ah > 0;
        float m = MARGIN * d;
        if (o.panel) {
            float pw;
            if (o.kind == NARROW) pw = aw - 2 * m;
            else { float frac = o.kind == WIDE ? 0.32f : 0.42f, cap = o.kind == WIDE ? 0.40f : 0.50f;
                pw = Math.min(Math.max(frac * aw, 280 * d), Math.min(cap * aw, 460 * d)); }
            float s = clamp(pw / (REF_W * d), MIN_SCALE, MAX_SCALE);
            float maxH = (o.kind == NARROW ? 0.40f : 0.70f) * ah - m;
            float hh = height(s, lanes) * d;
            if (hh > maxH) { s = Math.max(MIN_SCALE * 0.85f, s * maxH / hh); hh = Math.min(height(s, lanes) * d, Math.max(maxH, 0)); }
            o.scale = s; o.pad = PAD * s * d; o.arrow = ARROW * s * d; o.dist = DIST * s * d; o.street = STREET * s * d; o.info = INFO * s * d; o.lane = LANE * s * d; o.gap = GAP * s * d;
            o.pl = Math.round(o.al + m); o.pt = Math.round(o.at + m); o.pr = Math.round(o.pl + pw); o.pb = Math.round(o.pt + hh);
        }
        // camera padding
        int l = o.al, t = o.at, r = w - o.ar, b = h - o.ab;
        if (o.panel && o.kind != NARROW) l = Math.round(o.pr + m - 0);
        if (o.panel && o.kind == NARROW) t = Math.round(o.pb + m);
        int innerH = h - t - b;
        if (nav) t += innerH / 3; // heading-up: "me" in the lower part, route ahead visible above
        // never leave less than 1/4 of the width / 1/5 of the height for the map focus
        if (w - l - r < aw / 4) l = Math.max(o.al, w - r - aw / 4);
        if (h - t - b < ah / 5) t = Math.max(o.at, h - b - ah / 5);
        o.padL = l; o.padT = t; o.padR = r; o.padB = b;
        o.meX = l + (w - l - r) / 2f; o.meY = t + (h - t - b) / 2f;
        return o;
    }
    /** visible area if valid, else stable, else the whole surface; always clipped to the surface */
    static int[] usable(int w, int h, int[] v, int[] s) {
        int[] r = ok(v, w, h) ? v : ok(s, w, h) ? s : new int[]{0, 0, w, h};
        return new int[]{Math.max(0, r[0]), Math.max(0, r[1]), Math.min(w, r[2]), Math.min(h, r[3])};
    }
    static boolean ok(int[] r, int w, int h) { return r != null && r.length == 4 && r[2] - r[0] > 50 && r[3] - r[1] > 50 && r[0] < w && r[1] < h; }
    /** panel height in dp at scale s: padding, main row (arrow vs. distance + 2 street lines), info row, optional lanes */
    static float height(float s, boolean lanes) {
        float main = Math.max(ARROW, DIST * 1.25f + 2 * STREET * 1.2f); // head fonts (script / brush) have tall ascent+descent
        return s * (2 * PAD + main + GAP + INFO * 1.5f + (lanes ? GAP + LANE : 0));
    }
    static float clamp(float v, float lo, float hi) { return Math.max(lo, Math.min(hi, v)); }
    public boolean overlapsPanel(float x, float y) { return panel && x >= pl && x <= pr && y >= pt && y <= pb; }

    /** "350 m" / "1.2 km" (zh uses 米 / 公里) */
    public static String dist(double m, boolean zh) {
        if (!(m >= 0)) m = 0;
        if (m >= 1000) { double k = Math.round(m / 100) / 10.0; String v = k >= 100 ? String.valueOf(Math.round(k)) : String.valueOf(k); return v + (zh ? " 公里" : " km"); }
        long v = m >= 100 ? Math.round(m / 10) * 10 : Math.round(m); return v + (zh ? " 米" : " m");
    }
    /** "1 h 05 min" / "12 min" (zh: 1小时5分 / 12分钟) */
    public static String dur(double sec, boolean zh) {
        long mn = Math.max(0, Math.round(sec / 60)); long hh = mn / 60, mm = mn % 60;
        if (hh > 0) return zh ? hh + "小时" + mm + "分" : hh + " h " + (mm < 10 ? "0" : "") + mm + " min";
        return zh ? mn + "分钟" : mn + " min";
    }
    /** lane string from the web side ("*left,straight|*right") → per lane: {valid?1:0, first indication} */
    public static String[][] lanes(String s) {
        if (s == null || s.trim().isEmpty()) return new String[0][];
        String[] ls = s.split(","); if (ls.length > 12) return new String[0][];
        String[][] o = new String[ls.length][];
        for (int i = 0; i < ls.length; i++) { String x = ls[i].trim(); boolean v = x.startsWith("*"); if (v) x = x.substring(1); String[] ind = x.split("\\|");
            String best = ind[0]; o[i] = new String[]{v ? "1" : "0", best.isEmpty() ? "none" : best}; }
        return o;
    }
}
