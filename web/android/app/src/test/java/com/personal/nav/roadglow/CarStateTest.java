package com.personal.nav.roadglow;

import static org.junit.Assert.*;
import org.junit.After;
import org.junit.Test;
import java.util.ArrayList;
import java.util.List;

/** v0.9.11 phone/car stop sync and host navigation bookkeeping (pure JVM). */
public class CarStateTest {
    @After public void reset() { CarState.sink = null; CarState.pendingDest = null; CarState.navActive = false; }

    @Test public void stopWithPhoneAttached() {
        List<String> got = new ArrayList<>(); CarState.sink = (n, a, b) -> got.add(n);
        CarState.navActive = true; CarState.pendingDest = "{}";
        List<String> ev = new ArrayList<>(); CarState.Listener l = ev::add; CarState.listen(l);
        try { assertTrue(CarState.stopFromCar()); } finally { CarState.unlisten(l); }
        assertEquals("__stop__", got.get(0)); assertFalse(CarState.navActive); assertNull(CarState.pendingDest); assertTrue(ev.contains("nav"));
    }
    @Test public void stopWithoutPhoneStillEndsCarNav() {
        CarState.navActive = true;
        assertFalse(CarState.stopFromCar()); assertFalse(CarState.navActive);
    }
    @Test public void sinkThrowingDoesNotBreakStop() {
        CarState.sink = (n, a, b) -> { throw new RuntimeException("webview gone"); }; CarState.navActive = true;
        assertFalse(CarState.stopFromCar()); assertFalse(CarState.navActive);
    }
    @Test public void listenerFailureIsolated() {
        List<String> ev = new ArrayList<>(); CarState.Listener bad = w -> { throw new IllegalStateException(); }, ok = ev::add;
        CarState.listen(bad); CarState.listen(ok);
        try { CarState.emit("style"); } finally { CarState.unlisten(bad); CarState.unlisten(ok); }
        assertEquals(1, ev.size());
    }
    @Test public void navTransitions() {
        assertEquals(1, CarState.navTransition(true, false)); assertEquals(-1, CarState.navTransition(false, true));
        assertEquals(0, CarState.navTransition(true, true)); assertEquals(0, CarState.navTransition(false, false));
    }
    @Test public void dataUrl() {
        String[] d = CarSkinStore.dataUrl("data:image/PNG;base64,iVBORw0KGgo=");
        assertEquals("image/png", d[0]); assertEquals("iVBORw0KGgo=", d[1]);
        assertNull(CarSkinStore.dataUrl("https://x/y.png")); assertNull(CarSkinStore.dataUrl(null));
        assertEquals("font/ttf", CarSkinStore.dataUrl("data:font/ttf;base64,AAEAAA")[0]);
    }
}
