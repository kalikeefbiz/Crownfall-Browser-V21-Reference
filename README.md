# M5 — Combat space, Wilderness strategy and final respawns

M5 builds on the frozen, user-tested M4.5 checkpoint `6421ba089138ffaf21bd4d2ea94d67fdc921ea23`. Kit, Set and Riven's data, ability shapes/ranges and stance behavior are unchanged. Training retains the earlier map and base stats.

## Expanded match battlefield

The match arena is 68 × 64 units. Its single lane is 24 units wide (previously 7.7) and its goal-to-goal length is 56 (previously 42). Teams start across lateral offsets 0 / -8 / +8. The existing camera zoom and attack footprints remain unchanged. Small Wilderness obstacles provide routes around fights; neither lane edge is a continuous wall. Minimap, goal lines, terrain tags and collision use the match map. The default match-only health multiplier is **1.30**, preserving health ratios, damage values and intentional lethal mechanics such as Expellant Blast.

The positional front keeps its existing midpoint rule when Blue and Red have not crossed. If their foremost positions cross, the previous front is clamped between those positions rather than moving halfway toward a bypassing runner. Retreating defenders still yield ground and advancing defenders still reclaim it. Both sides remaining in lane prevents complete ownership; a solo runner cannot claim the occupied space simply by reaching the goal. Once the opposing side leaves lane or is defeated, the existing uncontested front advances to the active side's position and can immediately reach 100%. Lateral movement within lane does not change forward progress. This is a conservative positional safeguard, not a capture-zone pause flag; the front estimator still needs human playtesting for tactical edge cases.

## Neutral camps and temporary rewards

Six minor camps form three symmetric pairs, with one major objective. All use replaceable neutral geometry and the existing health/damage/status pipeline. They retaliate, leash and reset when abandoned, die, reward their defeater and respawn. Camp damage never charges Ultimate Meter. Existing Summoner-only attacks retain that restriction against monsters.

| Camp | Reward | Duration | Initial balance |
| --- | --- | --- | --- |
| Mobility | Last-hitting Summoner gains movement speed | 20s | +20% speed |
| Cooldown | Last-hitting Summoner gains normal skill cooldown reduction | 20s | 20% reduction |
| Defense | Last-hitting Summoner gains mitigation | 20s | 20% mitigation |
| Major Damage | Last-hitting team gains damage | 25s | +25% damage |

Timers start immediately, refresh rather than stack for the same reward, and show on the player HUD. Minor buffs end on death. The major reward has one team-wide expiry; a teammate who respawns before it expires receives only the remaining time. No inventory or banked activation exists. The cooldown buff applies when a normal skill's cooldown starts; already-running cooldowns, basics, Riven's stance switch and Ultimates retain their existing timing. Set's contact leap still begins its full cooldown on resolution. All existing casting-state locks remain active.

Minor creatures have 850 health and 42 damage per second; the major has 5,200 health and 110 damage per second. Minor respawn is 45s, major respawn 100s. Leash range, aggro, speed, attack intervals/reach, reward strengths/durations, map dimensions and bot rotation timing are centralized in `src/match-data.js`. These are prototype balance, not canon. Killing-blow ownership allows contests and steals. Camps provide no territorial safety or CP reward.

Bots retain their combat policy with a small rotation assignment layer. At most one bot per team is assigned a minor camp; a major attempt can commit two while leaving one real lane defender. Bots abandon assignments when allies die or lane control is sufficiently threatened. They return to lane after rewards/timeouts. There is no guarantee the remaining defender survives and no rule preserving territory while the team rotates.

## Updated ticket rules

Each team starts with **15 shared tickets**. Defeats spend the common pool, with no per-player quota. The defeat that spends the last ticket still gets its normal reserved respawn. Thereafter each Summoner can reserve **one final personal respawn**; the following defeat permanently eliminates that Summoner. A teammate who never died still retains their final respawn. The HUD reports each team's final-respawn availability, returning players, last lives and eliminated players when its pool reaches zero. Victory waits until the full opposing roster is eliminated with no pending return. All flags reset on rematch.

## Verification and remaining acceptance

