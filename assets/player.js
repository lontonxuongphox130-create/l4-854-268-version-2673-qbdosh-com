(function () {
  window.initPlayer = function (videoId, sourceUrl) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(videoId + "-overlay");
    var started = false;
    var instance = null;

    if (!video || !sourceUrl) {
      return;
    }

    function begin() {
      if (started) {
        video.play().catch(function () {});
        return;
      }
      started = true;
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
        video.addEventListener("loadedmetadata", function () {
          video.play().catch(function () {});
        }, { once: true });
        video.play().catch(function () {});
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        instance = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        instance.loadSource(sourceUrl);
        instance.attachMedia(video);
        instance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        return;
      }
      video.src = sourceUrl;
      video.play().catch(function () {});
    }

    if (overlay) {
      overlay.addEventListener("click", begin);
    }
    video.addEventListener("click", function () {
      if (!started) {
        begin();
      }
    });
    window.addEventListener("pagehide", function () {
      if (instance) {
        instance.destroy();
      }
    });
  };
})();
