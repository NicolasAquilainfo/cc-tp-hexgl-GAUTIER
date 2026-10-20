# HexGL — Architecture (état actuel)

Document descriptif de l'état du projet tel qu'il se trouve dans le dépôt. Il ne contient ni recommandation ni plan de correction.

## 1. Stack et points d'entrée

| Élément | État actuel |
|---|---|
| Type | Jeu de course futuriste 3D, 100 % statique, exécuté dans le navigateur (WebGL) |
| Langage | JavaScript ES5, sans module, sans bundler, sans `package.json` |
| Pré-processeur | CoffeeScript : les `.coffee` sont versionnés à côté des `.js` générés (en-têtes 1.4.0 et 1.7.1) |
| 3D | Three.js, copie locale `libs/Three.dev.js` (build de développement) ; `libs/Three.r53.js` n'est chargé que par `bkcore.coffee/tests.html` |
| Post-traitement | `libs/ShaderExtras.js`, `libs/postprocessing/*` (EffectComposer, RenderPass, BloomPass, ShaderPass, MaskPass) |
| Entrées | Clavier, tactile, Leap Motion (`libs/leap-0.4.1.min.js`), gamepad, orientation (non accessible depuis le menu, voir §5) |
| Audio | Web Audio API via `bkcore/Audio.js`, fichiers `.ogg` |
| Serveur | Aucun requis : n'importe quel serveur de fichiers statiques (le README cite `python -m SimpleHTTPServer`) |
| Habillage | `branding.js` (configuration unique, ES5) + `css/branding.css` + `branding/acme-logo.png` : identité visuelle de l'écran d'accueil (voir §7) |
| Tests | QUnit 2.26.0 local, dans `formation/tests/`, lancés dans Chrome/Edge headless par `ci-chrome.bat` / `ci-chrome.sh` |

**Points d'entrée**

- `index.html` : page du jeu (menu, étapes 1 à 5, crédits, liste des `<script>`). Elle charge `css/branding.css` après `multi.css`.
- `launch.js` : script de démarrage chargé en dernier. Généré par CoffeeScript 1.7.1 depuis `launch.coffee`.
- `formation/tests/index.html` : page des tests QUnit.
- `bkcore.coffee/tests.html` : ancienne page de test CoffeeScript, qui charge `Timer.js`, `ImageData.js` et `Three.r53.js` sans aucune assertion.
- Fichiers de packaging : `manifest.webapp`, `package.webapp`, `package.zip` (Firefox OS), `cache.appcache`, `.htaccess`.

## 2. Flux principal de lancement