106 automated checks passed. Tests cover the expanded geometry, unchanged footprints, durability scaling, lateral crossings, anti-bypass front behavior, camp modifiers/expiration/respawn, cooldown locks, team reward lifetime, solo-versus-duo major combat, rotation limits, shared tickets and independent final lives, along with retained M1–M4.5 regressions. Three complete deterministic bot matches were run with a bot piloting each selectable Summoner. They produced small local fights, minor camp rewards, major attempts and normal match conclusions. A separate two-Summoner objective test verifies a major kill and team reward; the sampled normal matches did not secure the major reward.

Simulation spacing checks are not a substitute for physical iPhone playtesting or a verdict on combat feel. The new spacing, reaction time, rotation incentives and major-objective tuning remain provisional. No next milestone is authorized.

Historical M4.5 freeze notes follow.

---

# M4.5 — Stable prototype freeze

M4.5 is the final implementation pass. The user confirmed M4 combat, Riven's stances/scythes, bots and territorial gameplay on device. Those systems remain the baseline. Further development requires a new instruction.

The local 3v3 lifecycle is now setup → 3-second countdown → active match → Crownfall/results → rematch. Countdown freezes all six actors and scoring; the regulation timer starts at activation. Results block input, AI, simulation steps and direct combat damage. Rematch constructs fresh actors, rules and AI, resetting all match state, cooldowns, meters and stances.

**Ultimate Meter:** all six Summoners start at 0%. Actual post-mitigation enemy-Summoner damage charges the attacker by 0.04 percentage points per damage and the victim by 0.025; blocked damage, overkill beyond remaining health, friendly damage, movement, time and territory grant nothing. At 100%, an Ultimate can cast if its existing cooldown is also ready. Successful casting consumes charge before the effect; subsequent damage, including the Ultimate's own hits, can start charging again. Charge persists through deaths but resets on rematch. Bots use the same rules. Existing free-cast M3 training remains available for isolated ability testing.

**Respawn protection:** 2 seconds, with pale rings and a PROTECTED label. Protected actors cannot be damaged or selected by normal hostile hit detection. Successful offensive casts end protection immediately, including missed attacks or offensive mobility; self-buffs and stance changes preserve it. Rejected/cooldown-blocked inputs preserve it. Protection does not remove a respawned actor's normal territorial contribution.

**Regulation:** defaults to 300 seconds and displays time remaining. The temporary expiry result compares CP first, current control second, then draws on exact equality. Existing CP, total-control and ticket victories still finish the match earlier. No overtime system was added.

All match, countdown, protection and meter values are in `src/match-data.js` and exposed in the playtest settings panel. They remain provisional. No Summoner balance values, AI tactics, movement, map or territorial estimator were redesigned.

**Validation:** 91 automated checks passed, including M1–M4 regressions, all six countdown locks, real damage meter generation, all three Ultimate gates/consumption, bot readiness, rapid-cast rejection, protection/expiration/offensive cancellation, territorial validity, timer tiebreaks, full-match conclusion, immutable results and clean rematch. The bundled application also exercises results and rematch with DOM/GPU doubles. Physical iPhone verification of the new M4.5 states remains pending; automated checks are not Safari/device rendering tests.

The saved M4.5 deployment and its Git commit are the stable checkpoint. This document and the source are retained with that version. Historical milestone notes follow below.

---

# Milestone 4 — UCL 3v3 territorial Crownfall

The default mode is a local match: **one human + five bots**, with Kit, Set and Riven on both teams. Select your Summoner before starting. Pause opens match setup; New match resets it. M3 training remains selectable. Existing movement, independent facing, camera, map geometry and kit balance are retained. No towers, minion waves, base destruction, escorts, Familiars or Wilderness objectives have been added.

## Positional front — explicit prototype calculation

The lane runs from x = -21 (Blue goal) to +21 (Red goal), with its existing edges at z = ±3.85. Living Summoners whose centers are inside those edges contribute; Wilderness occupants and defeated Summoners do not. Blue's leading position is its maximum x; Red's is its minimum x. With both sides present, the front is the midpoint between those two positions. A defender's presence never sets a contested/frozen flag. With only one side present, its leading position advances the front beyond midfield; it cannot grant control to an absent opponent by standing in its own half. An empty lane is neutral. The displayed control is the front's normalized position along the lane, evaluated each simulation tick.

