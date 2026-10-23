package com.personal.nav.roadglow;

import static org.junit.Assert.*;
import org.junit.Test;

/** v0.9.11 layout math for the skinned car panel: full-width, split ("Coolwalk") and narrow surfaces. */
public class CarLayoutTest {
    static int[] R(int l, int t, int r, int b) { return new int[]{l, t, r, b}; }
    static void inside(CarLayout o, int[] v) {
        assertTrue("panel inside visible area", o.pl >= v[0] && o.pt >= v[1] && o.pr <= v[2] && o.pb <= v[3]);
        assertTrue(o.pr > o.pl && o.pb > o.pt);
    }
    static void meClear(CarLayout o) {
        assertFalse("me marker must not sit under the panel", o.overlapsPanel(o.meX, o.meY));
        assertTrue(o.meX > o.al && o.meX < o.ar && o.meY > o.at && o.meY < o.ab);
    }

    @Test public void wide1920() {
        int[] v = R(0, 0, 1920, 720);
        CarLayout o = CarLayout.compute(1920, 720, v, v, 2f, true, true, true);
        assertEquals(CarLayout.WIDE, o.kind); inside(o, v); meClear(o);
        assertTrue("panel ≤ 40% width", o.pr - o.pl <= 0.40f * 1920 + 1);
        assertTrue(o.scale >= 0.8f && o.scale <= 1.4f);
        assertTrue("camera padded past the panel", o.padL >= o.pr);
    }
    @Test public void splitCoolwalk() {
        // map gets the left ~2/3; the host reports it through the visible area
        int[] v = R(0, 0, 1280, 720);
        CarLayout o = CarLayout.compute(1280, 720, v, v, 1.5f, true, true, false);
        assertEquals(CarLayout.SPLIT, o.kind); inside(o, v); meClear(o);
        assertTrue(o.pr - o.pl <= 0.50f * 1280 + 1);
    }
    @Test public void splitViaVisibleArea() {
        int[] v = R(0, 0, 1280, 720); // surface 1920 wide, right third covered by media/messages
        CarLayout o = CarLayout.compute(1920, 720, v, v, 1.5f, true, true, true);
        assertNotEquals(CarLayout.WIDE, o.kind); inside(o, v); meClear(o);
        assertTrue(o.meX < 1280);
    }
    @Test public void small800at160dpiIsSideBySide() {
        int[] v = R(0, 0, 800, 480); // 800 dp wide → room for a side panel
        CarLayout o = CarLayout.compute(800, 480, v, v, 1f, true, true, true);
        assertEquals(CarLayout.SPLIT, o.kind); inside(o, v); meClear(o);
    }
    @Test public void narrow800() {
        int[] v = R(0, 0, 800, 480); // high-density 800x480 → 400 dp: panel goes on top
        CarLayout o = CarLayout.compute(800, 480, v, v, 2f, true, true, true);
        assertEquals(CarLayout.NARROW, o.kind); inside(o, v); meClear(o);
        assertTrue("narrow panel ≤ 40% height", o.pb - o.pt <= 0.40f * 480 + 1);
        assertTrue(o.padT >= o.pb);
    }
    @Test public void insetsRespected() {
        int[] v = R(100, 60, 1820, 700), st = R(80, 40, 1840, 710);
        CarLayout o = CarLayout.compute(1920, 720, v, st, 2f, true, true, true);
        inside(o, v); meClear(o);
    }
    @Test public void badAreasFallBackToSurface() {
        CarLayout o = CarLayout.compute(1920, 720, null, R(0, 0, 10, 10), 2f, false, true, false);
        assertEquals(0, o.al); assertEquals(1920, o.ar);
    }
    @Test public void textScalesButStaysLegible() {
        int[] a = R(0, 0, 800, 480), b = R(0, 0, 1920, 720);
        CarLayout s = CarLayout.compute(800, 480, a, a, 1f, true, true, false), l = CarLayout.compute(1920, 720, b, b, 1f, true, true, false);
        assertTrue(l.dist >= s.dist);
        assertTrue("distance text ≥ 0.8×46dp", s.dist >= 46 * 0.8f * 1f - 0.5f);
    }
    @Test public void noPanel() {
        int[] v = R(0, 0, 1920, 720);
        CarLayout o = CarLayout.compute(1920, 720, v, v, 2f, true, false, false);
        assertFalse(o.panel); assertFalse(o.overlapsPanel(o.meX, o.meY));
    }
    @Test public void sweepNoOverlap() {
        float[] ds = {1f, 1.5f, 2f, 3f};
        for (int w = 600; w <= 2600; w += 100) for (int h = 400; h <= 1200; h += 100) for (float d : ds) for (int k = 0; k < 4; k++) {
            int[] v = R(0, 0, k == 1 ? (int) (w * 0.66f) : w, h);
            CarLayout o = CarLayout.compute(w, h, v, v, d, k != 3, true, k % 2 == 0);
            if (!o.panel) continue;
            assertTrue(w + "x" + h + "@" + d, o.pl >= v[0] && o.pr <= v[2] && o.pb <= v[3]);
            assertFalse(w + "x" + h + "@" + d, o.overlapsPanel(o.meX, o.meY));
        }
    }
    @Test public void formatting() {
        assertEquals(0, CarLayout.lanes("").length);
        String[][] l = CarLayout.lanes("*left,straight|right");
        assertEquals(2, l.length); assertEquals("1", l[0][0]); assertEquals("left", l[0][1]); assertEquals("0", l[1][0]); assertEquals("straight", l[1][1]);
        assertNotNull(CarLayout.dist(120, false)); assertNotNull(CarLayout.dist(12500, true)); assertNotNull(CarLayout.dur(3725, false));
    }
}
