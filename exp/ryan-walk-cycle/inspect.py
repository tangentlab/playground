import bpy
from mathutils import Vector
obj=bpy.data.objects['obj0']
print('TRANSFORM',obj.matrix_world[:], 'BOUNDS', [tuple(v) for v in obj.bound_box])
print('MATS',[(m.name, m.use_nodes) for m in obj.data.materials])
points=[obj.matrix_world@Vector(v) for v in obj.bound_box]
center=sum(points,Vector())/8
for o in bpy.context.scene.objects:o.hide_render=o!=obj
cam=bpy.data.objects['Camera'];cam.hide_render=False
cam.location=center+Vector((0,-14,0));cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=9
s=bpy.context.scene;s.camera=cam;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.display.shading.show_shadows=True;s.display.shading.show_cavity=True
s.render.resolution_x=850;s.render.resolution_y=850;s.render.resolution_percentage=100;s.render.filepath='/private/tmp/ryan-inspect.png'
bpy.ops.render.render(write_still=True)