This **position-only estimator is a playtest choice**, not a locked competitive formula. It does not inspect damage, kills, health, role or cooldowns. Crossing formations and isolated flankers therefore still need human playtesting; it measures fronts, not tactical threat. The floor line, minimap line and top bar show the same value. Wilderness remains traversable around the existing walls and activates Kit's existing Inner Flame passive.

## Scoring and victory

- Every match starts at 50/50 with zero CP.
- Remaining beyond midfield for the configurable grace period starts scoring. Retreating from 76% to 55% continues scoring without a new grace period.
- Exactly 50% stops scoring immediately. Crossing to the opposing side starts that side's fresh grace period. Previously earned CP is retained.
- CP target, 100% control, or elimination can end the match. Total control wins immediately, bypassing the grace period.
- Tickets are **respawn reserves**: a defeat spends one available ticket and reserves that player's timed respawn. With no ticket available at defeat, that Summoner is eliminated. Zero tickets alone does not defeat living teammates. Elimination wins when no opposing Summoner remains alive or has a reserved respawn. Simultaneous terminal elimination is a draw.
- Victory freezes the match and shows reason, duration and six-player kills/deaths/assists/damage/seconds of lane presence while their team scored. Play Again starts a fresh match.

## Provisional settings

All match values are configurable in the setup panel and centralized in `src/match-data.js`. Changes take effect on the next match.

| Setting | Initial test value |
| --- | --- |
| Team respawn tickets | 9 |
| Respawn time | 3 seconds |
| CP target | 1,000 |
| Sustained-pressure grace | 2 seconds |
| CP generation | 12 per second |
| Deeper-control bonus | 0 (flat rate); adjustable |
| Match time limit | Disabled (0); optional test limit ends as a draw |

These values are not final balance. Existing M3 damage makes fights lethal and can produce short matches. The first automated match trial used a 7-second respawn and allowed a fast total-control finish after the opening wipe; the default was reduced to 3 seconds to allow returns to combat. No kit was weakened to compensate.

## Architecture and validation

`crownfall-rules.js` is pure positional/scoring/ticket logic. `match.js` owns six instances of the existing combat engine and their shared combatant references, teams, deaths and respawns. Existing hit detection, projectiles, cooldowns, abilities and modifiers handle both sides; unique entity IDs keep auras and projectile hit tracking separate. `match-bots.js` generates ordinary movement/aim/cast commands, with advance, pressure, retreat and return behaviors. Actor update order alternates to avoid a fixed Blue-first ordering. The bots are basic local opponents, not competitive AI or online players.

`match-ui.js` adds control/CP/tickets/time/pressure HUD and match results. Rendering reuses each Summoner's existing proxy geometry and effects. Dynamic mesh storage grows only when needed. The training branch remains available for regression checks.

Validation includes the M1–M3 suite, position-only scoring and exact neutral handoff, grace reset and fractional timing, lane abandonment, total control in both directions, CP victory, finite-respawn reservation and elimination, team filtering, Set's actual-team auras, Riven respawn, assists, a complete six-Summoner bot match, and the bundled UI match/result/restart flow. The bundle uses DOM/GPU doubles; this is **not** a physical iPhone/Safari rendering test. Physical-device performance, the feel of the front estimator and final balance remain open playtest items.

---

# Milestone 3 — Kit, Set & Riven

Select **Riven** in the pause menu. Use **SWITCH** (keyboard F) to change stance; the HUD names the active stance and the ability buttons change with it. Reso basic inputs launch scythe 1, launch scythe 2, then recall both. Holding Basic repeats this sequence. Q is stance skill 1, E is AMP'D, and R is Death Scream. The established movement, facing, camera, minimap, collision and Kit/Set balance remain intact.

Riven uses the existing projectile, damage, cooldown, status, movement and respawn systems. The generic returning-weapon controller retains two pooled entities, and the shared action scheduler supports timed projectile barrages. No new match mode or combat AI is included. Kit/Set/Riven-labelled training targets are health-configured Summoner proxies, not autonomous playable opponents.

All Riven balance is in `src/riven-data.js`. Values not explicitly supplied are **temporary prototype balance**, not AxA canon:

