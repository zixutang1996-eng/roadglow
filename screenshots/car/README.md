# Car screenshots — PREVIEW MOCKS (not captured from a car host)
1024x600 landscape. Map = the real car style JSON for each skin (extracted from the app, same tiles/sprites/glyphs the car MapLibre Native renderer uses), rendered by MapLibre GL JS in headless Chrome. The maneuver card, trip estimate, search chip and action strip (+ / - / recenter) are HTML approximations of the Car App Library NavigationTemplate, not the real templates host.
Skins: neon, west, sanguo (ink, classical-Chinese text), nord × light/dark × map/nav. Generator: web/tools/car/preview/.
Real AAOS emulator capture failed: KVM guests hang on this box, and software emulation boot-loops (CarServiceHelper did not connect).
