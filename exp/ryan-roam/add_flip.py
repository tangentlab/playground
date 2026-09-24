"""Add a one-shot flip to the current web asset without changing its source file."""
import bpy,math,os
from mathutils import Vector,Quaternion
out=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.scene.render.fps=30
bpy.ops.import_scene.gltf(filepath=out+'/assets/ryan.glb')
r=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');s=bpy.context.scene
old=list(bpy.data.actions)
for a in old:a.use_fake_user=True
r.animation_data_clear()
def rot(name,delta):
 p=r.pose.bones[name];rest=p.bone.matrix_local.to_quaternion();p.rotation_mode='QUATERNION';p.rotation_quaternion=rest.inverted()@delta@rest
for f in range(1,44):
 t=(f-1)/42
 for p in r.pose.bones:p.location=(0,0,0);p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.scale=(1,1,1)
 u=max(0,min(1,(t-.16)/.70));air=0<t-.16<.70
 lift=1.35*4*u*(1-u)
 tuck=math.sin(math.pi*u)**1.4
 crouch=math.sin(math.pi*t/.16)*.25 if t<.16 else (math.sin(math.pi*(t-.86)/.14)*.22 if t>.86 else 0)
 angle=math.tau*(u*u*(3-2*u))
 rot('pelvis',Quaternion((1,0,0),angle))
 p=r.pose.bones['pelvis'];p.location=p.bone.matrix_local.to_3x3().inverted()@Vector((0,0,lift-.08*crouch/.25))
 for side,sign in [('L',1),('R',-1)]:
  rot('thigh.'+side,Quaternion((1,0,0),-.32*crouch/.25-1.65*tuck))
  rot('shin.'+side,Quaternion((1,0,0),.64*crouch/.25+2.45*tuck))
  rot('foot.'+side,Quaternion((1,0,0),-.32*crouch/.25-.65*tuck))
  rot('upper_arm.'+side,Quaternion((1,0,0),-.75*math.sin(math.pi*u))@Quaternion((0,1,0),sign*math.radians(47)))
  rot('forearm.'+side,Quaternion((1,0,0),-.85*tuck))
 for p in r.pose.bones:
  for path in ['location','rotation_quaternion','scale']:p.keyframe_insert(path,frame=f)
flip=r.animation_data.action;flip.name='FlipJump';flip.use_fake_user=True
s.frame_start=1;s.frame_end=43;s.frame_set(1)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/ryan_flip.blend')
bpy.ops.export_scene.gltf(filepath=out+'/assets/ryan-flip.glb',export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_frame_range=False,export_skins=True,export_image_format='JPEG',export_jpeg_quality=85)
print('ACTIONS',[(a.name,tuple(a.frame_range)) for a in bpy.data.actions])
