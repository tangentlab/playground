import bpy, math, os
from mathutils import Vector, Quaternion
OUT=os.path.dirname(os.path.abspath(__file__))
s=bpy.context.scene
bpy.ops.object.select_all(action='DESELECT')
m=bpy.data.objects['obj0'];m.select_set(True);bpy.context.view_layer.objects.active=m
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
for v in m.data.vertices:v.co=Vector(((v.co.x-2.876)*.25,(v.co.y+.67)*.25,v.co.z*.25))
m.name='Ryan • textured scan'
# Retain full detail; use a lighter mesh for animation.
backup=m.copy();backup.data=m.data.copy();bpy.context.collection.objects.link(backup);backup.name='Original scan • hidden backup';backup.hide_render=True;backup.hide_set(True)
d=m.modifiers.new('Animation mesh reduction','DECIMATE');d.ratio=.18;bpy.ops.object.modifier_apply(modifier=d.name)
for p in m.data.polygons:p.use_smooth=True
for i in bpy.data.images:
 if i.source=='FILE':
  path=bpy.path.abspath(i.filepath)
  if os.path.exists(path):i.filepath=path;i.reload();i.pack()
mat=bpy.data.materials.new('Ryan scan texture');mat.use_nodes=True
nodes=mat.node_tree.nodes;bs=nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.8
tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.get('RyanTex1.jpeg');mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);m.data.materials.clear();m.data.materials.append(mat)
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Ryan Walk Rig';rig.show_in_front=True
bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
def bone(name,h,t,parent=None,deform=True):
 b=rig.data.edit_bones.new(name);b.head=Vector(h)*.25;b.tail=Vector(t)*.25;b.use_deform=deform
 if parent:b.parent=rig.data.edit_bones[parent]
 return b
bone('pelvis',(0,0,3.05),(0,0,3.65));bone('spine',(0,0,3.65),(0,0,4.65),'pelvis');bone('chest',(0,0,4.65),(0,0,5.65),'spine');bone('neck',(0,0,5.65),(0,0,6.1),'chest');bone('head',(0,0,6.1),(0,0,6.85),'neck')
for side,sign in [('L',1),('R',-1)]:
 bone('upper_arm.'+side,(sign*.65,0,5.55),(sign*1.65,0,4.95),'chest');bone('forearm.'+side,(sign*1.65,0,4.95),(sign*2.45,0,4.55),'upper_arm.'+side);bone('hand.'+side,(sign*2.45,0,4.55),(sign*2.78,-.02,4.35),'forearm.'+side)
 bone('thigh.'+side,(sign*.46,0,3.15),(sign*.49,-.07,1.7),'pelvis');bone('shin.'+side,(sign*.49,-.07,1.7),(sign*.58,0,.36),'thigh.'+side);bone('foot.'+side,(sign*.58,0,.36),(sign*.58,-.55,.16),'shin.'+side)
 bone('FootControl.'+side,(sign*.58,0,.36),(sign*.58,-.55,.16),deform=False)
 bone('KneePole.'+side,(sign*.49,-3,1.7),(sign*.49,-3,2),deform=False)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT');m.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print('WEIGHTED',len(m.vertex_groups),len(m.data.vertices),flush=True)
for side in ['L','R']:
 ik=rig.pose.bones['shin.'+side].constraints.new('IK');ik.target=rig;ik.subtarget='FootControl.'+side;ik.chain_count=2
 # Default knee bend follows the forward pre-bend in the rest skeleton.
 c=rig.pose.bones['foot.'+side].constraints.new('COPY_ROTATION');c.target=rig;c.subtarget='FootControl.'+side;c.target_space='WORLD';c.owner_space='WORLD'
def rotate_global(pb,q):
 r=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION';pb.rotation_quaternion=r.inverted()@q@r
for f in range(1,34):
 phase=(f-1)/32*math.tau
 p=rig.pose.bones['pelvis'];p.location=(.012*math.sin(phase),-.04+.01*(1-math.cos(phase*2)),0);p.keyframe_insert('location',frame=f)
 for side,sign,off in [('L',1,0),('R',-1,math.pi)]:
  t=(phase+off)%math.tau;u=t/math.tau
  if u<.6:y=-.16+.32*u/.6;z=0
  else:a=(u-.6)/.4;y=.16-.32*(a*a*(3-2*a));z=.085*math.sin(math.pi*a)
  foot=rig.pose.bones['FootControl.'+side];delta=Vector((0,y,z));foot.location=foot.bone.matrix_local.to_3x3().inverted()@delta;foot.keyframe_insert('location',frame=f)
  arm=rig.pose.bones['upper_arm.'+side];q=Quaternion((1,0,0),.26*math.cos(t))@Quaternion((0,1,0),sign*math.radians(47));rotate_global(arm,q);arm.keyframe_insert('rotation_quaternion',frame=f)
  fore=rig.pose.bones['forearm.'+side];rotate_global(fore,Quaternion((1,0,0),-.14));fore.keyframe_insert('rotation_quaternion',frame=f)
 chest=rig.pose.bones['chest'];rotate_global(chest,Quaternion((0,0,1),.035*math.sin(phase)));chest.keyframe_insert('rotation_quaternion',frame=f)
rig.animation_data.action.name='Ryan | relaxed walk | 32 frame seamless loop'
s.frame_start=1;s.frame_end=32;s.render.fps=30;s.frame_set(1)
# Clean studio presentation.
for o in list(s.objects):
 if o not in [m,backup,rig]:bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.name='Studio floor';fm=bpy.data.materials.new('Slate');fm.diffuse_color=(.055,.07,.09,1);floor.data.materials.append(fm)
bpy.ops.object.camera_add(location=(2.5,-4.5,2.2));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.25;s.camera=cam
for loc,power,size in [((2,-3,4),500,4),((-3,-1,2),350,3),((0,2,3),600,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,1))-l.location).to_track_quat('-Z','Y').to_euler()
s.world.color=(.2,.2,.2);s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=True
s.view_settings.view_transform='AgX';s.render.resolution_x=640;s.render.resolution_y=640;s.render.resolution_percentage=100
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
s.render.image_settings.file_format='PNG';s.render.filepath=OUT+'/preview.png'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/ryan_walk.blend')
bpy.ops.render.render(write_still=True)
