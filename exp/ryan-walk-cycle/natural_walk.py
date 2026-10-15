"""Run against ryan_walk_refined.blend; creates a separate natural walk."""
import bpy, math, os, json
from mathutils import Vector, Quaternion
out=os.path.dirname(os.path.abspath(__file__))
s=bpy.context.scene; r=bpy.data.objects['Ryan Walk Rig']; N=40
r.animation_data_clear()
def loc(name, world, f):
 b=r.pose.bones[name]; b.location=b.bone.matrix_local.to_3x3().inverted()@Vector(world); b.keyframe_insert('location',frame=f)
def rot(name, angles, f):
 b=r.pose.bones[name]; rest=b.bone.matrix_local.to_quaternion()
 q=Quaternion((0,0,1),angles[2])@Quaternion((0,1,0),angles[1])@Quaternion((1,0,0),angles[0])
 b.rotation_mode='QUATERNION'; b.rotation_quaternion=rest.inverted()@q@rest; b.keyframe_insert('rotation_quaternion',frame=f)
def smooth(t):
 t=max(0,min(1,t)); return t*t*(3-2*t)
for f in range(1,N+2):
 p=(f-1)/N*math.tau
 # Lowest shortly after contact, highest at the passing pose; sway over support.
 loc('pelvis',(.014*math.sin(p),0,-.022-.010*math.sin(2*p)),f)
 rot('pelvis',(.015, .022*math.sin(p), -.045*math.cos(p)),f)
 rot('spine',(.025,-.012*math.sin(p),.025*math.cos(p)),f)
 rot('chest',(.012,-.016*math.sin(p),.055*math.cos(p)),f)
 rot('neck',(-.018,.006*math.sin(p),-.015*math.cos(p)),f)
 rot('head',(-.012,.008*math.sin(p),-.022*math.cos(p)),f)
 for side,sign,off in [('L',1,0),('R',-1,math.pi)]:
  t=p+off; u=(t%math.tau)/math.tau
  # Linear stance keeps ground speed constant; swing clears the floor.
  if u<.60:
   y=-.15+.30*u/.60
   pitch=-.16*(1-smooth(u/.12))+.25*smooth((u-.44)/.16)
   z=.012*(1-smooth(u/.12))+.030*smooth((u-.44)/.16)
  else:
   a=(u-.60)/.40
   y=.15-.30*smooth(a)
   pitch=.25*(1-smooth(a/.45))-.16*smooth((a-.55)/.45)
   z=.030*(1-a)+.012*a+.055*math.sin(math.pi*a)**2
  loc('FootControl.'+side,(-sign*.012,y,z),f)
  rot('FootControl.'+side,(pitch,0,0),f)
  rot('upper_arm.'+side,(.32*math.cos(t-.10),sign*math.radians(47),sign*.018*math.sin(t)),f)
  rot('forearm.'+side,(-.19-.065*math.sin(t-.35),0,0),f)
  rot('hand.'+side,(.035*math.cos(t-.35),0,sign*.025*math.sin(t-.25)),f)
s.frame_start=1;s.frame_end=N;s.render.fps=30
r.animation_data.action.name='Ryan | natural weight and foot roll | 40 frame loop'
s.frame_set(1); first=[b.matrix.copy() for b in r.pose.bones]
s.frame_set(N+1)
err=max(abs(a[i][j]-b.matrix[i][j]) for a,b in zip(first,r.pose.bones) for i in range(4) for j in range(4));assert err<1e-5
report={'loop_error':err,'frames':N,'fps':30,'knee_lateral_max':0,'knee_forward_min':1}
for f in range(1,N+1):
 s.frame_set(f)
 for side in ['L','R']:
  h=r.pose.bones['thigh.'+side].head;k=r.pose.bones['shin.'+side].head;a=r.pose.bones['shin.'+side].tail
  lateral=abs(k.x-(h.x+a.x)/2); forward=(h.y+a.y)/2-k.y
  report['knee_lateral_max']=max(report['knee_lateral_max'],lateral)
  report['knee_forward_min']=min(report['knee_forward_min'],forward)
  assert forward>0,'Backwards knee'
  assert lateral<.025,'Sideways knee'
assert all(i.packed_file for i in bpy.data.images if i.source=='FILE')
open(out+'/natural-validation.json','w').write(json.dumps(report,indent=2))
s.frame_set(1);s.render.filepath=out+'/natural-frames/walk_';os.makedirs(out+'/natural-frames',exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/ryan_walk_natural.blend')
bpy.ops.render.render(animation=True)
print('NATURAL_WALK_VALIDATED',report,flush=True)
