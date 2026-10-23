package com.personal.nav.roadglow.car;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextUtils;
import android.view.View;
import com.personal.nav.roadglow.CarLayout;
import com.personal.nav.roadglow.CarState;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * v0.9.11 skinned turn-by-turn panel drawn on the car map Surface (inside the host's visible area, see CarLayout):
 * maneuver arrow + distance + street, ETA / remaining time / distance, optional lane hint. Colours, nine-slice frame
 * and fonts come from the phone skin (PanelSkin). Replaces the template's RoutingInfo card when enabled.
 */
final class PanelView extends View {
    private CarLayout lay; private PanelSkin sk = new PanelSkin(); private Bitmap arrowBmp; private String arrowKey = "";
    private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG); private final TextPaint tp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
    private final RectF rf = new RectF(); private final Rect src = new Rect(), dst = new Rect();
    PanelView(Context c) { super(c); setWillNotDraw(false); }
    void set(CarLayout l, PanelSkin s) { lay = l; if (s != null) sk = s; arrowKey = ""; invalidate(); }
    boolean showing() { return lay != null && lay.panel && CarState.navActive; }

    @Override protected void onDraw(Canvas c) {
        if (!showing()) return; final CarLayout l = lay; final PanelSkin s = sk; final float d = getResources().getDisplayMetrics().density * l.scale;
        rf.set(l.pl, l.pt, l.pr, l.pb); float rad = s.radius * d;
        // frame: pack nine-slice art, else gradient card + border + hard/soft shadow (phone nav banner look)
        float inset = 0;
        if (s.frame != null && s.slice != null) {
            float fw = Math.max(8, s.fw * d), o = s.outset * d * 0.5f;
            nine(c, s.frame, s.slice, new RectF(rf.left - o, rf.top - o, rf.right + o, rf.bottom + o), fw); inset = Math.max(0, fw * 0.45f - o);
        } else {
            if (s.shadow != 0) { p.setShader(null); p.setStyle(Paint.Style.FILL); p.setColor(s.shadow);
                if (s.sx == 0 && s.sy == 0) { p.setStrokeWidth(6 * d); p.setStyle(Paint.Style.STROKE); p.setColor(PanelSkin.alpha(s.shadow, 0.5f)); c.drawRoundRect(rf, rad, rad, p); }
                else { c.save(); c.translate(s.sx * d, s.sy * d); c.drawRoundRect(rf, rad, rad, p); c.restore(); } }
            p.setStyle(Paint.Style.FILL); p.setShader(new LinearGradient(0, rf.top, 0, rf.bottom, s.bg, s.bg2, Shader.TileMode.CLAMP)); c.drawRoundRect(rf, rad, rad, p); p.setShader(null);
            if (s.border != 0 && s.bw > 0) { p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(s.bw * d); p.setColor(s.border); float h = s.bw * d / 2; rf.inset(h, h); c.drawRoundRect(rf, rad, rad, p); rf.inset(-h, -h); }
            inset = s.bw * d;
        }
        float x0 = l.pl + l.pad + inset, y0 = l.pt + l.pad + inset * 0.5f, right = l.pr - l.pad - inset, bottom = l.pb - l.pad * 0.6f - inset * 0.5f;
        boolean zh = CarText.zh(); boolean arrive = "arrive".equals(CarState.turn);
        // arrow
        String key = CarState.turn + s.accent; if (!key.equals(arrowKey) || arrowBmp == null) { arrowBmp = Icons.arrow(CarState.turn, s.accent); arrowKey = key; }
        src.set(0, 0, arrowBmp.getWidth(), arrowBmp.getHeight()); dst.set(Math.round(x0), Math.round(y0), Math.round(x0 + l.arrow), Math.round(y0 + l.arrow)); c.drawBitmap(arrowBmp, src, dst, p);
        float xt = x0 + l.arrow + l.gap, tw = Math.max(10, right - xt);
        // distance (head font, large) or "arrive"
        tp.setColor(s.fg); tp.setTypeface(s.head); tp.setTextSize(l.dist);
        String dt = arrive && CarState.stepDist < 30 ? CarText.t("Arrived", "已到达", "已至") : CarLayout.dist(CarState.stepDist, zh);
        float dy = y0 - tp.ascent() * 0.92f; c.drawText(TextUtils.ellipsize(dt, tp, tw, TextUtils.TruncateAt.END).toString(), xt, dy, tp);
        // street / cue (body font, max 2 lines)
        String st = !CarState.road.isEmpty() ? CarState.road : !CarState.cue.isEmpty() ? CarState.cue : (arrive ? CarState.destName : "");
        float ty = dy + tp.descent() + l.gap * 0.4f;
        tp.setTypeface(s.body); tp.setTextSize(l.street); tp.setColor(s.fg);
        if (!st.isEmpty()) { StaticLayout sl = StaticLayout.Builder.obtain(st, 0, st.length(), tp, Math.round(tw)).setMaxLines(2).setEllipsize(TextUtils.TruncateAt.END)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL).setLineSpacing(0, 1.0f).setIncludePad(false).build();
            c.save(); c.translate(xt, ty); sl.draw(c); c.restore(); ty += sl.getHeight(); }
        float rowTop = Math.max(y0 + l.arrow, ty) + l.gap;
        // lanes
        String[][] lanes = CarLayout.lanes(CarState.lanes); float infoTop = rowTop;
        if (lanes.length > 1) { float lw = Math.min(l.lane * 0.9f, (right - x0) / lanes.length), lx = x0;
            for (String[] ln : lanes) { lane(c, lx + lw / 2, rowTop + l.lane / 2, Math.min(lw, l.lane) * 0.8f, ln[1], "1".equals(ln[0]) ? s.accent : PanelSkin.alpha(s.muted, 0.55f)); lx += lw; }
            infoTop = rowTop + l.lane + l.gap * 0.5f; }
        // divider + info row: ETA clock · remaining time · remaining distance
        p.setStyle(Paint.Style.FILL); p.setColor(PanelSkin.alpha(s.accent, 0.45f)); c.drawRect(x0, infoTop - l.gap * 0.5f - Math.max(1, d), right, infoTop - l.gap * 0.5f, p);
        tp.setTypeface(s.body); tp.setTextSize(l.info); tp.setColor(s.muted);
        String clock = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date(System.currentTimeMillis() + (long) (CarState.etaSec * 1000)));
        String info = (zh ? "到达 " : "ETA ") + clock + "  ·  " + CarLayout.dur(CarState.etaSec, zh) + "  ·  " + CarLayout.dist(CarState.remDist, zh);
        float iy = Math.min(infoTop - tp.ascent(), bottom); c.drawText(TextUtils.ellipsize(info, tp, right - x0, TextUtils.TruncateAt.END).toString(), x0, iy, tp);
    }
    /** nine-slice: corners unscaled to `bw`, edges stretched, centre filled */
    private void nine(Canvas c, Bitmap b, int[] sl, RectF r, float bw) {
        int W = b.getWidth(), H = b.getHeight(); int t = sl[0], rr = sl[1], bt = sl[2], lf = sl[3];
        float bwT = Math.min(bw, r.height() / 2), bwL = Math.min(bw, r.width() / 2);
        int[] xs = {0, lf, W - rr, W}, ys = {0, t, H - bt, H};
        float[] X = {r.left, r.left + bwL, r.right - bwL, r.right}, Y = {r.top, r.top + bwT, r.bottom - bwT, r.bottom};
        for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) { src.set(xs[j], ys[i], xs[j + 1], ys[i + 1]); rf.set(X[j], Y[i], X[j + 1], Y[i + 1]);
            if (src.width() > 0 && src.height() > 0 && rf.width() > 0 && rf.height() > 0) c.drawBitmap(b, src, rf, p); }
        rf.set(r);
    }
    /** small lane arrow: stem + head rotated by the indication */
    private void lane(Canvas c, float cx, float cy, float sz, String ind, int col) {
        float a; switch (ind) { case "left": a = -90; break; case "slight left": a = -45; break; case "sharp left": a = -135; break; case "right": a = 90; break;
            case "slight right": a = 45; break; case "sharp right": a = 135; break; case "uturn": a = 180; break; default: a = 0; }
        Paint s = Icons.stroke(col, Math.max(2, sz * 0.13f)); c.save(); c.translate(cx, cy);
        c.drawLine(0, sz / 2, 0, 0, s); c.rotate(a); c.drawLine(0, 0, 0, -sz / 2, s); c.drawLine(-sz * 0.22f, -sz * 0.28f, 0, -sz / 2, s); c.drawLine(sz * 0.22f, -sz * 0.28f, 0, -sz / 2, s); c.restore();
    }
}
