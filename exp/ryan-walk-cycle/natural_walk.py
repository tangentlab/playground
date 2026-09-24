"""Refine the IK walk with wider steps and relaxed, coordinated arm motion."""
import bpy, math, os, json
from mathutils import Vector, Quaternion
out=os.path.dirname(os.path.abspath(__file__));s=bpy.context.scene;r=bpy.data.objects['Ryan Walk Rig']
def rotate(name,q,f):
 p=r.pose.bones[name];rest=p.bone.matrix_local.to_quaternion();p.rotation_mode='QUATERNION';p.rotation_quaternion=rest.inverted()@q@rest;p.keyframe_insert('rotation_quaternion',frame=f)
for f in range(1,34):
 phase=(f-1)/32*math.tau
 pelvis=r.pose.bones['pelvis'];pelvis.location=(.01*math.sin(phase),-.042+.009*(1-math.cos(2*phase)),0);pelvis.keyframe_insert('location',frame=f)
 rotate('pelvis',Quaternion((0,0,1),.025*math.sin(phase)),f)
 rotate('chest',Quaternion((0,0,1),-.06*math.sin(phase)),f)
 for side,sign,off in [('L',1,0),('R',-1,math.pi)]:
  t=(phase+off)%math.tau;u=t/math.tau
  if u<.62:y=-.20+.40*u/.62;z=0;swing=0
  else:
   a=(u-.62)/.38;y=.20-.40*(a*a*(3-2*a));z=.055*math.sin(math.pi*a)**2;swing=math.sin(math.pi*a)**2
  foot=r.pose.bones['FootControl.'+side]
  foot.location=foot.bone.matrix_local.to_3x3().inverted()@Vector((sign*(.022+.006*swing),y,z));foot.keyframe_insert('location',frame=f)
  # Opposite-leg swing; delayed elbow flexion avoids rigid pendulum arms.
  arm=-.38*y/.20
  rotate('upper_arm.'+side,Quaternion((1,0,0),arm)@Quaternion((0,1,0),sign*math.radians(49)),f)
  elbow=-.17-.11*(.5+.5*math.cos(t-.55))
  rotate('forearm.'+side,Quaternion((1,0,0),elbow),f)
  rotate('hand.'+side,Quaternion((1,0,0),.035*math.sin(t-.65)),f)
# Recalibrate the knee plane for the wider foot placement.
for side,sign in [('L',1),('R',-1)]:
 ik=next(c for c in r.pose.bones['shin.'+side].constraints if c.type=='IK')
 pole=r.pose.bones['KneePole.'+side];pole.location=pole.bone.matrix_local.to_3x3().inverted()@(Vector((sign*.16,-.75,.425))-pole.bone.head_local)
 s.frame_set(9);best=None
 for n in range(361):
  angle=-math.pi+n*math.tau/360;ik.pole_angle=angle;bpy.context.view_layer.update()
  h=r.pose.bones['thigh.'+side].head;k=r.pose.bones['shin.'+side].head;a=r.pose.bones['shin.'+side].tail
  score=20*(k.x-(h.x+a.x)/2)**2+(k.y-(h.y+a.y)/2+.17)**2
  if best is None or score<best[0]:best=(score,angle)
 ik.pole_angle=best[1]
report={'knee_deviation':0,'foot_width_min':1,'foot_width_max':0,'loop_error':0}
for f in range(1,33):
 s.frame_set(f)
 width=abs(r.pose.bones['shin.L'].tail.x-r.pose.bones['shin.R'].tail.x)
 report['foot_width_min']=min(report['foot_width_min'],width);report['foot_width_max']=max(report['foot_width_max'],width)
 for side in ['L','R']:
  h=r.pose.bones['thigh.'+side].head;k=r.pose.bones['shin.'+side].head;a=r.pose.bones['shin.'+side].tail
  assert k.y<(h.y+a.y)/2,'Backwards knee'
  report['knee_deviation']=max(report['knee_deviation'],abs(k.x-(h.x+a.x)/2))
assert report['knee_deviation']<.025
s.frame_set(1);start=[p.matrix.copy() for p in r.pose.bones];s.frame_set(33)
report['loop_error']=max(abs(m[i][j]-p.matrix[i][j]) for m,p in zip(start,r.pose.bones) for i in range(4) for j in range(4));assert report['loop_error']<1e-5
open(out+'/natural-walk-validation.json','w').write(json.dumps(report,indent=2));print(report,flush=True)
s.frame_set(1);bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/ryan_walk_natural.blend')
s.render.filepath=out+'/natural-frames/walk_';os.makedirs(out+'/natural-frames',exist_ok=True)
bpy.ops.render.render(animation=True)
