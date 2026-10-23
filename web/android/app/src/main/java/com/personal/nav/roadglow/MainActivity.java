package com.personal.nav.roadglow;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import java.io.File;

/**
 * Live web-update switch + automatic rollback (see src/updates.js).
 * JS stores a verified bundle dir in Preferences "lu_next"; we promote it here before the bridge starts.
 * Each healthy start JS writes "lu_ok" = active base path. If a live bundle starts 3 times without
 * reporting healthy, we drop it and the WebView serves the assets bundled in this APK again.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            SharedPreferences cs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
            SharedPreferences wv = getSharedPreferences("CapWebViewSettings", MODE_PRIVATE);
            SharedPreferences own = getSharedPreferences("rg_live", MODE_PRIVATE);
            String next = cs.getString("lu_next", null);
            if (next != null) {
                cs.edit().remove("lu_next").apply();
                if (new File(next, "index.html").exists()) { wv.edit().putString("serverBasePath", next).apply(); own.edit().putInt("tries", 0).apply(); }
            }
            String cur = wv.getString("serverBasePath", "");
            if (cur != null && !cur.isEmpty()) {
                if (cur.equals(cs.getString("lu_ok", ""))) own.edit().putInt("tries", 0).apply();
                else {
                    int t = own.getInt("tries", 0) + 1;
                    if (t >= 3 || !new File(cur, "index.html").exists()) {
                        wv.edit().putString("serverBasePath", "").apply();
                        cs.edit().putString("lu_bad", cur).apply();
                        t = 0;
                    }
                    own.edit().putInt("tries", t).apply();
                }
            }
        } catch (Exception ignored) {}
        registerPlugin(ApkUpdaterPlugin.class);
        registerPlugin(LocationEnablerPlugin.class);
        registerPlugin(CarBridgePlugin.class);
        super.onCreate(savedInstanceState);
        handlePack(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) { super.onNewIntent(intent); handlePack(intent); }

    /** v0.9.5: a pack file opened/shared to the app is read here and handed to JS (packs.js validates + hash-checks it). */
    private void handlePack(Intent in) {
        try {
            if (in == null) return;
            Uri u = null;
            if (Intent.ACTION_VIEW.equals(in.getAction())) u = in.getData();
            else if (Intent.ACTION_SEND.equals(in.getAction())) u = in.getParcelableExtra(Intent.EXTRA_STREAM);
            if (u == null) return;
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            try (InputStream is = getContentResolver().openInputStream(u)) {
                byte[] b = new byte[65536]; int n, tot = 0;
                while ((n = is.read(b)) > 0) { tot += n; if (tot > 12 * 1024 * 1024) return; bo.write(b, 0, n); }
            }
            String name = u.getLastPathSegment() == null ? "pack" : u.getLastPathSegment().replaceAll("[^A-Za-z0-9._-]", "_");
            final String data = "{\"tok\":\"" + System.currentTimeMillis() + "\",\"name\":\"" + name + "\",\"b64\":\"" + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP) + "\"}";
            Handler h = new Handler(Looper.getMainLooper());
            for (long d : new long[]{2500, 7000}) h.postDelayed(() -> { try { getBridge().triggerWindowJSEvent("rgPackFile", data); } catch (Exception ignored) {} }, d);
        } catch (Exception ignored) {}
    }
}
