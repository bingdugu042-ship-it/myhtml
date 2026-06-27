/**
 * NFC 魔法 3D — 手机模型 + 4道暖金波纹 + NFC类型切换
 * 点击HTML卡片 → 屏幕变色 + 波纹爆发
 */
(function () {
  'use strict';

  var container = document.getElementById('nfc');
  if (!container) return;

  // ---- Canvas setup ----
  var canvas = document.getElementById('nfc-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'nfc-canvas';
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
  renderer.domElement.id = 'nfc-canvas';
  renderer.domElement.style.cssText = canvas.style.cssText;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 20);
  camera.position.set(0, 0.3, 5);
  camera.lookAt(0, -0.1, 0);

  var C = {
    copper: 0xd59b75,
    gold: 0xd4a855,
    blush: 0xe8bbba,
    rose: 0xc08070,
    warmWhite: 0xfaf0e0,
    deepBg: 0x1a1525,
  };

  // ---- Lighting ----
  scene.add(new THREE.AmbientLight(C.deepBg, 3.5));

  var keyLight = new THREE.DirectionalLight(C.warmWhite, 5);
  keyLight.position.set(2, 5, 6);
  scene.add(keyLight);

  var screenLight = new THREE.PointLight(0x352144, 15, 5, 1.5);
  screenLight.position.set(0, 0.8, 1.5);
  scene.add(screenLight);

  var goldGlint = new THREE.PointLight(C.gold, 8, 4, 2.5);
  goldGlint.position.set(0, -0.5, -1);
  scene.add(goldGlint);

  // ---- Phone Model ----
  var phoneGroup = new THREE.Group();

  // Body
  var bodyGeo = new THREE.BoxGeometry(0.78, 1.6, 0.08);
  var body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
    color: 0x1a1020, roughness: 0.25, metalness: 0.6,
  }));
  phoneGroup.add(body);

  // Screen
  var screenMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a14,
    roughness: 0.1, metalness: 0.3,
    emissive: 0x352144,
    emissiveIntensity: 0.7,
  });
  var screenGeo = new THREE.PlaneGeometry(0.68, 1.38);
  var screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.042;
  screen.name = 'phoneScreen';
  phoneGroup.add(screen);

  // Screen border — copper instead of blue-purple
  var frameGeo = new THREE.BoxGeometry(0.8, 1.62, 0.003);
  var frameMat = new THREE.MeshStandardMaterial({
    color: C.copper,
    roughness: 0.15, metalness: 0.75,
    emissive: C.rose,
    emissiveIntensity: 0.35,
  });
  var frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.z = 0.028;
  phoneGroup.add(frame);

  // NFC marker sphere
  var markerMat = new THREE.MeshStandardMaterial({
    color: C.gold,
    roughness: 0.12, metalness: 0.75,
    emissive: C.gold,
    emissiveIntensity: 0.55,
  });
  var markerGeo = new THREE.SphereGeometry(0.05, 16, 16);
  var marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.set(-0.15, 0.65, 0.045);
  marker.name = 'nfcMarker';
  phoneGroup.add(marker);

  scene.add(phoneGroup);

  // ---- 4 Warm Gold Ripple Rings ----
  var rings = [];
  for (var i = 0; i < 4; i++) {
    var ringGeo = new THREE.TorusGeometry(0.28 + i * 0.18, 0.012, 16, 80);
    var ringMat = new THREE.MeshStandardMaterial({
      color: C.gold,
      roughness: 0.18,
      metalness: 0.7,
      emissive: C.gold,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = -0.02;
    ring.userData = {
      baseScale: 1,
      scaleSpeed: 0.8 + i * 0.25,
      phase: i * Math.PI * 0.5,
      baseOpacity: 0.6,
      opacitySpeed: 0.6 + i * 0.2,
      baseEmissive: 0.45,
    };
    phoneGroup.add(ring);
    rings.push(ring);
  }

  // ---- NFC Type Config ----
  var nfcTypes = {
    archive: { emissive: 0x352144, label: '档案型',   hex: '#201040' },
    voice:   { emissive: 0x442211, label: '语音型',   hex: '#2a1810' },
    link:    { emissive: 0x1a2436, label: '链接型',   hex: '#101c28' },
    secret:  { emissive: 0x331a22, label: '密钥型',   hex: '#24101a' },
  };
  var currentType = 'archive';
  var isTransitioning = false;

  // Make NFC type setter globally accessible
  window.setNFCType = function (type) {
    if (!nfcTypes[type] || isTransitioning) return;
    isTransitioning = true;
    currentType = type;
    var cfg = nfcTypes[type];

    // Screen flash
    screenMat.emissive.set(cfg.emissive);
    screenMat.emissiveIntensity = 2.2;
    screenLight.color.set(cfg.emissive);
    screenLight.intensity = 30;

    // Marker flash
    markerMat.emissiveIntensity = 2.8;
    marker.scale.set(1.4, 1.4, 1.4);

    // Burst rings
    rings.forEach(function (r) {
      r.scale.set(1.6, 1.6, 1.6);
      r.material.opacity = 0.95;
      r.material.emissiveIntensity = 1.2;
    });

    // Decay to normal
    setTimeout(function () {
      screenMat.emissiveIntensity = 0.7;
      screenLight.intensity = 15;
      markerMat.emissiveIntensity = 0.55;
      marker.scale.set(1, 1, 1);
      rings.forEach(function (r) {
        r.material.opacity = r.userData.baseOpacity;
        r.material.emissiveIntensity = r.userData.baseEmissive;
      });
      isTransitioning = false;
    }, 800);
  };

  // ---- Bind NFC card clicks ----
  document.querySelectorAll('#nfc .nfc-card').forEach(function (card, i) {
    card.addEventListener('click', function () {
      var types = ['archive', 'voice', 'link', 'secret'];
      if (i < types.length) window.setNFCType(types[i]);
    });
  });

  // ---- Animation ----
  var isRendering = true;

  function animate(timestamp) {
    if (!isRendering) return;
    requestAnimationFrame(animate);

    var t = timestamp * 0.001;

    // Phone float
    phoneGroup.rotation.y = Math.sin(t * 0.5) * 0.25;
    phoneGroup.rotation.x = Math.sin(t * 0.4 + 0.5) * 0.1;
    phoneGroup.position.y = Math.sin(t * 0.6) * 0.15;

    // Ripple rings pulse
    rings.forEach(function (r) {
      var ud = r.userData;
      r.scale.setScalar(ud.baseScale + Math.sin(t * ud.scaleSpeed + ud.phase) * 0.1);
      r.material.opacity = ud.baseOpacity + Math.sin(t * ud.opacitySpeed + ud.phase) * 0.2;
      r.rotation.z += 0.005;
      r.rotation.x += 0.003;
    });

    // Marker pulse
    markerMat.emissiveIntensity = 0.45 + Math.sin(t * 2.5) * 0.3;

    // Frame glow pulse
    frameMat.emissiveIntensity = 0.3 + Math.sin(t * 3.0) * 0.12;

    // Screen emissive decay
    if (!isTransitioning && screenMat.emissiveIntensity > 0.75) {
      screenMat.emissiveIntensity -= 0.03;
    }

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
