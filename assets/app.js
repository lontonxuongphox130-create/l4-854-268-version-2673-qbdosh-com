(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  ready(function () {
    var toggle = document.querySelector(".nav-toggle");
    var mobileNav = document.querySelector(".mobile-nav");
    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        mobileNav.classList.toggle("is-open");
      });
    }

    document.querySelectorAll(".site-search").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input");
        var q = input ? input.value.trim() : "";
        var url = "./search.html";
        if (q) {
          url += "?q=" + encodeURIComponent(q);
        }
        window.location.href = url;
      });
    });

    var hero = document.querySelector("[data-hero]");
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
      var prev = hero.querySelector(".hero-prev");
      var next = hero.querySelector(".hero-next");
      var current = 0;
      var timer = null;

      function show(index) {
        if (!slides.length) {
          return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("active", i === current);
          slide.setAttribute("aria-hidden", i === current ? "false" : "true");
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle("active", i === current);
        });
      }

      function start() {
        window.clearInterval(timer);
        timer = window.setInterval(function () {
          show(current + 1);
        }, 5200);
      }

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
      dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
          show(index);
          start();
        });
      });
      show(0);
      start();
    }

    var wrap = document.querySelector("[data-filter-wrap]");
    if (wrap) {
      var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-item]"));
      var textInput = wrap.querySelector("[data-filter-text]");
      var yearSelect = wrap.querySelector("[data-filter-year]");
      var regionSelect = wrap.querySelector("[data-filter-region]");
      var typeSelect = wrap.querySelector("[data-filter-type]");
      var empty = document.querySelector(".empty-state");
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q") || "";
      if (q && textInput) {
        textInput.value = q;
      }

      function matches(card, query, year, region, type) {
        var pool = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-category"),
          card.getAttribute("data-tags")
        ].join(" "));
        var okText = !query || pool.indexOf(query) !== -1;
        var okYear = !year || normalize(card.getAttribute("data-year")) === normalize(year);
        var okRegion = !region || normalize(card.getAttribute("data-region")).indexOf(normalize(region)) !== -1;
        var okType = !type || normalize(card.getAttribute("data-type")).indexOf(normalize(type)) !== -1;
        return okText && okYear && okRegion && okType;
      }

      function apply() {
        var query = normalize(textInput ? textInput.value : "");
        var year = yearSelect ? yearSelect.value : "";
        var region = regionSelect ? regionSelect.value : "";
        var type = typeSelect ? typeSelect.value : "";
        var count = 0;
        cards.forEach(function (card) {
          var visible = matches(card, query, year, region, type);
          card.hidden = !visible;
          if (visible) {
            count += 1;
          }
        });
        if (empty) {
          empty.hidden = count !== 0;
        }
      }

      [textInput, yearSelect, regionSelect, typeSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
      apply();
    }
  });
})();
