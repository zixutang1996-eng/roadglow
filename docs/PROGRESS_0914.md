# RoadGlow 0.9.14 (versionCode 9140)
- Case-insensitive search (semantic keywords, cache keys, aliases).
- Faster: progressive results, stale request cancel, debounce 180/220 ms, result cache, Nominatim no stacked waits, geocoder.ca last resort w/ 4 s timeout, fewer Photon calls.
- View/city bias when zoomed in; pins only for nearby hits (nearest 5 + view*1.5, max 60); list shows farther hits labelled "City, PR".
- Autocomplete dropdown hidden while a submitted search runs.
- Typo tolerance: Damerau-Levenshtein vocab correction, "Did you mean", fuzzy aliases, partial tokens. Free only.
## Verified on box
- tools/search0914.test.mjs OK; headless Chrome on vite preview (Lethbridge): first local results <15 ms, remote ~0.4–0.8 s; "supestore"/"starbuks" corrected; dropdown stays hidden after submit.
- Not tested on a physical phone. Not Google Maps parity.
