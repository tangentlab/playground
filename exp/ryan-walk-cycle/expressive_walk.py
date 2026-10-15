"""Run against ryan_walk_refined.blend; creates a separate expressive walk."""
import bpy, math, os, json
from mathutils import Vector, Quaternion
out=os.path.dirname(os.path.abspath(__file__))
s=bpy.context.scene; r=bpy.data.objects['Ryan Walk Rig']; N=36
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
 loc('pelvis',(.025*math.sin(p),0,-.040-.028*math.sin(2*p)),f)
 rot('pelvis',(.015, .045*math.sin(p), -.085*math.cos(p)),f)
 rot('spine',(.025,-.012*math.sin(p),.025*math.cos(p)),f)
 rot('chest',(.012,-.016*math.sin(p),.11*math.cos(p)),f)
 rot('neck',(-.018,.006*math.sin(p),-.015*math.cos(p)),f)
 rot('head',(-.012,.008*math.sin(p),-.022*math.cos(p)),f)
 for side,sign,off in [('L',1,0),('R',-1,math.pi)]:
  t=p+off; u=(t%math.tau)/math.tau
  # Linear stance keeps ground speed constant; swing clears the floor.
  if u<.60:
   y=-.23+.46*u/.60
   pitch=-.24*(1-smooth(u/.12))+.38*smooth((u-.44)/.16)
   z=.012*(1-smooth(u/.12))+.048*smooth((u-.44)/.16)
  else:
   a=(u-.60)/.40
   y=.23-.46*smooth(a)
   pitch=.38*(1-smooth(a/.45))-.24*smooth((a-.55)/.45)
   z=.048*(1-a)+.012*a+.145*math.sin(math.pi*a)**2
  loc('FootControl.'+side,(-sign*.012,y,z),f)
  rot('FootControl.'+side,(pitch,0,0),f)
  rot('upper_arm.'+side,(.58*math.cos(t-.10),sign*math.radians(47),sign*.018*math.sin(t)),f)
  rot('forearm.'+side,(-.27-.12*math.sin(t-.35),0,0),f)
  rot('hand.'+side,(.07*math.cos(t-.35),0,sign*.025*math.sin(t-.25)),f)
s.frame_start=1;s.frame_end=N;s.render.fps=30
r.animation_data.action.name='Ryan | expressive weight and foot roll | 36 frame loop'
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
open(out+'/expressive-validation.json','w').write(json.dumps(report,indent=2))
s.frame_set(1);s.render.filepath=out+'/expressive-frames/walk_';os.makedirs(out+'/expressive-frames',exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/ryan_walk_expressive.blend')
bpy.ops.render.render(animation=True)
print('EXPRESSIVE_WALK_VALIDATED',report,flush=True)
