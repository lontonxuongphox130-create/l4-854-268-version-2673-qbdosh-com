(function () {
    var menuToggle = document.querySelector('[data-menu-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuToggle && mobilePanel) {
        menuToggle.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
        });
    }

    var carousel = document.querySelector('[data-hero-carousel]');

    if (carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var prev = carousel.querySelector('[data-hero-prev]');
        var next = carousel.querySelector('[data-hero-next]');
        var index = 0;
        var timer;

        function showSlide(nextIndex) {
            if (!slides.length) {
                return;
            }

            index = (nextIndex + slides.length) % slides.length;

            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });

            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                showSlide(index + 1);
            }, 5200);
        }

        function restart() {
            window.clearInterval(timer);
            start();
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                showSlide(i);
                restart();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                showSlide(index - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                showSlide(index + 1);
                restart();
            });
        }

        start();
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    var filterInputs = Array.prototype.slice.call(document.querySelectorAll('[data-filter-input]'));
    var regionSelects = Array.prototype.slice.call(document.querySelectorAll('[data-filter-region]'));
    var typeSelects = Array.prototype.slice.call(document.querySelectorAll('[data-filter-type]'));
    var grids = Array.prototype.slice.call(document.querySelectorAll('[data-filter-grid]'));
    var emptyStates = Array.prototype.slice.call(document.querySelectorAll('[data-empty-state]'));

    filterInputs.forEach(function (input) {
        if (query) {
            input.value = query;
        }
    });

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function applyFilters() {
        if (!grids.length) {
            return;
        }

        var keyword = normalize(filterInputs[0] && filterInputs[0].value);
        var region = normalize(regionSelects[0] && regionSelects[0].value);
        var type = normalize(typeSelects[0] && typeSelects[0].value);
        var visible = 0;

        grids.forEach(function (grid) {
            Array.prototype.slice.call(grid.querySelectorAll('.movie-card')).forEach(function (card) {
                var search = normalize(card.getAttribute('data-search'));
                var cardRegion = normalize(card.getAttribute('data-region'));
                var cardType = normalize(card.getAttribute('data-type'));
                var matched = true;

                if (keyword && search.indexOf(keyword) === -1) {
                    matched = false;
                }

                if (region && cardRegion.indexOf(region) === -1) {
                    matched = false;
                }

                if (type && cardType.indexOf(type) === -1) {
                    matched = false;
                }

                card.style.display = matched ? '' : 'none';

                if (matched) {
                    visible += 1;
                }
            });
        });

        emptyStates.forEach(function (state) {
            state.classList.toggle('is-visible', visible === 0);
        });
    }

    filterInputs.forEach(function (input) {
        input.addEventListener('input', applyFilters);
    });

    regionSelects.forEach(function (select) {
        select.addEventListener('change', applyFilters);
    });

    typeSelects.forEach(function (select) {
        select.addEventListener('change', applyFilters);
    });

    applyFilters();
})();
