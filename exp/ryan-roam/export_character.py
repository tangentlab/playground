"""Run with the refined Blender file; exports a self-contained browser character."""
import bpy, os, math
from mathutils import Quaternion
out=os.path.dirname(os.path.abspath(__file__))
s=bpy.context.scene;r=bpy.data.objects['Ryan Walk Rig'];m=bpy.data.objects['Ryan • textured scan']
bpy.ops.object.select_all(action='DESELECT');r.select_set(True);bpy.context.view_layer.objects.active=r
s.frame_start=1;s.frame_end=33
bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.select_all(action='SELECT')
bpy.ops.nla.bake(frame_start=1,frame_end=33,step=1,only_selected=True,visual_keying=True,clear_constraints=True,use_current_action=False,bake_types={'POSE'})
bpy.ops.object.mode_set(mode='OBJECT')
walk=r.animation_data.action;walk.name='Walk';walk.use_fake_user=True
r.animation_data.action=None
for p in r.pose.bones:
 p.location=(0,0,0);p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.scale=(1,1,1)
for side,sign in [('L',1),('R',-1)]:
 p=r.pose.bones['upper_arm.'+side];q=p.bone.matrix_local.to_quaternion();p.rotation_quaternion=q.inverted()@Quaternion((0,1,0),sign*math.radians(47))@q
for f in [1,17,33]:
 r.pose.bones['chest'].scale=(1,1.003 if f==17 else 1,1)
 for p in r.pose.bones:
  p.keyframe_insert('location',frame=f);p.keyframe_insert('rotation_quaternion',frame=f);p.keyframe_insert('scale',frame=f)
idle=r.animation_data.action;idle.name='Idle';idle.use_fake_user=True
for a in list(bpy.data.actions):
 if a not in [idle,walk]:bpy.data.actions.remove(a)
# Reduce the texture and geometry for a practical web download.
for i in bpy.data.images:
 if i.source=='FILE' and i.size[0]>2048:i.scale(2048,2048)
bpy.ops.object.select_all(action='DESELECT');m.select_set(True);bpy.context.view_layer.objects.active=m
mod=m.modifiers.new('Web reduction','DECIMATE');mod.ratio=.45
# Apply before skin deformation so rest geometry remains intact.
bpy.ops.object.modifier_move_up(modifier=mod.name)
bpy.ops.object.modifier_apply(modifier=mod.name)
r.select_set(True);s.frame_set(1)
bpy.ops.export_scene.gltf(filepath=out+'/assets/ryan.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_frame_range=True,export_skins=True,export_image_format='JPEG',export_jpeg_quality=85,export_yup=True)
print('WEB_EXPORT',len(m.data.vertices),os.path.getsize(out+'/assets/ryan.glb'))