| Mechanic | Current values |
| --- | --- |
| Health / respawn | 700 / 3s |
| Switch | 3s cooldown |
| Reso outgoing | 75 damage; 8 range; 13 speed; .48s basic interval |
| Recall | 95 base per scythe × (1 + .25 × outgoing hits), capped at 6 hits; 17 speed |
| Elf Dance | Exactly 5 scythes, 48 damage each, .085s spacing; 9 range; 16 speed; 4s cooldown |
| AMP'D | +30% damage; 3s duration; 6s shared cooldown |
| Percussive basic | 100 damage; 8 range; 12 speed; .6s basic interval |
| Percussive Solo | 130 damage; 3.8 radius; 35% slow; 1.5s aura with .6s slow refresh; 6s cooldown |
| Death Scream | 55 damage; 6 radius; 1.3s stun; 18s shared cooldown |

Outgoing Reso scythes pierce, hit each enemy once per flight, and park at maximum range. Each return can hit each enemy again once and tracks Riven's current position. The sequence resets once both return. Orbiting blades cause no passive damage. Switching preserves deployed blades and sequence state; orbiting blades disappear while the spectral drums are present. Elf Dance uses five independent piercing projectiles; death or stun interrupts its pending barrage. Like the existing Kit projectiles, these projectiles pass through terrain; movement still respects walls.

AMP'D is evaluated on each damage event, including recall. Skill 1 and basic attack each share a cooldown channel across stances as a prototype anti-reset rule. AMP'D and Death Scream retain their original cooldowns on every switch. Solo damages once on cast and maintains a following slow radius; slow expires .6s after its last application. Death Scream affects enemy Summoners only. Stun prevents movement and every cast, including switching. Death resets the scythe sequence and respawns Riven through the existing health lifecycle; cooldowns continue normally.

The elven proxy, jade scythes, spectral drum construct and strum/drum poses are temporary visuals. Reset targets also clears projectiles, zones and pending actions, then restores the two orbiting scythes.

Validation: 64 automated checks cover the retained movement, mobile input, Kit and Set suites, Riven mechanics and the bundled application running with DOM/GPU doubles. The bundle check switches among all three Summoners, exercises both Riven stances, and checks finite geometry within the GPU buffer budget. These are not real Safari rendering or physical-device tests. Riven's iPhone acceptance remains pending.

Physical test: select Riven; verify simultaneous movement/aiming, two launches and recall through moving targets, five-shot Elf Dance, AMP timer across switches, drums appearing/disappearing, Pulse hits, Solo slow and Scream stun. Use Target fire to test death/respawn. Switch back to Kit and Set for a quick regression check.

---

# Milestone 3 — Set available for physical-device testing

Choose **Set** in the pause menu. Kit remains available with his approved values and mechanics. Riven is now available; see the current release notes above.

Set has Panther Claw (punch / punch / kick), War Cry, Predatory Combo, and the ground-targeted Panther Fist. Hold Fist and drag to place the impact circle; release to commit. Tap without dragging uses a point 65% of maximum range in the current facing direction. Target location is fixed on commit. Keyboard: Space / Q / E / R.

Training areas include Claw/leap, moving target, Fist group, and allied aura. At **Allied aura test**, use **Test 100 damage** in the menu to inspect mitigation. Living allied Summoners inside the radius activate 2% mitigation for Set and those allies; minions do not qualify. The readout reports actual damage received. War Cry and the aura combine multiplicatively: 100 becomes 78.4 for buffed Set and 98 for a protected ally.

All additional numbers are configurable prototype balance in `src/summoners.js`:

| Setting | Value |
| --- | --- |
| Health / aura radius | 1,250 / 5 |
| Panther Claw | 90 / 90 / 135; range 1.65; cooldown .5s; combo reset 1.15s |
| War Cry | 25% outgoing damage; 20% incoming mitigation; 5s duration; approved 10s cooldown |
| Predatory Combo | leap 4 units at 16 units/s; strikes 70 / 90 / 160 at 0 / .18 / .4s after contact; 8s cooldown |
| Panther Fist | range 14; radius 3; damage 460; impact after .7s; cooldown 18s |

