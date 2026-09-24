import numpy as np,json
from pathlib import Path
from scipy.signal import savgol_filter
out=Path(__file__).resolve().parent;d=np.load(out/'landmarks-smoothed.npz');p=d['image'];fps=float(d['fps']);a,b=122,154
# Use the clearly visible right side. Reconstruct the occluded side half a cycle later.
q=p[a:b+1,:,:2]*np.array([1920,1080]);leg=np.median(np.linalg.norm(q[:,26]-q[:,24],axis=1)+np.linalg.norm(q[:,28]-q[:,26],axis=1));scale=.70/leg
values={}
for name,i,j in [('arm',12,14),('forearm',14,16),('foot',30,32)]:
 v=q[:,j]-q[:,i]
 values[name]=np.unwrap(np.arctan2(v[:,0],v[:,1])) if name!='foot' else np.unwrap(np.arctan2(-v[:,1],v[:,0]))
values['ankle_forward']=(q[:,28,0]-q[:,24,0])*scale
values['ankle_lift']=-(q[:,28,1]-np.percentile(q[:,28,1],90))*scale
values['hip_bob']=-(q[:,24,1]-np.mean(q[:,24,1]))*scale
result={}
for key,v in values.items():
 # Distribute the endpoint residual over the cycle, then smooth periodically.
 v=v-np.linspace(0,1,len(v))*(v[-1]-v[0]);v=savgol_filter(v[:-1],7,2,mode='wrap');result[key]=v.tolist()
result['ankle_lift']=(np.maximum(0,np.array(result['ankle_lift']))).tolist()
result.update({'fps':fps,'source_start_frame':a,'source_end_frame':b,'duration':(b-a)/fps,'cleanup':'Right-side image-plane tracking, period-smoothed. Occluded left limbs reconstructed with half-cycle offset; lateral stance preserved from Ryan rig.'})
(out/'retarget-cycle.json').write_text(json.dumps(result,indent=2));print({k:(round(min(v),3),round(max(v),3)) for k,v in result.items() if isinstance(v,list)})
