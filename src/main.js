import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {V,clamp,lerp} from './core.js';
import {createMaterials,windUniform} from './materials.js';
import {createHouse,gardenWalls,pavilionAndCorridor} from './architecture.js';
import {createLandscape,updateWeather,isInPond} from './landscape.js';
import {createBotany} from './botany.js';

const captureMode=new URLSearchParams(location.search).has('capture');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ctx={lamps:[],flames:[],colliders:[],mists:[],ripples:[],leafCount:0};
const scene=new THREE.Scene();scene.background=new THREE.Color(0xc1cdc8);scene.fog=new THREE.FogExp2(0xc1cdc8,.014);
const camera=new THREE.PerspectiveCamera(37.5,innerWidth/innerHeight,.07,160);camera.position.set(23,18.5,28.5);
const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:captureMode});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(captureMode?1:Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.info.autoReset=false;
document.querySelector('#canvas-wrap').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.3,0);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=2.1;controls.maxDistance=62;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.15;controls.enablePan=true;controls.screenSpacePanning=false;controls.update();
const floor=new THREE.Mesh(new THREE.PlaneGeometry(500,500),new THREE.MeshStandardMaterial({color:0xb3c1b9,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.75;floor.receiveShadow=true;scene.add(floor);
const hemi=new THREE.HemisphereLight(0xc3d6d2,0x687653,1.58);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffebc8,2.35);sun.position.set(-9,19,12);sun.target.position.set(-1,0,-2);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(captureMode?1024:2048,captureMode?1024:2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:19,bottom:-19,near:1,far:60});sun.shadow.normalBias=.028;sun.shadow.bias=-.00022;sun.shadow.radius=3.4;
const fill=new THREE.DirectionalLight(0xd8e7d4,.46);fill.position.set(9,10,-13);scene.add(fill);
const world=new THREE.Group();scene.add(world);

const target=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:0});
const composer=new EffectComposer(renderer,target);const basePass=new RenderPass(scene,camera);composer.addPass(basePass);
const ao=new SSAOPass(scene,camera,innerWidth,innerHeight,16);ao.kernelRadius=.62;ao.minDistance=.001;ao.maxDistance=.075;composer.addPass(ao);
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.15,.52,1.18);composer.addPass(bloom);
const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uNight:{value:0},uAspect:{value:innerWidth/innerHeight}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`uniform sampler2D tDiffuse;uniform float uNight;uniform float uAspect;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,.94);vec2 p=(vUv-.5)*vec2(1.05,.88);float vig=smoothstep(.12,.59,dot(p,p));c*=1.-.13*vig;float grain=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.0035;c+=grain;gl_FragColor=vec4(max(c,0.),1.);}`});composer.addPass(grade);composer.addPass(new OutputPass());

