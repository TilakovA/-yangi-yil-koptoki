// Admin-panel: faqat Firebase Authentication orqali kirgan foydalanuvchi
// (developer) o'yinchilarning umumiy statistikasini ko'ra oladi.
(function () {
  var girishEkrani = document.getElementById("girishEkrani");
  var boshqaruvEkrani = document.getElementById("boshqaruvEkrani");
  var girishForma = document.getElementById("girishForma");
  var girishXabar = document.getElementById("girishXabar");
  var chiqishBtn = document.getElementById("chiqishBtn");
  var yuklanishEl = document.getElementById("yuklanish");

  if (typeof firebase === "undefined" || !window.firebaseConfig) {
    girishXabar.textContent = "Firebase yuklanmadi — internetni tekshiring yoki sahifani qayta oching.";
    return;
  }

  firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth();
  var db = firebase.firestore();

  auth.onAuthStateChanged(function (user) {
    if (user) {
      girishEkrani.classList.add("hidden");
      boshqaruvEkrani.classList.remove("hidden");
      malumotlarniYukla();
    } else {
      girishEkrani.classList.remove("hidden");
      boshqaruvEkrani.classList.add("hidden");
    }
  });

  girishForma.addEventListener("submit", function (e) {
    e.preventDefault();
    girishXabar.textContent = "";
    var email = document.getElementById("emailMaydon").value.trim();
    var parol = document.getElementById("parolMaydon").value;
    auth.signInWithEmailAndPassword(email, parol).catch(function () {
      girishXabar.textContent = "Kirish xatosi: email yoki parol noto'g'ri.";
    });
  });

  chiqishBtn.addEventListener("click", function () { auth.signOut(); });

  function malumotlarniYukla() {
    yuklanishEl.classList.remove("hidden");
    yuklanishEl.textContent = "Yuklanmoqda...";
    db.collection("sessiyalar").orderBy("vaqt", "desc").limit(3000).get()
      .then(function (snap) {
        var sessiyalar = [];
        snap.forEach(function (doc) { sessiyalar.push(doc.data()); });
        korsat(sessiyalar);
      })
      .catch(function (xato) {
        yuklanishEl.textContent = "Ma'lumotlarni yuklashda xato: " + xato.message;
      });
  }

  function korsat(sessiyalar) {
    yuklanishEl.classList.add("hidden");

    var jamiOyinlar = sessiyalar.length;
    var qurilmalar = {};
    var jamiBall = 0, maxBall = 0;
    var rejimlar = { klassik: 0, boron: 0, tungi: 0 };
    var kunlar = {};

    sessiyalar.forEach(function (s) {
      if (s.qurilma) qurilmalar[s.qurilma] = true;
      jamiBall += s.ball || 0;
      if ((s.ball || 0) > maxBall) maxBall = s.ball;
      if (rejimlar[s.rejim] !== undefined) rejimlar[s.rejim]++;
      var sana = s.vaqt && s.vaqt.toDate ? s.vaqt.toDate() : null;
      if (sana) {
        var kalit = sana.getFullYear() + "-" + (sana.getMonth() + 1) + "-" + sana.getDate();
        kunlar[kalit] = (kunlar[kalit] || 0) + 1;
      }
    });

    var noyobQurilmalar = Object.keys(qurilmalar).length;
    var ortachaBall = jamiOyinlar ? (jamiBall / jamiOyinlar).toFixed(1) : "0";

    document.getElementById("statJamiOyinlar").textContent = jamiOyinlar;
    document.getElementById("statQurilmalar").textContent = noyobQurilmalar;
    document.getElementById("statOrtachaBall").textContent = ortachaBall;
    document.getElementById("statMaxBall").textContent = maxBall;

    var nomlar = { klassik: "🏙️ Klassik", boron: "❄️ Qor bo'roni", tungi: "🌙 Tungi" };
    var rejimHtml = "";
    ["klassik", "boron", "tungi"].forEach(function (r) {
      var foiz = jamiOyinlar ? Math.round((rejimlar[r] / jamiOyinlar) * 100) : 0;
      rejimHtml += "<div class=\"bar-qator\"><span>" + nomlar[r] + "</span>" +
        "<div class=\"bar-fon\"><div class=\"bar-toldirilgan\" style=\"width:" + foiz + "%\"></div></div>" +
        "<span>" + rejimlar[r] + " (" + foiz + "%)</span></div>";
    });
    document.getElementById("rejimlarGrafigi").innerHTML = rejimHtml;

    var kunKalitlari = Object.keys(kunlar).sort(function (a, b) {
      return new Date(a) - new Date(b);
    }).slice(-7);
    var maxKun = Math.max.apply(null, kunKalitlari.map(function (k) { return kunlar[k]; }).concat([1]));
    var kunHtml = "";
    kunKalitlari.forEach(function (k) {
      var balandlik = Math.max(4, Math.round((kunlar[k] / maxKun) * 100));
      var qism = k.split("-");
      kunHtml += "<div class=\"kun-ustun\"><b>" + kunlar[k] + "</b>" +
        "<div class=\"kun-bar\" style=\"height:" + balandlik + "%\"></div>" +
        "<small>" + qism[2] + "." + qism[1] + "</small></div>";
    });
    document.getElementById("kunlikGrafigi").innerHTML = kunHtml || "<p style=\"opacity:.6\">Hali ma'lumot yo'q</p>";
  }
})();
