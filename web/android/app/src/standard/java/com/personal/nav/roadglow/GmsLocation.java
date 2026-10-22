package com.personal.nav.roadglow;

import android.app.Activity;
import android.content.Context;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.Priority;

/** Standard edition: Google Play services "Turn on location" one-tap dialog. */
final class GmsLocation {
    static boolean available(Context c) {
        try { return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(c) == ConnectionResult.SUCCESS; } catch (Throwable t) { return false; }
    }
    /** @return false if GMS is unavailable (caller falls back to Settings) */
    static boolean resolve(Activity a, ActivityResultLauncher<IntentSenderRequest> launcher, Runnable fallback) {
        if (!available(a)) return false;
        LocationSettingsRequest req = new LocationSettingsRequest.Builder()
            .addLocationRequest(new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000).build()).setAlwaysShow(true).build();
        LocationServices.getSettingsClient(a).checkLocationSettings(req)
            .addOnSuccessListener(r -> fallback.run())
            .addOnFailureListener(e -> {
                if (e instanceof ResolvableApiException) {
                    try { launcher.launch(new IntentSenderRequest.Builder(((ResolvableApiException) e).getResolution()).build()); return; } catch (Throwable ignored) {}
                }
                fallback.run();
            });
        return true;
    }
}
