# HexGL — notes pour Claude

Jeu de course WebGL statique (JS ES5, sans build ni `package.json`). Architecture détaillée : `docs/architecture.md`.

## Tests

Suite QUnit locale, sans Node.js : `formation/tests/` (`index.html`, `browser-tests.js`, `vendor/`).

- Windows : `formation\tests\ci-chrome.bat` (depuis PowerShell : `cmd /c .\formation\tests\ci-chrome.bat`)
- Linux : `bash formation/tests/ci-chrome.sh`
- Manuel : ouvrir `formation/tests/index.html` dans un navigateur.
- Codes de retour : 0 réussi, 1 échec, 2 impossible à exécuter (détails dans `formation/tests/rapport_erreur.html`, ignoré par git).
- Tout script testé doit être ajouté dans `formation/tests/index.html` ; les tests vont dans `browser-tests.js`.

## Captures de référence

`formation/tests/captures/` : `01-accueil.png` (menu) et `02-jeu-en-cours.png` (course lancée, qualité MID).
Régénérables avec `node .claude/skills/run-hexgl/driver.mjs` (voir le skill `run-hexgl`). Les captures ne sont pas comparées automatiquement.

## Lancer le jeu

Servir le dossier `HexGL` avec n'importe quel serveur statique (ex. `python -m http.server 8080`) puis ouvrir `http://localhost:8080/`. Le paramètre d'URL `?quality=0..3` (et `controlType`, `hud`) surcharge le menu.
