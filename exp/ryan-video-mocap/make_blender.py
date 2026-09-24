"""Import this experiment's Y-up, ZXY BVH into an editable Blender armature."""
import bpy,os,re,math
from mathutils import Vector,Matrix,Euler
out=os.path.dirname(os.path.abspath(__file__))
text=open(out+'/youtube-walk-estimated.bvh').read();hier,motion=text.split('MOTION');tokens=re.findall(r'[{}]|[^\s{}]+',hier);idx=1;nodes=[]
def parse(parent=None):
 global idx
 kind=tokens[idx];idx+=1;name=tokens[idx];idx+=1
 assert tokens[idx]=='{';idx+=1
 assert tokens[idx]=='OFFSET';idx+=1
 off=Vector([float(v) for v in tokens[idx:idx+3]]);idx+=3
 assert tokens[idx]=='CHANNELS';idx+=1;count=int(tokens[idx]);idx+=1+count
 entry={'name':name,'parent':parent,'offset':off,'children':[]};nodes.append(entry)
 if parent:parent['children'].append(entry)
 while tokens[idx]!='}':
  if tokens[idx]=='End':
   idx+=2;assert tokens[idx]=='{';idx+=6
  else:parse(entry)
 idx+=1
parse()
lines=motion.strip().splitlines();dt=float(lines[1].split(':')[1]);frames=[[float(v) for v in line.split()] for line in lines[2:]]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Video pose estimate • 22 joints';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
C=Matrix(((1,0,0),(0,0,-1),(0,1,0)))
for node in nodes:
 node['rest']=node['offset']+(node['parent']['rest'] if node['parent'] else Vector())
 b=rig.data.edit_bones.new(node['name']);b.head=C@node['rest'];b.tail=b.head+C@(node['children'][0]['offset'] if node['children'] else Vector((0,.05,0)))
 if node['parent']:b.parent=rig.data.edit_bones[node['parent']['name']]
bpy.ops.object.mode_set(mode='POSE')
for f,values in enumerate(frames,1):
 root=Vector(values[:3]);cursor=3
 for node in nodes:
  z,x,y=[math.radians(v) for v in values[cursor:cursor+3]];cursor+=3
  local=Euler((x,y,z),'ZXY').to_matrix();parent=node['parent']
  node['rot']=parent['rot']@local if parent else local
  node['pos']=parent['pos']+parent['rot']@node['offset'] if parent else root
  pb=rig.pose.bones[node['name']];basis=C@node['rot']@C.inverted()@pb.bone.matrix_local.to_3x3()
  matrix=basis.to_4x4();matrix.translation=C@node['pos'];pb.matrix=matrix;bpy.context.view_layer.update();pb.rotation_mode='QUATERNION'
  pb.keyframe_insert('location',frame=f);pb.keyframe_insert('rotation_quaternion',frame=f)
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
bpy.context.scene.frame_set(len(frames));bpy.context.view_layer.update()
error=max((rig.pose.bones[n['name']].head-C@n['pos']).length for n in nodes)
print('SKELETON_POSITION_ERROR',error);assert error<.001
rig.animation_data.action.name='YouTube estimated pose • full clip • uncleaned'
s=bpy.context.scene;s.frame_start=1;s.frame_end=len(frames);s.render.fps=30;s.render.fps_base=1.001;s.frame_set(120)
rig['source']='https://www.youtube.com/watch?v=Mol0lrRBy3g';rig['limitations']='Estimated single-view pose. Hidden-side elbow/wrist have low confidence. In-place, no calibrated trajectory. Not production-cleaned or looped.'
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_location=Vector((0,0,.9));area.spaces.active.region_3d.view_distance=3
bpy.ops.wm.save_as_mainfile(filepath=out+'/youtube-walk-estimated.blend')
print('BLENDER_CAPTURE_SAVED',len(frames),'frames')
