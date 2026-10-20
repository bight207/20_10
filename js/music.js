/* Tự động phát nhạc nền (piano canhhoaphaitan.mp3) ngay khi vào trang web.
   Bao gồm cơ chế tự kích hoạt ngay lập tức hoặc ngay khi người dùng có tương tác đầu tiên
   (chạm màn hình, click bất kỳ đâu, cuộn trang...) theo chính sách bảo mật của các trình duyệt. */
(() => {
  const button = document.getElementById("music-toggle");
  const label = document.getElementById("music-label");
  const audioSources = [
    "assets/audio/piano canhhoaphaitan.mp3",
    "piano canhhoaphaitan.mp3"
  ];

  let audio = null;
  let isPlaying = false;
  let userExplicitlyPaused = false;
  let fadeInterval = null;
  let currentSourceIndex = 0;
  const targetVolume = 0.65;

  function initAudio() {
    if (audio) return audio;

    audio = document.getElementById("bg-music") || new Audio();
    audio.id = "bg-music";
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = targetVolume;
    if (!audio.getAttribute("src")) {
      audio.src = audioSources[currentSourceIndex];
    }

    audio.addEventListener("error", () => {
      if (currentSourceIndex < audioSources.length - 1) {
        currentSourceIndex++;
        audio.src = audioSources[currentSourceIndex];
        if (isPlaying || !userExplicitlyPaused) {
          audio.play().catch(() => {});
        }
      }
    });

    return audio;
  }

  function fadeIn(audioElem, duration = 1200) {
    if (fadeInterval) clearInterval(fadeInterval);
    audioElem.volume = 0;
    const step = 0.05;
    const intervalTime = duration / (targetVolume / step);

    fadeInterval = setInterval(() => {
      if (audioElem.volume + step >= targetVolume) {
        audioElem.volume = targetVolume;
        clearInterval(fadeInterval);
        fadeInterval = null;
      } else {
        audioElem.volume += step;
      }
    }, intervalTime);
  }

  function fadeOut(audioElem, duration = 600, callback) {
    if (fadeInterval) clearInterval(fadeInterval);
    const step = 0.05;
    const intervalTime = duration / ((audioElem.volume || targetVolume) / step);

    fadeInterval = setInterval(() => {
      if (audioElem.volume - step <= 0.02) {
        audioElem.volume = 0;
        clearInterval(fadeInterval);
        fadeInterval = null;
        if (callback) callback();
      } else {
        audioElem.volume -= step;
      }
    }, Math.max(intervalTime, 20));
  }

  function start(isUserGesture = false) {
    if (userExplicitlyPaused && !isUserGesture) return;

    const player = initAudio();
    player.play().then(() => {
      isPlaying = true;
      userExplicitlyPaused = false;
      button?.setAttribute("aria-pressed", "true");
      button?.classList.add("is-playing");
      if (label) label.textContent = "Tắt nhạc";
      fadeIn(player);
      removeInteractionListeners();
    }).catch(err => {
      // Trình duyệt chặn autoplay do chính sách chưa có tương tác người dùng
      // Sẽ tự động bật ngay khi chạm / bấm bất cứ vị trí nào trên web
      setupInteractionListeners();
    });
  }

  function stop() {
    if (!audio) return;
    isPlaying = false;
    userExplicitlyPaused = true;
    button?.setAttribute("aria-pressed", "false");
    button?.classList.remove("is-playing");
    if (label) label.textContent = "Bật nhạc";

    fadeOut(audio, 500, () => {
      audio.pause();
    });
  }

  function toggle() {
    if (isPlaying) {
      stop();
    } else {
      userExplicitlyPaused = false;
      start(true);
    }
  }

  // Tự động phát ngay khi có bất kỳ tương tác đầu tiên nào trên trang (chạm, click, cuộn, phím)
  function onFirstUserInteraction() {
    if (!isPlaying && !userExplicitlyPaused) {
      start(true);
    }
    removeInteractionListeners();
  }

  const interactionEvents = ["click", "touchstart", "touchend", "pointerdown", "keydown", "scroll", "wheel"];
  let listenersAttached = false;

  function setupInteractionListeners() {
    if (listenersAttached) return;
    listenersAttached = true;
    interactionEvents.forEach(evt => {
      window.addEventListener(evt, onFirstUserInteraction, { once: true, passive: true, capture: true });
      document.addEventListener(evt, onFirstUserInteraction, { once: true, passive: true, capture: true });
    });
  }

  function removeInteractionListeners() {
    listenersAttached = false;
    interactionEvents.forEach(evt => {
      window.removeEventListener(evt, onFirstUserInteraction, { capture: true });
      document.removeEventListener(evt, onFirstUserInteraction, { capture: true });
    });
  }

  // Nút bấm bật/tắt thủ công trên thanh menu
  button?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  // Tự động kích hoạt ngay khi trang sẵn sàng
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => start(false));
  } else {
    start(false);
  }

  // Luôn lắng nghe tương tác đầu tiên phòng trường hợp trình duyệt chặn lần chạy đầu
  setupInteractionListeners();

  // API toàn cục
  window.SecretMusic = {
    play: () => { userExplicitlyPaused = false; start(true); },
    pause: stop,
    toggle: toggle,
    isPlaying: () => isPlaying
  };
})();
