# M5.1 — mobile HUD presentation only

## Recovery checkpoint
M5 version 7: `1b15a0a355640eb3eecca1de7421548da43bdc92`.
Saved Sites version: `appgprj_6ab06099de7c8191a52b35c97173f67a~appgver_f1ac8904b7d4819180df30a146bb3cec`.
Local annotated tag: `m5-v7-locked`. A full Git bundle was also preserved before editing.
The deployed M5 source remains in this commit's history.

## Changes
- Compact top match strip with all existing percentages, CP, tickets, timer and scoring state.
- Compact health bar beside the minimap; peripheral passive/protection/respawn status.
- Ultimate ring/percentage and READY label on the Ultimate control.
- Riven stance name on Switch; outgoing scythe number / recall indicator on Basic.
- Kit streak on Ember Step; active War Cry/AMP duration on their controls.
- Existing Wilderness buff names/timers retained in a compact bottom display.
- Kill feed fades after 3.5 seconds; training feedback after 2.2 seconds. Simulation event history is unchanged.
- Central diagnostic text hidden, still populated and available through existing crownfallDebug.
- 56–66 px ability touch targets and 92–104 px sticks, with responsive CSS and safe-area margins.

`src/hud-presentation.js` only reads simulation state and writes DOM presentation.
The existing input handlers, pointer capture, cooldown gates and action IDs are unchanged.
Position, scale and opacity tokens are in the M5.1 section of `style.css`. No layout editor or persistence is implemented.

## Validation
All 106 existing tests pass. Five additional tests cover non-mutating HUD rendering, health/Ultimate state, Riven stance/shared cooldown display, moved/resized controls with simultaneous three-pointer input, event expiry/rematch and Wilderness/final-life displays.
Gameplay source files remain byte-identical to M5; main.js changes are limited to importing, constructing and updating the presentation adapter. Build tooling includes that module in the existing flat bundle.
Automated tests use DOM/GPU doubles, not physical Safari. Local cloud-browser visual preview was unavailable: file previews are blocked and no supported local forwarding surface is exposed. Mobile visual/readability acceptance therefore remains pending; no claim of physical-device verification is made.

Stop at M5.1. M6 and the layout editor are out of scope.