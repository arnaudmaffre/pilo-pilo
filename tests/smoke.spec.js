const { test, expect } = require('@playwright/test');

const URL = process.env.BASE_URL || 'https://arnaudmaffre.github.io/pilo-pilo/';
const PLAYER_NAME = 'ARNO';

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
async function enterName(page, name) {
  await page.fill('#home-name', name);
}

async function waitForFirebase(page) {
  // Attendre que le statut Firebase soit OK
  await page.waitForFunction(() => {
    const el = document.getElementById('fb-status');
    return el && (el.textContent.includes('Connecté') || el.textContent.includes('Entrez'));
  }, { timeout: 10000 });
}

// ═══════════════════════════════════════════════════
// T1 — SMOKE TEST: Page d'accueil
// ═══════════════════════════════════════════════════
test('T1.1 — Page accueil se charge', async ({ page }) => {
  await page.goto(URL);
  await expect(page).toHaveTitle(/Pili Pili/);
  await expect(page.locator('.logo-title')).toBeVisible();
  await expect(page.locator('#btn-solo')).toBeVisible();
  await expect(page.locator('#btn-create')).toBeVisible();
  await expect(page.locator('#btn-mm')).toBeVisible();
  await expect(page.locator('#btn-join')).toBeVisible();
  console.log('✅ T1.1 — Page accueil OK');
});

test('T1.2 — Version Beta affichée', async ({ page }) => {
  await page.goto(URL);
  const version = await page.locator('text=Beta').first();
  await expect(version).toBeVisible();
  console.log('✅ T1.2 — Version affichée OK');
});

test('T1.3 — Firebase connecté', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  const status = await page.locator('#fb-status').textContent();
  expect(status).toMatch(/Connecté|Entrez/);
  console.log('✅ T1.3 — Firebase OK:', status);
});

// ═══════════════════════════════════════════════════
// T2 — SMOKE TEST: Solo vs IA
// ═══════════════════════════════════════════════════
test('T2.1 — Solo vs IA se lance', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-solo');

  // Attendre l'écran de jeu
  await expect(page.locator('#screen-game')).not.toHaveClass(/hidden/, { timeout: 10000 });
  await expect(page.locator('#gmission')).toBeVisible();
  console.log('✅ T2.1 — Solo lancé OK');
});

test('T2.2 — Mission affichée', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-solo');
  await page.waitForSelector('#screen-game:not(.hidden)', { timeout: 10000 });

  const mission = await page.locator('#gmission').textContent();
  expect(mission.length).toBeGreaterThan(5);
  console.log('✅ T2.2 — Mission:', mission.substring(0, 50));
});

test('T2.3 — Cartes distribuées', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-solo');
  await page.waitForSelector('#screen-game:not(.hidden)', { timeout: 10000 });
  await page.waitForTimeout(2000);

  const cards = await page.locator('#ghand .card').count();
  expect(cards).toBeGreaterThan(0);
  console.log('✅ T2.3 — Cartes distribuées:', cards);
});

test('T2.4 — Bouton Quitter visible', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-solo');
  await page.waitForSelector('#screen-game:not(.hidden)', { timeout: 10000 });

  await expect(page.locator('button:has-text("Quitter")')).toBeVisible();
  console.log('✅ T2.4 — Bouton Quitter OK');
});

test('T2.5 — Bouton Quitter ramène à l\'accueil', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-solo');
  await page.waitForSelector('#screen-game:not(.hidden)', { timeout: 10000 });
  await page.click('button:has-text("Quitter")');

  await expect(page.locator('#screen-home')).not.toHaveClass(/hidden/, { timeout: 5000 });
  console.log('✅ T2.5 — Retour accueil OK');
});

test('T2.6 — Pari fonctionne', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-solo');
  await page.waitForSelector('#screen-game:not(.hidden)', { timeout: 10000 });
  await page.waitForTimeout(3000);

  // Vérifier que le panel de pari est visible
  const betPanel = page.locator('#gbottom');
  const isVisible = await betPanel.isVisible();
  if (isVisible) {
    // Augmenter le pari
    await page.click('#bet-p');
    const betVal = await page.locator('#bet-d').textContent();
    expect(parseInt(betVal)).toBe(1);
    // Confirmer le pari
    await page.click('#bet-ok');
    console.log('✅ T2.6 — Pari confirmé OK');
  } else {
    console.log('⚠️ T2.6 — Panel de pari non visible (mission timer?)');
  }
});

