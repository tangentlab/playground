"""Generate original pixel sprites/textures with the Python standard library."""
from pathlib import Path
import math, random, struct, zlib
OUT=Path(__file__).parent/'assets'
class Art:
 def __init__(self,w,h): self.w=w; self.h=h; self.p=[(0,0,0,0)]*(w*h)
 def rect(self,x,y,w,h,c):
  c=tuple(bytes.fromhex(c.lstrip('#')))+(255,)
  for yy in range(max(0,y),min(self.h,y+h)):
   for xx in range(max(0,x),min(self.w,x+w)): self.p[yy*self.w+xx]=c
 def line(self,x,y,xx,yy,c,width=1):
  n=max(abs(xx-x),abs(yy-y),1)
  for i in range(n+1): self.rect(round(x+(xx-x)*i/n),round(y+(yy-y)*i/n),width,width,c)
 def save(self,name):
  def chunk(t,data): return struct.pack('>I',len(data))+t+data+struct.pack('>I',zlib.crc32(t+data)&0xffffffff)
  raw=b''.join(b'\0'+bytes(v for p in self.p[y*self.w:(y+1)*self.w] for v in p) for y in range(self.h))
  (OUT/name).write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',self.w,self.h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
random.seed(1987)
a=Art(64,64);a.rect(0,0,64,64,'263c32')
for i in range(270):a.rect(random.randrange(64),random.randrange(64),random.randrange(1,5),random.randrange(1,3),random.choice(['1b302d','36523a','3d5941','425d3e']))
a.save('ground.png')
a=Art(16,64);a.rect(0,0,16,64,'403c37')
for i in range(70):a.rect(random.randrange(16),random.randrange(64),random.randrange(1,3),random.randrange(2,10),random.choice(['272e30','60533c','777044','354337']))
a.save('bark.png')
for pose in range(2):
 a=Art(24,32)
 a.rect(7,1,10,2,'152a2a');a.rect(5,3,14,5,'334e49');a.rect(7,3,10,2,'6b8650');a.rect(5,7,14,2,'152a2a')
 a.rect(8,9,8,5,'c29161');a.rect(7,9,10,2,'493d3d');a.rect(9,10,2,1,'e8df98');a.rect(14,10,2,1,'ff7053')
 a.rect(5,14,14,11,'335747');a.rect(7,15,3,9,'8a9251');a.rect(14,15,3,9,'8a9251');a.rect(10,19,4,3,'1b302d')
 a.rect(2,15,4,7,'4e704b');a.rect(18,15,4,8,'4e704b');a.rect(2,21,4,3,'c29161');a.rect(18,21,4,3,'c29161')
 a.rect(5,23,14,3,'1b302d');a.rect(6,26,5,4-pose,'49664b');a.rect(14,26,5,3+pose,'49664b');a.rect(4,29-pose,7,3,'152a2a');a.rect(14,28+pose,7,3,'152a2a')
 a.rect(2,20,17,3,'17282e');a.rect(1,19,2,4,'17282e');a.rect(7,19,3,2,'79917b');a.rect(13,22,3,3,'17282e');a.save(f'sentry-{pose}.png')
a=Art(32,24);a.rect(8,9,17,8,'ad8d55');a.rect(10,8,13,2,'d5b46a');a.rect(23,6,5,6,'ad8d55');a.rect(25,4,6,4,'d5b46a');a.rect(28,5,1,1,'17282e');a.rect(9,16,3,7,'795b3c');a.rect(21,16,3,7,'795b3c');a.rect(13,17,2,5,'d5b46a');a.line(26,4,25,0,'d5b46a');a.line(29,4,30,0,'d5b46a');a.line(8,10,4,8,'ad8d55');a.save('deer.png')
a=Art(32,24);a.rect(6,8,20,11,'795a49');a.rect(9,6,14,3,'9c7958');a.rect(24,10,7,7,'795a49');a.rect(29,12,3,4,'ba9261');a.rect(26,10,1,1,'efb86a');a.rect(8,19,4,4,'273234');a.rect(21,19,4,4,'273234');a.rect(26,16,2,3,'e8df98');a.line(6,10,3,8,'795a49');a.save('boar.png')
a=Art(32,32)
for i in range(9):
 x=16; y=28-i*2
 for sign in [-1,1]:
  end=x+sign*(14-i);a.line(x,y,end,y-7,'47774b',2);a.line(x,y,end,y-4,'63954d',1)
a.line(16,7,16,31,'b5b965');a.save('fern.png')
a=Art(48,48)
for x,y,w,h in [(19,14,10,34),(14,19,20,24),(8,27,32,13),(4,35,40,9)]:a.rect(x,y,w,h,'17282e')
a.rect(20,15,8,23,'48605d');a.rect(21,16,3,22,'8a9b7b');a.rect(25,18,2,20,'304647');a.rect(18,38,14,10,'16262a');a.rect(17,40,15,5,'476464');a.rect(18,40,3,4,'a3b187');a.rect(31,37,6,11,'aa8258');a.rect(35,41,4,7,'d7ad71');a.rect(10,39,7,9,'6d6545');a.rect(7,43,4,5,'b58c5d');a.save('weapon.png')
a=Art(24,32);a.rect(6,3,13,9,'496747');a.rect(5,7,16,3,'d26d4c');a.rect(8,10,11,12,'cba46a');a.rect(7,12,12,3,'45433a');a.rect(10,13,2,1,'e5dc9d');a.rect(16,13,2,1,'e5dc9d');a.rect(10,21,8,2,'806047');a.rect(4,24,19,8,'4d754c');a.rect(8,24,11,4,'213b35');a.save('portrait.png')
print('Generated original pixel art in',OUT)
