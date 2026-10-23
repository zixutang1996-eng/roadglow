package com.personal.nav.roadglow;

import static org.junit.Assert.*;
import org.junit.Test;

public class CarSkinStoreTest {
    static final String OK = "{\"version\":8,\"sprite\":\"{CAR}/sprite_dark\",\"glyphs\":\"{WEB}/glyphs/{fontstack}/{range}.pbf\",\"sources\":{\"t\":{\"type\":\"vector\"}},\"layers\":[{\"id\":\"bg\",\"type\":\"background\"},{\"id\":\"r\",\"type\":\"line\",\"source\":\"t\"}]}";
    @Test public void resolvesPlaceholders() {
        String r = CarSkinStore.resolve(OK, "file:///data/car/skin/", "asset://public/");
        assertTrue(r.contains("\"file:///data/car/skin/sprite_dark\""));
        assertTrue(r.contains("asset://public/glyphs/{fontstack}/{range}.pbf"));
        assertFalse(r.contains("{CAR}") || r.contains("{WEB}"));
        assertTrue(CarSkinStore.valid(r));
    }
    @Test public void rejectsBadStyles() {
        assertFalse(CarSkinStore.valid(null));
        assertFalse(CarSkinStore.valid("not json"));
        assertFalse(CarSkinStore.valid("{\"version\":7,\"sources\":{},\"layers\":[{\"id\":\"a\"}]}"));
        assertFalse(CarSkinStore.valid("{\"version\":8,\"sources\":{},\"layers\":[]}"));
        assertFalse(CarSkinStore.valid("{\"version\":8,\"sources\":{},\"layers\":[{\"id\":\"a\",\"source\":\"missing\"}]}"));
        assertFalse(CarSkinStore.valid("{\"version\":8,\"sources\":{\"t\":{}}"));
    }
}
