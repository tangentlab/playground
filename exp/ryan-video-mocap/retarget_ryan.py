import bpy,json,math,os
from mathutils import Vector,Quaternion
out=os.path.dirname(os.path.abspath(__file__));d=json.load(open(out+'/retarget-cycle.json'));r=bpy.data.objects['Ryan Walk Rig'];s=bpy.context.scene
r.animation_data_clear()
for p in r.pose.bones:
 p.location=(0,0,0);p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.scale=(1,1,1)
def world_rotation(name,delta,f):
 p=r.pose.bones[name];rest=p.bone.matrix_local.to_quaternion()
 parent_delta=p.parent.matrix.to_quaternion()@p.parent.bone.matrix_local.to_quaternion().inverted() if p.parent else Quaternion()
 p.rotation_quaternion=rest.inverted()@parent_delta.inverted()@delta@rest
 p.keyframe_insert('rotation_quaternion',frame=f);bpy.context.view_layer.update()
for f in range(1,34):
 k=(f-1)%32;s.frame_set(f)
 pelvis=r.pose.bones['pelvis'];pelvis.location=(.006*math.sin(k*math.tau/32),-.078+d['hip_bob'][k]*.35,0);pelvis.keyframe_insert('location',frame=f)
 world_rotation('chest',Quaternion((0,0,1),.025*math.sin(k*math.tau/32)),f)
 for side,sign,offset in [('R',-1,0),('L',1,16)]:
  j=(k+offset)%32
  foot=r.pose.bones['FootControl.'+side]
  angle=max(-.35,min(.55,-d['foot'][j]));qfoot=Quaternion((1,0,0),angle)
  pivot=Vector((0,.025 if angle<0 else -.13,-.09));comp=pivot-qfoot@pivot
  foot.location=foot.bone.matrix_local.to_3x3().inverted()@(Vector((sign*.012,-d['ankle_forward'][j]*.9,d['ankle_lift'][j]*.75))+comp);foot.keyframe_insert('location',frame=f)
  world_rotation('FootControl.'+side,qfoot,f)
  for name,channel,outward in [('upper_arm','arm',.10),('forearm','forearm',.03)]:
   p=r.pose.bones[name+'.'+side];vec=p.bone.tail_local-p.bone.head_local
   lower=math.atan2(abs(vec.x),-vec.z)-outward
   delta=Quaternion((1,0,0),-d[channel][j])@Quaternion((0,1,0),sign*lower)
   world_rotation(name+'.'+side,delta,f)
  world_rotation('hand.'+side,delta,f)
# Keep the existing explicit forward knee poles.
max_deviation=0
for f in range(1,33):
 s.frame_set(f)
 for side in ['L','R']:
  h=r.pose.bones['thigh.'+side].head;knee=r.pose.bones['shin.'+side].head;a=r.pose.bones['shin.'+side].tail
  assert knee.y<(h.y+a.y)/2+.001
  max_deviation=max(max_deviation,abs(knee.x-(h.x+a.x)/2))
s.frame_set(1);first=[p.matrix.copy() for p in r.pose.bones];s.frame_set(33)
error=max(abs(a[i][j]-p.matrix[i][j]) for a,p in zip(first,r.pose.bones) for i in range(4) for j in range(4));assert error<1e-5
r.animation_data.action.name='Ryan • tracked video stride • cleaned'
r['motion_source']='https://www.youtube.com/watch?v=Mol0lrRBy3g, source frames 122–154'
r['motion_cleanup']=d['cleanup']
s.frame_start=1;s.frame_end=32;s.render.fps=30;s.render.fps_base=1.001;s.frame_set(1)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/ryan_mocap_walk.blend')
json.dump({'loop_error':error,'max_knee_deviation':max_deviation,'source_frames':[122,154]},open(out+'/retarget-validation.json','w'),indent=2)
s.render.filepath=out+'/ryan-frames/walk_';os.makedirs(out+'/ryan-frames',exist_ok=True)
bpy.ops.render.render(animation=True)
