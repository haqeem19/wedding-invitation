(function () {
  "use strict";

  var CONFIG = {
    localAudio: "assets/music/bgm.mp3",
    guestParams: ["to", "dear", "kepada", "nama", "name", "tamu"],
  };

  var audioElement = null;

  function normalizeUrl(value) {
    if (!value || typeof value !== "string") return value;
    return value;
  }

  function decodeGuestName(value) {
    var decoded = value || "";
    try {
      decoded = decodeURIComponent(decoded.replace(/\+/g, " "));
    } catch (error) {
      decoded = decoded.replace(/\+/g, " ");
    }

    var textarea = document.createElement("textarea");
    textarea.innerHTML = decoded;
    return textarea.value.trim();
  }

  function getGuestName() {
    var params = new URLSearchParams(window.location.search);

    for (var i = 0; i < CONFIG.guestParams.length; i += 1) {
      var rawName = params.get(CONFIG.guestParams[i]);
      if (rawName && rawName.trim()) return decodeGuestName(rawName);
    }

    return "Nama Tamu";
  }

  function applyGuestName() {
    var guestName = getGuestName();

    document.querySelectorAll(".namatamu").forEach(function (element) {
      element.textContent = guestName;
    });

    document.querySelectorAll("body *").forEach(function (element) {
      if (element.children.length > 0) return;

      var text = element.textContent.trim();
      if (text === "Nama Tamu" || text === "Tamu Undangan") {
        element.textContent = guestName;
      }
    });

    var author = document.querySelector("#author");
    if (author && guestName !== "Nama Tamu") {
      author.removeAttribute("readonly");
      author.value = guestName;
    }
  }

  function fixAssetUrls() {
    document.querySelectorAll("img").forEach(function (image) {
      var lazySrc = image.getAttribute("data-src");
      var src = image.getAttribute("src");
      var srcset = image.getAttribute("srcset");
      var lazySrcset = image.getAttribute("data-srcset");

      if (lazySrc && (!src || src.indexOf("data:image") === 0)) {
        image.setAttribute("src", normalizeUrl(lazySrc));
      } else if (src) {
        image.setAttribute("src", normalizeUrl(src));
      }

      if (lazySrcset) {
        image.setAttribute("srcset", normalizeUrl(lazySrcset));
      } else if (srcset) {
        image.setAttribute("srcset", normalizeUrl(srcset));
      }

      image.removeAttribute("data-lazyloaded");
    });

    document.querySelectorAll("[data-thumbnail]").forEach(function (element) {
      var thumbnail = normalizeUrl(element.getAttribute("data-thumbnail"));
      if (thumbnail) element.style.backgroundImage = 'url("' + thumbnail + '")';
    });
  }

  function revealElementorContent() {
    document.querySelectorAll(".elementor-invisible").forEach(function (element) {
      element.classList.remove("elementor-invisible");
    });
  }

  function ensureAudio() {
    audioElement = document.getElementById("song");

    if (!audioElement) {
      audioElement = document.createElement("audio");
      audioElement.id = "song";
      audioElement.loop = true;
      audioElement.preload = "auto";
      audioElement.src = CONFIG.localAudio;
      document.body.appendChild(audioElement);
    }

    if (!audioElement.getAttribute("src")) audioElement.src = CONFIG.localAudio;
    return audioElement;
  }

  function setAudioIcon(isPlaying) {
    var mute = document.getElementById("mute-sound");
    var unmute = document.getElementById("unmute-sound");

    if (mute) mute.style.display = isPlaying ? "" : "none";
    if (unmute) unmute.style.display = isPlaying ? "none" : "";
  }

  function playAudio() {
    var audio = ensureAudio();
    if (!audio || !audio.getAttribute("src")) return;

    audio.play().then(function () {
      setAudioIcon(true);
    }).catch(function () {
      setAudioIcon(false);
    });
  }

  function pauseAudio() {
    var audio = ensureAudio();
    audio.pause();
    setAudioIcon(false);
  }

  function toggleAudio(event) {
    if (event) event.preventDefault();

    var audio = ensureAudio();
    if (audio.paused) playAudio();
    else pauseAudio();
  }

  function unlockInvitation(button) {
    var header = document.getElementById("header");

    if (button) button.classList.add("is-opening");

    window.setTimeout(function () {
      document.body.classList.remove("invitation-locked");
      document.body.style.overflowY = "";
      document.body.style.height = "";
      window.onscroll = null;

      if (header) {
        header.classList.add("is-opened");
        window.setTimeout(function () {
          header.style.display = "none";
        }, 760);
      }

      playAudio();

      var cover = document.getElementById("cover");
      if (cover) cover.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 420);
  }

  function setupBlockingModal() {
    var header = document.getElementById("header");
    var button = document.querySelector("#tombol-buka .elementor-button, #tombol-buka a, #tombol-buka button, #tombol-buka");

    if (!header || !button) return;

    document.body.classList.add("invitation-locked");
    window.scrollTo(0, 0);

    button.addEventListener("click", function (event) {
      event.preventDefault();
      unlockInvitation(button);
    });
  }

  function setupGiftToggle() {
    var gift = document.getElementById("amplop");
    var button = document.querySelector("#btnAmplop a, #btnAmplop button, #btnAmplop");

    if (gift) gift.style.display = "none";
    if (!gift || !button) return;

    button.addEventListener("click", function (event) {
      event.preventDefault();
      var shouldShow = gift.style.display === "none" || !gift.style.display;
      gift.style.display = shouldShow ? "block" : "none";
      if (shouldShow) gift.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function htmlToText(html) {
    var wrapper = document.createElement("div");
    wrapper.innerHTML = html || "";
    wrapper.querySelectorAll("br").forEach(function (br) {
      br.replaceWith("\n");
    });
    return wrapper.textContent.trim();
  }

  function copyText(target) {
    var text = "";

    if (typeof target === "string") {
      text = target;
    } else if (target && target.nodeType === 1) {
      var wrapper = target.closest(".elementor-button-wrapper") || target.parentElement;
      var content = wrapper ? wrapper.querySelector(".copy-content") : null;
      text = content ? htmlToText(content.innerHTML) : target.textContent.trim();
    }

    if (!text) return;

    function showCopied() {
      if (target && target.nodeType === 1) {
        var oldHtml = target.innerHTML;
        target.innerHTML = target.getAttribute("data-message") || "Berhasil disalin";
        window.setTimeout(function () {
          target.innerHTML = oldHtml;
        }, 900);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(showCopied);
      return;
    }

    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showCopied();
  }

  function setupAudioButtons() {
    ensureAudio();
    setAudioIcon(false);

    var mute = document.getElementById("mute-sound");
    var unmute = document.getElementById("unmute-sound");
    var youtubeAudio = document.getElementById("youtube-audio");

    if (youtubeAudio) youtubeAudio.style.display = "none";
    if (mute) mute.addEventListener("click", toggleAudio);
    if (unmute) unmute.addEventListener("click", toggleAudio);
  }

  function boot() {
    fixAssetUrls();
    revealElementorContent();
    applyGuestName();
    setupAudioButtons();
    setupBlockingModal();
    setupGiftToggle();
  }

  window.copyText = copyText;
  window.playAudio = playAudio;
  window.toggleAudio = toggleAudio;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}());
