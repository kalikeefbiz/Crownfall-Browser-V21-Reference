# Crownfall Arena M4.5 — frozen milestone

Status: implementation frozen after 91 passing automated checks. Publish this exact source as the stable M4.5 checkpoint. No next milestone is authorized.

Preserved baseline: M4 commit e51780f6cea1c013299cea4162399f9ad839067b. Kit, Set, Riven, their core combat/visuals, bot policy and territorial estimator remain unchanged except required lifecycle/readiness safeguards.

Release additions: countdown; combat-earned Ultimate Meter; respawn protection; regulation CP/territory/draw resolution; readiness HUD; locked results and clean rematch.

Known limitations: local play with five bots; provisional balance and territory estimator; placeholder art; no online multiplayer. New M4.5 UI and protection/countdown behavior require physical-device acceptance. Earlier M4 was user-approved on device.

Reproduce: python3 tools/build.py, then node --test tests/*.test.js. The self-contained deployed build is dist/index.html. Sites retains the exact commit and archive for rollback. Resume work only on explicit user instruction.