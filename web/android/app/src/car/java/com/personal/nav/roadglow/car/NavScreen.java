package com.personal.nav.roadglow.car;

import androidx.annotation.NonNull;
import androidx.car.app.CarContext;
import androidx.car.app.CarToast;
import androidx.car.app.Screen;
import androidx.car.app.model.Action;
import androidx.car.app.model.ActionStrip;
import androidx.car.app.model.CarColor;
import androidx.car.app.model.DateTimeWithZone;
import androidx.car.app.model.Distance;
import androidx.car.app.model.Template;
import androidx.car.app.navigation.NavigationManager;
import androidx.car.app.navigation.NavigationManagerCallback;
import androidx.car.app.navigation.model.Maneuver;
import androidx.car.app.navigation.model.MessageInfo;
import androidx.car.app.navigation.model.NavigationTemplate;
import androidx.car.app.navigation.model.RoutingInfo;
import androidx.car.app.navigation.model.Step;
import androidx.car.app.navigation.model.TravelEstimate;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import com.personal.nav.roadglow.CarState;
import java.util.TimeZone;

/** Main car screen: NavigationTemplate over the skin map; turn card + ETA while the phone is navigating. */
final class NavScreen extends Screen implements CarState.Listener {
    private boolean navStarted = false; private final CarMap cm;
    NavScreen(@NonNull CarContext c) {
        super(c); cm = CarMap.get(c);
        NavigationManager nm = c.getCarService(NavigationManager.class);
        nm.setNavigationManagerCallback(new NavigationManagerCallback() {
            @Override public void onStopNavigation() { navStarted = false; invalidate(); }
            @Override public void onAutoDriveEnabled() {}
        });
        getLifecycle().addObserver(new DefaultLifecycleObserver() {
            @Override public void onCreate(@NonNull LifecycleOwner o) { CarState.listen(NavScreen.this); }
            @Override public void onDestroy(@NonNull LifecycleOwner o) { CarState.unlisten(NavScreen.this); }
        });
    }
    private long last = 0;
    @Override public void onCarState(String what) {
        if ("pos".equals(what)) return;
        long now = System.currentTimeMillis(); if ("nav".equals(what) && now - last < 900 && CarState.navActive == navStarted) return; last = now;
        getCarContext().getMainExecutor().execute(this::invalidate);
    }
    static int maneuverType(String t) {
        switch (t) {
            case "left": return Maneuver.TYPE_TURN_NORMAL_LEFT; case "right": return Maneuver.TYPE_TURN_NORMAL_RIGHT;
            case "slight left": return Maneuver.TYPE_TURN_SLIGHT_LEFT; case "slight right": return Maneuver.TYPE_TURN_SLIGHT_RIGHT;
            case "sharp left": return Maneuver.TYPE_TURN_SHARP_LEFT; case "sharp right": return Maneuver.TYPE_TURN_SHARP_RIGHT;
            case "uturn": return Maneuver.TYPE_U_TURN_LEFT; case "arrive": return Maneuver.TYPE_DESTINATION; case "depart": return Maneuver.TYPE_DEPART;
            default: return Maneuver.TYPE_STRAIGHT;
        }
    }
    static Distance dist(double m) { return m >= 1000 ? Distance.create(Math.round(m / 100) / 10.0, Distance.UNIT_KILOMETERS) : Distance.create(m >= 100 ? Math.round(m / 10) * 10 : Math.round(m), Distance.UNIT_METERS); }

    @NonNull @Override public Template onGetTemplate() {
        NavigationManager nm = getCarContext().getCarService(NavigationManager.class);
        if (CarState.navActive && !navStarted) { try { nm.navigationStarted(); navStarted = true; } catch (Exception ignored) {} }
        if (!CarState.navActive && navStarted) { try { nm.navigationEnded(); } catch (Exception ignored) {} navStarted = false; }
        Action search = new Action.Builder().setTitle(CarText.search()).setIcon(Icons.icon("search")).setOnClickListener(() -> getScreenManager().push(new SearchScreen(getCarContext()))).build();
        ActionStrip.Builder as = new ActionStrip.Builder().addAction(search);
        if (CarState.navActive) as.addAction(new Action.Builder().setTitle(CarText.stop()).setOnClickListener(() -> { if (CarState.sink != null) CarState.sink.dest("__stop__", 0, 0); CarToast.makeText(getCarContext(), CarText.stop(), CarToast.LENGTH_SHORT).show(); }).build());
        ActionStrip mapStrip = new ActionStrip.Builder()
            .addAction(new Action.Builder().setIcon(Icons.icon("plus")).setOnClickListener(() -> cm.zoom(1)).build())
            .addAction(new Action.Builder().setIcon(Icons.icon("minus")).setOnClickListener(() -> cm.zoom(-1)).build())
            .addAction(new Action.Builder().setIcon(Icons.icon("recenter")).setOnClickListener(cm::recenter).build())
            .addAction(Action.PAN).build();
        NavigationTemplate.Builder b = new NavigationTemplate.Builder().setActionStrip(as.build()).setMapActionStrip(mapStrip)
            .setPanModeListener(on -> { if (on) cm.follow = false; })
            .setBackgroundColor(CarState.ink ? CarColor.createCustom(0xfff1e7d0, 0xff16130f) : CarColor.createCustom(0xff12324a, 0xff0b1622));
        if (CarState.navActive) {
            String cue = CarState.cue.isEmpty() ? CarText.idle() : CarState.cue;
            Step.Builder sb = new Step.Builder(cue).setManeuver(new Maneuver.Builder(maneuverType(CarState.turn)).setIcon(Icons.maneuver(CarState.turn)).build());
            if (!CarState.road.isEmpty()) sb.setRoad(CarState.road);
            b.setNavigationInfo(new RoutingInfo.Builder().setCurrentStep(sb.build(), dist(CarState.stepDist)).build());
            long arrive = System.currentTimeMillis() + (long) (CarState.etaSec * 1000);
            b.setDestinationTravelEstimate(new TravelEstimate.Builder(dist(CarState.remDist), DateTimeWithZone.create(arrive, TimeZone.getDefault()))
                .setRemainingTimeSeconds(Math.max(0, (long) CarState.etaSec)).build());
        } else if (CarState.styleJson == null) {
            b.setNavigationInfo(new MessageInfo.Builder(CarText.idle()).setText(CarText.waitingPhone()).build());
        }
        return b.build();
    }
}
