# Pilo-Pilo 🌶️

Jeu de **plis et de paris** pour 2-8 joueurs — app web single-file (index.html) avec Firebase Realtime Database.

## Stack

| Composant | Tech |
|-----------|------|
| Frontend | HTML/CSS/JS pur — 1 fichier `index.html` |
| Temps réel | Firebase Realtime Database |
| Hébergement | GitHub Pages |
| Tests | Playwright (Node.js) — voir `tests/` |

## Domaine : règles du jeu

- 55 cartes (1-55) + 1 Joker 🔥 (valeur 0-56 au choix du joueur)
- 41 missions tirées aléatoirement ; chaque manche a N cartes (2-7)
- Paris : chaque joueur parie ses plis — somme totale ≠ N
- Plus fort remporte le pli ; écart pari/réel = Pilis gagnés
- Premier à 6 Pilis **perd**

### Catégories de missions
| Catégorie | IDs |
|-----------|-----|
| Échange | `exch2r/l`, `exchr/l`, `exch1r/l`, `exch3r/l`, `exchsim`, `exchwin` |
| Pari spécial | `nob0`, `nob1`, `nocopy` |
| Timer | `t3s`, `t5sblind` |
| Masque | `forehead`, `blindmask`, `betblind` |
| Inversé | `rev`, `revblind` |
| Spécial | `desig`, `3of5`, `cursed`, `fl`, `winminus`, `faceup`, `draw1` |

## Architecture JavaScript (index.html)

```javascript
var DB, PID, ROOM, HOST  // Firebase instance, Player ID, salle, hôte
var GS                   // Game State (snapshot Firebase)
var BUSY                 // Mutex — évite doubles actions
var MISS                 // Tableau des 41 missions

act(action)              // Moteur principal (via BUSY)
aiTurn(gs, aiId)         // IA : parie et joue automatiquement
applyExchange(...)       // Calcule nouvelles mains après échange
rndrGame/Panel/Results() // Rendu des écrans
```

### Phases Firebase
```
lobby → (timer|sel3of5|betblind|betting) → (desig|reveal) → playing → trick_review → results
```

### Clés Firebase
```javascript
gs.phase / gs.cp / gs.m           // Phase, current player, mission {id,n,x,t,d,e}
gs.players[pid]                   // {hand, bet, tw, pilis, dt, rc}
gs.trick / gs.hist / gs.round     // Pli en cours, historique, numéro de manche
```

## Décisions techniques critiques

**Fix ANO-026 — Reset trick en 3 appels séparés :**
```javascript
DB.ref('rooms/'+ROOM+'/trick/'+who).set(played)
  .then(() => DB.ref().update(upd))
  .then(() => DB.ref('rooms/'+ROOM+'/trick').set({_x:true}))
```

**Firebase :**
- Placeholder `{_x:true}` pour trick/hist (Firebase supprime les tableaux vides)
- `DB.ref().update(upd)` avec chemins absolus pour mises à jour atomiques
- `set()` complet sur la room pour les nouvelles manches
- Re-check IA dans `.then()` après `act()` pour la race condition

**Safari/iPhone :**
- Firebase scripts en `<head>` (synchrones)
- `touchend` + `click` sur tous les boutons tactiles

## Backlog

### Anomalies
| ID | Description | Priorité |
|----|-------------|----------|
| ANO-024 | Joker : bordure orange incorrecte | Basse |

### Évolutions UX/UI
| ID | Description | Priorité |
|----|-------------|----------|
| UX-UI-001 | Ombre multi-couche sur les cartes (depth) | P0 |
| UX-UI-002 | Glow sur `.card.sel` (sélection visible) | P0 |
| UX-UI-003 | Glassmorphism sur `.bpanel` (panel paris) | P0 |
| UX-UI-004 | Feedback tactile sur `:active` des boutons | P0 |

### Évolutions fonctionnelles
| ID | Description | Priorité |
|----|-------------|----------|
| EVO-006 | Activer GitHub Actions auto-deploy | Moyenne |
| EVO-007 | Bouton "Copier lien direct" avec code dans l'URL | Basse |
| EVO-008 | Nettoyage auto salles Firebase > 2h | Basse |

## Infos

- Firebase: `pilo-pilo-aeaf9` — rules mode test (`.read/.write: true`, à sécuriser en prod)
- Prod: https://arnaudmaffre.github.io/pilo-pilo/
- Déploiement : uploader `index.html` sur GitHub → attendre ~3min
- Salles solo : préfixe `SL` (ex: `SL4X`)
- Workflow : Smoke tests → tests fonctionnels → correction → re-deploy
