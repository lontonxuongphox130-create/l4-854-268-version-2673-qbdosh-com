(function () {
    function loadHls(callback, fail) {
        if (window.Hls) {
            callback();
            return;
        }

        var existing = document.querySelector('script[data-hls-loader]');

        if (existing) {
            existing.addEventListener('load', callback, { once: true });
            existing.addEventListener('error', fail, { once: true });
            return;
        }

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
        script.async = true;
        script.setAttribute('data-hls-loader', 'true');
        script.addEventListener('load', callback, { once: true });
        script.addEventListener('error', fail, { once: true });
        document.head.appendChild(script);
    }

    window.bindMoviePlayer = function (id, source) {
        var root = document.getElementById(id);

        if (!root) {
            return;
        }

        var video = root.querySelector('video');
        var overlay = root.querySelector('.player-overlay');
        var message = root.querySelector('.player-message');
        var isReady = false;
        var pendingPlay = false;
        var hlsInstance = null;

        if (!video || !source) {
            return;
        }

        function setMessage(text) {
            if (message) {
                message.textContent = text || '';
            }
        }

        function hideOverlay() {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        }

        function showOverlay() {
            if (overlay) {
                overlay.classList.remove('is-hidden');
            }
        }

        function tryPlay() {
            hideOverlay();
            video.controls = true;

            var promise = video.play();

            if (promise && promise.catch) {
                promise.catch(function () {
                    showOverlay();
                });
            }
        }

        function ready() {
            isReady = true;

            if (pendingPlay) {
                pendingPlay = false;
                tryPlay();
            }
        }

        function prepare() {
            if (isReady || hlsInstance || video.getAttribute('src')) {
                return;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                video.addEventListener('loadedmetadata', ready, { once: true });
                return;
            }

            loadHls(function () {
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, ready);
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }

                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            hlsInstance.startLoad();
                            return;
                        }

                        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            hlsInstance.recoverMediaError();
                            return;
                        }

                        setMessage('视频加载失败，请稍后重试');
                    });
                    return;
                }

                setMessage('视频加载失败，请稍后重试');
            }, function () {
                setMessage('视频加载失败，请稍后重试');
            });
        }

        function requestPlay(event) {
            if (event) {
                event.preventDefault();
            }

            setMessage('');
            pendingPlay = true;
            prepare();

            if (isReady) {
                pendingPlay = false;
                tryPlay();
            }
        }

        prepare();

        if (overlay) {
            overlay.addEventListener('click', requestPlay);
        }

        video.addEventListener('click', function () {
            if (video.paused) {
                requestPlay();
            } else {
                video.pause();
            }
        });

        video.addEventListener('play', hideOverlay);
        video.addEventListener('ended', showOverlay);
    };
})();
