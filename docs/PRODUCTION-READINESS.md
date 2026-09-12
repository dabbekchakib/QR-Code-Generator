# Production Readiness — QR Manager (Phase 12)

Date : 2026-09-12

Verdict : **PRODUCTION READY** (sous les conditions de déploiement de la
section 5). Ce document récapitule ce qui est vérifié, ce qui reste à faire au
moment du déploiement, et les limitations assumées.

## 1. Qualité du code

- [x] TypeScript strict (`tsconfig.json`), vérifié par `npx tsc --noEmit`.
- [x] ESLint (config Next) : propre, `nargs`, `no-unused-vars` warn — aucune violation.
- [x] Aucun `any`/`ts-ignore`/`eslint-disable` introduit ; aucun `TODO`/`FIXME` dans `src/`.
- [x] Pattern dangereux absents : pas de `dangerouslySetInnerHTML`, `eval`, `new Function`, `document.write`.
- [x] 3 `console.error` seulement, tous légitimes (erreurs rendues, service de redirect).

## 2. Tests

- [x] **360 tests unitaires / 32 fichiers**, tous verts (`npx vitest run`).
- [x] Nouveaux tests phase 12 : mapping erreurs d'import → clés i18n ; intégrité du contenu légal (FR/EN/AR).
- [x] E2E manuel documenté dans `TESTING.md` (scans dynamiques, offline, sync).
- [ ] **E2E automatisé (Playwright)** : non configuré → **amélioration future recommandée**, sans blocage (aucune commande n'est inventée dans le README).

## 3. Sécurité & confidentialité

- [x] RLS actif : `qr_codes` (owner CRUD), `qr_scans` (owner SELECT only), `profiles` ; grants `execute` révoqués à `anon` pour les fonctions analytics ; `record_qr_scan` reste exécutable par `anon` avec anti-flood (migration 07, 1200/10 min).
- [x] CSP + security headers sur toutes les réponses (`style-src 'unsafe-inline'` documenté, Tailwind).
- [x] Service worker : ne cache jamais les appels Supabase ni rien avec header `Authorization` ; mises à jour contrôlées.
- [x] Sanitisation : SVG logos, CSV (formula injection), payloads WiFi/vCard (CR/LF, échappement), destinations `http(s)` uniquement, caps d'import (250 codes, 50 Mo, logo data-URL).
- [x] Aucun secret dans le dépôt ; `.env.example` uniquement, `.env.local` ignoré.
- [x] Pages légales `/privacy` et `/terms` conformes aux comportements réels ; pas de revendications de conformité inventées.

## 4. SEO & métadonnées

- [x] `og:url`, canonical et `metadataBase` depuis `NEXT_PUBLIC_APP_URL` (fallback `https://qr-manager.app`).
- [x] `/opengraph-image` (1200×630, runtime Node) sert l'image de partage.
- [x] `/robots.txt` : `allow` `/`, `/privacy`, `/terms` ; `disallow` des routes privées et `/qr/` ; pointe vers `/sitemap.xml`.
- [x] `/sitemap.xml` : `/`, `/privacy`, `/terms`.
- [x] Pages privées et `/qr/[shortCode]` en `noindex, nofollow`.

## 5. Déploiement (ruches à exécuter)

1. **Variables d'environnement** sur l'hébergeur :
   ```
   NEXT_PUBLIC_SUPABASE_URL=…
   NEXT_PUBLIC_SUPABASE_ANON_KEY=…
   NEXT_PUBLIC_APP_URL=https://<domaine-public>   # origine définitive, utilisée par les liens QR permanents
   ```
2. **Base de données** : appliquer toutes les migrations `supabase/migrations/`
   (01 → 07) sur le projet Supabase de production. Vérifier RLS/grants migrés
   (rôles anon/authenticated sur les fonctions RPC).
3. **Build** : `npm ci && npm run build` (webpack). Servir la build avec `npm run start` ou la plateforme Next.js choisie.
4. **Domaine/PWA** : volontaire HTTPS ; regénérer/pointer les icônes du manifest ; vérifier l'installation PWA et le premier chargement hors-ligne après un nouveau déploiement.
5. **Post-déploiement** : exécuter les vérifications manuelles de `docs/FINAL-QA.md` section 3 (OG image, robots/sitemap, 3 langues, import/export, offline, banner d'update).
6. **Rollback** : re-déployer le commit précédent ; le schéma (migrations 01–07) est additif/admin — aucun dump de données requis pour revenir.

## 6. Limitations assumées (aucune bloquante)

| Sévérité | Élément | Décision |
|---|---|---|
| Faible | `style-src 'unsafe-inline'` dans la CSP | Requis par la stack de design ; réévalué, pas d'`unsafe-eval` |
| Faible | `manifest.json` `lang` figé « fr » | Amélioration future |
| Faible | Binaire SWC Win32 non chargé en local (repli WASM) | N'affecte pas la prod (Linux CI/runner host) |
| Faible | Chunks `translations.ts` / `analytics-content.tsx` importés éagerement | Piste `React.lazy`/route segments future |
| Info | E2E automatisé non configuré | À ajouter en post-release |
| Info | Analyse « unique visitors » absente (1 hit = 1 scan) | Choix produit documenté |

## 7. Conclusion

Le projet est **prêt pour la mise en production** : validation complète verte,
aucune faille critique ou haute ouverte, énoncés de confidentialité alignés sur
les comportements réels, SEO/PWA configurés. Les étapes de la section 5 doivent
être exécutées dans l'environnement cible (variables, migrations, HTTPS,
vérifications manuelles post-déploiement).