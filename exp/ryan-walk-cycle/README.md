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
