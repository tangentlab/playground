# Ryan walk cycle

Editable, in-place walk animation made from the supplied Ryan scan. Open `ryan_walk.blend` in Blender and press Space over the timeline. Play frames 1–32 at 30 fps; frame 33 repeats frame 1 as a boundary key. `ryan_walk.mp4` repeats the cycle six times for convenient viewing.

The file includes a body skeleton, keyed arm swing and torso motion, IK foot controls, packed scan textures, studio lighting, and a hidden copy of the original full-resolution geometry. The animated mesh is reduced to approximately 105,000 vertices. The supplied source file is unchanged.

## Rebuild

Run Blender in background mode with the original file and `--python build.py`. Run Blender with the generated `ryan_walk.blend` and `--python render.py` to render the PNG sequence. Both scripts write beside themselves. No environment variables or extra Blender packages are required. FFmpeg can encode the PNGs at 30 fps.

## Limitations

This is a first-pass procedural walk with automatic skin weights, not motion capture. Shoulder, hip, and loose clothing deformation may benefit from manual weight painting for close-up production use. Fingers and facial features are not individually rigged. The original scan's texture appearance is retained. The cycle is designed to loop on the timeline; it does not move through the scene.

## Validation

Rendered the full 32-frame sequence and inspected representative poses. Verified the saved file reopens, textures are packed, and loop endpoints match. The full-resolution source geometry is retained in a hidden backup object.

## Refined legs

Use `ryan_walk_refined.blend` for the revised version and `ryan_walk_refined.mp4` for the preview. Knee pole controls are now connected and calibrated to keep the knees pointing forward. The revised gait uses less hip lowering, lower foot clearance, and parallel foot paths slightly closer to hip width. The first version remains available for comparison.

Reproduce by opening `ryan_walk.blend` in background mode and running `--python refine_legs.py`. This writes the refined file, a rendered sequence, frontal inspection images, and `leg-validation.json`. Checks cover all 32 frames: forward knee bend, less than 2.5 cm lateral knee deviation from the hip/ankle midpoint (actual maximum approximately 3.5 mm), and matching start/end poses. The general first-pass skin-weight limitations above still apply.

## Natural walk

Open `ryan_walk_natural.blend` for the latest cycle, or view `ryan_walk_natural.mp4`. The 40-frame cycle at 30 fps adds alternating pelvis and shoulder rotation, support-side weight shifts, two vertical weight changes per stride, heel/toe foot roll, and delayed elbow and hand motion. Linear foot travel during the planted part of the stride gives a consistent implied ground speed. Frame 41 repeats frame 1; playback uses frames 1–40.

Rebuild with Blender in background mode: open `ryan_walk_refined.blend` and pass `--python natural_walk.py`. This saves the separate natural version and renders `natural-frames/walk_0001.png` through `walk_0040.png`. No environment variables are required. Encode with FFmpeg at 30 fps for the preview.

The supplied pose chart informed the contact/down/passing/up structure. The linked YouTube reference's frames were not accessible, so this is a procedural interpretation rather than a measured reproduction. The existing automatic skin weights and unrigged fingers still limit close-up realism. Foot roll is approximated with the existing ankle controls; there is no separate toe joint.

Validation: rendered all 40 frames and inspected sampled poses; reopened the saved Blender file and confirmed packed textures and matching loop endpoints (maximum matrix error below 1e-5). All 40 frames retain forward knee bends; maximum lateral knee deviation is approximately 5.5 mm. The MP4 contains six cycles (240 frames, eight seconds). Browser playback inspection was unavailable; the rendered PNG poses were inspected directly.

## Expressive walk

Use `ryan_walk_expressive.blend` for a more animated gait, with preview files `ryan_walk_expressive.mp4` and `.gif`. The 36-frame cycle at 30 fps uses 53% longer foot travel, approximately 2.6 times the swing lift, stronger foot roll, increased body bounce, and wider arm swings than the natural version. Earlier versions remain available.

Rebuild by opening `ryan_walk_refined.blend` in Blender background mode and passing `--python expressive_walk.py`. The script saves the editable file, renders `expressive-frames/`, and writes `expressive-validation.json`. The same scan-weight and toe-rig limitations apply.

Validation: all 36 frames rendered; sampled poses visually inspected. Forward knee bends pass throughout, with maximum lateral deviation approximately 11.4 mm. The saved file reopens with packed textures and matching first/boundary poses. Browser playback was not inspected.

## Pose-based walk (latest)

Use `ryan_walk_posed.blend`, with `ryan_walk_posed.mp4` for the three-quarter preview and `ryan_walk_posed_side.mp4` for the side view. This revision follows the pose progression discussed in [Animate a Simple Walk Cycle](https://www.instructables.com/Animate-a-Simple-Walk-Cycle/): contact, weight settling, passing, and rise/push-off. Explicit motion landmarks replace the uniform sinusoidal bounce. The trailing foot peels up before a bent-knee recovery, extends for heel contact, and settles flat. Arms now follow the opposite foot's motion and sit closer to the body at passing.

The loop is 36 frames at 30 fps; frame 37 repeats frame 1. Rebuild with Blender background mode, opening `ryan_walk_refined.blend` and passing `--python posed_walk.py`. The script saves the new file, checks all frames, and renders `posed-frames/` and `posed-side-frames/`. No environment variables or additional dependencies are needed beyond Blender and FFmpeg for video encoding. Earlier versions are preserved. The ankle pivot approximates toe-off; automatic scan weights, unrigged fingers, and the absence of a separate toe joint remain limitations.

Validation: rendered all 36 frames in both views and inspected sampled side and three-quarter poses. All frames retain forward knee bends; maximum lateral knee deviation is approximately 13.6 mm. Reopened the saved Blender file, confirmed packed textures, and checked the repeated boundary pose (matrix error below 1e-5). Each MP4 repeats six cycles. Browser playback was not verified; visual inspection used the rendered PNGs.
