# Operation Wildwood

A playable desktop first-person jungle commando adventure with an ’80s/16-bit arcade direction. Enter Sector 07, silence three mysterious transmitters, and return to the amber extraction beacon. Hostile patrols fire dodgeable projectiles; wildlife roams the jungle; supply caches grant useful upgrades.

The scene renders to a genuinely low-resolution framebuffer, scaled with nearest-neighbor filtering. Original pixel sprites, textured trunks and ground, stone ruins, hanging vines, a local bitmap font, scanlines, radar, score, and a chunky weapon/HUD replace the earlier hunting-demo presentation. The perspective remains first-person.

## Run

From the repository root:

```sh
python3 -m http.server 8765
```

Open http://localhost:8765/exp/jungle-hunt/ in a desktop browser supporting WebGL. No install, build, environment variables, or network connection is required. Three.js 0.183.0 is bundled in `vendor/` with its MIT license. The bundled Press Start 2P font is distributed under the SIL Open Font License (`assets/FONT-LICENSE.txt`).

## Mission and controls

- WASD: move; mouse: aim; arrow keys: alternate aiming when mouse capture is unavailable.
- Left click or Space: fire; hold for automatic fire. The rifle holds 12 rounds; R reloads. Firing an empty magazine automatically reloads if reserve ammo is available.
- Shift: run, consuming power; release to recover.
- E: disable a nearby cyan transmitter or collect a glowing supply cache.
- Right click: zoom after finding a scope; release to restore normal view.
- Escape or leaving the game window: pause. Click Resume Mission to continue.
- Sound button: toggle the looping soundtrack and synthesized arcade effects.

Disable all three transmitters (500 points each), then reach the amber camp beacon to complete the mission. Patrols award 250 points; optional wildlife hunting awards 100; caches award 50. Enemy shots deal 12 damage. Close boar encounters also damage health. Trees and ruin pillars block movement, line of sight, and projectiles.

Amber caches grant 24 rounds; pink medkits restore up to 50 health; turquoise boots increase speed; lavender scopes unlock zoom; lime tonics restore power. Radar shows nearby patrols (red), transmitters (cyan), camp (amber), wildlife (muted gold), and supplies in their item colors. The player starts facing north, five meters south of camp.

## Soundtrack

“Push2 test 2_2” — Guidewire, supplied by the user. `assets/push2-test-2_2-loop.mp3` is a 192 kbps browser copy with embedded metadata removed. A four-second tail-to-head crossfade smooths the repeat point; playback begins four seconds into the original and the loop lasts 5:04. Music plays at 45% volume and loops automatically. It starts with the mission, pauses with the game, and resumes at the same position. The original WAV is unchanged.

## Validation and art generation

```sh
node --check exp/jungle-hunt/game.js
node exp/jungle-hunt/smoke-test.mjs
```

The dependency-free smoke test uses real Three.js geometry and sprite raycasts with a mocked renderer, texture loader, and DOM. It verifies sound controls, pause/resume, firing after reload, held keyboard fire, supplies/healing, zoom, enemy and wildlife hits, patrol projectiles and damage, all three transmitters, extraction, and defeat. It does not substitute for WebGL and physical-input browser QA.

Regenerate the original pixel sprites and textures with the Python standard library:

```sh
python3 exp/jungle-hunt/make-art.py
```

## Known limitations

Prototype: desktop keyboard/mouse only; no touch controls, saves, multiplayer, or level selection. This is an arcade aesthetic rather than an emulation of specific vintage hardware. Patrol AI uses simple pursuit and line-of-sight checks, without pathfinding around trees. Wildlife can pass through scenery. Sprite hitboxes are rectangular. The river is decorative and walkable. Restart reloads the page. Scanlines and vignette are disabled when the system requests reduced motion.
