package com.personal.nav.roadglow;

import android.content.SharedPreferences;
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
        super.onCreate(savedInstanceState);
    }
}
