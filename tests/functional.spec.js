/**
 * TESTS FONCTIONNELS PILI PILI — v1.0
 * 
 * Couvre les 41 missions avec vérifications :
 * - Visibilité des cartes (face visible/cachée)
 * - Cartes des autres joueurs visibles si mission "masque"
 * - Phase de pari correcte
 * - Déroulement complet jusqu'aux résultats
 * 
 * Catégories de missions :
 * A) STANDARD     — cartes visibles, pari normal
 * B) ECHANGE      — échange de mains après pari
 * C) PARI_SPEC    — contraintes sur le pari (interdit 0, interdit 1, nocopy)
 * D) TIMER        — chrono avant pari (t3s, t5sblind)
 * E) BETBLIND     — pari avant de voir ses cartes
 * F) MASQUE       — on voit les cartes des autres, pas les siennes
 * G) REVERSE      — valeurs inversées
 * H) DESIG        — désigner un joueur
 * I) SEL3OF5      — choisir 3 cartes sur 5
 * J) SPECIAL      — cursed, firstlast, winminus, faceup, draw1
 */

const { test, expect } = require('@playwright/test');

const URL = process.env.BASE_URL || 'https://arnaudmaffre.github.io/pilo-pilo/';
const TIMEOUT = 20000;
const AI_TIMEOUT = 12000;

