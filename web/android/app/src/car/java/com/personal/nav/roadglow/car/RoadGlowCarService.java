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
            @NonNull @Override public Screen onCreateScreen(@NonNull Intent intent) { CarMap.get(getCarContext()).register(); return new NavScreen(getCarContext()); }
        };
    }
}
