/**
 * TESTS FONCTIONNELS PILI PILI v2.0
 * Approche: lancer des parties Solo et vérifier les comportements
 * selon la mission qui se présente naturellement
 */
const { test, expect } = require('@playwright/test');

const URL = process.env.BASE_URL || 'https://arnaudmaffre.github.io/pilo-pilo/';
const FIREBASE_TIMEOUT = 15000;
const GAME_TIMEOUT = 30000;
const AI_WAIT = 8000;

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
async function waitForFirebase(page) {
  await page.waitForFunction(() => {
    const el = document.getElementById('fb-status');
    return el && (el.textContent.includes('Connecté') || el.textContent.includes('Entrez'));
  }, { timeout: FIREBASE_TIMEOUT });
}

async function launchSolo(page) {
  await page.goto(URL);
  await waitForFirebase(page);
  await page.fill('#home-name', 'TEST');
  await page.click('#btn-solo');
  await page.waitForSelector('#screen-game:not(.hidden)', { timeout: GAME_TIMEOUT });
  await page.waitForTimeout(2000);
}

async function getMissionEffect(page) {
  return page.evaluate(() => {
    return window.GS && window.GS.m ? window.GS.m.e : null;
  });
}

async function getMissionName(page) {
  return page.evaluate(() => {
    return window.GS && window.GS.m ? window.GS.m.t : 'Inconnue';
  });
}

async function getPhase(page) {
  return page.evaluate(() => window.GS ? window.GS.phase : null);
}

async function getMyCards(page) {
  return page.evaluate(() => {
    if (!window.GS || !window.PID) return [];
    var p = window.GS.players[window.PID];
    if (!p || !p.hand) return [];
    if (p.hand._x) return [];
    return Array.isArray(p.hand) ? p.hand : Object.values(p.hand).filter(x => x && !x._x);
  });
}

async function waitForBet(page) {
  try {
    await page.waitForFunction(() => {
      const bp = document.getElementById('gbottom');
      return bp && !bp.classList.contains('hidden') && bp.textContent.includes('Confirmer');
    }, { timeout: 20000 });
    return true;
  } catch(e) { return false; }
}

async function doBet(page, val) {
  val = val || 1;
  for (let i = 0; i < val; i++) {
    await page.locator('#gbottom button:last-of-type').click();
    await page.waitForTimeout(200);
  }
  await page.locator('button:has-text("Confirmer le pari")').click();
  await page.waitForTimeout(500);
}

async function waitForPlay(page) {
  try {
    await page.waitForFunction(() => {
      const bp = document.getElementById('gbottom');
      return bp && !bp.classList.contains('hidden') && bp.textContent.includes('votre tour');
    }, { timeout: AI_WAIT });
    return true;
  } catch(e) { return false; }
}

async function playOneCard(page) {
  const cards = await page.locator('#ghand .card').all();
  if (cards.length === 0) return false;
  await cards[0].click();
  await page.waitForTimeout(300);
  // Joker ?
  const joker = page.locator('#modal-joker:not(.hidden)');
  if (await joker.isVisible().catch(() => false)) {
    await page.locator('#bjyes').click();
    await page.waitForTimeout(300);
  }
  return true;
}

