// ---- Elementlar ----
var koptok = document.getElementById("koptok");
var ballDiv = document.getElementById("ball");
var rekordDiv = document.getElementById("rekord");
var darajaDiv = document.getElementById("daraja");
var jonlarDiv = document.getElementById("jonlar");
var bonusDiv = document.getElementById("bonus");
var kuchHolati = document.getElementById("kuchHolati");
var muteBtn = document.getElementById("muteBtn");
var pauzaTugma = document.getElementById("pauzaTugma");
var pauzaPanel = document.getElementById("pauzaPanel");
var yangiYilBanner = document.getElementById("yangiYilBanner");
var tunDiv = document.getElementById("tun");
var fonQoplama = document.getElementById("fonQoplama");
var xabar = document.getElementById("xabar");
var oyin = document.getElementById("oyin");
var haqidaPanel = document.getElementById("haqidaPanel");
var kontaktPanel = document.getElementById("kontaktPanel");

// ---- Rejalar ----
// Osonroq o'ynalishi uchun: tezlik pasaytirildi, qiyinlashish sekinlashtirildi,
// to'siqlar orasi kengaytirildi va jonlar soni oshirildi.
var REJIMLAR = {
  klassik:   { ikonka: "🏙️", nom: "Klassik",      boshTezlik: 2.5, oshish: 0.35, masofa: 165, jonlar: 3 },
  boron:     { ikonka: "❄️", nom: "Qor bo\u2019roni", boshTezlik: 3.5, oshish: 0.5,  masofa: 145, jonlar: 3 },
  tungi:     { ikonka: "🌙", nom: "Tungi rejim",   boshTezlik: 2.7, oshish: 0.35, masofa: 155, jonlar: 4 },
  halloween: { ikonka: "🎃", nom: "Halloween",    boshTezlik: 3.0, oshish: 0.4,  masofa: 150, jonlar: 3 }
};
var rejim = "klassik";

// ---- O'yin maydoni o'lchamlari (ekranga qarab dinamik) ----
var VIRTUAL_W = 400;          // kenglik doim shu holicha qoladi
var VIRTUAL_H = 600;          // balandlik ekran nisbatiga qarab qayta hisoblanadi
var ORALIQ = 160;             // to'plar orasidagi tirqish (osonroq o'tish uchun kengroq)
var YER_CHEGARASI = VIRTUAL_H - 36;
var BAL_MIN = 70, BAL_MAX = 370;

// ---- Holat ----
var y = 250, tezlik = 0, toqlar = [], konfetlar = [];
var ball = 0, oynayapti = false, toqTezligi = 3;
var jonlar = 2, invuln = 0, sekinVaqti = 0, sovgalarSoni = 0, kadrlar = 0;
var combo = 0, comboEngYuqori = 0;
var pauzada = false;
var joriySovgalar = 0;
var kuchlar = [];
var magnitVaqti = 0, qalqonFaol = false;
var gravitatsiya = 0.42, sakrashKuchi = -7.6;
var SHARCHA_RANGLARI = ["#e53935", "#43a047", "#ffd54f", "#42a5f5", "#ab47bc", "#ffffff"];

// ---- Rekord ----
var rekord = 0;
try {
  rekord = parseInt(localStorage.getItem("koptokRekord"), 10);
  if (isNaN(rekord)) rekord = 0;
} catch (e) { rekord = 0; }
rekordDiv.textContent = "Rekord: " + rekord;

