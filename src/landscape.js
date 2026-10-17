import * as THREE from 'three';
import {Water} from 'three/addons/objects/Water.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {V,rand,choose,group,mesh,box,cylinder,beam,tube,torus,extrudeXZ,shapeXZ,irregularStone,Instances,canvasTexture,batchStatic,lerp} from './core.js';

export const POND=[[-.38,1.35],[.40,-.20],[2.25,-1.35],[4.4,-1.70],[6.50,-1.72],[8.52,-1.10],[9.48,.40],[9.62,2.15],[8.69,4.31],[7.0,5.63],[4.62,6.13],[2.20,5.64],[.37,4.37],[-.48,3.05]];
const BOUNDARY=[[-12.9,-9.5],[-5.5,-10.0],[2.6,-9.76],[10.2,-9.25],[12.8,-6.1],[13.6,-.5],[13.2,4.6],[10.8,7.5],[5.7,9.0],[-1.1,8.9],[-7.4,8.4],[-11.6,6.9],[-13.6,2.4],[-13.8,-4.6]];
function smoothPoints(points,n=5){const curve=new THREE.CatmullRomCurve3(points.map(p=>V(p[0],0,p[1])),true,'catmullrom',.32);return curve.getPoints(points.length*n).map(p=>[p.x,p.z]);}
export const pondOutline=smoothPoints(POND,7);
export function isInPond(x,z){let inside=false;for(let i=0,j=POND.length-1;i<POND.length;j=i++){const a=POND[i],b=POND[j];if(((a[1]>z)!==(b[1]>z))&&(x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]))inside=!inside;}return inside;}
function terrain(parent,M){
 const g=group(parent);const boundary=smoothPoints(BOUNDARY,5);
 extrudeXZ(g,M.soil,boundary,-.66,.46,.06);
 const s=new THREE.Shape();boundary.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();
 const h=new THREE.Path();[...pondOutline].reverse().forEach((p,i)=>i?h.lineTo(p[0],-p[1]):h.moveTo(p[0],-p[1]));h.closePath();s.holes.push(h);
 const top=new THREE.ShapeGeometry(s,32);top.rotateX(-Math.PI/2);const uv=top.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4,uv.getY(i)/4);mesh(g,top,M.earth,0,.03,0);
 const bottom=shapeXZ(pondOutline);mesh(g,bottom,M.stoneWet,0,-.245,0);
 // A fine, irregular retaining edge reads as earth and stone rather than a plastic display tray.
 const edge=new Instances(g,new THREE.IcosahedronGeometry(1,1),M.stone,'Hand-set retaining stones');
 for(let k=0;k<boundary.length;k++){const a=boundary[k],b=boundary[(k+1)%boundary.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);const n=Math.ceil(len/.30);for(let j=0;j<n;j++){const t=j/n;edge.add(V(lerp(a[0],b[0],t),-.22+rand(-.04,.03),lerp(a[1],b[1],t)),V(rand(.15,.28),rand(.15,.23),rand(.12,.21)),new THREE.Euler(rand(-.2,.2),rand(0,6.28),0));}}
 edge.finish();return g;
}
function pavers(root,M){
 const g=group(root),mats=Array.from({length:7},(_,i)=>{const m=M.paving.clone();m.color.multiplyScalar(.86+i*.035);return m;});
 for(let ix=0;ix<10;ix++)for(let iz=0;iz<7;iz++){
  const x=-8.63+ix*.845,z=-.64+iz*.705+(ix%2)*.015;
  if(x>-.6 && isInPond(x,z))continue;
  const w=.82+rand(-.018,.014),d=.675+rand(-.018,.018),j=.022;
  const pts=[[x-w/2+j,z-d/2],[x+w/2-j,z-d/2+rand(-.012,.012)],[x+w/2,z-d/2+j],[x+w/2,z+d/2-j],[x+w/2-j,z+d/2],[x-w/2+j,z+d/2],[x-w/2,z+d/2-j],[x-w/2,z-d/2+j]];
  extrudeXZ(g,choose(mats),pts,.065,.115,.009);
 }
 const route=[[-3.6,4.9],[-2.9,5.45],[-2.4,6.0],[-2.28,6.75],[-1.9,7.45],[-1.15,7.85],[.1,7.90],[1.2,7.62],[2.4,7.1],[3.3,6.62]];
 route.forEach(([x,z],i)=>{const w=rand(.72,1.0),d=rand(.54,.78);const pts=[];for(let k=0;k<7;k++){const a=k/7*Math.PI*2;pts.push([x+Math.sin(a)*w*.6,z+Math.cos(a)*d*.65]);}extrudeXZ(g,mats[i%7],pts,.048,.14,.014);});
 for(let i=0;i<12;i++){const x=10.3+Math.sin(i*.31)*.35,z=-5.1+i*.67;extrudeXZ(g,mats[i%7],[[x-.35,z-.29],[x+.37,z-.31],[x+.41,z+.30],[x-.34,z+.32]],.03,.12,.016);}
 return g;
}
function taihuGeometry(){
 const res=42,mc=new MarchingCubes(res,new THREE.MeshStandardMaterial(),true,false,23000);mc.isolation=0;
 const ell=(x,y,z,cx,cy,cz,rx,ry,rz)=>{const xx=(x-cx)/rx,yy=(y-cy)/ry,zz=(z-cz)/rz;return (Math.sqrt(xx*xx+yy*yy+zz*zz)-1)*Math.min(rx,ry,rz);};
 const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
 for(let z=0;z<res;z++)for(let y=0;y<res;y++)for(let x=0;x<res;x++){
  const X=x/res*2-1,Y=y/res*2-1,Z=z/res*2-1;
  let d=ell(X,Y,Z,0,-.61,.02,.63,.35,.54);
  d=smin(d,ell(X,Y,Z,-.20,-.02,.06,.40,.66,.40),.22);
  d=smin(d,ell(X,Y,Z,.22,.27,.08,.43,.47,.37),.17);
  d=smin(d,ell(X,Y,Z,.08,.69,0,.51,.23,.36),.15);
  d=smin(d,ell(X,Y,Z,-.51,.23,.06,.23,.27,.33),.12);
  for(const p of [[.02,.0,0,.17,.22,1.7],[.25,.47,0,.135,.14,1.4],[-.35,.37,0,.112,.13,1.2],[-.17,-.43,0,.18,.12,1.5]])d=Math.max(d,-ell(X,Y,Z,...p));
  d+=(Math.sin(X*28+Math.sin(Y*17))*Math.cos(Z*23+Y*13)*.014+Math.sin(Y*36+Z*27)*Math.sin(X*39)*.009);
  mc.field[x+res*(y+res*z)]=-d;
 }mc.update();const count=mc.count||mc.geometry.drawRange.count;
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(mc.geometry.attributes.position.array.slice(0,count*3),3));g.setAttribute('normal',new THREE.BufferAttribute(mc.geometry.attributes.normal.array.slice(0,count*3),3));
 const uv=new Float32Array(count*2),p=g.attributes.position;for(let i=0;i<count;i++){uv[i*2]=p.getX(i)*.8+p.getZ(i)*.45;uv[i*2+1]=p.getY(i)*1.15;}
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2));mc.geometry.dispose();mc.material.dispose();return g;
}
function rockery(root,M){
 const g=group(root),tai=taihuGeometry();
 const main=mesh(g,tai,M.stone,5.84,1.52,-2.76);main.scale.set(1.55,1.87,1.35);main.rotation.y=-.2;
 const side=mesh(g,tai,M.stoneWet,7.23,.90,-2.15);side.scale.set(.89,1.14,.82);side.rotation.set(.03,1.6,-.2);
 const scholar=mesh(g,tai,M.stoneWet,-6.92,.94,4.54);scholar.scale.set(.85,1.18,.77);scholar.rotation.y=.56;
 for(const [x,z,s] of [[5.01,-2.28,.72],[5.5,-1.9,.5],[6.3,-3.45,.68],[6.6,-1.85,.58],[7.80,-2.56,.45],[-6.4,4.55,.37],[-7.65,4.58,.41]]){
  irregularStone(g,M.stoneWet,x,s*.32,z,s,s*.44,s*.64,2);
  irregularStone(g,M.moss,x-.08,s*.63,z-.02,s*.65,.04,s*.43,1);
 }
 for(let i=0;i<pondOutline.length;i++){
  const p=pondOutline[i];if(i%2)continue;const r=rand(.20,.43);const rock=irregularStone(g,i%3?M.stoneWet:M.stone,p[0]+rand(-.07,.07),.005+rand(-.03,.06),p[1]+rand(-.06,.06),r,rand(.14,.32),r*rand(.7,1.1),2);
  if(i%4===0)irregularStone(g,M.moss,p[0],.13,p[1],r*.72,.045,r*.68,1);
 }
 const pebbles=new Instances(g,new THREE.IcosahedronGeometry(1,1),M.gravel,'Shoreline pebbles');
 for(let i=0;i<450;i++){
  const p=choose(pondOutline),x=p[0]+rand(-.36,.36),z=p[1]+rand(-.35,.35),r=rand(.023,.064);
  pebbles.add(V(x,rand(-.015,.015),z),V(r,r*.56,r*.8),new THREE.Euler(rand(0,2),rand(0,6),rand(0,2)),choose(['#a0a292','#7b857c','#949a8b']));
 }pebbles.finish();return g;
}
function stoneBridge(root,M,ctx){
 const a=V(-.15,0,4.80),b=V(3.52,0,6.19),len=a.distanceTo(b),g=group(root,(a.x+b.x)/2,0,(a.z+b.z)/2,Math.atan2(b.x-a.x,b.z-a.z));g.name='Low stone arch bridge';
 const height=t=>.22+.48*Math.sin(Math.PI*t),n=19;
 for(let i=0;i<n;i++){
  const t=(i+.5)/n,z=(t-.5)*len,y=height(t),s=box(g,M.stoneWet,0,y,z,1.10,.16,len/n+.014,true);s.rotation.x=-Math.atan((height(t+.001)-height(t-.001))/(.002*len));
  for(const x of [-.53,.53]){
   const piece=box(g,M.stone,x,y-.10,z,.21,.27,len/n+.018,true);piece.rotation.copy(s.rotation);
  }
 }
 for(const side of [-1,1]){
  const points=[];
  for(let i=0;i<=6;i++){
   const t=i/6,z=(t-.5)*len,y=height(t);box(g,M.stone,side*.49,y+.32,z,.11,.65,.11,true);box(g,M.stoneWet,side*.49,y+.66,z,.155,.083,.15,true);points.push([side*.49,y+.57,z]);
  }
  for(let i=0;i<6;i++)beam(g,M.stone,points[i],points[i+1],.066,.081,false);
 }
 ctx.bridge={a,b,width:1.06,height};return g;
}
function waterNormals(){return canvasTexture(256,256,(c,w,h)=>{const im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const xx=x/w*Math.PI*2,yy=y/h*Math.PI*2,k=(y*w+x)*4;const dx=Math.sin(xx*7+Math.sin(yy*3))*.14+Math.cos(xx*17+yy*13)*.065,dy=Math.cos(yy*11+Math.sin(xx*5))*.13+Math.sin(xx*19-yy*9)*.04;im.data[k]=128+dx*127;im.data[k+1]=128+dy*127;im.data[k+2]=252;im.data[k+3]=255;}c.putImageData(im,0,0);},false);}
function reflectionShader(){return {
 uniforms:{color:{value:new THREE.Color(0x869a94)},tDiffuse:{value:null},textureMatrix:{value:new THREE.Matrix4()},uTime:{value:0}},
 vertexShader:`uniform mat4 textureMatrix; varying vec4 vRef; varying vec2 vLocal; void main(){vLocal=position.xy;vRef=textureMatrix*vec4(position,1.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform vec3 color;uniform float uTime;varying vec4 vRef;varying vec2 vLocal;float noise(vec2 p){return sin(p.x*2.31+sin(p.y*1.8))*.5+sin(p.y*5.1+p.x*.4)*.25;}
 void main(){vec2 uv=vRef.xy/vRef.w;float n=noise(vLocal);float wet=smoothstep(-.43,.55,n);vec2 d=vec2(sin(vLocal.y*91.),cos(vLocal.x*83.))*.00035;vec3 refl=texture2D(tDiffuse,uv+d).rgb*.45;refl+=texture2D(tDiffuse,uv+d+vec2(.001,0.)).rgb*.275;refl+=texture2D(tDiffuse,uv+d-vec2(.001,0.)).rgb*.275;gl_FragColor=vec4(refl,.025+wet*.225);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')
 };}
function waterAndWeather(parent,M,ctx){
 const g=group(parent);const normals=waterNormals();
 const waterGeometry=shapeXZ(pondOutline);waterGeometry.rotateX(Math.PI/2);
 const water=new Water(waterGeometry,{textureWidth:512,textureHeight:512,waterNormals:normals,sunDirection:V(-.3,.8,.4).normalize(),sunColor:0xc9d0b9,waterColor:0x344e40,distortionScale:1.38,fog:true,alpha:1});
 water.rotation.x=-Math.PI/2;water.position.y=.094;water.name='Rainwater pond with planar reflections';water.material.uniforms.size.value=4.2;g.add(water);ctx.water=water;
 const refl=new Reflector(new THREE.PlaneGeometry(7.9,4.40),{textureWidth:384,textureHeight:384,color:0x8a9b91,clipBias:.008,shader:reflectionShader(),multisample:0});refl.rotation.x=-Math.PI/2;refl.position.set(-4.64,.195,1.32);refl.material.transparent=true;refl.material.depthWrite=false;refl.renderOrder=3;g.add(refl);ctx.puddle=refl;
 const wo=water.onBeforeRender,ro=refl.onBeforeRender;
 water.onBeforeRender=function(renderer,scene,camera,...args){if(scene.overrideMaterial)return;const vis=refl.visible;refl.visible=false;wo.call(this,renderer,scene,camera,...args);refl.visible=vis;};
 refl.onBeforeRender=function(renderer,scene,camera,...args){if(scene.overrideMaterial)return;const vis=water.visible;water.visible=false;ro.call(this,renderer,scene,camera,...args);water.visible=vis;};
 ctx.ripples=[];const ringGeo=new THREE.RingGeometry(.96,1,48);
 for(let i=0;i<57;i++){
  let x,z;do{x=rand(-.2,9.3);z=rand(-1.4,5.8);}while(!isInPond(x,z));
  const mat=new THREE.MeshBasicMaterial({color:0xcad8c7,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false});
  const r=mesh(g,ringGeo,mat,x,.105,z);r.rotation.x=-Math.PI/2;r.castShadow=false;r.renderOrder=4;ctx.ripples.push({mesh:r,phase:rand(0,1),speed:rand(.24,.48),size:rand(.18,.40)});
 }
 const dropsN=128,positions=new Float32Array(dropsN*6),seeds=[];
 for(let i=0;i<dropsN;i++){const eave=i<89;const x=eave?rand(-9.6,4.3):rand(-11,12),z=eave?-1.43+rand(-.04,.04):rand(-6,6),top=eave?4.29:rand(5.0,8.0);seeds.push({x,z,top,phase:rand()});}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));const rain=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xcddecf,transparent:true,opacity:.20,depthWrite:false}));rain.frustumCulled=false;g.add(rain);ctx.rain={mesh:rain,seeds};
 const mistMap=canvasTexture(128,128,(c,w,h)=>{const grad=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);grad.addColorStop(0,'rgba(233,242,230,.7)');grad.addColorStop(.4,'rgba(226,237,227,.3)');grad.addColorStop(1,'rgba(226,237,227,0)');c.fillStyle=grad;c.fillRect(0,0,w,h);});ctx.mists=[];
 for(const [x,y,z,w,h]of [[6.3,.25,3.8,5.3,.55],[5.8,.42,-1.2,4.2,.70],[-11.7,.6,-4,3.1,1.3],[10,.31,4.9,3.7,.65]]){
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:mistMap,transparent:true,opacity:.115,depthWrite:false,color:0xcadbd1}));s.position.set(x,y,z);s.scale.set(w,h,1);g.add(s);ctx.mists.push({sprite:s,x,z});
 }
 return g;
}
export function createLandscape(parent,M,ctx){
 const root=group(parent);terrain(root,M);pavers(root,M);rockery(root,M);stoneBridge(root,M,ctx);batchStatic(root);waterAndWeather(parent,M,ctx);return root;
}
export function updateWeather(ctx,time,night){
 if(ctx.water){ctx.water.material.uniforms.time.value=time*.15;ctx.water.material.uniforms.sunColor.value.set(night>.7?0x889fad:0xd9ddbf);ctx.water.material.uniforms.waterColor.value.set(0x324d40).lerp(new THREE.Color(0x162c2e),night);}
 if(ctx.puddle)ctx.puddle.material.uniforms.uTime.value=time;
 for(const r of ctx.ripples){const t=(time*r.speed+r.phase)%1;const s=.015+t*r.size;r.mesh.scale.setScalar(s);r.mesh.material.opacity=(1-t)*.135;}
 if(ctx.rain){const p=ctx.rain.mesh.geometry.attributes.position;ctx.rain.seeds.forEach((s,i)=>{const yy=s.top-((time*1.7+s.phase*5)%s.top);p.setXYZ(i*2,s.x,yy,s.z);p.setXYZ(i*2+1,s.x+.009,yy+.065,s.z-.008);});p.needsUpdate=true;ctx.rain.mesh.material.opacity=lerp(.20,.12,night);}
 for(const m of ctx.mists){m.sprite.position.x=m.x+Math.sin(time*.075+m.z)*.12;m.sprite.material.opacity=lerp(.09,.16,night);}
 for(let i=0;i<ctx.flames.length;i++){const f=ctx.flames[i];f.scale.y=1+Math.sin(time*2.7+i)*.04;}
}
