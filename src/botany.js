import * as THREE from 'three';
import {V,rand,choose,group,mesh,box,cylinder,beam,tube,taperTube,Instances,irregularStone,batchStatic} from './core.js';

export function leafGeometry(narrow=.32,bend=.14,segments=9){
 const p=[],uv=[],idx=[];
 for(let i=0;i<=segments;i++){
  const t=i/segments;const w=narrow*Math.pow(Math.sin(Math.PI*t),.76)*(1+.045*Math.sin(t*66));
  for(const u of [-1,0,1]){p.push(u*w,bend*Math.sin(t*Math.PI)-Math.abs(u)*.065*Math.sin(t*Math.PI),t);uv.push((u+1)/2,t);}
  if(i<segments){const k=i*3;idx.push(k,k+3,k+1,k+1,k+3,k+4,k+1,k+4,k+2,k+2,k+4,k+5);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
const GREEN=['#586d3c','#657e46','#788651','#4b663a','#49633d','#6e7945','#819053'];
const RED=['#805139','#7d4b35','#a06442','#895538','#6b5238','#a57049'];
function broadTree(root,M,leaf,x,z,h=7,radius=2.5,red=false){
 const g=group(root,x,.06,z,rand(-.4,.4));const lean=rand(-.42,.42);
 taperTube(g,M.bark,[[0,0,0],[.11,h*.2,-.05],[-.10,h*.44,.07],[lean,h*.69,.13],[lean+.27,h*.95,.20]],h*.036,.045,26,10);
 for(let b=0;b<10;b++){
  const a=b*2.399+rand(-.27,.27),yy=h*rand(.39,.77),len=radius*rand(.75,1.19),dir=V(Math.sin(a),0,Math.cos(a));
  const start=V(lean*yy/h,yy,.1),elbow=start.clone().addScaledVector(dir,len*.47).add(V(0,h*.13,0)),end=start.clone().addScaledVector(dir,len).add(V(0,h*rand(.10,.23),0));
  taperTube(g,M.bark,[start,elbow,end],h*.016,.017,15,7);
  for(let j=0;j<5;j++){
   const t=.32+j*.145,st=start.clone().lerp(end,t);st.y+=Math.sin(t*Math.PI)*.20;
   const aa=a+(j%2?1:-1)*rand(.4,1.18),ll=radius*rand(.30,.55),ed=st.clone().add(V(Math.sin(aa)*ll,rand(.25,.85),Math.cos(aa)*ll));
   taperTube(g,M.bark,[st,st.clone().lerp(ed,.48).add(V(0,.15,0)),ed],.022,.005,10,6);
   for(let k=0;k<79;k++){
    const rr=Math.cbrt(rand()),az=rand(0,Math.PI*2),yy1=rand(-.42,.52),spread=radius*.25;
    const pos=ed.clone().add(V(Math.cos(az)*rr*spread,yy1,Math.sin(az)*rr*spread*.83));g.updateWorldMatrix(true,false);pos.applyMatrix4(g.matrixWorld);
    const scale=rand(.12,.23)*(red?1.09:1);leaf.add(pos,V(scale,scale,scale),new THREE.Euler(rand(-1.3,1.3),rand(0,6.28),rand(-.82,.82)),choose(red?RED:GREEN));
   }
  }
 }
 return g;
}
function willowTree(root,M,leaves,x,z){
 const g=group(root,x,.03,z,-.22),h=5.9;
 taperTube(g,M.bark,[[0,0,0],[-.14,1.6,0],[-.44,3.1,.1],[-.67,4.5,.17],[-.45,5.9,.12]],.22,.036,25,9);
 for(let b=0;b<9;b++){
  const a=b*2.4,len=rand(1.8,3.15),sy=rand(3.0,4.8),st=V(-.37,sy,.11),ed=V(-.4+Math.sin(a)*len,sy+rand(.6,1.2),Math.cos(a)*len);
  taperTube(g,M.bark,[st,st.clone().lerp(ed,.52).add(V(0,.65,0)),ed],.061,.012,15,7);
  for(let j=0;j<10;j++){
   const t=rand(.40,1.02),top=st.clone().lerp(ed,t).add(V(rand(-.35,.35),.45,rand(-.35,.35))),drop=rand(.9,2.6);
   const points=[top,top.clone().add(V(.16,-drop*.45,.08)),top.clone().add(V(.09,-drop,.17))];tube(g,M.bark,points,.006,14,4);
   for(let k=0;k<23;k++)for(const side of [-1,1]){
    const tt=k/23,pos=top.clone().add(V(.13*Math.sin(tt*3)+rand(-.035,.035),-drop*tt+rand(-.025,.025),.13*tt+rand(-.04,.04)));g.updateWorldMatrix(true,false);pos.applyMatrix4(g.matrixWorld);
    leaves.add(pos,V(.14,.17,.17),new THREE.Euler(.58+rand(-.3,.3),side*.70+a+rand(-.45,.45),side*.25+rand(-.3,.3)),choose(['#80945a','#697d4b','#6c8654','#8d9b66']));
   }
  }
 }
 return g;
}
function bambooClump(root,M,leaf,x,z,count=22,r=.95){
 const g=group(root,x,.02,z);
 for(let k=0;k<count;k++){
  const a=rand(0,6.28),rr=Math.sqrt(rand())*r,xx=Math.cos(a)*rr,zz=Math.sin(a)*rr,ht=rand(3.0,5.5),leanX=xx*rand(.13,.30),leanZ=zz*rand(.13,.27),thick=rand(.025,.048);
  taperTube(g,M.bamboo,[[xx,0,zz],[xx+leanX*.3,ht*.48,zz+leanZ*.3],[xx+leanX,ht,zz+leanZ]],thick,thick*.70,15,8);
  for(let yy=.34;yy<ht;yy+=rand(.32,.44)){
   const t=yy/ht,nx=xx+leanX*t*t,nz=zz+leanZ*t*t;cylinder(g,M.bambooNode,nx,yy,nz,thick*1.08,thick*1.09,.018,9);
   if(t>.46){
    const aa=a+yy*3.4,st=V(nx,yy,nz),end=st.clone().add(V(Math.sin(aa)*rand(.3,.7),rand(.12,.36),Math.cos(aa)*rand(.3,.7)));
    taperTube(g,M.bamboo,[st,end],.009,.003,4,5);
    for(let j=0;j<13;j++){
     const pos=st.clone().lerp(end,rand(.25,1.15));g.updateWorldMatrix(true,false);pos.applyMatrix4(g.matrixWorld);
     const sz=rand(.19,.35);leaf.add(pos,V(sz*.80,sz,sz),new THREE.Euler(rand(-.3,.8),aa+rand(-1.35,1.35),rand(-.5,.5)),choose(GREEN));
    }
   }
  }
 }
 return g;
}
function shrub(root,M,leaf,x,z,r=.65,h=.70){
 const g=group(root,x,.02,z);
 for(let b=0;b<7;b++){
  const a=b*2.4,ed=V(Math.sin(a)*r*.56,h*rand(.6,1.1),Math.cos(a)*r*.56);
  taperTube(g,M.bark,[[0,0,0],[ed.x*.4,h*.45,ed.z*.4],ed],.016,.004,8,5);
  for(let j=0;j<53;j++){
   const aa=rand(0,6.28),rr=rand(0,r*.57),p=ed.clone().add(V(Math.cos(aa)*rr,rand(-h*.25,h*.16),Math.sin(aa)*rr));p.x+=x;p.z+=z;
   const sc=rand(.085,.18);leaf.add(p,V(sc,sc,sc),new THREE.Euler(rand(-1,1),rand(0,6.28),rand(-.6,.6)),choose(GREEN));
  }
 }
 return g;
}
function fern(root,M,leaf,x,z,size=.7){
 const g=group(root,x,.04,z,rand(0,6.28));
 for(let f=0;f<8;f++){
  const a=f/8*6.28+rand(-.25,.25),len=size*rand(.65,1.15),dir=V(Math.sin(a),0,Math.cos(a)),pts=[];
  for(let i=0;i<9;i++){const t=i/8;pts.push([dir.x*len*t,.06+Math.sin(t*Math.PI*.90)*len*.57,dir.z*len*t]);}tube(g,M.bamboo,pts,.005,12,4);
  for(let j=1;j<10;j++)for(const side of [-1,1]){
   const t=j/11,p=V(dir.x*len*t,.06+Math.sin(t*Math.PI*.90)*len*.57,dir.z*len*t);g.updateWorldMatrix(true,false);p.applyMatrix4(g.matrixWorld);
   const sz=len*(.33-.23*t);leaf.add(p,V(sz*.55,sz,sz),new THREE.Euler(.13,a+side*1.12,side*.13),choose(GREEN));
  }
 }
 return g;
}
function floweringShrub(root,M,leaves,x,z,r=.6){
 shrub(root,M,leaves,x,z,r,.65);
 const petals=new Instances(root,new THREE.SphereGeometry(1,6,4),M.whiteFlower,'Viburnum petals');
 for(let b=0;b<7;b++){
  const a=b*2.399,xx=x+Math.sin(a)*r*.57,zz=z+Math.cos(a)*r*.57,yy=.66+rand(-.04,.2);
  for(let k=0;k<30;k++){
   const az=rand(0,6.28),rr=Math.sqrt(rand())*.14,cy=yy+Math.sqrt(Math.max(0,.022-rr*rr))*.4;
   for(let j=0;j<4;j++){const aa=j/4*6.28;petals.add(V(xx+Math.cos(az)*rr+Math.sin(aa)*.022,cy,zz+Math.sin(az)*rr+Math.cos(aa)*.022),V(.018,.006,.026),new THREE.Euler(rand(-.2,.2),aa,0));}
  }
 }petals.finish();
}
function banana(root,M,leaves,x,z){
 const g=group(root,x,.02,z);taperTube(g,M.bamboo,[[0,0,0],[.08,1,0],[.1,1.75,.05]],.12,.046,14,9);
 const geo=leafGeometry(.27,.21,20),batch=new Instances(g,geo,M.leaf,'Broad torn banana leaves');
 for(let j=0;j<8;j++){
  const a=j*2.399,len=rand(1.0,1.9),p=V(.08,rand(1.02,1.78),.02);
  batch.add(p,V(len,len,len),new THREE.Euler(rand(-.46,.32),a,rand(-.2,.2)),choose(['#637d42','#77924d','#879855']));
  beam(g,M.bamboo,p,p.clone().add(V(Math.sin(a)*len*.70,.18,Math.cos(a)*len*.70)),.011,.011,true);
 }batch.finish();return g;
}
function vine(root,M,leaf){
 const g=group(root,8.4,.04,-5.10,-.15);
 for(let b=0;b<8;b++){
  const x=-2.5+b*.19,ht=rand(1.5,3.18),pts=[];
  for(let i=0;i<=12;i++)pts.push([x+.12*Math.sin(i*.65+b),i/12*ht,.015]);tube(g,M.bark,pts,.008,18,5);
  for(let i=0;i<54;i++){
   const t=rand(),p=V(x+.13*Math.sin(t*8+b)+rand(-.21,.21),t*ht,.04+rand(0,.06));g.updateWorldMatrix(true,false);p.applyMatrix4(g.matrixWorld);
   const sz=rand(.09,.17);leaf.add(p,V(sz,sz,sz),new THREE.Euler(-Math.PI*.47,rand(-.6,.6),rand(-1.8,1.8)),choose(GREEN));
  }
 }
 return g;
}
function lotusLeafGeom(radius=1){
 const pos=[0,.01,0],uv=[.5,.5],idx=[],n=48;
 for(let i=0;i<=n;i++){const a=.14+i/n*(Math.PI*2-.29);const r=radius*(.95+.035*Math.sin(a*9)+.035*Math.sin(a*5));pos.push(Math.sin(a)*r,.015+Math.sin(a*4)*.025,Math.cos(a)*r);uv.push(.5+Math.sin(a)*.49,.5+Math.cos(a)*.49);if(i<n)idx.push(0,i+2,i+1);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
export function waterPlants(root,M,ctx){
 const g=group(root),lotusG=lotusLeafGeom(),lotus=new Instances(g,lotusG,M.lotus,'Young lotus and water-lily leaves');
 for(let i=0;i<29;i++){
  const x=rand(5.2,8.4),z=rand(-.4,2.6),r=rand(.17,.40),y=i<9?rand(.36,.73):.135+rand(0,.012);
  lotus.add(V(x,y,z),V(r,r,r),new THREE.Euler(rand(-.13,.13),rand(0,6.28),rand(-.13,.13)),choose(['#72865a','#809363','#506f44','#8c996b']));
  if(y>.25)tube(g,M.bamboo,[[x-.14,-.04,z],[x-.06,y*.55,z+.03],[x,y,z]],.009,12,5);
 }
 lotus.finish();
 const leafMat=M.lotus.clone();leafMat.color.set(0x789166);const iris=new Instances(g,leafGeometry(.047,.30,13),leafMat,'Iris and aquatic sedge');
 for(const [x,z] of [[8.8,2.9],[6.9,4.9],[2.85,1.20],[8.4,-1.5]])for(let b=0;b<14;b++){
  const a=rand(0,6.28),len=rand(.48,1.12);iris.add(V(x+rand(-.24,.24),.08,z+rand(-.25,.25)),V(len,len,len),new THREE.Euler(-rand(.75,1.35),a,rand(-.13,.13)),choose(GREEN));
 }iris.finish();
 for(const [x,z] of [[8.7,2.9],[6.8,4.8],[8.5,-1.4]]){
  const ht=rand(.70,.98);beam(g,M.bamboo,[x,.1,z],[x,ht,z],.007,.007,true);
  for(let j=0;j<5;j++){const a=j/5*6.28;const petal=mesh(g,new THREE.SphereGeometry(.066,10,7),M.purpleFlower,x+Math.sin(a)*.045,ht,z+Math.cos(a)*.045);petal.scale.set(.54,.20,1.5);petal.rotation.y=a;}
 }
 batchStatic(g);
}
export function createBotany(parent,M,ctx){
 const root=group(parent);root.name='Layered Jiangnan planting, individually modelled leaves';
 const leaf=new Instances(root,leafGeometry(),M.leaf,'Camphor, maple, shrubs, fern leaflets');
 const narrow=new Instances(root,leafGeometry(.105,.12),M.willow,'Willow and bamboo lanceolate leaves');
 broadTree(root,M,leaf,-11.30,-6.35,8.3,2.65,false);
 broadTree(root,M,leaf,-10.90,4.68,5.6,1.9,true);
 broadTree(root,M,leaf,7.15,-8.03,6.8,1.8,false);
 willowTree(root,M,narrow,10.34,.35);
 bambooClump(root,M,narrow,11.05,-6.40,27,1.14);
 bambooClump(root,M,narrow,-11.7,-.8,14,.57);
 bambooClump(root,M,narrow,5.05,-8.20,11,.52);
 for(const p of [[-11.7,-4.7,.6,.6],[-11.7,-2.7,.7,.9],[-10.6,7.4,.8,.6],[-7.9,7.0,.72,.60],[-6.5,6.2,.7,.59],[-4.6,6.1,.75,.59],[.10,6.7,.9,.78],[10.7,5.45,.9,.80],[11.9,4.1,.8,.9],[11.9,-1.6,.6,.7],[6.8,-5.7,.57,.65],[4.8,-2.4,.6,.70]])shrub(root,M,leaf,...p);
 for(const p of [[-7.3,5.7,.7],[-4.6,5.6,.62],[1.0,6.2,.56],[10.1,4.2,.66],[-11.6,1.7,.55]])floweringShrub(root,M,leaf,...p);
 for(let k=0;k<34;k++){
  const side=k%4;let x,z;if(side===0){x=rand(-12,-10.4);z=rand(-6,5);}else if(side===1){x=rand(-7.5,.4);z=rand(5.7,7.3);}else if(side===2){x=rand(9.7,12.1);z=rand(-2,6.5);}else{x=rand(3.9,6.4);z=rand(-4.6,-2.3);}fern(root,M,leaf,x,z,rand(.45,.83));
 }
 banana(root,M,leaf,-11.0,2.7);banana(root,M,leaf,5.5,-4.38);vine(root,M,leaf);
 const lm=leaf.finish(),nm=narrow.finish();ctx.leafCount=leaf.items.length+narrow.items.length;
 const grass=new Instances(root,leafGeometry(.033,.23,5),M.leaf,'Fine grass, sedges, moss filaments');
 for(let i=0;i<3800;i++){
  const x=rand(-12.5,12.7),z=rand(-8.5,8.1);const allowed=(x<-10.3)||(z>5.75&&x<1.5)||(x>10)||(z<-7.9)||(x>3.4&&x<6.4&&z<-2.6);
  if(!allowed)continue;const len=rand(.10,.28);grass.add(V(x,.03,z),V(len,len,len),new THREE.Euler(-rand(.7,1.3),rand(0,6.28),rand(-.3,.3)),choose(GREEN));
 }grass.finish();
 const fallenMat=M.leaf.clone();fallenMat.color.set(0x9f8a5d);const fallen=new Instances(root,leafGeometry(.30,.12,5),fallenMat,'Rain-darkened fallen leaves');
 for(let i=0;i<120;i++){const x=rand(-8.8,1.2),z=rand(-.25,6.4),sc=rand(.05,.12);fallen.add(V(x,.196,z),V(sc,sc,sc),new THREE.Euler(rand(-.1,.1),rand(0,6.28),0),choose(['#a18b5d','#796844','#ab9467']));}fallen.finish();
 batchStatic(root);waterPlants(parent,M,ctx);return root;
}
