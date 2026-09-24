# Ryan, out for a walk

A self-contained static Three.js experiment: explore a sculpture garden as Ryan using the refined walk cycle from the Blender animation experiment. Includes camera-relative movement, smooth idle/walk transitions, orbit/zoom, touch movement, simple obstacle collisions, and six discoverable landmarks, animated fountain water, reactive birds, and an optional procedural soundscape.

## Run

From this folder:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/. No build step, install, or environment variables. Three.js 0.183.0 loads from jsDelivr; Google Fonts provides optional typography, with system fallbacks. A network connection is needed to load Three.js. The root Playground link works when served at its repository path, `/exp/ryan-roam/`.

## Controls

- WASD or arrow keys: walk relative to the camera.
- Fast walking (Boost) is on by default. Toggle the on-screen Boost button for a slower stroll (also available on touch screens), or hold Shift to boost. Normal speed is 1.7 m/s; boost is 3.0 m/s. Walk playback follows movement speed. Reset restores Boost to on. The selected speed is preserved when opening Controls or switching focus; held movement keys are cleared.
- The camera smoothly turns behind the character while walking. A held movement direction stays stable as the camera catches up.
- Drag the scene: orbit the camera; automatic following pauses during dragging and briefly afterward. Scroll: zoom.
- Touch: movement pad on the left, drag the scene to look.
- Sound off / Sound on: toggle soft wind, fountain water, bird calls, and footsteps. Audio starts only after clicking the button and pauses while the tab is hidden. Water and birds get louder as you approach.
- Controls → Back to the start: reset position and camera.

## New destinations and sounds

Look for numbered markers 04–06: a stone fountain in the northwest, a garbage can in the southeast, and a nearby flock of six birds. The fountain and bin block movement; birds hop and flutter upward when approached. All six landmarks count toward discovery. Reduced-motion settings disable bird hopping and wing flapping.

`environment.js` builds the new scenery from geometry. `audio.js` uses the Web Audio API for synthesized ambience and footstep effects, with no audio assets or added dependencies. Sounds are stylized rather than recordings. Audio preference is not persisted across reloads.

## Character

`assets/ryan.glb` embeds the texture, skinned mesh, and Idle/Walk clips (about 3.6 MB). It is exported from `../ryan-walk-cycle/ryan_walk_refined.blend`; the web runtime does not need that source file. The export bakes the corrected IK knee motion into bone animation, reduces geometry to about 47,000 vertices before skin deformation, and resizes the texture to 2048². Walk speed is matched approximately to the source stride, and stopping cross-fades into a standing pose.

Re-export with Blender:

```sh
blender -b ../ryan-walk-cycle/ryan_walk_refined.blend --python export_character.py
```

The export script does not overwrite the Blender source.

## Validation and limitations

`node --test movement.test.mjs` checks movement direction, equal diagonal speed, touch input magnitude, collision handling, world limits, and angle wrapping. Browser checks cover model loading, touch movement, camera orbit, controls/reset, and narrow/desktop layouts. GLB was checked for both animation clips and skin data.

For the environment update, all eight movement tests and JavaScript syntax checks passed. Browser inspection confirmed loading, the six-item list, narrow layout, and sound on/off controls without console errors. Audio fidelity has not been verified by listening, and physical mobile audio remains untested.

This is an experiment, not a full game: flat terrain, approximate circular obstacle collision, no jumping or running, no camera collision, no multiplayer, and no persistent discovery progress. The scan retains the first-pass skin weights and clothing deformation limitations of the Blender version. Touch layout was tested in the browser, not on physical mobile hardware. Requires WebGL2. It is ready for static hosting but has not been published by this task.

API reference: https://threejs.org/docs/

## Flip jump

Press **Space** or tap **Jump** for a 1.4-second forward flip: anticipation, takeoff, tuck, full rotation, and landing. The jump plays once, blocks repeat jumps until landing, preserves horizontal momentum, suppresses footsteps in the air, and blends back into idle/walk. Reset cancels the jump. This is a stylized animation jump on flat ground; obstacle collision remains active and it does not support jumping onto platforms or over obstacles.

The page loads `assets/ryan-flip.glb`, containing `Idle`, `Walk`, and `FlipJump`. The original `assets/ryan.glb` remains the input. Rebuild with `blender -b --factory-startup --python add_flip.py`; this also creates editable `ryan_flip.blend`. The jump's vertical arc and rotation are embedded in the animation, so do not add another vertical jump offset when reusing it elsewhere. After changing the original character export, run this script again.

Validated Space and button triggering, jump lockout and return to standing in the browser; inspected the inverted tuck in Blender and checked mesh ground clearance. Idle/Walk durations remain 1.0667 seconds. Movement/camera tests pass.

## Level 02 — After hours

Choose **02 / After hours** above the title, or open `?level=night`, to enter a neon music courtyard under a starry sky. **01 / Garden** returns to the original daytime level. Switching levels reloads the scene and resets position, discovery progress, and sound preference.

Six new destinations include a modular synthesizer with patch cables and keys, DJ turntables and mixer, a floating VR headset and controllers, a listening station with a portable music player, an overhead laser array, and a tape archive. The courtyard has neon paving, a distant skyline, animated record platters and equalizer bars, and slow laser sweeps. Reduced-motion settings stop the night scenery animations. The equipment is decorative rather than playable.

Turn **Sound on** for a procedural electronic arpeggio, bass pulse, and footsteps. No additional assets, dependencies, or environment variables are required. `night.js` builds the scene, while movement, collisions, camera controls, and flip animations remain shared with the garden.

Validation: all eight movement tests and JavaScript syntax checks passed. Browser inspection covered narrow and desktop layouts, night character loading, sound on/off, flip triggering, and returning to the garden. No browser console errors were reported during the night checks. Audio quality has not been verified by listening; physical mobile devices remain untested.