1. `index.html` charge les CSS (`css/multi.css`, `css/fonts.css`), puis le snippet Google Analytics (`ga.js`, compte `UA-26274524-4`).
1 bis. Juste après le bloc `#step-1`, `branding.js` est chargé et `HexGLBranding.apply(document)` écrit le message d'accueil, le libellé du bouton et le logo dans le DOM, puis pose la palette en variables CSS `--brand-*` sur `<html>`. Cette étape précède `launch.js` : le repli « WebGL is not supported! » de `launch.js` écrase donc bien le libellé du bouton.
2. Les scripts sont chargés dans un ordre fixe, sans gestion de dépendance : Leap, Three.js, ShaderExtras, postprocessing, Detector, Stats, DAT.GUI, contrôleurs (`bkcore.coffee/controllers/*`), utilitaires (`Timer`, `ImageData`, `Utils`), `bkcore/threejs/*` (RenderManager, Shaders, Particles, Loader), `Audio`, `bkcore/hexgl/*` (HUD, RaceData, ShipControls, ShipEffects, CameraChase, Gameplay), le circuit `tracks/Cityscape.js`, `HexGL.js`, puis `launch.js`.
3. `launch.js` construit le menu à partir du tableau `s` (contrôles, qualité, HUD, godmode). Chaque valeur peut être surchargée par un paramètre d'URL du même nom (`?quality=2`). Le défaut des contrôles dépend de `Utils.isTouchDevice()`.
4. Clic sur **Start** : si WebGL est disponible, la page affiche l'étape 2 (image d'aide `css/help-<contrôle>.png`). Sinon, le bouton renvoie vers `get.webgl.org`.
5. Clic sur l'étape 2 : `init(...)` instancie `bkcore.hexgl.HexGL` (circuit `Cityscape`, difficulté 0) et expose l'instance dans `window.hexGL`. Elle appelle ensuite `hexGL.load(...)`, qui délègue à `Cityscape.load(...)`.
6. `Cityscape.load` crée un `bkcore.threejs.Loader` et charge textures, cubemap, géométries JSON, images de collision et de hauteur (`analysers`), images du HUD et sons. Le jeu de ressources dépend de la qualité : `textures/` si qualité < 2, `textures.full/` sinon. La barre de progression (`#progressbar`) est mise à jour par `onProgress`.
7. `onLoad` : `hexGL.init()` (HUD, matériaux, scènes, composer), puis affichage de l'étape 4 et `hexGL.start()`.
8. `HexGL.start()` lance la boucle `requestAnimationFrame` (`update` → `gameplay.update()` + `manager.renderCurrent()`), puis `initGameplay()` (création de `Gameplay`, `gameplay.start()`, lecture des sons `bg` et `wind`).
9. `Gameplay` gère le décompte (3, 2, 1, Go), le mode `timeattack` (3 tours, checkpoints lus dans l'image de collision), puis `end()`. Au bout de 2 s, `onFinish` appelle `shipControls.terminate()` et `HexGL.displayScore`.
10. `displayScore` affiche l'étape 5 (`#step-5`, temps total). Un clic recharge la page (`window.location.reload()`). La touche Échap appelle `HexGL.reset()` pendant la partie.

## 3. Modules, fichiers et assets

### Code applicatif (`bkcore/`)

| Fichier | Rôle |
|---|---|
| `bkcore/hexgl/HexGL.js` (446 l.) | Classe principale : options, renderer WebGL, HUD, composer (sky, game, bloom, vignette hexagonale), scores, paramétrage de difficulté (`tweakShipControls`) |
| `bkcore/hexgl/Gameplay.js` (230 l.) | Machine à états de la course (décompte, tours, checkpoints, fin, modes `timeattack` / `survival` / `replay`) |
| `bkcore/hexgl/ShipControls.js` (806 l.) | Plus gros fichier : physique du vaisseau, entrées (clavier, tactile, Leap, gamepad, orientation), collisions, hauteur, boosters |
| `bkcore/hexgl/ShipEffects.js`, `CameraChase.js`, `HUD.js` | Effets visuels du vaisseau, caméra de poursuite, HUD dessiné dans un canvas |
| `bkcore/hexgl/RaceData.js` | Enregistrement et lecture interpolée de la trajectoire (replay) |
| `bkcore/hexgl/Ladder.js` | Classement en ligne (voir §5 : non chargé par `index.html`) |
| `bkcore/hexgl/tracks/Cityscape.js` | Données du circuit : checkpoints, point d'apparition, listes d'assets par qualité, construction des matériaux et des scènes |
| `bkcore/threejs/Loader.js` | Chargeur multi-ressources avec suivi de progression |
| `bkcore/threejs/RenderManager.js`, `Shaders.js` (949 l.), `Particles.js` | Gestion des scènes de rendu, shaders GLSL en chaînes, particules |
| `bkcore/threejs/Preloader.js` | Préchargeur graphique, non référencé par `index.html` |
| `bkcore/Audio.js` | Façade Web Audio (`init`, `addSound`, `play`, `stop`, `volume`, `setListenerPos`) |
| `branding.js` (racine) | Configuration unique de l'habillage (nom, message, libellé du bouton, logo, palette) et `apply(doc)`, qui tolère les éléments absents. Expose `window.HexGLBranding` |

### Code CoffeeScript compilé (`bkcore.coffee/`)

Le dossier contient des paires `.coffee` / `.js` : `Utils`, `Timer`, `ImageData`, `controllers/{Touch,Orientation,Gamepad}Controller`, `threejs/Particles`. Le dossier `bkcore.coffee/` est utilisé comme dossier de sortie du JS généré. Les fichiers JS chargés par `index.html` sont donc ceux de ce dossier, et non ceux de `bkcore/`.

### Assets

| Dossier | Contenu | Taille |
|---|---|---|
| `textures/` | Textures basse résolution (circuit, vaisseau, HUD, particules, skybox) | 4,2 Mo |
| `textures.full/` | Textures haute résolution, avec cartes `normal` et `specular` | 5,3 Mo |
| `geometries/` | Modèles JSON : bonus, booster, vaisseau `feisar`, circuit `cityscape`. Le circuit `edge` ne contient que `track.js` et n'est référencé par aucun code | 1,3 Mo |
| `audio/` | `bg`, `boost`, `crash`, `destroyed`, `wind` (`.ogg`) + `LICENSE` | 2,1 Mo |
| `css/` | Styles, police BebasNeue (4 formats), images d'aide et de menu. `branding.css` ne surcharge que l'accueil et n'utilise que des `var(--brand-*)`. `title.png` et `bg.jpg` ne sont plus affichés mais restent sur disque | |
| `branding/` | `acme-logo.png`, copie byte-identique de `formation/identite/logo.png` (le jeu ne référence jamais `formation/`) | |
| `replays/cityscape-casual/bkcore.replay.json` | Enregistrement de course, non référencé par le code | 604 Ko |
| `libs/` | Bibliothèques tierces (voir §4) | 1,6 Mo |
| `formation/` | Éléments de formation : `tests/`, `identite/` (charte graphique PDF, logo), `tickets/company-event.md` | |

Les chemins d'assets déclarés dans `Cityscape.js` existent tous sur disque (vérifié pour `textures`, `textures.full`, `geometries`, `audio`).

## 4. Dépendances et zones legacy à risque

**Dépendances embarquées (copies locales, non gérées par un gestionnaire de paquets)**

- Three.js : `Three.dev.js` (utilisé par le jeu) et `Three.r53.js` (utilisé par `tests.html`). Le code appelle des API anciennes : `THREE.JSONLoader`, `geometry.computeTangents()`, `lerpSelf`, `slerpSelf`, `uniforms[...].texture`, `renderer.physicallyBasedShading`, `shadowMapSoft`, `mat.n44`.
- `libs/Editor.html` + `libs/Editor_files/` : éditeur de diagrammes (jQuery 1.8, KineticJS, Ace) sans lien avec le jeu ; il est versionné.
- `leap-0.4.1.min.js`, `DAT.GUI.min.js`, `Stats.js`, `Detector.js`, `ShaderExtras.js`, `postprocessing/*`.
- QUnit 2.26.0 (`formation/tests/vendor/`).

**Zones legacy à risque**

- **Espace de noms global** `bkcore` et ordre de chargement des `<script>` implicite : chaque fichier suppose que les précédents sont déjà chargés.
- **Deux arborescences** pour le même espace de noms : `bkcore/` (JS écrit à la main) et `bkcore.coffee/` (JS généré), avec un doublon `Particles.js` dont les deux versions diffèrent (`bkcore/threejs/Particles.js` est celle chargée par `index.html`).
- **API WebGL / Three.js obsolètes** : le rendu dépend d'une version figée de Three.js et de ses extensions.
- **API navigateur obsolètes** : Application Cache (`cache.appcache`), manifest Firefox OS (`manifest.webapp`), `panner.setPosition`, `noteOn`/`noteOff`, `ActiveXObject` dans `Utils.request`, `document.location.protocol` pour Google Analytics.
- **Dépendances réseau externes** codées en dur : `http://www.google-analytics.com/ga.js`, `http://hexgl.bkcore.com/...` (favicon, métadonnées Open Graph), liens de partage Twitter / Facebook dans `displayScore`, `http://get.webgl.org/`.
- **Licence** : le README indique MIT, les en-têtes de `HexGL.js`, `Gameplay.js`, etc. indiquent CC BY-NC 3.0, `RenderManager.js` indique MIT.
- **Fichiers volumineux ou monolithiques** : `ShipControls.js` (806 l., physique + entrées + Leap), `Shaders.js` (949 l.).

## 5. Fonctions et modules testables automatiquement

### Couverture actuelle (`formation/tests/`)

- `index.html` charge QUnit et cinq fichiers du jeu : `bkcore.coffee/Utils.js`, `Timer.js`, `ImageData.js`, `bkcore/hexgl/Gameplay.js` et `branding.js`.
- Il se redirige d'abord vers `?hexgl_poc=ok` si le paramètre est absent.
- `browser-tests.js` contient 24 tests répartis en cinq groupes :
  - `bkcore.Utils` (6) : `updateClass`, `getOffsetTop`, `getURLParameter` ;
  - `bkcore.Timer` (4), `bkcore.ImageData` (4), `bkcore.hexgl.Gameplay` sans rendu (5) ;
  - `HexGLBranding` (5) : message et libellé écrits, logo (`src`, `alt`), variables `--brand-*` posées, palette limitée à celle de la charte, `apply` sans erreur quand les éléments sont absents.
- Après exécution, le résultat est écrit dans des attributs `data-test-*` de `<html>`. Le statut est `pass` si aucun test n'échoue et si le nombre d'assertions est supérieur ou égal à 4.
- `ci-chrome.sh` / `.bat` lancent Chrome headless avec `--dump-dom --virtual-time-budget=5000`. Codes de retour : 0 réussi, 1 échec, 2 impossible. `rapport_erreur.html` est généré uniquement en cas d'échec ou d'impossibilité.
- `.gitignore` exclut `/HexGL/formation/tests/rapport_erreur.html`.

### Éléments testables sans WebGL ni assets

| Élément | Nature | Dépendances |
|---|---|---|
| `bkcore.Timer.msToTime`, `msToTimeString`, `zfill` | Fonctions pures (statiques) | aucune |
| `bkcore.Timer` (`start`, `pause`, `update`, `getElapsedTime`) | Dépend de `new Date()` | horloge (à simuler) |
| `bkcore.Utils.getOffsetTop`, `updateClass`, `getURLParameter`, `isTouchDevice` | Déjà couverts ou faciles à simuler | DOM / `window` |
| `bkcore.ImageData.getPixel`, `getPixelBilinear`, `getPixelF`, `getPixelFBilinear` | Calcul pur une fois `pixels` renseigné | le constructeur charge une `Image` et un canvas |
| `bkcore.hexgl.Gameplay` (décompte, `checkPoint`, comptage des tours) | Logique de course | `Timer`, `shipControls`, `analyser` (à simuler) |
| `bkcore.hexgl.RaceData` (`tick`, `export`, `import`) | Enregistrement de la trajectoire | `THREE.Vector3` / `Quaternion` |
| `bkcore.Audio` | Façade | `AudioContext` (à simuler) |
| `bkcore.threejs.Loader.updateState` | Suivi de progression | `THREE.JSONLoader` |

### Non testables simplement

`HexGL.js` (renderer WebGL dans le constructeur), `ShipControls.js` (entrées, `Leap`, Three.js), `HUD.js` (canvas), `Shaders.js`, `Cityscape.js` (chargement d'assets réels), `launch.js` (exécution immédiate au chargement, accès DOM global).

## 6. Bugs, dettes et anomalies remarquables

Constats issus de la lecture du code ; aucun n'a été exécuté ni corrigé.

### Anomalies de code

1. `HexGL.displayScore` : `JSON.Stringify(...)` (majuscule) n'existe pas, `JSON.stringify` est la bonne casse. Cette branche n'est atteinte que lorsque `gameover` vaut `null` (voir point 3).
2. `HexGL.displayScore` : les clés `localStorage` (`'score-'+t+'-'+d`, `'race-'+t+'-replay'`) concatènent l'objet `t = this.track` (donc `[object Object]`), alors que `Gameplay.start` lit `'race-'+this.track.name+'-replay'`. Les deux clés ne correspondent pas.
3. `HexGL.displayScore` : lorsque `opts.gameover` est fourni (cas de `launch.js`), la fonction retourne tôt. Tout le code de score local, de classement, de partage Twitter / Facebook et de message de FPS faible n'est donc jamais exécuté dans le jeu tel que lancé.
4. `Ladder.js` n'est pas chargé par `index.html`. Ce fichier utilise `bkcore.Ladder.global` (inexistant) alors que l'objet est défini sous `bkcore.hexgl.Ladder`. `displayLadder` contient `!x == undefined` (toujours faux) et calcule `m` sans l'utiliser. `Ladder.load` appelle l'URL `"nothing"`.
5. `Gameplay.modes.replay` : `self.end(self.result.REPLAY)` — `self.result` est un nombre, donc l'argument vaut `undefined` (la constante est `self.results.REPLAY`).
6. `Gameplay.modes.timeattack` : `this.maxLaps` et `this.timer` sont lus via `this` (qui vaut l'instance grâce à `.call(this)`) alors que le reste du code utilise `self`. Les modes `survival` et `replay` n'ont pas de scénario complet (`survival` vaut `null`).
7. `RaceData.tick` : incrémente `this.rate` au lieu de `this.rateState`. `rateState` reste à 1, donc une position est enregistrée à chaque appel, et la fréquence d'échantillonnage prévue (`rate = 2`) n'est pas appliquée.
8. `RaceData.applyInterpolated` : lit `this.data[this.seek]` avant de tester `this.seek < 0` ; en fin de données, `this.data[this.seek+1]` n'existe pas.
9. `launch.js` : les valeurs lues dans l'URL (`getURLParameter`) sont des chaînes. Dans le menu, `(a[3] + 1) % length` concatène alors une chaîne (`"1"+1 = "11"`). `hud === 1` est faux si `hud` vient de l'URL.
10. `launch.js` / `HexGL.js` : le contrôle `4` (orientation) est géré dans `ShipControls.js` mais absent du menu (`['KEYBOARD','TOUCH','LEAP MOTION CONTROLLER','GAMEPAD']`).
11. `Utils.request` : `url += "?" + qdata` est exécuté à l'intérieur de la boucle de paramètres et seulement pour le POST (comportement inversé par rapport à un GET). La boucle de `createXMLHTTPObject` va jusqu'à `i <= length` (l'index `length` appelle une fonction inexistante, capturée par `try`).
12. `Timer.msToTime` : clé `ms` dupliquée dans l'objet retourné. `msToTimeString` complète les millisecondes sur 4 caractères (`"0012"`) pour une valeur qui ne dépasse pas 999.
13. `ImageData.getPixelF` / `getPixelFBilinear` : utilisent `255` comme multiplicateur (et `255*255`), et non `256`.
14. `Audio.addSound` : `var audio` est déclaré deux fois. `setListenerPos` utilise `vec.normalize()` qui modifie le vecteur passé en argument. `Audio.js` n'est chargé qu'après `Loader.js` mais ne dépend pas de lui à l'initialisation.
15. `Cityscape.js` : `console.log('HIGH')` oublié. Plusieurs `console.log` de débogage subsistent (`RaceData.import`, `ShipControls`, `launch.js` pour chaque ressource chargée). Les options `usePanner` figurent dans la liste de sons basse qualité mais pas dans celle de haute qualité.
16. `launch.js` : `onError` n'affiche qu'un message console ; l'interface ne signale aucun échec de chargement.
17. `HexGL.js` : `this.a = window.location.href` et une condition `if(this.a[15] == "o")` commentée (reste d'un contrôle de domaine). Bloc FXAA commenté dans `initGameComposer`.

### Dettes et incohérences de dépôt

- `cache.appcache` référence `bkcore/Timer.js`, `bkcore/ImageData.js` et `bkcore/Utils.js`, qui n'existent pas (les fichiers sont dans `bkcore.coffee/`). Il omet aussi `Audio.js`, les contrôleurs Gamepad, `ImageData` et les assets `textures.full/`.
- Doublon `Particles.js` entre `bkcore/threejs/` et `bkcore.coffee/threejs/` (contenus différents).
- Versions de CoffeeScript hétérogènes dans les fichiers générés (1.4.0, 1.7.1).
- `bkcore.coffee/tests.html` ne contient aucune assertion.
- `libs/Editor.html` et `Editor_files/` : outillage sans rapport avec le jeu.
- `geometries/tracks/edge/track.js` et `replays/cityscape-casual/bkcore.replay.json` ne sont référencés par aucun code.
- `package.zip` versionné dans le dépôt, avec `package.webapp` et `manifest.webapp` (Firefox OS).
- `index.html` : métadonnées et URLs de production d'origine (`hexgl.bkcore.com`), identifiant Google Analytics et identifiant Facebook `fb:admins` codés en dur.
- Couverture de test partielle : `Utils`, `Timer`, `ImageData`, `Gameplay` (sans rendu) et `HexGLBranding`. Aucun test sur `RaceData`, `Loader`, `Audio`, ni sur le rendu de l'accueil (les captures de référence ne sont pas comparées automatiquement).
- Le test `getURLParameter` dépend du paramètre `hexgl_poc` ajouté par la redirection de `formation/tests/index.html` ; la variable `url` y est calculée sans être utilisée.
- Le seuil `count >= 4` dans `browser-tests.js` est fixé en dur.

## 7. Habillage événementiel de l'écran d'accueil (ACME)

Source du besoin : `work/company-event/spec.md` ; approche : `work/company-event/plan.md`. Périmètre : écran d'accueil (`#step-1`) uniquement, sans effet sur le gameplay, les contrôles ni le HUD.

### Décisions durables

- **Un seul point de configuration** : `branding.js` (`HexGLBranding.config`). Changer de marque = modifier ce fichier et remplacer `branding/acme-logo.png`.
- **Couche additive et réversible** : retirer le `<link>` de `css/branding.css`, le `<script>` de `branding.js` et le markup de `#title` restaure l'accueil d'origine. `launch.js` (CoffeeScript généré), `css/multi.css` et `bkcore/**` ne sont pas modifiés.
- **Couleurs en variables CSS** : `apply` pose `--brand-bg`, `--brand-violet`, `--brand-blue`, `--brand-cyan`, `--brand-text` et `--brand-surface` ; `branding.css` ne contient aucune couleur en dur. Palette de la charte ACME v1.0.
- **Logo sur cartouche clair** (`--brand-surface`), au ratio d'origine (2172×724), sans recoloration, ombre ni contour. Le PNG a un texte bleu nuit : il serait illisible directement sur le fond sombre `#08090D`.
- **Libellés** : message « Bienvenue au ACME Racing Challenge » et bouton « Démarrer la course » en français ; les autres entrées du menu restent en anglais.
- **Police** : BebasNeue conservée, aucune webfont ajoutée.

### Pièges

- **Ordre de chargement** : `branding.js` doit précéder `launch.js`, sinon le repli « WebGL is not supported! » ne serait plus le dernier à écrire dans `#start`.
- **Surcharges** : les couleurs d'origine (`#f66439`, `#4190bb`) restent dans `multi.css` et sont seulement surchargées ; `#start:hover` y utilise `!important`, donc la surcharge doit aussi en utiliser un.
- **Pas de valeur de repli** : si `branding.js` ne se charge pas, les `var(--brand-*)` ne sont pas définies et l'accueil perd ses couleurs.
- **Variables CSS** : leur support est supposé, ce qui rompt avec l'ES5 strict du reste du projet.
- **Positionnement** : `#title` et `#menucontainer` restent en positionnement absolu ; une règle `@media (max-height: 600px)` réduit le logo et le message pour éviter le chevauchement.
- **`config.name`** est défini mais lu nulle part.

### Hors périmètre (inchangé, toujours « HexGL / BKcore »)

- `<title>`, métadonnées Open Graph, favicon, Google Analytics, page Crédits.
- Étapes 2 à 5 (aide des contrôles, chargement, course, score).
- `cache.appcache` ne liste ni `branding.js`, ni `css/branding.css`, ni le logo.

### Captures de référence

`formation/tests/captures/01-accueil.png` montre l'accueil ACME (1920×1080, `?quality=1`). Le pilote `driver.mjs` régénère par défaut les deux captures en 1280×720.
