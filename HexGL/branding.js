// Point de configuration unique de l'habillage événementiel (écran d'accueil).
// Source : charte graphique ACME v1.0 (09/2026).
(function() {
  var config = {
    name: "ACME",
    welcome: "Bienvenue au ACME Racing Challenge",
    startLabel: "Démarrer la course",
    logo: { src: "branding/acme-logo.png", alt: "ACME" },
    colors: {
      bg: "#08090D",
      violet: "#7628FF",
      blue: "#315BFF",
      cyan: "#00C4E8",
      text: "#FFFFFF",
      surface: "#E6E8EE"
    }
  };

  // Écrit la configuration dans le DOM ; ignore sans erreur les éléments absents.
  function apply(doc) {
    var root = doc.documentElement, k, e;
    for (k in config.colors) {
      if (config.colors.hasOwnProperty(k)) root.style.setProperty("--brand-" + k, config.colors[k]);
    }
    if ((e = doc.getElementById("welcome"))) e.textContent = config.welcome;
    if ((e = doc.getElementById("start"))) e.textContent = config.startLabel;
    if ((e = doc.getElementById("brand-logo"))) {
      e.setAttribute("src", config.logo.src);
      e.setAttribute("alt", config.logo.alt);
    }
  }

  window.HexGLBranding = { config: config, apply: apply };
})();
