package com.personal.nav.roadglow;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * v0.9.4 in-app update channel: download the release APK (HTTPS, github.com / objects.githubusercontent.com only),
 * check that it is this app's package with a higher versionCode, then hand it to the system installer through
 * FileProvider. Android itself refuses the install if the signature differs, so data can never be replaced by a foreign build.
 */
@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {
    private volatile boolean cancel = false;

    private static boolean allowed(URL u) {
        String h = u.getHost();
        return "https".equals(u.getProtocol()) && (h.equals("github.com") || h.endsWith(".githubusercontent.com"));
    }

    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        try {
            PackageInfo pi = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            r.put("versionName", pi.versionName);
            r.put("versionCode", Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode);
        } catch (Exception ignored) {}
        String inst = null;
        try {
            PackageManager pm = getContext().getPackageManager();
            inst = Build.VERSION.SDK_INT >= 30 ? pm.getInstallSourceInfo(getContext().getPackageName()).getInstallingPackageName() : pm.getInstallerPackageName(getContext().getPackageName());
        } catch (Exception ignored) {}
        r.put("installer", inst);
        // Play build (no REQUEST_INSTALL_PACKAGES) or installed from Play: updates must come from Play
        r.put("store", "com.android.vending".equals(inst) || BuildConfig.FLAVOR.equals("play"));
        r.put("canInstall", Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls());
        r.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(r);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 26) {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        }
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) { cancel = true; call.resolve(); }

    @PluginMethod
    public void download(PluginCall call) {
        String url = call.getString("url");
        cancel = false;
        new Thread(() -> {
            File dir = new File(getContext().getCacheDir(), "updates"), out = new File(dir, "RoadGlow-update.apk");
            try {
                dir.mkdirs(); out.delete();
                URL u = new URL(url); HttpURLConnection c = null;
                for (int hop = 0; hop < 6; hop++) {
                    if (!allowed(u)) throw new Exception("host not allowed: " + u.getHost());
                    c = (HttpURLConnection) u.openConnection();
                    c.setInstanceFollowRedirects(false); c.setConnectTimeout(15000); c.setReadTimeout(30000);
                    int code = c.getResponseCode();
                    if (code >= 300 && code < 400) { u = new URL(u, c.getHeaderField("Location")); c.disconnect(); continue; }
                    if (code != 200) throw new Exception("HTTP " + code);
                    break;
                }
                long total = c.getContentLengthLong(), got = 0, last = 0; byte[] buf = new byte[65536];
                try (InputStream in = c.getInputStream(); FileOutputStream fo = new FileOutputStream(out)) {
                    int n; while ((n = in.read(buf)) > 0) {
                        if (cancel) throw new Exception("cancelled");
                        fo.write(buf, 0, n); got += n;
                        long now = System.currentTimeMillis();
                        if (now - last > 150) { last = now; JSObject p = new JSObject(); p.put("loaded", got); p.put("total", total); notifyListeners("progress", p); }
                    }
                }
                if (total > 0 && got != total) throw new Exception("incomplete download");
                PackageManager pm = getContext().getPackageManager();
                PackageInfo a = pm.getPackageArchiveInfo(out.getPath(), 0), me = pm.getPackageInfo(getContext().getPackageName(), 0);
                if (a == null) throw new Exception("not a valid APK");
                if (!getContext().getPackageName().equals(a.packageName)) throw new Exception("wrong package " + a.packageName);
                long av = Build.VERSION.SDK_INT >= 28 ? a.getLongVersionCode() : a.versionCode, mv = Build.VERSION.SDK_INT >= 28 ? me.getLongVersionCode() : me.versionCode;
                if (av <= mv) throw new Exception("not newer (" + av + " <= " + mv + ")");
                JSObject r = new JSObject(); r.put("path", out.getPath()); r.put("size", got); r.put("versionName", a.versionName); r.put("versionCode", av);
                call.resolve(r);
            } catch (Exception e) { out.delete(); call.reject(e.getMessage()); }
        }).start();
    }

    @PluginMethod
    public void install(PluginCall call) {
        File f = new File(getContext().getCacheDir(), "updates/RoadGlow-update.apk");
        if (!f.exists()) { call.reject("no downloaded APK"); return; }
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) { call.reject("NEED_PERMISSION"); return; }
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(uri, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }
}
