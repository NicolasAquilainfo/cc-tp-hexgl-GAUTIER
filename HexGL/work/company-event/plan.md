# Plan technique — Habillage ACME de l'écran d'accueil HexGL

## 1. Objectif

Appliquer l'identité ACME (logo, palette, message « Bienvenue au ACME Racing Challenge », bouton « Démarrer la course ») à l'écran d'accueil (`#step-1`) uniquement, via **un seul point de configuration**, sans toucher au gameplay, à Three.js, à CoffeeScript ni à `launch.js`. Critères visés : CA-1 à CA-11 de `work/company-event/spec.md`.

## 2. État actuel et architecture concernée

- `index.html` : `#step-1` = `#global` (fond `bg.jpg`, animé), `#title` (`title.png`, animé), `#menucontainer > #menu` (`#start`, `#s-controlType`, `#s-quality`, `#s-hud`, `#s-godmode` caché, `#s-credits`). Scripts chargés en fin de `<body>`, `launch.js` en dernier.
- `css/multi.css` : styles de l'accueil (`#global`, `#title`, `#menu`, `#menu div:hover` orange `#f66439`, `#menu` bleu `#4190bb`, `#start`), partagé avec les étapes 2-5 et les crédits (fonds noirs, hors périmètre).
- `launch.js` (généré par CoffeeScript, **non modifié**) : écrit `innerHTML` des seuls `#s-*`, câble les clics, et ne touche `#start` que si WebGL est absent (libellé « WebGL is not supported! »).
- Police : BebasNeue via `css/fonts.css` (déjà locale, conservée, charte : « conserver la typographie existante si lisible »).
- Tests : `formation/tests/index.html` charge QUnit + des scripts du jeu ; `browser-tests.js` contient les tests. Exécution : `cmd /c .\formation\tests\ci-chrome.bat` (Windows) / `bash formation/tests/ci-chrome.sh`.
- Environnement : Python 3 disponible (`python -m http.server`), PHP absent. Node n'est pas supposé.

## 3. Approche technique

Trois pièces, toutes additives et réversibles :

1. **`branding.js`** (ES5, racine) — unique point de configuration. Expose `window.HexGLBranding = { config, apply }`.
   - `config` : nom, message d'accueil, libellé du bouton, chemin du logo, texte alternatif, palette.
   - `apply(doc)` : écrit le message / libellé / logo dans les éléments de l'accueil et pose la palette en **variables CSS** sur `documentElement`. Tolère les éléments absents (aucune exception).