function sanaBugun() {
  var d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function kechagiSana() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function tarixQosh(natija) {
  var tarix = [];
  try { tarix = JSON.parse(localStorage.getItem("koptokTarix") || "[]"); } catch (e) { tarix = []; }
  tarix.push({ b: natija, s: sanaBugun() });
  if (tarix.length > 50) tarix = tarix.slice(-50);
  try { localStorage.setItem("koptokTarix", JSON.stringify(tarix)); } catch (e) {}
  return tarix;
}

// ---- Statistika (yutuqlar va kunlik seriya uchun) ----
var stats = { jamiOyinlar: 0, jamiSovgalar: 0, rejimlar: [] };
try {
  var saqlangan = JSON.parse(localStorage.getItem("koptokStats") || "{}");
  if (saqlangan.jamiOyinlar) stats.jamiOyinlar = saqlangan.jamiOyinlar;
  if (saqlangan.jamiSovgalar) stats.jamiSovgalar = saqlangan.jamiSovgalar;
  if (saqlangan.rejimlar) stats.rejimlar = saqlangan.rejimlar;
} catch (e) {}
function statsSaqlash() { try { localStorage.setItem("koptokStats", JSON.stringify(stats)); } catch (e) {} }

// ---- Tangalar (o'yin ichidagi valyuta — fon do'konida sarflanadi) ----
var tangalar = 0;
try {
  tangalar = parseInt(localStorage.getItem("koptokTanga"), 10);
  if (isNaN(tangalar)) tangalar = 0;
} catch (e) { tangalar = 0; }
function tangaSaqlash() { try { localStorage.setItem("koptokTanga", String(tangalar)); } catch (e) {} }

// ---- Kunlik o'yinlar soni (kundalik topshiriqlar uchun) ----
var kunlikOyinlar = { sana: "", son: 0 };
try { kunlikOyinlar = JSON.parse(localStorage.getItem("koptokKunlikOyinlar") || "{}"); } catch (e) {}
function kunlikOyinSanash() {
  var bugun = sanaBugun();
  if (kunlikOyinlar.sana !== bugun) kunlikOyinlar = { sana: bugun, son: 0 };
  kunlikOyinlar.son++;
  try { localStorage.setItem("koptokKunlikOyinlar", JSON.stringify(kunlikOyinlar)); } catch (e) {}
}

// ---- Global statistika (Firebase) — faqat developer ko'radigan admin panel uchun ----
var firebaseTayyor = false;
var firestoreDb = null;
try {
  if (window.firebase && window.firebaseConfig) {
    firebase.initializeApp(firebaseConfig);
    firestoreDb = firebase.firestore();
    firebaseTayyor = true;
  }
} catch (e) { firebaseTayyor = false; }

function qurilmaId() {
  var id = null;
  try { id = localStorage.getItem("koptokQurilmaId"); } catch (e) {}
  if (!id) {
    id = "q_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    try { localStorage.setItem("koptokQurilmaId", id); } catch (e) {}
  }
  return id;
}

function statistikaYubor(natija) {
  if (!firebaseTayyor) return;
  try {
    firestoreDb.collection("sessiyalar").add({
      ball: natija,
      rejim: rejim,
      qurilma: qurilmaId(),
      vaqt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {}
}

// ---- Global reyting (TOP 10) — hamma o'yinchiga ochiq ----
var REYTING_ISM_KALITI = "koptokIsm";
function oynaIsmiOlish() {
  var ism = null;
  try { ism = localStorage.getItem(REYTING_ISM_KALITI); } catch (e) {}
  if (!ism) {
    ism = "O'yinchi" + Math.floor(Math.random() * 9000 + 1000);
    try { localStorage.setItem(REYTING_ISM_KALITI, ism); } catch (e) {}
  }
  return ism;
}
function ismniSaqlash() {
  var input = document.getElementById("reytingIsm");
  if (!input) return;
  var yangiIsm = (input.value || "").trim().slice(0, 24);
  if (!yangiIsm) return;
  try { localStorage.setItem(REYTING_ISM_KALITI, yangiIsm); } catch (e) {}
  reytingYubor();
  reytingYukla();
  ovoz(700, 0.08, "triangle");
}
function reytingYubor() {
  if (!firebaseTayyor || rekord <= 0) return;
  try {
    firestoreDb.collection("reyting").doc(qurilmaId()).set({
      ism: oynaIsmiOlish(),
      ball: rekord,
      vaqt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {}
}
function reytingYukla() {
  var royxatEl = document.getElementById("reytingRoyxati");
  var ismInput = document.getElementById("reytingIsm");
  if (!royxatEl) return;
  if (ismInput) ismInput.value = oynaIsmiOlish();
  if (!firebaseTayyor) {
    royxatEl.innerHTML = "<p class=\"reyting-xabar\">Reyting yuklanmadi (internet kerak).</p>";
    return;
  }
  royxatEl.innerHTML = "<p class=\"reyting-xabar\">Yuklanmoqda...</p>";
  firestoreDb.collection("reyting").orderBy("ball", "desc").limit(10).get().then(function (snap) {
    if (snap.empty) {
      royxatEl.innerHTML = "<p class=\"reyting-xabar\">Hali hech kim yo'q. Birinchi bo'ling!</p>";
      return;
    }
    var medallar = ["🥇", "🥈", "🥉"];
    var html = "";
    var indeks = 0;
    snap.forEach(function (doc) {
      var d = doc.data();
      var belgi = indeks < 3 ? medallar[indeks] : (indeks + 1) + ".";
      var ozimniki = doc.id === qurilmaId();
      html += "<div class=\"reyting-qatori" + (ozimniki ? " ozim" : "") + "\">" +
        "<span class=\"reyting-orin\">" + belgi + "</span>" +
        "<span class=\"reyting-ism\">" + (d.ism || "O'yinchi") + (ozimniki ? " (siz)" : "") + "</span>" +
        "<span class=\"reyting-ball\">" + d.ball + "</span>" +
        "</div>";
      indeks++;
    });
    royxatEl.innerHTML = html;
  }).catch(function () {
    royxatEl.innerHTML = "<p class=\"reyting-xabar\">Yuklab bo'lmadi, qaytadan urinib ko'ring.</p>";
  });
}

// ---- Kunlik seriya (streak) ----
var streak = 0;
try { streak = (JSON.parse(localStorage.getItem("koptokStreak") || "{}").count) || 0; } catch (e) {}
function streakYangilash() {
  var bugun = sanaBugun();
  var eski = { count: 0, last: "" };
  try { eski = JSON.parse(localStorage.getItem("koptokStreak") || "{}"); } catch (e) {}
  if (eski.last === bugun) { streak = eski.count || 1; return; }
  streak = (eski.last === kechagiSana()) ? (eski.count || 0) + 1 : 1;
  try { localStorage.setItem("koptokStreak", JSON.stringify({ count: streak, last: bugun })); } catch (e) {}
}

// ---- Kundalik topshiriqlar ----
// Har kuni (sana bo'yicha) ro'yxatdan bitta vazifa avtomatik tanlanadi.
// Bajarilsa — tanga mukofoti beriladi va kuni bo'yicha faqat bir marta hisoblanadi.
var KUNDALIK_TOPSHIRIQLAR = [
  { id: "ball15", matn: "Bir o'yinda 15 ball to'plang", mukofot: 20, shart: function (ctx) { return ctx.ball >= 15; } },
  { id: "sovga3", matn: "Bir o'yinda 3 ta sovg'a yig'ing", mukofot: 20, shart: function (ctx) { return ctx.joriySovgalar >= 3; } },
  { id: "combo5", matn: "Bir o'yinda 5 ta ketma-ket to'siqdan o'ting", mukofot: 20, shart: function (ctx) { return ctx.comboEngYuqori >= 5; } },
  { id: "oyin2",  matn: "Bugun kamida 2 marta o'ynang", mukofot: 15, shart: function (ctx) { return ctx.bugungiOyinlar >= 2; } },
  { id: "ball30", matn: "Bir o'yinda 30 ball to'plang", mukofot: 30, shart: function (ctx) { return ctx.ball >= 30; } }
];
function bugungiTopshiriq() {
  var bugun = sanaBugun();
  var yigindi = 0;
  for (var i = 0; i < bugun.length; i++) yigindi += bugun.charCodeAt(i);
  return KUNDALIK_TOPSHIRIQLAR[yigindi % KUNDALIK_TOPSHIRIQLAR.length];
}
function topshiriqHolatiOlish() {
  var bugun = sanaBugun();
  var holat = { sana: "", bajarildi: false };
  try { holat = JSON.parse(localStorage.getItem("koptokTopshiriq") || "{}"); } catch (e) {}
  if (holat.sana !== bugun) return { sana: bugun, bajarildi: false };
  return holat;
}
function kundalikTopshiriqniTekshir(ctx) {
  var holat = topshiriqHolatiOlish();
  if (holat.bajarildi) return null;
  var vazifa = bugungiTopshiriq();
  if (!vazifa.shart(ctx)) return null;
  holat.bajarildi = true;
  try { localStorage.setItem("koptokTopshiriq", JSON.stringify(holat)); } catch (e) {}
  tangalar += vazifa.mukofot;
  tangaSaqlash();
  return vazifa;
}

// ---- Yutuqlar (achievements) ----
var ACHIEVEMENTS = [
  { id: "birinchi", ikon: "🎮", nom: "Birinchi qadam", tavsif: "Birinchi marta o'ynang", shart: function (ctx) { return ctx.stats.jamiOyinlar >= 1; } },
  { id: "ball10",   ikon: "⭐", nom: "Yulduzcha",      tavsif: "Bir o'yinda 10 ball to'plang", shart: function (ctx) { return ctx.ball >= 10; } },
  { id: "ball25",   ikon: "🌟", nom: "Yorqin natija",  tavsif: "Bir o'yinda 25 ball to'plang", shart: function (ctx) { return ctx.ball >= 25; } },
  { id: "ball50",   ikon: "💫", nom: "Usta",           tavsif: "Bir o'yinda 50 ball to'plang", shart: function (ctx) { return ctx.ball >= 50; } },
  { id: "ball100",  ikon: "👑", nom: "Afsona",         tavsif: "Bir o'yinda 100 ball to'plang", shart: function (ctx) { return ctx.ball >= 100; } },
  { id: "rejimchi", ikon: "🗺️", nom: "Sayohatchi",     tavsif: "Barcha 4 rejimda o'ynang", shart: function (ctx) { return ctx.stats.rejimlar.length >= 4; } },
  { id: "sovgachi", ikon: "🎁", nom: "Sovg'a ustasi",  tavsif: "Jami 20 ta sovg'a qutisi yig'ing", shart: function (ctx) { return ctx.stats.jamiSovgalar >= 20; } },
  { id: "kombochi", ikon: "🔥", nom: "Olov seriya",    tavsif: "Bir o'yinda 10 ta ketma-ket to'siqdan o'ting", shart: function (ctx) { return ctx.comboEngYuqori >= 10; } },
  { id: "sodiq",    ikon: "📅", nom: "Sodiq o'yinchi", tavsif: "3 kun ketma-ket o'ynang", shart: function (ctx) { return ctx.streak >= 3; } }
];
var yutuqlarOchilgan = [];
try { yutuqlarOchilgan = JSON.parse(localStorage.getItem("koptokYutuqlar") || "[]"); } catch (e) { yutuqlarOchilgan = []; }

function yutuqToastKorsat(a) {
  var el = document.createElement("div");
  el.className = "yutuq-toast";
  el.innerHTML = "<span>" + a.ikon + "</span><div><b>YUTUQ OCHILDI</b><br>" + a.nom + "</div>";
  oyin.appendChild(el);
  ovoz(784, 0.12, "sine");
  setTimeout(function () { ovoz(1047, 0.18, "sine"); }, 120);
  setTimeout(function () {
    el.classList.add("yutuq-toast-ketish");
    setTimeout(function () { el.remove(); }, 400);
  }, 2600);
}
function yutuqlarniTekshir(ctx) {
  var ozgardi = false;
  ACHIEVEMENTS.forEach(function (a) {
    if (yutuqlarOchilgan.indexOf(a.id) === -1 && a.shart(ctx)) {
      yutuqlarOchilgan.push(a.id);
      yutuqToastKorsat(a);
      ozgardi = true;
    }
  });
  if (ozgardi) { try { localStorage.setItem("koptokYutuqlar", JSON.stringify(yutuqlarOchilgan)); } catch (e) {} }
}
function yutuqlarRender() {
  var html = "";
  ACHIEVEMENTS.forEach(function (a) {
    var ochiq = yutuqlarOchilgan.indexOf(a.id) !== -1;
    html += "<div class=\"yutuq-band" + (ochiq ? "" : " qulf") + "\">" +
      "<span class=\"yutuq-ikon\">" + (ochiq ? a.ikon : "🔒") + "</span>" +
      "<div class=\"yutuq-matn\"><b>" + a.nom + "</b><br><small>" + a.tavsif + "</small></div>" +
      "</div>";
  });
  document.getElementById("yutuqlarRoyxati").innerHTML = html;
}

// ---- Koptok skinlari ----
var SKINLAR = [
  { id: "oltin",  nom: "Oltin",    rang1: "#ffd54f", rang2: "#e65100" },
  { id: "zumrad", nom: "Zumrad",   rang1: "#69f0ae", rang2: "#00695c", shart: function (ctx) { return ctx.rekord >= 15; } },
  { id: "yoqut",  nom: "Yoqut",    rang1: "#ff8a80", rang2: "#b71c1c", shart: function (ctx) { return ctx.rekord >= 30; } },
  { id: "feruza", nom: "Feruza",   rang1: "#84ffff", rang2: "#006064", shart: function (ctx) { return ctx.rekord >= 50; } },
  { id: "kumush", nom: "Kumush",   rang1: "#eceff1", rang2: "#455a64", shart: function (ctx) { return ctx.yutuqlar.indexOf("rejimchi") !== -1; } },
  { id: "olmos",  nom: "Olmos 👑", rang1: "#e1f5fe", rang2: "#0277bd", premium: true }
];
var premiumOchildi = false;
try { premiumOchildi = localStorage.getItem("koptokPremium") === "1"; } catch (e) {}
var joriySkin = "oltin";
try { joriySkin = localStorage.getItem("koptokSkin") || "oltin"; } catch (e) {}

function skinOchiqmi(skin) {
  if (skin.id === "oltin") return true;
  if (skin.premium) return premiumOchildi;
  if (skin.shart) return skin.shart({ rekord: rekord, yutuqlar: yutuqlarOchilgan });
  return false;
}
function skinQollash(id) {
  var skin = SKINLAR[0];
  for (var i = 0; i < SKINLAR.length; i++) if (SKINLAR[i].id === id) skin = SKINLAR[i];
  if (id === "olmos") {
    koptok.classList.add("skin-olmos");
    koptok.style.background = "";
  } else {
    koptok.classList.remove("skin-olmos");
    koptok.style.background = "radial-gradient(circle at 30% 30%, " + skin.rang1 + ", " + skin.rang2 + ")";
  }
}
function skinTanlash(id) {
  var skin = null;
  for (var i = 0; i < SKINLAR.length; i++) if (SKINLAR[i].id === id) skin = SKINLAR[i];
  if (!skin || !skinOchiqmi(skin)) return;
  joriySkin = id;
  try { localStorage.setItem("koptokSkin", id); } catch (e) {}
  skinQollash(id);
  skinlarRender();
  ovoz(700, 0.08, "triangle");
}
function skinlarRender() {
  var html = "";
  SKINLAR.forEach(function (s) {
    var ochiq = skinOchiqmi(s);
    var faol = joriySkin === s.id;
    html += "<button class=\"skin-dona" + (faol ? " tanlangan" : "") + (ochiq ? "" : " qulf") + "\"" +
      (ochiq ? " onclick=\"skinTanlash('" + s.id + "')\"" : "") + ">" +
      "<span class=\"skin-shar\" style=\"background:radial-gradient(circle at 30% 30%," + s.rang1 + "," + s.rang2 + ")\"></span>" +
      "<small>" + (ochiq ? s.nom : "🔒") + "</small>" +
      "</button>";
  });
  document.getElementById("skinlarRoyxati").innerHTML = html;
}

// ---- Fon do'koni (tangaga sotib olinadigan premium fonlar) ----
var FONLAR = [
  { id: "standart",  nom: "Standart",            narx: 0 },
  { id: "shahar",    nom: "Shahar tunda",        narx: 85 },
  { id: "galaktika", nom: "Galaktika",           narx: 100 },
  { id: "shimoliy",  nom: "Shimoliy chiroqlar",  narx: 150 }
];
var fonlarOchilgan = ["standart"];
try {
  var saqlanganFonlar = JSON.parse(localStorage.getItem("koptokFonlar") || "[]");
  if (saqlanganFonlar.length) fonlarOchilgan = fonlarOchilgan.concat(saqlanganFonlar.filter(function (id) { return id !== "standart"; }));
} catch (e) {}
var joriyFon = "standart";
try { joriyFon = localStorage.getItem("koptokJoriyFon") || "standart"; } catch (e) {}

function fonOchiqmi(id) { return fonlarOchilgan.indexOf(id) !== -1; }
function fonTanlash(id) {
  if (!fonOchiqmi(id)) return;
  joriyFon = id;
  try { localStorage.setItem("koptokJoriyFon", id); } catch (e) {}
  temaYangilash();
  fonlarRender();
  ovoz(700, 0.08, "triangle");
}
function fonSotibOl(id) {
  var fon = null;
  for (var i = 0; i < FONLAR.length; i++) if (FONLAR[i].id === id) fon = FONLAR[i];
  if (!fon || fonOchiqmi(id)) return;
  var xabarEl = document.getElementById("fonXabar");
  if (tangalar < fon.narx) {
    if (xabarEl) { xabarEl.textContent = "❌ Tangangiz yetarli emas."; xabarEl.style.color = "#ff8a80"; }
    zarbaOvozi();
    return;
  }
  tangalar -= fon.narx;
  tangaSaqlash();
  fonlarOchilgan.push(id);
  try { localStorage.setItem("koptokFonlar", JSON.stringify(fonlarOchilgan)); } catch (e) {}
  if (xabarEl) { xabarEl.textContent = "✅ \"" + fon.nom + "\" sotib olindi!"; xabarEl.style.color = "#69f0ae"; }
  ovoz(990, 0.18, "sine", 1320);
  fonTanlash(id);
}
function fonlarRender() {
  var balansEl = document.getElementById("tangaBalansi");
  if (balansEl) balansEl.textContent = "💎 " + tangalar;
  var xabarEl = document.getElementById("fonXabar");
  if (xabarEl) xabarEl.textContent = "";
  var html = "";
  FONLAR.forEach(function (f) {
    var ochiq = fonOchiqmi(f.id);
    var faol = joriyFon === f.id;
    html += "<div class=\"fon-dona" + (faol ? " tanlangan" : "") + "\">" +
      "<div class=\"fon-oldindan-korish" + (f.id !== "standart" ? " fon-" + f.id : " fon-standart-korish") + "\"></div>" +
      "<small>" + f.nom + "</small>";
    if (faol) {
      html += "<span class=\"fon-holat\">✅ Tanlangan</span>";
    } else if (ochiq) {
      html += "<button class=\"liquid rejim fon-tugma\" onclick=\"fonTanlash('" + f.id + "')\">Tanlash</button>";
    } else {
      html += "<button class=\"liquid rejim fon-tugma\" onclick=\"fonSotibOl('" + f.id + "')\">💎 " + f.narx + " — Sotib olish</button>";
    }
    html += "</div>";
  });
  document.getElementById("fonlarRoyxati").innerHTML = html;
  elementTolqinlarUlash(document.getElementById("fonlarPanel"));
}

// ---- Premium (yashirin bo'lim) ----
var PREMIUM_KOD = "YANGIYIL2027";
var logoBosishSoni = 0, logoBosishTaymer = null;
function logoBosildi() {
  logoBosishSoni++;
  clearTimeout(logoBosishTaymer);
  logoBosishTaymer = setTimeout(function () { logoBosishSoni = 0; }, 1500);
  if (logoBosishSoni >= 5) {
    logoBosishSoni = 0;
    panelKorsat("premiumPanel");
  }
}
function premiumFaollashtir() {
  var kodEl = document.getElementById("premiumKod");
  var xabarEl = document.getElementById("premiumXabar");
  var kiritilgan = (kodEl.value || "").trim().toUpperCase();
  if (kiritilgan === PREMIUM_KOD) {
    premiumOchildi = true;
    try { localStorage.setItem("koptokPremium", "1"); } catch (e) {}
    document.getElementById("premiumBelgisi").classList.remove("hidden");
    skinTanlash("olmos");
    // Premium (faqat sizda bo'lgan maxfiy kod) — barcha fonlarni ham bepul ochadi, sinash uchun
    FONLAR.forEach(function (f) {
      if (!fonOchiqmi(f.id)) fonlarOchilgan.push(f.id);
    });
    try { localStorage.setItem("koptokFonlar", JSON.stringify(fonlarOchilgan)); } catch (e) {}
    moslash();
    xabarEl.textContent = "✅ Premium faollashtirildi! Olmos skin va barcha fonlar bepul ochildi.";
    xabarEl.style.color = "#69f0ae";
    ovoz(990, 0.2, "sine");
  } else {
    xabarEl.textContent = "❌ Kod noto'g'ri.";
    xabarEl.style.color = "#ff8a80";
    zarbaOvozi();
  }
}

// ---- Ovoz ----
var ovozYoniq = true;
try { ovozYoniq = localStorage.getItem("koptokOvoz") !== "0"; } catch (e) {}
function muteYangilash() { muteBtn.textContent = ovozYoniq ? "🔊" : "🔇"; }
muteBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  ovozYoniq = !ovozYoniq;
  try { localStorage.setItem("koptokOvoz", ovozYoniq ? "1" : "0"); } catch (err) {}
  muteYangilash();
  ovoz(700, 0.08, "triangle");
});
muteBtn.addEventListener("touchstart", function (e) { e.stopPropagation(); });

var audioCtx = null;
// chastotaOxiri (ixtiyoriy) berilsa, tovush shu chastotaga qarab "sweep" qiladi —
// natijada tovush tekis emas, boyroq va jonli eshitiladi.
function ovoz(chastota, davomiylik, turi, chastotaOxiri) {
  if (!ovozYoniq) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = turi || "sine";
    osc.frequency.setValueAtTime(chastota, audioCtx.currentTime);
    if (chastotaOxiri) {
      osc.frequency.exponentialRampToValueAtTime(chastotaOxiri, audioCtx.currentTime + davomiylik);
    }
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + davomiylik);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + davomiylik);
  } catch (e) {}
}
function sakrashOvozi()  { ovoz(460, 0.12, "square", 700); }
function ballOvozi()     { ovoz(880, 0.14, "sine", 1240); }
function yiqilishOvozi() { ovoz(260, 0.55, "sawtooth", 50); }
function sovgaOvozi()    { ovoz(660, 0.1, "sine", 860); setTimeout(function () { ovoz(990, 0.18, "sine", 1320); }, 100); }
function konfetOvozi()   { ovoz(880, 0.08, "triangle", 1046); setTimeout(function () { ovoz(1046, 0.18, "triangle", 1568); }, 90); }
function zarbaOvozi()    { ovoz(300, 0.22, "square", 90); }

// ---- Yangi yil mo'jizasi ----
// 31-dekabr soat 23:55 dan boshlab yuqorida sanoq banneri chiqadi.
// Soat 00:00 bo'lib, yangi yilga o'tilganda — bir martalik tabrik animatsiyasi
// (konfeti portlashi + tabrik matni) ko'rsatiladi. Har bir yil uchun faqat bir
// marta chiqishi uchun localStorage'da belgi saqlanadi.
function yangiYilBannerYangilash() {
  var hozir = new Date();
  var dekabr31Mi = hozir.getMonth() === 11 && hozir.getDate() === 31;
  var vaqtMos = dekabr31Mi && hozir.getHours() === 23 && hozir.getMinutes() >= 55;
  if (!vaqtMos) { yangiYilBanner.classList.add("hidden"); return; }
  var maqsad = new Date(hozir.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
  var qolgan = Math.max(0, maqsad.getTime() - hozir.getTime());
  var daqiqa = Math.floor(qolgan / 60000);
  var soniya = Math.floor((qolgan % 60000) / 1000);
  yangiYilBanner.textContent = "🎆 Yangi yilgacha: " + daqiqa + ":" + (soniya < 10 ? "0" : "") + soniya;
  yangiYilBanner.classList.remove("hidden");
}
function mojizaKorsat() {
  var qoplama = document.createElement("div");
  qoplama.className = "mojiza-qoplama";
  qoplama.innerHTML = "<div class=\"mojiza-matn\">🎉<br>Yangi yil bilan!<br><span>" +
    (new Date().getFullYear()) + "</span></div>";
  oyin.appendChild(qoplama);

  for (var i = 0; i < 55; i++) {
    (function (idx) {
      setTimeout(function () {
        var k = document.createElement("div");
        k.className = "mojiza-konfet";
        k.style.left = Math.random() * VIRTUAL_W + "px";
        k.style.background = SHARCHA_RANGLARI[Math.floor(Math.random() * SHARCHA_RANGLARI.length)];
        k.style.animationDuration = (Math.random() * 2 + 2.3) + "s";
        k.style.setProperty("--mojiza-masofa", (VIRTUAL_H + 60) + "px");
        qoplama.appendChild(k);
        setTimeout(function () { k.remove(); }, 5200);
      }, idx * 35);
    })(i);
  }

  ovoz(784, 0.16, "sine", 1047);
  setTimeout(function () { ovoz(1047, 0.16, "sine", 1568); }, 160);
  setTimeout(function () { ovoz(1568, 0.22, "sine", 2093); }, 320);

  setTimeout(function () {
    qoplama.classList.add("mojiza-ketish");
    setTimeout(function () { qoplama.remove(); }, 600);
  }, 6000);
}
function yangiYilTekshir() {
  yangiYilBannerYangilash();
  var hozir = new Date();
  if (hozir.getMonth() === 0 && hozir.getDate() === 1) {
    var kalit = "koptokMojiza" + hozir.getFullYear();
    var korsatilganmi = false;
    try { korsatilganmi = localStorage.getItem(kalit) === "1"; } catch (e) {}
    if (!korsatilganmi) {
      mojizaKorsat();
      try { localStorage.setItem(kalit, "1"); } catch (e) {}
    }
  }
}
setInterval(yangiYilTekshir, 1000);

// ---- Qor va yulduzlar ----
function yulduzlarOsish() {
  for (var i = 0; i < 30; i++) {
    var yulduz = document.createElement("div");
    yulduz.className = "yulduz";
    yulduz.style.left = Math.random() * 100 + "%";
    yulduz.style.top = Math.random() * 50 + "%";
    yulduz.style.animationDelay = (Math.random() * 2.5) + "s";
    oyin.appendChild(yulduz);
  }
}
function qorTushir() {
  var qor = document.createElement("div");
  if (rejim === "halloween") {
    qor.className = "yarasa";
    qor.textContent = "🦇";
    qor.style.fontSize = (Math.random() * 10 + 14) + "px";
  } else {
    qor.className = "qor";
    var olcham = Math.random() * 5 + 3;
    qor.style.width = olcham + "px";
    qor.style.height = olcham + "px";
  }
  qor.style.left = Math.random() * VIRTUAL_W + "px";
  qor.style.setProperty("--qor-masofa", (VIRTUAL_H + 40) + "px");
  qor.style.animationDuration = (Math.random() * 4 + 5) + "s";
  oyin.appendChild(qor);
  setTimeout(function () { qor.remove(); }, 9500);
}
setInterval(qorTushir, 300);

// ---- Liquid Glass to'lqinlari ----
function tolqinYarat(btn, hodisa) {
  var rect = btn.getBoundingClientRect();
  var x = (hodisa.touches ? hodisa.touches[0].clientX : hodisa.clientX) - rect.left;
  var y2 = (hodisa.touches ? hodisa.touches[0].clientY : hodisa.clientY) - rect.top;
  var tolqin = document.createElement("span");
  tolqin.className = "tolqin";
  tolqin.style.left = x + "px";
  tolqin.style.top = y2 + "px";
  tolqin.style.width = tolqin.style.height = Math.max(rect.width, rect.height) + "px";
  btn.appendChild(tolqin);
  tolqin.addEventListener("animationend", function () { tolqin.remove(); });
}
function tolqinlarniUlash() {
  xabar.querySelectorAll("button.liquid").forEach(function (btn) {
    btn.addEventListener("click", function (e) { tolqinYarat(btn, e); });
  });
}
function elementTolqinlarUlash(root) {
  root.querySelectorAll("button.liquid").forEach(function (btn) {
    btn.addEventListener("click", function (e) { tolqinYarat(btn, e); });
  });
}

// ---- Menyu ----
function rejimTugmasi(r) {
  var t = REJIMLAR[r];
  return "<button class=\"liquid rejim" + (rejim === r ? " tanlangan" : "") +
    "\" data-rejim=\"" + r + "\">" + t.ikonka + " " + t.nom + "</button>";
}
function kontaktTugmalari() {
  var infoSvg = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"></circle><line x1=\"12\" y1=\"11\" x2=\"12\" y2=\"16.5\"></line><circle cx=\"12\" cy=\"7.6\" r=\"1.15\" fill=\"currentColor\" stroke=\"none\"></circle></svg>";
  var mailSvg = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"2.2\"></rect><path d=\"M4 7l8 6 8-6\"></path></svg>";
  var trophySvg = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 4h8v4a4 4 0 0 1-8 0V4z\"></path><path d=\"M8 5H5a3 3 0 0 0 3 3\"></path><path d=\"M16 5h3a3 3 0 0 1-3 3\"></path><path d=\"M12 12v3.5\"></path><path d=\"M9 20h6\"></path><path d=\"M10 15.5h4v1.8a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-1.8z\"></path></svg>";
  var fonSvg = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"></rect><path d=\"M3 16l5-5 4 4 3-3 6 6\"></path><circle cx=\"8.5\" cy=\"8.5\" r=\"1.4\" fill=\"currentColor\" stroke=\"none\"></circle></svg>";
  var reytingSvg = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"5\" y1=\"20\" x2=\"5\" y2=\"13\"></line><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"8\"></line><line x1=\"19\" y1=\"20\" x2=\"19\" y2=\"4\"></line></svg>";
  var paletteSvg = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21a9 9 0 0 1 0-18 7 7 0 0 1 7 7c0 2.2-1.8 3.5-3.7 3.5h-1.1a1.7 1.7 0 0 0 0 3.4H15a1.3 1.3 0 0 1 0 2.6 9 9 0 0 1-3 1.5z\"></path><circle cx=\"7.5\" cy=\"10.5\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"></circle><circle cx=\"10.5\" cy=\"7\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"></circle><circle cx=\"15\" cy=\"7.5\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"></circle></svg>";
  return "<div class=\"utility-qatori\">" +
    "<button class=\"ikonka-tugma\" title=\"O\u2019yin haqida\" onclick=\"panelKorsat(\'haqidaPanel\')\">" + infoSvg + "</button>" +
    "<button class=\"ikonka-tugma\" title=\"Yutuqlar\" onclick=\"panelKorsat(\'yutuqlarPanel\')\">" + trophySvg + "</button>" +
    "<button class=\"ikonka-tugma\" title=\"Skinlar\" onclick=\"panelKorsat(\'skinlarPanel\')\">" + paletteSvg + "</button>" +
    "<button class=\"ikonka-tugma\" title=\"Fonlar\" onclick=\"panelKorsat(\'fonlarPanel\')\">" + fonSvg + "</button>" +
    "<button class=\"ikonka-tugma\" title=\"Reyting\" onclick=\"panelKorsat(\'reytingPanel\')\">" + reytingSvg + "</button>" +
    "<button class=\"ikonka-tugma\" title=\"Bog\u2019lanish\" onclick=\"panelKorsat(\'kontaktPanel\')\">" + mailSvg + "</button>" +
    "</div>";
}
function menuHtml() {
  var streakHtml = streak >= 1 ? "<span class=\"streak-badge\">\uD83D\uDD25 " + streak + " kunlik seriya</span>" : "";
  var tangaHtml = "<span class=\"tanga-badge\">\uD83D\uDC8E " + tangalar + "</span>";
  var topshiriq = bugungiTopshiriq();
  var topshiriqHolati = topshiriqHolatiOlish();
  var topshiriqHtml = "<p class=\"topshiriq-matn" + (topshiriqHolati.bajarildi ? " bajarilgan" : "") + "\">" +
    (topshiriqHolati.bajarildi ? "\u2705 Bugungi topshiriq bajarildi!" : "\uD83C\uDFAF " + topshiriq.matn + " (\uD83D\uDC8E+" + topshiriq.mukofot + ")") +
    "</p>";
  return "<h1 onclick=\"logoBosildi()\">Yangi Yil Koptoki \uD83C\uDF84</h1>" +
    "<p>Probel bosing yoki ekranni bosib sakrating</p>" +
    "<p>Konfet tayoqchalarga tegmang, sovg'alar yig'ing!</p>" +
    "<div class=\"menu-belgilar\">" + streakHtml + tangaHtml + "</div>" +
    topshiriqHtml +
    "<button class=\"bosh-tugma\" onclick=\"boshlash()\">Boshlash</button>" +
    "<div class=\"rejim-qatori\">" +
      rejimTugmasi("klassik") + rejimTugmasi("boron") + rejimTugmasi("tungi") + rejimTugmasi("halloween") +
    "</div>" +
    kontaktTugmalari();
}
var FON_SINFLARI = ["fon-shahar", "fon-galaktika", "fon-shimoliy"];
function temaYangilash() {
  oyin.classList.remove("tema-halloween");
  FON_SINFLARI.forEach(function (c) { oyin.classList.remove(c); });
  if (rejim === "halloween") {
    oyin.classList.add("tema-halloween");
  } else if (joriyFon !== "standart") {
    oyin.classList.add("fon-" + joriyFon);
  }
}
function rejimlarniUlash() {
  xabar.querySelectorAll(".rejim").forEach(function (btn) {
    btn.addEventListener("click", function () {
      rejim = btn.getAttribute("data-rejim");
      xabar.querySelectorAll(".rejim").forEach(function (b) { b.classList.remove("tanlangan"); });
      btn.classList.add("tanlangan");
      temaYangilash();
      ovoz(700, 0.08, "triangle");
    });
  });
}
function menuKorsat() {
  fonQoplama.classList.add("hidden");
  tunDiv.style.opacity = "0";
  xabar.classList.remove("hidden");
  xabar.innerHTML = menuHtml();
  rejimlarniUlash();
  tolqinlarniUlash();
  pauzaTugma.classList.add("hidden");
  temaYangilash();
}
var BARCHA_PANELLAR = ["haqidaPanel", "kontaktPanel", "yutuqlarPanel", "skinlarPanel", "premiumPanel", "fonlarPanel", "reytingPanel"];
function menuQaytish() {
  BARCHA_PANELLAR.forEach(function (pid) {
    var el = document.getElementById(pid);
    if (el) el.classList.add("hidden");
  });
  menuKorsat();
}
function panelKorsat(id) {
  if (oynayapti) return;
  BARCHA_PANELLAR.forEach(function (pid) {
    var el = document.getElementById(pid);
    if (el) el.classList.toggle("hidden", pid !== id);
  });
  xabar.classList.add("hidden");
  if (id === "yutuqlarPanel") yutuqlarRender();
  if (id === "skinlarPanel") skinlarRender();
  if (id === "fonlarPanel") fonlarRender();
  if (id === "reytingPanel") reytingYukla();
}
function panelYop() {
  BARCHA_PANELLAR.forEach(function (pid) {
    var el = document.getElementById(pid);
    if (el) el.classList.add("hidden");
  });
  if (!oynayapti) xabar.classList.remove("hidden");
}

// ---- Pauza ----
function pauzaOch() {
  if (!oynayapti || pauzada) return;
  pauzada = true;
  pauzaPanel.classList.remove("hidden");
  ovoz(500, 0.08, "triangle");
}
function pauzaYop() {
  pauzada = false;
  pauzaPanel.classList.add("hidden");
  ovoz(700, 0.08, "triangle");
}
function qaytaBoshlash() {
  pauzaPanel.classList.add("hidden");
  pauzada = false;
  boshlash();
}
function pauzadanMenyuga() {
  pauzaPanel.classList.add("hidden");
  pauzada = false;
  oynayapti = false;
  menuKorsat();
}
pauzaTugma.addEventListener("click", function (e) { e.stopPropagation(); pauzaOch(); });
pauzaTugma.addEventListener("touchstart", function (e) { e.stopPropagation(); });

// ---- Boshlash ----
function boshlash() {
  var sozlama = REJIMLAR[rejim];
  moslash();
  temaYangilash();
  y = Math.round(VIRTUAL_H / 2) - 50; tezlik = 0; ball = 0;
  toqTezligi = sozlama.boshTezlik * (premiumOchildi ? 0.85 : 1);
  jonlar = sozlama.jonlar + (premiumOchildi ? 1 : 0);
  invuln = 0; sekinVaqti = 0; sovgalarSoni = 0; kadrlar = 0;
  combo = 0; comboEngYuqori = 0;
  pauzada = false;
  joriySovgalar = 0;
  magnitVaqti = 0; qalqonFaol = false;
  kuchlar.forEach(function (k) { k.el.remove(); });
  kuchlar = [];
  kuchHolati.classList.add("hidden");
  toqlar.forEach(function (t) { t.juftlik.remove(); });
  toqlar = [];
  konfetlar.forEach(function (k) { k.el.remove(); });
  konfetlar = [];
  oynayapti = true;
  stats.jamiOyinlar++;
  if (stats.rejimlar.indexOf(rejim) === -1) stats.rejimlar.push(rejim);
  statsSaqlash();
  streakYangilash();
  kunlikOyinSanash();
  panelYop();
  xabar.classList.add("hidden");
  pauzaTugma.classList.remove("hidden");
  ballDiv.textContent = "0";
  darajaDiv.textContent = "Daraja: 1";
  jonlarYangilash();
  bonusDiv.textContent = "";
  tunDiv.style.opacity = "0";
  if (rejim === "tungi") fonQoplama.classList.remove("hidden");
  else fonQoplama.classList.add("hidden");
  koptok.style.top = y + "px";
  koptok.style.transform = "rotate(0deg)";
  koptok.style.visibility = "visible";
  koptok.classList.remove("mir");
  if (!window.siklIshgaTushdi) {
    window.siklIshgaTushdi = true;
    requestAnimationFrame(sikl);
  }
}

function jonlarYangilash() {
  var s = "";
  for (var i = 0; i < jonlar; i++) s += "❤️";
  jonlarDiv.textContent = s;
}

function sakrash() {
  if (oynayapti && !pauzada) {
    tezlik = sakrashKuchi;
    sakrashOvozi();
  }
}

// ---- To'plar va sovg'alar ----
function sharchalarIlish(el, yuqoriMi, balandlik) {
  var soni = Math.max(1, Math.floor(balandlik / 90));
  for (var i = 0; i < soni; i++) {
    var sh = document.createElement("div");
    sh.className = "sharcha";
    sh.style.background = SHARCHA_RANGLARI[Math.floor(Math.random() * SHARCHA_RANGLARI.length)];
    sh.style.left = Math.random() * 44 + "px";
    if (yuqoriMi) sh.style.top = (balandlik - 40 - i * 34) + "px";
    else sh.style.top = (30 + i * 34) + "px";
    el.appendChild(sh);
  }
}

function toqQosh() {
  var oraliq = ORALIQ;
  var yuqoriBalandlik = Math.random() * (BAL_MAX - BAL_MIN) + BAL_MIN;
  var juftlik = document.createElement("div");
  juftlik.className = "toqlarJuftligi";
  juftlik.style.left = VIRTUAL_W + "px";
  juftlik.style.height = VIRTUAL_H + "px";
  var el1 = document.createElement("div");
  el1.className = "toq past";
  el1.style.height = yuqoriBalandlik + "px";
  sharchalarIlish(el1, true, yuqoriBalandlik);
  var el2 = document.createElement("div");
  el2.className = "toq yuqori";
  el2.style.height = (VIRTUAL_H - yuqoriBalandlik - oraliq) + "px";
  sharchalarIlish(el2, false, VIRTUAL_H - yuqoriBalandlik - oraliq);
  juftlik.appendChild(el1);
  juftlik.appendChild(el2);

  // Har 3-to'qda sovg'a qutisi
  sovgalarSoni++;
  var sovga = null;
  if (sovgalarSoni % 3 === 0) {
    sovga = document.createElement("div");
    sovga.className = "sovga";
    sovga.textContent = "🎁";
    sovga.style.left = "17px";
    sovga.style.top = (yuqoriBalandlik + oraliq / 2 - 15) + "px";
    juftlik.appendChild(sovga);
  }

  // 4-darajadan boshlab, sovg'asiz to'siqlarda — qo'shimcha harakatlanuvchi xavf
  // (Halloween rejimida 👻 arvoh, boshqa rejimlarda 🧊 muz bo'lagi). Gap ichida
  // mustaqil tebranadi va tegib ketsa jon kamayadi (ustunga tegish bilan bir xil).
  var daraja = Math.floor(ball / 5) + 1;
  var xavf = null;
  if (daraja >= 4 && !sovga && Math.random() < 0.45) {
    var xavfEl = document.createElement("div");
    xavfEl.className = "xavf";
    xavfEl.textContent = rejim === "halloween" ? "👻" : "🧊";
    juftlik.appendChild(xavfEl);
    xavf = { el: xavfEl, faza: Math.random() * 6.28 };
  }

  oyin.appendChild(juftlik);
  toqlar.push({
    juftlik: juftlik, x: VIRTUAL_W, yuqoriBalandlik: yuqoriBalandlik,
    ogish: 0, faza: Math.random() * 6.28,
    harakat: false, sovga: sovga, sovgaOlindi: false, hisoblangan: false,
    xavf: xavf
  });
}

function oshishYozuvi(x, y2, matn) {
  var el = document.createElement("div");
  el.className = "oshish";
  el.textContent = matn;
  el.style.left = x + "px";
  el.style.top = y2 + "px";
  oyin.appendChild(el);
  el.addEventListener("animationend", function () { el.remove(); });
}

// ---- Zarba va jonlar ----
function tegish() {
  if (invuln > 0) return;
  if (qalqonFaol) {
    qalqonFaol = false;
    invuln = 60;
    koptok.classList.add("mir");
    ovoz(900, 0.15, "triangle", 500);
    return;
  }
  jonlar--;
  combo = 0;
  jonlarYangilash();
  if (jonlar <= 0) { yakunlash(); }
  else {
    invuln = 100;
    koptok.classList.add("mir");
    zarbaOvozi();
    oyin.classList.add("silkinish");
    setTimeout(function () { oyin.classList.remove("silkinish"); }, 500);
  }
}

function portlash() {
  for (var i = 0; i < 16; i++) {
    var p = document.createElement("div");
    p.className = "partikl";
    var burch = Math.random() * Math.PI * 2;
    var masofa = 40 + Math.random() * 90;
    p.style.setProperty("--dx", (Math.cos(burch) * masofa) + "px");
    p.style.setProperty("--dy", (Math.sin(burch) * masofa) + "px");
    p.style.left = (98 - 5) + "px";
    p.style.top = (y + 18 - 5) + "px";
    p.style.background = SHARCHA_RANGLARI[Math.floor(Math.random() * SHARCHA_RANGLARI.length)];
    oyin.appendChild(p);
    p.addEventListener("animationend", function () { p.remove(); });
  }
  oyin.classList.add("silkinish");
  setTimeout(function () { oyin.classList.remove("silkinish"); }, 500);
  koptok.style.visibility = "hidden";
}

// ---- Asosiy sikl ----
function sikl() {
  if (oynayapti && !pauzada) {
    kadrlar++;
    tezlik += gravitatsiya;
    y += tezlik;

    var sozlama = REJIMLAR[rejim];
    var chegar = VIRTUAL_W - sozlama.masofa;
    if (toqlar.length === 0 || toqlar[toqlar.length - 1].x < chegar) toqQosh();

    var joriyTezlik = sekinVaqti > 0 ? toqTezligi * 0.55 : toqTezligi;

    toqlar.forEach(function (t) {
      t.x -= joriyTezlik;
      t.juftlik.style.left = t.x + "px";

      // 4-darajadan to'plar tebranadi
      if (Math.floor(ball / 5) + 1 >= 4) t.harakat = true;
      if (t.harakat) {
        t.faza += 0.035;
        t.ogish = Math.sin(t.faza) * 26;
        t.juftlik.style.top = t.ogish + "px";
      }

      if (!t.hisoblangan && t.x + 60 < 80) {
        t.hisoblangan = true;
        ball++;
        ballDiv.textContent = ball;
        ballOvozi();
        oshishYozuvi(85, y - 10, "+1");

        combo++;
        if (combo > comboEngYuqori) comboEngYuqori = combo;
        if (combo % 5 === 0) {
          ball += 2;
          ballDiv.textContent = ball;
          oshishYozuvi(85, y - 34, "🔥 Combo x" + combo + " +2");
          sovgaOvozi();
        }

        if (ball % 5 === 0) {
          toqTezligi += sozlama.oshish;
          darajaDiv.textContent = "Daraja: " + (Math.floor(ball / 5) + 1);
        }
        // Klassik rejimda asta-sekin qorayadi
        if (rejim === "klassik") {
          tunDiv.style.opacity = String(Math.min(0.38, Math.floor(ball / 10) * 0.07));
        }
        // Shirinlik bonusi
        if (Math.random() < 0.12) {
          var k = document.createElement("div");
          k.className = "konfet";
          k.textContent = "🍭";
          k.style.left = "85px";
          k.style.top = (y + 18 - 14) + "px";
          oyin.appendChild(k);
          konfetlar.push({ el: k, x: 98, y: y + 18, umr: 360 });
        }
        // Kuch-quvvat paydo bo'lishi (Magnit / Qalqon)
        if (Math.random() < 0.07) {
          var kTuri = Math.random() < 0.5 ? "magnit" : "qalqon";
          var kEl = document.createElement("div");
          kEl.className = "kuch-dona";
          kEl.textContent = kTuri === "magnit" ? "🧲" : "🛡️";
          kEl.style.left = "85px";
          kEl.style.top = (y + 18 - 14) + "px";
          oyin.appendChild(kEl);
          kuchlar.push({ el: kEl, x: 98, y: y + 18, turi: kTuri, umr: 360 });
        }
      }

      // To'qnashuv
      if (t.x < 116 && t.x + 60 > 80) {
        if (invuln === 0) {
          if (y < t.yuqoriBalandlik + t.ogish || y + 36 > t.yuqoriBalandlik + ORALIQ + t.ogish) {
            tegish();
          }
        }
      }

      // Harakatlanuvchi xavf (👻/🧊) — gap ichida mustaqil tebranadi
      if (t.xavf) {
        t.xavf.faza += 0.05;
        var xavfAmplituda = Math.max(10, Math.min(35, ORALIQ / 2 - 20));
        var xavfMahalliyY = t.yuqoriBalandlik + ORALIQ / 2 + Math.sin(t.xavf.faza) * xavfAmplituda - 14;
        t.xavf.el.style.top = xavfMahalliyY + "px";
        if (t.x < 116 && t.x + 60 > 80 && invuln === 0) {
          var xavfDunyoY = xavfMahalliyY + 14 + t.ogish;
          if (Math.abs((y + 18) - xavfDunyoY) < 24) {
            tegish();
          }
        }
      }

      // Sovg'ani yig'ish (Magnit faol bo'lsa — qamrov kengayadi)
      if (t.sovga && !t.sovgaOlindi) {
        var gy = t.yuqoriBalandlik + t.ogish + ORALIQ / 2;
        var sovgaQamrovi = magnitVaqti > 0 ? 95 : 30;
        if (Math.abs(t.x + 30 - 98) < sovgaQamrovi && Math.abs(gy - (y + 18)) < sovgaQamrovi) {
          t.sovgaOlindi = true;
          t.sovga.remove();
          t.sovga = null;
          ball += 5;
          ballDiv.textContent = ball;
          stats.jamiSovgalar++;
          joriySovgalar++;
          statsSaqlash();
          sovgaOvozi();
          oshishYozuvi(85, y - 30, "+5");
          if (rejim === "klassik") {
            tunDiv.style.opacity = String(Math.min(0.38, Math.floor(ball / 10) * 0.07));
          }
        }
      }
    });

    if (toqlar.length > 5) {
      var eski = toqlar.shift();
      eski.juftlik.remove();
    }

    // Shirinliklar
    for (var i = konfetlar.length - 1; i >= 0; i--) {
      var konf = konfetlar[i];
      konf.umr--;
      konf.el.style.opacity = String(Math.min(1, konf.umr / 60));
      if (Math.abs(konf.x - 98) < 28 && Math.abs(konf.y - (y + 18)) < 28) {
        sekinVaqti = 300;
        konfetOvozi();
        konf.el.remove();
        konfetlar.splice(i, 1);
      } else if (konf.umr <= 0) {
        konf.el.remove();
        konfetlar.splice(i, 1);
      }
    }

    // Kuch-quvvatlarni yig'ish (Magnit / Qalqon)
    for (var ki = kuchlar.length - 1; ki >= 0; ki--) {
      var kch = kuchlar[ki];
      kch.umr--;
      kch.el.style.opacity = String(Math.min(1, kch.umr / 60));
      if (Math.abs(kch.x - 98) < 28 && Math.abs(kch.y - (y + 18)) < 28) {
        if (kch.turi === "magnit") {
          magnitVaqti = 420;
        } else {
          qalqonFaol = true;
        }
        sovgaOvozi();
        oshishYozuvi(85, y - 30, kch.turi === "magnit" ? "🧲 Magnit!" : "🛡️ Qalqon!");
        kch.el.remove();
        kuchlar.splice(ki, 1);
      } else if (kch.umr <= 0) {
        kch.el.remove();
        kuchlar.splice(ki, 1);
      }
    }

    // Bonus ko'rsatkichi
    if (sekinVaqti > 0) {
      sekinVaqti--;
      bonusDiv.textContent = "🍭 Sekinlashuv: " + Math.ceil(sekinVaqti / 60) + "s";
    } else {
      bonusDiv.textContent = "";
    }

    // Kuch-quvvat holati (Magnit sanog'i / Qalqon faolligi)
    if (magnitVaqti > 0) {
      magnitVaqti--;
      kuchHolati.textContent = "🧲 Magnit: " + Math.ceil(magnitVaqti / 60) + "s";
      kuchHolati.classList.remove("hidden");
    } else if (qalqonFaol) {
      kuchHolati.textContent = "🛡️ Qalqon faol";
      kuchHolati.classList.remove("hidden");
    } else {
      kuchHolati.classList.add("hidden");
    }

    // Inkoguta tugadi
    if (invuln > 0) {
      invuln--;
      if (invuln === 0) koptok.classList.remove("mir");
    }

    // Yer va osmon
    if (y > YER_CHEGARASI || y < 0) {
      combo = 0;
      if (qalqonFaol) {
        qalqonFaol = false;
        invuln = 60;
        koptok.classList.add("mir");
        ovoz(900, 0.15, "triangle", 500);
        y = Math.max(0, Math.min(YER_CHEGARASI - 20, y));
        tezlik = 0;
      } else if (jonlar <= 1) { jonlar = 0; jonlarYangilash(); yakunlash(); }
      else { jonlar = 1; jonlarYangilash(); invuln = 100; koptok.classList.add("mir"); zarbaOvozi(); y = YER_CHEGARASI - 64; tezlik = 0; }
    }

    // Koptok izi
    if (kadrlar % 4 === 0) {
      var iz = document.createElement("div");
      iz.className = "iz";
      iz.style.left = (98 - 6) + "px";
      iz.style.top = (y + 18 - 6) + "px";
      oyin.appendChild(iz);
      iz.addEventListener("animationend", function () { iz.remove(); });
    }

    // Tungi rejim: fonar
    if (rejim === "tungi") {
      fonQoplama.style.background = "radial-gradient(circle at 98px " + (y + 18) + "px, rgba(4,8,28,0) 85px, rgba(4,8,28,.88) 190px)";
    }

    koptok.style.top = y + "px";
    koptok.style.transform = "rotate(" + Math.max(-25, Math.min(60, tezlik * 6)) + "deg)";
  }
  requestAnimationFrame(sikl);
}

function yakunlash() {
  if (!oynayapti) return;
  oynayapti = false;
  pauzaTugma.classList.add("hidden");
  yiqilishOvozi();
  portlash();

  var yangiRekord = false;
  if (ball > rekord) {
    rekord = ball;
    yangiRekord = true;
    try { localStorage.setItem("koptokRekord", String(rekord)); } catch (e) {}
  }
  rekordDiv.textContent = "Rekord: " + rekord;

  var tarix = tarixQosh(ball);
  var top5 = tarix.map(function (x) { return x.b; })
    .sort(function (a, b) { return b - a; }).slice(0, 5);
  var bugun = sanaBugun();
  var bugungi = tarix.filter(function (x) { return x.s === bugun; }).map(function (x) { return x.b; });
  var bugungiEngYaxshi = bugungi.length ? Math.max.apply(null, bugungi) : ball;

  // Tanga mukofoti (ball + yig'ilgan sovg'alar asosida)
  var tangaOlindi = Math.max(0, Math.round(ball / 2) + joriySovgalar);
  tangalar += tangaOlindi;
  tangaSaqlash();

  // Kundalik topshiriqni tekshirish
  var bajarilganTopshiriq = kundalikTopshiriqniTekshir({
    ball: ball, joriySovgalar: joriySovgalar, comboEngYuqori: comboEngYuqori, bugungiOyinlar: kunlikOyinlar.son
  });

  if (yangiRekord) reytingYubor();

  setTimeout(function () {
    fonQoplama.classList.add("hidden");
    tunDiv.style.opacity = "0";
    xabar.classList.remove("hidden");
    xabar.innerHTML =
      "<h1>O\u2019yin tugadi!</h1>" +
      "<p>Sizning balingiz: <b>" + ball + "</b></p>" +
      "<p>Rekord: <b>" + rekord + "</b>" + (yangiRekord ? " \u2014 Yangi rekord! \uD83C\uDFC6" : "") + "</p>" +
      "<p>Bugungi eng yaxshi natija: <b>" + bugungiEngYaxshi + "</b></p>" +
      "<p>Top 5: " + top5.join(", ") + "</p>" +
      "<p class=\"tanga-xabar\">\uD83D\uDC8E +" + tangaOlindi + " tanga (jami: " + tangalar + ")</p>" +
      (bajarilganTopshiriq ? "<p class=\"topshiriq-xabar\">\uD83C\uDFAF Kundalik topshiriq bajarildi! +\uD83D\uDC8E" + bajarilganTopshiriq.mukofot + "</p>" : "") +
      "<button class=\"bosh-tugma\" onclick=\"boshlash()\">Yana o\u2019ynash</button>" +
      "<button class=\"liquid rejim\" onclick=\"menuQaytish()\">\uD83C\uDFE0 Bosh menyu</button>";
    tolqinlarniUlash();
    yutuqlarniTekshir({ ball: ball, rekord: rekord, stats: stats, comboEngYuqori: comboEngYuqori, streak: streak });
    statistikaYubor(ball);
  }, 650);
}

// ---- Hodisalar ----
document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    e.preventDefault();
    if (oynayapti) sakrash();
    else if (!xabar.classList.contains("hidden")) boshlash();
  }
});
oyin.addEventListener("mousedown", function (e) {
  if (e.target.closest("button, a")) return;
  sakrash();
});
oyin.addEventListener("touchstart", function (e) {
  // O'yin faol bo'lmasa (menyu/panel ochiq) yoki tugma/havola bosilgan bo'lsa,
  // ularga o'z holicha ishlashiga ruxsat beramiz — faqat sof o'yin maydonida sakraymiz.
  if (!oynayapti) return;
  if (e.target.closest("button, a")) return;
  e.preventDefault();
  sakrash();
}, { passive: false });

