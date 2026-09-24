---
title: Kenapa state request harus tetap hidup setelah request-nya selesai?
description: Sebuah request datang, membuat state yang bisa berubah, lalu selesai. Di kebanyakan backend, state itu masih hidup sesudahnya. Usai berangkat dari pertanyaan kenapa.
translationKey: why-request-state-survives
lang: id
date: 2026-09-24
updated: 2026-09-25
author: Sakala maintainers
draft: false
tags: [lifetimes, runtime, typescript, backend]
series:
  name: Cara kerja Usai
  part: 1
evidence:
  status: Usai v0.0.10, alpha. Kualifikasi produksi sedang berjalan; kontrak masih bisa berubah. Sweep-nya diukur pada 0.0.8.
  setup: 'Probe correctness serta angka throughput dan CPU berasal dari sweep 23-09-2026: Xeon E5-2680 v4, server di-pin ke 8 CPU, PostgreSQL 18, enam kelas workload melawan Node, Node × 8, Bun, Deno, Rust axum, dan PHP-FPM.'
  supports:
    - Usai memberi setiap unit pekerjaan execution world yang baru. Counter di level module menjawab 1 di setiap request.
    - Di route yang menyentuh PostgreSQL, throughput Usai setara satu proses Node, dan unggul di transaksi.
    - World baru punya biaya CPU yang terukur, 6–14× CPU Node di route trivial.
  doesNotSupport:
    - Bahwa Usai secara umum lebih cepat dari Node, Bun, Deno, PHP, atau Rust.
    - Bahwa world yang baru adalah batas keamanan. Isolasinya bersifat semantik, sebuah properti correctness.
    - Bahwa Usai siap untuk semua workload produksi.
  sources:
    - label: 2026-09-23-sweep.md
      url: https://usai.sakala.dev/docs/measurements/2026-09-23-sweep/
    - label: LIFECYCLE-CONTRACTS.md
      url: https://usai.sakala.dev/docs/lifecycle-contracts/
    - label: AWS Lambda best practices
      url: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
    - label: Cloudflare Workers best practices
      url: https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
---

```text
Sebuah request datang.
Ia membuat state aplikasi yang bisa berubah.
Request-nya selesai.

Kenapa state itu masih hidup?
```

Jawaban yang biasa terdengar sederhana: karena prosesnya masih hidup. Di kebanyakan backend, proses dinyalakan sekali, lalu semua request berikutnya berjalan di dalam application world yang sama dan berumur panjang.

```text
proses dinyalakan
├─ request A
├─ request B
├─ request C
└─ …dan semua hal yang bisa berubah yang mereka tinggalkan
```

Model itu cepat, familiar, dan benar untuk banyak sekali program. Tapi model itu juga berarti sebuah state mendapat umurnya dari **di mana ia kebetulan disimpan**, bukan dari **untuk apa ia ada**. Usai adalah upaya untuk memisahkan kedua hal itu.

## Bug yang tidak pernah sengaja ditulis

Ini sebuah handler dengan variabel di bagian atas file:

```ts
let counter = 0; // state level module

export const count = http.get("/count", async () => {
  counter += 1;
  return { count: counter };
});
```

Tidak ada yang merilis counter seperti ini ke produksi. Yang dirilis adalah sepupunya: `currentUser` yang diisi middleware, tenant id yang di-cache "biar praktis", objek hasil memoize yang belakangan diubah seseorang. Perilakunya persis seperti `counter`: mereka hidup lebih lama dari request yang mengisinya.

Suite benchmark kami meminta counter ini ke setiap server, sepuluh kali berturut-turut. Ini jawabannya:

| Server | Sepuluh request |
|---|---|
| Satu proses Node | `1 2 3 4 5 6 7 8 9 10` |
| Node cluster, 8 worker | `1 1 1 1 1 1 1 1 2 2` |
| Usai | `1 1 1 1 1 1 1 1 1 1` |

Baris pertama adalah kebocoran yang jelas. Baris kedua lebih buruk. Delapan proses masing-masing mengingat hal yang berbeda, jadi **request yang sama mendapat jawaban berbeda tergantung worker mana yang mengambilnya**. Bug seperti itu lolos review, lolos test di laptop, lalu muncul di produksi sebagai "tidak bisa direproduksi".

## Ini bukan masalah yang kami karang

Platform yang memakai ulang lingkungan eksekusi demi kecepatan mendokumentasikan ketegangan yang sama, dan menyerahkan solusinya kepadamu.

AWS Lambda memintamu memakai ulang lingkungan untuk hal-hal mahal seperti SDK client dan koneksi database, lalu di kalimat yang sama memperingatkan:

> To avoid potential data leaks across invocations, don't use the execution environment to store user data, events, or other information with security implications.

Cloudflare Workers lebih lugas:

> Workers reuse isolates across requests. A variable set during one request is still present during the next.

Kedua platform sampai pada kesimpulan yang sama. **Memakai ulang infrastruktur itu penting untuk performa, sedangkan memakai ulang state aplikasi yang bisa berubah itu berbahaya.** Keduanya meminta developer menjaga batas itu dengan disiplin.

Usai mengajukan pertanyaan lain: bagaimana kalau batas itu menjadi bagian dari struktur runtime-nya?

## Infrastruktur persisten tidak berarti state persisten

Kesimpulan yang kami pertanyakan sebenarnya kecil:

```text
infrastrukturnya persisten
maka
state aplikasinya persisten
```

Baris pertama adalah engineering yang baik. Listener, scheduler, connection pool, dan kode yang sudah di-compile mahal dibangun dan aman dipakai ulang. Baris kedua tidak mengikuti dari baris pertama. Ia hanya terjadi karena keduanya tinggal di proses yang sama.

