---
title: Soak test 72 jam kami kehilangan 81% throughput-nya. Kami harus membuktikan itu bukan salah runtime.
description: Soak tiga hari melayani 73,6 juta request tanpa satu pun 5xx, tapi tetap melambat dari 794 ke 154 request per detik. Penjelasan termudahnya database. Kami menjalankan run kontrol untuk memastikannya.
translationKey: soak-test-throughput-decay
lang: id
date: 2026-09-28
author: Sakala maintainers
draft: false
tags: [soak-test, postgresql, reliability, runtime]
series:
  name: Cara kerja Usai
  part: 2
evidence:
  status: Usai v0.0.15, alpha. Soak-nya berjalan pada 19–22 dan 23–24 September 2026, dengan build di tanggal-tanggal itu.
  setup: 'Satu VM (Xeon 16 vCPU) dengan deployment berbentuk produksi: Caddy di depan image runtime Usai yang dirilis, PostgreSQL 18, dan aplikasi examples/invoicing. Delapan klien closed-loop mengambil daftar, membuka, dan membuat invoice, sementara sebuah sampler mencatat status setiap menit. Ada pekerjaan lain di host yang sama pada waktu tertentu, dan artikel ini menyebutkannya.'
  supports:
    - Selama 73,6 juta dan 124,5 juta request, runtime tidak mengembalikan satu pun 5xx atau 503, dan memori, descriptor, serta penghitung kepemilikannya tetap datar.
    - Penurunan throughput di soak 72 jam berasal dari tabel aplikasi yang tidak dipangkas. Dengan data dipangkas, 24 jam tidak menunjukkan penurunan sama sekali.
    - Biaya runtime per request tetap datar selama throughput turun.
  doesNotSupport:
    - Perilaku saat saturasi, di hardware lain, di beberapa host, atau untuk aplikasi lain.
    - Klaim umum tentang performa PostgreSQL. Penurunannya berasal dari pertumbuhan satu tabel di bawah satu pola penulisan.
    - Bahwa Usai siap untuk semua workload produksi.
  sources:
    - label: 2026-09-18-p5-p6-qualification.md (soak 72 jam)
      url: https://usai.sakala.dev/docs/measurements/2026-09-18-p5-p6-qualification/
    - label: 2026-09-24-bounded-soak.md (run kontrol 24 jam)
      url: https://usai.sakala.dev/docs/measurements/2026-09-24-bounded-soak/
    - label: 2026-09-26-idle-decommit.md
      url: https://usai.sakala.dev/docs/measurements/2026-09-26-idle-decommit/
---

Soak tiga hari kami melayani 73.627.701 request tanpa satu pun 5xx, tapi throughput-nya tetap turun 81% di sepanjang jalan. Run kedua selama 24 jam, dengan data aplikasi yang dipangkas, sama sekali tidak melambat. Penyebabnya satu tabel yang terus membesar, bukan runtime. Tulisan ini menceritakan bagaimana kami sampai dari temuan pertama ke kesimpulan kedua, dan kenapa kami tidak berhenti di jawaban yang paling gampang.

```text
soak 72 jam       jam 0–6: 794 request/detik     jam 66–72: 154 request/detik
kontrol 24 jam    jam 1: 1.416 request/detik     jam 24: 1.480 request/detik
```

## Setup-nya

Soak test menjalankan beban stabil dalam waktu lama. Tujuannya menangkap hal yang terlewat oleh benchmark pendek: kebocoran pelan, pergeseran bertahap, dan masalah yang baru muncul di request kesejuta.

Soak kami berjalan di satu VM dengan deployment berbentuk produksi. Caddy berada di depan image runtime Usai yang dirilis, yang terhubung ke PostgreSQL 18 dan menjalankan aplikasi `examples/invoicing` dari repositori. Delapan klien closed-loop mengulang satu siklus: mengambil daftar invoice, membuka satu, lalu membuat satu. Sekitar 10% request menulis invoice baru. Setiap menit, sebuah sampler mencatat memori, CPU, file descriptor yang terbuka, dan halaman status runtime.

## Tiga hari, satu garis yang terus turun

Menurut semua kriteria correctness yang kami tulis sebelum pengujian, soak 72 jam ini lulus. Tidak ada 5xx, tidak ada 503, dan memorinya datar. Throughput-nya lain cerita:

