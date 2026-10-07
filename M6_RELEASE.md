# M6 — combat feedback checkpoint

## Recoverable baseline
M5.1 Version 8: b6bf0128b5589314b2ed02a753d3dd24792bdc53.
Annotated tag: m51-v8-locked. A complete Git bundle was created and verified before editing.

## Only balance change
Kit Solar Whip depth: 4.8 -> 2.8 world units (41.7% shorter). Still a cone with the exact prior angle, damage, attack cadence and combo rules. This is the existing configurable range field in src/combat-data.js. Target collision radius still participates in the existing hit test.

## Presentation
CombatFeedback receives notifications after accepted casts and actual damage. It never writes health, movement, cooldowns, AI or match rules. The existing damage paths only forward ability identity for presentation. It consolidates rapid damage per target, caps transient numbers at 18 and effects at 48, and expires them on simulation time.

Added:
- Basic/skill/Ultimate impact hierarchy, grouped floating damage, health-bar damage trails.
- Low/critical health colors with team identity rails; restrained player-only critical edge.
- Compact incoming attack names, stun/slow timers, world CC indicators.
- Brief cone/dash/contact-leap miss confirmation; no hit confirmation on misses.
- Death/OUT effects and persistent eliminated marker, using existing death/elimination flags.
- Death Scream radial wavefronts and source emphasis at its original radius/duration.
- Set violet claw edges, heavier visual Fist descent with unchanged impact timing.
- Distinct Riven drum surfaces and Reso accents; stance machinery untouched.
- Camp engagement/reset/defeat and timed buff acquisition feedback.
- Ultimate-ready button emphasis; existing meter gates/reset unchanged.

Sound integration: window.crownfallFeedback.subscribe(listener) returns an unsubscribe function. Events include hit (tier + actual amount + attack identity), ultimate-cast, ultimate-ready, death, elimination, camp-defeated, camp-reset, buff-acquired, stance-switch and scoring. Subscriber errors are isolated. No imported audio assets, playback dependency or camera shake.

Configuration: FEEDBACK_CONFIG in src/combat-feedback.js. No new gameplay systems or settings.

## Validation and limits
Existing regression suite plus nine new tests: shorter range, confirmed-hit/miss separation, aggregation/expiry/caps, hierarchy and failing sound listeners, Death Scream invariants, failed leap behavior, camp/elimination events, readiness transitions and three complete bot matches with feedback enabled versus detached. Those complete matches produce identical gameplay snapshots and Riven stance outcomes.
The GPU/DOM bundle smoke test runs all three kits and results/rematch without runtime errors; geometry remains inside its tested buffer budget.

Actual browser/physical-device observation remains outstanding. Automated simulation and GPU doubles do not establish mobile frame rate, perceived impact or visual clarity in live fights. The available cloud browser could not open local previews in the prior milestone and the Sites connector currently returns HTTP 400 Invalid MCP request metadata before source upload. Do not claim a deployed M6 or completed visual acceptance until publication and actual observation succeed.

## Gameplay freeze
Territory (including team-wipe reset), CP, map, Wilderness and camp AI, bot policy, tickets/final respawns, match timers, ultimate generation, survivability, input handlers, camera and Set/Riven data remain unchanged. No M7 work.