// ---- Ekranga moslash ----
// Mobilda (kichik ekranlarda): o'yin balandligi aynan qurilma nisbatiga mos
// hisoblanadi va kenglik bo'yicha masshtablanadi — natijada ekran TO'LIQ
// qoplanadi, na bo'sh joy, na kesilish bo'ladi.
// Kompyuter/planshetda: klassik 400x600 karta o'lchami saqlanib qoladi.
var tashqiEl = document.getElementById("tashqi");
function moslash() {
  var devW = window.innerWidth, devH = window.innerHeight;
  var s;
  if (devW <= 820) {
    VIRTUAL_H = Math.max(520, Math.min(1000, Math.round(VIRTUAL_W * (devH / devW))));
    oyin.style.height = VIRTUAL_H + "px";
    s = devW / VIRTUAL_W;
  } else {
    VIRTUAL_H = 600;
    oyin.style.height = "600px";
    s = Math.min(devW / VIRTUAL_W, devH / VIRTUAL_H, 1.1);
  }
  ORALIQ = Math.round(VIRTUAL_H * 0.27 * (premiumOchildi ? 1.12 : 1));
  YER_CHEGARASI = VIRTUAL_H - 36;
  BAL_MIN = Math.round(VIRTUAL_H * 0.12);
  BAL_MAX = Math.round(VIRTUAL_H - ORALIQ - VIRTUAL_H * 0.12);
  tashqiEl.style.transform = "scale(" + s + ")";
}
window.addEventListener("resize", moslash);
window.addEventListener("orientationchange", function () { setTimeout(moslash, 200); });

// ---- Ishga tushirish ----
yulduzlarOsish();
muteYangilash();
skinQollash(joriySkin);
if (premiumOchildi) document.getElementById("premiumBelgisi").classList.remove("hidden");
elementTolqinlarUlash(pauzaPanel);
moslash();
menuKorsat();
yangiYilTekshir();
