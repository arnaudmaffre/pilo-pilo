const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // Timeout global par test
  timeout: 30000,
  retries: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://arnaudmaffre.github.io/pilo-pilo/',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Timeout pour chaque action (click, fill, etc.)
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
