# M7 — UCL arena design

## Restore point
M6 human-playtested source: `6211d36b8fbc5a5073d895e3dfa814b5a3a77a16`.
Recover with tag `m6-playtested-locked`; complete verified Git bundle:
`../crownfall-m6-playtested-locked.bundle`. Baseline: 120/120 tests passed before edits.

## Arena
The 68 × 64 bounds, 56 × 24 single Crownfall front, movement speeds, ability footprints and camera remain unchanged.
X is forward/backward territory; Z is lateral movement. There are no additional lanes.
- Spawn pads move from X ±25 to ±30, two units behind the existing ±28 goal boundaries. Slot separation remains eight units. Unopposed spawn-to-neutral travel is approximately five seconds at base speed, versus 4.2 seconds previously.
- Neutral seam spans the full lane width. Goal lines and low team-colored posts mark the territorial ends, without capture or destructible objects.
- Open lane edges lead onto flat route aprons. Low Wilderness islands and outer shelves frame camp pockets; no main-lane blockers or continuous lane walls.
- Mobility: (±22, −22); cooldown: (±18, +24); defense: (±7, −27); major damage: (0, +26). Reflection across X=0 gives both teams identical geometric opportunities. Existing strategic AI timing is untouched.
- Nearest lane-edge-to-camp-center distances: mobility 10 units, cooldown 12, defense 15, major 14. At speed 6, unobstructed center travel is 1.7–2.5 seconds each way, before combat. These are geometry estimates, not guarantees under pursuit/CC.
- Height of new obstacles is at most 0.75 units. Geometry is uploaded once per arena, not regenerated each combat frame.
- Geometry lives in `src/match-data.js`: ARENA_LAYOUT, MATCH_MAP and CAMP_SITES. No gameplay rules depend on decorative objects.

## Riven label
The action button always reads STANCE. A separate compact, non-interactive indicator above the controls reports the current stance. Cooldown, action ID, input binding, stance mechanics and AI usage are unchanged.

## Preservation
The combat, abilities, feedback, movement, input, camera, territorial rules, bot strategy, Wilderness logic and match flow remain intact. The only match.js change is reading the new spawn coordinates. All balance/rules defaults and Kit's 2.8 basic range are unchanged. The existing team-wipe territory collapse is preserved.

## Verification
- Full regression: 127 tests passed (120 existing, seven focused arena tests).
- Existing Riven HUD test updated only for the approved label and separate stance indicator; all mechanical assertions retained.
- Byte-for-byte guards compare protected M6 source and configuration against commit 6211d36.
- Real bot steering/collision exercised for all seven objectives, both approaches, all three Summoners and return routes. No pathing/strategy rewrite needed.
- Three complete six-bot telemetry runs: 94.4, 98.3 and 91.0 seconds; ticket/ticket/total-control conclusions; 8/11/10 rotations; 1/2/1 camp rewards; 5/10/5 scoring handoffs; both Riven stances in each; no five-second stationary navigation incidents. Local proximity clusters included 1v1, 1v2, 2v2 and 2v3. These samples did not establish a full 3v3 proximity cluster; human testing should evaluate intentional convergence.
- Bundled application smoke test uses DOM/GPU doubles. It covers runtime initialization, movesets and results/rematch, but is not browser visual or physical-device performance acceptance.
- Reproduce: `python3 tools/build.py`; `node --test tests/*.test.js`; `node tools/m7-match-observation.mjs`.

## Human acceptance still required
Arena travel, exposure, deliberate convergence, camp value, flanking, mobile visibility and frame rate need physical-device testing. Automated evidence does not establish human M7 acceptance. Do not begin M8.