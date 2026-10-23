package com.personal.nav.roadglow.car;

import androidx.annotation.NonNull;
import androidx.car.app.CarContext;
import androidx.car.app.CarToast;
import androidx.car.app.Screen;
import androidx.car.app.model.Action;
import androidx.car.app.model.ActionStrip;
import androidx.car.app.model.CarLocation;
import androidx.car.app.model.Distance;
import androidx.car.app.model.DistanceSpan;
import androidx.car.app.model.ItemList;
import androidx.car.app.model.Metadata;
import androidx.car.app.model.Place;
import androidx.car.app.model.PlaceMarker;
import androidx.car.app.model.Row;
import androidx.car.app.model.Template;
import androidx.car.app.navigation.model.PlaceListNavigationTemplate;
import android.text.SpannableString;
import android.text.Spanned;
import com.personal.nav.roadglow.CarState;
import java.util.ArrayList;
import java.util.List;

/** Search results on the map (PlaceListNavigationTemplate); tapping a row hands the destination to the phone, which routes and navigates. */
final class PlaceListScreen extends Screen {
    private final String q; private List<SearchScreen.Place> res = null; private String err = null;
    PlaceListScreen(@NonNull CarContext c, String q) {
        super(c); this.q = q;
        SearchScreen.IO.execute(() -> { try { res = SearchScreen.photon(q); } catch (Exception e) { err = e.getMessage(); res = new ArrayList<>(); }
            List<double[]> pins = new ArrayList<>(); for (SearchScreen.Place p : res) pins.add(new double[]{p.lng, p.lat}); CarMap.get(c).setPins(pins);
            c.getMainExecutor().execute(this::invalidate); });
    }
    static List<SearchScreen.Place> DEMO = null; // test hook for offline screenshots
    @NonNull @Override public Template onGetTemplate() {
        PlaceListNavigationTemplate.Builder b = new PlaceListNavigationTemplate.Builder().setHeaderAction(Action.BACK)
            .setTitle(com.personal.nav.roadglow.car.CarText.results() + " · " + q)
            .setActionStrip(new ActionStrip.Builder().addAction(new Action.Builder().setTitle(com.personal.nav.roadglow.car.CarText.search()).setOnClickListener(() -> getScreenManager().pop()).build()).build());
        List<SearchScreen.Place> r = DEMO != null ? DEMO : res;
        if (r == null) return b.setLoading(true).build();
        ItemList.Builder il = new ItemList.Builder().setNoItemsMessage(com.personal.nav.roadglow.car.CarText.noResults());
        int i = 0;
        for (SearchScreen.Place p : r) {
            if (i++ >= 6) break;
            Row.Builder row = new Row.Builder().setTitle(p.name).setBrowsable(false)
                .setMetadata(new Metadata.Builder().setPlace(new Place.Builder(CarLocation.create(p.lat, p.lng)).setMarker(new PlaceMarker.Builder().setLabel(String.valueOf(i)).build()).build()).build())
                .setOnClickListener(() -> go(p));
            if (p.dist >= 0) { SpannableString s = new SpannableString("  " + (p.addr.isEmpty() ? "" : "· " + p.addr)); s.setSpan(DistanceSpan.create(NavScreen.dist(p.dist)), 0, 1, Spanned.SPAN_INCLUSIVE_INCLUSIVE); row.addText(s); }
            else if (!p.addr.isEmpty()) row.addText(p.addr);
            il.addItem(row.build());
        }
        return b.setItemList(il.build()).build();
    }
    private void go(SearchScreen.Place p) {
        if (CarState.sink != null) { CarState.sink.dest(p.name, p.lat, p.lng); CarToast.makeText(getCarContext(), com.personal.nav.roadglow.car.CarText.sent(), CarToast.LENGTH_LONG).show(); }
        else { CarState.pendingDest = "{\"name\":" + org.json.JSONObject.quote(p.name) + ",\"lat\":" + p.lat + ",\"lng\":" + p.lng + "}"; CarToast.makeText(getCarContext(), com.personal.nav.roadglow.car.CarText.waitingPhone(), CarToast.LENGTH_LONG).show(); }
        CarMap.get(getCarContext()).setPins(new ArrayList<>()); getScreenManager().popToRoot();
    }
}
