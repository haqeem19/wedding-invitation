# Wedding Invitation Static HTML

Template undangan digital siap upload. Dibuat tanpa framework: HTML, CSS, dan JavaScript.

## Cara Edit Cepat

1. Edit nama mempelai, tanggal, lokasi, dan teks di `index.html`.
2. Edit konfigurasi tanggal, WhatsApp, gallery, dan calendar di `script.js`.
3. Replace foto dummy di `assets/photos/`.
4. Musik memakai embed YouTube di `script.js` (`youtubeVideoId` dan `youtubeStart`).
5. Upload seluruh folder ke Cloudflare Pages, Netlify, GitHub Pages, atau hosting static lain.

## Guest Name via URL

Contoh:
`https://domainkamu.pages.dev/?to=Haqeem%20Luqman`

## Ganti Tema

Di `style.css` sudah tersedia variable warna dan class contoh:
- `earth`
- `dark`
- `rustic`
- `clean`

Contoh pakai tema dark:
`<body class="dark">`

## Catatan Musik Autoplay

Browser biasanya hanya mengizinkan musik mulai setelah user klik tombol. Karena itu musik diputar setelah tombol **Buka Undangan** ditekan.

## Catatan Komentar

Form ucapan saat ini tersimpan di `localStorage`, jadi hanya terlihat di browser pengunjung masing-masing. Kalau komentar harus terkumpul dan tampil untuk semua tamu, perlu backend. SQLite cocok kalau undangan di-host di VPS/Node server kecil; kalau tetap static hosting, lebih praktis pakai Supabase/Firebase atau endpoint form serverless.