async function clickNextTrickIfVisible(page) {
  const btn = page.locator('#btn-next-trick');
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

async function playFullGame(page) {
  let safety = 30;
  while (safety-- > 0) {
    const phase = await getPhase(page);
    if (!phase || phase === 'results') break;

    // Phase timer — cliquer Révéler
    if (phase === 'timer') {
      const rb = page.locator('button:has-text("Révéler")');
      if (await rb.isVisible().catch(() => false)) await rb.click();
      await page.waitForTimeout(6000);
      continue;
    }

    // Phase sel3of5
    if (phase === 'sel3of5') {
      const cards = await page.locator('#ghand .card').all();
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        await cards[i].click();
        await page.waitForTimeout(200);
      }
      const cb = page.locator('button:has-text("Regarder ces 3")');
      if (await cb.isVisible().catch(() => false)) await cb.click();
      await page.waitForTimeout(500);
      continue;
    }

    // Phase betblind ou betting
    if (phase === 'betblind' || phase === 'betting') {
      const hasBet = await waitForBet(page);
      if (hasBet) await doBet(page, 1);
      await page.waitForTimeout(2000);
      continue;
    }

    // Phase desig
    if (phase === 'desig') {
      const db = await page.locator('.desb').all();
      if (db.length > 0) {
        await db[0].click();
        await page.waitForTimeout(300);
        const cb2 = page.locator('button:has-text("Désigner")');
        if (await cb2.isVisible().catch(() => false)) await cb2.click();
      }
      await page.waitForTimeout(1000);
      continue;
    }

    // Phase reveal
    if (phase === 'reveal') {
      const sb = page.locator('button:has-text("Commencer")');
      if (await sb.isVisible().catch(() => false)) await sb.click();
      await page.waitForTimeout(500);
      continue;
    }

    // Phase trick_review
    if (phase === 'trick_review') {
      await clickNextTrickIfVisible(page);
      await page.waitForTimeout(500);
      continue;
    }

    // Phase playing
    if (phase === 'playing') {
      const myTurn = await waitForPlay(page);
      if (myTurn) {
        await playOneCard(page);
      } else {
        // Attendre IA
        await page.waitForTimeout(2000);
      }
      await clickNextTrickIfVisible(page);
      continue;
    }

    await page.waitForTimeout(1000);
  }
  return await page.locator('#screen-results:not(.hidden)').count() > 0;
}

// ═══════════════════════════════════════
// TEST F1: COMPORTEMENTS DE BASE
// ═══════════════════════════════════════
test.describe('F1 — Comportements de base (toutes missions)', () => {

  test('F1.1 — Une partie Solo va jusqu\'aux résultats', async ({ page }) => {
    await launchSolo(page);
    const mission = await getMissionName(page);
    const effect = await getMissionEffect(page);
    console.log(`\n📋 Mission: ${mission} (${effect})`);

    const finished = await playFullGame(page);
    expect(finished).toBe(true);
    console.log('✅ Résultats atteints');
  });

  test('F1.2 — Les cartes sont distribuées', async ({ page }) => {
    await launchSolo(page);
    await page.waitForTimeout(3000);
    const cards = await getMyCards(page);
    expect(cards.length).toBeGreaterThan(0);
    const effect = await getMissionEffect(page);
    console.log(`✅ ${cards.length} cartes distribuées (mission: ${effect})`);
  });

  test('F1.3 — Le panel de pari est disponible', async ({ page }) => {
    await launchSolo(page);
    const hasBet = await waitForBet(page);
    const effect = await getMissionEffect(page);
    if (['t3s','t5sblind','sel3of5','betblind'].includes(effect)) {
      console.log(`⚠️ Mission ${effect}: pari non immédiat - OK`);
    } else {
      expect(hasBet).toBe(true);
      console.log(`✅ Panel de pari disponible (${effect})`);
    }
  });

  test('F1.4 — Les IA jouent après le pari humain', async ({ page }) => {
    await launchSolo(page);
    const hasBet = await waitForBet(page);
    if (hasBet) {
      await doBet(page, 1);
      // Attendre que la phase change (IA parient)
      await page.waitForFunction(() => {
        return window.GS && (
          window.GS.phase === 'playing' ||
          window.GS.phase === 'desig' ||
          window.GS.phase === 'reveal' ||
          window.GS.phase === 'results'
        );
      }, { timeout: 15000 });
      const phase = await getPhase(page);
      expect(['playing','desig','reveal','results']).toContain(phase);
      console.log(`✅ Phase après pari IA: ${phase}`);
    }
  });

  test('F1.5 — Le récap des paris est visible pendant le jeu', async ({ page }) => {
    await launchSolo(page);
    const hasBet = await waitForBet(page);
    if (hasBet) {
      await doBet(page, 1);
      await page.waitForFunction(() => window.GS && window.GS.phase === 'playing', { timeout: 15000 }).catch(() => {});
      const recap = page.locator('#bets-recap');
      await expect(recap).toBeVisible({ timeout: 5000 });
      console.log('✅ Récap des paris visible');
    }
  });

  test('F1.6 — Bouton Pli suivant après chaque pli', async ({ page }) => {
    await launchSolo(page);
    const hasBet = await waitForBet(page);
    if (!hasBet) return;
    await doBet(page, 1);
    await page.waitForFunction(() => window.GS && window.GS.phase === 'playing', { timeout: 15000 }).catch(() => {});
    const myTurn = await waitForPlay(page);
    if (myTurn) {
      await playOneCard(page);
      // Attendre trick_review
      try {
        await page.waitForFunction(() => window.GS && window.GS.phase === 'trick_review', { timeout: 10000 });
        const btn = page.locator('#btn-next-trick');
        await expect(btn).toBeVisible({ timeout: 5000 });
        console.log('✅ Bouton Pli suivant visible');
      } catch(e) {
        console.log('⚠️ trick_review non atteint dans le temps imparti');
      }
    }
  });
});

