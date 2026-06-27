(function() {
    'use strict';

    // Bail out if user prefers reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.bgTiltX = 0;
        window.bgTiltY = 0;
        return;
    }

    var targetX = 0, targetY = 0,
        currentX = 0, currentY = 0,
        permissionGranted = false,
        permissionPending = false,
        isMobile = false,
        sections = [];

    window.bgTiltX = 0;
    window.bgTiltY = 0;

    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    function lerp(a, b, t)  { return a + (b - a) * t; }

    function collectSections() {
        if (document.body) sections = document.querySelectorAll('section');
    }

    function applyParallax() {
        var xOff = (currentY * 8).toFixed(4),
            yOff = (currentX * -6).toFixed(4);
        for (var i = 0; i < sections.length; i++) {
            var el = sections[i];
            if (el) el.style.transform = 'translateX(' + xOff + 'px) translateY(' + yOff + 'px)';
        }
    }

    function onOrientation(e) {
        if (e.beta === null || e.gamma === null) return;
        isMobile = true;
        // beta -180..180 (front/back) clamped to -1..1 via /90
        targetX = clamp(e.beta / 90, -1, 1);
        // gamma -90..90 (left/right) clamped to -1..1 via /45
        targetY = clamp(e.gamma / 45, -1, 1);
    }

    function onMouse(e) {
        if (isMobile) return;
        var hw = window.innerWidth / 2, hh = window.innerHeight / 2;
        // Desktop: subtle mouse-driven tilt, max 0.25 range
        targetX = ((e.clientY - hh) / hh) * 0.25;
        targetY = ((e.clientX - hw) / hw) * 0.25;
    }

    function requestPermission() {
        if (typeof DeviceOrientationEvent === 'undefined') return;
        if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
            permissionGranted = true;
            window.addEventListener('deviceorientation', onOrientation);
            return;
        }
        if (permissionPending) return;
        permissionPending = true;
        DeviceOrientationEvent.requestPermission()
            .then(function(state) {
                permissionGranted = (state === 'granted');
                permissionPending = false;
                if (permissionGranted) window.addEventListener('deviceorientation', onOrientation);
            })
            .catch(function() { permissionPending = false; });
    }

    function onFirstTouch() {
        if (!permissionGranted && !permissionPending) requestPermission();
    }

    function tick() {
        currentX = lerp(currentX, targetX, 0.05);
        currentY = lerp(currentY, targetY, 0.05);
        window.bgTiltX = currentX;
        window.bgTiltY = currentY;
        if (sections.length) applyParallax();
        requestAnimationFrame(tick);
    }

    function init() {
        collectSections();
        if (typeof DeviceOrientationEvent !== 'undefined') {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                document.body.addEventListener('touchstart', onFirstTouch, { passive: true });
            } else {
                permissionGranted = true;
                window.addEventListener('deviceorientation', onOrientation);
            }
        }
        window.addEventListener('mousemove', onMouse, { passive: true });
        window.addEventListener('resize', collectSections, { passive: true });
        requestAnimationFrame(tick);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
