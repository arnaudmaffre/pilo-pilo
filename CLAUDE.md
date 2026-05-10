# 🌶️ CLAUDE.md — Projet Pili Pili
## Résumé complet du projet — Mai 2026

---

## 1. RÈGLES DU JEU PILI PILI

### Principe général
Pili Pili est un jeu de **plis et de paris** pour 2 à 8 joueurs.

### Matériel
- **55 cartes** numérotées de 1 à 55
- **1 Joker** 🔥 (valeur choisie par le joueur entre 0 et 56)
- **41 missions** tirées aléatoirement à chaque manche

### Déroulement d'une manche
1. **Distribution** : chaque joueur reçoit N cartes (selon la mission, de 2 à 7)
2. **Phase spéciale** (selon mission) : timer, sélection, pari à l'aveugle, etc.
3. **Paris** : chaque joueur parie le nombre de plis qu'il pense remporter
   - La somme totale des paris **ne peut pas** être égale à N
   - Certaines missions ont des contraintes supplémentaires (interdit 0, interdit 1, etc.)
4. **Jeu** : les joueurs jouent une carte à tour de rôle, le plus fort remporte le pli
5. **Résultats** : écart entre pari et plis réels = Pilis gagnés

### Fin de partie
- Le premier joueur à atteindre **6 Pilis** perd la partie

### Les 41 missions (effets)
| Catégorie | Effets | Description |
|-----------|--------|-------------|
| Échange | `exch2r`, `exch2l`, `exchr`, `exchl`, `exch1r`, `exch1l`, `exch3r`, `exch3l`, `exchsim`, `exchwin` | Échange de cartes après les paris |
| Pari spécial | `nob0`, `nob1`, `nocopy` | Contraintes sur les paris |
| Timer | `t3s`, `t5sblind` | Chrono avant les paris |
| Betblind | `betblind` | Pari avant de voir ses cartes |
| Masque | `forehead`, `blindmask` | On voit les cartes des autres, pas les siennes |
| Inversé | `rev`, `revblind` | Valeurs inversées (1=fort, 55=faible) |
| Désigner | `desig` | Désigner un joueur pour récupérer ses Pilis |
| Sélection | `3of5` | Choisir 3 cartes sur 5 à regarder |
| Spécial | `cursed`, `fl`, `winminus`, `faceup`, `draw1` | Règles spéciales de scoring |

---

## 2. STACK TECHNIQUE

| Composant | Technologie |
|-----------|-------------|
| Frontend | HTML/CSS/JS pur (pas de framework) |
| Backend temps réel | Firebase Realtime Database |
| Hébergement | GitHub Pages |
| Tests automatiques | Playwright (Node.js) |
| CI/CD | GitHub Actions (configuré, non activé) |
| OS développement | ChromeOS Linux (Debian) |

### Configuration Firebase
```
projectId: pilo-pilo-aeaf9
databaseURL: https://pilo-pilo-aeaf9-default-rtdb.europe-west1.firebasedatabase.app
appId: 1:408211499865:web:51540e33f53d03a609fa48
Règles: .read: true, .write: true (mode test)
```

### Repo GitHub
```
https://github.com/arnaudmaffre/pilo-pilo
URL prod: https://arnaudmaffre.github.io/pilo-pilo/
```

---

## 3. ARCHITECTURE DU CODE

### Fichiers du repo
```
pilo-pilo/
├── index.html                    # Application complète (1 fichier)
├── package.json                  # Config npm pour les tests
├── playwright.config.js          # Config tests smoke (30s timeout)
├── playwright.functional.config.js # Config tests fonctionnels (2min timeout)
├── CHANGELOG.md                  # Historique des versions
├── .github/workflows/deploy.yml  # Pipeline CI/CD (configuré)
└── tests/
    ├── smoke.spec.js             # 19 tests smoke CTA
    └── functional.spec.js        # 19 tests fonctionnels
```

