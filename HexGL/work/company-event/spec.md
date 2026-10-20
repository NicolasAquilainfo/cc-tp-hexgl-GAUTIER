# Spécification — Personnalisation événementielle HexGL (ACME)

Sources : `formation/tickets/company-event.md` (source de vérité du besoin), `formation/identite/charte_graphique_acme.pdf` v1.0 (09/2026), `formation/identite/logo.png`, `docs/architecture.md`.

## 1. Contexte et objectif

ACME utilise HexGL lors d'un événement d'entreprise. L'écran d'accueil actuel (menu de HexGL : titre « HexGL », fond illustré animé, menu orange/bleu) doit adopter l'identité visuelle ACME : logo, couleurs de la charte, nom de l'entreprise et message d'accueil.

Objectif : une intégration **sobre et maintenable** de l'identité ACME sur l'écran d'accueil, **sans aucun impact sur le gameplay**.

## 2. Exigences fonctionnelles

| ID | Exigence |
|---|---|
| EF-1 | L'écran d'accueil affiche le logo ACME (`logo.png`), visible, sans déformation (ratio d'origine conservé), sans recoloration, sans ombre ni contour ajoutés. |
| EF-2 | L'écran d'accueil affiche le message de référence, tel que écrit dans la charte : **« Bienvenue au ACME Racing Challenge »**. |
| EF-3 | Le nom de l'entreprise (« ACME ») apparaît sur l'écran d'accueil, via le logo et le message d'accueil. |
| EF-4 | Le titre et le fond illustré HexGL de l'accueil sont remplacés par l'habillage ACME (voir §5). |
| EF-5 | Le bouton de démarrage est libellé **« Démarrer la course »** (libellé de la maquette de la charte). |
| EF-6 | Les couleurs de l'accueil (fond, texte, accents, états survol du menu) sont issues exclusivement de la palette de la charte (§4). |
| EF-7 | Les autres entrées du menu (Controls, Quality, HUD, Credits) restent présentes, fonctionnelles et conservent leur libellé actuel. |

## 3. Comportements attendus

- Au chargement de la page, l'accueil affiche directement l'habillage ACME (pas de flash de l'ancien titre HexGL ni de l'ancien fond).
- Le logo est posé sur un **cartouche clair** (blanc ou gris clair `#FFFFFF` / `#E6E8EE`) avec une zone de respiration autour, sur un fond d'écran sombre : le logo, à fond blanc et texte bleu nuit, reste ainsi lisible.
- Le bouton de démarrage est le point d'accent principal ; les entrées du menu changent d'aspect au survol en restant dans la palette.
- Cliquer sur « Démarrer la course » déclenche exactement le même enchaînement qu'aujourd'hui (aide des contrôles, chargement, course).
- Les réglages du menu et leur surcharge par paramètres d'URL (`?quality=`, `controlType`, `hud`) se comportent comme avant.
- Le menu et le logo restent utilisables du bureau (écran d'événement / borne) au mobile ; aucun élément ne se chevauche ni ne sort de l'écran.

## 4. Contraintes

**Identité (charte graphique)**
- Palette : noir profond `#08090D` (fond principal), violet `#7628FF` (accent marque), bleu électrique `#315BFF` (accent digital), cyan `#00C4E8` (accent secondaire), blanc `#FFFFFF` (texte/contraste), gris clair `#E6E8EE` (surfaces secondaires).
- Dégradé événementiel autorisé : `#7628FF` → `#315BFF`.
- Fond sombre ou très clair, jamais un gris moyen dominant.
- Logo : fichier fourni, sans déformation, avec zone de respiration, sans recoloration hors palette, sans ombre ni contour, jamais sur un fond illisible.
- Typographie : sans-serif lisible, titres en graisse forte ; **aucune nouvelle dépendance webfont** pour le rebranding ; la typographie existante est conservée si elle reste lisible.
- Pas d'effets additionnels complexes.

**Techniques**
- Le projet reste statique : ES5, sans build ni gestionnaire de paquets, sans nouvelle dépendance externe.
- Le jeu doit fonctionner hors ligne pour l'accueil : le logo est servi localement avec le projet.
- Le fichier `logo.png` fourni n'est pas modifié.

**Qualité**
- La suite QUnit existante reste verte (`formation/tests/`).

## 5. Décisions de conception déjà imposées

1. Le gameplay, les contrôles et le HUD en course ne sont pas modifiés (ticket + charte).
2. Le message d'accueil est celui de la charte, verbatim.
3. Logo sur **cartouche clair**, sans retraitement du fichier fourni.
4. Titre HexGL (`title.png`) et fond illustré (`bg.jpg`) de l'accueil **remplacés** par : fond sombre `#08090D` + éventuel dégradé violet→bleu, logo ACME, message d'accueil.
5. Périmètre visuel : **écran d'accueil (étape 1) uniquement**.
6. Langue : le bouton de démarrage et le message d'accueil en français ; les autres entrées du menu restent en anglais.
7. Pas de webfont ajoutée ; police du menu existante conservée si lisible, sinon repli sans-serif.

## 6. Cas limites et gestion des erreurs

- **Logo introuvable / non chargé** : le texte « ACME » et le message d'accueil restent lisibles (texte alternatif), le menu reste utilisable.
- **Petits écrans / portrait** : logo redimensionné proportionnellement (jamais étiré), message qui passe à la ligne sans débordement.
- **Grands écrans (borne)** : logo et message restent proportionnés, sans pixellisation visible excessive.
- **WebGL non supporté** : le comportement actuel est conservé (bouton remplacé par « WebGL is not supported! » renvoyant vers get.webgl.org) ; ce libellé n'est pas masqué par « Démarrer la course ».
- **Retour depuis les crédits** : l'accueil réaffiche l'habillage ACME.
- **Rechargement après la course** (clic sur l'écran de score) : retour sur l'accueil ACME.
- **Surcharge par URL** (`?quality=…`, etc.) : accueil identique, libellés de menu corrects.
- **Contraste** : texte et boutons restent lisibles sur le fond sombre (texte blanc / accents de la palette).

## 7. Hors périmètre

- Gameplay, physique, contrôles, circuit, HUD, effets 3D, audio.
- Écrans d'aide des contrôles (étape 2), de chargement (étape 3), de course (étape 4), de score (étape 5) et page Crédits.
- Métadonnées de la page (`<title>`, Open Graph, favicon), Google Analytics, liens externes legacy.
- Traduction des autres libellés du menu.
- Création d'une version claire / transparente du logo, d'un thème configurable, ou de toute option de personnalisation générique.
- Correction des anomalies listées dans `docs/architecture.md` §6.
- Nouveaux tests de rendu automatisés (les captures de référence ne sont pas comparées automatiquement).

## 8. Critères d'acceptation

| ID | Critère | Vérification |
|---|---|---|
| CA-1 | L'accueil affiche le logo ACME à son ratio d'origine (mesure largeur/hauteur affichées = ratio du fichier), lisible sur un cartouche clair avec marge. | Visuelle + inspection |
| CA-2 | Le texte exact « Bienvenue au ACME Racing Challenge » est affiché. | Visuelle |
| CA-3 | Le bouton affiche « Démarrer la course » ; les entrées Controls / Quality / HUD / Credits sont inchangées et cycliques. | Manuelle |
| CA-4 | Fond principal `#08090D` ; aucune couleur d'interface de l'accueil hors palette (plus d'orange `#f66439` ni de bleu `#4190bb` hérités). | Inspection des styles + visuelle |
| CA-5 | Ni `title.png` ni `bg.jpg` ne s'affichent sur l'accueil. | Visuelle |
| CA-6 | Démarrer une course produit le même déroulement qu'avant (étapes 2→5), HUD et contrôles identiques ; pas de nouvelle erreur console. | Manuelle + skill `run-hexgl` |
| CA-7 | Affichage correct à 1920×1080, 1366×768 et 390×844 : pas de chevauchement ni de débordement, logo non déformé. | Captures |
| CA-8 | Aucune nouvelle dépendance (webfont, librairie, requête réseau externe) introduite. | Revue |
| CA-9 | `logo.png` identique à l'original (même contenu). | Comparaison de fichier |
| CA-10 | La suite QUnit passe (`ci-chrome`, code de retour 0). | Automatique |
| CA-11 | La capture de référence `formation/tests/captures/01-accueil.png` est régénérée et montre l'accueil ACME. | Revue visuelle |
