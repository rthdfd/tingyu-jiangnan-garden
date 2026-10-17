import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let seed = 921638;
export function rand(a = 0, b = 1) { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return a + (b - a) * (seed / 4294967296); }
export const choose = a => a[Math.floor(rand(0, a.length))];
export const clamp = THREE.MathUtils.clamp;
export const lerp = THREE.MathUtils.lerp;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function group(parent, x=0,y=0,z=0, ry=0) { const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);return g; }
const boxG = new THREE.BoxGeometry(1,1,1);
const softG = new RoundedBoxGeometry(1,1,1,2,.035);
const cylinderCache = new Map();
export function mesh(parent, geometry, material, x=0,y=0,z=0) {
  const m = new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function box(parent, material, x,y,z, w,h,d, soft=false) { const m=mesh(parent,soft?softG:boxG,material,x,y,z);m.scale.set(w,h,d);return m; }
export function cylinder(parent, material, x,y,z, r1,r2,h,segments=12) {
  const key=`${r1},${r2},${h},${segments}`;
  if(!cylinderCache.has(key)) cylinderCache.set(key,new THREE.CylinderGeometry(r1,r2,h,segments,1));
  return mesh(parent,cylinderCache.get(key),material,x,y,z);
}
export function beam(parent, material, a,b, width=.15,depth=width, round=false) {
  a=Array.isArray(a)?V(...a):a;b=Array.isArray(b)?V(...b):b;
  const length=a.distanceTo(b); const mid=a.clone().add(b).multiplyScalar(.5);
  let m;
  if(round) m=cylinder(parent,material,mid.x,mid.y,mid.z,width,width,length,10);
  else m=box(parent,material,mid.x,mid.y,mid.z,width,length,depth,true);
  m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return m;
}
export function tube(parent,material,points,r=.025,segments=16,radial=7) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p));
  return mesh(parent,new THREE.TubeGeometry(curve,segments,r,radial,false),material);
}
export function taperTube(parent,material,points,r0=.15,r1=.02,segments=16,radial=8) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>Array.isArray(p)?V(...p):p));
  const frames=curve.computeFrenetFrames(segments,false);const ps=[],ns=[],uv=[],idx=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,p=curve.getPointAt(t),r=lerp(r0,r1,Math.pow(t,.86));
    for(let j=0;j<=radial;j++){
      const a=j/radial*Math.PI*2;const n=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));
      const q=p.clone().addScaledVector(n,r);ps.push(q.x,q.y,q.z);ns.push(n.x,n.y,n.z);uv.push(j/radial,t*3);
      if(i<segments&&j<radial){const k=i*(radial+1)+j;idx.push(k,k+radial+1,k+1,k+1,k+radial+1,k+radial+2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(ns,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return mesh(parent,g,material);
}
export function lathe(parent,mat,profile,x=0,y=0,z=0,segments=32){return mesh(parent,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments),mat,x,y,z);}
export function torus(parent,mat,x,y,z,r,tubeR=.025,arc=Math.PI*2){return mesh(parent,new THREE.TorusGeometry(r,tubeR,8,32,arc),mat,x,y,z);}
export function extrudeXZ(parent,mat,points,y,depth=.12,bevel=.015){
  const s=new THREE.Shape();s.moveTo(points[0][0],-points[0][1]);for(let i=1;i<points.length;i++)s.lineTo(points[i][0],-points[i][1]);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,steps:1,curveSegments:32});
  g.rotateX(-Math.PI/2);return mesh(parent,g,mat,0,y,0);
}
export function shapeXZ(points){const s=new THREE.Shape();s.moveTo(points[0][0],-points[0][1]);for(let i=1;i<points.length;i++)s.lineTo(points[i][0],-points[i][1]);s.closePath();const g=new THREE.ShapeGeometry(s,32);g.rotateX(-Math.PI/2);return g;}
export function irregularStone(parent,mat,x,y,z,sx,sy,sz,detail=2){
  const g=new THREE.IcosahedronGeometry(1,detail);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){let a=p.getX(i),b=p.getY(i),c=p.getZ(i);const n=1+.07*Math.sin(a*11+c*7)*Math.cos(b*13)+.05*Math.sin(c*19+a*4);p.setXYZ(i,a*n,b*n,c*n);}
  g.computeVertexNormals();const m=mesh(parent,g,mat,x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rand(-.18,.18),rand(0,6.28),rand(-.1,.1));return m;
}
export function collider(list,parent,x,z,w,d,height=2){parent.updateWorldMatrix(true,false);const p=V(x,0,z).applyMatrix4(parent.matrixWorld);const e=new THREE.Euler().setFromRotationMatrix(parent.matrixWorld);list.push({x:p.x,z:p.z,w,d,ry:e.y,height});}
export function batchStatic(root){
  root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(), groups=new Map(), removals=[];
  function walk(o){
    if(o!==root && o.userData.preserve)return;
    if(o.isMesh && !o.isInstancedMesh && !o.userData.noBatch && !Array.isArray(o.material)){
      const key=`${o.material.uuid}/${o.castShadow}/${o.receiveShadow}`;
      if(!groups.has(key))groups.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,geos:[]});
      let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      if(!g.getAttribute('normal'))g.computeVertexNormals();
      if(!g.getAttribute('uv'))g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));
      for(const n of Object.keys(g.attributes))if(!['position','normal','uv'].includes(n))g.deleteAttribute(n);
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));
      groups.get(key).geos.push(g);removals.push(o);
    }
    for(const c of [...o.children])walk(c);
  }
  walk(root);for(const o of removals)o.removeFromParent();
  for(const item of groups.values()){
    const g=mergeGeometries(item.geos,false);if(!g)throw new Error('Static geometry merge failed');
    const m=new THREE.Mesh(g,item.material);m.castShadow=item.cast;m.receiveShadow=item.receive;m.name='Batched architecture';root.add(m);
    for(const g0 of item.geos)g0.dispose();
  }
  return groups.size;
}
export class Instances {
  constructor(parent,geo,mat,name='instances'){this.parent=parent;this.geo=geo;this.mat=mat;this.name=name;this.items=[];}
  add(p,scale=V(1,1,1),rot=new THREE.Euler(),color=null){const q=rot.isQuaternion?rot:new THREE.Quaternion().setFromEuler(rot);const m=new THREE.Matrix4().compose(p,q,scale);this.items.push({m,color});}
  finish(){if(!this.items.length)return null;const m=new THREE.InstancedMesh(this.geo,this.mat,this.items.length);this.items.forEach((v,i)=>{m.setMatrixAt(i,v.m);if(v.color)m.setColorAt(i,new THREE.Color(v.color));});m.castShadow=true;m.receiveShadow=true;m.name=this.name;m.userData.noBatch=true;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();this.parent.add(m);return m;}
}
export function canvasTexture(w,h,paint,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
