/**
 * 暖木芯 — Card Tilt 3D
 * Shared transparent Three.js scene: warm copper glow behind hovered .glass-card
 * elements with subtle 3D perspective tilt. ES5. One scene, one renderer.
 * Load after Three.js: <script src="js/card-tilt-3d.js"></script>
 */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  // --- Config ---
  var TILT_RAD = 8 * Math.PI / 180;
  var PAD = 28, FADE = 0.09, FOLLOW = 0.13, DECAY = 0.88;
  var MAX_ACTIVE = 3;

  // --- Fullscreen transparent canvas (z:5, between bg canvases and content) ---
  var canvas = document.createElement('canvas');
  canvas.id = 'card-tilt-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
  document.body.appendChild(canvas);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(
    -window.innerWidth / 2, window.innerWidth / 2,
    window.innerHeight / 2, -window.innerHeight / 2, 0.1, 10
  );
  camera.position.z = 5;

  // --- Shared glow texture: rounded rect, warm copper gradient ---
  function createGlowTex() {
    var s = 256, c = document.createElement('canvas');
    c.width = s; c.height = s;
    var ctx = c.getContext('2d'), rr = 28;
    // Rounded rect clip
    ctx.beginPath();
    ctx.moveTo(rr, 0); ctx.lineTo(s - rr, 0); ctx.arcTo(s, 0, s, rr, rr);
    ctx.lineTo(s, s - rr); ctx.arcTo(s, s, s - rr, s, rr);
    ctx.lineTo(rr, s); ctx.arcTo(0, s, 0, s - rr, rr);
    ctx.lineTo(0, rr); ctx.arcTo(0, 0, rr, 0, rr);
    ctx.closePath(); ctx.clip();
    // Radial gradient: copper core -> gold mid -> rose edge -> transparent
    var grad = ctx.createRadialGradient(s / 2, s / 2, 18, s / 2, s / 2, 120);
    grad.addColorStop(0,    'rgba(213,155,117,0.95)');
    grad.addColorStop(0.3,  'rgba(213,155,117,0.6)');
    grad.addColorStop(0.55, 'rgba(212,168,85,0.35)');
    grad.addColorStop(0.8,  'rgba(232,187,186,0.1)');
    grad.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }
  var glowTex = createGlowTex();
  var sharedGeo = new THREE.PlaneGeometry(1, 1);

  // --- Active glow slots ---
  var slots = [];

  function findSlot(el) {
    for (var i = 0; i < slots.length; i++) { if (slots[i].el === el) return i; }
    return -1;
  }

  function makeMesh() {
    var mat = new THREE.MeshBasicMaterial({
      map: glowTex, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false, transparent: true, opacity: 0
    });
    var m = new THREE.Mesh(sharedGeo, mat);
    m.renderOrder = 999; scene.add(m);
    return m;
  }

  function getRect(el) {
    var r = el.getBoundingClientRect();
    return {
      cx: r.left + r.width / 2 - window.innerWidth / 2,
      cy: -(r.top + r.height / 2 - window.innerHeight / 2),
      w: r.width + PAD * 2, h: r.height + PAD * 2
    };
  }

  // --- Activate / deactivate ---
  function activate(el) {
    var idx = findSlot(el);
    if (idx >= 0) { slots[idx].targetOpacity = 0.5; return; }
    // Purge fully-faded slots
    var alive = [];
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].targetOpacity > 0.005 || slots[i].opacity > 0.005) alive.push(slots[i]);
    }
    slots = alive;
    if (slots.length >= MAX_ACTIVE) slots[0].targetOpacity = 0;
    var r = getRect(el), m = makeMesh();
    slots.push({ el: el, mesh: m, opacity: 0, targetOpacity: 0.5,
                 cx: r.cx, cy: r.cy, w: r.w, h: r.h, tiltX: 0, tiltY: 0 });
  }

  function deactivate(el) {
    var idx = findSlot(el);
    if (idx >= 0) slots[idx].targetOpacity = 0;
  }

  // --- Mouse handlers ---
  function onEnter() { activate(this); }
  function onMove(e) {
    var idx = findSlot(this);
    if (idx < 0) return;
    var s = slots[idx], r = this.getBoundingClientRect();
    var nx = ((e.clientX - r.left) / r.width)  * 2 - 1;
    var ny = ((e.clientY - r.top)  / r.height) * 2 - 1;
    s.tiltX = -ny * TILT_RAD;
    s.tiltY =  nx * TILT_RAD;
  }
  function onLeave() { deactivate(this); }

  // --- Bind to all .glass-card elements ---
  var cards = document.querySelectorAll('.glass-card');
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('mouseenter', onEnter);
    cards[i].addEventListener('mousemove',  onMove);
    cards[i].addEventListener('mouseleave', onLeave);
  }

  // --- IntersectionObserver: deactivate when card scrolls out of view ---
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) deactivate(entries[i].target);
      }
    }, { threshold: 0.05 });
    for (var j = 0; j < cards.length; j++) obs.observe(cards[j]);
  }

  // --- Resize ---
  window.addEventListener('resize', function () {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.left = -w / 2; camera.right = w / 2;
    camera.top = h / 2; camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  });

  // --- Initial size ---
  renderer.setSize(window.innerWidth, window.innerHeight);

  // --- Render loop: smooth follow, tilt decay, fade, cleanup ---
  function animate() {
    requestAnimationFrame(animate);
    var dirty = false;
    for (var i = slots.length - 1; i >= 0; i--) {
      var s = slots[i];
      s.opacity += (s.targetOpacity - s.opacity) * FADE;
      if (s.opacity < 0.004 && s.targetOpacity < 0.004) {
        scene.remove(s.mesh); s.mesh.material.dispose(); slots.splice(i, 1); continue;
      }
      var r = getRect(s.el);
      s.cx += (r.cx - s.cx) * FOLLOW; s.cy += (r.cy - s.cy) * FOLLOW;
      s.w  += (r.w  - s.w)  * FOLLOW; s.h  += (r.h  - s.h)  * FOLLOW;
      s.mesh.position.set(s.cx, s.cy, 0);
      s.mesh.scale.set(s.w, s.h, 1);
      s.mesh.rotation.x = s.tiltX; s.mesh.rotation.y = s.tiltY;
      s.mesh.material.opacity = s.opacity;
      s.tiltX *= DECAY; s.tiltY *= DECAY;
      dirty = true;
    }
    if (dirty) renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
