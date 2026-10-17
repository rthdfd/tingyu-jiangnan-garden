import * as THREE from 'three';
import {V,rand,group,mesh,box,cylinder,beam,tube,lathe,torus,collider,Instances,batchStatic} from './core.js';
import {textMaterial} from './materials.js';
import {furnishHouse,lantern,table,chair,teaSet,scroll} from './furniture.js';

const BAY=4.06, HALF=6.09;
export function roofY(t,x=0,w=13.8,run=3.98,ridge=5.94,eave=3.63){const u=Math.min(1.03,Math.abs(t)/run);return ridge+(eave-ridge)*(1.7*u-.7*u*u)+.27*Math.pow(Math.abs(x)/(w/2),8)*Math.pow(u,3);}
function tileGeo(width=.16,length=.34){
 const p=[],uv=[],idx=[];const nx=8,nz=2;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const a=i/nx*Math.PI;p.push(Math.cos(a)*width/2,Math.sin(a)*width*.38,j/nz*length-length/2);uv.push(i/nx,j/nz);if(j<nz&&i<nx){const k=j*(nx+1)+i;idx.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function tiledRoof(parent,M,{width=13.8,run=3.98,ridge=5.94,eave=3.63,rafters=true}={}){
 const roots=[];
 for(const side of [1,-1]){
  const r=group(parent);r.userData.preserve=true;r.name=side===1?'Front removable roof slope':'Back roof slope';roots.push(r);
  const pos=[],uv=[],ind=[],nx=Math.ceil(width/.3),nz=20;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=(i/nx-.5)*width,t=j/nz*run;pos.push(x,roofY(t,x,width,run,ridge,eave),side*t);uv.push(i/nx*width*.9,j/nz*run*1.3);if(j<nz&&i<nx){const k=j*(nx+1)+i;if(side===1)ind.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);else ind.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();mesh(r,g,M.tile);
  const underside=g.clone();underside.translate(0,-.084,0);const underMat=M.woodDark.clone();underMat.side=THREE.DoubleSide;mesh(r,underside,underMat);
  const tiles=[M.tile,M.tileDark,M.tileLight].map(m=>new Instances(r,tileGeo(),m,'Individually modelled fired-clay roof tiles'));
  const cols=Math.floor(width/.207),rows=Math.ceil(run/.305);
  for(let i=0;i<=cols;i++)for(let j=0;j<rows;j++){
   const x=(i/cols-.5)*(width-.14),t=(j+.45)/rows*(run-.04);const y=roofY(t,x,width,run,ridge,eave)+.016;
   const dY=(roofY(t+.015,x,width,run,ridge,eave)-roofY(t-.015,x,width,run,ridge,eave))/.03;
   const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.atan(-dY),side===1?0:Math.PI,0,'YXZ'));
   tiles[Math.floor(rand(0,3))].add(V(x,y,side*t),V(1,1,1.12),q);
  }tiles.forEach(t=>t.finish());
  const ends=new Instances(r,new THREE.CylinderGeometry(.07,.073,.029,10),M.tileDark,'Eave tile end caps');
  for(let i=0;i<=cols;i++){const x=(i/cols-.5)*(width-.14);ends.add(V(x,roofY(run,x,width,run,ridge,eave)+.045,side*(run+.012)),V(1,1,1),new THREE.Euler(Math.PI/2,0,0));}ends.finish();
  for(const x of [-width/2,width/2]){
   const pts=[];for(let i=0;i<=18;i++){const t=i/18*run;pts.push([x,roofY(t,x,width,run,ridge,eave)-.105,side*t]);}tube(r,M.woodDark,pts,.068,28,7);
  }
  if(rafters){
   const count=Math.floor((width-.18)/.29);
   for(let k=0;k<=count;k++){const x=(k/count-.5)*(width-.18);const pts=[];for(let i=0;i<=12;i++){const t=i/12*run;pts.push([x,roofY(t,x,width,run,ridge,eave)-.154,side*t]);}tube(parent,M.woodLight,pts,.036,15,6);}
  }
  batchStatic(r);
 }
 const ridgeRoot=group(parent);ridgeRoot.userData.preserve=true;
 box(ridgeRoot,M.tileDark,0,ridge+.055,0,width+.06,.11,.21,true);
 const ridgeTiles=new Instances(ridgeRoot,new THREE.CylinderGeometry(.108,.115,.26,10),M.tile,'Ridge cap tiles');
 for(let x=-width/2;x<=width/2;x+=.22)ridgeTiles.add(V(x,ridge+.125,0),V(1,1,1),new THREE.Euler(0,0,Math.PI/2));ridgeTiles.finish();
 for(const s of [-1,1]){tube(ridgeRoot,M.tileDark,[[s*(width/2-.1),ridge+.09,0],[s*(width/2+.08),ridge+.12,0],[s*(width/2+.11),ridge+.26,0]],.062,12,8);}
 batchStatic(ridgeRoot);return {front:roots[0],back:roots[1],ridge:ridgeRoot};
}
function lattice(parent,M,w,h,y=0,z=0,spacing=.21){
 const g=group(parent,0,y,z);
 for(const x of [-w/2,w/2])box(g,M.wood,x,h/2,0,.055,h,.065,true);
 for(const yy of [0,h])box(g,M.wood,0,yy,0,w,.055,.065,true);
 const nx=Math.floor(w/spacing),ny=Math.floor(h/spacing);
 for(let i=1;i<nx;i++)box(g,M.wood,(-.5+i/nx)*w,h/2,0,.018,h,.021);
 for(let j=1;j<ny;j++)box(g,M.wood,0,j/ny*h,0,w,.018,.021);
 return g;
}
function doorLeaf(parent,M,x,z,w,angle=0,paper=false){
 const g=group(parent,x,0,z,angle);const cx=w/2;
 for(const xx of [.027,w-.027])box(g,M.wood,xx,1.40,0,.054,2.80,.072,true);
 for(const yy of [.035,.74,2.70])box(g,M.wood,cx,yy,0,w,.065,.075,true);
 box(g,M.woodDark,cx,.40,0,w-.08,.61,.027);
 box(g,M.furnitureEdge,cx,.41,.022,w-.17,.46,.019,true);
 lattice(g,M,w-.085,1.88,.775,.0,.115).position.x=cx;
 if(paper){const p=mesh(g,new THREE.PlaneGeometry(w-.1,1.86),M.silk,cx,1.715,-.018);p.castShadow=false;}
 const knob=torus(g,M.brass,w-.09,.88,.05,.022,.005);knob.rotation.x=.15;
 return g;
}
function frontDoors(house,M){
 for(const center of [-BAY,0,BAY]){
  const w=3.76;
  for(const xx of [center-w/2,center+w/2])box(house,M.woodDark,xx,1.47,3.005,.09,2.95,.14,true);
  box(house,M.wood,center,2.91,3.005,w,.14,.17,true);
  lattice(house,M,w,.39,2.995,3.005,.19).position.x=center;
  box(house,M.woodDark,center,.045,3.005,w,.085,.14,true);
  const leaf=.61;
  // Bifolding leaves remain at the sides; clear central openings are over two metres.
  doorLeaf(house,M,center-w/2+.04,3.02,leaf,-1.03,center<0);
  doorLeaf(house,M,center-w/2+.35,3.53,leaf,.24,false);
  doorLeaf(house,M,center+w/2-.05,3.02,leaf,Math.PI+1.0,center>0);
  doorLeaf(house,M,center+w/2-.36,3.51,leaf,Math.PI-.21,false);
 }
}
function partition(house,M,x){
 const g=group(house,x,0,0,Math.PI/2);
 // Local horizontal direction maps to the north/south room depth. Door passage z=.40..2.25 remains clear.
 for(const xx of [-.05,2.92])box(g,M.wood,xx,1.58,0,.075,3.16,.09,true);
 box(g,M.woodDark,1.46,.51,0,2.92,.96,.056);
 lattice(g,M,2.90,2.01,1.035,0,.225).position.x=1.46;
 box(g,M.wood,0,3.23,0,6.08,.17,.16,true);
 box(g,M.woodDark,-2.71,1.53,0,.61,3.06,.064);
 for(const xx of [-2.31,-.26])box(g,M.wood,xx,1.54,0,.065,3.08,.086,true);
 lattice(g,M,2.00,.40,2.70,0,.19).position.x=-1.28;
}
function gable(house,M,x){
 const sign=Math.sign(x),g=group(house,x,0,0,sign*Math.PI/2);
 box(g,M.plaster,0,.54,0,6.05,1.08,.17);
 box(g,M.plaster,0,3.05,0,6.05,.75,.17);
 for(const xx of [-2.28,2.26])box(g,M.plaster,xx,1.79,0,1.52,1.44,.17);
 const frame=lattice(g,M,2.89,1.46,1.06,.045,.22);box(g,M.wood,0,1.04,.05,3.03,.10,.25,true);
 const shape=new THREE.Shape();shape.moveTo(-3.06,3.38);shape.lineTo(3.06,3.38);
 for(let i=0;i<=30;i++){const z=3.06-i/30*6.12;shape.lineTo(z,roofY(Math.abs(z),HALF)-.24);}shape.closePath();
 const geom=new THREE.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:false,steps:1});mesh(g,geom,M.plasterInterior,0,0,-.07);
 box(g,M.plasterDark,0,.12,.092,6.08,.24,.012);
}
export function createHouse(parent,M,ctx){
 const house=group(parent,-2.70,.55,-5.40);house.name='Three-bay timber house: hall, study, bedchamber';
 box(house,M.stoneWet,0,-.27,.23,13.05,.52,7.3,true);
 box(house,M.stone,0,-.037,.23,13.10,.11,7.36,true);
 const floorVariants=Array.from({length:5},(_,i)=>{const m=M.floor.clone();m.color.multiplyScalar(.88+i*.038);return m;});
 for(let ix=0;ix<20;ix++)for(let iz=0;iz<10;iz++){const x=-6.04+ix*.637,z=-3.02+iz*.66;box(house,floorVariants[(ix*3+iz*7)%5],x,.035,z,.623,.068,.647);}
 for(let k=0;k<3;k++)box(house,M.stoneWet,0,-.42+k*.14,4.17-k*.23,3.3+k*.19,.14,.49,true);
 for(const x of [-HALF,-BAY/2,BAY/2,HALF])for(const z of [-2.97,0,2.97]){
  cylinder(house,M.stoneWet,x,.135,z,.255,.28,.25,16);cylinder(house,M.stone,x,.257,z,.211,.247,.035,16);
  cylinder(house,M.wood,x,1.91,z,.169,.190,3.31,18);
  for(const yy of [3.24,3.42])box(house,M.woodDark,x,yy,z,.38,.11,.32,true);
  collider(ctx.colliders,house,x,z,.39,.39,3.6);
 }
 for(const x of [-HALF,-BAY/2,BAY/2,HALF]){
  box(house,M.wood,x,3.39,0,.24,.28,6.23,true);
  for(const z of [-1.52,1.52]){box(house,M.wood,x,3.89,z,.18,.75,.20,true);box(house,M.woodDark,x,4.28,z,.31,.11,.31,true);}
  box(house,M.wood,x,4.32,0,.23,.22,3.45,true);
  box(house,M.wood,x,4.96,0,.18,1.08,.19,true);
  box(house,M.woodDark,x,5.53,0,.32,.12,.32,true);
  for(const z of [-2.97,2.97])for(const s of [-1,1]){
   tube(house,M.wood,[[x+s*.80,3.28,z],[x+s*.49,3.21,z],[x+s*.27,2.92,z],[x,2.78,z]],.055,16,7);
  }
 }
 for(const z of [-2.97,0,2.97])box(house,M.wood,0,3.37,z,12.47,.25,.20,true);
 for(const z of [-3.0,-1.52,0,1.52,3.0]){const y=roofY(Math.abs(z))-.25;const p=cylinder(house,M.woodLight,0,y,z,.118,.118,13.37,14);p.rotation.z=Math.PI/2;}
 box(house,M.plasterInterior,0,1.67,-3.06,12.24,3.34,.18);
 box(house,M.plasterDark,0,.16,-2.956,12.19,.24,.018);
 gable(house,M,-HALF);gable(house,M,HALF);
 partition(house,M,-BAY/2);partition(house,M,BAY/2);
 frontDoors(house,M);
 ctx.mainRoof=tiledRoof(house,M);ctx.house=house;
 const plaque=textMaterial('听雨堂',{w:1024,h:320,bg:'#29372f',fg:'#c7ad76',size:202});
 box(house,M.woodDark,0,3.54,3.14,1.92,.62,.14,true);mesh(house,new THREE.PlaneGeometry(1.79,.49),plaque,0,3.54,3.216);
 for(const x of [-5.70,-2.43,2.48,5.7])lantern(house,M,x,2.73,3.43,ctx,.75,Math.abs(x)>5);
 for(const x of [-4.08,4.08]){box(house,M.weatheredWood,x,.40,3.70,2.78,.12,.42,true);for(const xx of [x-1.09,x+1.09])box(house,M.wood,xx,.21,3.70,.13,.40,.32,true);}
 furnishHouse(house,M,ctx);
 collider(ctx.colliders,house,0,-3.07,12.48,.23);
 for(const x of [-HALF,HALF])collider(ctx.colliders,house,x,0,.24,6.22);
 for(const x of [-BAY/2,BAY/2]){collider(ctx.colliders,house,x,-1.50,.17,3.05);collider(ctx.colliders,house,x,2.71,.17,.64);}
 batchStatic(house);return house;
}
function lowWall(parent,M,a,b,height=2.5){
 const mid=V((a[0]+b[0])/2,0,(a[1]+b[1])/2);const len=Math.hypot(b[0]-a[0],b[1]-a[1]);const g=group(parent,mid.x,0,mid.z,Math.atan2(-(b[1]-a[1]),b[0]-a[0]));
 box(g,M.plaster,0,height/2,0,len,height,.26);
 box(g,M.brick,0,.19,0,len,.37,.275);
 box(g,M.plasterDark,0,.46,.141,len,.18,.014);
 box(g,M.tileDark,0,height+.04,0,len+.12,.13,.49,true);
 const caps=new Instances(g,tileGeo(.17,.37),M.tile,'Garden wall coping');
 for(let x=-len/2;x<len/2;x+=.19)caps.add(V(x,height+.13,0),V(1,1,1),new THREE.Euler());caps.finish();return g;
}
export function gardenWalls(parent,M,ctx){
 const g=group(parent);
 lowWall(g,M,[-13,-8.9],[5.9,-9.1],2.53);lowWall(g,M,[-13,-8.9],[-13.1,1.6],2.10);
 lowWall(g,M,[-13.1,1.6],[-11.9,6.7],1.63);
 const moon=group(g,8.55,.03,-5.55,-.15);moon.name='Actual open moon gate, not a painted door';
 const s=new THREE.Shape();s.moveTo(-3.28,0);s.lineTo(3.28,0);s.lineTo(3.28,3.24);s.lineTo(-3.28,3.24);s.closePath();
 const hole=new THREE.Path();hole.absellipse(.2,1.33,1.22,1.22,0,Math.PI*2,true);s.holes.push(hole);
 const geom=new THREE.ExtrudeGeometry(s,{depth:.25,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1,curveSegments:64});mesh(moon,geom,M.plaster);
 const rim=torus(moon,M.brick,.2,1.33,.285,1.247,.069);rim.castShadow=true;
 for(let i=0;i<38;i++){const a=i/38*Math.PI*2;const brick=box(moon,M.brick,.2+Math.cos(a)*1.254,1.33+Math.sin(a)*1.254,.311,.052,.129,.032);brick.rotation.z=a;}
 box(moon,M.tileDark,0,3.26,.12,6.75,.14,.57,true);
 const cap=new Instances(moon,tileGeo(.16,.54),M.tile,'Moon-gate wall coping tiles');for(let x=-3.36;x<3.36;x+=.18)cap.add(V(x,3.38,.12));cap.finish();
 box(moon,M.stoneWet,.2,.04,.12,1.0,.07,.53,true);
 const label=textMaterial('小隐',{w:256,h:256,bg:'#c5c8b5',fg:'#586650',size:94});mesh(moon,new THREE.PlaneGeometry(.34,.34),label,-2.12,2.43,.285);
 lowWall(g,M,[11.77,-6.05],[13.08,-.8],2.25);
 batchStatic(g);ctx.moonGate=moon;
}
function corridorSegment(parent,M,a,b,ctx){
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);const g=group(parent,(a[0]+b[0])/2,.21,(a[1]+b[1])/2,angle);
 box(g,M.stoneWet,0,-.14,0,1.74,.28,len+.20,true);
 for(let i=0;i<Math.ceil(len/.30);i++)box(g,M.weatheredWood,0,.034,-len/2+i*.30,1.63,.056,.28);
 const rows=Math.max(1,Math.round(len/1.8));
 for(let k=0;k<=rows;k++)for(const x of [-.68,.68]){const z=-len/2+k/rows*len;cylinder(g,M.stone,x,.09,z,.15,.18,.15);cylinder(g,M.wood,x,1.36,z,.071,.086,2.49);box(g,M.wood,0,2.53,z,1.55,.15,.14,true);}
 for(const x of [-.68,.68])box(g,M.wood,x,2.55,0,.14,.15,len+.17,true);
 const rr=group(g,0,0,0,Math.PI/2);tiledRoof(rr,M,{width:len+.38,run:1.10,ridge:3.0,eave:2.48,rafters:true});
 box(g,M.wood,-.68,.60,0,.22,.12,len-.24,true);box(g,M.wood,-.68,1.03,0,.04,.065,len-.2);
 lantern(g,M,0,2.15,0,ctx,.59,false);return g;
}
export function pavilionAndCorridor(parent,M,ctx){
 const root=group(parent);corridorSegment(root,M,[-9.63,-2.7],[-10.00,.52],ctx);corridorSegment(root,M,[-10.00,.52],[-8.99,3.66],ctx);
 const p=group(root,-8.82,.27,5.02,-.15);p.name='Open rain-listening pavilion';
 box(p,M.stoneWet,0,-.16,0,3.42,.29,3.34,true);
 for(let i=0;i<10;i++)box(p,M.weatheredWood,-1.44+i*.32,0,0,.30,.07,3.20);
 for(const x of [-1.34,1.34])for(const z of [-1.3,1.3]){cylinder(p,M.stoneWet,x,.10,z,.21,.23,.18);cylinder(p,M.wood,x,1.52,z,.11,.125,2.72);}
 for(const z of [-1.3,1.3])box(p,M.wood,0,2.86,z,3.03,.23,.16,true);
 for(const x of [-1.34,1.34])box(p,M.wood,x,2.91,0,.18,.23,3.00,true);
 const roof=tiledRoof(p,M,{width:3.9,run:1.92,ridge:3.84,eave:2.89,rafters:true});
 for(const z of [-1.23,1.23])for(const x of [-1.15,0,1.15])box(p,M.wood,x,.30,z,.10,.57,.19,true);
 for(const z of [-1.23,1.23])box(p,M.weatheredWood,0,.57,z,2.83,.10,.35,true);
 table(p,M,0,.06,.93,.75,.68);teaSet(p,M,0,.73,.03);chair(p,M,-.83,.20,-Math.PI/2,true);
 lantern(p,M,.40,2.40,.03,ctx,.87,true);
 const name=textMaterial('听泉',{w:512,h:192,bg:'#334135',fg:'#b8a57a',size:127});box(p,M.woodDark,0,2.76,1.33,1.14,.39,.09);mesh(p,new THREE.PlaneGeometry(1.05,.31),name,0,2.76,1.38);
 batchStatic(root);return root;
}
