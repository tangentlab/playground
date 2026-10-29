# Wildwood — Jungle Hunt

Playable desktop first-person hunting prototype in a procedural low-poly jungle. Track five deer or boar, then return to the amber beacon at camp. Trees block movement and shots; wildlife flees nearby hunters and gunfire. Close boar encounters damage health.

## Run

From the repository root:

```sh
python3 -m http.server 8765
```

Open http://localhost:8765/exp/jungle-hunt/ in a desktop browser supporting WebGL. No installation, build, environment variables, or network connection is required. Three.js 0.183.0 is bundled in `vendor/` with its MIT license.

## Controls and supplies

- WASD: move; mouse: look; left click: fire; R: reload.
- Shift: sprint, consuming stamina; release to recover.
- E: collect a nearby glowing item.
- Escape: pause; click Resume to continue.
- Arrow keys also look around, including in embedded browsers without mouse capture.
- Right click: zoom after finding a scope; release to restore normal view.
- Sound button toggles the looping soundtrack and synthesized rifle/pickup effects. Music starts when entering the jungle, pauses with the game, and resumes from the same position.

Amber cubes grant 18 rounds; pink first-aid kits restore up to 50 health; turquoise trail boots increase speed; lavender scopes unlock zoom; lime tonics restore stamina. The minimap shows nearby wildlife (salmon), supplies (their item color), and camp (amber). The player starts facing north, five meters south of camp.

## Soundtrack

“Push2 test 2_2” — Guidewire, supplied by the user. The original WAV is preserved outside the experiment; `assets/push2-test-2_2.mp3` is a 192 kbps browser copy with embedded metadata removed. Music plays at 45% volume and loops.

## Validation

```sh
node --check exp/jungle-hunt/game.js
node exp/jungle-hunt/smoke-test.mjs
```

The dependency-free smoke test uses real Three.js geometry with a mocked renderer and DOM to verify entry/pause, firing, reload accounting, all supply types, scope zoom, five raycast hits, and extraction. It does not verify WebGL or physical inputs.

Serve the page and check entry/pause, movement, ammo decrement and reload, supply collection, zoom after scope collection, and returning to camp after five hunts. Browser QA and its limits are reported in the task handoff.

## Known limitations

Prototype: desktop keyboard/mouse only, no touch controls, save system, multiplayer, realistic ballistics, or animated skeletal models. Wildlife uses simple steering and can pass through trees or water. The minimap deliberately reveals nearby wildlife and supplies. Health damage comes from close boar encounters; animals have one-hit arcade health. Restart reloads the page. The river is decorative and walkable.
