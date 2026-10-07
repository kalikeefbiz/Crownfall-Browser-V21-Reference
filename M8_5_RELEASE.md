# M8.5 — Controls & Settings

## Frozen M8
CROWNFALL ARENA — M8 GAME UX CHECKPOINT: Version 11, source `5dc7bb36abbc74d9d34129923ea0064ac1f26501`; successful hosting provenance and clean worktree confirmed; all 133 baseline tests passed. Recover using `m8-game-ux-checkpoint` or the verified complete bundle `../crownfall-m8-game-ux-checkpoint.bundle`. See M8_CHECKPOINT.md.

## Player flow
Main Menu → Settings → Edit Controls. Editing is deliberately limited to Main Menu Settings. The existing paused arena is rendered as a representative backdrop; no match is started, no simulation step occurs, and gameplay controls are disabled/inert. Editor drag handles are separate presentation elements, removed on exit.

Shared slots: Movement, Aim / Facing, Basic, Skill 1, Skill 2, Ultimate, Special / STANCE. Slot presentation never supplies an action ID. Existing AbilityInput and InputController own the same gameplay bindings and pointer handling as M8.

Select by tapping a handle or using the slot selector. Drag position or use X/Y sliders; resize and adjust opacity for the selected slot. The selected handle stays above other handles. A fully buried control blocks Save and can be recovered through the selector; partial overlap is allowed.

- Save: persist locally, exit to Settings, apply to subsequent matches/rematches/reloads.
- Cancel: discard draft and restore previous saved preferences.
- Reset: two explicit presses (Reset → Confirm Reset), then Save to persist. Cancel retains the previous saved layout.
- Failed storage write: remain in editor, show error, preserve prior saved layout.

## Preference format and defaults
`src/control-layout.js` contains LAYOUT_CONFIG. Schema 1 is stored under `crownfall.controls.v1` in localStorage. It stores normalized centers within the safe-area rectangle plus scale and opacity. Empty `controls` means the exact validated M8 CSS layout; there is no substituted coordinate-based default.

Scale: 0.8–1.35, default 1. Opacity: 0.35–1, default 0.9. The smallest skill touch diameter is 44.8px. Safe-area inset padding is at least 12px, with radius-aware clamping. Placement is reapplied after viewport changes or ability-button reconstruction (including Riven stance changes). Styling transforms the interactive element itself, so visual and touch bounds move/scale together. Riven's non-interactive current-stance indicator follows a customized Special slot.

Missing, malformed, incomplete, non-finite, out-of-range or incompatible schema data falls back to M8 defaults. If a saved layout fully buries a visible control at another viewport, defaults are used for that viewport without deleting the saved preference. No account/cloud synchronization.

## Protected systems
No changes to M8 main.js, combat, movesets, action input handlers, camera, arena geometry, camp placement, Wilderness logic, AI, territory, tickets, cooldowns, meter generation, match rules or values. GameUX gains only the editor state and presentation-adapter calls. The menu artwork is unchanged.

## Validation
- Complete protected regression: **141/141 passed** (133 existing plus eight focused layout tests).
- Unusual layout: raised movement stick; moved Skill 1, Ultimate and Special; enlarged Basic; reduced Skill 2 opacity. Verified persistence through reload, menu and rematch.
- Relocated/resized movement + aim + Riven STANCE/skill tested simultaneously; all Summoners' Basic, Skill 1, Skill 2 and ready Ultimate activate through their customized controls. Both Riven stances retained.
- Cancel, confirmed Reset, write failure, malformed-data fallback, min/max limits, buried-control recovery, hidden-editor cleanup and match-state freeze tested.
- Responsive simulated sizes: 568×320, 844×390 and 932×430, plus retained M8 viewport tests. Safe bounds and transformed touch rectangles checked using DOM/GPU doubles.
- Three full bot regression matches: 94.4s, 98.3s and 91.0s; ticket/ticket/total-control results; 8/11/10 Wilderness rotations, camp rewards, territorial handoffs and both Riven stances; no five-second navigation stalls. These match the M7 telemetry baseline.
- Build: `python3 tools/build.py`. Tests: `node --test tests/*.test.js`.

## Acceptance boundary
Automated/simulated verification is not physical-device visual acceptance. If the live browser is gated by ChatGPT sign-in, report it explicitly. Human M8.5 playtesting must evaluate drag feel, layout readability, safe-area behavior and simultaneous touch on the device.

Stop after publication and provenance verification. No arena visual production or M9.