# 0.9.18 — navigation arrow prediction (≤0.7 s) and per-frame smoothing

- Prediction returns, capped at 0.7 s (speed × heading / along-route). Along-route prediction is clamped at the next
  not-yet-reached manoeuvre point, so the arrow never passes a turn ahead of you. Off-route detection, wrong-way
  detection and instruction progress still use the measured fix only.
- No prediction when speed < 2 m/s, accuracy > 30 m, fix older than 2 s, or no course.
- The arrow is drawn by a requestAnimationFrame loop (any refresh rate, 120 Hz included). Each GPS fix creates a
  trajectory; display runs a small adaptive lag (GPS interval + jitter margin − 0.7 s, clamped 0–0.6 s) behind the
  newest fix, and consecutive trajectories are blended with a smoothstep (projective velocity blending), so a new fix
  never teleports the arrow; big jumps (>150 m) converge in 0.35 s, >1 km snaps. Hard cap: never more than v·0.7 s
  ahead of the newest fix. Heading eases along the shortest angle (frame-rate independent).
- Camera and arrow update in the same frame (jumpTo); route trim follows the drawn arrow, throttled to ~15 Hz;
  the loop stops while the app is hidden. Android GPS interval stays 1000 ms (high accuracy).
- Tests: `node web/tools/nav-regression.test.mjs` (30 cases). Headless check: `web/tools/navsmooth_e2e.cjs`.
- Simulated / headless only; no real-device test at release time.