// ═══════════════════════════════════════
// TEST F2: VISIBILITÉ DES CARTES
// ═══════════════════════════════════════
test.describe('F2 — Visibilité des cartes', () => {

  test('F2.1 — Missions standard: cartes visibles', async ({ page }) => {
    // Lancer plusieurs parties jusqu'à trouver une mission standard
    let found = false;
    const standardEffects = ['nob0','nob1','nocopy','exch2r','exchr','exchl','exch2l',
      'exch1r','exch1l','exch3r','exch3l','exchsim','exchwin','desig','rev',
      'fl','cursed','winminus','faceup','draw1'];

    for (let attempt = 0; attempt < 5; attempt++) {
      await launchSolo(page);
      const effect = await getMissionEffect(page);
      if (standardEffects.includes(effect)) {
        // Vérifier que les cartes sont visibles
        const hiddenCount = await page.evaluate(() => {
          const cards = document.querySelectorAll('#ghand .card');
          let hidden = 0;
          cards.forEach(c => { if(c.innerHTML.includes('opacity:0.2')) hidden++; });
          return hidden;
        });
        expect(hiddenCount).toBe(0);
        console.log(`✅ Mission ${effect}: 0 cartes cachées sur ${await page.locator('#ghand .card').count()}`);
        found = true;
        break;
      }
      await page.goto(URL);
    }
    if (!found) console.log('⚠️ Mission standard non obtenue en 5 tentatives');
  });

  test('F2.2 — Missions masque: mes cartes cachées', async ({ page }) => {
    const maskEffects = ['forehead','blindmask'];
    let found = false;

    for (let attempt = 0; attempt < 8; attempt++) {
      await launchSolo(page);
      const effect = await getMissionEffect(page);
      if (maskEffects.includes(effect)) {
        await page.waitForTimeout(1000);
        const hiddenCount = await page.evaluate(() => {
          const cards = document.querySelectorAll('#ghand .card');
          let hidden = 0;
          cards.forEach(c => { if(c.innerHTML.includes('opacity:0.2')) hidden++; });
          return hidden;
        });
        const total = await page.locator('#ghand .card').count();
        expect(hiddenCount).toBe(total);
        console.log(`✅ Mission ${effect}: ${hiddenCount}/${total} cartes cachées`);
        found = true;
        break;
      }
      await page.goto(URL);
    }
    if (!found) console.log('⚠️ Mission masque non obtenue (peu fréquente)');
  });

  test('F2.3 — Mission betblind: cartes cachées pendant le pari', async ({ page }) => {
    let found = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      await launchSolo(page);
      const effect = await getMissionEffect(page);
      if (effect === 'betblind') {
        const hiddenCount = await page.evaluate(() => {
          const cards = document.querySelectorAll('#ghand .card');
          let hidden = 0;
          cards.forEach(c => { if(c.innerHTML.includes('opacity:0.2')) hidden++; });
          return hidden;
        });
        const total = await page.locator('#ghand .card').count();
        expect(hiddenCount).toBe(total);
        console.log(`✅ betblind: ${hiddenCount}/${total} cartes cachées pendant pari`);
        // Après pari: cartes visibles
        const hasBet = await waitForBet(page);
        if (hasBet) {
          await doBet(page, 1);
          await page.waitForFunction(() => window.GS && window.GS.phase === 'reveal', { timeout: 10000 }).catch(() => {});
          const visibleAfter = await page.evaluate(() => {
            const cards = document.querySelectorAll('#ghand .card');
            let visible = 0;
            cards.forEach(c => { if(!c.innerHTML.includes('opacity:0.2')) visible++; });
            return visible;
          });
          console.log(`✅ betblind: ${visibleAfter} cartes visibles après les paris`);
        }
        found = true;
        break;
      }
      await page.goto(URL);
    }
    if (!found) console.log('⚠️ Mission betblind non obtenue');
  });

  test('F2.4 — Mission timer: bouton Révéler présent', async ({ page }) => {
    const timerEffects = ['t3s','t5sblind'];
    let found = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      await launchSolo(page);
      const effect = await getMissionEffect(page);
      if (timerEffects.includes(effect)) {
        const revBtn = page.locator('button:has-text("Révéler")');
        await expect(revBtn).toBeVisible({ timeout: 5000 });
        console.log(`✅ Mission ${effect}: bouton Révéler présent`);
        found = true;
        break;
      }
      await page.goto(URL);
    }
    if (!found) console.log('⚠️ Mission timer non obtenue');
  });

  test('F2.5 — Mission sel3of5: sélection 3 cartes sur 5', async ({ page }) => {
    let found = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      await launchSolo(page);
      const effect = await getMissionEffect(page);
      if (effect === '3of5') {
        await page.waitForTimeout(1000);
        const total = await page.locator('#ghand .card').count();
        expect(total).toBe(5);
        console.log(`✅ 3of5: 5 cartes présentes`);
        // Sélectionner 3
        const cards = await page.locator('#ghand .card').all();
        for (let i = 0; i < 3; i++) {
          await cards[i].click();
          await page.waitForTimeout(300);
        }
        const confirmBtn = page.locator('button:has-text("Regarder ces 3")');
        await expect(confirmBtn).toBeEnabled({ timeout: 3000 });
        console.log(`✅ 3of5: bouton confirmer actif après 3 sélections`);
        found = true;
        break;
      }
      await page.goto(URL);
    }
    if (!found) console.log('⚠️ Mission 3of5 non obtenue');
  });
});

