import bpy,os
from mathutils import Vector
out=os.path.dirname(os.path.abspath(__file__));s=bpy.context.scene
s.camera.rotation_euler=(Vector((0,0,.9))-s.camera.location).to_track_quat('-Z','Y').to_euler()
s.render.use_border=False;s.render.use_crop_to_border=False
s.render.resolution_percentage=100
s.frame_set(1);bpy.context.view_layer.update()
print('BOUNDS',[(o.name,tuple(o.dimensions)) for o in s.objects if o.type=='MESH'],flush=True)
import math
rig=bpy.data.objects['Ryan Walk Rig']
for f in range(1,34):
 phase=(f-1)/32*math.tau
 p=rig.pose.bones['pelvis'];p.location=(.012*math.sin(phase),-.04+.01*(1-math.cos(phase*2)),0);p.keyframe_insert('location',frame=f)
s.frame_set(1)
s.render.filepath=out+'/frames/walk_';os.makedirs(out+'/frames',exist_ok=True)
s.render.image_settings.file_format='PNG'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=out+'/ryan_walk.blend')
bpy.ops.render.render(animation=True)
