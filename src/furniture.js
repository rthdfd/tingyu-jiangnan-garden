import * as THREE from 'three';
import {V,rand,choose,group,mesh,box,cylinder,beam,tube,torus,lathe,canvasTexture,collider} from './core.js';
import {textMaterial,paintingMaterial} from './materials.js';

export function table(parent,M,x,z,w=1.3,d=1.3,h=.82,style='square',ry=0){
 const g=group(parent,x,0,z,ry);
 box(g,M.furniture,0,h,0,w,.075,d,true);
 box(g,M.furnitureEdge,0,h+.038,0,w-.085,.008,d-.085,true);
 for(const xx of [-w/2+.095,w/2-.095])for(const zz of [-d/2+.095,d/2-.095]){
  const leg=box(g,M.furniture,xx,h/2-.01,zz,.075,h-.075,.075,true);leg.rotation.z=-Math.sign(xx)*.025;
  box(g,M.furnitureEdge,xx,.065,zz,.085,.055,.085,true);
 }
 for(const z0 of [-d/2+.06,d/2-.06]){
  box(g,M.furniture,0,h-.105,z0,w-.1,.145,.044,true);
  box(g,M.furnitureEdge,0,h-.184,z0,w-.19,.014,.025,true);
  box(g,M.furniture,0,.23,z0,w-.18,.036,.04,true);
  for(const s of [-1,1]){const pts=[[s*(w/2-.13),h-.11,z0],[s*(w/2-.27),h-.28,z0],[s*(w/2-.48),h-.18,z0]];tube(g,M.furniture,pts,.025,10,6);}
 }
 for(const x0 of [-w/2+.065,w/2-.065]){box(g,M.furniture,x0,h-.1,0,.04,.14,d-.12,true);box(g,M.furniture,x0,.31,0,.04,.035,d-.18,true);}
 if(style==='desk'){
  for(const side of [-1,1]){box(g,M.furniture,side*w*.25,h-.11,0,w*.42,.16,d-.12,true);const handle=torus(g,M.brass,side*w*.25,h-.12,d*.505,.035,.006,Math.PI);handle.rotation.z=Math.PI;}
 }
 return g;
}
export function chair(parent,M,x,z,ry=0,round=false){
 const g=group(parent,x,0,z,ry);const w=.63,d=.55;
 box(g,M.furniture,0,.51,0,w,.065,d,true);box(g,M.linen,0,.55,0,w-.10,.018,d-.11,true);
 for(const xx of [-.255,.255])for(const zz of [-.205,.205]){
  beam(g,M.furniture,[xx*1.13,.035,zz*1.12],[xx,.48,zz],.047,.047,true);
 }
 for(const xx of [-.265,.265])beam(g,M.furniture,[xx,.20,-.22],[xx,.20,.22],.019,.019,true);
 for(const zz of [-.22,.22])beam(g,M.furniture,[-.28,.24,zz],[.28,.24,zz],.019,.019,true);
 for(const xx of [-.26,.26]){
  tube(g,M.furniture,[[xx,.50,-.22],[xx,.78,-.245],[xx*1.07,1.12,-.28]],.027,12,8);
  tube(g,M.furniture,[[xx,.70,.22],[xx*1.12,.79,.13],[xx*1.13,.86,-.08],[xx,.87,-.24]],.024,14,8);
  beam(g,M.furniture,[xx,.53,.19],[xx,.73,.19],.018,.018,true);
 }
 const top=round?[[-.29,.87,.17],[-.36,1.04,-.12],[-.25,1.13,-.29],[0,1.17,-.33],[.25,1.13,-.29],[.36,1.04,-.12],[.29,.87,.17]]:[[-.38,1.12,-.265],[-.29,1.165,-.29],[0,1.145,-.3],[.29,1.165,-.29],[.38,1.12,-.265]];
 tube(g,M.furnitureEdge,top,.027,28,8);
 const splat=new THREE.PlaneGeometry(.17,.56,3,12);const p=splat.attributes.position;
 for(let i=0;i<p.count;i++){p.setZ(i,-.245+Math.sin((p.getY(i)+.28)/.56*Math.PI)*.06);}
 splat.computeVertexNormals();const s=mesh(g,splat,M.furniture,0,.83,0);s.material=M.furniture.clone();s.material.side=THREE.DoubleSide;
 const med=torus(g,M.furnitureEdge,0,.96,-.205,.052,.009);med.scale.set(.77,1,1);
 return g;
}
export function vase(parent,M,x,y,z,kind='celadon',scale=1){
 const mat=kind==='blue'?M.blueWhite:kind==='clay'?M.clay:M.celadon;
 const profile=[[.01,0],[.095,0],[.12,.028],[.145,.15],[.15,.23],[.105,.31],[.052,.37],[.047,.51],[.073,.53],[.075,.55],[.050,.56],[.045,.53]];
 const g=group(parent,x,y,z);g.scale.setScalar(scale);lathe(g,mat,profile);torus(g,mat,0,.54,0,.063,.010).rotation.x=Math.PI/2;return g;
}
export function bowl(parent,M,x,y,z,r=.09,mat=M.celadon){
 const profile=[[0,.025],[r*.35,.013],[r*.45,0],[r*.51,.012],[r*.7,.043],[r,.09],[r,.101],[r*.94,.096],[r*.6,.039],[0,.031]];
 return lathe(parent,mat,profile,x,y,z,24);
}
export function teaSet(parent,M,x,y,z){
 const g=group(parent,x,y,z);box(g,M.furnitureEdge,0,.016,0,.57,.035,.36,true);
 for(const xx of [-.275,.275])box(g,M.furniture,xx,.038,0,.015,.035,.35,true);
 for(const zz of [-.17,.17])box(g,M.furniture,0,.038,zz,.55,.035,.015,true);
 lathe(g,M.clay,[[.025,0],[.075,.02],[.097,.08],[.075,.13],[.055,.145],[.04,.153]],-.09,.035,0,28);
 lathe(g,M.clay,[[.055,0],[.058,.015],[.02,.035],[0,.038]],-.09,.183,0,28);
 tube(g,M.clay,[[-.165,.105,0],[-.225,.13,0],[-.236,.19,0],[-.218,.225,0]],.018,12,8);
 const t=torus(g,M.clay,.002,.13,0,.059,.012,Math.PI*1.7);t.rotation.y=Math.PI/2;t.rotation.z=.3;
 for(const p of [[.115,.09],[.125,-.09],[-.025,.11]])bowl(g,M,.0+p[0],.04,p[1],.041,M.celadon);
 return g;
}
export function candle(parent,M,x,y,z,ctx=null){
 const g=group(parent,x,y,z);lathe(g,M.brass,[[.09,0],[.105,.02],[.075,.045],[.024,.065],[.017,.20],[.075,.23],[.083,.25],[.04,.26]],0,0,0,24);
 cylinder(g,M.wax,0,.34,0,.023,.025,.17,12);
 const f=lathe(g,M.flame,[[0,0],[.016,.015],[.013,.033],[.003,.075],[0,.079]],0,.425,0,12);f.userData.noBatch=true;
 if(ctx)ctx.flames.push(f);return g;
}
export function incense(parent,M,x,y,z){
 const g=group(parent,x,y,z);lathe(g,M.bronze,[[.07,.03],[.12,.08],[.135,.17],[.12,.20],[.15,.215],[.15,.235],[.11,.244],[.09,.22]],0,0,0,28);
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam(g,M.bronze,[Math.sin(a)*.085,.075,Math.cos(a)*.085],[Math.sin(a)*.10,0,Math.cos(a)*.1],.016,.016,true);}
 for(const s of [-1,1]){const t=torus(g,M.bronze,s*.152,.179,0,.042,.012,Math.PI*1.7);t.rotation.y=Math.PI/2;}
 for(let i=0;i<3;i++){const st=cylinder(g,M.woodLight,(i-1)*.025,.335,0,.002,.002,.20,5);st.rotation.z=(i-1)*.04;}
 const smokeMat=new THREE.MeshBasicMaterial({color:0xc8c9b9,transparent:true,opacity:.10,depthWrite:false});
 const pts=[];for(let i=0;i<18;i++)pts.push([Math.sin(i*.5)*.015,.44+i*.024,Math.cos(i*.33)*.013]);const sm=tube(g,smokeMat,pts,.006,28,4);sm.castShadow=false;
 return g;
}
export function scroll(parent,M,x,y,z,w=.9,h=1.65,kind='landscape',ry=0){
 const g=group(parent,x,y,z,ry);box(g,M.linen,0,0,0,w+.17,h+.27,.015);
 mesh(g,new THREE.PlaneGeometry(w,h),paintingMaterial(kind),0,0,.01);
 for(const yy of [-h/2-.15,h/2+.15]){const rail=cylinder(g,M.woodDark,0,yy,.014,.023,.023,w+.32,12);rail.rotation.z=Math.PI/2;}
 tube(g,M.linen,[[-w*.36,h*.57,0],[0,h*.69,0],[w*.36,h*.57,0]],.004,12,4);
 return g;
}
const bookLabels=new Map();
export function book(parent,M,x,y,z,w=.30,d=.22,h=.065,ry=0,title='山水记'){
 const g=group(parent,x,y,z,ry),cover=choose([M.bookBlue,M.bookBlue,M.bookBrown]);
 box(g,M.pages,0,h*.5,0,w-.017,h-.016,d-.012);
 for(const yy of [.006,h-.006])box(g,cover,0,yy,0,w,.013,d,true);
 box(g,cover,-w/2+.008,h/2,0,.018,h,d,true);
 for(let i=0;i<4;i++){const zz=-d*.34+i*d*.22;const t=torus(g,M.linen,-w*.43,h/2,zz,.016,.0025);t.rotation.x=Math.PI/2;t.scale.set(.5,1,1);}
 for(let i=0;i<5;i++)box(g,M.linen,0,.017+i*(h-.031)/5,d/2-.004,w-.031,.001,.001);
 if(!bookLabels.has(title))bookLabels.set(title,textMaterial(title,{w:128,h:384,bg:'#c8c3a7',fg:'#303e38',size:45,vertical:true}));
 const label=mesh(g,new THREE.PlaneGeometry(w*.15,d*.70),bookLabels.get(title),w*.25,h+.001,0);label.rotation.x=-Math.PI/2;
 return g;
}
export function shelf(parent,M,x,z,w=2.9,h=2.55){
 const g=group(parent,x,0,z);const depth=.39;
 box(g,M.woodDark,0,h/2,-depth/2,w,h,.035);
 for(const xx of [-w/2,0,w/2])box(g,M.furniture,xx,h/2,0,.055,h,depth,true);
 for(const yy of [.13,.70,1.28,1.88,2.5])box(g,M.furniture,0,yy,0,w,.055,depth+.04,true);
 for(let row=0;row<4;row++)for(let cell=0;cell<2;cell++){
  const bx=(cell-.5)*w*.5,by=[.16,.73,1.31,1.91][row];
  for(let j=0;j<3;j++){
   const xx=bx+(j-1)*.34;
   if((row===2&&cell===1&&j===1)||(row===3&&cell===0&&j===0))continue;
   const count=Math.floor(rand(2,5));for(let k=0;k<count;k++)book(g,M,xx+rand(-.015,.015),by+k*.073,rand(-.015,.015),.30,.27,.063,rand(-.035,.035),choose(['营造法式','茶经','山水记','梦溪笔谈','长物志']));
  }
 }
 vase(g,M,w*.23,1.31,0,'celadon',.64);bowl(g,M,-w*.35,1.92,0,.11);
 return g;
}
export function scholarObjects(parent,M,ctx){
 // Desk surface is 0.90 m above the room floor; each object has real thickness.
 const g=group(parent,-4.05,0,-.95);
 box(g,M.linen,-.23,.907,.04,.80,.005,.42);
 const calligraphy=canvasTexture(512,256,(c,w,h)=>{c.fillStyle='#d2c9a9';c.fillRect(0,0,w,h);c.fillStyle='#344035';c.font='25px "Noto Serif SC","Noto Serif CJK SC",serif';const rows=['疏影横斜水清浅','暗香浮动月黄昏'];rows.forEach((r,j)=>[...r].forEach((v,i)=>c.fillText(v,w-70-j*55,28+i*29)));c.fillStyle='#954d3b';c.fillRect(125,185,20,24);});
 const paper=mesh(g,new THREE.PlaneGeometry(.73,.38),new THREE.MeshStandardMaterial({map:calligraphy,roughness:.96}),-.24,.913,.04);paper.rotation.x=-Math.PI/2;
 for(const xx of [-.65,.18]){const rod=cylinder(g,M.woodDark,xx,.925,.04,.015,.015,.47,8);rod.rotation.x=Math.PI/2;}
 box(g,M.ink,.48,.924,.06,.21,.031,.15,true);box(g,M.ink,.48,.941,.04,.12,.011,.08,true);
 lathe(g,M.bamboo,[[.06,0],[.065,.01],[.061,.20],[.063,.22],[.05,.221],[.048,.03]],.75,.908,-.18,24);
 for(let j=0;j<5;j++){const stick=cylinder(g,M.woodLight,.75+rand(-.025,.025),1.13+rand(-.02,.04),-.18+rand(-.025,.025),.006,.005,.34,7);stick.rotation.z=rand(-.15,.15);}
 beam(g,M.woodDark,[.21,.946,.17],[.63,.955,.23],.005,.005,true);
 lathe(g,M.celadon,[[0,0],[.055,.006],[.066,.04],[.035,.075],[.014,.08]],.45,.908,-.23,24);
 book(g,M,-.78,.91,-.20,.32,.24,.07,.04,'长物志');book(g,M,-.76,.987,-.19,.32,.24,.07,-.035,'茶经');
 candle(g,M,.91,.908,.19,ctx);
 return g;
}
export function qin(parent,M,x,z,ry=0){
 const g=table(parent,M,x,z,1.75,.42,.66,'qin',ry);
 const outline=[[-.75,-.13],[-.47,-.14],[-.43,-.09],[-.37,-.09],[-.32,-.13],[.46,-.12],[.51,-.085],[.57,-.085],[.64,-.12],[.77,-.09],[.80,.08],[.59,.12],[-.47,.13],[-.75,.09]];
 const s=new THREE.Shape();s.moveTo(outline[0][0],outline[0][1]);outline.slice(1).forEach(p=>s.lineTo(...p));s.closePath();
 const geom=new THREE.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:2,steps:1});geom.rotateX(-Math.PI/2);mesh(g,geom,M.woodDark,0,.71,0);
 for(let i=0;i<7;i++)beam(g,M.linen,[-.66,.771,-.054+i*.015],[.68,.771,-.054+i*.015],.0009,.0009,true);
 for(let i=0;i<13;i++)cylinder(g,M.pages,-.56+i*.09,.77,.087,.005,.005,.004,7);
 return g;
}
export function canopyBed(parent,M,x,z){
 const g=group(parent,x,0,z),w=2.15,d=2.6;
 box(g,M.furniture,0,.49,0,w,.16,d,true);
 for(const xx of [-w/2+.07,w/2-.07])for(const zz of [-d/2+.07,d/2-.07]){
  box(g,M.furniture,xx,1.33,zz,.082,2.58,.082,true);box(g,M.furnitureEdge,xx,2.64,zz,.10,.07,.10,true);
  const cloth=new THREE.PlaneGeometry(.54,2.0,14,24);const pp=cloth.attributes.position;
  for(let i=0;i<pp.count;i++){let yy=pp.getY(i),xx0=pp.getX(i);const tie=.30+.70*Math.pow(Math.abs(yy+.32)/1.32,.65);pp.setX(i,xx0*tie);pp.setZ(i,Math.sin(xx0*70)*.035+Math.sin(yy*2.6)*.045);}
  cloth.computeVertexNormals();const curtain=mesh(g,cloth,M.silk,xx,1.56,zz+.05);curtain.rotation.y=Math.sign(xx)*.15;curtain.castShadow=true;
  const tie=torus(g,M.furnitureEdge,xx,1.18,zz+.05,.073,.006);tie.rotation.y=Math.PI/2;tie.scale.y=.45;
 }
 for(const xx of [-w/2+.07,w/2-.07]){box(g,M.furniture,xx,2.50,0,.10,.18,d,true);box(g,M.furniture,xx,.83,-.15,.06,.06,d-.30);}
 for(const zz of [-d/2+.07,d/2-.07]){box(g,M.furniture,0,2.50,zz,w,.18,.09,true);box(g,M.furnitureEdge,0,2.38,zz,w-.12,.015,.08);}
 for(let i=0;i<15;i++)box(g,M.furniture,-.93+i*.132,2.52,-d/2+.01,.018,.105,.024);
 box(g,M.furniture,0,.9,-1.22,w-.2,.68,.056,true);
 box(g,M.bedding,0,.627,0,w-.19,.19,d-.18,true);
 const quilt=new THREE.PlaneGeometry(w-.20,1.48,28,28);const pos=quilt.attributes.position;
 for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getX(i)*17)*.007+Math.sin(pos.getY(i)*10+pos.getX(i)*5)*.012);
 quilt.computeVertexNormals();const q=mesh(g,quilt,M.linen,0,.735,.36);q.rotation.x=-Math.PI/2;
 box(g,M.bedding,0,.80,-.82,1.15,.19,.36,true);
 return g;
}
export function foldingScreen(parent,M,x,z,panels=3,ry=0){
 const g=group(parent,x,0,z,ry);
 for(let i=0;i<panels;i++){const p=group(g,(i-(panels-1)/2)*.56,0,(i%2)*.10,(i%2?.18:-.18));
  for(const xx of [-.29,.29])box(p,M.furniture,xx,.93,0,.041,1.86,.055,true);
  for(const yy of [.20,1.72])box(p,M.furniture,0,yy,0,.58,.045,.055);
  box(p,M.wood,0,.37,0,.54,.30,.025);
  box(p,M.linen,0,1.02,0,.53,1.28,.018);
  const art=mesh(p,new THREE.PlaneGeometry(.47,1.16),paintingMaterial('bamboo'),0,1.06,.012);
 }
 return g;
}
export function lantern(parent,M,x,y,z,ctx,scale=1,light=false){
 const g=group(parent,x,y,z);g.scale.setScalar(scale);
 beam(g,M.woodDark,[0,.53,0],[0,.87,0],.009,.009,true);
 const profile=[[.22,.29],[.28,.34],[.29,.37],[.22,.39]];lathe(g,M.woodDark,profile,0,0,0,4).rotation.y=Math.PI/4;
 box(g,M.paper,0,0,0,.40,.56,.40);
 for(const xx of [-.213,.213])for(const zz of [-.213,.213])box(g,M.woodDark,xx,0,zz,.028,.66,.028,true);
 for(const yy of [-.30,.30]){for(const zz of [-.214,.214])box(g,M.woodDark,0,yy,zz,.455,.032,.026);for(const xx of [-.214,.214])box(g,M.woodDark,xx,yy,0,.026,.032,.455);}
 for(const zz of [-.218,.218]){box(g,M.woodDark,0,0,zz,.014,.57,.014);box(g,M.woodDark,0,-.18,zz,.43,.012,.014);}
 lathe(g,M.woodDark,[[.24,0],[.26,.035],[.22,.063]],0,-.36,0,4).rotation.y=Math.PI/4;
 cylinder(g,M.furnitureEdge,0,-.46,0,.011,.023,.17,7);
 if(light){const l=new THREE.PointLight(0xffc179,0,8.5,2);l.position.set(x,y-.16,z+.06);parent.add(l);ctx.lamps.push({light:l,day:2.5,night:26*scale});}
 return g;
}
export function furnishHouse(house,M,ctx){
 // Everything is attached to the same structural building group, not a separate room shell.
 table(house,M,0,-2.43,3.1,.58,1.10,'altar');
 vase(house,M,-1.13,1.15,-2.45,'blue',.9);vase(house,M,1.15,1.15,-2.46,'celadon',.74);
 scroll(house,M,0,2.29,-2.91,.98,1.54);
 for(const s of [-1,1]){const couplet=textMaterial(s<0?'半窗晴翠千峰月':'一榻松风万壑泉',{w:144,h:1024,bg:'#4b4130',fg:'#baac7d',size:96,vertical:true});mesh(house,new THREE.PlaneGeometry(.22,1.76),couplet,s*.91,2.24,-2.88);}
 table(house,M,0,-.54,1.24,1.2,.80);teaSet(house,M,-.12,.85,-.55);
 chair(house,M,-1.07,-.56,-Math.PI/2,true);chair(house,M,1.08,-.56,Math.PI/2,false);
 table(house,M,1.54,1.91,.42,.43,.86);incense(house,M,1.54,.91,1.91);
 table(house,M,-1.52,-2.10,.34,.36,.77);candle(house,M,-1.52,.82,-2.10,ctx);
 shelf(house,M,-4.04,-2.66,2.85,2.56);
 table(house,M,-4.05,-.95,2.25,.88,.866,'desk');scholarObjects(house,M,ctx);
 chair(house,M,-4.05,-1.73,Math.PI,false);
 qin(house,M,-5.50,.93,Math.PI/2);
 table(house,M,-2.55,-2.38,.40,.42,1.09);const flowervase=vase(house,M,-2.55,1.14,-2.38,'celadon',.70);
 for(let i=0;i<4;i++){const end=[rand(-.35,.35),rand(.75,1.2),rand(-.14,.14)];tube(flowervase,M.bark,[[0,.3,0],[end[0]*.4,.65,end[2]],end],.010,12,6);for(let j=0;j<5;j++){const a=j/5*6.28;const p=mesh(flowervase,new THREE.SphereGeometry(.037,8,6),M.whiteFlower,end[0]+Math.sin(a)*.045,end[1],end[2]+Math.cos(a)*.045);p.scale.y=.3;}}
 scroll(house,M,-5.965,2.18,-.35,.72,1.24,'bamboo',Math.PI/2);
 canopyBed(house,M,4.14,-1.24);
 foldingScreen(house,M,4.74,1.04,3,.08);
 table(house,M,2.67,-1.97,.46,.49,.69);candle(house,M,2.67,.74,-1.97,ctx);bowl(house,M,2.70,.74,-1.83,.073);
 const chest=group(house,5.49,0,1.92);box(chest,M.furniture,0,.34,0,.88,.63,.49,true);box(chest,M.furnitureEdge,0,.67,0,.92,.064,.54,true);box(chest,M.brass,0,.43,.258,.075,.10,.008,true);
 const rack=group(house,2.63,0,1.55);for(const s of [-1,1]){cylinder(rack,M.wood,0,.82,s*.39,.025,.027,1.62);box(rack,M.wood,0,.055,s*.39,.42,.06,.14,true);}beam(rack,M.wood,[0,1.56,-.51],[0,1.56,.51],.028,.028,true);
 const robe=mesh(rack,new THREE.PlaneGeometry(.64,1.13,8,18),M.bedding,.01,.95,.0);robe.rotation.y=Math.PI/2;
 for(const x of [-4.08,0,4.08])lantern(house,M,x,2.93,.15,ctx,.90,true);
 const soft=new THREE.PointLight(0xffd3a0,8,13,2);soft.position.set(0,2.25,2.3);house.add(soft);ctx.lamps.push({light:soft,day:6,night:18});
 for(const [x,z,w,d] of [[0,-.54,1.33,1.32],[-1.07,-.56,.68,.66],[1.08,-.56,.68,.66],[-4.05,-.95,2.37,.98],[-4.05,-1.73,.72,.69],[4.14,-1.24,2.30,2.75],[-4.04,-2.66,2.98,.48],[0,-2.43,3.24,.71],[2.63,1.55,.50,1.14],[4.74,1.04,1.73,.44],[-5.50,.93,.48,1.84]])collider(ctx.colliders,house,x,z,w,d);
}
