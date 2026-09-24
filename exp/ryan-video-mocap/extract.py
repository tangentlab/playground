"""Extract measured 2D landmarks and estimated 3D landmarks from a local video."""
import os
os.environ.setdefault('MPLCONFIGDIR','/private/tmp/ryan-mpl')
import cv2, mediapipe as mp, numpy as np, json, argparse
from pathlib import Path
from scipy.signal import savgol_filter
p=argparse.ArgumentParser();p.add_argument('video');p.add_argument('model');args=p.parse_args();out=Path(__file__).resolve().parent
cap=cv2.VideoCapture(args.video);fps=cap.get(cv2.CAP_PROP_FPS);records=[]
connections=[(11,12),(11,23),(12,24),(23,24),(11,13),(13,15),(12,14),(14,16),(23,25),(25,27),(24,26),(26,28),(27,29),(29,31),(28,30),(30,32),(7,11),(8,12)]
writer=cv2.VideoWriter(str(out/'tracking-overlay-raw.mp4'),cv2.VideoWriter_fourcc(*'mp4v'),fps,(960,540))
opts=mp.tasks.vision.PoseLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=args.model,delegate=mp.tasks.BaseOptions.Delegate.GPU),running_mode=mp.tasks.vision.RunningMode.VIDEO,num_poses=1,min_pose_detection_confidence=.5,min_tracking_confidence=.5)
with mp.tasks.vision.PoseLandmarker.create_from_options(opts) as tracker:
 i=0
 while True:
  ok,frame=cap.read()
  if not ok:break
  h,w=frame.shape[:2]
  # Exclude background pedestrians, keeping the central walking subject.
  x0,x1=int(w*.28),int(w*.68);y0,y1=int(h*.05),int(h*.94)
  crop=frame[y0:y1,x0:x1];rgb=cv2.cvtColor(crop,cv2.COLOR_BGR2RGBA)
  result=tracker.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGBA,data=rgb),round(i/fps*1000))
  record={'frame':i,'time':i/fps,'image':None,'world':None}
  preview=cv2.resize(frame,(960,540))
  if result.pose_landmarks:
   lm=result.pose_landmarks[0];world=result.pose_world_landmarks[0]
   record['image']=[[(a.x*(x1-x0)+x0)/w,(a.y*(y1-y0)+y0)/h,a.z,a.visibility] for a in lm]
   record['world']=[[a.x,a.y,a.z,a.visibility] for a in world]
   points=[(round(a[0]*960),round(a[1]*540)) for a in record['image']]
   for a,b in connections:
    color=(70,220,100) if min(lm[a].visibility,lm[b].visibility)>.65 else (30,170,255)
    cv2.line(preview,points[a],points[b],color,2,cv2.LINE_AA)
   for j in [11,12,13,14,15,16,23,24,25,26,27,28]:cv2.circle(preview,points[j],4,(255,245,230),-1)
  cv2.putText(preview,f'POSE ESTIMATE | frame {i:03} | {i/fps:.2f}s',(20,28),cv2.FONT_HERSHEY_SIMPLEX,.6,(255,255,255),2)
  records.append(record);writer.write(preview);i+=1
  if i%60==0:print('Tracked',i,flush=True)
cap.release();writer.release()
raw={'source':'https://www.youtube.com/watch?v=Mol0lrRBy3g','method':'MediaPipe Pose Landmarker Heavy','fps':fps,'crop_normalized':[.28,.05,.68,.94],'coordinate_system':'MediaPipe world: hip-centered estimated meters; x right, y down, z depth. Image xy normalized to full source frame.','frames':records}
(out/'landmarks-raw.json').write_text(json.dumps(raw))
valid=np.array([r['world'] is not None for r in records]);assert valid.mean()>.8,'Too many missing detections'
a=np.array([r['world'] if r['world'] else [[np.nan]*4]*33 for r in records]);im=np.array([r['image'] if r['image'] else [[np.nan]*4]*33 for r in records])
# Interpolate only missing detections, then a short 7-frame polynomial smooth.
for array in [a,im]:
 for j in range(33):
  for c in range(3):
   v=array[:,j,c];good=np.isfinite(v);v[:]=np.interp(np.arange(len(v)),np.where(good)[0],v[good]);array[:,j,c]=savgol_filter(v,7,2)
np.savez_compressed(out/'landmarks-smoothed.npz',world=a,image=im,fps=fps)
summary={'frames':len(records),'fps':fps,'detected_frames':int(valid.sum()),'detected_fraction':float(valid.mean()),'mean_visibility':{str(j):float(np.nanmean(a[:,j,3])) for j in [11,12,13,14,15,16,23,24,25,26,27,28]},'note':'Single-view estimated 3D. Occluded joints/depth inferred; not calibrated optical mocap. Smoothing does not fix incorrect tracking.'}
(out/'tracking-report.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary),flush=True)