### Architecture JavaScript (index.html)
```javascript
// Variables globales clés
var DB       // Firebase database instance
var PID      // Player ID unique (généré à chaque session)
var ROOM     // Code de la salle courante
var HOST     // true si ce client est l'hôte
var GS       // Game State (snapshot Firebase)
var BUSY     // Mutex pour éviter les doubles actions Firebase
var MISS     // Tableau des 41 missions

// Fonctions principales
initFirebase()     // Init Firebase + listener connexion
subRoom(code)      // Subscribe aux updates Firebase d'une salle
startGame(...)     // Crée une nouvelle partie dans Firebase
act(action)        // Moteur de jeu principal (BUSY mutex)
aiTurn(gs, aiId)   // IA : parie et joue automatiquement
applyExchange(...) // Calcule les nouvelles mains après échange
rndrGame(gs)       // Rendu écran de jeu
rndrPanel(...)     // Rendu panel bas (pari, tour, etc.)
rndrResults(gs)    // Rendu écran de résultats
```

### Phases Firebase
```
lobby → (timer|sel3of5|betblind|betting) → (desig|reveal) → playing → trick_review → results
```

### Clés Firebase principales
```javascript
gs.phase          // Phase courante
gs.cp             // Current Player ID
gs.m              // Mission courante {id, n, x, t, d, e}
gs.players[pid]   // {hand, bet, tw, pilis, dt, rc}
gs.trick          // Pli en cours {pid: card}
gs.hist           // Historique des plis
gs.dealer         // Index du dealer
gs.round          // Numéro de manche
```

### Fix critique Firebase (ANO-026)
Les cartes jouées et le reset du trick se font en **3 appels séparés** :
```javascript
DB.ref('rooms/'+ROOM+'/trick/'+who).set(played)      // 1. Écrire carte
  .then(() => DB.ref().update(upd))                   // 2. Résoudre pli
  .then(() => DB.ref('rooms/'+ROOM+'/trick').set({_x:true})) // 3. Reset
```

---

## 4. DÉCISIONS TECHNIQUES

### Firebase
- **Placeholder `{_x:true}`** pour trick/hist (Firebase supprime les tableaux vides)
- **`DB.ref().update(upd)`** avec chemins absolus pour les mises à jour atomiques
- **`set()` complet** sur la room pour les nouvelles manches (évite les renders partiels)
- **Mutex `BUSY`** pour éviter les doubles actions parallèles
- **Re-check IA** dans `.then()` après `act()` pour résoudre la race condition

### Safari/iPhone
- Firebase scripts en `<head>` (synchrones)
- `DOMContentLoaded` pour l'init des boutons
- `touchend` + `click` sur tous les boutons tactiles
- `-webkit-tap-highlight-color: transparent`

### Tests
- **Smoke tests** : `npm test` (~3min, 17/19 passent)
- **Tests fonctionnels** : `npm run test:functional` (~9min, 17/19 passent)
- Les sélecteurs utilisent les textes plutôt que les IDs (plus robustes aux re-renders)
- `window.GS` et `window.PID` accessibles depuis Playwright via `page.evaluate()`

### Méthode de travail Agile
- **Développeur Senior** : Claude (code + corrections)
- **Recetteur Senior** : Claude (audit + tests)
- **Product Owner** : Arnaud (validation métier)
- Anomalies numérotées ANO-XXX, évolutions EVO-XXX
- Smoke tests → tests fonctionnels → correction → re-deploy

---

## 5. VERSIONING

| Version | Date | Contenu |
|---------|------|---------|
| Beta 1.0.0 | Mai 2026 | Première version jouable |
| Beta 1.0.x | Mai 2026 | Fix Firebase, Safari, boutons CTA |
| Beta 1.1.0 | Mai 2026 | Fix IA bloquée, bouton Quitter, copier/WhatsApp lobby |
| Beta 1.1.1 | Mai 2026 | Fix doNextRound set() complet |
| Beta 1.1.2 | Mai 2026 | Fix Firebase ancêtre/enfant, récap paris, pause fin de pli |
| Beta 1.1.3 | Mai 2026 | Fix échange mains, betblind cartes cachées, pari manche 3+ |
| Beta 1.1.4 | Mai 2026 | Bouton Quitter sans flèche + id="btn-quit-game" |
| **Beta 1.1.5** | **Mai 2026** | **Fix audit fonctionnel : forehead, draw1, faceup, exchsim, exchwin** |

---

## 6. ÉTAT D'AVANCEMENT

