/**
 * 暖木星 — Section Floating 3D Accents. One shared scene, 6 shapes, z-index: 1.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---- Canvas + Renderer ----
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;';
  document.body.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 50);
  camera.position.z = 10;

  // ---- Lighting ----
  scene.add(new THREE.AmbientLight(0x2a1a2e, 2.5));
  var dirLight = new THREE.DirectionalLight(0xd59b75, 2.5);
  dirLight.position.set(1, 1, 3);
  scene.add(dirLight);

  // ---- Warm copper colors (cycle) ----
  var COLORS = [0xd59b75, 0xd4a855, 0xe8bbba];
  var colorIdx = 0;

  function makeMat(color) {
    return new THREE.MeshStandardMaterial({
      color: color, emissive: color, emissiveIntensity: 0.35,
      roughness: 0.4, metalness: 0.25,
    });
  }

  // ---- Screen → World ----
  function screenToWorld(sx, sy) {
    var vh = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360);
    var vw = vh * (window.innerWidth / window.innerHeight);
    return { x: (sx / window.innerWidth - 0.5) * vw, y: (0.5 - sy / window.innerHeight) * vh };
  }

  // ---- Shape definitions ----
  var isMobile = window.innerWidth < 768;

  var defs = [
    { id: 'brand-split', el: null, geo: new THREE.IcosahedronGeometry(isMobile ? 0.13 : 0.18, 0),
      anchor: function (r) { return { x: r.right + 10, y: r.top + r.height * 0.3 }; },
      offX: 2.6, offY: -1.2, mobile: true },
    { id: 'gallery', el: null, geo: new THREE.TorusGeometry(isMobile ? 0.10 : 0.14, isMobile ? 0.03 : 0.04, 12, 8),
      anchor: function (r) { return { x: r.right + 5, y: r.top + r.height * 0.45 }; },
      offX: 4.5, offY: -0.2, mobile: true },
    { id: 'nfc', el: null, geo: new THREE.OctahedronGeometry(isMobile ? 0.11 : 0.16, 0),
      anchor: function (r) { return { x: r.right + 5, y: r.top + r.height * 0.45 }; },
      offX: 4.2, offY: 0.0, mobile: true },
    { id: 'pricing', el: null, geo: new THREE.DodecahedronGeometry(isMobile ? 0.10 : 0.15, 0),
      anchor: function (r) { return { x: r.right + 5, y: r.top + r.height * 0.5 }; },
      offX: 3.8, offY: 0.0, mobile: false },
    { id: 'story', el: null, geo: new THREE.TorusKnotGeometry(isMobile ? 0.07 : 0.10, isMobile ? 0.02 : 0.03, 40, 6),
      anchor: function (r) { return { x: r.right + 5, y: r.top + r.height * 0.5 }; },
      offX: 3.5, offY: -0.4, mobile: false },
    { id: 'contact', el: null, geo: new THREE.IcosahedronGeometry(isMobile ? 0.10 : 0.14, 0),
      anchor: function (r) { return { x: r.right + 5, y: r.top + r.height * 0.4 }; },
      offX: 3.6, offY: 0.0, mobile: false },
  ];

  // ---- Create shapes ----
  var shapes = [];
  defs.forEach(function (def) {
    if (isMobile && !def.mobile) return;
    var el = document.getElementById(def.id);
    if (!el) return;
    var h2 = el.querySelector('h2');
    var heading = el.querySelector('.brand-grid,.gallery-header,.nfc-header,.contact-header');
    def.el = heading || h2 || el;

    var mesh = new THREE.Mesh(def.geo, makeMat(COLORS[colorIdx++ % 3]));
    mesh.userData = {
      def: def, active: false, targetX: 0, targetY: 0,
      speed: 0.5 + Math.random() * 0.4,
      rx: (Math.random() - 0.5) * 0.012, ry: (Math.random() - 0.5) * 0.016,
      rz: (Math.random() - 0.5) * 0.009, phase: Math.random() * Math.PI * 2,
    };
    mesh.visible = false;
    mesh.position.set(0, -999, 0);
    scene.add(mesh);
    shapes.push(mesh);
  });

  // ---- Update world positions from section DOM rects ----
  function refreshPositions() {
    shapes.forEach(function (mesh) {
      var def = mesh.userData.def;
      if (!def.el) return;
      var r = def.el.getBoundingClientRect();
      var a = def.anchor(r);
      var w = screenToWorld(a.x, a.y);
      mesh.userData.targetX = w.x + def.offX * (isMobile ? 0.65 : 1);
      mesh.userData.targetY = w.y + def.offY;
    });
  }

  // ---- IntersectionObserver (only animate visible sections) ----
  var visible = {};
  defs.forEach(function (def) {
    if (isMobile && !def.mobile) return;
    var el = document.getElementById(def.id);
    if (!el) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[def.id] = entry.isIntersecting; });
    }, { threshold: 0.08 });
    obs.observe(el);
  });

  // ---- Render loop ----
  function animate(ts) {
    requestAnimationFrame(animate);
    var t = ts * 0.001;
    refreshPositions();

    shapes.forEach(function (mesh) {
      var ud = mesh.userData;
      var vis = visible[ud.def.id];

      if (vis) {
        if (!ud.active) {
          mesh.position.x = ud.targetX;
          mesh.position.y = ud.targetY;
          ud.active = true;
        }
        mesh.visible = true;

        // Y oscillation ±0.3 + smooth follow
        var ty = ud.targetY + Math.sin(t * ud.speed + ud.phase) * 0.3;
        mesh.position.x += (ud.targetX - mesh.position.x) * 0.1;
        mesh.position.y += (ty - mesh.position.y) * 0.1;

        // Rotate all 3 axes
        mesh.rotation.x += ud.rx;
        mesh.rotation.y += ud.ry;
        mesh.rotation.z += ud.rz;

        // Emissive pulse 0.25–0.45
        mesh.material.emissiveIntensity = 0.35 + Math.sin(t * 2.5 + ud.phase) * 0.10;
      } else {
        ud.active = false;
        mesh.visible = false;
      }
    });

    renderer.render(scene, camera);
  }

  // ---- Resize ----
  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    refreshPositions();
  }
  window.addEventListener('resize', onResize);

  // ---- Start ----
  refreshPositions();
  requestAnimationFrame(animate);
})();
