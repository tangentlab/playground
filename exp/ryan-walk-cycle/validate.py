import bpy
s=bpy.context.scene;r=bpy.data.objects['Ryan Walk Rig'];m=bpy.data.objects['Ryan • textured scan']
s.frame_set(1);a=[b.matrix.copy() for b in r.pose.bones]
s.frame_set(33);b=[p.matrix.copy() for p in r.pose.bones]
error=max(abs(x[i][j]-y[i][j]) for x,y in zip(a,b) for i in range(4) for j in range(4))
print('LOOP_ERROR',error);assert error<1e-5
unweighted=sum(not any(g.weight>.0001 for g in v.groups) for v in m.data.vertices);print('UNWEIGHTED',unweighted)
print('PACKED_TEXTURES',[(i.name,bool(i.packed_file)) for i in bpy.data.images if i.source=='FILE'])
assert all(i.packed_file for i in bpy.data.images if i.source=='FILE')
assert s.frame_start==1 and s.frame_end==32
print('VALIDATION_PASSED')
