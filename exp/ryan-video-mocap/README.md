# YouTube walk: extracted pose capture

Actual frame-by-frame pose estimation from the user-specified video, rather than manually authored animation. Source: https://www.youtube.com/watch?v=Mol0lrRBy3g (Animation Reference Videos).

## Outputs

- `youtube-walk-estimated.bvh`: 22-joint, fixed-length, Y-up skeleton animation, 356 frames at 29.97003 fps. Suitable for import/retargeting; **uncleaned, not looped**.
- `youtube-walk-estimated.blend`: editable Blender skeleton containing the same full-clip animation.
- `tracking-overlay.mp4`: source video with tracked joint overlay; green links have higher visibility, orange links have lower visibility.
- `landmarks-raw.json`: every original detector output, with timestamps, 33 image/world landmarks, and visibility values.
- `landmarks-smoothed.npz` / `.json`: smoothed pose estimates. NPZ also includes image-space results.
- `tracking-report.json`: detection and visibility statistics.

## Accuracy and limitations

All 356 frames yielded a pose. This does **not** mean all joints are accurate. Mean far-side elbow visibility is approximately 0.21, wrist 0.36, and knee 0.52; these often-occluded locations are uncertain. The near-side elbow/wrist visibility exceeds 0.99. Visibility scores are model outputs, not calibrated accuracy measurements.

MediaPipe estimates depth and approximate meters from a single view. This is not calibrated optical motion capture. BVH conversion uses median segment lengths, minimum-swing rotations, and estimated floor height. Joint twist and fingers are not captured; horizontal root travel is removed. Hip width/orientation and foot contacts can require correction. A 7-frame Savitzky–Golay filter reduces jitter but does not repair wrong detections. The full clip has not been made seamless.

The playable Ryan model now uses a cleaned, retargeted stride from frames 122–154. The hidden left side is reconstructed from the reliable right side with a half-cycle offset; the original raw capture is retained unchanged.

## Reproduce

Use an isolated Python environment with `yt-dlp==2026.8.19`, `mediapipe==1.0.1`, `opencv-python==5.0.0.93`, `numpy==2.5.3`, and `scipy==1.18.1`; FFmpeg and Blender 5.2 are also used. No environment variables are required. `MPLCONFIGDIR` may optionally point to a writable cache folder in restricted environments.

Download the user-specified clip to a local file with yt-dlp. Download Google's official Pose Landmarker Heavy model:
https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task

```sh
python extract.py /path/to/reference.mp4 /path/to/pose_landmarker_heavy.task
python export_bvh.py
blender -b --factory-startup --python make_blender.py
ffmpeg -i tracking-overlay-raw.mp4 -c:v libx264 -pix_fmt yuv420p -movflags +faststart tracking-overlay.mp4
```

The extraction script is configured for this clip's central subject and uses the Mac GPU backend with RGBA images. It crops away background pedestrians. Other clips/platforms require crop/backend changes. The source download, model weights, and temporary Python environment are outside this experiment and are not required to open the outputs.

Validation: detection completeness and per-joint visibility measured, tracking overlay inspected, finite BVH channels checked, and Blender skeleton positions checked against the BVH transforms. These checks validate extraction/export, not production animation quality.

Method documentation: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/python

## Ryan retarget

Run `prepare_cycle.py`, then open `../ryan-walk-cycle/ryan_walk_reference.blend` with Blender and run `retarget_ryan.py`. The result is `ryan_mocap_walk.blend` and its rendered frame sequence. Export with `../ryan-roam/export_character.py` to update the web model. `retarget-validation.json` records loop and knee checks. The 32-frame stride is smoothed periodically, preserving measured sagittal joint motion with rig-specific foot/hip adjustments.
