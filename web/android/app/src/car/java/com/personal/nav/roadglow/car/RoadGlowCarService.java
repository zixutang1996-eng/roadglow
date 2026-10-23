package com.personal.nav.roadglow.car;

import android.content.Intent;
import androidx.annotation.NonNull;
import androidx.car.app.CarAppService;
import androidx.car.app.Screen;
import androidx.car.app.Session;
import androidx.car.app.validation.HostValidator;

/** v0.9.8 Android Auto entry point (navigation category). Sideloaded builds: hosts are not allow-listed by Play, so all are accepted. */
public class RoadGlowCarService extends CarAppService {
    @NonNull @Override public HostValidator createHostValidator() { return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR; }
    @NonNull @Override public Session onCreateSession() {
        return new Session() {
            /** car day/night switched → restyle when the phone skin is on "auto" */
            @Override public void onCarConfigurationChanged(@NonNull android.content.res.Configuration c) { CarMap.get(getCarContext()).restyle(); }
            @NonNull @Override public Screen onCreateScreen(@NonNull Intent intent) { CarMap.get(getCarContext()).register(); return new NavScreen(getCarContext()); }
        };
    }
}
