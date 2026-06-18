(() => {
  const body = document.body;
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      mobileNav.classList.toggle('is-open');
      body.classList.toggle('menu-open');
    });
  }

  const carousel = document.querySelector('[data-hero-carousel]');
  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
    const prev = carousel.querySelector('[data-hero-prev]');
    const next = carousel.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    const showSlide = (index) => {
      if (!slides.length) return;
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    };

    const start = () => {
      stop();
      timer = window.setInterval(() => showSlide(current + 1), 5200);
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
    };

    prev?.addEventListener('click', () => {
      showSlide(current - 1);
      start();
    });

    next?.addEventListener('click', () => {
      showSlide(current + 1);
      start();
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        start();
      });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    showSlide(0);
    start();
  }

  const filterScope = document.querySelector('[data-filter-scope]');
  if (filterScope) {
    const searchInput = filterScope.querySelector('[data-card-search]');
    const yearSelect = filterScope.querySelector('[data-card-year]');
    const sortSelect = filterScope.querySelector('[data-card-sort]');
    const list = filterScope.querySelector('[data-card-list]');
    const count = filterScope.querySelector('[data-card-count]');
    const cards = Array.from(filterScope.querySelectorAll('.movie-card'));

    const applyFilters = () => {
      const keyword = (searchInput?.value || '').trim().toLowerCase();
      const year = yearSelect?.value || '';
      let visible = cards.filter((card) => {
        const text = [
          card.dataset.title,
          card.dataset.region,
          card.dataset.genre,
          card.dataset.category,
          card.dataset.year,
          card.textContent
        ].join(' ').toLowerCase();
        const matchesKeyword = !keyword || text.includes(keyword);
        const matchesYear = !year || card.dataset.year === year;
        return matchesKeyword && matchesYear;
      });

      const sortValue = sortSelect?.value || 'default';
      if (sortValue === 'rating') {
        visible = visible.sort((a, b) => {
          const ra = parseFloat(a.querySelector('.rating-badge')?.textContent.replace(/[★\s]/g, '') || '0');
          const rb = parseFloat(b.querySelector('.rating-badge')?.textContent.replace(/[★\s]/g, '') || '0');
          return rb - ra;
        });
      }
      if (sortValue === 'year') {
        visible = visible.sort((a, b) => Number(b.dataset.year || 0) - Number(a.dataset.year || 0));
      }

      cards.forEach((card) => {
        card.hidden = !visible.includes(card);
      });
      visible.forEach((card) => list?.appendChild(card));
      if (count) count.textContent = String(visible.length);
    };

    searchInput?.addEventListener('input', applyFilters);
    yearSelect?.addEventListener('change', applyFilters);
    sortSelect?.addEventListener('change', applyFilters);
  }

  const player = document.querySelector('[data-player]');
  if (player) {
    const video = player.querySelector('video');
    const playButton = player.querySelector('[data-video-play]');
    const message = player.querySelector('[data-video-message]');
    const source = video?.dataset.hlsSrc;
    let hls = null;

    const setMessage = (text) => {
      if (message) message.textContent = text || '';
    };

    const setupHls = () => {
      if (!video || !source) return;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, (_, data) => {
          if (!data || !data.fatal) return;
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            setMessage('网络加载异常，正在尝试恢复播放。');
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            setMessage('媒体解析异常，正在尝试恢复播放。');
            hls.recoverMediaError();
          } else {
            setMessage('播放器暂时无法加载该播放源。');
            hls.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else {
        setMessage('当前浏览器不支持 HLS 播放，请更换浏览器或启用 HLS 支持。');
      }
    };

    setupHls();

    playButton?.addEventListener('click', async () => {
      if (!video) return;
      try {
        await video.play();
        playButton.classList.add('is-hidden');
        setMessage('');
      } catch (error) {
        setMessage('播放启动失败，请再次点击播放器或检查浏览器自动播放限制。');
      }
    });

    video?.addEventListener('play', () => playButton?.classList.add('is-hidden'));
    video?.addEventListener('pause', () => playButton?.classList.remove('is-hidden'));
    window.addEventListener('beforeunload', () => hls?.destroy());
  }

  const searchResults = document.querySelector('[data-search-results]');
  if (searchResults && window.MOVIES_INDEX) {
    const params = new URLSearchParams(window.location.search);
    const query = (params.get('q') || '').trim();
    const input = document.querySelector('[data-search-page-input]');
    const status = document.querySelector('[data-search-status]');

    if (input) input.value = query;

    const renderCard = (movie) => {
      const tags = movie.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
      return `
        <article class="movie-card movie-card-compact">
          <a href="${movie.detailUrl}" class="movie-card-link">
            <div class="poster-frame">
              <img src="${movie.cover}" alt="${escapeHtml(movie.title)} 海报" loading="lazy">
              <span class="rating-badge">★ ${movie.rating}</span>
              <span class="type-badge">${escapeHtml(movie.type)}</span>
            </div>
            <div class="movie-card-body">
              <h3>${escapeHtml(movie.title)}</h3>
              <p>${escapeHtml(movie.oneLine)}</p>
              <div class="movie-meta-line">
                <span>${escapeHtml(movie.year)}</span>
                <span>${escapeHtml(movie.region)}</span>
                <span>${escapeHtml(movie.category)}</span>
              </div>
              <div class="tag-row">${tags}</div>
            </div>
          </a>
        </article>`;
    };

    const doSearch = () => {
      if (!query) {
        if (status) status.textContent = '请输入关键词开始搜索。';
        return;
      }
      const lower = query.toLowerCase();
      const matches = window.MOVIES_INDEX.filter((movie) => {
        const text = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.category,
          movie.oneLine,
          movie.tags.join(' ')
        ].join(' ').toLowerCase();
        return text.includes(lower);
      });
      if (status) status.textContent = `找到 ${matches.length} 条与“${query}”相关的影片。`;
      searchResults.innerHTML = matches.slice(0, 240).map(renderCard).join('');
      if (matches.length > 240 && status) {
        status.textContent += ' 当前显示前 240 条，请使用更精确的关键词缩小范围。';
      }
    };

    doSearch();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();
