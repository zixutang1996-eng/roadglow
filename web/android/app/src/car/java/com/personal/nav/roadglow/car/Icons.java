package com.personal.nav.roadglow.car;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import androidx.car.app.model.CarIcon;
import androidx.core.graphics.drawable.IconCompat;
import com.personal.nav.roadglow.CarState;

/** Programmatic icons (no third-party artwork): maneuver arrows, action-strip glyphs, the "me" marker. */
final class Icons {
    private Icons() {}
    static Paint stroke(int color, float w) { Paint p = new Paint(Paint.ANTI_ALIAS_FLAG); p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(w); p.setStrokeCap(Paint.Cap.ROUND); p.setStrokeJoin(Paint.Join.ROUND); p.setColor(color); return p; }

    /** arrow glyph on a 96px canvas, same shapes as the phone's ink arrows (src/nav.js AR) */
    static Bitmap arrow(String turn, int color) {
        Bitmap b = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888); Canvas c = new Canvas(b); c.scale(4, 4);
        Paint p = stroke(color, 2.6f); Path a = new Path();
        switch (turn) {
            case "left": case "slight left": case "sharp left":
                a.moveTo(17, 21); a.lineTo(17, 11.5f); a.quadTo(17, 7, 12.5f, 7); a.lineTo(5.5f, 7); a.moveTo(9.5f, 3); a.lineTo(5, 7); a.lineTo(9.5f, 11); break;
            case "right": case "slight right": case "sharp right":
                a.moveTo(7, 21); a.lineTo(7, 11.5f); a.quadTo(7, 7, 11.5f, 7); a.lineTo(18.5f, 7); a.moveTo(14.5f, 3); a.lineTo(19, 7); a.lineTo(14.5f, 11); break;
            case "uturn":
                a.moveTo(8, 21); a.lineTo(8, 9.5f); a.cubicTo(8, 3.5f, 17, 3.5f, 17, 9.5f); a.lineTo(17, 14); a.moveTo(13, 10.5f); a.lineTo(17, 14.5f); a.lineTo(21, 10.5f); break;
            case "arrive":
                a.moveTo(6, 21); a.lineTo(6, 3.5f); a.lineTo(17, 3.5f); a.lineTo(14.5f, 7.1f); a.lineTo(17, 11); a.lineTo(6, 11); break;
            default:
                a.moveTo(12, 21); a.lineTo(12, 4); a.moveTo(7.5f, 8.5f); a.lineTo(12, 4); a.lineTo(16.5f, 8.5f);
        }
        c.drawPath(a, p); return b;
    }
    static CarIcon maneuver(String turn) { return new CarIcon.Builder(IconCompat.createWithBitmap(arrow(turn, 0xffffffff))).build(); }

    static Bitmap glyph(String g) {
        Bitmap b = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888); Canvas c = new Canvas(b); Paint p = stroke(0xffffffff, 9);
        switch (g) {
            case "plus": c.drawLine(48, 20, 48, 76, p); c.drawLine(20, 48, 76, 48, p); break;
            case "minus": c.drawLine(20, 48, 76, 48, p); break;
            case "search": c.drawCircle(42, 42, 22, p); c.drawLine(58, 58, 78, 78, p); break;
            default: /* recenter */ c.drawCircle(48, 48, 24, p); Paint f = new Paint(Paint.ANTI_ALIAS_FLAG); f.setColor(0xffffffff); c.drawCircle(48, 48, 9, f);
                c.drawLine(48, 6, 48, 20, p); c.drawLine(48, 76, 48, 90, p); c.drawLine(6, 48, 20, 48, p); c.drawLine(76, 48, 90, 48, p);
        }
        return b;
    }
    static CarIcon icon(String g) { return new CarIcon.Builder(IconCompat.createWithBitmap(glyph(g))).build(); }

    /** "me" marker drawn on the map: ink bow-arrow tip for the ink skin, a glowing chevron otherwise */
    static Bitmap me(String skin, boolean dark, boolean ink) {
        Bitmap b = Bitmap.createBitmap(120, 120, Bitmap.Config.ARGB_8888); Canvas c = new Canvas(b);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG); Path tip = new Path();
        if (ink) {
            tip.moveTo(60, 8); tip.cubicTo(70, 40, 84, 70, 90, 100); tip.quadTo(60, 84, 30, 100); tip.cubicTo(36, 70, 50, 40, 60, 8); tip.close();
            fill.setColor(dark ? 0xffe8dcc2 : 0xff141210); c.drawPath(tip, fill);
            Paint s = stroke(dark ? 0xff141210 : 0xfff3ead8, 4); s.setAlpha(170); c.drawLine(60, 34, 60, 86, s);
        } else {
            int col = "west".equals(skin) ? 0xff8a2f1c : "nord".equals(skin) ? 0xff9cc8e0 : "tac".equals(skin) ? 0xffd9ff4a : "space".equals(skin) ? 0xfff2a33a : 0xff4fd6e8;
            Paint halo = new Paint(Paint.ANTI_ALIAS_FLAG); halo.setColor(col); halo.setAlpha(60); c.drawCircle(60, 64, 50, halo);
            tip.moveTo(60, 14); tip.lineTo(94, 98); tip.lineTo(60, 80); tip.lineTo(26, 98); tip.close();
            fill.setColor(col); c.drawPath(tip, fill); c.drawPath(tip, stroke(dark ? 0xff0b0f18 : 0xffffffff, 5));
        }
        return b;
    }
}
