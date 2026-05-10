# Tests Playwright

## Suites

| Commande | Fichier | Config | Timeout | Nb |
|----------|---------|--------|---------|-----|
| `npm test` | `smoke.spec.js` | `playwright.config.js` | 30s | 19 |
| `npm run test:functional` | `functional.spec.js` | `playwright.functional.config.js` | 2min | 19 |

## Rapports

```bash
npx playwright show-report                       # Rapport smoke
npx playwright show-report functional-report     # Rapport fonctionnel
```

## Stratégie de sélecteurs

Utiliser les **textes** plutôt que les IDs — plus robustes aux re-renders Firebase.

## Accès à l'état du jeu

```javascript
// Depuis Playwright via page.evaluate()
window.GS   // Game State complet
window.PID  // Player ID du client
```

## Anti-patterns

- Ne pas mocker Firebase — les tests doivent toucher la DB réelle (sinon divergence prod)
- F4.2 et F5.2 : ajouter `test.slow()` si timeout (EVO-005)
- Ne pas partager d'état mutable entre tests
- Ne pas écrire de sélecteurs sur les IDs — ils changent avec les re-renders
