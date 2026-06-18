import { H as Hls } from "./video-dru42stk.js";

function showMessage(messageBox, text) {
  if (!messageBox) {
    return;
  }

  messageBox.textContent = text;
  messageBox.classList.add("is-visible");
}

function setupPlayer(root) {
  var video = root.querySelector("video");
  var button = root.querySelector("[data-play-button]");
  var message = root.querySelector("[data-player-message]");
  var source = root.getAttribute("data-video-url");
  var hls = null;
  var loaded = false;

  if (!video || !button || !source) {
    showMessage(message, "播放源暂不可用。");
    return;
  }

  function loadSource() {
    if (loaded) {
      return;
    }

    loaded = true;

    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, function (eventName, data) {
        if (!data || !data.fatal) {
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          showMessage(message, "网络加载异常，正在尝试重新连接播放源。");
          hls.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          showMessage(message, "媒体解码异常，正在尝试恢复播放。");
          hls.recoverMediaError();
          return;
        }

        showMessage(message, "当前浏览器无法播放该视频源。");
        hls.destroy();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
    } else {
      showMessage(message, "当前浏览器不支持 HLS 播放，请更换现代浏览器访问。");
    }
  }

  async function playVideo() {
    loadSource();

    try {
      await video.play();
      root.classList.add("is-playing");
      if (message) {
        message.classList.remove("is-visible");
      }
    } catch (error) {
      showMessage(message, "请再次点击播放按钮以开始播放。");
    }
  }

  button.addEventListener("click", playVideo);

  video.addEventListener("play", function () {
    root.classList.add("is-playing");
  });

  video.addEventListener("pause", function () {
    if (!video.ended) {
      root.classList.remove("is-playing");
    }
  });

  window.addEventListener("pagehide", function () {
    if (hls) {
      hls.destroy();
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-player]").forEach(setupPlayer);
});
