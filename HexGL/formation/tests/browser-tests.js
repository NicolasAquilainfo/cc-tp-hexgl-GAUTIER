/* Tests du code existant HexGL, sans Node.js. QUnit est chargé localement. */
(function () {
  "use strict";
  if (typeof QUnit === "undefined") {
    document.documentElement.dataset.testStatus = "fail";
    document.documentElement.dataset.testCount = "0";
    document.documentElement.dataset.testFailures = "1";
    document.body.insertAdjacentHTML("afterbegin", "<p style='color:red'>QUnit introuvable : vérifiez le fichier vendor/qunit-2.26.0.js</p>");
    return;
  }

  // Compatible avec le script Chrome headless existant : état mesurable dans le DOM.
  QUnit.done(function (result) {
    const count = result.total;
    const failed = result.failed;
    const root = document.documentElement;
    root.setAttribute("data-test-count", String(count));
    root.setAttribute("data-test-failures", String(failed));
    root.setAttribute("data-test-status", failed === 0 && count >= 4 ? "pass" : "fail");
    let summary = document.getElementById("summary");
    if (!summary) {
      summary = document.createElement("p");
      summary.id = "summary";
      document.body.appendChild(summary);
    }
    summary.textContent = count + " test(s) : " + (count - failed) + " réussi(s), " + failed + " échec(s).";
  });

  const U = window.bkcore && window.bkcore.Utils;
  QUnit.module("HexGL — bkcore.Utils", function () {
    QUnit.test("updateClass ajoute une classe", function (assert) {
      assert.ok(U, "Utils.js chargé");
      const e = document.createElement("div");
      e.id = "test-hexgl-add";
      document.getElementById("qunit-fixture").appendChild(e);
      U.updateClass(e.id, "active", true);
      assert.true(e.classList.contains("active"));
    });
    QUnit.test("updateClass supprime une classe", function (assert) {
      assert.ok(U, "Utils.js chargé");
      const e = document.createElement("div");
      e.id = "test-hexgl-remove";
      e.className = "active";
      document.getElementById("qunit-fixture").appendChild(e);
      U.updateClass(e.id, "active", false);
      assert.false(e.classList.contains("active"));
    });
    QUnit.test("getOffsetTop additionne les décalages parent/enfant", function (assert) {
      const parent = {
        offsetTop: 37,
        offsetParent: null
      };
      const enfant = {
        offsetTop: 13,
        offsetParent: parent
      };
      assert.strictEqual(U.getOffsetTop(enfant), 50);
    });
    QUnit.test("getURLParameter lit les paramètres d'URL", function (assert) {
      assert.ok(U, "Utils.js chargé");
      U.URLParameters = null;
      const url = new URL(window.location.href);
      url.searchParams.set("hexgl_poc", "ok");
      // Le lanceur fournit hexgl_poc=ok ; en ouverture directe, on teste l'absence ou la présence.
      const expected = window.location.search.includes("hexgl_poc=ok") ? "ok" : null;
      assert.strictEqual(U.getURLParameter("hexgl_poc"), expected);
    });
  });
  QUnit.module("HexGL — bkcore.Utils (compléments)", function () {
    QUnit.test("updateClass ignore un id inconnu sans lever d'erreur", function (assert) {
      assert.strictEqual(U.updateClass("id-inexistant-hexgl", "active", true), undefined);
    });
    QUnit.test("getURLParameter renvoie undefined pour un paramètre absent", function (assert) {
      U.URLParameters = null;
      assert.strictEqual(U.getURLParameter("parametre_absent_hexgl"), undefined);
    });
  });

  const T = window.bkcore && window.bkcore.Timer;
  QUnit.module("HexGL — bkcore.Timer", function () {
    QUnit.test("msToTime décompose des millisecondes en h/m/s/ms", function (assert) {
      const t = T.msToTime(3723456); // 1 h 2 min 3 s 456 ms
      assert.deepEqual([t.h, t.m, t.s, t.ms], [1, 2, 3, 456]);
    });
    QUnit.test("zfill complète avec des zéros sans tronquer", function (assert) {
      assert.strictEqual(T.zfill(7, 2), "07");
      assert.strictEqual(T.zfill(123, 2), "123");
    });
    QUnit.test("msToTimeString formate minutes et secondes sur 2 chiffres", function (assert) {
      const t = T.msToTimeString(92300); // 1 min 32 s 300 ms
      assert.strictEqual(t.m, "01");
      assert.strictEqual(t.s, "32");
      assert.strictEqual(Number(t.ms), 300);
    });
    QUnit.test("cycle start / update / pause avec une horloge simulée", function (assert) {
      const RealDate = window.Date;
      let now = 1000;
      window.Date = function () { return { getTime: function () { return now; } }; };
      try {
        const timer = new T();
        assert.false(timer.active, "inactif à la création");
        timer.start();
        assert.true(timer.active);
        now = 1250;
        timer.update();
        assert.strictEqual(timer.time.elapsed, 250);
        assert.strictEqual(timer.time.delta, 250);
        timer.pause(true);
        now = 5000;
        timer.update();
        assert.strictEqual(timer.time.elapsed, 250, "pas d'avancement en pause");
        timer.pause(false);
        assert.true(timer.active);
      } finally {
        window.Date = RealDate;
      }
    });
  });

  const ID = window.bkcore && window.bkcore.ImageData;
  // ImageData réel sans chargement d'image : on injecte directement les pixels (2x2).
  function fakeImage() {
    const img = Object.create(ID.prototype);
    img.pixels = {
      width: 2,
      height: 2,
      data: new Uint8ClampedArray([
        255, 0, 0, 255, 0, 255, 0, 255,
        0, 0, 255, 255, 255, 255, 0, 255
      ])
    };
    return img;
  }
  QUnit.module("HexGL — bkcore.ImageData", function () {
    QUnit.test("getPixel lit les composantes RGBA d'un pixel", function (assert) {
      assert.deepEqual(fakeImage().getPixel(1, 0), { r: 0, g: 255, b: 0, a: 255 });
    });
    QUnit.test("getPixel hors limites renvoie un pixel nul", function (assert) {
      const zero = { r: 0, g: 0, b: 0, a: 0 };
      const img = fakeImage();
      assert.deepEqual(img.getPixel(-1, 0), zero);
      assert.deepEqual(img.getPixel(2, 0), zero);
      assert.deepEqual(img.getPixel(0, 2), zero);
    });
    QUnit.test("getPixelBilinear au centre d'un pixel renvoie ce pixel", function (assert) {
      assert.deepEqual(fakeImage().getPixelBilinear(0.5, 0.5), { r: 255, g: 0, b: 0, a: 255 });
    });
    QUnit.test("getPixelBilinear à la frontière moyenne les pixels voisins", function (assert) {
      const c = fakeImage().getPixelBilinear(1, 0.5); // entre (0,0) rouge et (1,0) vert
      assert.strictEqual(c.r, 127.5);
      assert.strictEqual(c.g, 127.5);
    });
  });

  const G = window.bkcore && window.bkcore.hexgl && window.bkcore.hexgl.Gameplay;
  QUnit.module("HexGL — bkcore.hexgl.Gameplay (logique sans rendu)", function () {
    QUnit.test("valeurs par défaut : mode inconnu → timeattack, 3 tours", function (assert) {
      const g = new G({ mode: "inconnu", hud: null });
      assert.strictEqual(g.mode, "timeattack");
      assert.strictEqual(g.maxLaps, 3);
      assert.strictEqual(g.result, g.results.NONE);
    });
    QUnit.test("sans HUD le décompte est plus court qu'avec HUD", function (assert) {
      const sans = new G({ hud: null });
      const avec = new G({ hud: {} });
      assert.true(sans.countDownDelay < avec.countDownDelay);
      assert.true(sans.startDelay < avec.startDelay);
    });
    QUnit.test("checkPoint renvoie le canal bleu d'un pixel de checkpoint", function (assert) {
      const g = new G({ hud: null });
      g.pixelRatio = 1;
      g.shipControls = { dummy: { position: { x: 0, z: 0 } } };
      g.analyser = { pixels: { width: 10, height: 10 }, getPixel: function () { return { r: 255, g: 255, b: 2 }; } };
      assert.strictEqual(g.checkPoint(), 2);
    });
    QUnit.test("checkPoint renvoie -1 hors d'une zone de checkpoint", function (assert) {
      const g = new G({ hud: null });
      g.pixelRatio = 1;
      g.shipControls = { dummy: { position: { x: 0, z: 0 } } };
      g.analyser = { pixels: { width: 10, height: 10 }, getPixel: function () { return { r: 10, g: 20, b: 30 }; } };
      assert.strictEqual(g.checkPoint(), -1);
    });
    QUnit.test("end(FINISH) fige le résultat et désactive le vaisseau", function (assert) {
      const g = new G({ hud: null });
      g.shipControls = { active: true };
      g.timer.start();
      g.end(g.results.FINISH);
      assert.strictEqual(g.result, g.results.FINISH);
      assert.false(g.shipControls.active);
      assert.strictEqual(g.step, 100);
    });
  });

  const B = window.HexGLBranding;
  const PALETTE_CHARTE = ["#08090D", "#7628FF", "#315BFF", "#00C4E8", "#FFFFFF", "#E6E8EE"];
  QUnit.module("HexGL — HexGLBranding (habillage de l'accueil)", function (hooks) {
    // apply() pose des variables sur <html> : on les retire pour ne pas polluer les autres tests.
    hooks.afterEach(function () {
      Object.keys(B.config.colors).forEach(function (k) {
        document.documentElement.style.removeProperty("--brand-" + k);
      });
    });
    function fixture() {
      document.getElementById("qunit-fixture").innerHTML =
        '<div id="welcome"></div><div id="start">Start</div><img id="brand-logo" alt="">';
    }
    QUnit.test("apply écrit le message d'accueil et le libellé du bouton", function (assert) {
      fixture();
      B.apply(document);
      assert.strictEqual(document.getElementById("welcome").textContent, "Bienvenue au ACME Racing Challenge");
      assert.strictEqual(document.getElementById("start").textContent, "Démarrer la course");
    });
    QUnit.test("apply pose le logo (src et alt)", function (assert) {
      fixture();
      B.apply(document);
      const logo = document.getElementById("brand-logo");
      assert.strictEqual(logo.getAttribute("src"), B.config.logo.src);
      assert.strictEqual(logo.getAttribute("alt"), "ACME");
    });
    QUnit.test("apply pose la palette de la charte en variables --brand-*", function (assert) {
      fixture();
      B.apply(document);
      const style = document.documentElement.style;
      assert.strictEqual(style.getPropertyValue("--brand-bg"), "#08090D");
      assert.strictEqual(style.getPropertyValue("--brand-violet"), "#7628FF");
      assert.strictEqual(style.getPropertyValue("--brand-blue"), "#315BFF");
      assert.strictEqual(style.getPropertyValue("--brand-cyan"), "#00C4E8");
      assert.strictEqual(style.getPropertyValue("--brand-text"), "#FFFFFF");
      assert.strictEqual(style.getPropertyValue("--brand-surface"), "#E6E8EE");
    });
    QUnit.test("la config ne contient aucune couleur hors charte", function (assert) {
      Object.keys(B.config.colors).forEach(function (k) {
        assert.true(PALETTE_CHARTE.indexOf(B.config.colors[k].toUpperCase()) !== -1, k + " dans la palette");
      });
    });
    QUnit.test("apply ne lève pas d'erreur quand les éléments sont absents", function (assert) {
      document.getElementById("qunit-fixture").innerHTML = "";
      B.apply(document);
      assert.ok(true, "aucune exception");
    });
  });
})();
