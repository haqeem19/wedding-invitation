const CONFIG = {
  weddingDate: '2026-12-21T08:00:00+07:00',
  calendarTitle: 'Pernikahan Aisyah & Rayhan',
  calendarLocation: 'Gedung Serbaguna Bandung',
  calendarDetails: 'Undangan pernikahan Aisyah & Rayhan',
  whatsappNumber: '6281234567890', // ganti dengan nomor WA tujuan, format 62
  gallery: [
    'assets/photos/gallery-1.svg',
    'assets/photos/gallery-2.svg',
    'assets/photos/gallery-3.svg'
  ]
};

const opening = document.getElementById('opening');
const content = document.getElementById('content');
const openBtn = document.getElementById('openInvitation');
const music = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const guestName = document.getElementById('guestName');

const params = new URLSearchParams(window.location.search);
const to = params.get('to');
if (to) guestName.textContent = decodeURIComponent(to.replace(/\+/g, ' '));

openBtn.addEventListener('click', async () => {
  opening.style.display = 'none';
  content.classList.remove('hidden');
  try { await music.play(); } catch (e) { musicToggle.classList.add('paused'); }
});

musicToggle.addEventListener('click', async () => {
  if (music.paused) {
    try { await music.play(); musicToggle.classList.remove('paused'); } catch (e) {}
  } else {
    music.pause();
    musicToggle.classList.add('paused');
  }
});

function updateCountdown() {
  const target = new Date(CONFIG.weddingDate).getTime();
  const now = Date.now();
  const diff = Math.max(target - now, 0);
  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;
  document.getElementById('days').textContent = String(Math.floor(diff / day)).padStart(2, '0');
  document.getElementById('hours').textContent = String(Math.floor((diff % day) / hour)).padStart(2, '0');
  document.getElementById('minutes').textContent = String(Math.floor((diff % hour) / minute)).padStart(2, '0');
  document.getElementById('seconds').textContent = String(Math.floor((diff % minute) / 1000)).padStart(2, '0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('active');
  });
}, { threshold: 0.16 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

let currentSlide = 0;
const sliderImage = document.getElementById('sliderImage');
const dots = document.getElementById('dots');
function renderSlider() {
  sliderImage.src = CONFIG.gallery[currentSlide];
  dots.innerHTML = '';
  CONFIG.gallery.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = index === currentSlide ? 'active' : '';
    dot.addEventListener('click', () => { currentSlide = index; renderSlider(); });
    dots.appendChild(dot);
  });
}
document.getElementById('prevSlide').addEventListener('click', () => {
  currentSlide = (currentSlide - 1 + CONFIG.gallery.length) % CONFIG.gallery.length;
  renderSlider();
});
document.getElementById('nextSlide').addEventListener('click', () => {
  currentSlide = (currentSlide + 1) % CONFIG.gallery.length;
  renderSlider();
});
renderSlider();

let touchStartX = 0;
sliderImage.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
sliderImage.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(diff) > 40) {
    currentSlide = diff < 0 ? (currentSlide + 1) % CONFIG.gallery.length : (currentSlide - 1 + CONFIG.gallery.length) % CONFIG.gallery.length;
    renderSlider();
  }
});

document.getElementById('calendarBtn').addEventListener('click', e => {
  e.preventDefault();
  const start = '20261221T010000Z'; // 08.00 WIB
  const end = '20261221T070000Z';   // 14.00 WIB
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(CONFIG.calendarTitle)}&dates=${start}/${end}&details=${encodeURIComponent(CONFIG.calendarDetails)}&location=${encodeURIComponent(CONFIG.calendarLocation)}`;
  window.open(url, '_blank');
});

document.getElementById('rsvpForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('nameInput').value.trim();
  const attendance = document.getElementById('attendanceInput').value;
  const message = document.getElementById('messageInput').value.trim();
  const text = `Halo, saya ${name}.%0AKonfirmasi: ${attendance}.%0AUcapan: ${message || '-'}%0A%0AUndangan: ${window.location.href}`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${text}`, '_blank');
});

const commentForm = document.getElementById('commentForm');
const commentNameInput = document.getElementById('commentNameInput');
const commentTextInput = document.getElementById('commentTextInput');
const commentList = document.getElementById('commentList');
const COMMENT_STORAGE_KEY = 'weddingComments';

function getStoredComments() {
  try {
    return JSON.parse(localStorage.getItem(COMMENT_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveStoredComments(comments) {
  localStorage.setItem(COMMENT_STORAGE_KEY, JSON.stringify(comments));
}

function renderComments() {
  const comments = getStoredComments();
  commentList.innerHTML = '';

  if (!comments.length) {
    const empty = document.createElement('p');
    empty.className = 'comment-empty';
    empty.textContent = 'Belum ada komentar. Jadilah yang pertama mengirim doa.';
    commentList.appendChild(empty);
    return;
  }

  comments.forEach(comment => {
    const item = document.createElement('article');
    item.className = 'comment-item';

    const name = document.createElement('strong');
    name.textContent = comment.name;

    const text = document.createElement('p');
    text.textContent = comment.text;

    item.append(name, text);
    commentList.appendChild(item);
  });
}

commentForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = commentNameInput.value.trim();
  const text = commentTextInput.value.trim();
  if (!name || !text) return;

  const comments = getStoredComments();
  comments.unshift({ name, text });
  saveStoredComments(comments.slice(0, 12));
  commentForm.reset();
  renderComments();
});
renderComments();

function copyText(text) {
  navigator.clipboard.writeText(text);
  alert('Nomor rekening berhasil disalin');
}
window.copyText = copyText;
