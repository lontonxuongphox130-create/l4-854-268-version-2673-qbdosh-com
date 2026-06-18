(function () {
  function card(movie) {
    var title = escapeHtml(movie.title);
    var cover = escapeHtml(movie.cover);
    var url = escapeHtml(movie.url);
    var oneLine = escapeHtml(movie.oneLine || "");
    var year = escapeHtml(movie.year || "");
    var genre = escapeHtml(movie.genre || "");
    var type = escapeHtml(movie.type || "");
    var region = escapeHtml(movie.region || "");
    return [
      '<article class="movie-card">',
      '<a class="movie-cover" href="' + url + '" aria-label="观看' + title + '">',
      '<img src="' + cover + '" alt="' + title + '" loading="lazy">',
      '<span class="movie-type">' + type + '</span>',
      '<span class="movie-region">' + region + '</span>',
      '</a>',
      '<div class="movie-card-body">',
      '<h3><a href="' + url + '">' + title + '</a></h3>',
      '<p>' + oneLine + '</p>',
      '<div class="movie-meta"><span>' + year + '</span><span>' + genre + '</span></div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getQuery() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('q') || '').trim();
  }

  function render() {
    var form = document.querySelector('.js-search-page-form');
    var input = form ? form.querySelector("input[name='q']") : null;
    var results = document.querySelector('.js-search-results');
    var status = document.querySelector('.js-search-status');
    var data = window.MovieSearchData || [];
    var keyword = getQuery();

    if (input) {
      input.value = keyword;
    }

    if (!results || !status) {
      return;
    }

    if (!keyword) {
      status.textContent = '请输入关键词开始搜索';
      results.innerHTML = '';
      return;
    }

    var lowered = keyword.toLowerCase();
    var matched = data.filter(function (movie) {
      var text = [
        movie.title,
        movie.year,
        movie.region,
        movie.genre,
        movie.type,
        movie.oneLine,
        (movie.tags || []).join(' ')
      ].join(' ').toLowerCase();
      return text.indexOf(lowered) !== -1;
    });

    status.textContent = matched.length ? '搜索结果：' + keyword : '未找到相关影片：' + keyword;
    results.innerHTML = matched.slice(0, 200).map(card).join('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
