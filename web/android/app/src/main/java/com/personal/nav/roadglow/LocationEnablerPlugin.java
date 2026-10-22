package com.personal.nav.roadglow;

import android.content.Context;
import android.content.Intent;
import android.location.LocationManager;
import android.provider.Settings;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.location.LocationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * v0.9.4: turn device location on when the user taps "locate".
 * Standard edition with Google Play services: one-tap system dialog (SettingsClient → resolution).
 * No GMS (Beijing edition, most Chinese-market phones): open the system location settings and
 * resolve automatically when the user comes back with location switched on.
 * The GMS code lives only in src/standard (GmsLocation); src/beijing has a stub, so that build has no GMS dependency.
 */
@CapacitorPlugin(name = "LocationEnabler")
public class LocationEnablerPlugin extends Plugin {
    private ActivityResultLauncher<IntentSenderRequest> launcher;
    private PluginCall pending; private boolean viaSettings;

    @Override
    public void load() {
        launcher = getActivity().registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), r -> finish("dialog"));
    }

    private boolean enabled() {
        LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        return lm != null && LocationManagerCompat.isLocationEnabled(lm);
    }

    private void finish(String how) {
        PluginCall c = pending; pending = null; viaSettings = false;
        if (c == null) return;
        JSObject r = new JSObject(); r.put("enabled", enabled()); r.put("via", how); c.resolve(r);
    }

    @PluginMethod
    public void status(PluginCall call) { JSObject r = new JSObject(); r.put("enabled", enabled()); r.put("gms", GmsLocation.available(getContext())); call.resolve(r); }

    @PluginMethod
    public void ensure(PluginCall call) {
        if (enabled()) { JSObject r = new JSObject(); r.put("enabled", true); r.put("via", "already"); call.resolve(r); return; }
        if (pending != null) pending.resolve(new JSObject().put("enabled", false).put("via", "superseded"));
        pending = call;
        getActivity().runOnUiThread(() -> {
            if (!GmsLocation.resolve(getActivity(), launcher, () -> getActivity().runOnUiThread(this::openSettings))) openSettings();
        });
    }

    private void openSettings() {
        viaSettings = true;
        try { Intent i = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS); getActivity().startActivity(i); }
        catch (Exception e) { finish("none"); }
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (viaSettings && pending != null) finish("settings");
    }
}
