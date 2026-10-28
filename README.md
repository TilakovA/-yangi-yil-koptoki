# 🎄 Yangi yil koptoki

Qor bo'ronlari va Rojdestvo bezaklari orasidan sayohat qiluvchi kichik koptok haqidagi mini-o'yin. Brauzerda to'g'ridan-to'g'ri o'ynaladi va telefonga ilova sifatida o'rnatiladi (PWA).

🔗 **O'ynash:** https://TilakovA.github.io/-yangi-yil-koptoki/

## Qanday o'ynaladi

- **Boshqarish:** probel tugmasi yoki ekranni bosish — koptok sakraydi.
- **Qoidalar:** har bir to'siqdan muvaffaqiyatli o'tish — 1 ball. Sovg'a qutisi 🎁 — +5 ball. Shirinlik 🍭 ni yeb olsang, 5 soniyaga to'siqlar sekinlashadi.
- **Jonlar:** Klassik va Qor bo'roni rejimida 3 ta, Tungi rejimda 4 ta jon beriladi — xato qilganingda koptok bir muddat mirillab, zarbadan keyin davom etadi.
- **Rejalar:**
  - 🏙️ **Klassik** — oddiy tezlik, asta-sekin tun cho'kadi.
  - ❄️ **Qor bo'roni** — tezroq o'yin.
  - 🌙 **Tungi rejim** — koptok atrofida yorug'lik doirasi (fonar effekti).
- **Daraja:** har 5 balldan keyin daraja oshadi va to'siqlar tezlashadi; 4-darajadan boshlab to'siqlar tebranib harakat qiladi.
- **Combo:** ketma-ket 5 ta to'siqdan urilmay o'tsang, 🔥 combo bonusi sifatida +2 ball olasan.
- **Yutuqlar:** 🏆 tugmasidan turli maqsadlarni (ball, sovg'alar, combo, kunlik seriya va h.k.) ko'rib, bajarib boring.
- **Koptok ko'rinishlari:** 🎨 tugmasidan rekord va yutuqlar orqali ochiladigan yangi ranglarni tanlang.
- **Kunlik seriya:** har kuni o'ynab, ketma-ket kunlar sonini (🔥 streak) oshirib boring.

## Texnologiyalar

Toza **HTML, CSS va JavaScript** — hech qanday tashqi kutubxonasiz. Progressiv veb-ilova (PWA) sifatida sozlangan:

- `manifest.json` — ilova nomi, ikonkalari va `standalone` rejimi
- `service-worker.js` — fayllarni keshlab, internetsiz ham ishlashni ta'minlaydi
- Mobil ekranlarga avtomatik moslashuvchi interfeys

## Loyihani ishga tushirish

Faylларни (`index.html`, `style.css`, `script.js`, `manifest.json`, `service-worker.js`, `icons/`) bitta papkaga joylab, oddiy veb-server orqali ochish kifoya (PWA xususiyatlari faqat `https` yoki `localhost`da to'liq ishlaydi):

```bash
git clone https://github.com/TilakovA/-yangi-yil-koptoki.git
cd -yangi-yil-koptoki
python3 -m http.server 8000
```

So'ng brauzerda `http://localhost:8000` manzilini och.

## Mobilga o'rnatish

1. Yuqoridagi havolani telefon brauzerida och.
2. **Chrome:** menyu (⋮) → "Qo'shish bosh ekranga" / "Install app".
3. **Safari (iPhone):** Share tugmasi → "Add to Home Screen".

## Dasturchi bilan bog'lanish

- 📧 Email: [space.nebulix@gmail.com](mailto:space.nebulix@gmail.com)
- 💬 Telegram: [@TmAlonee_01](https://t.me/TmAlonee_01)
- 🌐 GitHub: [TilakovA](https://github.com/TilakovA)

Fikr-mulohaza, xatolar yoki hamkorlik takliflari uchun bemalol yozing.