| Rentang | Request/detik | Latensi median (p50) | Latensi lambat (p99) |
|---|---|---|---|
| 0–6 jam | 794 | 4,6 ms | 84 ms |
| 12–18 jam | 349 | 5,1 ms | 289 ms |
| 24–30 jam | 244 | 5,8 ms | 450 ms |
| 48–54 jam | 181 | 5,4 ms | 666 ms |
| 66–72 jam | 154 | 5,3 ms | 810 ms |

Mediannya hampir tidak bergerak. Latensi yang lambat membengkak sepuluh kali lipat, dan throughput tinggal seperlima.

Sementara itu, semua yang dimiliki runtime tetap datar:

- CPU di dalam world aplikasi naik dari 1,56 ke 1,59 ms per request.
- CPU seluruh proses naik dari 2,80 ke 3,04 ms per request.
- Operasi SQL naik dari 2,52 ke 2,59 per request.
- Memori yang ditagihkan ke container naik dari 51,5 ke 53,5 MiB, dan descriptor yang terbuka dari 29 ke 30.
- Runtime membuat 73.627.744 execution world, tidak menemukan satu pun pekerjaan terlepas, tidak mengarantina satu pun koneksi database, dan tidak mencatat satu pun baris WARN atau ERROR selama tiga hari.

## Penjelasan yang gampang, dan penjelasan yang lain

Workload-nya menulis sekitar 7,4 juta invoice, beserta item-itemnya, ke satu tabel yang tidak pernah dipangkas. Makin banyak baris berarti index makin besar, write-ahead log makin banyak, serta checkpoint dan autovacuum makin sering. Aplikasi makin lama menunggu PostgreSQL, sehingga klien closed-loop menyelesaikan lebih sedikit request per detik. CPU per request yang datar cocok dengan cerita ini.

Tapi datanya juga cocok dengan cerita yang kurang nyaman. Runtime yang membocorkan sesuatu di luar CPU akan menggambar kurva yang sama. Misalnya struktur data yang terus tumbuh dan disusuri sekali per request, connection pool yang pelan-pelan menurun, atau tabel handle yang tidak pernah dibebaskan. CPU per request tetap datar, memori bisa tetap datar kalau pertumbuhannya kecil, dan throughput tetap turun.

Kedua cerita memprediksi persis apa yang kami lihat. Memilih yang paling nyaman berarti menebak, lalu menuliskannya seolah-olah temuan.

## Run kontrol

Jadi kami menjalankannya lagi selama 24 jam, dengan deployment, delapan klien, dan beban yang sama. Satu-satunya perbedaan, harness menghapus apa yang dibuat oleh beban, seperti yang akan dilakukan operator. Setiap menit ia menghapus invoice di luar 20.000 yang terbaru, serta baris queue yang sudah selesai dan berumur lebih dari semenit.

Kalau penyebabnya data, penurunannya akan hilang. Kalau penyebabnya runtime, penurunannya akan tetap ada.

Ternyata hilang. Throughput-nya 1.416 request per detik di jam pertama dan 1.480 di jam terakhir, sekitar dua kali lipat jam-jam awal run 72 jam. Selama 124.471.717 request yang berhasil:

| | |
|---|---|
| Error server | 0 × 5xx, 0 × 503 (dan 4 × 4xx) |
| Latensi rata-rata | 4,39 ms sepanjang run |
| Lifecycle | 0 pekerjaan terlepas, 0 koneksi dikarantina, 0 completion yang terlambat atau basi |
| Memori yang ditagihkan ke container | 53,2 sampai 55,2 MiB |
| Descriptor yang terbuka | 29 sampai 31 |

**Penurunannya berasal dari tabel aplikasi, bukan dari runtime.** Dengan sehari waktu mesin, kami bisa mengatakannya sebagai hasil pengukuran, bukan opini.

## Detik-detik yang buruk

Run kontrol ini tidak sempurna. Klien beban mencatat 344 timeout, tersebar di 91 detik. Tidak satu pun berasal dari server, yang tidak menjawab 5xx maupun 503 pada detik-detik itu. Semuanya jatuh di dua jendela waktu:

- Di jam pertama, pekerjaan lain di host yang sama sedang membangun image Docker. Itu menjelaskan 12 timeout dalam 28 detik.
- Di jam ke-16 sampai ke-18, pekerjaan lain di host memangkas jatah CPU container dari sekitar 415% ke 65% selama beberapa menit. Klien closed-loop yang mendapat lebih sedikit siklus CPU mengirim lebih sedikit request, dan akhirnya menabrak batas timeout 10 detiknya sendiri.

