(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.querySelector("[data-nav-menu]");

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupSearchForms() {
    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (!input || !input.value.trim()) {
          event.preventDefault();
        }
      });
    });
  }

  function setupHeroSlider() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupFilterGrid() {
    var grid = document.querySelector("[data-filter-grid]");
    if (!grid) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-card]"));
    var textInput = document.querySelector("[data-filter-input]");
    var yearInput = document.querySelector("[data-filter-year]");
    var categorySelect = document.querySelector("[data-filter-category]");
    var count = document.querySelector("[data-filter-count]");

    function applyFilters() {
      var text = normalize(textInput && textInput.value);
      var year = normalize(yearInput && yearInput.value);
      var category = categorySelect ? categorySelect.value : "all";
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-keywords"));
        var cardYear = normalize(card.getAttribute("data-year"));
        var cardCategory = card.getAttribute("data-category");
        var matchesText = !text || haystack.indexOf(text) !== -1;
        var matchesYear = !year || cardYear.indexOf(year) !== -1;
        var matchesCategory = !category || category === "all" || category === cardCategory;
        var shouldShow = matchesText && matchesYear && matchesCategory;

        card.style.display = shouldShow ? "" : "none";
        if (shouldShow) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = "当前显示 " + visible + " 部";
      }
    }

    [textInput, yearInput, categorySelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilters);
        control.addEventListener("change", applyFilters);
      }
    });

    applyFilters();
  }

  function movieCardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHTML(tag) + "</span>";
    }).join("");

    return [
      "<article class=\"video-card movie-card\">",
      "  <a class=\"card-poster-link\" href=\"" + escapeHTML(movie.detail_url) + "\" aria-label=\"观看 " + escapeHTML(movie.title) + "\">",
      "    <div class=\"poster-wrap\" data-title=\"" + escapeHTML(movie.title) + "\">",
      "      <img src=\"./" + escapeHTML(movie.image) + "\" alt=\"" + escapeHTML(movie.title) + "\" loading=\"lazy\" onerror=\"this.classList.add('is-missing'); this.parentElement.classList.add('image-missing');\">",
      "    </div>",
      "    <span class=\"card-badge\">" + escapeHTML(movie.type) + "</span>",
      "    <span class=\"card-duration\">" + escapeHTML(movie.duration) + "</span>",
      "  </a>",
      "  <div class=\"card-body\">",
      "    <div class=\"card-meta\"><span>" + escapeHTML(movie.region) + "</span><span>" + escapeHTML(movie.year) + "</span><span>" + escapeHTML(movie.category) + "</span></div>",
      "    <h3><a href=\"" + escapeHTML(movie.detail_url) + "\">" + escapeHTML(movie.title) + "</a></h3>",
      "    <p>" + escapeHTML(movie.one_line) + "</p>",
      "    <div class=\"tag-row\">" + tags + "</div>",
      "    <div class=\"card-actions\"><span class=\"rating\">★ " + escapeHTML(movie.rating) + "</span><a href=\"" + escapeHTML(movie.detail_url) + "\">立即播放</a></div>",
      "  </div>",
      "</article>"
    ].join("");
  }

  function setupSearchPage() {
    var results = document.querySelector("[data-search-results]");
    if (!results || !window.MOVIE_DATA) {
      return;
    }

    var status = document.querySelector("[data-search-status]");
    var input = document.querySelector("[data-search-page-input]");
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";

    if (input) {
      input.value = query;
      input.addEventListener("input", function () {
        render(input.value);
      });
    }

    function render(value) {
      var q = normalize(value);
      var data = window.MOVIE_DATA || [];
      var matched = q
        ? data.filter(function (movie) {
            var haystack = normalize([
              movie.title,
              movie.region,
              movie.type,
              movie.year,
              movie.genre,
              movie.category,
              (movie.tags || []).join(" "),
              movie.one_line
            ].join(" "));
            return haystack.indexOf(q) !== -1;
          })
        : data.slice(0, 48);

      results.innerHTML = matched.slice(0, 240).map(movieCardTemplate).join("");
      if (status) {
        status.textContent = q
          ? "搜索 “" + value + "” 找到 " + matched.length + " 部，当前展示前 " + Math.min(matched.length, 240) + " 部。"
          : "未输入关键词，当前展示 48 部推荐内容。";
      }
    }

    render(query);
  }

  ready(function () {
    setupNavigation();
    setupSearchForms();
    setupHeroSlider();
    setupFilterGrid();
    setupSearchPage();
  });
})();
