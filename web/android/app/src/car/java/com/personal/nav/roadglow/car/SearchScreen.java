package com.personal.nav.roadglow.car;

import android.location.Location;
import androidx.annotation.NonNull;
import androidx.car.app.CarContext;
import androidx.car.app.Screen;
import androidx.car.app.model.Action;
import androidx.car.app.model.ItemList;
import androidx.car.app.model.SearchTemplate;
import androidx.car.app.model.Template;
import com.personal.nav.roadglow.CarState;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/** Car search: SearchTemplate (keyboard) → Photon (free, keyless, same service the phone uses) → PlaceListScreen. */
final class SearchScreen extends Screen {
    static final ExecutorService IO = Executors.newSingleThreadExecutor();
    SearchScreen(@NonNull CarContext c) { super(c); }
    @NonNull @Override public Template onGetTemplate() {
        return new SearchTemplate.Builder(new SearchTemplate.SearchCallback() {
            @Override public void onSearchTextChanged(@NonNull String s) {}
            @Override public void onSearchSubmitted(@NonNull String q) { if (!q.trim().isEmpty()) getScreenManager().push(new PlaceListScreen(getCarContext(), q.trim())); }
        }).setHeaderAction(Action.BACK).setSearchHint(CarText.searchHint()).setShowKeyboardByDefault(true).setItemList(new ItemList.Builder().build()).build();
    }

    static final class Place { String name, addr; double lat, lng, dist; }
    static List<Place> photon(String q) throws Exception {
        StringBuilder u = new StringBuilder("https://photon.komoot.io/api/?limit=6&q=").append(URLEncoder.encode(q, "UTF-8"));
        if (!Double.isNaN(CarState.lat)) u.append("&lat=").append(CarState.lat).append("&lon=").append(CarState.lng);
        if (!CarText.zh()) u.append("&lang=en");
        HttpURLConnection c = (HttpURLConnection) new URL(u.toString()).openConnection(); String body;
        try { c.setConnectTimeout(8000); c.setReadTimeout(8000);
            c.setRequestProperty("User-Agent", "RoadGlow-car/0.9.11 (personal)");
            // bytes first, decode once: a multi-byte UTF-8 char (CJK names) may straddle two reads
            java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream(); try (InputStream is = c.getInputStream()) { byte[] b = new byte[8192]; int n; while ((n = is.read(b)) > 0) bo.write(b, 0, n); }
            body = bo.toString("UTF-8");
        } finally { c.disconnect(); }
        JSONArray fs = new JSONObject(body).getJSONArray("features"); List<Place> out = new ArrayList<>();
        for (int i = 0; i < fs.length(); i++) {
            JSONObject f = fs.getJSONObject(i), p = f.getJSONObject("properties"); JSONArray co = f.getJSONObject("geometry").getJSONArray("coordinates");
            Place pl = new Place(); pl.lng = co.getDouble(0); pl.lat = co.getDouble(1); pl.name = p.optString("name", p.optString("street", q));
            List<String> a = new ArrayList<>(); for (String k : new String[]{"street", "city", "state"}) if (!p.optString(k).isEmpty() && !a.contains(p.optString(k))) a.add(p.optString(k));
            pl.addr = String.join(CarText.zh() ? "，" : ", ", a);
            if (!Double.isNaN(CarState.lat)) { float[] r = new float[1]; Location.distanceBetween(CarState.lat, CarState.lng, pl.lat, pl.lng, r); pl.dist = r[0]; } else pl.dist = -1;
            out.add(pl);
        }
        return out;
    }
}
