package com.personal.nav.roadglow;

import android.app.Activity;
import android.content.Context;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;

/** Beijing edition: no Google Play services dependency; always use the system Settings fallback. */
final class GmsLocation {
    static boolean available(Context c) { return false; }
    static boolean resolve(Activity a, ActivityResultLauncher<IntentSenderRequest> l, Runnable fallback) { return false; }
}
