const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/functional.spec.js',
  // Timeout plus long pour les tests fonctionnels (2 minutes par test)
  timeout: 120000,
  retries: 0,
  workers: 1, // Un seul worker pour éviter la surcharge Firebase
  reporter: [['html', { outputFolder: 'functional-report' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://arnaudmaffre.github.io/pilo-pilo/',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
