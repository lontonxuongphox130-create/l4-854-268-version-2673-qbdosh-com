(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupSearchForms() {
    document.querySelectorAll(".js-search-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        var value = input ? input.value.trim() : "";
        if (!value) {
          event.preventDefault();
          if (input) {
            input.focus();
          }
        }
      });
    });
  }

  function setupMobileMenu() {
    var toggle = document.querySelector(".js-mobile-toggle");
    var panel = document.querySelector(".js-mobile-panel");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var root = document.querySelector(".js-hero-carousel");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".hero-dot"));
    if (slides.length < 2) {
      return;
    }
    var current = 0;
    function show(index) {
      current = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
      });
    });
    setInterval(function () {
      show((current + 1) % slides.length);
    }, 5000);
  }

  function setupFilters() {
    var searchInput = document.querySelector(".js-page-search");
    var yearFilter = document.querySelector(".js-year-filter");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".js-movie-card"));
    if (!cards.length || (!searchInput && !yearFilter)) {
      return;
    }
    function apply() {
      var keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var year = yearFilter ? yearFilter.value : "";
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title") || "",
          card.getAttribute("data-tags") || "",
          card.getAttribute("data-region") || ""
        ].join(" ").toLowerCase();
        var cardYear = card.getAttribute("data-year") || "";
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchYear = !year || cardYear === year;
        card.classList.toggle("is-hidden", !(matchKeyword && matchYear));
      });
    }
    if (searchInput) {
      searchInput.addEventListener("input", apply);
    }
    if (yearFilter) {
      yearFilter.addEventListener("change", apply);
    }
  }

  ready(function () {
    setupSearchForms();
    setupMobileMenu();
    setupHero();
    setupFilters();
  });
})();
