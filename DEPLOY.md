# Déployer sur GitHub + Vercel (gratuit)

Ce projet a maintenant **deux façons de tourner**, sans rien changer au code
frontend :
- **En local** (déjà testé, voir `README.md`) : `npm run dev`, Express + fichier
  SQLite sur ton disque.
- **Sur Vercel** (ce guide) : chaque fichier dans `api/` devient une fonction
  serverless automatiquement ; la base devient **Turso** (SQLite hébergé,
  gratuit) au lieu du fichier local, parce que Vercel n'a pas de disque
  persistant entre deux requêtes.

Les 12 fonctions dans `api/` ont été testées une par une dans ce chat contre
une vraie base libSQL (network, search, alerts, reports, login chauffeur/
direction, alerte, garde de rôle, dashboard direction, résolution, horaires) —
voir la sortie de test plus bas dans la conversation si tu veux la relire.

## Étape 1 — Pousser le code sur GitHub

```bash
cd transtu-local
git init
git add .
git commit -m "TRANSTU Tracker"
```
Crée un dépôt vide sur github.com (bouton "New repository", ne coche RIEN —
pas de README, pas de .gitignore, il y en a déjà un), puis :
```bash
git remote add origin https://github.com/TON_PSEUDO/transtu-tracker.git
git branch -M main
git push -u origin main
```

## Étape 2 — Créer la base Turso (gratuit, aucune carte bancaire)

1. Va sur **https://turso.tech**, crée un compte (gratuit, GitHub login marche).
2. Installe leur CLI (ou utilise le dashboard web, les deux marchent) :
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login
   turso db create transtu-tracker
   turso db show transtu-tracker --url
   turso db tokens create transtu-tracker
   ```
   Note bien l'**URL** (commence par `libsql://…`) et le **token** affichés.
3. Charge le schéma et les données :
   ```bash
   turso db shell transtu-tracker < turso/schema.sql
   turso db shell transtu-tracker < turso/seed.sql
   ```
4. Crée les comptes de démo (chauffeur + direction) — choisis d'abord un
   `SESSION_SECRET` fort (une longue chaîne aléatoire), tu le réutiliseras à
   l'étape 3 :
   ```bash
   TURSO_DATABASE_URL="libsql://xxx" TURSO_AUTH_TOKEN="xxx" SESSION_SECRET="ton-secret-fort" \
     node turso/create-staff.js
   ```

## Étape 3 — Déployer sur Vercel

1. Va sur **https://vercel.com**, connecte-toi avec GitHub (gratuit).
2. "Add New… → Project", choisis ton dépôt `transtu-tracker`.
3. Vercel détecte Vite tout seul. Avant de cliquer "Deploy", ouvre
   **Environment Variables** et ajoute :
   | Nom | Valeur |
   |---|---|
   | `TURSO_DATABASE_URL` | l'URL `libsql://…` de l'étape 2 |
   | `TURSO_AUTH_TOKEN` | le token de l'étape 2 |
   | `SESSION_SECRET` | **exactement** le même secret utilisé pour `create-staff.js` |
4. Clique **Deploy**. Après ~1 minute tu as une URL du genre
   `https://transtu-tracker.vercel.app` — accessible par n'importe qui,
   gratuitement, pas de carte bancaire, pas de serveur à gérer.

## Vérifier que ça marche une fois déployé

- Ouvre l'URL Vercel → tu dois voir la page d'accueil et le sélecteur de langue.
- `/horaires` doit afficher les 223 lignes.
- `/staff` → connecte-toi avec les identifiants créés à l'étape 2.4.

Si une page reste blanche ou qu'un onglet réseau (F12 → Network) montre des
erreurs 500 sur `/api/...`, c'est presque toujours une variable d'environnement
manquante ou mal copiée — vérifie les 3 valeurs dans Vercel → Project →
Settings → Environment Variables, puis redéploie (Vercel → Deployments → "…"
→ Redeploy).

## Limites connues de cette version hébergée

- Les photos de signalement sont stockées en base64 directement dans Turso
  (colonne `photo_data_url`), pas sur un vrai stockage fichier — suffisant à
  cette échelle, mais à revoir si le volume grossit beaucoup (passer à un
  service comme Cloudflare R2 ou Vercel Blob).
- Le plan gratuit Turso a une limite de lignes lues/écrites par mois
  (largement suffisante pour un usage étudiant/démo) — voir turso.tech/pricing
  si tu veux vérifier les seuils actuels.
- Le plan gratuit Vercel a une limite d'exécutions de fonctions serverless par
  mois — également largement suffisante pour ce genre de projet.