PHP-FPM sudah lama memisahkan keduanya. Proses worker-nya persisten, tetapi state aplikasi dibangun ulang untuk setiap request. Itu sebabnya PHP-FPM menjawab `1 1 1 1 1 1 1 1 1 1` pada probe yang sama, dengan alasan yang sama seperti Usai.

Usai membagi backend menjadi tiga lapisan, masing-masing dengan umurnya sendiri:

```text
runtime persisten                     hidup selama proses
  listener · scheduler · pool · metrics

definisi aplikasi immutable           dibangun sekali per deploy
  kode ter-compile · route · schema · config

execution world                       hidup untuk satu pekerjaan
  state request · konteks auth · global · lease
```

Setiap request, task, tick cron, dan queue message mendapat **execution world yang baru**. Ketika pekerjaannya selesai, world-nya berakhir. Runtime-nya tidak.

## Tidak semuanya harus berumur pendek

Salah paham yang sering muncul adalah menganggap Usai membuang semuanya. Tidak begitu. Ada hal yang memang layak hidup lama, dan kamu mendeklarasikannya:

| Pekerjaan | Dideklarasikan dengan | World hidup selama |
|---|---|---|
| HTTP request | `http.get` / `http.post` / … | satu request |
| Task | `task` | satu pemanggilan |
| Cron | `cron` | satu tick |
| Queue message | `queue.consume` | satu message |
| WebSocket | `socket` | selama koneksi |
| Service | `service` | selama revisi aktif |

Pool PostgreSQL adalah sebuah **resource**. Ia sengaja hidup lebih lama dari world, dan setiap world meminjam koneksi lewat lease. World WebSocket hidup persis selama koneksinya. Sebuah `service` persisten karena kamu mendeklarasikannya persisten. Default-nya ephemeral, dan umur panjang selalu merupakan pilihan yang disengaja.

## Mati bukan berarti beres

Membuang sebuah world tidak otomatis membuat semuanya aman. Sebuah query masih bisa berjalan di koneksi database setelah world yang memulainya berakhir. Sebuah timer masih bisa terjadwal. Karena itu Usai menambahkan aturan kedua: **pekerjaan asinkron selalu punya pemilik.**

```ts
export const order = http.post("/orders", async () => {
  setTimeout(sendEmail, 1000); // tidak ada yang memiliki ini
  return { ok: true };
});
```

Di proses Node yang berumur panjang, ini biasanya jalan, sampai prosesnya restart di saat yang salah. Di Usai, runtime membatalkan timer itu dan menjelaskan alasannya:

```text
WARN http work `POST /orders` ended with live asynchronous work (1 timer).

The http lifetime ended when its result was produced. Work that is
still pending cannot remain owned by this world, so it was cancelled.

Use:
  task()    for independent finite work
  cron()    for scheduled work
  service() for intentional long-running work
or await the work before returning.
```

Perbaikannya menyatakan maksudmu: `await ctx.tasks.dispatch(sendEmail, …)` menyerahkan pekerjaan itu ke sebuah task yang berjalan di world-nya sendiri.

Aturan yang sama menentukan kapan koneksi database boleh dipakai ulang. Koneksi baru kembali ke pool kalau Usai tahu bagaimana operasi terakhirnya berakhir: selesai normal, gagal dengan error SQL yang dikenal, atau pembatalannya terkonfirmasi. Kalau hasilnya tidak pasti, koneksi dikarantina dan diganti, tidak pernah dipakai ulang.

## Berapa harganya

World yang baru tidak gratis, dan kami lebih memilih memberitahumu daripada membiarkanmu menemukannya sendiri.

- Di route yang tidak mengerjakan apa-apa, Usai memakai **6–14× CPU Node per request**. Itu harga dari masuk ke world baru, memvalidasi batas, dan membereskan kepemilikan.
- Di route yang menyentuh PostgreSQL, yang merupakan sebagian besar isi aplikasi sungguhan, perbedaannya hampir hilang. Throughput Usai **setara satu proses Node**, unggul di transaksi, dan **1,8–7× di atas Laravel**. Seperti kata laporan sweep-nya: *query-nya adalah tagihan; runtime-nya pembulatan.*
- Memori tumbuh seiring **concurrency**, bukan jumlah request. 64 request bersamaan memakan sekitar 0,5 GiB.

Jadi Usai bukan pilihan untuk endpoint panas yang CPU-bound, di mana setiap mikrodetik berarti. Usai untuk backend yang ingin infrastruktur persisten tanpa setiap state diam-diam mewarisi umur prosesnya. Biasanya itu berarti layanan yang kebanyakan idle, API multi-tenant, webhook, dan aplikasi yang mencampur HTTP dengan task, cron, queue, dan socket.

## Coba, dan coba bongkar

```bash
npm create @sakaladev/usai@latest my-app
cd my-app && npm install && npm run dev
```

Dengan pnpm: `pnpm dlx @sakaladev/create-usai my-app`, lalu `pnpm install && pnpm dev`. pnpm 12 baru memasang rilis baru setelah berumur sehari, jadi di hari rilis pakai npm untuk mendapat versi terbaru.

Usai masih alpha, di versi 0.0.10. Ia sudah melewati soak 72 jam dan serangkaian kegagalan yang disengaja, tapi belum banyak bertemu developer dari luar proyek. Itulah eksperimen berikutnya. Kalau kamu mencobanya, kami ingin tahu di mana modelnya membingungkan, di mana ia menghalangimu, dan di mana ia menangkap bug yang tidak kamu sadari.

Tulisan berikutnya di seri ini akan masuk lebih dalam: bagaimana world dibuat dengan murah, apa yang kami pelajari dari 73 juta request selama tiga hari, dan di mana Usai kalah.
