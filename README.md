# TRANSTU Tracker — version locale (sans Higgsfield)

100% gratuit. Deux façons de le faire tourner :
- **En local sur ta machine** : ce README, juste en dessous.
- **En ligne, avec une vraie URL publique** (GitHub + Vercel + Turso, gratuit,
  aucune carte bancaire) : voir **`DEPLOY.md`**.

Aucun compte Cloudflare, aucun compte Higgsfield requis dans les deux cas.

**Stack** : Vite + React + TypeScript + Tailwind (front) · Express + SQLite via
`better-sqlite3` (back) — remplace TanStack Start + D1 + R2 + Higgsfield "quanta".
Testé de bout en bout dans ce chat avant de te le donner (voir "Ce qui a été
vérifié" plus bas).

## Installer et lancer

Il te faut juste **Node.js** (v18 ou plus — vérifie avec `node -v`). Rien d'autre.

```bash
npm install
npm run dev
```

Ça lance en même temps :
- l'API sur `http://localhost:8787` (crée automatiquement `server/transtu.db`
  au premier lancement — SQLite, un simple fichier, rien à installer/configurer)
- le site sur `http://localhost:5173` ← **ouvre celui-là dans ton navigateur**

Au premier lancement, le terminal affiche les identifiants de démo :
```
[db] Demo driver login    -> D-0001 / 1234
[db] Demo direction login -> direction@transtu.tn / transtu2026
```
Utilise-les sur `/staff` pour tester le portail chauffeur/direction.

Pour arrêter : `Ctrl+C` dans le terminal.

## Ce qui manque encore (pas du code — des assets/données)

1. **Le logo TRANSTU** (`public/assets/logo-transtu.jpg`) n'a jamais été fourni dans
   la conversation. J'ai mis un `onError` partout pour que l'appli ne casse pas
   sans lui (l'image disparaît juste), mais si tu as le fichier, dépose-le dans
   `public/assets/logo-transtu.jpg`.
2. **Les 223 lignes de bus/métro/train** dans `server/seed.sql` viennent de
   l'annexe de ton MD, transcrites automatiquement — jamais vérifiées contre
   transtu.tn / sncft.com.tn (l'étape 1 du brief original, jamais faite non plus
   dans la version Higgsfield).
3. **Horaires réels** (`first_departure`/`last_departure`/`frequency_min`) : vides
   exprès. À remplir via le dashboard Direction (`/staff` → Direction → à
   construire un formulaire d'édition si tu veux, l'API `updateLineSchedule`
   existe déjà côté serveur).
4. **Le flux GPS Trackini** (`src/components/LiveMap.tsx`) interroge une table
   Supabase `vehicle_positions` — c'est une hypothèse de schéma raisonnable, pas
   confirmée avec le vrai projet Supabase. Adapte les noms de colonnes si besoin.

## Ce qui a été vérifié (pas juste écrit — testé dans ce chat)

- `npm install` : ✅ passe (286 paquets, aucune erreur)
- `tsc --noEmit` : ✅ zéro erreur de type sur tout le projet
- `vite build` : ✅ build de prod réussi (~254 KB JS gzippé ~80 KB)
- Démarrage serveur + création DB + seed : ✅
- `/api/network` : ✅ renvoie bien 20 terminaux + 223 lignes
- `/api/search?q=27` : ✅ renvoie les bonnes lignes (27, 27A, 27B, 27J, 27T, 527…)
- `/api/search?q=carthage` : ✅ recherche par destination ET par nom de terminus
- Login chauffeur (bon PIN / mauvais PIN) : ✅ les deux cas marchent
- Login direction : ✅
- Envoi de signalement + suivi de statut par référence : ✅
- Alerte chauffeur → apparaît dans le flux public `/api/alerts` : ✅
- Garde de rôle : un token chauffeur utilisé sur une route direction est bien
  rejeté (`"Wrong role for this action"`) : ✅
- **Un vrai bug a été trouvé et corrigé pendant ces tests** : `better-sqlite3`
  rejette les placeholders numérotés répétés (`?1` utilisé plusieurs fois dans
  la même requête) avec `"Too many parameter values were provided"`. Corrigé en
  passant à des paramètres nommés (`@like`, `@query`, `@prefix`) dans
  `server/index.js` (route `/api/search`). Sans ce test, ce bug ne serait
  apparu qu'au premier essai de recherche par ton copain.

Ce qui n'a **pas** été testé : le rendu visuel réel dans un navigateur (je ne
peux pas prendre de capture d'écran depuis ce sandbox), le comportement RTL
arabe à l'œil, la carte Leaflet avec un vrai signal GPS Trackini, le
responsive mobile réel. À vérifier toi-même une fois lancé.

## Structure

```
src/
  main.tsx          point d'entrée
  App.tsx           routes (react-router-dom)
  index.css         Tailwind + classes de marque TRANSTU (tt-card, tt-press, …)
  lib/i18n.ts        dictionnaire FR/AR/EN + gestion RTL
  lib/api.ts          appels fetch vers l'API locale
  components/
    AppShell.tsx      header, nav basse, sélecteur de langue, favoris
    LiveMap.tsx        carte Leaflet + polling GPS
  pages/
    Home.tsx, Timetables.tsx, LiveMapPage.tsx, Report.tsx,
    Favorites.tsx, Settings.tsx, Staff.tsx
server/
  index.js           API Express (tous les endpoints)
  db.js               ouverture SQLite + seed au premier lancement
  auth.js              hash PIN/mot de passe + sessions signées HMAC
  schema.sql / seed.sql
```