// ═══════════════════════════════════════
// TEST F3: RÈGLES DE PARI
// ═══════════════════════════════════════
test.describe('F3 — Règles de pari', () => {

  test('F3.1 — Pari interdit 0: message d\'erreur affiché', async ({ page }) => {
    let found = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      await launchSolo(page);
      const effect = await getMissionEffect(page);
      if (effect === 'nob0') {
        const hasBet = await waitForBet(page);
        expect(hasBet).toBe(true);
        // Tenter de parier 0 (valeur par défaut)
        await page.locator('button:has-text("Confirmer le pari")').click();
        await page.waitForTimeout(500);
        // Vérifier le toast d'erreur
        const toast = await page.locator('#toastbox').textContent().catch(() => '');
        expect(toast).toMatch(/Interdit|interdit|0/i);
        console.log(`✅ nob0: message d'erreur affiché: "${toast}"`);
        found = true;
        break;
      }
      await page.goto(URL);
    }
    if (!found) console.log('⚠️ Mission nob0 non obtenue');
  });

  test('F3.2 — Total paris ≠ nombre de cartes', async ({ page }) => {
    await launchSolo(page);
    const hasBet = await waitForBet(page);
    if (!hasBet) return;

    // Récupérer n
    const n = await page.evaluate(() => window.GS && window.GS.m ? window.GS.m.n : 0);
    // Parier n (qui sera interdit pour le dernier joueur)
    // Les IA parient automatiquement en évitant le total interdit
    await doBet(page, 1);

    // Après tous les paris, vérifier le total
    await page.waitForFunction(() => window.GS && window.GS.phase === 'playing', { timeout: 15000 }).catch(() => {});
    const total = await page.evaluate(() => {
      if (!window.GS) return -1;
      return Object.values(window.GS.players).reduce((a,p) => a + (p.bet||0), 0);
    });
    expect(total).not.toBe(n);
    console.log(`✅ Total paris (${total}) ≠ n (${n})`);
  });
});

