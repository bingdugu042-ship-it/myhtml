/**
 * 暖木星 官网 — 全局交互脚本
 * 导航栏滚动、加载屏、滚动揭示、图片淡入、视差效果
 */
(function () {
  'use strict';

  // ---- LOADER ----
  var loader = document.getElementById('loader');
  if (loader) {
    var maxWait = 4000;
    var resolved = false;

    function hideLoader() {
      if (resolved) return;
      resolved = true;
      loader.classList.add('hidden');
      loader.addEventListener('transitionend', function () {
        loader.remove();
      }, { once: true });
      document.documentElement.classList.add('loaded');
    }

    var images = Array.from(document.images);
    if (images.length) {
      var loadedCount = 0;
      images.forEach(function (img) {
        if (img.complete) {
          loadedCount++;
          if (loadedCount >= images.length) hideLoader();
        } else {
          img.addEventListener('load', function () {
            loadedCount++;
            if (loadedCount >= images.length) hideLoader();
          }, { once: true });
          img.addEventListener('error', function () {
            loadedCount++;
            if (loadedCount >= images.length) hideLoader();
          }, { once: true });
        }
      });
    } else {
      hideLoader();
    }
    setTimeout(hideLoader, maxWait);
  }

  // ---- NAVIGATION SCROLL ----
  var nav = document.getElementById('nav');
  if (nav) {
    var navLinks = nav.querySelectorAll('.links a');
    var ticking = false;
    var SCROLL_THRESHOLD = 60;

    function updateNav() {
      var scrollY = window.scrollY;
      nav.classList.toggle('compact', scrollY > SCROLL_THRESHOLD);

      // Find current section for active link
      var sections = document.querySelectorAll('section[id]');
      var current = '';
      sections.forEach(function (sec) {
        if (scrollY >= sec.offsetTop - 150) current = sec.id;
      });
      navLinks.forEach(function (link) {
        var href = link.getAttribute('href');
        link.classList.toggle('active', href === '#' + current);
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(updateNav);
        ticking = true;
      }
    }, { passive: true });

    // Smooth scroll for anchor links
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          var target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Smooth scroll for .btn[href^="#"] (CTA buttons)
    document.querySelectorAll('.btn[href^="#"]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(btn.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ---- IMAGE FADE-IN ----
  document.querySelectorAll('img.fade-in').forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', function () {
        img.classList.add('loaded');
      }, { once: true });
      img.addEventListener('error', function () {
        img.style.display = 'none';
      }, { once: true });
    }
  });

  // ---- SCROLL REVEAL (IntersectionObserver) ----
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!mq.matches) {
    var observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    };

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Reduced motion: show all immediately
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function (el) {
      el.classList.add('revealed');
    });
  }

})();