2. **`css/branding.css`** — feuille chargée **après** `multi.css`, qui ne surcharge que les règles de l'accueil et lit uniquement `var(--brand-*)`. Aucune couleur en dur ici.
3. **`index.html`** — marquage minimal : lien vers `branding.css`, remplacement du contenu de `#title` par cartouche + `<img>` logo + `<div id="welcome">`, et, juste après le bloc `#step-1`, `<script src="branding.js">` + un appel inline `HexGLBranding.apply(document)` (avant le reste du DOM, donc pas de flash de l'ancien habillage). `launch.js` s'exécute ensuite : le repli « WebGL is not supported! » écrase donc bien le libellé du bouton.

Le logo est **copié** (octets identiques) dans `branding/acme-logo.png` ; `formation/identite/logo.png` n'est ni modifié ni référencé par le jeu (le jeu ne doit pas dépendre de `formation/`).

## 4. Fichiers et modules impactés

| Fichier | Action |
|---|---|
| `branding.js` | **Nouveau** — config + `apply` |
| `css/branding.css` | **Nouveau** — surcharges de l'accueil |
| `branding/acme-logo.png` | **Nouveau** — copie byte-identique du logo |
| `index.html` | **Modifié** — 1 `<link>`, markup de `#title`, 1 `<script>` + 1 appel inline |
| `formation/tests/index.html` | **Modifié** — charge `../../branding.js` |
| `formation/tests/browser-tests.js` | **Modifié** — nouveau module de tests |
| `formation/tests/captures/01-accueil.png` | **Régénéré** (CA-11) |
| Inchangés | `launch.js`, `css/multi.css`, `title.png`, `bg.jpg` (restent sur disque), `bkcore/**`, `libs/**`, `cache.appcache` |

## 5. Structure des données de branding

```js
HexGLBranding.config = {
  name: "ACME",
  welcome: "Bienvenue au ACME Racing Challenge",
  startLabel: "Démarrer la course",
  logo: { src: "branding/acme-logo.png", alt: "ACME" },
  colors: {          // charte v1.0 → variables --brand-*
    bg: "#08090D", violet: "#7628FF", blue: "#315BFF", cyan: "#00C4E8",
    text: "#FFFFFF", surface: "#E6E8EE"
  }
}
```

Dégradé événementiel = `linear-gradient(violet → blue)` construit dans le CSS à partir des variables. Pas de fichier JSON, pas de chargement réseau : script statique, donc compatible `file://` et hors ligne.

## 6. Décisions techniques principales

- **JS + variables CSS plutôt que CSS seul** : le texte, le logo et les couleurs vivent dans un seul fichier ; le CSS ne duplique pas la palette.
- **Feuille additive `branding.css`** plutôt que modifier `multi.css` : retour arrière = retirer un `<link>`, un `<script>` et restaurer le markup de `#title`.
- **`launch.js` intact** : évite de régénérer du CoffeeScript ou de modifier un fichier généré.
- **Logo sur cartouche clair** (`surface`/blanc) avec padding (zone de respiration) ; `<img>` avec `max-width:100%; height:auto` (ratio 2172×724 préservé, aucun ombrage/contour).
- **Menu** : texte blanc, survol cyan ; bouton de démarrage en dégradé violet→bleu, texte blanc. On neutralise le voile blanc semi-transparent (`#menu div`) qui produirait un gris moyen sur fond sombre. Fond `#global` : couleur `bg`, sans `bg.jpg` ni animation ; l'animation du logo est supprimée (sobriété).
- **Logo introuvable** : `alt="ACME"` + message d'accueil textuel conservent l'identité ; menu non affecté.
- **Aucune webfont, aucune requête externe ajoutée.**

## 7. Risques et compatibilité

- **Spécificité CSS / `!important`** : `#start:hover` utilise `!important` dans `multi.css` → la surcharge devra en tenir compte (même `!important` ciblé).
- **Chevauchement logo/menu** sur petits écrans ou paysage bas : `#title` et `#menucontainer` sont en positionnement absolu ; vérifier 1920×1080, 1366×768, 390×844 et prévoir une `@media (max-height)` si nécessaire.
- **Ordre de chargement** : `branding.js` doit précéder `launch.js` ; sinon libellé du bouton non appliqué ou repli WebGL écrasé. Contrôlé par le test manuel « WebGL absent ».
- **Fond RGBA du logo** : s'il est transparent, le texte bleu nuit disparaît sur fond sombre → le cartouche clair est donc obligatoire (déjà prévu).
- **ES5** pour `branding.js` (le jeu cible des navigateurs anciens) ; les tests peuvent rester ES6 comme l'existant.
- **Hors périmètre assumé** : `cache.appcache` (déjà obsolète), `<title>`/Open Graph, crédits, étapes 2-5.
- **Dette de l'exigence « point de configuration unique »** : la spec classe « thème configurable » hors périmètre ; on reste à un simple objet de config, sans options, sans chargement dynamique.

## 8. Stratégie de tests et de vérification

- **Lancer le jeu** : depuis `HexGL/`, `python -m http.server 8080` puis `http://localhost:8080/`.
- **QUnit** (réutilise l'existant) : nouveau module « HexGLBranding » dans `browser-tests.js` avec fixture DOM, couvrant : message et libellé écrits ; logo `src`/`alt` posés ; variables `--brand-*` posées (valeurs de la charte) ; `apply` ne lève pas d'erreur quand des éléments manquent ; config exposée sans valeur hors palette. Commande : `cmd /c .\formation\tests\ci-chrome.bat` → code 0 attendu (le seuil `count >= 4` reste satisfait).
- **Vérifs ponctuelles** : `fc /b` (ou hash) entre `formation/identite/logo.png` et `branding/acme-logo.png` (CA-9) ; `git diff --stat` pour confirmer qu'aucun fichier de gameplay n'est touché (`bkcore/**`, `launch.js`, `libs/**`).
- **Captures** (CA-7, CA-11) : Chrome headless `--screenshot --window-size=W,H http://localhost:8080/` pour 1920×1080, 1366×768, 390×844 ; `01-accueil.png` régénérée depuis la capture 1920×1080 (le `driver.mjs` Node reste facultatif).
- **Manuel** : cycle des entrées Controls/Quality/HUD ; Credits aller-retour ; `?quality=1` ; lancer une course complète (étapes 2→5), HUD et contrôles intacts, console sans nouvelle erreur ; simulation « WebGL absent » → libellé de repli affiché.
- **Aucun commit** durant l'implémentation ; commit unique après validation finale.

## 9. Plan d'implémentation (4 petites étapes)

1. **Socle de config + logo** — créer `branding.js` (config + `apply`, ES5), copier le logo dans `branding/acme-logo.png`. *Vérif* : hash logo identique ; `branding.js` sans erreur de syntaxe (chargé dans la page de tests à l'étape 2).
2. **Tests de la config** — ajouter `branding.js` à `formation/tests/index.html`, écrire le module QUnit. *Vérif* : `ci-chrome.bat` → 0, nouveaux tests verts (les tests étant écrits avant le câblage, ils valident le contrat de `apply`).
3. **Câblage et style de l'accueil** — modifier le markup de `#title` et ajouter `<link>` + `<script>` + appel `apply` dans `index.html` ; créer `css/branding.css` (fond, cartouche logo, message, menu, bouton, `@media` hauteur). *Vérif* : serveur Python, contrôle visuel de l'accueil, absence de `title.png`/`bg.jpg` dans l'onglet Réseau, cycle des entrées du menu, Credits.
4. **Non-régression et captures** — course complète, cas WebGL absent, URL `?quality=…`, trois tailles d'écran, régénération de `01-accueil.png`, relance QUnit, `git diff --stat` (aucun fichier de gameplay touché). *Vérif* : tous les CA-1…CA-11 cochés, puis demande de validation avant commit.
