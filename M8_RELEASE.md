# M8 — Game UX

## Recoverable baseline
M7 Version 10, human-playtested source `e9e38245762404c540152298f43df559df2ff2d9` is preserved as `m7-playtested-locked` and the verified complete Git bundle `../crownfall-m7-playtested-locked.bundle`. All 127 baseline tests passed before M8 edits.

## Delivered flow
Main menu → PLAY → Summoner select → initialization handoff → existing countdown → match → Crownfall announcement → results → replay or main menu.

- Main menu uses the exact supplied landscape JPEG, copied unchanged to `assets/ucl-arena-menu.jpeg` and packaged under `dist/assets/`. SHA-256: `d785263520bd9ecef5b0c680550e322c8eb39a0d18ea15d055b77d316a697259`. No regeneration, baked-in UI, or new map art.
- Coded responsive cover treatment, restrained contrast overlays, ivory typography and compact touch controls.
- Three selectable Summoners with explicit selected state, role and class: Kit Asher / Damage Dealer / Expellant; Set / Tank / Embodiment; Riven / Damage Dealer / Shaper.
- Initialization gets a paint opportunity, without a fake progress bar or timed loading delay. The existing gameplay countdown is untouched.
- The Crownfall announcement names the winning team and player's outcome. It lasts two seconds and can be skipped immediately. Draw has its own text. `UX_CONFIG.victorySeconds` is presentation-only.
- Results retain Summoner, K/D/A, Damage and Pressure. The player row is highlighted. Replay uses the tested fresh-match constructor and reset flow; menu exit stops the previous match.
- Functional settings include graphics quality, full-screen request and access to existing combat practice. Original test controls remain in a collapsed practice/playtest section rather than the launch menu.
- No crown object/icon/animation was added. The victory presentation is the future insertion point for an approved ceremonial visual.

## Architecture and preservation
`src/game-ux.js` owns screen transitions, menu controls and input gating. `main.js` has five narrowly bounded integration seams: import, adapter construction, pre-frame gate, post-frame update, and read-only UX state in debug output. The existing match creation, simulation loop, launch, pause and reset logic remain intact.

M7 Summoner combat, balance, arena, camps, territory mathematics, ticket rules, bot strategy, camera, movement, feedback, ability input, match HUD and compact player HUD sources are byte-identical. No new game mode or gameplay system was introduced.

Non-game screens skip arena rendering and simulation. Controls are cleared and disabled when leaving active gameplay. The gameplay DOM is hidden/inert outside relevant states. Returning to the menu creates a fresh paused prematch state; previous bots, timer, camps and territorial updates stop. Effects bind to the fresh simulation on entry.

## Validation
- Full regression: 133 tests (127 existing + six focused UX/lifecycle tests).
- Protected source checks compare gameplay files directly against M7. The original entrypoint byte guard remains after subtracting only the five exact approved UX additions; any other entrypoint edit fails.
- Existing bundle smoke retains moveset and results/rematch assertions and now explicitly tests the new victory step before results.
- New bundled-flow tests exercise all three selections, authoritative classes, countdown, input isolation, active match, victory, manual and timed results transition, replay, menu exit, another match, pause/resume, settings and practice.
- Two consecutive short regulation matches test rematch and return-to-menu behavior through the actual bundled application. Gameplay defaults are not changed; the existing test configuration controls regulation duration.
- Test frames: 568×320, 667×375, 844×390 and 932×430. Structural tests check safe margins, touch dimensions, background treatment and unique IDs. These are DOM/GPU doubles, not actual browser layout or physical-device visual acceptance.
- Original and packaged artwork hashes match exactly.

Commands: `python3 tools/build.py`; `node --test tests/*.test.js`.

## Acceptance limit
Final mobile visual/layout, touch feel and performance acceptance remain for human playtesting. If the hosted browser is blocked by ChatGPT sign-in, deployment provenance can be verified but live visual acceptance cannot be claimed.

Stop after M8 publication. M9 is not started.