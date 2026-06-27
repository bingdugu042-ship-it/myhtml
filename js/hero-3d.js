/**
 * Hero 3D Scene — 菲林小卡 → 500暖色粒子 → 角色轮廓
 * 5阶段10秒循环: 悬浮→爆散→聚合→呼吸→回归
 * 全暖色光照系统（暖铜+暖金+暖桃粉，禁用冷色）
 */
(function () {
  'use strict';

  var container = document.getElementById('hero');
  if (!container) return;

  // ---- Canvas setup ----
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'hero-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.prepend(canvas);
  }

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  canvas.replaceWith(renderer.domElement);
  renderer.domElement.id = 'hero-canvas';
  renderer.domElement.style.cssText = canvas.style.cssText;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 30);
  camera.position.set(0, 0.3, 6);
  camera.lookAt(0, 0, 0);

  // ---- Colors (warm copper palette only) ----
  var C = {
    copper:    0xd59b75,
    gold:      0xd4a855,
    blush:     0xe8bbba,
    rose:      0xc08070,
    warmWhite: 0xf5e6d8,
    deepBg:    0x2a1a2e,
  };

  var brandColors = [
    { r: 0.835, g: 0.608, b: 0.459 },   // copper
    { r: 0.831, g: 0.659, b: 0.333 },   // gold
    { r: 0.910, g: 0.733, b: 0.729 },   // blush
    { r: 0.753, g: 0.502, b: 0.439 },   // rose
    { r: 0.941, g: 0.725, b: 0.533 },   // light copper
    { r: 0.961, g: 0.902, b: 0.847 },   // warm white
  ];

  // ---- Lighting: warm copper system ----
  scene.add(new THREE.AmbientLight(C.deepBg, 3.0));

  var keyLight = new THREE.PointLight(C.warmWhite, 20, 9, 1.5);
  keyLight.position.set(3, 5, 8);
  scene.add(keyLight);

  var fillLight = new THREE.PointLight(C.rose, 12, 7, 2);
  fillLight.position.set(-4, 1, 2);
  scene.add(fillLight);

  var rimLight = new THREE.PointLight(C.gold, 18, 6, 1.5);
  rimLight.position.set(0, -2, -4);
  scene.add(rimLight);

  var topLight = new THREE.PointLight(C.blush, 6, 8, 2.5);
  topLight.position.set(0, 8, 0);
  scene.add(topLight);

  // ---- Canvas 2D card texture ----
  function createCardTexture() {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 716;
    var ctx = c.getContext('2d');

    // Warm gradient background
    var bg = ctx.createLinearGradient(0, 0, 0, 716);
    bg.addColorStop(0, '#1a0e08');
    bg.addColorStop(0.35, '#2a1510');
    bg.addColorStop(0.65, '#1e1218');
    bg.addColorStop(1, '#0d0612');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 716);

    // Warm copper glow (top-left)
    var g1 = ctx.createRadialGradient(80, 60, 20, 256, 358, 420);
    g1.addColorStop(0, 'rgba(213,155,117,0.28)');
    g1.addColorStop(0.4, 'rgba(212,168,85,0.10)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, 512, 716);

    // Rose glow (bottom-right)
    var g2 = ctx.createRadialGradient(400, 560, 20, 256, 358, 380);
    g2.addColorStop(0, 'rgba(192,128,112,0.18)');
    g2.addColorStop(0.5, 'rgba(232,187,186,0.06)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, 512, 716);

    // Warm gold outer border with glow
    ctx.strokeStyle = '#d4a855';
    ctx.lineWidth = 10;
    ctx.shadowColor = 'rgba(212,168,85,0.55)';
    ctx.shadowBlur = 18;
    ctx.strokeRect(14, 14, 484, 688);
    ctx.shadowBlur = 10;
    ctx.strokeRect(14, 14, 484, 688);
    ctx.shadowBlur = 0;

    // Copper dashed inner border
    ctx.strokeStyle = 'rgba(213,155,117,0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 8]);
    ctx.strokeRect(26, 26, 460, 664);
    ctx.setLineDash([]);

    // Brand name — warm gold gradient
    var nameGrad = ctx.createLinearGradient(150, 200, 362, 280);
    nameGrad.addColorStop(0, '#d4a855');
    nameGrad.addColorStop(0.35, '#d59b75');
    nameGrad.addColorStop(0.7, '#e8bbba');
    nameGrad.addColorStop(1, '#d4a855');
    ctx.fillStyle = nameGrad;
    ctx.font = 'bold 48px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(213,155,117,0.6)';
    ctx.shadowBlur = 14;
    ctx.fillText('暖木星', 256, 240);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#c08070';
    ctx.font = 'bold 24px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.shadowColor = 'rgba(192,128,112,0.4)';
    ctx.shadowBlur = 8;
    ctx.fillText('暖木芯 · NFC灵魂注入', 256, 295);
    ctx.shadowBlur = 0;

    // Decorative divider
    var dg = ctx.createLinearGradient(60, 0, 452, 0);
    dg.addColorStop(0, 'rgba(213,155,117,0)');
    dg.addColorStop(0.25, '#d59b75');
    dg.addColorStop(0.5, '#d4a855');
    dg.addColorStop(0.75, '#c08070');
    dg.addColorStop(1, 'rgba(192,128,112,0)');
    ctx.strokeStyle = dg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(55, 330);
    ctx.lineTo(457, 330);
    ctx.stroke();

    // Bottom text
    ctx.fillStyle = 'rgba(220,200,180,0.55)';
    ctx.font = '15px "Noto Sans SC","PingFang SC",sans-serif';
    ctx.fillText('触碰实体 · 唤醒灵魂', 256, 390);

    // Corner ornaments
    var cs = 38;
    ctx.strokeStyle = '#d59b75';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(213,155,117,0.4)';
    ctx.shadowBlur = 8;
    [[cs,cs,1,1],[472,cs,-1,1],[cs,678,1,-1],[472,678,-1,-1]].forEach(function(corner) {
      var cx = corner[0], cy = corner[1], sx = corner[2], sy = corner[3];
      ctx.beginPath();
      ctx.moveTo(cx, cy + 22 * sy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + 22 * sx, cy);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    return new THREE.CanvasTexture(c);
  }

  // ---- 3D Card ----
  var cardTex = createCardTexture();
  var cardGeo = new THREE.PlaneGeometry(1.4, 1.96);
  var cardMat = new THREE.MeshStandardMaterial({
    map: cardTex,
    roughness: 0.35,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });
  var card = new THREE.Mesh(cardGeo, cardMat);
  scene.add(card);

  // Warm gold edge frame
  var edgeGroup = new THREE.Group();
  var edgeMat = new THREE.MeshStandardMaterial({
    color: C.gold,
    emissive: C.gold,
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.85,
  });
  var et = 0.022;
  var ew = 1.44;
  var eh = 2.0;

  function addEdge(w, h, x, y, z) {
    var g = new THREE.BoxGeometry(w, h, et);
    var m = new THREE.Mesh(g, edgeMat);
    m.position.set(x, y, z);
    edgeGroup.add(m);
  }
  addEdge(ew, et, 0,  eh / 2, 0.008);
  addEdge(ew, et, 0, -eh / 2, 0.008);
  addEdge(et, eh,  ew / 2, 0, 0.008);
  addEdge(et, eh, -ew / 2, 0, 0.008);
  card.add(edgeGroup);

  // ---- 500 Particles ----
  var PARTICLE_COUNT = window.innerWidth < 768 ? 280 : 500;
  var particlePositions = new Float32Array(PARTICLE_COUNT * 3);
  var particleColors = new Float32Array(PARTICLE_COUNT * 3);

  var cardPositions = new Float32Array(PARTICLE_COUNT * 3);
  var burstDirections = new Float32Array(PARTICLE_COUNT * 3);
  var silhouetteTargets = new Float32Array(PARTICLE_COUNT * 3);

  // Generate silhouette (human outline) target points
  function generateSilPoints() {
    var pts = [];

    // Head circle
    for (var i = 0; i < 90; i++) {
      var a = (i / 90) * Math.PI * 2;
      pts.push({
        x: Math.cos(a) * 0.16,
        y: 0.72 + Math.sin(a) * 0.16,
        z: (Math.random() - 0.5) * 0.03,
      });
    }
    // Neck
    for (var j = 0; j < 12; j++) {
      pts.push({ x: (Math.random() - 0.5) * 0.06, y: 0.53 + j * 0.005, z: (Math.random() - 0.5) * 0.02 });
    }
    // Torso
    for (var k = 0; k < 140; k++) {
      var t = k / 139;
      var ty = 0.5 - t * 0.42;
      var hw = 0.17 - t * 0.04;
      pts.push({
        x: (Math.random() - 0.5) * hw * 2,
        y: ty + (Math.random() - 0.5) * 0.022,
        z: (Math.random() - 0.5) * 0.022,
      });
    }
    // Arms (bezier)
    function sampleBez(p0, p1, p2, n) {
      var arr = [];
      for (var bi = 0; bi < n; bi++) {
        var bt = bi / (n - 1), bu = 1 - bt;
        arr.push({
          x: bu * bu * p0.x + 2 * bu * bt * p1.x + bt * bt * p2.x,
          y: bu * bu * p0.y + 2 * bu * bt * p1.y + bt * bt * p2.y,
        });
      }
      return arr;
    }
    var lArm = sampleBez({ x: -0.16, y: 0.46 }, { x: -0.36, y: 0.24 }, { x: -0.26, y: 0.02 }, 55);
    lArm.forEach(function (p) { pts.push({ x: p.x + (Math.random() - 0.5) * 0.05, y: p.y + (Math.random() - 0.5) * 0.04, z: (Math.random() - 0.5) * 0.03 }); });
    var rArm = sampleBez({ x: 0.16, y: 0.46 }, { x: 0.36, y: 0.24 }, { x: 0.26, y: 0.02 }, 55);
    rArm.forEach(function (p) { pts.push({ x: p.x + (Math.random() - 0.5) * 0.05, y: p.y + (Math.random() - 0.5) * 0.04, z: (Math.random() - 0.5) * 0.03 }); });
    // Legs
    var lLeg = sampleBez({ x: -0.06, y: 0.08 }, { x: -0.08, y: -0.16 }, { x: -0.06, y: -0.4 }, 55);
    lLeg.forEach(function (p) { pts.push({ x: p.x + (Math.random() - 0.5) * 0.04, y: p.y + (Math.random() - 0.5) * 0.04, z: (Math.random() - 0.5) * 0.03 }); });
    var rLeg = sampleBez({ x: 0.06, y: 0.08 }, { x: 0.08, y: -0.16 }, { x: 0.06, y: -0.4 }, 55);
    rLeg.forEach(function (p) { pts.push({ x: p.x + (Math.random() - 0.5) * 0.04, y: p.y + (Math.random() - 0.5) * 0.04, z: (Math.random() - 0.5) * 0.03 }); });

    return pts;
  }

  var silPts = generateSilPoints();

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    // Initial positions on card surface
    cardPositions[i * 3]     = (Math.random() - 0.5) * 1.32;
    cardPositions[i * 3 + 1] = (Math.random() - 0.5) * 1.85;
    cardPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.03;

    // Burst directions (random sphere)
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.random() * Math.PI - Math.PI / 2;
    var speed = 2 + Math.random() * 4.5;
    burstDirections[i * 3]     = Math.cos(phi) * Math.cos(theta) * speed;
    burstDirections[i * 3 + 1] = Math.sin(phi) * speed;
    burstDirections[i * 3 + 2] = Math.cos(phi) * Math.sin(theta) * speed;

    // Silhouette targets
    var si = i % silPts.length;
    silhouetteTargets[i * 3]     = silPts[si].x + (Math.random() - 0.5) * 0.05;
    silhouetteTargets[i * 3 + 1] = silPts[si].y + (Math.random() - 0.5) * 0.05;
    silhouetteTargets[i * 3 + 2] = (silPts[si].z || 0) + (Math.random() - 0.5) * 0.04;

    // Start at card positions
    particlePositions[i * 3]     = cardPositions[i * 3];
    particlePositions[i * 3 + 1] = cardPositions[i * 3 + 1];
    particlePositions[i * 3 + 2] = cardPositions[i * 3 + 2];

    var col = brandColors[i % brandColors.length];
    particleColors[i * 3]     = col.r;
    particleColors[i * 3 + 1] = col.g;
    particleColors[i * 3 + 2] = col.b;
  }

  var particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  // Glow sprite texture
  var spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 32; spriteCanvas.height = 32;
  var sctx = spriteCanvas.getContext('2d');
  var grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.12, 'rgba(255,240,220,0.9)');
  grad.addColorStop(0.35, 'rgba(213,155,117,0.45)');
  grad.addColorStop(0.65, 'rgba(192,128,112,0.10)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 32, 32);

  var particleMat = new THREE.PointsMaterial({
    size: 0.055,
    map: new THREE.CanvasTexture(spriteCanvas),
    vertexColors: true,
    blending: window.innerWidth < 768 ? THREE.NormalBlending : THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.85,
  });
  var particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ---- Animation State Machine ----
  var CYCLE_DURATION = 10.0;

  // Easing functions
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutBack(t) { var c1 = 1.70158; var c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function updateHeroParticles(t) {
    var phaseTime = t % CYCLE_DURATION;
    var posArr = particleGeo.attributes.position.array;

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var i3 = i * 3;
      var tx, ty, tz;

      if (phaseTime < 3.5) {
        // Phase 1: Float on card
        tx = cardPositions[i3]     + Math.sin(t * 3 + i * 0.1) * 0.018;
        ty = cardPositions[i3 + 1] + Math.cos(t * 2.5 + i * 0.15) * 0.018;
        tz = cardPositions[i3 + 2];
      } else if (phaseTime < 4.5) {
        // Phase 2: Burst outward
        var bt = (phaseTime - 3.5) / 1.0;
        var eased = easeOutBack(bt);
        tx = cardPositions[i3]     + burstDirections[i * 3] * eased;
        ty = cardPositions[i3 + 1] + burstDirections[i * 3 + 1] * eased;
        tz = cardPositions[i3 + 2] + burstDirections[i * 3 + 2] * eased;
      } else if (phaseTime < 6.0) {
        // Phase 3: Converge to silhouette
        var st = Math.min(1, (phaseTime - 4.5) / 1.5);
        var eased2 = easeOutElastic(st);
        var bx = cardPositions[i3]     + burstDirections[i * 3];
        var by = cardPositions[i3 + 1] + burstDirections[i * 3 + 1];
        var bz = cardPositions[i3 + 2] + burstDirections[i * 3 + 2];
        tx = lerp(bx, silhouetteTargets[i3], eased2);
        ty = lerp(by, silhouetteTargets[i3 + 1], eased2);
        tz = lerp(bz, silhouetteTargets[i3 + 2], eased2);
      } else if (phaseTime < 8.5) {
        // Phase 4: Breathe (pulse scale)
        var brt = (phaseTime - 6.0) / 2.5;
        var pulse = 1 + Math.sin(brt * Math.PI * 4) * 0.035;
        tx = silhouetteTargets[i3] * pulse;
        ty = silhouetteTargets[i3 + 1] * pulse;
        tz = silhouetteTargets[i3 + 2] * pulse;
      } else {
        // Phase 5: Return to card
        var rt = (phaseTime - 8.5) / 1.5;
        var eased3 = easeInOutCubic(rt);
        tx = lerp(silhouetteTargets[i3], cardPositions[i3], eased3);
        ty = lerp(silhouetteTargets[i3 + 1], cardPositions[i3 + 1], eased3);
        tz = lerp(silhouetteTargets[i3 + 2], cardPositions[i3 + 2], eased3);
      }

      posArr[i3]     = tx;
      posArr[i3 + 1] = ty;
      posArr[i3 + 2] = tz;
    }
    particleGeo.attributes.position.needsUpdate = true;
  }

  // ---- Render Loop ----
  var isRendering = true;

  function animate(timestamp) {
    if (!isRendering) return;
    requestAnimationFrame(animate);

    var t = timestamp * 0.001;

    // Card float
    card.rotation.y = Math.sin(t * 0.5) * 0.22;
    card.rotation.x = Math.sin(t * 0.4 + 0.5) * 0.1;
    card.position.y = Math.sin(t * 0.6) * 0.12;

    // Edge emissive pulse
    edgeMat.emissiveIntensity = 0.45 + Math.sin(t * 2.5) * 0.22 + Math.sin(t * 5.3) * 0.12;

    // Dynamic lighting
    keyLight.intensity  = 18 + Math.sin(t * 1.8) * 3;
    fillLight.intensity = 11 + Math.cos(t * 2.1 + 1) * 2;
    rimLight.intensity  = 16 + Math.sin(t * 2.8 + 2) * 3;
    topLight.intensity  = 5 + Math.cos(t * 3.2) * 1.5;

    // Camera subtle movement
    camera.position.x = Math.sin(t * 0.3) * 0.35;
    camera.position.y = 0.3 + Math.cos(t * 0.35) * 0.18;
    camera.lookAt(0, 0, 0);

    updateHeroParticles(t);
    renderer.render(scene, camera);
  }

  // ---- IntersectionObserver ----
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        isRendering = true;
        requestAnimationFrame(animate);
      } else {
        isRendering = false;
      }
    });
  }, { threshold: 0.1 });
  observer.observe(container);

  // ---- Resize ----
  var resize = function () {
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);

  requestAnimationFrame(animate);
})();
