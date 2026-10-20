---
name: run-hexgl
description: Lance et pilote HexGL (jeu de course WebGL statique) pour le démarrer, le lancer, le screenshoter ou régénérer les captures de référence, et exécute les tests QUnit. À utiliser pour "run hexgl", "lancer le jeu", "capture d'écran", "start the game", "run tests".
---

# run-hexgl

Jeu 100 % statique (aucun build, aucune dépendance npm). Les chemins sont relatifs au dossier `HexGL/` (la racine du dépôt git). Vérifié sous Windows 11 avec Node 22 et Chrome ; le pilote accepte aussi Edge ou un Chrome Linux (`CHROME_BIN`).

## Prérequis
- Node >= 22 (utilise `WebSocket` et `fetch` natifs) et Chrome, Chromium ou Edge. Rien d'autre à installer.

## Lancer et piloter (chemin agent)
```bash
node .claude/skills/run-hexgl/driver.mjs [dossierSortie] [quality 0-3]
# défaut : formation/tests/captures, quality 1
```
Le pilote démarre un serveur statique sur un port libre, lance Chrome headless (rendu logiciel SwiftShader), puis :
1. charge `index.html?quality=<q>` et capture `01-accueil.png` ;
2. clique sur `#start`, puis sur `#step-2` (déclenche le chargement des 32 ressources) ;
3. attend l'affichage de `#step-4`, laisse passer le décompte (~9 s) et capture `02-jeu-en-cours.png` ;
4. affiche les exceptions JS rencontrées, puis arrête Chrome et le serveur.

Durée : environ 25 s. Code de sortie 0 si OK, 1 en cas d'erreur, 2 si aucun navigateur n'est trouvé. Regarder les PNG : une image noire signifie que le lancement a échoué.

## Tests (QUnit, sans Node)
```bash
cmd /c .\formation\tests\ci-chrome.bat      # Windows (PowerShell)
bash formation/tests/ci-chrome.sh           # Linux
```
Codes : 0 réussi, 1 échec, 2 impossible (voir `formation/tests/rapport_erreur.html`).

## Chemin humain
Servir `HexGL/` (`python -m http.server 8080`) et ouvrir `http://localhost:8080/`. Inutile en headless.

## Gotchas
- Le paramètre d'URL `?quality=` accepte 0 à 3 ; en dessous de 2, `textures/` est utilisé, sinon `textures.full/`. Les valeurs d'URL sont des chaînes : cliquer sur le menu après un paramètre d'URL se comporte mal (voir `docs/architecture.md`).
- Le jeu ne démarre qu'après deux clics (`#start`, puis `#step-2`) ; sans eux, rien ne se charge.
- Le décompte dure ~6 s avec HUD ; une capture trop tôt montre « Get ready » ou un chiffre au lieu de « GO ».
- Sous Windows, Chrome garde un verrou sur son profil temporaire après `kill()` : le pilote attend 1 s et ignore l'échec de suppression (sinon `EBUSY` et code de sortie 1).
- Le port de débogage 9333 est fixe : deux exécutions simultanées entrent en conflit.

## Dépannage
- `EBUSY ... CrashpadMetrics-active.pma` : verrou Windows sur le profil, géré dans le pilote ; des dossiers `hexgl-shot-*` peuvent subsister dans `%TEMP%` si le processus est interrompu.
- `Chrome/Edge introuvable` (code 2) : définir `CHROME_BIN` avec le chemin de l'exécutable.
- `webgl false` : le GPU logiciel est refusé ; vérifier les options `--use-angle=swiftshader --enable-unsafe-swiftshader`.