Predatory Combo follows a fixed heading, stops at the first valid contact, and immediately starts its melee sequence. Each subsequent strike checks the contacted target is still in range; no tracking or position snapping occurs. On a miss, movement completes and the full cooldown starts at resolution. Walls stop leaps. Brief movement/casting lock during the successful rapid sequence is a prototype timing choice; Panther Claw itself never locks movement. Fist checks enemies at impact time, so moving targets can escape. War Cry is evaluated on each damage event, including Fist impact. Lethal Blast retains its tested one-shot behavior through mitigation. Death clears modifiers and cancels Set's pending actions.

Reusable additions: `modifiers.js` handles timed modifiers and proximity auras; `advanced-actions.js` handles buffs, contact-triggered leaps/sequences, and delayed AOE; `summoners.js` registers the approved definitions and training arrangements. The ability bar rebuilds on selection without accumulating global input handlers. Set uses a simple dark panther-shaped proxy with violet effects; these are replaceable prototype visuals.

47 automated tests pass, including the retained M1/M2 suite, Set mechanics, and a bundle smoke test that switches Kit → Set → Kit. The smoke uses DOM/GPU doubles, not an actual Safari rendering test. Set was subsequently approved after physical-device testing.

Test on iPhone: verify punch/punch/kick and combo reset; War Cry damage and expiration; aimed leap contact versus clean miss; full cooldown after miss; aura entry/exit and damage pulse; ground-circle placement and delayed Fist damage; character switching and simultaneous movement/aiming. M2 remains the approved baseline.

---

# Crownfall Arena — Milestone 2: Kit Asher Combat

The approved M1 browser movement foundation, extended with Kit's authoritative M2 kit. The same private HTTPS Site serves the new build. The M2 notes below describe the historical baseline. Artwork attachments were unavailable in this environment; visuals are procedural, readable proxies following the supplied written identity.

## Play on iPhone

Open the deployed URL in Safari, sign in if prompted, rotate to landscape, and enter training. Movement uses the original left stick; the original right stick controls facing independently. Hold an ability, drag to aim, release to cast. Drag more than 150 screen pixels away to cancel. Hold Whip for repeated two-hit combos. Solar Ring casts on release centered on Kit. Cooldown values appear on controls. The conditional Blast button appears only after earning it and shows its remaining lifetime.

Pause opens training options. Select Whip / dash, Dragon multi-hit line, Solar Ring group, or Wilderness. Reset targets restores targets and removes active projectiles; Reset training also restores Kit, cooldowns, streak, temporary abilities and counters. The optional Target fire toggle enables incoming shots from the moving target for player health/death/respawn testing. It is off by default and adds no Kit ability.

Desktop: WASD/arrows, right-stick drag for facing, Space for Whip, Q for Ember Step, E for Solar Ring, R for The Last Flame, F for earned Blast, Escape to pause.

## Exact mechanics

- Inner Flame uses terrain tags: +5% movement speed inside marked Wilderness, removed on exit.
- Solar Whip is a facing-directed cone, not a projectile. Every intersecting hostile target is damaged once per swing. Combo is 1→2→1 while attacks chain within its window; timeout resets to 1.
- Ember Step moves through a swept collision path, stops at solid walls, and hits each enemy once per dash. Successful dashes advance 0→1→2. A third successful dash stuns all enemies hit, then resets. Any complete miss resets the streak. Multiple enemies hit by one dash still count as one successful dash. Cooldown remains 6 seconds.
- Solar Ring immediately damages all intersecting hostile targets around Kit. Cooldown remains 4 seconds.
- The Last Flame travels straight, pierces Summoners, and hits each unique target once per cast. It grants exactly one temporary Blast when two unique enemy Summoners are hit. Minions and repeated overlaps with one Summoner cannot qualify.
- Expellant Blast consumes its earned charge when cast, including misses. It travels straight, ignores minions, and lethally damages the first enemy Summoner hit. This prototype uses a single-target Blast because piercing was only specified for the dragon. It expires if unused.
- Dashes respect walls. Dragon/Blast paths currently pass through terrain; terrain blocking was not specified for those attacks. This is a prototype collision choice, not lore.

## Central prototype values

`src/combat-data.js` owns the kit, temporary grant and training data. All numbers here except +5% passive, 6-second dash and 4-second ring are editable prototype balance.

