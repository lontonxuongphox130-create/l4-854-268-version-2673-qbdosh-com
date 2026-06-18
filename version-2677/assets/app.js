(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function initMenu() {
    var toggle = $('[data-menu-toggle]');
    var panel = $('[data-nav-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function initSlider() {
    var root = $('[data-slider]');
    if (!root) {
      return;
    }
    var slides = $$('[data-slide]', root);
    var dots = $$('[data-slide-dot]', root);
    var thumbs = $$('[data-slide-thumb]', root);
    var prev = $('[data-slide-prev]', root);
    var next = $('[data-slide-next]', root);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
      thumbs.forEach(function (thumb, i) {
        thumb.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('mouseenter', function () {
        show(i);
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    var input = $('[data-filter-input]');
    var year = $('[data-filter-year]');
    var cards = $$('[data-card]');
    if (!cards.length || (!input && !year)) {
      return;
    }

    function apply() {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var selectedYear = year ? year.value : '';
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-title') || '').toLowerCase();
        var cardYear = card.getAttribute('data-year') || '';
        var matchKeyword = !keyword || text.indexOf(keyword) >= 0;
        var matchYear = !selectedYear || cardYear === selectedYear;
        card.style.display = matchKeyword && matchYear ? '' : 'none';
      });
    }

    if (input) {
      input.addEventListener('input', apply);
    }
    if (year) {
      year.addEventListener('change', apply);
    }
  }

  function movieCard(movie) {
    var tags = Array.isArray(movie.tags) ? movie.tags.slice(0, 3).map(escapeHtml).join(' · ') : '';
    return '' +
      '<article class="video-card movie-card">' +
        '<a href="' + escapeHtml(movie.url) + '" aria-label="' + escapeHtml(movie.title) + '">' +
          '<span class="poster-wrap">' +
            '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
            '<span class="poster-shade"></span>' +
            '<span class="card-badge">' + escapeHtml(movie.category) + '</span>' +
            '<span class="card-duration">' + escapeHtml(movie.duration) + '</span>' +
            '<span class="play-ring">▶</span>' +
          '</span>' +
          '<span class="card-body">' +
            '<strong class="line-clamp-1">' + escapeHtml(movie.title) + '</strong>' +
            '<span class="card-desc line-clamp-2">' + escapeHtml(movie.summary) + '</span>' +
            '<span class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>★ ' + escapeHtml(movie.rating) + '</span></span>' +
            (tags ? '<span class="card-desc line-clamp-1">' + tags + '</span>' : '') +
          '</span>' +
        '</a>' +
      '</article>';
  }

  function initSearchPage() {
    var results = $('[data-search-results]');
    var form = $('[data-search-form]');
    var input = $('[data-search-input]');
    if (!results || !window.SiteMovies) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    if (input) {
      input.value = query;
    }

    function render(value) {
      var keyword = String(value || '').trim().toLowerCase();
      if (!keyword) {
        results.innerHTML = '<div class="empty-state">输入片名、类型、地区或标签即可查找内容。</div>';
        return;
      }
      var matched = window.SiteMovies.filter(function (movie) {
        var blob = [movie.title, movie.category, movie.year, movie.region, movie.genre, movie.summary, (movie.tags || []).join(' ')].join(' ').toLowerCase();
        return blob.indexOf(keyword) >= 0;
      }).slice(0, 120);
      if (!matched.length) {
        results.innerHTML = '<div class="empty-state">未找到相关影片，换个关键词试试。</div>';
        return;
      }
      results.innerHTML = '<div class="movie-grid">' + matched.map(movieCard).join('') + '</div>';
    }

    if (form && input) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var value = input.value.trim();
        var nextUrl = value ? './search.html?q=' + encodeURIComponent(value) : './search.html';
        window.history.replaceState(null, '', nextUrl);
        render(value);
      });
      input.addEventListener('input', function () {
        render(input.value);
      });
    }
    render(query);
  }

  function initPlayers() {
    $$('.movie-player').forEach(function (video) {
      var shell = video.closest('.player-shell');
      var button = shell ? $('.player-start', shell) : null;
      var status = shell ? $('.player-status', shell) : null;
      var src = video.getAttribute('data-play');
      var hls = null;
      var ready = false;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function prepare() {
        if (ready || !src) {
          return;
        }
        ready = true;
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus('准备就绪');
          });
          hls.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (!data || !data.fatal) {
              return;
            }
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              setStatus('网络波动，正在重连');
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              setStatus('播放恢复中');
              hls.recoverMediaError();
            } else {
              setStatus('播放暂时不可用');
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          setStatus('准备就绪');
        } else {
          setStatus('播放暂时不可用');
        }
      }

      function play() {
        prepare();
        var promise = video.play();
        if (promise && promise.catch) {
          promise.catch(function () {
            setStatus('点击画面继续播放');
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

      if (button) {
        button.addEventListener('click', toggle);
      }
      video.addEventListener('click', toggle);
      video.addEventListener('play', function () {
        if (button) {
          button.classList.add('is-hidden');
        }
        setStatus('正在播放');
      });
      video.addEventListener('pause', function () {
        if (button) {
          button.classList.remove('is-hidden');
        }
        setStatus('已暂停');
      });
      video.addEventListener('ended', function () {
        if (button) {
          button.classList.remove('is-hidden');
        }
        setStatus('播放结束');
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initSlider();
    initFilters();
    initSearchPage();
    initPlayers();
  });
})();
