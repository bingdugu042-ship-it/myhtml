/**
 * 暖木芯官网 — Click Sparkles
 * 点击 .nfc-card / .btn-fill / .brand-card 产生暖铜色粒子爆发
 * ES5 | Three.js PointsMaterial + AdditiveBlending
 * z-index:5 — 背景粒子(z:0)与内容(z:10)之间
 */
(function () {
  'use strict';

  var COPPER = [new THREE.Color('#d59b75'),new THREE.Color('#d4a855'),new THREE.Color('#e8bbba'),new THREE.Color('#c08070')];
  var MAX_BURSTS = 3, P_MIN = 15, P_MAX = 25, LIFETIME = 1.0, G = -0.0008, SPD_MIN = 0.08, SPD_MAX = 0.2;

  /* ---- Canvas (z:5, pointer-events:none) ---- */
  var canvas = document.createElement('canvas');
  canvas.id = 'click-sparkles-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:5;pointer-events:none;';
  document.body.appendChild(canvas);

  var renderer = new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setClearColor(0x000000,0);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(
    -window.innerWidth/2,window.innerWidth/2,window.innerHeight/2,-window.innerHeight/2,0.1,1000
  );
  camera.position.z = 10;

  /* ---- Particle sprite 16x16 radial gradient ---- */
  var tc = document.createElement('canvas'); tc.width = 16; tc.height = 16;
  var tctx = tc.getContext('2d');
  var g = tctx.createRadialGradient(8,8,0,8,8,8);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.15,'rgba(255,255,255,0.85)');
  g.addColorStop(0.4,'rgba(255,230,200,0.3)'); g.addColorStop(0.7,'rgba(255,180,140,0.06)');
  g.addColorStop(1,'rgba(0,0,0,0)'); tctx.fillStyle = g; tctx.fillRect(0,0,16,16);
  var sprTex = new THREE.CanvasTexture(tc);

  /* ---- Burst ---- */
  function Burst(wx, wy) {
    var n = P_MIN + Math.floor(Math.random()*(P_MAX-P_MIN+1));
    this.n = n; this.alive = true;
    this.pos = new Float32Array(n*3); this.vel = new Float32Array(n*3);
    this.lt = new Float32Array(n); this.age = new Float32Array(n);
    var cols = new Float32Array(n*3), i, i3, ang, phi, spd, c;
    for (i = 0; i < n; i++) {
      i3 = i*3;
      this.pos[i3]=wx; this.pos[i3+1]=wy; this.pos[i3+2]=(Math.random()-0.5)*4;
      ang = Math.random()*Math.PI*2;
      phi = (Math.random()-0.5)*Math.PI*0.7;
      spd = SPD_MIN + Math.random()*(SPD_MAX-SPD_MIN);
      this.vel[i3]=Math.cos(phi)*Math.cos(ang)*spd;
      this.vel[i3+1]=Math.sin(phi)*spd+spd*0.25;
      this.vel[i3+2]=Math.cos(phi)*Math.sin(ang)*spd*0.5;
      c = COPPER[Math.floor(Math.random()*COPPER.length)];
      cols[i3]=c.r; cols[i3+1]=c.g; cols[i3+2]=c.b;
      this.lt[i]=0.7+Math.random()*0.3; this.age[i]=0;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(this.pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
    var mat = new THREE.PointsMaterial({
      size:18, map:sprTex, vertexColors:true, blending:THREE.AdditiveBlending,
      depthWrite:false, transparent:true, opacity:0.9, sizeAttenuation:false
    });
    this.mesh = new THREE.Points(geo,mat);
    scene.add(this.mesh);
  }

  Burst.prototype.update = function () {
    if (!this.alive) return;
    var dead = 0, i, i3;
    for (i = 0; i < this.n; i++) {
      i3 = i*3;
      this.age[i] += 0.016;
      if (this.age[i] >= this.lt[i]) { this.pos[i3+1] = -9999; dead++; continue; }
      this.vel[i3+1] += G;
      this.pos[i3]+=this.vel[i3]; this.pos[i3+1]+=this.vel[i3+1]; this.pos[i3+2]+=this.vel[i3+2];
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    if (dead >= this.n) { this.alive = false; return; }
    var sum = 0;
    for (i = 0; i < this.n; i++) sum += Math.min(this.age[i], this.lt[i]);
    var t = Math.min(sum/this.n/0.85, 1);
    this.mesh.material.opacity = 0.9*(1-t);
    this.mesh.material.size = 18*(1-t*0.7);
  };

  Burst.prototype.dispose = function () {
    scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose();
  };

  /* ---- Pool ---- */
  var bursts = [];
  function spawn(sx, sy) {
    for (var i = bursts.length-1; i >= 0; i--) { if (!bursts[i].alive) { bursts[i].dispose(); bursts.splice(i,1); } }
    while (bursts.length >= MAX_BURSTS) { bursts[0].dispose(); bursts.shift(); }
    bursts.push(new Burst(sx-window.innerWidth/2, window.innerHeight/2-sy));
  }

  /* ---- Event ---- */
  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== document.body) {
      if (el.matches && el.matches('.nfc-card,.btn-fill,.brand-card')) { spawn(e.clientX, e.clientY); return; }
      el = el.parentElement;
    }
  });

  /* ---- Resize ---- */
  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.left=-window.innerWidth/2; camera.right=window.innerWidth/2;
    camera.top=window.innerHeight/2; camera.bottom=-window.innerHeight/2;
    camera.updateProjectionMatrix();
  });

  /* ---- Loop ---- */
  (function loop() {
    requestAnimationFrame(loop);
    for (var i = 0; i < bursts.length; i++) bursts[i].update();
    renderer.render(scene, camera);
  })();
})();
