# Ryan, out for a walk

A self-contained static Three.js experiment: explore a sculpture garden as Ryan using the refined walk cycle from the Blender animation experiment. Includes camera-relative movement, smooth idle/walk transitions, orbit/zoom, touch movement, simple obstacle collisions, and three discoverable landmarks.

## Run

From this folder:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/. No build step, install, or environment variables. Three.js 0.183.0 loads from jsDelivr; Google Fonts provides optional typography, with system fallbacks. A network connection is needed to load Three.js. The root Playground link works when served at its repository path, `/exp/ryan-roam/`.

## Controls

- WASD or arrow keys: walk relative to the camera.
- Hold Shift to boost, or toggle the on-screen Boost button (also available on touch screens). Normal speed is 1.7 m/s; boost is 3.0 m/s. Walk playback follows movement speed. Boost clears on reset or loss of focus.
- The camera smoothly turns behind the character while walking. A held movement direction stays stable as the camera catches up.
- Drag the scene: orbit the camera; automatic following pauses during dragging and briefly afterward. Scroll: zoom.
- Touch: movement pad on the left, drag the scene to look.
- Controls → Back to the start: reset position and camera.

## Character

`assets/ryan.glb` embeds the texture, skinned mesh, and Idle/Walk clips (about 3.6 MB). It is exported from `../ryan-video-mocap/ryan_mocap_walk.blend`; the web runtime does not need that source file. The export bakes the corrected IK knee motion into bone animation, reduces geometry to about 47,000 vertices before skin deformation, and resizes the texture to 2048². Walk speed is matched approximately to the source stride, and stopping cross-fades into a standing pose.

Re-export with Blender:

```sh
blender -b ../ryan-video-mocap/ryan_mocap_walk.blend --python export_character.py
```

The export script does not overwrite the Blender source.

## Validation and limitations

`node --test movement.test.mjs` checks movement direction, equal diagonal speed, touch input magnitude, collision handling, world limits, and angle wrapping. Browser checks cover model loading, touch movement, camera orbit, controls/reset, and narrow/desktop layouts. GLB was checked for both animation clips and skin data.

This is an experiment, not a full game: flat terrain, approximate circular obstacle collision, no jumping or running, no camera collision, no multiplayer, and no persistent discovery progress. The scan retains the first-pass skin weights and clothing deformation limitations of the Blender version. Touch layout was tested in the browser, not on physical mobile hardware. Requires WebGL2. It is ready for static hosting but has not been published by this task.

API reference: https://threejs.org/docs/

The current walk includes a roughly 33 cm foot-lane separation (previously 27 cm), 40 cm fore/aft foot travel (previously 28 cm), coordinated arm swing, animated elbow flexion, wrist follow-through, and subtle opposing pelvis/chest rotation. The earlier speeds and Shift boost remain available. Boost still accelerates the walking clip; it is not a separate running animation.

## Video-reference pass

The latest version is inspired by the upright, springy walk in https://www.youtube.com/watch?v=Mol0lrRBy3g. It adds stronger elbow flexion in the correct forward/back plane, heel/toe foot roll with ankle compensation, longer steps, and a restrained hip rise. Playback cadence is slightly reduced and capped during boost. This is a hand-authored approximation, not motion capture or an exact match; high-speed movement can still show foot sliding.

## Captured-motion version

The page now uses the tracked stride from source frames 122–154 (4.07–5.14 seconds), retargeted to Ryan. `../ryan-video-mocap/prepare_cycle.py` extracts the reliable right-side image-plane trajectories; periodic smoothing closes the loop. The occluded left limbs use the right-side motion offset by half a cycle. Lateral stance, hip-bob strength, and foot-roll limits are adjusted to Ryan’s proportions. This is cleaned video-derived motion, not a full-fidelity 3D capture of both sides.