### ✅ Fonctionnel et testé
- [x] Solo vs IA (3 joueurs)
- [x] Créer salle multijoueur
- [x] Rejoindre salle par code
- [x] Matchmaking automatique
- [x] 41 missions affichées
- [x] Système de paris avec contraintes
- [x] Jeu de plis avec résolution
- [x] Valeurs inversées (rev, revblind)
- [x] Échanges de mains (exch2r/l, exchr/l, exch1r/l, exch3r/l)
- [x] Échange simultané (exchsim)
- [x] Échange après pli gagné (exchwin)
- [x] Pioche bonus (draw1)
- [x] Masque - mes cartes cachées (forehead, blindmask)
- [x] Masque - cartes des autres visibles (forehead-area)
- [x] Pari avant de voir (betblind)
- [x] Timer avant pari (t3s, t5sblind)
- [x] 3 cartes sur 5 (3of5)
- [x] Désigner un joueur (desig)
- [x] Numéros maudits (cursed)
- [x] 1er/Dernier pli maudit (fl)
- [x] Pari réussi = -Pili (winminus)
- [x] Cartes face visible pour tous (faceup)
- [x] Récap des paris pendant le jeu
- [x] Pause après chaque pli + bouton "Pli suivant"
- [x] Version Beta affichée sur l'accueil
- [x] Bouton Quitter dans le jeu
- [x] Boutons copier/WhatsApp le code dans le lobby
- [x] Pipeline DevOps (Playwright + GitHub Actions configuré)
- [x] 19 smoke tests automatiques
- [x] 19 tests fonctionnels automatiques
- [x] Cahier de recette fonctionnel (41 missions documentées)

---

## 7. BACKLOG — À FAIRE

### 🔴 Anomalies ouvertes
| ID | Description | Priorité |
|----|-------------|----------|
| ANO-025 | Mission "Inversé + à l'aveugle" : les cartes d'ARNO sont cachées alors qu'elles devraient être visibles pendant les paris | Haute |
| ANO-024 | Joker 🔥 : bordure orange incorrecte (ressemble à une carte sélectionnée) | Basse |

### 🟡 Évolutions planifiées
| ID | Description | Priorité |
|----|-------------|----------|
| EVO-002 | Mission chrono : cartes masquées → bouton "Révéler" → 5s → face cachée (partiellement fait, à valider) | Haute |
| EVO-005 | Tests smoke F4.2 et F5.2 : augmenter timeout à 3min (`test.slow()`) | Basse |
| EVO-006 | Activer GitHub Actions auto-deploy (nécessite config permissions) | Moyenne |
| EVO-007 | Ajouter un bouton "Copier lien direct" avec le code dans l'URL | Basse |
| EVO-008 | Nettoyage automatique des salles Firebase > 2h | Basse |

---

## 8. COMMANDES UTILES

```bash
# Développement local
cd ~/pilo-pilo
git pull                          # Récupérer les dernières modifs

# Tests
npm test                          # Smoke tests (~3min)
npm run test:functional           # Tests fonctionnels (~9min)
npx playwright show-report        # Rapport smoke
npx playwright show-report functional-report  # Rapport fonctionnel

# Déploiement (manuel pour l'instant)
# 1. Télécharger index.html depuis Claude
# 2. Uploader sur GitHub (replace index.html)
# 3. Attendre 3min le déploiement GitHub Pages

# Git push (token configuré)
git add .
git commit -m "description du fix"
git push
```

---

## 9. INFOS IMPORTANTES

### Identifiants
- **GitHub** : arnaudmaffre / pilo-pilo
- **Firebase project** : pilo-pilo-aeaf9
- **URL prod** : https://arnaudmaffre.github.io/pilo-pilo/

### Points d'attention
1. **Firebase rules** : mode test ouvert (`.read: true, .write: true`) — à sécuriser pour la prod
2. **Pas de compte utilisateur** : le PID est généré aléatoirement à chaque session
3. **Solo vs IA** : les salles solo commencent par `SL` (ex: `SL4X`)
4. **Race condition IA** : résolue par double reset de `BUSY` dans le trigger IA
5. **GitHub Actions** : fichier `deploy.yml` configuré mais nécessite activation des permissions

### Architecture de test
```
npm test              → smoke.spec.js     → playwright.config.js (30s)
npm run test:functional → functional.spec.js → playwright.functional.config.js (120s)
```
