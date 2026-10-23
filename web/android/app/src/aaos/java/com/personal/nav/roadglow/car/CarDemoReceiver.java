package com.personal.nav.roadglow.car;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.personal.nav.roadglow.CarState;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

/** TEST ONLY (aaos flavour): feeds CarState from adb, standing in for the phone WebView, for emulator screenshots.
 *  adb shell am broadcast -n com.personal.nav.roadglow.aaos/com.personal.nav.roadglow.car.CarDemoReceiver --es style neon_dark.json --es skin neon --ez dark true ... */
public class CarDemoReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        try {
            File dir = c.getExternalFilesDir(null);
            if (i.hasExtra("style")) CarState.styleJson = new String(Files.readAllBytes(new File(dir, i.getStringExtra("style")).toPath()), StandardCharsets.UTF_8);
            CarState.skin = i.getStringExtra("skin") != null ? i.getStringExtra("skin") : CarState.skin;
            CarState.dark = i.getBooleanExtra("dark", CarState.dark); CarState.ink = i.getBooleanExtra("ink", false); CarState.zh = i.getBooleanExtra("zh", false);
            CarState.lat = i.getDoubleExtra("lat", 51.0447); CarState.lng = i.getDoubleExtra("lng", -114.0719); CarState.bearing = i.getDoubleExtra("bearing", 0);
            CarState.navActive = i.getBooleanExtra("nav", false);
            CarState.cue = i.getStringExtra("cue") != null ? i.getStringExtra("cue") : ""; CarState.road = i.getStringExtra("road") != null ? i.getStringExtra("road") : "";
            CarState.turn = i.getStringExtra("turn") != null ? i.getStringExtra("turn") : "straight";
            CarState.stepDist = i.getDoubleExtra("step", 0); CarState.remDist = i.getDoubleExtra("rem", 0); CarState.etaSec = i.getDoubleExtra("eta", 0);
            if (i.hasExtra("route")) { String[] p = new String(Files.readAllBytes(new File(dir, i.getStringExtra("route")).toPath()), StandardCharsets.UTF_8).trim().split(","); double[] f = new double[p.length]; for (int k = 0; k < p.length; k++) f[k] = Double.parseDouble(p[k]); CarState.route = f; }
            else if (!CarState.navActive) CarState.route = null;
            CarState.emit("style"); CarState.emit("nav");
        } catch (Exception e) { android.util.Log.e("CarDemo", "demo", e); }
    }
}