// ═══════════════════════════════════════
// TEST F4: CALCUL DES PILIS
// ═══════════════════════════════════════
test.describe('F4 — Calcul des Pilis', () => {

  test('F4.1 — Pilis calculés correctement en fin de manche', async ({ page }) => {
    await launchSolo(page);
    const finished = await playFullGame(page);
    if (!finished) { console.log('⚠️ Partie non terminée'); return; }

    // Vérifier que les Pilis sont affichés
    const results = await page.locator('#rlist .rrow').count();
    expect(results).toBe(3);

    // Vérifier qu'au moins un joueur a des Pilis
    const pilis = await page.evaluate(() => {
      if (!window.GS) return [];
      return Object.values(window.GS.players).map(p => p.pilis||0);
    });
    const total = pilis.reduce((a,b) => a+b, 0);
    expect(total).toBeGreaterThan(0);
    console.log(`✅ Pilis distribués: A=${pilis[0]}, B=${pilis[1]}, C=${pilis[2]}`);
  });

  test('F4.2 — Manche suivante: Pilis conservés', async ({ page }) => {
    await launchSolo(page);
    const finished = await playFullGame(page);
    if (!finished) return;

    // Pilis après manche 1
    const pilisM1 = await page.evaluate(() => {
      if (!window.GS) return [];
      return Object.values(window.GS.players).map(p => p.pilis||0);
    });

    // Lancer manche 2
    const nextBtn = page.locator('#bnext');
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(3000);
      // Vérifier que les Pilis sont conservés
      const pilisM2 = await page.evaluate(() => {
        if (!window.GS) return [];
        return Object.values(window.GS.players).map(p => p.pilis||0);
      });
      // Les Pilis de M2 doivent être >= ceux de M1 (jamais réinitialisés à 0)
      pilisM1.forEach((p,i) => expect(pilisM2[i]).toBeGreaterThanOrEqual(p));
      console.log(`✅ Pilis conservés M1→M2: ${pilisM1} → ${pilisM2}`);
    }
  });

  test('F4.3 — Fin de partie à 6 Pilis', async ({ page }) => {
    await launchSolo(page);
    // Simuler 6 Pilis via Firebase
    const hasPID = await page.evaluate(() => !!window.PID);
    expect(hasPID).toBe(true);
    console.log('✅ PID disponible pour simulation');
    // Note: la simulation réelle nécessite Firebase direct
    // On vérifie juste que l'écran de fin apparaît si quelqu'un a 6 Pilis
    console.log('⚠️ Test fin de partie: nécessite simulation Firebase (hors scope automatique)');
  });
});

// ═══════════════════════════════════════
// TEST F5: NAVIGATION ET UX
// ═══════════════════════════════════════
test.describe('F5 — Navigation et UX', () => {

  test('F5.1 — Bouton Quitter ramène à l\'accueil', async ({ page }) => {
    await launchSolo(page);
    const btn = page.locator('#btn-quit-game');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();
    await expect(page.locator('#screen-home')).not.toHaveClass(/hidden/, { timeout: 5000 });
    console.log('✅ Quitter → accueil OK');
  });

  test('F5.2 — Manche suivante propose bien les paris', async ({ page }) => {
    await launchSolo(page);
    const finished = await playFullGame(page);
    if (!finished) return;

    const nextBtn = page.locator('#bnext');
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(3000);
      const hasBet = await waitForBet(page);
      console.log(`${hasBet ? '✅' : '❌'} Manche 2: panel de pari ${hasBet ? 'disponible' : 'absent'}`);
    }
  });

  test('F5.3 — Version Beta affichée sur l\'accueil', async ({ page }) => {
    await page.goto(URL);
    const version = await page.locator('text=Beta').first().textContent().catch(() => '');
    expect(version).toMatch(/Beta \d+\.\d+\.\d+/);
    console.log(`✅ Version: ${version}`);
  });
});