| Mechanic | Prototype values |
| --- | --- |
| Kit | 650 health; 3-second respawn |
| Whip | 110 / 150 damage; 4.8 range; 117-degree arc; .55-second attack cooldown; 1.25-second combo window |
| Ember Step | 100 damage; 7 distance; 24 units/second; .65 collision half-width; 1.5-second stun; third-hit threshold |
| Solar Ring | 190 damage; 3.5 radius |
| The Last Flame | 550 damage; 23 range; 16 speed; 1.15 collision half-width; 18-second cooldown |
| Expellant Blast | Lethal; 26 range; 32 speed; .85 collision half-width; 15-second grant lifetime |
| Training targets | 1,800 health; 4-second respawn |

There is no normal Ability 3, item shop, second playable Summoner, bot team or match mode.

## Architecture

M1 `simulation.js`, input stick ownership, camera and minimap remain in place. Movement gained only a configurable speed multiplier consumed by the passive.

- `combat-core.js`: reusable cone/radial/segment hit tests, health/damage/healing/death/respawn, timed status effects, cooldowns, temporary ability grants and reusable effect/projectile slots.
- `combat.js`: definition-injected Summoner combat simulation. Effect handlers cover cones, radial attacks, dashes and piercing/non-piercing projectiles. Authoritative combat lives outside DOM/render code. Kit is the default data definition; alternate definitions and training scenarios can be injected.
- `combat-data.js`: Kit's ability arrangement, passive, conditional ability, balance values, target layouts and terrain tags.
- `ability-input.js`: controls generated from the ability definition, pointer-owned aim/release/cancel, held basic attack, keyboard commands and cooldown state. Independent M1 movement/facing sticks remain separate.
- `combat-view.js`: temporary hit-area effects, readable dragon/Blast geometry, target geometry, health bars, damage feedback and status indicators.
- `renderer.js`: original WebGL renderer extended with combat geometry and Kit's dark sleeveless proxy, skin, locs, wraps and orange waist cord.
- `main.js`: fixed-step orchestration, lifecycle, menus, station resets, UI and input synchronization.

Command source remains a local transport boundary; online authority, prediction and replication are not implemented. Training movement is a scripted target path, not Milestone 3 bot AI. Health and ability systems do not introduce permanent progression or additional canon abilities.

## Build and check

Run `python3 tools/build.py`, then `node --test tests/*.test.js`. The self-contained `dist/index.html` is the production artifact. No runtime CDN or extra dependencies are needed.

35 automated checks passed, including the retained 15 M1 checks, attack direction/area, combos, streak/stun/miss reset, dash-wall collision, fixed cooldowns, unique multi-hit tracking, bonus gating/consumption/expiry, passive entry/exit, target/player lifecycle, ability touch cancellation and a distributed-build initialization/combat smoke check. The bundle smoke uses DOM/GPU doubles and does not validate real GPU rendering. M1 and M2 physical-device testing were approved by the user.

## M2 physical acceptance checklist

1. Move and face while holding/casting every directional control; verify releasing another finger never stops movement.
2. Approach the single target; chain Whip 1→2, then wait beyond 1.25 seconds and confirm hit 1 returns. Confirm hits behind Kit and out of range fail.
3. Dash through the single target, reverse and repeat after each 6-second cooldown: HUD 1→2→stun/reset. Repeat with an intentional miss between hits; verify immediate reset at dash completion.
4. Use Ring group from the pause menu and cast Solar Ring. All three nearby targets should lose health, with a centered circle.
5. Use Dragon multi-hit line. Default facing is right: tap Dragon. It should hit all three line Summoners and unlock Blast exactly once. Tap Blast within 15 seconds to kill the first target. Reset targets and test one-target casts, a missed Blast, and an unused charge expiring.
6. Use Wilderness; cross the green boundary while moving and watch Inner Flame activate/deactivate.
7. Enable Target fire and approach the moving target. Verify health loss, death, disabled casting and full-health base respawn. Reset training and confirm target fire is off.
8. Check pause/resume, rotation, app switching, cooldown indicators, touch cancellation, and frame rate in Standard and Low graphics on the actual phone.

M2 is ready for this acceptance run; do not infer physical-device success from automated checks. Milestone 3 is not started.