Di luar dua jendela itu, selama 22 jam dan 114 juta request, tidak ada satu detik pun yang menghasilkan error. Kami tetap melaporkan timeout-nya. Soak yang menyembunyikan detik-detik buruknya membuat pembaca bertanya-tanya apa lagi yang disembunyikan.

## Dua angka memori yang selisih 36 MiB

Run kontrol juga mengajari kami sesuatu tentang alat ukur kami sendiri. Di tengah run, halaman status runtime menyebut prosesnya memakai 89 MiB, sementara `docker stats` menyebut 53 MiB. Keduanya benar.

Angka proses, `VmRSS`, menghitung page yang dipakai bersama sekali untuk setiap tempat page itu dipetakan. Usai memetakan satu image aplikasi yang sudah disiapkan ke masing-masing dari delapan slot world di pool-nya, sehingga sekitar 13 MiB page yang sebenarnya muncul sebagai 36 MiB.

Angka container, yaitu tagihan cgroup, adalah angka yang menentukan apakah container dibunuh. Angka ini justru kurang menghitung binary runtime itu sendiri. Linux menagihkan page sebuah file ke container mana pun yang pertama kali membacanya, dan layer image itu sudah lebih dulu dibaca oleh proses lain.

Angka tengah yang jujur adalah PSS, yang membagi page bersama ke semua proses yang memakainya: sekitar 66 MiB di sini. Ringkasan soak sekarang mencetak ketiga angka itu. Hasil pengujiannya tidak berubah, karena setiap run memakai alat ukur yang sama dari awal sampai akhir. Tapi angka memori dari satu alat tidak boleh dibandingkan dengan angka dari alat lain.

## Yang lebih dulu tertangkap oleh kampanye yang sama

Soak yang lulus baru separuh cerita. Kampanye yang sama menemukan dan memperbaiki masalah nyata sebelum run panjangnya.

Yang pertama soal mengganti aplikasi yang sedang berjalan. Melakukannya 1.000 kali berturut-turut membuat proses mati setelah sekitar 270 penggantian, karena memori tumbuh sekitar 2 MB setiap kali sampai menyentuh batas 512 MB container. Ini bukan kebocoran di runtime, karena jumlah image yang ter-compile tetap dua. Penyebabnya `malloc` milik glibc, yang menyimpan satu arena memori terpisah per worker thread. Setiap arena memegang potongan memori seukuran modul yang sudah dibebaskan, tapi tidak bisa dipakai ulang oleh arena lain. Membatasi jumlah arena menyelesaikannya. Run akhirnya melakukan 1.000 penggantian di bawah beban, dengan 2.039.500 request dan tanpa error.

Yang kedua lebih merupakan trade-off daripada bug: memori setelah burst tidak kembali. Slot world yang pernah dipakai menyimpan page-nya, dan itu memberi sekitar 16% throughput lebih tinggi di burst berikutnya. Jalur pelepasan baru yang ditambahkan di upstream engine hanya mengembalikan sekitar 12 MiB dan tidak menurunkan dataran memorinya. Panduan sizing sudah menyebutkannya, tapi artinya concurrency tertinggi yang pernah terjadi yang menentukan memorimu, bukan beban saat ini.

## Artinya kalau kamu menjalankan backend

Sebagian besar dari ini bukan soal Usai.

1. Soak panjang terhadap aplikasimu juga soak terhadap database-mu. Kalau satu tabel menerima jutaan insert, soak-nya akan mengukur tabel itu. Pangkas atau partisi tabelnya, atau jalankan run kontrol dengan data terbatas, sebelum menyalahkan runtime.
2. CPU per request yang datar tidak membuktikan tidak ada kebocoran. Itu hanya menyingkirkan satu jenis kebocoran. Ubah satu variabel, lalu jalankan lagi.
3. Pahami angka memori mana yang sedang kamu baca. RSS proses, PSS, dan tagihan container menjawab pertanyaan yang berbeda, dan hanya yang terakhir yang menentukan apakah container-mu dibunuh.

## Coba sendiri

```bash
npm create @sakaladev/usai@latest my-app
cd my-app && npm install && npm run dev
```

Semua yang di atas ada di situs, lengkap dengan angka mentahnya: [halaman benchmark](https://usai.sakala.dev/id/benchmarks/), [laporan soak 72 jam](https://usai.sakala.dev/docs/measurements/2026-09-18-p5-p6-qualification/), dan [run kontrol 24 jam](https://usai.sakala.dev/docs/measurements/2026-09-24-bounded-soak/). Kalau kamu melihat lubang di penalarannya, buka issue. Justru itu yang ingin kami dengar.
