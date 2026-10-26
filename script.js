// ---- Elementlar ----
var koptok = document.getElementById("koptok");
var ballDiv = document.getElementById("ball");
var rekordDiv = document.getElementById("rekord");
var darajaDiv = document.getElementById("daraja");
var jonlarDiv = document.getElementById("jonlar");
var bonusDiv = document.getElementById("bonus");
var muteBtn = document.getElementById("muteBtn");
var tunDiv = document.getElementById("tun");
var fonQoplama = document.getElementById("fonQoplama");
var xabar = document.getElementById("xabar");
var oyin = document.getElementById("oyin");
var haqidaPanel = document.getElementById("haqidaPanel");
var kontaktPanel = document.getElementById("kontaktPanel");

// ---- Rejalar ----
var REJIMLAR = {
  klassik: { ikonka: "🏙️", nom: "Klassik",      boshTezlik: 3,   oshish: 0.5, masofa: 140, jonlar: 2 },
  boron:   { ikonka: "❄️", nom: "Qor bo\u2019roni", boshTezlik: 4.2, oshish: 0.7, masofa: 120, jonlar: 2 },
  tungi:   { ikonka: "🌙", nom: "Tungi rejim",   boshTezlik: 3.2, oshish: 0.5, masofa: 130, jonlar: 3 }
};
var rejim = "klassik";

// ---- Holat ----
var y = 250, tezlik = 0, toqlar = [], konfetlar = [];
var ball = 0, oynayapti = false, toqTezligi = 3;
var jonlar = 2, invuln = 0, sekinVaqti = 0, sovgalarSoni = 0, kadrlar = 0;
var gravitatsiya = 0.5, sakrashKuchi = -8.5;
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
function tarixQosh(natija) {
  var tarix = [];
  try { tarix = JSON.parse(localStorage.getItem("koptokTarix") || "[]"); } catch (e) { tarix = []; }
  tarix.push({ b: natija, s: sanaBugun() });
  if (tarix.length > 50) tarix = tarix.slice(-50);
  try { localStorage.setItem("koptokTarix", JSON.stringify(tarix)); } catch (e) {}
  return tarix;
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
function ovoz(chastota, davomiylik, turi) {
  if (!ovozYoniq) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = turi || "sine";
    osc.frequency.value = chastota;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + davomiylik);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + davomiylik);
  } catch (e) {}
}
function sakrashOvozi()  { ovoz(500, 0.12, "square"); }
function ballOvozi()     { ovoz(880, 0.15, "sine"); }
function yiqilishOvozi() { ovoz(120, 0.5, "sawtooth"); }
function sovgaOvozi()    { ovoz(660, 0.1, "sine"); setTimeout(function () { ovoz(990, 0.15, "sine"); }, 100); }
function konfetOvozi()   { ovoz(880, 0.08, "triangle"); setTimeout(function () { ovoz(1046, 0.15, "triangle"); }, 90); }
function zarbaOvozi()    { ovoz(220, 0.2, "square"); }

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
  qor.className = "qor";
  var olcham = Math.random() * 5 + 3;
  qor.style.width = olcham + "px";
  qor.style.height = olcham + "px";
  qor.style.left = Math.random() * 400 + "px";
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

