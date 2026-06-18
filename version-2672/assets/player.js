(function () {
  window.initMoviePlayer = function (options) {
    var video = document.getElementById(options.videoId);
    var button = document.querySelector(options.buttonSelector);
    var shell = document.querySelector(options.shellSelector);
    var loaded = false;
    var hlsInstance = null;

    if (!video || !options.url) {
      return;
    }

    function attachSource() {
      if (loaded) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = options.url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsInstance.loadSource(options.url);
        hlsInstance.attachMedia(video);
      } else {
        video.src = options.url;
      }
      loaded = true;
    }

    function hideButton() {
      if (button) {
        button.classList.add("is-hidden");
      }
      if (shell) {
        shell.classList.add("is-playing");
      }
    }

    function showButton() {
      if (button) {
        button.classList.remove("is-hidden");
      }
      if (shell) {
        shell.classList.remove("is-playing");
      }
    }

    function start() {
      attachSource();
      hideButton();
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          showButton();
        });
      }
    }

    if (button) {
      button.addEventListener("click", start);
    }

    video.addEventListener("click", function () {
      if (!loaded) {
        start();
      }
    });

    video.addEventListener("play", hideButton);
    video.addEventListener("pause", function () {
      if (!video.ended) {
        return;
      }
      showButton();
    });

    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };
})();
