(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function initMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!button || !nav) return;
    button.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) return;
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });

    show(0);
    restart();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
    panels.forEach(function (panel) {
      var input = panel.querySelector('[data-filter-input]');
      var region = panel.querySelector('[data-filter-region]');
      var year = panel.querySelector('[data-filter-year]');
      var type = panel.querySelector('[data-filter-type]');
      var grid = document.querySelector('[data-filter-grid]');
      if (!grid) return;
      var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-movie-card]'));

      function apply() {
        var q = input ? input.value.trim().toLowerCase() : '';
        var r = region ? region.value : '';
        var y = year ? year.value : '';
        var t = type ? type.value : '';
        cards.forEach(function (card) {
          var text = card.getAttribute('data-text') || '';
          var ok = true;
          if (q && text.indexOf(q) === -1) ok = false;
          if (r && card.getAttribute('data-region') !== r) ok = false;
          if (y && card.getAttribute('data-year') !== y) ok = false;
          if (t && card.getAttribute('data-type') !== t) ok = false;
          card.classList.toggle('hidden', !ok);
        });
      }

      if (input) input.addEventListener('input', apply);
      if (region) region.addEventListener('change', apply);
      if (year) year.addEventListener('change', apply);
      if (type) type.addEventListener('change', apply);

      var params = new URLSearchParams(window.location.search);
      var preset = params.get('q');
      if (preset && input) {
        input.value = preset;
      }
      apply();
    });
  }

  window.setupPlayer = function (options) {
    var video = document.getElementById(options.videoId);
    var cover = document.getElementById(options.coverId);
    if (!video || !cover || !options.url) return;
    var player = null;
    var prepared = false;

    function prepare() {
      if (prepared) return;
      prepared = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = options.url;
      } else if (window.Hls && window.Hls.isSupported()) {
        player = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        player.loadSource(options.url);
        player.attachMedia(video);
      } else {
        video.src = options.url;
      }
    }

    function play() {
      prepare();
      cover.classList.add('hidden');
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          cover.classList.remove('hidden');
        });
      }
    }

    cover.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) play();
    });
    video.addEventListener('play', function () {
      cover.classList.add('hidden');
    });
    video.addEventListener('pause', function () {
      if (!video.ended) cover.classList.remove('hidden');
    });
    window.addEventListener('beforeunload', function () {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    });
  };

  ready(function () {
    initMenu();
    initHero();
    initFilters();
  });
})();