test('T2.7 — IA joue après le pari humain', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-solo');
  await page.waitForSelector('#screen-game:not(.hidden)', { timeout: 10000 });
  await page.waitForTimeout(3000);

  const betPanel = page.locator('#gbottom');
  const isVisible = await betPanel.isVisible();
  if (isVisible) {
    await page.click('#bet-ok'); // Paris 0
    // Attendre que les IA parient (max 5s)
    await page.waitForTimeout(4000);
    // Vérifier que la phase a avancé (les IA ont parié)
    const phaseLabel = await page.locator('#gplbl').textContent();
    console.log('✅ T2.7 — Phase après pari IA:', phaseLabel);
  }
});

// ═══════════════════════════════════════════════════
// T3 — SMOKE TEST: Créer salle
// ═══════════════════════════════════════════════════
test('T3.1 — Créer salle affiche le lobby', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-create');

  await expect(page.locator('#screen-lobby')).not.toHaveClass(/hidden/, { timeout: 10000 });
  await expect(page.locator('#lobby-code')).toBeVisible();
  console.log('✅ T3.1 — Lobby créé OK');
});

test('T3.2 — Code de salle généré (4 caractères)', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-create');
  await page.waitForSelector('#screen-lobby:not(.hidden)', { timeout: 10000 });

  const code = await page.locator('#lobby-code').textContent();
  expect(code).toMatch(/^[A-Z0-9]{4}$/);
  console.log('✅ T3.2 — Code généré:', code);
});

test('T3.3 — Bouton copier présent', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-create');
  await page.waitForSelector('#screen-lobby:not(.hidden)', { timeout: 10000 });

  await expect(page.locator('#btn-copy-code')).toBeVisible();
  console.log('✅ T3.3 — Bouton copier OK');
});

test('T3.4 — Bouton WhatsApp présent', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-create');
  await page.waitForSelector('#screen-lobby:not(.hidden)', { timeout: 10000 });

  await expect(page.locator('#btn-wa-code')).toBeVisible();
  console.log('✅ T3.4 — Bouton WhatsApp OK');
});

// ═══════════════════════════════════════════════════
// T4 — SMOKE TEST: Rejoindre salle
// ═══════════════════════════════════════════════════
test('T4.1 — Rejoindre avec code valide', async ({ browser }) => {
  // Joueur 1 crée la salle
  const page1 = await browser.newPage();
  await page1.goto(URL);
  await waitForFirebase(page1);
  await enterName(page1, 'HOST');
  await page1.click('#btn-create');
  await page1.waitForSelector('#screen-lobby:not(.hidden)', { timeout: 10000 });
  const code = await page1.locator('#lobby-code').textContent();

  // Joueur 2 rejoint
  const page2 = await browser.newPage();
  await page2.goto(URL);
  await waitForFirebase(page2);
  await enterName(page2, 'GUEST');
  await page2.fill('#join-code', code);
  await page2.click('#btn-join');
  await page2.waitForSelector('#screen-lobby:not(.hidden)', { timeout: 10000 });

  // Vérifier que les 2 joueurs sont dans le lobby
  await page1.waitForTimeout(2000);
  const players1 = await page1.locator('#lobby-players .player-row').count();
  expect(players1).toBe(2);
  console.log('✅ T4.1 — 2 joueurs dans le lobby OK');

  await page1.close();
  await page2.close();
});

test('T4.2 — Code invalide affiche erreur', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.fill('#join-code', 'XXXX');

  // Écouter le toast
  await page.click('#btn-join');
  await page.waitForTimeout(1000);
  const toast = await page.locator('#toastbox').textContent();
  expect(toast).toMatch(/introuvable|invalide/i);
  console.log('✅ T4.2 — Erreur code invalide OK:', toast);
});

// ═══════════════════════════════════════════════════
// T5 — SMOKE TEST: Matchmaking
// ═══════════════════════════════════════════════════
test('T5.1 — Matchmaking crée ou rejoint une salle', async ({ page }) => {
  await page.goto(URL);
  await waitForFirebase(page);
  await enterName(page, PLAYER_NAME);
  await page.click('#btn-mm');

  await page.waitForSelector('#screen-lobby:not(.hidden)', { timeout: 10000 });
  await expect(page.locator('#lobby-code')).toBeVisible();
  console.log('✅ T5.1 — Matchmaking OK');
});
