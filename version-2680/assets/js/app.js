(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-nav]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("open");
        });
    }

    function setupHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(target) {
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, current) {
                slide.classList.toggle("active", current === index);
            });
            dots.forEach(function (dot, current) {
                dot.classList.toggle("active", current === index);
            });
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                restart();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                restart();
            });
        }
        show(0);
        restart();
    }

    function setupFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
        panels.forEach(function (panel) {
            var list = document.querySelector("[data-filter-list]");
            if (!list) {
                return;
            }
            var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
            var search = panel.querySelector("[data-filter-search]");
            var region = panel.querySelector("[data-filter-region]");
            var type = panel.querySelector("[data-filter-type]");
            var year = panel.querySelector("[data-filter-year]");
            var params = new URLSearchParams(window.location.search);
            var initialQuery = params.get("q") || "";
            if (search && initialQuery) {
                search.value = initialQuery;
            }

            function normalize(value) {
                return String(value || "").trim().toLowerCase();
            }

            function apply() {
                var query = normalize(search && search.value);
                var regionValue = normalize(region && region.value);
                var typeValue = normalize(type && type.value);
                var yearValue = normalize(year && year.value);
                cards.forEach(function (card) {
                    var terms = normalize(card.getAttribute("data-terms"));
                    var cardRegion = normalize(card.getAttribute("data-region"));
                    var cardType = normalize(card.getAttribute("data-type"));
                    var cardYear = normalize(card.getAttribute("data-year"));
                    var matched = true;
                    if (query && terms.indexOf(query) === -1) {
                        matched = false;
                    }
                    if (regionValue && cardRegion !== regionValue) {
                        matched = false;
                    }
                    if (typeValue && cardType !== typeValue) {
                        matched = false;
                    }
                    if (yearValue && cardYear !== yearValue) {
                        matched = false;
                    }
                    card.classList.toggle("is-hidden", !matched);
                });
            }

            [search, region, type, year].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
            apply();
        });
    }

    function setupPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
        players.forEach(function (player) {
            var video = player.querySelector("video");
            var overlay = player.querySelector("[data-play-overlay]");
            var playToggle = player.querySelector("[data-play-toggle]");
            var muteToggle = player.querySelector("[data-mute-toggle]");
            var fullscreen = player.querySelector("[data-fullscreen]");
            var message = player.querySelector("[data-player-message]");
            if (!video) {
                return;
            }
            var stream = video.getAttribute("data-stream-url");
            var hlsInstance = null;

            function showMessage(text) {
                if (!message) {
                    return;
                }
                message.textContent = text;
                message.classList.add("show");
            }

            function hideMessage() {
                if (message) {
                    message.classList.remove("show");
                    message.textContent = "";
                }
            }

            function attachStream() {
                if (!stream) {
                    showMessage("播放暂时不可用，请稍后再试");
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(stream);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, hideMessage);
                    hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR && hlsInstance) {
                            hlsInstance.startLoad();
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR && hlsInstance) {
                            hlsInstance.recoverMediaError();
                            return;
                        }
                        showMessage("播放暂时不可用，请稍后再试");
                    });
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = stream;
                } else {
                    showMessage("播放暂时不可用，请稍后再试");
                }
            }

            function start() {
                hideMessage();
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
                video.controls = true;
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {
                        if (overlay) {
                            overlay.classList.remove("is-hidden");
                        }
                    });
                }
            }

            function togglePlay() {
                if (video.paused) {
                    start();
                } else {
                    video.pause();
                }
            }

            attachStream();
            if (overlay) {
                overlay.addEventListener("click", start);
            }
            if (playToggle) {
                playToggle.addEventListener("click", togglePlay);
            }
            video.addEventListener("click", togglePlay);
            video.addEventListener("play", function () {
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
                if (playToggle) {
                    playToggle.textContent = "暂停";
                }
            });
            video.addEventListener("pause", function () {
                if (playToggle) {
                    playToggle.textContent = "播放";
                }
            });
            if (muteToggle) {
                muteToggle.addEventListener("click", function () {
                    video.muted = !video.muted;
                    muteToggle.textContent = video.muted ? "静音" : "音量";
                });
            }
            if (fullscreen) {
                fullscreen.addEventListener("click", function () {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else if (player.requestFullscreen) {
                        player.requestFullscreen();
                    }
                });
            }
            window.addEventListener("beforeunload", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupPlayers();
    });
})();
