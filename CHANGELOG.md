# 🌶️ Pili Pili — Changelog

## Beta 1.2.6 — 2026-05-11
### ✅ Anomalies corrigées
- ANO-035 — Collisions de codes de salle : `doCreate()` et `doSolo()` écrasaient silencieusement une salle existante si le code généré était déjà pris. Ajout d'une vérification Firebase avant le `.set()`, avec retry automatique (max 5 tentatives) et log WRN en cas de collision détectée.
- ANO-036 — Entropie insuffisante dans `genSolo()` : seulement 36² = 1 296 codes possibles (`SL` + 2 chars), causant des collisions fréquentes avec les anciennes salles persistantes. Passage à 4 chars aléatoires → 1 679 616 possibilités.

## Beta 1.2.5 — 2026-05-10
### 🟡 Évolutions
- EVO-011 — Chat textuel multijoueur : panneau 💬 rétractable, badge non-lus, Firebase rooms/[ROOM]/chat

## Beta 1.2.4 — 2026-05-10
### ✅ Anomalies corrigées
- ANO-034 — Valeurs inversées : gagnant du pli incorrectement calculé (min ev → max ev, ev() gère déjà l'inversion)

## Beta 1.2.3 — 2026-05-10
### ✅ Anomalies corrigées
- ANO-033 — ReferenceError pl.length dans rndrGame (→ players.length) : crash toutes les parties

## Beta 1.2.2 — 2026-05-10
### ✅ Anomalies corrigées
- ANO-031 — faceup : zone cartes adversaires visible aussi pendant trick_review (entre les plis)
- ANO-032 — t5sblind : cartes jouées dans le pli maintenant visibles de tous (main reste cachée)
### 🟡 Évolutions
- EVO-011 — Nouvelle mission "Dernier à décider" (3c et 4c) : tous jouent face cachée, cartes révélées au dernier joueur

## Beta 1.2.1 — 2026-05-10
### 🟡 Évolutions
- LOG-005 — Persistance localStorage (300 entrées, restaurée à l'ouverture de l'onglet)
- LOG-006 — Ship Firebase auto toutes les 5 min + à la fermeture de l'onglet (logs/{jour}/{pid})
- LOG-007 — Bouton 📥 .log : télécharge le fichier texte à la demande
- LOG-008 — Bouton ☁️ Firebase : envoi manuel instantané vers Firebase

## Beta 1.2.0 — 2026-05-10
### 🟡 Évolutions
- LOG-001 — Logger structuré window.LOGS (500 entrées, tags ERR/WRN/ACT/AI/INF)
- LOG-002 — Panneau debug : triple-tap sur le numéro de version → logs + boutons
- LOG-003 — Capture window.onerror + unhandledrejection (erreurs JS non gérées)
- LOG-004 — Instrumentation : phases, act(), aiTurn(), doBet(), postBet(), doNextRound()

## Beta 1.1.9 — 2026-05-10
### 🟡 Évolutions
- UX-UI-001 — Ombres multi-couches sur les cartes (profondeur visuelle)
- UX-UI-002 — Glow doré sur les cartes sélectionnées
- UX-UI-003 — Glassmorphism sur le panneau de pari (backdrop-filter blur)
- UX-UI-004 — Feedback tactile sur boutons et cartes (scale au clic)
- RWD — Interface responsive : centrage à 540px, bordures tablette/desktop
- PWA — Progressive Web App : manifest.json + service worker + icône SVG
- Padding safe-area-inset-bottom sur .bpanel (encoche iPhone)

## Beta 1.1.8 — 2026-05-10
### 🟡 Évolutions
- EVO-010 — Cartes joueur triées par ordre croissant (Joker en dernier)

## Beta 1.1.7 — 2026-05-10
### ✅ Anomalies corrigées
- ANO-030 — Paris manche 2+ : rotation circulaire du cp (boucle linéaire → modulo)
### 🟡 Évolutions
- EVO-009 — Missions échange N cartes : sélection manuelle des cartes à donner (nouvelle phase exchsel)

## Beta 1.1.6 — 2026-05-10
### ✅ Anomalies corrigées
- ANO-025 — revblind : cartes visibles pendant les paris (retrait de revblind de la condition hidH betting)

### 🟡 Évolutions
- EVO-002 — Timer : bouton Révéler → cartes affichées pendant le compte à rebours (flag TMRREV)

## Beta 1.1.5 — 2026-05-09
### ✅ Anomalies corrigées
- Fix audit fonctionnel : forehead, draw1, faceup, exchsim, exchwin

## Beta 1.1.4 — 2026-05-09
### ✅ Anomalies corrigées
- Bouton Quitter sans flèche + id="btn-quit-game"

## Beta 1.1.3 — 2026-05-08
### ✅ Anomalies corrigées
- Fix échange mains, betblind cartes cachées, pari manche 3+

## Beta 1.1.2 — 2025-05-08
### ✅ Anomalies corrigées
- ANO-026 — Conflit Firebase trick ancêtre/enfant
- ANO-027 — Pas de pari à la manche suivante
- ANO-028 — Manche 3+ : pari non proposé au joueur humain

### 🟡 Évolutions
- EVO-001 — Version Beta affichée sur l'écran d'accueil
- EVO-002 — Mission chrono : bouton Révéler + compte à rebours
- EVO-003 — Récap des paris visible en temps réel
- EVO-004 — Pause après chaque pli + bouton Pli suivant

## Beta 1.1.1 — 2025-05-08
### ✅ Anomalies corrigées
- ANO-028 — doNextRound : set() complet pour éviter renders partiels

## Beta 1.1.0 — 2025-05-08
### ✅ Anomalies corrigées
- ANO-019 — IA bloquée après pari humain (race condition BUSY)
- ANO-020 — Pas de bouton retour/menu
- ANO-021 — Pas de bouton copier/WhatsApp
- ANO-022 — Doublons prénoms
- ANO-023 — Matchmaking doublon de session
- ANO-026 — Firebase conflit ancêtre/enfant

### 🟡 Évolutions
- EVO-001 — Version Beta affichée
- EVO-002 — Mission chrono améliorée

## Beta 1.0.x — 2025-05-08
- Corrections multiples Firebase, Safari iOS, boutons CTA
- Fix initialisation Firebase en head
- Fix PERMISSION_DENIED Firebase rules

## Beta 1.0.0 — 2025-05-07
- 🎉 Première version jouable
- Solo vs IA (2 robots)
- Créer salle / Rejoindre / Matchmaking
- 41 missions implémentées
- Dégradé couleurs cartes 1→55
- Joker avec sélecteur de valeur
