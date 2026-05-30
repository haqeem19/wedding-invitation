(function () {
  "use strict";

  var CONFIG = {
    youtubeVideoId: "XCasOuavjLc",
    youtubeStart: 0,
    defaultGuestName: "Bapak/Ibu",
    guestParams: ["to", "dear", "kepada", "nama", "name", "tamu"],
    commentsStorageKey: "heniRijalWeddingComments",
    galleryPhotos: [
      "assets/photos/WhatsApp Image 2026-05-19 at 10.09.21.jpeg",
      "assets/photos/WhatsApp Image 2026-05-19 at 10.09.22.jpeg",
      "assets/photos/WhatsApp Image 2026-05-19 at 10.09.22 (1).jpeg",
      "assets/photos/WhatsApp Image 2026-05-19 at 10.09.22 (2).jpeg",
      "assets/photos/WhatsApp Image 2026-05-19 at 10.09.23.jpeg",
      "assets/photos/WhatsApp Image 2026-05-19 at 10.09.23 (1).jpeg",
      "assets/photos/WhatsApp Image 2026-05-19 at 10.09.23 (2).jpeg",
      "assets/photos/WhatsApp Image 2026-05-19 at 10.09.24.jpeg",
    ],
  };

  var youtubePlayer = null;
  var youtubeReady = false;
  var youtubeApiLoading = false;
  var shouldPlayWhenReady = false;

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
    return textarea.value.replace(/\s+/g, " ").trim();
  }

  function getGuestName() {
    var params = new URLSearchParams(window.location.search);

    for (var i = 0; i < CONFIG.guestParams.length; i += 1) {
      var rawName = params.get(CONFIG.guestParams[i]);
      if (rawName && rawName.trim()) return decodeGuestName(rawName);
    }

    return CONFIG.defaultGuestName;
  }

  function applyGuestName() {
    var guestName = getGuestName();

    document.querySelectorAll(".namatamu").forEach(function (element) {
      element.textContent = guestName;
    });

    document.querySelectorAll("body *").forEach(function (element) {
      if (element.children.length > 0) return;

      var text = element.textContent.trim();
      if (text === "Nama Tamu" || text === "Tamu Undangan" || text === CONFIG.defaultGuestName) {
        element.textContent = guestName;
      }
    });

    var author = document.querySelector("#author");
    if (author && guestName !== CONFIG.defaultGuestName) {
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

  function setupLocalGallery() {
    var track = document.querySelector("[data-gallery-track]");
    var current = document.querySelector("[data-gallery-current]");
    var total = document.querySelector("[data-gallery-total]");
    var prev = document.querySelector("[data-gallery-prev]");
    var next = document.querySelector("[data-gallery-next]");
    var gallery = track.closest("[data-gallery]") || track;
    if (!track || !CONFIG.galleryPhotos.length) return;

    var activeIndex = 0;
    var touchStartX = 0;
    var touchStartY = 0;
    var autoSlideTimer = null;
    var resumeAutoSlideTimer = null;
    var galleryInView = true;

    track.innerHTML = "";
    CONFIG.galleryPhotos.forEach(function (photo, index) {
      var slide = document.createElement("article");
      var frame = document.createElement("div");
      var image = document.createElement("img");

      slide.className = "gallery-slide";
      if (index === 0) slide.classList.add("is-active");
      slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");

      frame.className = "gallery-slide__frame";
      image.src = photo;
      image.alt = "Gallery Heni dan Rijal " + (index + 1);
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";

      frame.appendChild(image);
      slide.appendChild(frame);
      track.appendChild(slide);
    });

    if (total) total.textContent = padCountdown(CONFIG.galleryPhotos.length);

    function showSlide(index) {
      var slides = track.querySelectorAll(".gallery-slide");
      if (!slides.length) return;

      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        var isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      if (current) current.textContent = padCountdown(activeIndex + 1);
    }

    function startAutoSlide() {
      if (autoSlideTimer || !galleryInView || CONFIG.galleryPhotos.length < 2) return;
      autoSlideTimer = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 2000);
    }

    function stopAutoSlide() {
      if (autoSlideTimer) {
        window.clearInterval(autoSlideTimer);
        autoSlideTimer = null;
      }
    }

    function restartAutoSlide(delay) {
      stopAutoSlide();

      if (resumeAutoSlideTimer) window.clearTimeout(resumeAutoSlideTimer);

      if (delay) {
        resumeAutoSlideTimer = window.setTimeout(function () {
          resumeAutoSlideTimer = null;
          startAutoSlide();
        }, delay);
        return;
      }

      startAutoSlide();
    }

    if ("IntersectionObserver" in window) {
      var galleryObserver = new IntersectionObserver(function (entries) {
        galleryInView = entries.some(function (entry) {
          return entry.isIntersecting;
        });

        if (galleryInView) startAutoSlide();
        else stopAutoSlide();
      }, { threshold: 0.2 });

      galleryObserver.observe(gallery);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        showSlide(activeIndex - 1);
        restartAutoSlide();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(activeIndex + 1);
        restartAutoSlide();
      });
    }

    track.addEventListener("touchstart", function (event) {
      if (!event.touches || !event.touches.length) return;
      stopAutoSlide();
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    track.addEventListener("touchend", function (event) {
      if (!event.changedTouches || !event.changedTouches.length) return;

      var distanceX = event.changedTouches[0].clientX - touchStartX;
      var distanceY = event.changedTouches[0].clientY - touchStartY;
      var isHorizontalSwipe = Math.abs(distanceX) > 44 && Math.abs(distanceX) > Math.abs(distanceY) * 1.25;

      if (!isHorizontalSwipe) {
        restartAutoSlide(1600);
        return;
      }

      showSlide(activeIndex + (distanceX < 0 ? 1 : -1));
      restartAutoSlide(2200);
    }, { passive: true });

    window.addEventListener("scroll", function () {
      stopAutoSlide();
      if (resumeAutoSlideTimer) window.clearTimeout(resumeAutoSlideTimer);
      resumeAutoSlideTimer = window.setTimeout(function () {
        resumeAutoSlideTimer = null;
        startAutoSlide();
      }, 1200);
    }, { passive: true });

    startAutoSlide();
  }

  function ensureYouTubeMount() {
    var wrapper = document.getElementById("youtube-audio");

    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "youtube-audio";
      wrapper.dataset.video = "https://youtu.be/" + CONFIG.youtubeVideoId;
      document.body.appendChild(wrapper);
    }

    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.width = "1px";
    wrapper.style.height = "1px";
    wrapper.style.overflow = "hidden";

    if (!document.getElementById("youtube-player")) {
      wrapper.innerHTML = '<div id="youtube-player"></div>';
    }

    return wrapper;
  }

  function ensureAudioControls() {
    var container = document.getElementById("audio-container");
    if (container) return container;

    container = document.createElement("div");
    container.id = "audio-container";
    container.className = "audio-box";
    container.innerHTML = [
      '<button id="unmute-sound" class="audio-toggle" type="button" aria-label="Putar musik">',
      '<svg aria-hidden="true" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"></path></svg>',
      "</button>",
      '<button id="mute-sound" class="audio-toggle" type="button" aria-label="Hentikan musik">',
      '<svg aria-hidden="true" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm96 328c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16h160c8.8 0 16 7.2 16 16v160z"></path></svg>',
      "</button>",
    ].join("");
    document.body.appendChild(container);
    return container;
  }

  function createYouTubePlayer() {
    if (youtubePlayer || !window.YT || !window.YT.Player) return;

    ensureYouTubeMount();
    youtubePlayer = new window.YT.Player("youtube-player", {
      height: "20",
      width: "20",
      videoId: CONFIG.youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        loop: 1,
        playlist: CONFIG.youtubeVideoId,
        playsinline: 1,
        rel: 0,
        start: CONFIG.youtubeStart,
      },
      events: {
        onReady: function () {
          youtubeReady = true;
          if (typeof youtubePlayer.setVolume === "function") {
            youtubePlayer.setVolume(100);
          }
          if (shouldPlayWhenReady) playAudio();
        },
        onStateChange: function (event) {
          if (event.data === window.YT.PlayerState.ENDED) {
            youtubePlayer.seekTo(CONFIG.youtubeStart, true);
            youtubePlayer.playVideo();
          }
        },
      },
    });
  }

  function loadYouTubeApi() {
    ensureYouTubeMount();
    if (window.YT && window.YT.Player) {
      createYouTubePlayer();
      return;
    }

    if (youtubeApiLoading) return;
    youtubeApiLoading = true;

    var previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previousReady === "function") previousReady();
      createYouTubePlayer();
    };

    var script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  }

  function setAudioIcon(isPlaying) {
    var mute = document.getElementById("mute-sound");
    var unmute = document.getElementById("unmute-sound");

    if (mute) mute.style.display = isPlaying ? "" : "none";
    if (unmute) unmute.style.display = isPlaying ? "none" : "";
  }

  function playAudio() {
    shouldPlayWhenReady = true;
    loadYouTubeApi();

    if (!youtubeReady || !youtubePlayer || typeof youtubePlayer.playVideo !== "function") {
      setAudioIcon(false);
      return;
    }

    youtubePlayer.seekTo(CONFIG.youtubeStart, true);
    youtubePlayer.playVideo();
    setAudioIcon(true);
  }

  function pauseAudio() {
    shouldPlayWhenReady = false;
    if (youtubePlayer && typeof youtubePlayer.pauseVideo === "function") {
      youtubePlayer.pauseVideo();
    }
    setAudioIcon(false);
  }

  function toggleAudio(event) {
    if (event) event.preventDefault();

    if (youtubePlayer && typeof youtubePlayer.getPlayerState === "function") {
      var state = youtubePlayer.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) {
        pauseAudio();
        return;
      }
    }

    if (shouldPlayWhenReady) pauseAudio();
    else playAudio();
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

      var gallery = document.getElementById("gallery-experience");
      if (gallery) gallery.scrollIntoView({ behavior: "auto", block: "start" });
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
      gift.style.display = shouldShow ? "grid" : "none";
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
    ensureYouTubeMount();
    ensureAudioControls();
    loadYouTubeApi();
    setAudioIcon(false);

    var mute = document.getElementById("mute-sound");
    var unmute = document.getElementById("unmute-sound");

    if (mute) mute.addEventListener("click", toggleAudio);
    if (unmute) unmute.addEventListener("click", toggleAudio);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character];
    });
  }

  function loadComments() {
    try {
      var stored = window.localStorage.getItem(CONFIG.commentsStorageKey);
      var parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveComments(comments) {
    try {
      window.localStorage.setItem(CONFIG.commentsStorageKey, JSON.stringify(comments));
    } catch (error) {
      // Local comments are best-effort for static hosting.
    }
  }

  function formatCommentDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderComments() {
    var list = document.getElementById("localCommentList");
    var stats = document.getElementById("localCommentStats");
    if (!list || !stats) return;

    var comments = loadComments();
    var counts = comments.reduce(function (summary, comment) {
      var key = comment.attendance || "Hadir";
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {});

    stats.innerHTML = [
      '<span><strong>' + (counts.Hadir || 0) + '</strong> Hadir</span>',
      '<span><strong>' + (counts["Tidak Hadir"] || 0) + '</strong> Tidak Hadir</span>',
      '<span><strong>' + (counts["Masih Ragu"] || 0) + '</strong> Masih Ragu</span>',
    ].join("");

    if (comments.length === 0) {
      list.innerHTML = '<p class="local-comment-empty">Belum ada ucapan. Jadilah yang pertama mengirim doa.</p>';
      return;
    }

    list.innerHTML = comments.map(function (comment) {
      var attendanceClass = String(comment.attendance || "Hadir").toLowerCase().replace(/\s+/g, "-");
      return [
        '<article class="local-comment-item">',
        '<div class="local-comment-head">',
        '<strong>' + escapeHtml(comment.name) + '</strong>',
        '<span class="local-comment-badge ' + attendanceClass + '">' + escapeHtml(comment.attendance) + '</span>',
        "</div>",
        '<p>' + escapeHtml(comment.message) + '</p>',
        '<time>' + escapeHtml(formatCommentDate(comment.createdAt)) + '</time>',
        "</article>",
      ].join("");
    }).join("");
  }

  function setupLocalComments() {
    var form = document.getElementById("localCommentForm");
    if (!form) return;

    var nameInput = document.getElementById("localCommentName");
    var messageInput = document.getElementById("localCommentMessage");
    var attendanceInput = document.getElementById("localCommentAttendance");
    var guestName = getGuestName();

    if (nameInput && guestName !== CONFIG.defaultGuestName && !nameInput.value) {
      nameInput.value = guestName;
    }

    renderComments();

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = nameInput ? nameInput.value.trim() : "";
      var message = messageInput ? messageInput.value.trim() : "";
      var attendance = attendanceInput ? attendanceInput.value : "Hadir";

      if (!name || !message) return;

      var comments = loadComments();
      comments.unshift({
        name: name,
        message: message,
        attendance: attendance,
        createdAt: new Date().toISOString(),
      });

      saveComments(comments.slice(0, 50));
      if (messageInput) messageInput.value = "";
      renderComments();
    });
  }

  function padCountdown(value) {
    return String(Math.max(0, value)).padStart(2, "0");
  }

  function setupCountdowns() {
    var countdowns = document.querySelectorAll(".elementor-countdown-wrapper[data-date]");
    if (!countdowns.length) return;

    function updateCountdown() {
      countdowns.forEach(function (countdown) {
        var targetSeconds = Number(countdown.getAttribute("data-date"));
        if (!Number.isFinite(targetSeconds)) return;

        var remaining = Math.max(0, (targetSeconds * 1000) - Date.now());
        var totalSeconds = Math.floor(remaining / 1000);
        var days = Math.floor(totalSeconds / 86400);
        var hours = Math.floor((totalSeconds % 86400) / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        var dayElement = countdown.querySelector(".elementor-countdown-days");
        var hourElement = countdown.querySelector(".elementor-countdown-hours");
        var minuteElement = countdown.querySelector(".elementor-countdown-minutes");
        var secondElement = countdown.querySelector(".elementor-countdown-seconds");

        if (dayElement) dayElement.textContent = padCountdown(days);
        if (hourElement) hourElement.textContent = padCountdown(hours);
        if (minuteElement) minuteElement.textContent = padCountdown(minutes);
        if (secondElement) secondElement.textContent = padCountdown(seconds);
      });
    }

    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  }

  function setupSectionTransitions() {
    var animatedElements = document.querySelectorAll([
      ".reveal",
      ".gallery-slide__frame",
      ".event-card",
      ".couple-card",
      ".story-list article",
      ".map-panel",
      ".elementor-countdown-item",
      ".bank-card",
      ".address-card",
    ].join(","));

    if (!animatedElements.length) return;

    animatedElements.forEach(function (element, index) {
      element.classList.add("polish-reveal");
      element.style.setProperty("--reveal-delay", Math.min(index % 8, 7) * 45 + "ms");
    });

    if (!("IntersectionObserver" in window)) {
      animatedElements.forEach(function (element) {
        element.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    });

    animatedElements.forEach(function (element) {
      observer.observe(element);
    });
  }

  function boot() {
    setupLocalGallery();
    fixAssetUrls();
    revealElementorContent();
    applyGuestName();
    setupSectionTransitions();
    setupAudioButtons();
    setupBlockingModal();
    setupGiftToggle();
    setupLocalComments();
    setupCountdowns();
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