// ---- Menyu ----
function rejimTugmasi(r) {
  var t = REJIMLAR[r];
  return "<button class=\"liquid rejim" + (rejim === r ? " tanlangan" : "") +
    "\" data-rejim=\"" + r + "\">" + t.ikonka + " " + t.nom + "</button>";
}
function menuHtml() {
  return "<h1>Yangil Koptoki 🎄</h1>" +
    "<p>Probel bosing yoki ekranni bosib sakrating</p>" +
    "<p>Konfet tayoqchalarga tegmang, sovg'alar yig'ing!</p>" +
    "<button onclick=\"boshlash()\">Boshlash</button>" +
    "<div class=\"rejimlar\">" +
      rejimTugmasi("klassik") + rejimTugmasi("boron") + rejimTugmasi("tungi") +
    "</div>" +
    "<button class=\"liquid haqida\" onclick=\"panelKorsat('haqidaPanel')\">ℹ️ O\u2019yin haqida</button>" +
    "<button class=\"liquid kontakt\" onclick=\"panelKorsat('kontaktPanel')\">✉️ Bog\u2019lanish</button>";
}
function rejimlarniUlash() {
  xabar.querySelectorAll(".rejim").forEach(function (btn) {
    btn.addEventListener("click", function () {
      rejim = btn.getAttribute("data-rejim");
      xabar.querySelectorAll(".rejim").forEach(function (b) { b.classList.remove("tanlangan"); });
      btn.classList.add("tanlangan");
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
}
function menuQaytish() {
  haqidaPanel.classList.add("hidden");
  kontaktPanel.classList.add("hidden");
  menuKorsat();
}
function panelKorsat(id) {
  if (oynayapti) return;
  if (id === "haqidaPanel") haqidaPanel.classList.remove("hidden");
  if (id === "kontaktPanel") kontaktPanel.classList.remove("hidden");
  xabar.classList.add("hidden");
}
function panelYop() {
  haqidaPanel.classList.add("hidden");
  kontaktPanel.classList.add("hidden");
  if (!oynayapti) xabar.classList.remove("hidden");
}

// ---- Boshlash ----
function boshlash() {
  var sozlama = REJIMLAR[rejim];
  y = 250; tezlik = 0; ball = 0; toqTezligi = sozlama.boshTezlik;
  jonlar = sozlama.jonlar; invuln = 0; sekinVaqti = 0; sovgalarSoni = 0; kadrlar = 0;
  toqlar.forEach(function (t) { t.juftlik.remove(); });
  toqlar = [];
  konfetlar.forEach(function (k) { k.el.remove(); });
  konfetlar = [];
  oynayapti = true;
  panelYop();
  xabar.classList.add("hidden");
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
  if (oynayapti) {
    tezlik = sakrashKuchi;
    sakrashOvozi();
  }
}

// ---- To'qlar va sovg'alar ----
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
  var oraliq = 140;
  var yuqoriBalandlik = Math.random() * 320 + 60;
  var juftlik = document.createElement("div");
  juftlik.className = "toqlarJuftligi";
  juftlik.style.left = "400px";
  var el1 = document.createElement("div");
  el1.className = "toq past";
  el1.style.height = yuqoriBalandlik + "px";
  sharchalarIlish(el1, true, yuqoriBalandlik);
  var el2 = document.createElement("div");
  el2.className = "toq yuqori";
  el2.style.height = (600 - yuqoriBalandlik - oraliq) + "px";
  sharchalarIlish(el2, false, 600 - yuqoriBalandlik - oraliq);
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
  oyin.appendChild(juftlik);
  toqlar.push({
    juftlik: juftlik, x: 400, yuqoriBalandlik: yuqoriBalandlik,
    ogish: 0, faza: Math.random() * 6.28,
    harakat: false, sovga: sovga, sovgaOlindi: false, hisoblangan: false
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
  jonlar--;
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
  if (oynayapti) {
    kadrlar++;
    tezlik += gravitatsiya;
    y += tezlik;

    var sozlama = REJIMLAR[rejim];
    var chegar = 400 - sozlama.masofa;
    if (toqlar.length === 0 || toqlar[toqlar.length - 1].x < chegar) toqQosh();

    var joriyTezlik = sekinVaqti > 0 ? toqTezligi * 0.55 : toqTezligi;

    toqlar.forEach(function (t) {
      t.x -= joriyTezlik;
      t.juftlik.style.left = t.x + "px";

      // 4-darajadan to'qlar tebranadi
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
      }

      // To'qnashuv
      if (t.x < 116 && t.x + 60 > 80) {
        if (invuln === 0) {
          if (y < t.yuqoriBalandlik + t.ogish || y + 36 > t.yuqoriBalandlik + 140 + t.ogish) {
            tegish();
          }
        }
      }

      // Sovg'ani yig'ish
      if (t.sovga && !t.sovgaOlindi) {
        var gy = t.yuqoriBalandlik + t.ogish + 70;
        if (Math.abs(t.x + 30 - 98) < 30 && Math.abs(gy - (y + 18)) < 30) {
          t.sovgaOlindi = true;
          t.sovga.remove();
          t.sovga = null;
          ball += 5;
          ballDiv.textContent = ball;
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

    // Bonus ko'rsatkichi
    if (sekinVaqti > 0) {
      sekinVaqti--;
      bonusDiv.textContent = "🍭 Sekinlashuv: " + Math.ceil(sekinVaqti / 60) + "s";
    } else {
      bonusDiv.textContent = "";
    }

    // Inkoguta tugadi
    if (invuln > 0) {
      invuln--;
      if (invuln === 0) koptok.classList.remove("mir");
    }

    // Yer va osmon
    if (y > 564 || y < 0) {
      if (jonlar <= 1) { jonlar = 0; jonlarYangilash(); yakunlash(); }
      else { jonlar = 1; jonlarYangilash(); invuln = 100; koptok.classList.add("mir"); zarbaOvozi(); y = 500; tezlik = 0; }
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

  setTimeout(function () {
    fonQoplama.classList.add("hidden");
    tunDiv.style.opacity = "0";
    xabar.classList.remove("hidden");
    xabar.innerHTML =
      "<h1>O\u2019yin tugadi!</h1>" +
      "<p>Sizning balingiz: <b>" + ball + "</b></p>" +
      "<p>Rekord: <b>" + rekord + "</b>" + (yangiRekord ? " — Yangi rekord! 🏆" : "") + "</p>" +
      "<p>Bugungi eng yaxshi natija: <b>" + bugungiEngYaxshi + "</b></p>" +
      "<p>Top 5: " + top5.join(", ") + "</p>" +
      "<button onclick=\"boshlash()\">Yana o\u2019ynash</button>" +
      "<button class=\"liquid rejim\" onclick=\"menuQaytish()\">🏠 Bosh menyu</button>" +
      "<button class=\"liquid haqida\" onclick=\"panelKorsat('haqidaPanel')\">ℹ️ O\u2019yin haqida</button>" +
      "<button class=\"liquid kontakt\" onclick=\"panelKorsat('kontaktPanel')\">✉️ Bog\u2019lanish</button>";
    tolqinlarniUlash();
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
oyin.addEventListener("mousedown", sakrash);
oyin.addEventListener("touchstart", function (e) { e.preventDefault(); sakrash(); });

// ---- Mobil ekranlarga moslash ----
function moslash() {
  var s = Math.min(window.innerWidth / 440, window.innerHeight / 660, 1.1);
  document.getElementById("tashqi").style.transform = "scale(" + s + ")";
}
window.addEventListener("resize", moslash);
window.addEventListener("orientationchange", function () { setTimeout(moslash, 200); });

// ---- Ishga tushirish ----
yulduzlarOsish();
muteYangilash();
moslash();
menuKorsat();
