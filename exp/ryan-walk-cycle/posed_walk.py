"""Run against ryan_walk_refined.blend; creates a separate posed walk."""
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
def curve(u, points):
 # Explicit pose landmarks, with eased transitions and a short settled stance.
 for (a,x),(b,y) in zip(points,points[1:]):
  if a <= u <= b: return x+(y-x)*smooth((u-a)/(b-a))
 return points[-1][1]
for f in range(1,N+2):
 p=(f-1)/N*math.tau
 # Lowest shortly after contact, highest at the passing pose; sway over support.
 step=((f-1)/N*2)%1
 height=curve(step,[(0,-.040),(.18,-.072),(.52,-.030),(.80,-.005),(1,-.040)])
 loc('pelvis',(.025*math.sin(p),0,height),f)
 rot('pelvis',(.015, .045*math.sin(p), -.085*math.cos(p)),f)
 rot('spine',(.025,-.012*math.sin(p),.025*math.cos(p)),f)
 rot('chest',(.012,-.016*math.sin(p),.11*math.cos(p)),f)
 rot('neck',(-.018,.006*math.sin(p),-.015*math.cos(p)),f)
 rot('head',(-.012,.008*math.sin(p),-.022*math.cos(p)),f)
 for side,sign,off in [('L',1,0),('R',-1,math.pi)]:
  t=p+off; u=(t%math.tau)/math.tau
  # Contact -> settle -> planted travel -> toe-off -> knee-led recovery.
  if u<.58:
   y=-.24+.48*u/.58
   pitch=curve(u,[(0,-.24),(.10,0),(.43,0),(.50,.18),(.58,.42)])
   z=max(0,.1375*math.sin(pitch)+.050*(math.cos(pitch)-1)) if pitch>=0 else -.025*math.sin(pitch)
  else:
   y=curve(u,[(.58,.24),(.70,.20),(.80,.035),(.91,-.19),(1,-.24)])
   z=curve(u,[(.58,.052),(.70,.17),(.80,.19),(.91,.10),(1,.006)])
   pitch=curve(u,[(.58,.42),(.70,.55),(.80,.12),(.91,-.22),(1,-.24)])
  loc('FootControl.'+side,(-sign*.012,y,z),f)
  rot('FootControl.'+side,(pitch,0,0),f)
  rot('upper_arm.'+side,(-.62*y/.24,sign*math.radians(56),sign*.018*math.sin(t)),f)
  rot('forearm.'+side,(-.24-.13*smooth((.24-y)/.48),0,0),f)
  rot('hand.'+side,(.07*math.cos(t-.35),0,sign*.025*math.sin(t-.25)),f)
s.frame_start=1;s.frame_end=N;s.render.fps=30
r.animation_data.action.name='Ryan | contact down passing up | 36 frame loop'
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
open(out+'/posed-validation.json','w').write(json.dumps(report,indent=2))
s.frame_set(1);s.render.filepath=out+'/posed-frames/walk_';os.makedirs(out+'/posed-frames',exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/ryan_walk_posed.blend')
bpy.ops.render.render(animation=True)
# Side camera makes foot placement and the pose sequence easier to read.
s.camera.location=(5,0,1.25)
s.camera.rotation_euler=(Vector((0,0,.9))-s.camera.location).to_track_quat('-Z','Y').to_euler()
s.render.filepath=out+'/posed-side-frames/walk_';os.makedirs(out+'/posed-side-frames',exist_ok=True)
bpy.ops.render.render(animation=True)
print('POSED_WALK_VALIDATED',report,flush=True)
