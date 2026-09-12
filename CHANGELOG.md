# Changelog

Toutes les entrées de ce fichier reflètent des éléments réellement livrés et
vérifiés dans le dépôt.

## [Final Release] — 2026-09-12

### Ajouts (Phase 12)
- Page d'accueil rendue côté serveur, entièrement localisée (FR/EN/AR) selon le cookie de langue — zéro JavaScript client sur la landing.
- Pages légales `/privacy` et `/terms` (FR/EN/AR, RTL), écrites pour le comportement réel de l'application.
- `robots.txt` autorise désormais les pages légales ; `sitemap.xml` (/, /privacy, /terms).
- Image Open Graph de partage (`/opengraph-image`) générée au build via `next/og` (runtime Node, aucune dépendance).
- `og:url`, canonical et `metadataBase` résolus depuis `NEXT_PUBLIC_APP_URL` (plus de domaine en dur).
- État d'erreur visible et annoncé aux lecteurs d'écran (`role="alert"`) sur l'aperçu QR.
- Localisation complète des 7 formulaires QR, du bandeau d'en-tête, des boutons de fermeture dialog/sheet, des libellés d'import/export (messages d'erreur et compteurs), des labels de copie et des aria-labels.
- Corrections RTL (propriétés logiques `ms-`/`me-`/`start-`/`end-`) sur les surfaces signalées.

### Corrections
- Suppression de `getCopyLabel` (labels de copie composés et localisés).
- Mapping des erreurs internes d'import vers des toasts traduits (fichier vide / trop volumineux / JSON invalide / structure invalide) — les messages anglais bruts ne fuient plus vers l'UI.
- Bouton de fermeture et libellés `Close`/`Navigation` des composants partagés localisés.

### Validation
- Suite de tests : **360 tests, 32 fichiers, tous verts** (nouveaux tests : mapping erreurs d'import, intégrité du contenu légal).
- `npm run lint` propre ; `npx tsc --noEmit` propre ; build de production OK (19 routes ; `/robots.txt`, `/sitemap.xml`, `/opengraph-image` statiques).
- `npm audit` : **0 vulnérabilité**.
- Source : phase finale de QR Manager (voir `README.md` pour l'historique complet des phases 1 à 11).

### Remarques
- Avertissement local préexistant indépendant : binaire `@next/swc-win32-x64-msvc` non chargé sur Windows (repli WASM automatique) — n'affecte pas le build/les tests.
- E2E automatisé non configuré : documenté comme amélioration future dans `docs/PRODUCTION-READINESS.md`.