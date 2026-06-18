(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  qsa("[data-mobile-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var panel = qs("[data-mobile-panel]");
      if (panel) {
        panel.classList.toggle("is-open");
      }
    });
  });

  qsa("[data-search-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = qs("input[name='q']", form);
      var query = input ? input.value.trim() : "";
      var target = "./search.html";
      if (query) {
        target += "?q=" + encodeURIComponent(query);
      }
      window.location.href = target;
    });
  });

  function startHero() {
    var sliders = qsa("[data-hero-slider]");
    sliders.forEach(function (slider) {
      var slides = qsa("[data-hero-slide]", slider);
      var dots = qsa("[data-hero-dot]", slider);
      var prev = qs("[data-hero-prev]", slider);
      var next = qs("[data-hero-next]", slider);
      var index = 0;
      var timer = null;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === index);
        });
      }

      function play() {
        clearInterval(timer);
        timer = setInterval(function () {
          show(index + 1);
        }, 5000);
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          show(dotIndex);
          play();
        });
      });

      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          play();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          play();
        });
      }

      show(0);
      play();
    });
  }

  function startFiltering() {
    var panels = qsa("[data-filter-panel]");
    panels.forEach(function (panel) {
      var scopeSelector = panel.getAttribute("data-filter-panel");
      var scope = scopeSelector ? qs(scopeSelector) : document;
      if (!scope) {
        scope = document;
      }
      var cards = qsa("[data-filter-card]", scope);
      var input = qs("[data-filter-query]", panel);
      var type = qs("[data-filter-type]", panel);
      var region = qs("[data-filter-region]", panel);
      var year = qs("[data-filter-year]", panel);
      var empty = qs("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";

      if (input && initialQuery) {
        input.value = initialQuery;
      }

      function valueOf(node) {
        return node ? node.value.trim().toLowerCase() : "";
      }

      function apply() {
        var query = valueOf(input);
        var typeValue = valueOf(type);
        var regionValue = valueOf(region);
        var yearValue = valueOf(year);
        var visible = 0;

        cards.forEach(function (card) {
          var text = [
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-genre")
          ].join(" ").toLowerCase();
          var ok = true;

          if (query && text.indexOf(query) === -1) {
            ok = false;
          }
          if (typeValue && String(card.getAttribute("data-type") || "").toLowerCase() !== typeValue) {
            ok = false;
          }
          if (regionValue && String(card.getAttribute("data-region") || "").toLowerCase() !== regionValue) {
            ok = false;
          }
          if (yearValue && String(card.getAttribute("data-year") || "").toLowerCase() !== yearValue) {
            ok = false;
          }

          card.style.display = ok ? "" : "none";
          if (ok) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      [input, type, region, year].forEach(function (node) {
        if (node) {
          node.addEventListener("input", apply);
          node.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  function mountPlayer(options) {
    if (!options || !options.root) {
      return;
    }

    var root = options.root;
    var video = qs("video", root);
    var message = qs("[data-player-message]", root);
    var mute = qs("[data-player-mute]", root);
    var full = qs("[data-player-fullscreen]", root);
    var toggles = qsa("[data-player-toggle]", root);
    var hls = null;
    var ready = false;

    if (!video) {
      return;
    }

    video.poster = options.poster || video.poster;

    function showMessage(text) {
      if (message) {
        message.textContent = text;
        message.classList.add("is-visible");
      }
    }

    function prepare() {
      if (ready) {
        return;
      }
      ready = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(options.source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showMessage("播放失败，请重试");
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = options.source;
      } else {
        video.src = options.source;
      }
    }

    function play() {
      prepare();
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          showMessage("播放失败，请重试");
        });
      }
    }

    function toggle() {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    }

    toggles.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        toggle();
      });
    });

    video.addEventListener("click", toggle);
    video.addEventListener("play", function () {
      root.classList.add("is-playing");
    });
    video.addEventListener("pause", function () {
      root.classList.remove("is-playing");
    });
    video.addEventListener("error", function () {
      showMessage("播放失败，请重试");
    });

    if (mute) {
      mute.addEventListener("click", function () {
        video.muted = !video.muted;
        mute.textContent = video.muted ? "取消静音" : "静音";
      });
    }

    if (full) {
      full.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      });
    }
  }

  window.SitePlayer = {
    mount: mountPlayer
  };

  document.addEventListener("DOMContentLoaded", function () {
    startHero();
    startFiltering();
  });
})();
