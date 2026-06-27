/**
 * 产品3D画廊 — 4件产品在圆形展台悬浮旋转
 * 手写ManualOrbit拖拽旋转+滚轮缩放，摄影棚级暖调光照
 */
(function () {
  'use strict';

  var container = document.getElementById('gallery');
  if (!container) return;

  // ---- Canvas setup ----
  var canvas = document.getElementById('gallery-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'gallery-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:0;';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.prepend(canvas);
  }

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvas.replaceWith(renderer.domElement);
  renderer.domElement.id = 'gallery-canvas';
  renderer.domElement.style.cssText = canvas.style.cssText;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.5, 25);
  camera.position.set(0, 2.8, 7);
  camera.lookAt(0, -0.3, 0);

  var C = {
    copper: 0xd59b75,
    gold: 0xd4a855,
    blush: 0xe8bbba,
    rose: 0xc08070,
    warmWhite: 0xfaf0e0,
  };

  // ---- Lighting: product photography ----
  scene.add(new THREE.AmbientLight(0x1a1520, 4.5));
  scene.add(new THREE.HemisphereLight(0xfaf0e0, 0x2a1a2e, 2.5));

  var mainLight = new THREE.DirectionalLight(C.warmWhite, 8);
  mainLight.position.set(5, 8, 5);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(1024, 1024);
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 25;
  mainLight.shadow.bias = -0.001;
  scene.add(mainLight);

  var fillLight = new THREE.DirectionalLight(C.blush, 4);
  fillLight.position.set(-3, 4, -2);
  scene.add(fillLight);

  var rimLight = new THREE.DirectionalLight(C.gold, 5);
  rimLight.position.set(0, -1, -5);
  scene.add(rimLight);

  var topLight = new THREE.DirectionalLight(0xffffff, 3);
  topLight.position.set(0, 8, 0);
  scene.add(topLight);

  // ---- Platform ----
  var platformGroup = new THREE.Group();

  // Create platform texture
  function createPlatformTex() {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    var ctx = c.getContext('2d');
    var pg = ctx.createRadialGradient(256, 256, 40, 256, 256, 260);
    pg.addColorStop(0, '#3a2820');
    pg.addColorStop(0.3, '#2a1a15');
    pg.addColorStop(0.6, '#221815');
    pg.addColorStop(1, '#3a2820');
    ctx.fillStyle = pg;
    ctx.fillRect(0, 0, 512, 512);

    // Warm gold ring
    ctx.strokeStyle = 'rgba(212,168,85,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(256, 256, 200, 0, Math.PI * 2); ctx.stroke();
    // Copper inner ring
    ctx.strokeStyle = 'rgba(213,155,117,0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(256, 256, 155, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(212,168,85,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(256, 256, 100, 0, Math.PI * 2); ctx.stroke();

    return new THREE.CanvasTexture(c);
  }

  var platformGeo = new THREE.CylinderGeometry(1.5, 1.65, 0.2, 64);
  var platform = new THREE.Mesh(platformGeo, new THREE.MeshStandardMaterial({
    map: createPlatformTex(),
    roughness: 0.5,
    metalness: 0.25,
  }));
  platform.position.y = -0.1;
  platform.receiveShadow = true;
  platformGroup.add(platform);

  // Warm gold torus rim
  var rimGeo = new THREE.TorusGeometry(1.55, 0.04, 16, 64);
  var rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({
    color: C.gold,
    roughness: 0.18,
    metalness: 0.85,
    emissive: C.gold,
    emissiveIntensity: 0.3,
  }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  platformGroup.add(rim);

  scene.add(platformGroup);

  // ---- 4 Products ----
  var products = [];
  var circleRadius = 1.2;

  // 1. Film Card
  function createFilmCard() {
    var g = new THREE.Group();
    var texCanvas = document.createElement('canvas');
    texCanvas.width = 280; texCanvas.height = 392;
    var ctx = texCanvas.getContext('2d');

    var grad = ctx.createLinearGradient(0, 0, 280, 392);
    grad.addColorStop(0, '#e8bbba');
    grad.addColorStop(0.4, '#d59b75');
    grad.addColorStop(0.7, '#c08070');
    grad.addColorStop(1, '#d4a855');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 280, 392);

    var shine = ctx.createLinearGradient(0, 0, 200, 0);
    shine.addColorStop(0, 'rgba(255,255,255,0.28)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, 280, 392);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px "Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('菲林小卡', 140, 100);
    ctx.font = '14px "Noto Sans SC",sans-serif';
    ctx.fillText('6×9cm · 镭射/幻彩膜', 140, 140);

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 264, 376);

    var tex = new THREE.CanvasTexture(texCanvas);
    var cardGeo = new THREE.BoxGeometry(0.5, 0.7, 0.015);
    var card = new THREE.Mesh(cardGeo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.3, metalness: 0.12,
    }));
    card.castShadow = true; card.receiveShadow = true;
    g.add(card);

    var edgeGeo = new THREE.BoxGeometry(0.53, 0.73, 0.008);
    var edge = new THREE.Mesh(edgeGeo, new THREE.MeshStandardMaterial({
      color: C.gold, roughness: 0.18, metalness: 0.85,
      emissive: C.gold, emissiveIntensity: 0.25,
    }));
    edge.position.z = -0.01;
    g.add(edge);

    g.userData = { label: 'film-card', baseY: 0.35 };
    return g;
  }

  // 2. Badge
  function createBadge() {
    var g = new THREE.Group();
    var texCanvas = document.createElement('canvas');
    texCanvas.width = 256; texCanvas.height = 256;
    var ctx = texCanvas.getContext('2d');

    var grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 130);
    grad.addColorStop(0, '#d59b75');
    grad.addColorStop(0.5, '#d4a855');
    grad.addColorStop(0.8, '#c08070');
    grad.addColorStop(1, '#8a6a5a');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(98, 98, 16, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 50px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏅', 128, 128);

    ctx.strokeStyle = '#d4a855';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(128, 128, 118, 0, Math.PI * 2); ctx.stroke();

    var tex = new THREE.CanvasTexture(texCanvas);
    var badgeGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 48);
    var badge = new THREE.Mesh(badgeGeo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.25, metalness: 0.6,
    }));
    badge.castShadow = true; badge.receiveShadow = true;
    g.add(badge);

    var backGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.03, 32);
    var back = new THREE.Mesh(backGeo, new THREE.MeshStandardMaterial({
      color: 0xc0c0c0, roughness: 0.3, metalness: 0.8,
    }));
    back.position.y = -0.04;
    g.add(back);

    g.userData = { label: 'badge', baseY: 0.25 };
    return g;
  }

  // 3. Acrylic Magnet
  function createAcrylicMagnet() {
    var g = new THREE.Group();
    var texCanvas = document.createElement('canvas');
    texCanvas.width = 256; texCanvas.height = 256;
    var ctx = texCanvas.getContext('2d');

    var grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#e8bbba');
    grad.addColorStop(0.5, '#d59b75');
    grad.addColorStop(1, '#e8bbba');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    var shine = ctx.createLinearGradient(0, 0, 150, 0);
    shine.addColorStop(0, 'rgba(255,255,255,0.35)');
    shine.addColorStop(0.6, 'rgba(255,255,255,0.04)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 40px "Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧊', 128, 135);

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 248);

    var tex = new THREE.CanvasTexture(texCanvas);
    var magnetGeo = new THREE.BoxGeometry(0.38, 0.38, 0.06);
    var magnet = new THREE.Mesh(magnetGeo, new THREE.MeshPhysicalMaterial({
      map: tex, roughness: 0.12, metalness: 0.05,
      clearcoat: 0.5, clearcoatRoughness: 0.1,
      transparent: true, opacity: 0.85,
    }));
    magnet.castShadow = true; magnet.receiveShadow = true;
    g.add(magnet);

    g.userData = { label: 'acrylic', baseY: 0.4 };
    return g;
  }

  // 4. Photo Print
  function createPhotoPrint() {
    var g = new THREE.Group();
    var texCanvas = document.createElement('canvas');
    texCanvas.width = 256; texCanvas.height = 340;
    var ctx = texCanvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 340);

    var grad = ctx.createLinearGradient(0, 0, 256, 340);
    grad.addColorStop(0, '#d59b75');
    grad.addColorStop(0.5, '#f5f0ea');
    grad.addColorStop(1, '#c08070');
    ctx.fillStyle = grad;
    ctx.fillRect(14, 14, 228, 312);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('📷', 128, 142);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Noto Sans SC",sans-serif';
    ctx.fillText('拍立得风 · 高清输出', 128, 185);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 252, 336);

    var tex = new THREE.CanvasTexture(texCanvas);
    var photoGeo = new THREE.BoxGeometry(0.35, 0.47, 0.012);
    var photo = new THREE.Mesh(photoGeo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.45, metalness: 0.05,
    }));
    photo.castShadow = true; photo.receiveShadow = true;
    g.add(photo);

    g.userData = { label: 'photo', baseY: 0.3 };
    return g;
  }

  var productCreators = [createFilmCard, createBadge, createAcrylicMagnet, createPhotoPrint];

  productCreators.forEach(function (createFn, i) {
    var product = createFn();
    var angle = (i / 4) * Math.PI * 2;
    product.position.set(Math.cos(angle) * circleRadius, 0.15, Math.sin(angle) * circleRadius);
    product.userData.angle = angle;
    product.userData.baseRadius = circleRadius;
    platformGroup.add(product);
    products.push(product);
  });

  // ---- ManualOrbit (no dependency) ----
  var orbit = {
    spherical: { theta: 0, phi: 1.05 },
    target: { x: 0, y: -0.3, z: 0 },
    distance: 5.5,
    minDist: 3,
    maxDist: 10,
    damping: 0.08,
    autoRotate: true,
    autoRotateSpeed: 0.004,
    autoRotateDelay: 1500,
    lastInteraction: 0,
    isDragging: false,
    prevMouse: { x: 0, y: 0 },
    enabled: true,

    deltaTheta: 0,
    deltaPhi: 0,
    deltaRadius: 0,
  };

  function orbitUpdate() {
    if (!orbit.enabled) return;

    if (orbit.autoRotate && performance.now() - orbit.lastInteraction > orbit.autoRotateDelay) {
      orbit.deltaTheta -= 0.003 * orbit.autoRotateSpeed;
    }

    orbit.spherical.theta  += orbit.deltaTheta  * orbit.damping;
    orbit.spherical.phi    += orbit.deltaPhi    * orbit.damping;
    orbit.distance         += orbit.deltaRadius * orbit.damping;

    orbit.spherical.phi = Math.max(0.2, Math.min(Math.PI * 0.45, orbit.spherical.phi));
    orbit.distance = Math.max(orbit.minDist, Math.min(orbit.maxDist, orbit.distance));

    orbit.deltaTheta  *= (1 - orbit.damping);
    orbit.deltaPhi    *= (1 - orbit.damping);
    orbit.deltaRadius *= (1 - orbit.damping);

    var sp = orbit.spherical;
    camera.position.x = orbit.target.x + orbit.distance * Math.sin(sp.phi) * Math.cos(sp.theta);
    camera.position.y = orbit.target.y + orbit.distance * Math.cos(sp.phi);
    camera.position.z = orbit.target.z + orbit.distance * Math.sin(sp.phi) * Math.sin(sp.theta);
    camera.lookAt(orbit.target.x, orbit.target.y, orbit.target.z);
  }

  renderer.domElement.addEventListener('pointerdown', function (e) {
    orbit.isDragging = true;
    orbit.prevMouse.x = e.clientX;
    orbit.prevMouse.y = e.clientY;
    orbit.lastInteraction = performance.now();
  });
  window.addEventListener('pointermove', function (e) {
    if (!orbit.isDragging) return;
    var dx = (e.clientX - orbit.prevMouse.x) * 0.005;
    var dy = (e.clientY - orbit.prevMouse.y) * 0.005;
    orbit.deltaTheta -= dx;
    orbit.deltaPhi -= dy;
    orbit.deltaPhi = Math.max(-0.4, Math.min(0.4, orbit.deltaPhi));
    orbit.prevMouse.x = e.clientX;
    orbit.prevMouse.y = e.clientY;
  });
  window.addEventListener('pointerup', function () {
    orbit.isDragging = false;
    orbit.lastInteraction = performance.now();
  });
  renderer.domElement.addEventListener('wheel', function (e) {
    e.preventDefault();
    orbit.lastInteraction = performance.now();
    orbit.deltaRadius += e.deltaY * 0.005;
  }, { passive: false });
  renderer.domElement.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      orbit.isDragging = true;
      orbit.prevMouse.x = e.touches[0].clientX;
      orbit.prevMouse.y = e.touches[0].clientY;
      orbit.lastInteraction = performance.now();
    }
  }, { passive: true });

  // ---- Animation ----
  var isRendering = true;

  function animate(timestamp) {
    if (!isRendering) return;
    requestAnimationFrame(animate);

    var t = timestamp * 0.001;
    orbitUpdate();

    // Product float + orbit
    products.forEach(function (p, i) {
      var floatY = Math.sin(t * 1.3 + i * 0.8) * 0.08;
      p.position.y = p.userData.baseY + floatY;

      // Orbit around platform center
      var a = p.userData.angle + t * 0.18;
      p.position.x = Math.cos(a) * p.userData.baseRadius;
      p.position.z = Math.sin(a) * p.userData.baseRadius;

      // Self-rotation
      p.rotation.y += 0.006 + i * 0.002;
    });

    // Rim glow pulse
    rim.material.emissiveIntensity = 0.25 + Math.sin(t * 2.2) * 0.1;

    renderer.render(scene, camera);
  }

  // ---- IntersectionObserver ----
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        isRendering = true;
        orbit.enabled = true;
        requestAnimationFrame(animate);
      } else {
        isRendering = false;
        orbit.enabled = false;
      }
    });
  }, { threshold: 0.15 });
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