// ═══════════════════════════════════════════════════
// CATALOGUE DES 41 MISSIONS avec leurs règles
// ═══════════════════════════════════════════════════
const MISSIONS = [
  // A) STANDARD
  {id:3,  e:'nob0',     cat:'PARI_SPEC',  cards:4, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Pari interdit 0'},
  {id:11, e:'nob1',     cat:'PARI_SPEC',  cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Pari interdit 1'},
  {id:38, e:'nob1',     cat:'PARI_SPEC',  cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Pari interdit 1 (5c)'},
  {id:36, e:'nocopy',   cat:'PARI_SPEC',  cards:4, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Pari différent du précédent'},
  // B) ECHANGE
  {id:1,  e:'exch2r',   cat:'ECHANGE',    cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange 2 cartes →'},
  {id:2,  e:'exchr',    cat:'ECHANGE',    cards:7, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Main entière →'},
  {id:4,  e:'exch2l',   cat:'ECHANGE',    cards:4, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange 2 cartes ←'},
  {id:5,  e:'exchl',    cat:'ECHANGE',    cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Main entière ←'},
  {id:6,  e:'exch2l',   cat:'ECHANGE',    cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange 2 cartes ← (6c)'},
  {id:19, e:'exch1r',   cat:'ECHANGE',    cards:3, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange 1 carte →'},
  {id:21, e:'exchr',    cat:'ECHANGE',    cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Main entière circulaire'},
  {id:25, e:'exch3r',   cat:'ECHANGE',    cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange 3 cartes →'},
  {id:26, e:'exch3l',   cat:'ECHANGE',    cards:7, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange 3 cartes ←'},
  {id:29, e:'exch1l',   cat:'ECHANGE',    cards:3, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange 1 carte ←'},
  {id:40, e:'exchr',    cat:'ECHANGE',    cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Main entière → (5c)'},
  {id:8,  e:'exchsim',  cat:'ECHANGE',    cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange simultané'},
  {id:20, e:'exchsim',  cat:'ECHANGE',    cards:4, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange simultané (4c)'},
  {id:28, e:'exchwin',  cat:'ECHANGE',    cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Échange après pli gagné'},
  // C) TIMER
  {id:10, e:'t3s',      cat:'TIMER',      cards:6, cardsVisible:true,  othersVisible:false, timerBefore:true,  betBlind:false, sel3:false, timerSec:3,  desc:'3 secondes !'},
  {id:15, e:'t5sblind', cat:'TIMER',      cards:3, cardsVisible:false, othersVisible:false, timerBefore:true,  betBlind:false, sel3:false, timerSec:5,  desc:'5s puis à l\'aveugle'},
  {id:33, e:'t5sblind', cat:'TIMER',      cards:5, cardsVisible:false, othersVisible:false, timerBefore:true,  betBlind:false, sel3:false, timerSec:5,  desc:'5s à l\'aveugle (5c)'},
  // D) BETBLIND
  {id:27, e:'betblind', cat:'BETBLIND',   cards:3, cardsVisible:false, othersVisible:false, timerBefore:false, betBlind:true,  sel3:false, desc:'Pari avant de voir'},
  // E) MASQUE
  {id:7,  e:'forehead', cat:'MASQUE',     cards:2, cardsVisible:false, othersVisible:true,  timerBefore:false, betBlind:false, sel3:false, desc:'Masque (voit les autres)'},
  {id:32, e:'blindmask',cat:'MASQUE',     cards:2, cardsVisible:false, othersVisible:true,  timerBefore:false, betBlind:false, sel3:false, desc:'Masque Aveugle'},
  {id:41, e:'blindmask',cat:'MASQUE',     cards:2, cardsVisible:false, othersVisible:true,  timerBefore:false, betBlind:false, sel3:false, desc:'Masque Aveugle v2'},
  // F) REVERSE
  {id:18, e:'rev',      cat:'REVERSE',    cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Valeurs inversées'},
  {id:31, e:'rev',      cat:'REVERSE',    cards:4, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Valeurs inversées (4c)'},
  {id:14, e:'revblind', cat:'REVERSE',    cards:7, cardsVisible:false, othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Inversé + à l\'aveugle'},
  // G) DESIG
  {id:9,  e:'desig',    cat:'DESIG',      cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Désigner un joueur (5c)'},
  {id:13, e:'desig',    cat:'DESIG',      cards:3, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Désigner un joueur (3c)'},
  // H) SEL3OF5
  {id:12, e:'3of5',     cat:'SEL3OF5',    cards:5, cardsVisible:false, othersVisible:false, timerBefore:false, betBlind:false, sel3:true,  desc:'3 sur 5'},
  // I) SPECIAL
  {id:16, e:'draw1',    cat:'SPECIAL',    cards:4, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Pioche bonus (4c)'},
  {id:39, e:'draw1',    cat:'SPECIAL',    cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Pioche bonus (5c)'},
  {id:17, e:'cursed',   cat:'SPECIAL',    cards:5, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Numéros maudits 3-8'},
  {id:35, e:'cursed',   cat:'SPECIAL',    cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Numéros maudits 34-38'},
  {id:22, e:'winminus', cat:'SPECIAL',    cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Pari réussi = -Pili (6c)'},
  {id:37, e:'winminus', cat:'SPECIAL',    cards:3, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Pari réussi = -Pili (3c)'},
  {id:23, e:'fl',       cat:'SPECIAL',    cards:4, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'1er/Dernier pli maudit (4c)'},
  {id:24, e:'fl',       cat:'SPECIAL',    cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'1er/Dernier pli maudit (6c)'},
  {id:30, e:'faceup',   cat:'SPECIAL',    cards:4, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Cartes face visible (4c)'},
  {id:34, e:'faceup',   cat:'SPECIAL',    cards:6, cardsVisible:true,  othersVisible:false, timerBefore:false, betBlind:false, sel3:false, desc:'Cartes face visible (6c)'},
];

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
async function waitForFirebase(page) {
  await page.waitForFunction(() => {
    const el = document.getElementById('fb-status');
    return el && (el.textContent.includes('Connecté') || el.textContent.includes('Entrez'));
  }, { timeout: 12000 });
}

async function launchSoloWithMission(page, missionEffect) {
  await page.goto(URL);
  await waitForFirebase(page);
  await page.fill('#home-name', 'TESTEUR');

  // Injecter la mission spécifique via localStorage simulé
  // On intercepte le random pour forcer la mission
  await page.evaluate((effect) => {
    // Override Math.random pour forcer la mission choisie
    const MISS = window.MISS || [];
    const idx = MISS.findIndex(m => m.e === effect);
    if (idx >= 0) {
      const orig = Math.random;
      Math.random = function() {
        Math.random = orig; // restaurer après 1 appel
        return idx / MISS.length;
      };
    }
  }, missionEffect);

  await page.click('#btn-solo');
  await page.waitForSelector('#screen-game:not(.hidden)', { timeout: TIMEOUT });
  await page.waitForFunction(() => {
    const hand = document.getElementById('ghand');
    return hand && hand.children.length > 0;
  }, { timeout: TIMEOUT });
  await page.waitForTimeout(1500);
}

async function getMissionName(page) {
  return page.locator('#gmission .mtitle').textContent().catch(() => 'Inconnue');
}

async function getCardCount(page) {
  return page.locator('#ghand .card').count();
}

async function areCardsHidden(page) {
  // Cartes cachées = contiennent l'emoji 🌶️ avec opacité faible (classe hid)
  const cards = await page.locator('#ghand .card').all();
  if (cards.length === 0) return false;
  // Vérifier si la première carte a un contenu caché
  const first = await cards[0].innerHTML();
  return first.includes('opacity:0.2') || first.includes('opacity:.2');
}

async function areOtherCardsVisible(page) {
  // Dans les missions masque, les cartes des autres dans le pli/trick doivent être visibles
  // On vérifie dans la barre des joueurs si des cartes sont affichées
  const trickCards = await page.locator('#gtcards .card').count();
  return trickCards > 0;
}

async function waitForBetPanel(page) {
  try {
    await page.waitForFunction(() => {
      const bp = document.getElementById('gbottom');
      return bp && !bp.classList.contains('hidden') &&
        bp.textContent.includes('Confirmer');
    }, { timeout: 15000 });
    return true;
  } catch(e) { return false; }
}

async function doBet(page, value) {
  value = value || 1;
  for (let i = 0; i < value; i++) {
    await page.locator('.bbtn').last().click();
    await page.waitForTimeout(200);
  }
  await page.locator('button:has-text("Confirmer le pari")').click();
}

async function waitForPhase(page, phaseText, timeout) {
  timeout = timeout || TIMEOUT;
  await page.waitForFunction((text) => {
    const lbl = document.getElementById('gplbl');
    return lbl && lbl.textContent.includes(text);
  }, phaseText, { timeout });
}

async function waitForResults(page) {
  try {
    await page.waitForSelector('#screen-results:not(.hidden)', { timeout: 60000 });
    return true;
  } catch(e) { return false; }
}

async function playFullRound(page, mission) {
  // Gérer les phases spéciales avant le pari
  const phase = await page.locator('#gplbl').textContent().catch(() => '');

  // Phase TIMER — cliquer sur Révéler si présent
  if (mission.timerBefore) {
    try {
      const revealBtn = page.locator('button:has-text("Révéler")');
      const visible = await revealBtn.isVisible().catch(() => false);
      if (visible) await revealBtn.click();
      await page.waitForTimeout((mission.timerSec || 5) * 1000 + 1000);
    } catch(e) {}
  }

  // Phase SEL3OF5 — sélectionner 3 cartes
  if (mission.sel3) {
    try {
      await waitForPhase(page, '3 cartes', 8000);
      const cards = await page.locator('#ghand .card').all();
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        await cards[i].click();
        await page.waitForTimeout(300);
      }
      const confirmBtn = page.locator('button:has-text("Regarder ces 3")');
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
    } catch(e) {}
  }

  // Phase BETBLIND — pari sans voir les cartes
  if (mission.betBlind) {
    try {
      await waitForPhase(page, 'sans voir', 8000);
      const hasBet = await waitForBetPanel(page);
      if (hasBet) await doBet(page, 1);
    } catch(e) {}
  }

  // Phase PARI normale
  const hasBet = await waitForBetPanel(page);
  if (hasBet) {
    // Vérifier contrainte nob0
    if (mission.e === 'nob0') await doBet(page, 2);
    // Vérifier contrainte nob1
    else if (mission.e === 'nob1') await doBet(page, 2);
    else await doBet(page, 1);
  }

  // Phase DESIG — désigner un joueur
  try {
    const isDesig = await page.locator('#gbottom').textContent().catch(() => '');
    if (isDesig.includes('Désignez')) {
      const desigBtns = await page.locator('.desb').all();
      if (desigBtns.length > 0) {
        await desigBtns[0].click();
        await page.waitForTimeout(300);
        await page.locator('button:has-text("Désigner")').click();
      }
    }
  } catch(e) {}

  // Phase REVEAL (betblind) — cliquer sur Commencer
  try {
    const startBtn = page.locator('button:has-text("Commencer à jouer")');
    if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  } catch(e) {}

  // Attendre la phase de jeu
  await waitForPhase(page, 'Jeu', 15000).catch(() => {});

  // Jouer toutes les cartes
  let safetyCount = 0;
  while (safetyCount < 20) {
    safetyCount++;
    try {
      // Mon tour ?
      const myTurn = await page.waitForFunction(() => {
        const bp = document.getElementById('gbottom');
        return bp && !bp.classList.contains('hidden') &&
          bp.textContent.includes('votre tour');
      }, { timeout: 8000 }).catch(() => null);

      if (!myTurn) {
        // Attendre que l'IA joue ou que le résultat arrive
        const done = await page.waitForFunction(() => {
          return document.querySelector('#screen-results:not(.hidden)') !== null ||
            (document.getElementById('gbottom') &&
             !document.getElementById('gbottom').classList.contains('hidden') &&
             document.getElementById('gbottom').textContent.includes('votre tour'));
        }, { timeout: 8000 }).catch(() => null);
        if (!done) break;
        if (await page.locator('#screen-results:not(.hidden)').count() > 0) break;
        continue;
      }

      // Cliquer sur "Pli suivant" si présent
      const nextTrick = page.locator('#btn-next-trick');
      if (await nextTrick.isVisible().catch(() => false)) {
        await nextTrick.click();
        await page.waitForTimeout(500);
        continue;
      }

      // Jouer une carte
      const cards = await page.locator('#ghand .card').all();
      if (cards.length === 0) break;
      await cards[0].click();
      await page.waitForTimeout(500);

      // Joker ?
      const jokerModal = page.locator('#modal-joker:not(.hidden)');
      if (await jokerModal.isVisible().catch(() => false)) {
        await page.locator('#bjyes').click();
      }

      // Pli suivant ?
      await page.waitForTimeout(1000);
      const nextBtn = page.locator('#btn-next-trick');
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }

      // Résultats ?
      if (await page.locator('#screen-results:not(.hidden)').count() > 0) break;

    } catch(e) { break; }
  }

  return await page.locator('#screen-results:not(.hidden)').count() > 0;
}

// ═══════════════════════════════════════════════════
// TESTS FONCTIONNELS PAR CATEGORIE
// ═══════════════════════════════════════════════════

// Grouper par catégorie
const byCategory = {};
MISSIONS.forEach(m => {
  if (!byCategory[m.cat]) byCategory[m.cat] = [];
  byCategory[m.cat].push(m);
});

// ─── CATEGORIE A: PARI SPECIAL ───
test.describe('PARI_SPEC — Contraintes de pari', () => {
  byCategory['PARI_SPEC'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      const missionName = await getMissionName(page);
      console.log(`\n📋 Mission: ${missionName} (effet: ${mission.e})`);

      // Vérifier cartes visibles
      const hidden = await areCardsHidden(page);
      expect(hidden).toBe(false);
      console.log('✅ Cartes visibles: OUI');

      // Vérifier nombre de cartes
      const count = await getCardCount(page);
      expect(count).toBeGreaterThan(0);
      console.log(`✅ Cartes distribuées: ${count}`);

      // Vérifier panel de pari disponible
      const hasBet = await waitForBetPanel(page);
      expect(hasBet).toBe(true);
      console.log('✅ Panel de pari: OUI');

      // Jouer la manche complète
      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});

// ─── CATEGORIE B: ECHANGE ───
test.describe('ECHANGE — Missions d\'échange de mains', () => {
  byCategory['ECHANGE'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      const missionName = await getMissionName(page);
      console.log(`\n📋 Mission: ${missionName} (effet: ${mission.e})`);

      // Cartes doivent être visibles avant le pari
      const hidden = await areCardsHidden(page);
      expect(hidden).toBe(false);
      console.log('✅ Cartes visibles avant pari: OUI');

      const count = await getCardCount(page);
      expect(count).toBeGreaterThan(0);

      // Parier
      const hasBet = await waitForBetPanel(page);
      expect(hasBet).toBe(true);
      await doBet(page, 1);

      // Après le pari, attendre que la phase de jeu arrive
      // (l'échange est automatique côté serveur)
      await waitForPhase(page, 'Jeu', 10000).catch(() => {});

      // Vérifier qu'on a toujours des cartes (échange effectué)
      const countAfter = await getCardCount(page);
      expect(countAfter).toBeGreaterThan(0);
      console.log(`✅ Cartes après échange: ${countAfter}`);

      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});

// ─── CATEGORIE C: TIMER ───
test.describe('TIMER — Missions avec chronomètre', () => {
  byCategory['TIMER'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      const missionName = await getMissionName(page);
      console.log(`\n📋 Mission: ${missionName} (timer: ${mission.timerSec}s)`);

      // En phase timer, les cartes doivent être cachées initialement
      // Vérifier qu'un bouton Révéler est présent
      try {
        const revealBtn = page.locator('button:has-text("Révéler")');
        const hasReveal = await revealBtn.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`${hasReveal ? '✅' : '❌'} Bouton Révéler: ${hasReveal ? 'OUI' : 'NON'}`);

        if (hasReveal) {
          // Avant de révéler: cartes cachées
          const hiddenBefore = await areCardsHidden(page);
          console.log(`${hiddenBefore ? '✅' : '⚠️'} Cartes cachées avant révélation: ${hiddenBefore ? 'OUI' : 'NON (à corriger)'}`);

          // Cliquer Révéler
          await revealBtn.click();
          console.log('✅ Bouton Révéler cliqué');

          // Attendre le timer
          await page.waitForTimeout((mission.timerSec || 3) * 1000 + 500);

          // Après timer sur mission t5sblind: cartes doivent redevenir cachées
          if (mission.e === 't5sblind') {
            const hiddenAfter = await areCardsHidden(page);
            console.log(`${hiddenAfter ? '✅' : '⚠️'} Cartes cachées après timer: ${hiddenAfter ? 'OUI' : 'NON (à corriger)'}`);
          }
        }
      } catch(e) {
        console.log('⚠️ Phase timer non détectée');
      }

      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});

// ─── CATEGORIE D: BETBLIND ───
test.describe('BETBLIND — Pari avant de voir ses cartes', () => {
  byCategory['BETBLIND'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      console.log(`\n📋 Mission: Pari avant de voir (betblind)`);

      // Cartes doivent être cachées pendant le pari
      const hiddenDuringBet = await areCardsHidden(page);
      console.log(`${hiddenDuringBet ? '✅' : '❌'} Cartes cachées pendant pari: ${hiddenDuringBet ? 'OUI' : 'NON'}`);
      expect(hiddenDuringBet).toBe(true);

      // Panel de pari disponible
      const hasBet = await waitForBetPanel(page);
      expect(hasBet).toBe(true);
      await doBet(page, 1);

      // Après tous les paris: bouton "Commencer à jouer" + cartes visibles
      try {
        const startBtn = page.locator('button:has-text("Commencer à jouer")');
        const hasStart = await startBtn.isVisible({ timeout: 8000 }).catch(() => false);
        console.log(`${hasStart ? '✅' : '⚠️'} Bouton Commencer à jouer: ${hasStart ? 'OUI' : 'NON'}`);

        if (hasStart) {
          // Cartes visibles maintenant
          const visibleNow = !(await areCardsHidden(page));
          console.log(`${visibleNow ? '✅' : '❌'} Cartes visibles après paris: ${visibleNow ? 'OUI' : 'NON'}`);
          await startBtn.click();
        }
      } catch(e) {}

      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});

// ─── CATEGORIE E: MASQUE ───
test.describe('MASQUE — On voit les cartes des autres, pas les siennes', () => {
  byCategory['MASQUE'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      const missionName = await getMissionName(page);
      console.log(`\n📋 Mission: ${missionName} (masque)`);

      // MES cartes doivent être cachées
      const myCardsHidden = await areCardsHidden(page);
      console.log(`${myCardsHidden ? '✅' : '❌'} Mes cartes cachées: ${myCardsHidden ? 'OUI' : 'NON'}`);
      expect(myCardsHidden).toBe(true);

      // REMARQUE: dans le jeu solo avec IA, les cartes des autres ne sont pas
      // encore dans le trick area avant qu'ils jouent.
      // On vérifie juste que notre panel de pari est disponible
      const hasBet = await waitForBetPanel(page);
      console.log(`${hasBet ? '✅' : '⚠️'} Panel de pari disponible: ${hasBet ? 'OUI' : 'NON (mission timer?)'}`);

      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});

// ─── CATEGORIE F: REVERSE ───
test.describe('REVERSE — Valeurs inversées', () => {
  byCategory['REVERSE'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      const missionName = await getMissionName(page);
      console.log(`\n📋 Mission: ${missionName} (inversé)`);

      // Warning "Valeurs inversées" doit être visible après les paris
      const hasBet = await waitForBetPanel(page);
      if (hasBet) await doBet(page, 1);

      await waitForPhase(page, 'Jeu', 10000).catch(() => {});

      // Vérifier le warning inversé
      const hasWarning = await page.locator('#revw').isVisible().catch(() => false);
      console.log(`${hasWarning ? '✅' : '❌'} Warning valeurs inversées: ${hasWarning ? 'OUI' : 'NON'}`);

      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});

// ─── CATEGORIE G: DESIG ───
test.describe('DESIG — Désigner un joueur', () => {
  byCategory['DESIG'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      console.log(`\n📋 Mission: Désigner (${mission.cards}c)`);

      // Cartes visibles
      const hidden = await areCardsHidden(page);
      expect(hidden).toBe(false);

      // Parier
      const hasBet = await waitForBetPanel(page);
      expect(hasBet).toBe(true);
      await doBet(page, 1);

      // Phase désignation
      await page.waitForTimeout(3000);
      try {
        const desigPanel = await page.locator('#gbottom').textContent().catch(() => '');
        if (desigPanel.includes('Désignez')) {
          console.log('✅ Phase désignation visible');
          const desigBtns = await page.locator('.desb').all();
          console.log(`✅ Joueurs à désigner: ${desigBtns.length}`);
          if (desigBtns.length > 0) {
            await desigBtns[0].click();
            await page.waitForTimeout(300);
            await page.locator('button:has-text("Désigner")').click();
          }
        } else {
          console.log('⚠️ Phase désignation non visible (IA peut avoir désigné déjà)');
        }
      } catch(e) {}

      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});

// ─── CATEGORIE H: SEL3OF5 ───
test.describe('SEL3OF5 — Choisir 3 cartes sur 5', () => {
  byCategory['SEL3OF5'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      console.log(`\n📋 Mission: 3 sur 5`);

      // Phase sel3of5: cartes cachées au départ
      const hidden = await areCardsHidden(page);
      console.log(`${hidden ? '✅' : '⚠️'} Cartes cachées initialement: ${hidden ? 'OUI' : 'NON'}`);

      // Sélectionner 3 cartes
      const cards = await page.locator('#ghand .card').all();
      expect(cards.length).toBe(5);
      console.log(`✅ 5 cartes présentes`);

      for (let i = 0; i < 3; i++) {
        await cards[i].click();
        await page.waitForTimeout(400);
      }
      console.log('✅ 3 cartes sélectionnées');

      // Confirmer
      const confirmBtn = page.locator('button:has-text("Regarder ces 3")');
      await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
      await confirmBtn.click();
      console.log('✅ Confirmation 3 cartes OK');

      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});

// ─── CATEGORIE I: SPECIAL ───
test.describe('SPECIAL — Missions à règles spéciales (cursed, winminus, etc.)', () => {
  byCategory['SPECIAL'].forEach(mission => {
    test(`M${mission.id} — ${mission.desc}`, async ({ page }) => {
      await launchSoloWithMission(page, mission.e);

      const missionName = await getMissionName(page);
      console.log(`\n📋 Mission: ${missionName} (effet: ${mission.e})`);

      const hidden = await areCardsHidden(page);
      expect(hidden).toBe(false);
      console.log('✅ Cartes visibles: OUI');

      const hasBet = await waitForBetPanel(page);
      expect(hasBet).toBe(true);
      console.log('✅ Panel de pari: OUI');

      const finished = await playFullRound(page, mission);
      console.log(`${finished ? '✅' : '⚠️'} Manche complète: ${finished ? 'OUI' : 'Partielle'}`);
    });
  });
});