const PRESETS={
 overview:{pos:[23,18.5,28.5],target:[-.25,1.50,-.30],fov:37.5,time:.12,chapter:'壹',title:'雨霁 · 游园',desc:'粉墙黛瓦 / 曲水回廊'},
 bluehour:{pos:[18.8,11.3,22.9],target:[-.30,2.15,-1.35],fov:42,time:.64,chapter:'贰',title:'薄暮 · 听雨',desc:'檐滴入池 / 灯影初上'},
 night:{pos:[21.3,16.5,27.7],target:[-.20,1.8,-.25],fov:39.0,time:1,chapter:'叁',title:'入夜 · 灯暖',desc:'一庭月色 / 满室书香'},
 hall:{pos:[-2.56,2.16,-2.89],target:[-2.93,2.49,-7.34],fov:65,time:.20,chapter:'肆',title:'明间 · 待客堂',desc:'三开间 / 净高逾三米',room:'明间',copy:'一案一炉，待客听雨。'},
 study:{pos:[-5.12,2.23,-3.20],target:[-7.48,1.96,-6.70],fov:63,time:.25,chapter:'伍',title:'左次间 · 书房',desc:'书案琴几 / 文房清供',room:'书斋',copy:'半窗晴翠，一卷闲书。'},
 bedroom:{pos:[-.13,2.15,-3.22],target:[1.51,1.83,-6.35],fov:66,time:.36,chapter:'陆',title:'右次间 · 卧房',desc:'架子床 / 纱幔屏风',room:'卧房',copy:'疏帘纳翠，雨声入梦。'},
 structure:{pos:[9.9,11.8,12.6],target:[-2.8,2.47,-4.92],fov:42,time:.10,chapter:'柒',title:'剖观 · 梁木之间',desc:'露明梁架 / 柱梁檩椽'}
};
let view='overview',timeValue=.12,timeTarget=.12,walking=false,ready=false,elapsed=18.25,transition=null,lastTime=performance.now(),nightMix=0;
const keys=new Set();let dragging=false,lastX=0,lastY=0;
function tone(n){
 const sunset=Math.exp(-Math.pow((n-.60)/.19,2));nightMix=THREE.MathUtils.smoothstep(n,.32,1);
 const sky=new THREE.Color(0xc1cec8).lerp(new THREE.Color(0x70888c),THREE.MathUtils.smoothstep(n,.16,.70)).lerp(new THREE.Color(0x162c38),Math.pow(n,2.9));
 scene.background.copy(sky);scene.fog.color.copy(sky);scene.fog.density=lerp(.014,.019,nightMix);floor.material.color.copy(sky).multiplyScalar(.90);
 hemi.color.set(0xc7d9cf).lerp(new THREE.Color(0x779aa9),nightMix);hemi.groundColor.set(0x687450).lerp(new THREE.Color(0x263c39),nightMix);hemi.intensity=lerp(1.66,.51,nightMix);
 sun.color.set(0xffefcf).lerp(new THREE.Color(0xefd1a4),sunset*.42).lerp(new THREE.Color(0x90adce),nightMix);sun.intensity=lerp(2.5,.54,nightMix);fill.color.set(0xd7e6d3).lerp(new THREE.Color(0x729caf),nightMix);fill.intensity=lerp(.52,.20,nightMix);
 scene.environmentIntensity=lerp(.75,.21,nightMix);renderer.toneMappingExposure=lerp(1.18,1.31,nightMix);
 for(const l of ctx.lamps)l.light.intensity=lerp(l.day,l.night,THREE.MathUtils.smoothstep(n,.22,.83));
 if(ctx.M)ctx.M.paper.emissiveIntensity=lerp(.16,2.30,THREE.MathUtils.smoothstep(n,.20,.86));
 bloom.strength=lerp(.105,.22,nightMix);grade.uniforms.uNight.value=nightMix;
 document.body.classList.toggle('night',n>.70);document.querySelector('meta[name=theme-color]').setAttribute('content','#'+sky.getHexString());
}
function updateUI(p){
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 document.querySelector('#chapter-no').textContent=p.chapter;document.querySelector('#view-title').textContent=p.title;document.querySelector('#view-description').textContent=p.desc;
 document.querySelector('#structure-note').hidden=view!=='structure';document.querySelector('#room-note').hidden=!p.room;
 document.body.classList.toggle('interior',!!p.room);if(p.room){document.querySelector('#room-name').textContent=p.room;document.querySelector('#room-copy').textContent=p.copy;}
 document.querySelector('#time').value=timeTarget;
}
function setView(name,immediate=false,changeTime=false){
 const p=PRESETS[name]||PRESETS.overview;view=name;stopWalking();
 if(ctx.mainRoof){ctx.mainRoof.front.visible=name!=='structure';ctx.mainRoof.ridge.visible=name!=='structure';}
 if(changeTime){timeTarget=p.time;if(immediate)timeValue=p.time;}
 if(immediate){camera.position.fromArray(p.pos);controls.target.fromArray(p.target);camera.fov=p.fov;camera.updateProjectionMatrix();controls.update();transition=null;}
 else transition={start:performance.now(),from:camera.position.clone(),to:V(...p.pos),targetFrom:controls.target.clone(),targetTo:V(...p.target),fovFrom:camera.fov,fovTo:p.fov};
 controls.minDistance=p.room?.65:2.1;controls.maxDistance=p.room?13:62;controls.maxPolarAngle=p.room?Math.PI*.85:Math.PI*.485;
 updateUI(p);renderer.shadowMap.needsUpdate=true;
}
function stopWalking(){walking=false;controls.enabled=true;keys.clear();document.querySelector('#walk-hud').hidden=true;document.querySelector('#walk-button').textContent='漫游 ↗';document.querySelector('#gesture-hint').textContent='↔ 拖动环绕 · 滚轮 / 双指缩放';}
function startWalking(){
 if(!PRESETS[view]?.room){setView('hall',true,false);}
 walking=true;controls.enabled=false;camera.rotation.order='YXZ';document.querySelector('#walk-hud').hidden=false;document.querySelector('#walk-button').textContent='退出漫游';document.querySelector('#gesture-hint').textContent='WASD / 方向键 · 拖动环视';
}
function bridgeFloor(x,z){
 const b=ctx.bridge;if(!b)return null;const dx=b.b.x-b.a.x,dz=b.b.z-b.a.z,ll=dx*dx+dz*dz,t=((x-b.a.x)*dx+(z-b.a.z)*dz)/ll;if(t<-.05||t>1.05)return null;const dist=Math.abs((x-b.a.x)*dz-(z-b.a.z)*dx)/Math.sqrt(ll);return dist<b.width*.48?b.height(clamp(t,0,1))+.08:null;
}
function floorHeight(x,z){
 const br=bridgeFloor(x,z);if(br!==null)return br;
 if(x>-9.15&&x<3.70&&z>-8.74&&z<-1.36)return .64;
 if(x>-4.6&&x<-0.75&&z>=-1.36&&z<-.85)return .15+(-.85-z)/.51*.49;
 if(x>-10.4&&x<-7.25&&z>3.4&&z<6.8)return .32;
 if(x>-8.95&&x<-.48&&z>-.98&&z<4.3)return .195;
 return .10;
}
function canStand(x,z){
 if(x<-12.6||x>12.6||z<-8.6||z>8.1)return false;
 if(isInPond(x,z)&&bridgeFloor(x,z)===null)return false;
 for(const c of ctx.colliders){const dx=x-c.x,dz=z-c.z,cs=Math.cos(c.ry),sn=Math.sin(c.ry),lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;if(Math.abs(lx)<c.w/2+.16&&Math.abs(lz)<c.d/2+.16)return false;}
 return true;
}
function walk(dt){
 if(!walking)return;const forward=V(0,0,-1).applyQuaternion(camera.quaternion);forward.y=0;forward.normalize();const right=V(1,0,0).applyQuaternion(camera.quaternion);right.y=0;right.normalize();const d=V();
 if(keys.has('forward'))d.add(forward);if(keys.has('backward'))d.sub(forward);if(keys.has('right'))d.add(right);if(keys.has('left'))d.sub(right);
 if(d.lengthSq()){d.normalize().multiplyScalar(dt*1.65);const xx=camera.position.x+d.x,zz=camera.position.z+d.z;if(canStand(xx,camera.position.z))camera.position.x=xx;if(canStand(camera.position.x,zz))camera.position.z=zz;}
 camera.position.y=lerp(camera.position.y,floorHeight(camera.position.x,camera.position.z)+1.58,Math.min(1,dt*10));
}
renderer.domElement.addEventListener('pointerdown',e=>{if(!walking)return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!walking||!dragging)return;camera.rotation.y-=(e.clientX-lastX)*.0038;camera.rotation.x=clamp(camera.rotation.x-(e.clientY-lastY)*.0038,-1.2,1.2);lastX=e.clientX;lastY=e.clientY;});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
const keyMap={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
addEventListener('keydown',e=>{if(e.code==='Escape'){setView('overview',false);return;}if(walking&&keyMap[e.code]){e.preventDefault();keys.add(keyMap[e.code]);}});addEventListener('keyup',e=>{if(keyMap[e.code])keys.delete(keyMap[e.code]);});addEventListener('blur',()=>keys.clear());
for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.move));}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>setView(b.dataset.view,reduced));
document.querySelector('#walk-button').addEventListener('click',()=>walking?stopWalking():startWalking());
document.querySelector('#time').addEventListener('input',e=>timeTarget=Number(e.target.value));document.querySelector('#day-button').addEventListener('click',()=>{timeTarget=0;document.querySelector('#time').value=0;});document.querySelector('#night-button').addEventListener('click',()=>{timeTarget=1;document.querySelector('#time').value=1;});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);grade.uniforms.uAspect.value=camera.aspect;if(captureMode&&ready)render(0);});
function render(dt){
 tone(timeValue);windUniform.value=elapsed;updateWeather(ctx,elapsed,nightMix);walk(dt);renderer.info.reset();composer.render(dt);
}
function animate(now){
 requestAnimationFrame(animate);if(document.hidden||!ready)return;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;elapsed+=reduced?0:dt;
 if(Math.abs(timeTarget-timeValue)>.0001)timeValue=lerp(timeValue,timeTarget,Math.min(1,dt*(reduced?100:2.0)));
 if(transition){const t=clamp((now-transition.start)/1450,0,1),k=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,k);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,k);camera.fov=lerp(transition.fovFrom,transition.fovTo,k);camera.updateProjectionMatrix();if(t>=1)transition=null;}
 if(!walking)controls.update();render(dt);
}
function fatal(e){console.error(e);const el=document.querySelector('#error-panel');el.hidden=false;el.textContent='场景加载失败 / Scene initialization failed\n'+(e.stack||e.message||String(e));document.querySelector('#loading').style.display='none';window.__GARDEN_ERROR__=String(e);}
window.addEventListener('error',e=>{if(!ready&&e.error)fatal(e.error);});
async function boot(){
 document.querySelector('#load-detail').textContent='载入木石肌理与雨天环境光……';
 const {M,environment,manifest,photoSets}=await createMaterials(renderer);ctx.M=M;ctx.assets=manifest;ctx.photoSets=photoSets;scene.environment=environment;scene.environmentRotation.y=.45;
 // Geometry generation and rendering run in the visitor's browser. All development/test rendering is CI-only.
 document.querySelector('#load-detail').textContent='架梁立柱，开池叠石……';
 createLandscape(world,M,ctx);createHouse(world,M,ctx);gardenWalls(world,M,ctx);pavilionAndCorridor(world,M,ctx);createBotany(world,M,ctx);
 document.querySelector('#load-detail').textContent='布置书案与草木，校准光影……';
 setView('overview',true,true);tone(timeValue);windUniform.value=elapsed;updateWeather(ctx,elapsed,nightMix);
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 await document.fonts.ready;
 render(0);ready=true;window.__GARDEN_READY__=true;
 const loading=document.querySelector('#loading');if(captureMode)loading.style.display='none';else{loading.classList.add('done');setTimeout(()=>loading.remove(),900);}
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
 window.garden={
  presets:Object.keys(PRESETS),
  async capture(name){setView(name,true,true);elapsed=18.25;renderer.shadowMap.needsUpdate=true;render(0);await new Promise(resolve=>requestAnimationFrame(resolve));render(0);gl.finish();return this.diagnostics();},
  setView:(name)=>setView(name,true,false),
  setTime(n){timeValue=timeTarget=clamp(n,0,1);document.querySelector('#time').value=timeValue;render(0);},
  startWalking,stopWalking,
  step(direction,seconds=.10){keys.add(direction);walk(seconds);keys.delete(direction);render(0);return camera.position.toArray();},
  advance(seconds){const n=Math.max(1,Math.ceil(seconds/.05)),dt=seconds/n;for(let i=0;i<n;i++)timeValue=lerp(timeValue,timeTarget,Math.min(1,dt*2));elapsed+=seconds;render(0);return timeValue;},
  frameSample(){const samples=[],pixel=new Uint8Array(4);for(const [x,y]of [[.5,.5],[.32,.42],[.70,.42],[.5,.65]]){gl.readPixels(Math.floor(renderer.domElement.width*x),Math.floor(renderer.domElement.height*y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);samples.push([...pixel]);}return {samples,mean:samples.reduce((s,p)=>s+p[0]+p[1]+p[2],0)/12};},
  position:()=>camera.position.toArray(),canStand,floorHeight,
  render:()=>render(0),
  diagnostics:()=>({view,time:timeValue,walking,firstPersonEyeHeight:1.58,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),webgl2:renderer.capabilities.isWebGL2,photographicPBR:photoSets,environment:manifest.environment?.asset||'RoomEnvironment',leafCount:ctx.leafCount,colliders:ctx.colliders.length,rooms:['hall','study','bedroom'],roofFrontVisible:ctx.mainRoof.front.visible,render:{...renderer.info.render},memory:{...renderer.info.memory},camera:camera.position.toArray(),resolution:[innerWidth,innerHeight],canStandAtDoor:canStand(-2.7,-1.7)})
 };
 console.log('GARDEN_READY',JSON.stringify(window.garden.diagnostics()));
 if(!captureMode)requestAnimationFrame(animate);
}
boot().catch(fatal);
