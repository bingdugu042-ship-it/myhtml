/**
 * 暖木星 — 3D 暖色漂浮几何体背景 v2
 * Three.js 渲染，120+ 几何体在宽深 3D 空间中漂浮
 * 三层深度视差 + 摄像头倾斜响应（window.bgTiltX / window.bgTiltY）
 * ES5, 全屏固定, z-index:0, pointer-events:none
 */
(function () {
  'use strict';

  // Abort if user prefers reduced motion or Three.js is missing
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;

  var isMobile = window.innerWidth < 768;

  // ========== Canvas & Renderer ==========
  var canvas = document.createElement('canvas');
  canvas.id = 'bg-particles';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
  document.body.prepend(canvas);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  canvas.replaceWith(renderer.domElement);
  renderer.domElement.id = 'bg-particles';
  renderer.domElement.style.cssText = canvas.style.cssText;

  // ========== Scene & Camera ==========
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 80);
  camera.position.set(0, 0, 20);
  camera.lookAt(0, 0, 0);

  // ========== Warm Color Palette ==========
  var COLORS = [
    0xd59b75,  // copper
    0xd4a855,  // gold
    0xe8bbba,  // blush
    0xc08070,  // rose
    0xe5c8a0,  // light copper
    0xbfa060,  // muted gold
  ];

  // ========== Geometry Pool (12 types) ==========
  var latheProfile = [];
  for (var lp = 0; lp <= 10; lp++) {
    var la = lp / 10 * Math.PI;
    latheProfile.push(new THREE.Vector2(Math.sin(la) * 0.2 + 0.05, la * 0.03 - 0.12));
  }

  var geos = [
    new THREE.IcosahedronGeometry(0.12, 0),
    new THREE.OctahedronGeometry(0.10, 0),
    new THREE.TetrahedronGeometry(0.11, 0),
    new THREE.TorusGeometry(0.10, 0.035, 8, 6),
    new THREE.BoxGeometry(0.14, 0.14, 0.14),
    new THREE.ConeGeometry(0.08, 0.18, 6, 1),
    new THREE.DodecahedronGeometry(0.09, 0),
    new THREE.TorusKnotGeometry(0.07, 0.025, 32, 4),
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.RingGeometry(0.06, 0.14, 16, 1),
    new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8),
    new THREE.LatheGeometry(latheProfile, 12),
  ];

  function randGeo() { return geos[Math.floor(Math.random() * geos.length)]; }
  function randCol() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

  // ========== Layers ==========
  // Mobile: skip far layer, 80 shapes total
  var layers;
  if (isMobile) {
    layers = [
      { zMin: -8, zMax: -2, scMin: 0.8, scMax: 1.8, opMin: 0.20, opMax: 0.40, spd: 0.7, count: 48 },
      { zMin: -2, zMax:  3, scMin: 0.4, scMax: 1.0, opMin: 0.35, opMax: 0.55, spd: 1.0, count: 32 },
    ];
  } else {
    layers = [
      { zMin:-15, zMax: -8, scMin: 1.5, scMax: 3.0, opMin: 0.08, opMax: 0.18, spd: 0.4, count: 30 },
      { zMin: -8, zMax: -2, scMin: 0.8, scMax: 1.8, opMin: 0.20, opMax: 0.40, spd: 0.7, count: 50 },
      { zMin: -2, zMax:  3, scMin: 0.4, scMax: 1.0, opMin: 0.35, opMax: 0.55, spd: 1.0, count: 40 },
    ];
  }

  // ========== Build Objects ==========
  var objects = [];

  function createSolidMat(color, opacity) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: opacity,
    });
  }

  function createWireMat(color, opacity) {
    return new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: Math.min(opacity, 0.3),
    });
  }

  for (var li = 0; li < layers.length; li++) {
    var layer = layers[li];
    for (var si = 0; si < layer.count; si++) {
      var geo = randGeo();
      var col = randCol();
      var opacity = layer.opMin + Math.random() * (layer.opMax - layer.opMin);
      var mat;
      if (Math.random() < 0.2) {
        mat = createWireMat(col, opacity);
      } else {
        mat = createSolidMat(col, opacity);
      }
      var mesh = new THREE.Mesh(geo, mat);

      // Scale per layer
      var sc = layer.scMin + Math.random() * (layer.scMax - layer.scMin);
      mesh.scale.setScalar(sc);

      // Position: spread across wide 3D volume
      var baseX = (Math.random() - 0.5) * 50;          // X: -25 .. 25
      var baseZ = layer.zMin + Math.random() * (layer.zMax - layer.zMin);
      var baseY = -20 + Math.random() * 40;             // Y: -20 .. 20

      mesh.position.set(baseX, baseY, baseZ);
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      mesh.userData = {
        speedY:   (0.002 + Math.random() * 0.008) * layer.spd,
        rotX:     (Math.random() - 0.5) * 0.012 * layer.spd,
        rotY:     (Math.random() - 0.5) * 0.012 * layer.spd,
        rotZ:     (Math.random() - 0.5) * 0.008 * layer.spd,
        wobAmp:   0.3 + Math.random() * 1.2,
        wobSpd:   (0.001 + Math.random() * 0.005) * layer.spd,
        wobPh:    Math.random() * Math.PI * 2,
        baseX:    baseX,
        baseZ:    baseZ,
        topY:     20,
        bottomY:  -20,
        pulsePh:  Math.random() * Math.PI * 2,
        pulseSpd: (0.8 + Math.random() * 1.6) * layer.spd,
        isWire:   mat.wireframe === true,
      };

      scene.add(mesh);
      objects.push(mesh);
    }
  }

  // ========== Lighting ==========
  scene.add(new THREE.AmbientLight(0x1a1020, 2.5));
  var ptLight = new THREE.PointLight(0xd59b75, 3, 35, 2);
  ptLight.position.set(0, 0, 5);
  scene.add(ptLight);

  // ========== Animation Loop ==========
  function animate(ts) {
    requestAnimationFrame(animate);

    var t = ts * 0.001;

    // Camera tilt from external script (device motion / scroll)
    var tiltX = Math.max(-1, Math.min(1, window.bgTiltX || 0));
    var tiltY = Math.max(-1, Math.min(1, window.bgTiltY || 0));
    camera.position.set(0, 0, 20);
    camera.lookAt(tiltX * 8, tiltY * 5, 0);

    for (var i = 0; i < objects.length; i++) {
      var o = objects[i];
      var d = o.userData;

      // Upward drift — wrap around at boundaries
      o.position.y += d.speedY;
      if (o.position.y > d.topY) o.position.y = d.bottomY;

      // Horizontal wandering (X + Z)
      o.position.x = d.baseX + Math.sin(t * d.wobSpd * 10 + d.wobPh) * d.wobAmp;
      o.position.z = d.baseZ + Math.cos(t * d.wobSpd * 8 + d.wobPh + 1) * d.wobAmp * 0.6;

      // 3-axis rotation
      o.rotation.x += d.rotX;
      o.rotation.y += d.rotY;
      o.rotation.z += d.rotZ;

      // Emissive pulsation (range 0.15 – 0.50)
      if (!d.isWire && o.material.emissiveIntensity !== undefined) {
        o.material.emissiveIntensity = 0.325 + Math.sin(t * d.pulseSpd + d.pulsePh) * 0.175;
      }
    }

    renderer.render(scene, camera);
  }

  // ========== Resize Handler ==========
  function onResize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // ========== Start ==========
  requestAnimationFrame(animate);
})();
