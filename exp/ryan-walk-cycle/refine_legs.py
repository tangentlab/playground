import bpy, math, os, json
from mathutils import Vector
out=os.path.dirname(os.path.abspath(__file__));s=bpy.context.scene;r=bpy.data.objects['Ryan Walk Rig']
# Explicit pole targets prevent the IK solver choosing an inward bend plane.
for side,sign in [('L',1),('R',-1)]:
 ik=next(c for c in r.pose.bones['shin.'+side].constraints if c.type=='IK')
 ik.pole_target=r;ik.pole_subtarget='KneePole.'+side;ik.use_stretch=False
 pole=r.pose.bones['KneePole.'+side]
 target=Vector((sign*.145,-.75,.425))
 pole.location=pole.bone.matrix_local.to_3x3().inverted()@(target-pole.bone.head_local)
 s.frame_set(9)
 best=None
 for n in range(361):
  angle=-math.pi+n*math.tau/360;ik.pole_angle=angle;bpy.context.view_layer.update()
  hip=r.pose.bones['thigh.'+side].head;knee=r.pose.bones['shin.'+side].head;ankle=r.pose.bones['shin.'+side].tail
  # Favor a knee in the sagittal plane, pointing forwards rather than sideways.
  desired_x=(hip.x+ankle.x)/2
  score=15*(knee.x-desired_x)**2+(knee.y-(hip.y+ankle.y)/2+.17)**2
  if best is None or score<best[0]:best=(score,angle)
 ik.pole_angle=best[1];print('POLE',side,math.degrees(best[1]),flush=True)
# Less crouch, lower swing clearance, and narrower parallel foot lanes.
for f in range(1,34):
 phase=(f-1)/32*math.tau
 p=r.pose.bones['pelvis'];p.location=(.007*math.sin(phase),-.026+.006*(1-math.cos(phase*2)),0);p.keyframe_insert('location',frame=f)
 for side,sign,off in [('L',1,0),('R',-1,math.pi)]:
  u=((phase+off)%math.tau)/math.tau
  if u<.62:y=-.14+.28*u/.62;z=0
  else:
   a=(u-.62)/.38;y=.14-.28*(a*a*(3-2*a));z=.045*math.sin(math.pi*a)**2
  foot=r.pose.bones['FootControl.'+side]
  foot.location=foot.bone.matrix_local.to_3x3().inverted()@Vector((-sign*.012,y,z));foot.keyframe_insert('location',frame=f)
s.frame_set(1)
a=[b.matrix.copy() for b in r.pose.bones];s.frame_set(33)
err=max(abs(x[i][j]-p.matrix[i][j]) for x,p in zip(a,r.pose.bones) for i in range(4) for j in range(4));assert err<1e-5
report={'loop_error':err,'frames':[]}
for f in range(1,33):
 s.frame_set(f);row={'frame':f}
 for side in ['L','R']:
  hip=r.pose.bones['thigh.'+side].head;k=r.pose.bones['shin.'+side].head;a=r.pose.bones['shin.'+side].tail
  row[side]={'hip':list(hip),'knee':list(k),'ankle':list(a)}
  assert k.y < (hip.y+a.y)/2, 'Knee bending backwards'
  assert abs(k.x-(hip.x+a.x)/2)<.025,'Knee deviates sideways'
 report['frames'].append(row)
open(out+'/leg-validation.json','w').write(json.dumps(report,indent=2))
s.frame_set(1);s.render.filepath=out+'/refined-frames/walk_';os.makedirs(out+'/refined-frames',exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/ryan_walk_refined.blend')
bpy.ops.render.render(animation=True)
# Frontal contact sheet source poses for knee tracking inspection.
s.camera.location=(0,-5,1.1);s.camera.rotation_euler=(Vector((0,0,.88))-s.camera.location).to_track_quat('-Z','Y').to_euler()
for f in [1,9,17,25]:
 s.frame_set(f);s.render.filepath=out+f'/front_{f:02}.png';bpy.ops.render.render(write_still=True)
print('REFINEMENT_VALIDATED',flush=True)
