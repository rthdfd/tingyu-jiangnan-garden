import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { canvasTexture, rand } from './core.js';

function noise(x,y){return (Math.sin(x*127.1+y*311.7)*43758.5453)%1;}
function grain(kind,gray=false){return canvasTexture(512,512,(c,w,h)=>{
  const im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const n=rand(-1,1), f=Math.sin(x*.31+Math.sin(y*.017)*1.4+Math.sin(x*.014+y*.004)*2.7);
    const v=kind==='wood'?f*12+Math.sin(x*1.31+Math.sin(y*.026))*6+n*5:Math.sin(x*.036)*Math.sin(y*.025)*8+n*16;
    const base=gray?[145,145,145]:kind==='wood'?[119,81,50]:kind==='plaster'?[217,217,199]:kind==='tile'?[81,89,88]:[135,138,122];
    const k=(y*w+x)*4;im.data[k]=base[0]+v;im.data[k+1]=base[1]+v;im.data[k+2]=base[2]+v;im.data[k+3]=255;
  }c.putImageData(im,0,0);
  if(kind==='wood'){
    c.strokeStyle=gray?'rgba(42,42,42,.4)':'rgba(48,31,18,.36)';c.lineWidth=.6;
    for(let i=0;i<90;i++){const x=rand(0,w),y=rand(-100,h);c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+rand(-3,3),y+60,x+rand(-4,4),y+110,x+rand(-2,2),y+rand(160,280));c.stroke();}
    for(let i=0;i<5;i++){const x=rand(0,w),y=rand(0,h);for(let r=2;r<18;r+=2){c.beginPath();c.ellipse(x,y,r*.32,r,rand(-.1,.1),0,Math.PI*2);c.stroke();}}
  }
},!gray);}
function paper(){return canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#ded2ae';c.fillRect(0,0,w,h);for(let i=0;i<3800;i++){c.strokeStyle=`rgba(124,112,81,${rand(.035,.12)})`;const x=rand(0,w),y=rand(0,h);c.beginPath();c.moveTo(x,y);c.lineTo(x+rand(-9,9),y+rand(1,18));c.stroke();}});}
function porcelainMap(){return canvasTexture(512,512,(c,w,h)=>{
  c.fillStyle='#ced6c7';c.fillRect(0,0,w,h);c.strokeStyle='rgba(103,123,106,.14)';c.lineWidth=.55;
  for(let i=0;i<110;i++){let x=rand(0,w),y=rand(0,h);c.beginPath();c.moveTo(x,y);for(let j=0;j<7;j++){x+=rand(-24,24);y+=rand(8,31);c.lineTo(x,y);}c.stroke();}
  c.strokeStyle='rgba(42,73,106,.79)';c.lineWidth=3;
  for(const y of [52,65,390,405]){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  for(let i=0;i<6;i++){const x=i*w/6+24;c.beginPath();c.moveTo(x,363);c.bezierCurveTo(x-42,278,x+39,220,x,119);c.stroke();for(let j=0;j<5;j++){const y=140+j*39,side=j%2?1:-1;c.save();c.translate(x+side*8,y);c.rotate(side*.62);c.fillStyle='rgba(40,69,97,.67)';c.beginPath();c.ellipse(0,0,14,5,0,0,6.28);c.fill();c.restore();}}
});}
function leafTex(){return canvasTexture(256,256,(c,w,h)=>{
  c.fillStyle='#c0cbb1';c.fillRect(0,0,w,h);const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(30,59,25,.33)');g.addColorStop(.45,'rgba(240,235,178,.20)');g.addColorStop(1,'rgba(41,72,27,.26)');c.fillStyle=g;c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(220,225,175,.48)';c.lineWidth=2;c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.stroke();
  for(let i=0;i<15;i++){const y=i*18;for(const side of [-1,1]){c.lineWidth=.75;c.beginPath();c.moveTo(w/2,y);c.quadraticCurveTo(w/2+side*38,y+20,w/2+side*100,y+39);c.stroke();}}
  for(let i=0;i<3500;i++){c.fillStyle=`rgba(42,77,28,${rand(.015,.10)})`;c.fillRect(rand(0,w),rand(0,h),1,1);}
});}
export const windUniform={value:0};
function leafMaterial(map,color=0xffffff){const m=new THREE.MeshStandardMaterial({map,color,roughness:.71,metalness:0,side:THREE.DoubleSide,emissive:0x21351b,emissiveIntensity:.09});m.onBeforeCompile=s=>{s.uniforms.uWind=windUniform;s.vertexShader='uniform float uWind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n #ifdef USE_INSTANCING\n vec3 wp=(modelMatrix*instanceMatrix*vec4(position,1.0)).xyz;\n transformed.x += sin(uWind*.67+wp.x*.6+wp.z*.43)*.023*uv.y;\n transformed.z += sin(uWind*.39+wp.y*.83)*.011*uv.y;\n #endif`);};return m;}

export async function createMaterials(renderer){
  const loader=new THREE.TextureLoader();const assets={};let manifest={materials:{}};
  try{manifest=await(await fetch('./assets/manifest.json')).json();}catch(e){console.warn('PBR manifest unavailable; authored materials remain usable.');}
  const load=async file=>{const t=await loader.loadAsync('./assets/'+file);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;};
  await Promise.all(Object.entries(manifest.materials||{}).map(async([name,data])=>{if(!data.maps)return;assets[name]={};await Promise.all(Object.entries(data.maps).map(async([channel,map])=>{try{const t=await load(map.file);if(channel==='diff')t.colorSpace=THREE.SRGBColorSpace;assets[name][channel]=t;}catch(e){console.warn(`Optional texture unavailable: ${name}/${channel}`);}}));}));
  const woodMap=grain('wood'),woodBump=grain('wood',true),stoneMap=grain('stone'),tileMap=grain('tile'),tileBump=grain('tile',true),plasterMap=grain('plaster');
  function pbr(name,color,roughness=.7,repeat=1,extra={}){
    const a=assets[name]||{};const fallback={wood:woodMap,stone:stoneMap,plaster:plasterMap,paving:stoneMap,earth:stoneMap,bark:woodMap}[name]||stoneMap;
    const map=(a.diff||fallback).clone();map.needsUpdate=true;map.repeat.set(repeat,repeat);
    const opts={color,map,roughness,metalness:0,...extra};
    if(a.nor_gl){opts.normalMap=a.nor_gl.clone();opts.normalMap.needsUpdate=true;opts.normalMap.repeat.copy(map.repeat);opts.normalScale=new THREE.Vector2(.65,.65);}
    if(a.rough){opts.roughnessMap=a.rough.clone();opts.roughnessMap.needsUpdate=true;opts.roughnessMap.repeat.copy(map.repeat);}
    return new THREE.MeshPhysicalMaterial(opts);
  }
  const M={};
  function boardCrop(texture){if(!texture)return null;const im=texture.image;return canvasTexture(256,1024,(c,w,h)=>c.drawImage(im,im.width*.39,0,im.width*.12,im.height,0,0,w,h),texture.colorSpace===THREE.SRGBColorSpace);}
  const realBoard=boardCrop(assets.wood?.diff),realBoardNormal=boardCrop(assets.wood?.nor_gl),realBoardRough=boardCrop(assets.wood?.rough);
  M.wood=new THREE.MeshStandardMaterial({color:0x785138,map:realBoard||woodMap,bumpMap:woodBump,bumpScale:.008,roughness:.66});
  if(realBoardNormal){M.wood.normalMap=realBoardNormal;M.wood.normalScale=new THREE.Vector2(.35,.35);}
  if(realBoardRough)M.wood.roughnessMap=realBoardRough;
  M.woodLight=M.wood.clone();M.woodLight.color.set(0x9b7650);M.woodLight.roughness=.62;
  M.woodDark=M.wood.clone();M.woodDark.color.set(0x44312a);M.woodDark.roughness=.47;
  M.furniture=M.wood.clone();M.furniture.color.set(0x60402b);M.furniture.roughness=.44;
  M.furnitureEdge=M.furniture.clone();M.furnitureEdge.color.set(0x815834);
  M.weatheredWood=pbr('wood',0x918574,.49,1,{clearcoat:.21,clearcoatRoughness:.32});
  M.plaster=pbr('plaster',0xe1e0cd,.87,2);
  M.plasterDark=pbr('plaster',0x748070,.98,1);
  M.plasterInterior=pbr('plaster',0xe5dcc5,.88,1);
  M.stone=pbr('stone',0x99a39a,.81,1);
  M.stoneWet=pbr('stone',0x7b8981,.49,1,{clearcoat:.38,clearcoatRoughness:.21});
  M.earth=pbr('earth',0x62774e,.93,6);
  M.soil=new THREE.MeshStandardMaterial({color:0x514b3d,map:stoneMap,roughness:1});
  M.paving=pbr('paving',0xa4ada2,.53,1,{clearcoat:.36,clearcoatRoughness:.19});
  M.floor=pbr('paving',0xd5d7c8,.73,.7);
  M.bark=pbr('bark',0x6b6250,.96,1);
  M.tile=new THREE.MeshPhysicalMaterial({color:0x687875,map:tileMap,bumpMap:tileBump,bumpScale:.012,roughness:.47,clearcoat:.35,clearcoatRoughness:.3});
  M.tileDark=M.tile.clone();M.tileDark.color.set(0x465855);
  M.tileLight=M.tile.clone();M.tileLight.color.set(0x81908a);
  M.moss=new THREE.MeshStandardMaterial({color:0x5b713e,map:stoneMap,roughness:.98});
  M.darkMoss=M.moss.clone();M.darkMoss.color.set(0x334831);
  M.gravel=new THREE.MeshStandardMaterial({color:0x9b9e87,map:stoneMap,roughness:.91});
  M.brick=pbr('paving',0x697571,.77,1);
  M.paper=new THREE.MeshPhysicalMaterial({map:paper(),color:0xf1d59c,roughness:.88,side:THREE.DoubleSide,emissive:0xffb959,emissiveIntensity:.26});
  M.silk=new THREE.MeshStandardMaterial({map:paper(),color:0xb7b99b,roughness:.92,side:THREE.DoubleSide,transparent:true,opacity:.86});
  M.bedding=new THREE.MeshStandardMaterial({map:paper(),color:0x8f9990,roughness:.93});
  M.linen=new THREE.MeshStandardMaterial({map:paper(),color:0xd1c9ad,roughness:.96});
  M.brass=new THREE.MeshStandardMaterial({color:0x716344,metalness:.73,roughness:.44});
  M.bronze=new THREE.MeshStandardMaterial({color:0x596e57,metalness:.7,roughness:.49});
  M.celadon=new THREE.MeshPhysicalMaterial({color:0x769e8b,roughness:.21,clearcoat:.8,clearcoatRoughness:.15,metalness:0});
  M.blueWhite=new THREE.MeshPhysicalMaterial({map:porcelainMap(),color:0xe3e5d5,roughness:.23,clearcoat:.8,clearcoatRoughness:.19});
  M.clay=new THREE.MeshStandardMaterial({color:0x784b34,roughness:.73});
  M.ink=new THREE.MeshStandardMaterial({color:0x252b29,roughness:.61});
  M.wax=new THREE.MeshStandardMaterial({color:0xc5a773,roughness:.64});
  M.flame=new THREE.MeshBasicMaterial({color:0xffdfa3,toneMapped:false});
  M.leaf=leafMaterial(leafTex());M.willow=leafMaterial(leafTex(),0xb5c6a8);
  M.bamboo=new THREE.MeshStandardMaterial({color:0x5c7541,map:woodMap,roughness:.64});
  M.bambooNode=new THREE.MeshStandardMaterial({color:0x8d9b63,roughness:.78});
  M.whiteFlower=new THREE.MeshStandardMaterial({color:0xd9dfc7,roughness:.8,side:THREE.DoubleSide});
  M.purpleFlower=M.whiteFlower.clone();M.purpleFlower.color.set(0x727b9d);
  M.lotus=new THREE.MeshStandardMaterial({color:0x5a7845,roughness:.56,side:THREE.DoubleSide,map:leafTex()});
  M.bookBlue=new THREE.MeshStandardMaterial({color:0x3f565c,map:paper(),roughness:.91});
  M.bookBrown=M.bookBlue.clone();M.bookBrown.color.set(0x8d7954);
  M.pages=new THREE.MeshStandardMaterial({color:0xc6bf9e,map:paper(),roughness:.94});
  const pmrem=new THREE.PMREMGenerator(renderer);let environment;
  if(manifest.environment){try{const hdr=await new RGBELoader().loadAsync('./assets/'+manifest.environment.file);environment=pmrem.fromEquirectangular(hdr).texture;hdr.dispose();}catch(e){console.warn('HDRI fallback to a neutral irradiance room.');}}
  if(!environment){const env=new RoomEnvironment();environment=pmrem.fromScene(env,.04).texture;env.dispose();}pmrem.dispose();
  return {M,environment,manifest,photoSets:Object.keys(assets)};
}

export function textMaterial(text,{w=768,h=256,bg='#283e38',fg='#c5b38a',size=128,vertical=false}={}){
  const map=canvasTexture(w,h,(c,W,H)=>{c.fillStyle=bg;c.fillRect(0,0,W,H);c.strokeStyle='rgba(181,154,108,.45)';c.lineWidth=4;c.strokeRect(14,14,W-28,H-28);c.fillStyle=fg;c.font=`500 ${size}px "Noto Serif SC","Noto Serif CJK SC",serif`;c.textAlign='center';c.textBaseline='middle';if(vertical){[...text].forEach((v,i)=>c.fillText(v,W/2,(i+.65)*H/text.length));}else c.fillText(text,W/2,H*.52);});
  return new THREE.MeshStandardMaterial({map,roughness:.84});
}
export function paintingMaterial(kind='landscape'){
  const map=canvasTexture(768,1280,(c,w,h)=>{
    c.fillStyle='#c3c1a1';c.fillRect(0,0,w,h);for(let i=0;i<50000;i++){c.fillStyle=`rgba(90,78,49,${rand(0,.035)})`;c.fillRect(rand(0,w),rand(0,h),1,2);}
    if(kind==='bamboo'){
      for(let k=0;k<5;k++){let x=rand(180,540);const y0=rand(720,1200);c.strokeStyle='rgba(45,63,45,.68)';c.lineWidth=rand(5,11);c.beginPath();c.moveTo(x,y0);c.quadraticCurveTo(x-65,y0-340,x+70,110);c.stroke();for(let y=200;y<y0;y+=rand(60,110)){const xx=x+Math.sin(y*.003)*40;c.lineWidth=2;c.beginPath();c.moveTo(xx-10,y);c.lineTo(xx+13,y+5);c.stroke();for(let j=0;j<7;j++){const a=rand(-3.1,-.1),len=rand(30,85);c.save();c.translate(xx+rand(-40,40),y+rand(-35,20));c.rotate(a);c.fillStyle=`rgba(32,58,41,${rand(.4,.8)})`;c.beginPath();c.ellipse(len/2,0,len/2,rand(3,7),0,0,6.28);c.fill();c.restore();}}}
    }else{
      for(let layer=0;layer<6;layer++){const base=340+layer*128;c.fillStyle=`rgba(63,80,70,${.08+layer*.035})`;c.beginPath();c.moveTo(0,base+170);for(let x=0;x<=w;x+=12){const y=base-Math.pow(Math.max(0,Math.sin(x*.004+layer*1.8)),2)*220+Math.sin(x*.028+layer)*19;c.lineTo(x,y);}c.lineTo(w,base+210);c.lineTo(0,base+210);c.fill();}
      for(let k=0;k<11;k++){const x=rand(90,690),y=rand(750,1090),hh=rand(40,180);c.strokeStyle='rgba(34,53,40,.59)';c.lineWidth=rand(2,5);c.beginPath();c.moveTo(x,y);c.lineTo(x+8,y-hh);c.stroke();for(let j=0;j<11;j++){const yy=y-hh+j*hh/14;c.beginPath();c.moveTo(x-((j+1)*3),yy+8);c.lineTo(x+6,yy);c.lineTo(x+(j+1)*4,yy+10);c.stroke();}}
      c.strokeStyle='rgba(33,52,41,.5)';c.lineWidth=3;c.beginPath();c.moveTo(140,1010);c.lineTo(280,995);c.lineTo(310,984);c.stroke();
    }
    c.fillStyle='rgba(32,45,35,.67)';c.font='29px "Noto Serif SC","Noto Serif CJK SC",serif';const words=kind==='bamboo'?'竹影清风':'溪山雨霁';[...words].forEach((v,i)=>c.fillText(v,w-95,100+i*41));c.fillStyle='#96513e';c.fillRect(w-98,315,29,33);c.fillStyle='#c7b99a';c.font='20px serif';c.fillText('印',w-95,339);
  });return new THREE.MeshStandardMaterial({map,roughness:.96});
}
