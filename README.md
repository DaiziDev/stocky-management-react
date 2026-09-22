# SGS — Système de Gestion de Stock

SGS est une application web de **gestion de stock pour plusieurs entreprises** (multi-tenant).
Concrètement, ça permet à une entreprise de gérer tout ce qui touche de près ou de loin à ses produits :

- **Le catalogue** : articles, catégories, prix, taux de TVA
-  **Les commandes** : commandes clients (qui font sortir du stock) et commandes fournisseurs (qui font entrer du stock)
-  **Les ventes au comptoir** : style caisse, le stock baisse immédiatement
-  **Le stock** : niveaux actuels, alertes quand ça devient bas, valeur totale de l'inventaire
-  **Les notifications** : alerte quand un article passe sous son seuil minimum
-  **Les comptes** : chaque entreprise a ses propres utilisateurs, ses propres données, cloisonnées des autres

Chaque mouvement de stock est **tracé et historisé** : on sait toujours d'où vient une variation (une commande, une vente, un ajustement manuel).

---

## Comment c'est organisé ?

Le projet est découpé en deux parties :

```
├── backend/    → l'API (le "cerveau") : Spring Boot / Java, base de données PostgreSQL
└── frontend/   → l'interface (ce que l'utilisateur voit) : React / TypeScript
```

- Le **backend** tourne sur le port **8081** et expose une API REST documentée avec Swagger.
- Le **frontend** tourne sur le port **5173** et parle au backend automatiquement via un proxy — pas besoin de se casser la tête avec le CORS en développement.

---

## Ce qu'il te faut avant de commencer

| Outil | Version | Pourquoi |
|---|---|---|
| **Java (JDK)** | 17 ou plus | faire tourner le backend |
| **Maven** | 3.8+ | compiler/lancer le backend (utilise `mvn`, pas `./mvnw` — le wrapper est incomplet) |
| **PostgreSQL** | 14+ | la base de données |
| **Node.js + npm** | version récente (LTS) | faire tourner le frontend |

---

## Lancer le projet, étape par étape

### 1 Préparer la base de données

Le backend s'attend à une base PostgreSQL nommée `stock_db`, accessible en local avec l'utilisateur `postgres`.
Choisis ton mot de passe et note-le, tu en auras besoin juste après :

```bash
# Remplace **** par TON mot de passe
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '****';"
sudo -u postgres createdb stock_db
```

> 💡 La structure de la base est créée automatiquement au premier démarrage grâce à Flyway (les migrations vivent dans `backend/src/main/resources/db/migration/`). Tu n'as **rien à créer à la main**.

### 2️ Lancer le backend

```bash
cd backend
DB_PASSWORD='****' mvn spring-boot:run
```

⚠️ Remplace `****` par le mot de passe choisi à l'étape 1.

Quand tu vois les logs Spring démarrer sans erreur, l'API est prête :

- API : http://localhost:8081
- **Swagger (documentation interactive)** : http://localhost:8081/swagger-ui/index.html

### 3️ Lancer le frontend

Dans un **autre terminal** :

```bash
cd frontend
npm install
npm run dev
```

Puis ouvre **http://localhost:5173** dans ton navigateur. 

---

## Se connecter

Au **premier démarrage**, le backend crée automatiquement un compte administrateur de démarrage (dit « bootstrap ») :

| Identifiant | Mot de passe |
|---|---|
| `admin@sgs.local` | défini dans `DataInitializer.java` (constantes `BOOTSTRAP_*`) |

C'est ce compte qui sert à onboarder les entreprises clientes depuis la console `/plateforme`.

---

## Les rôles, en bref

L'application gère 4 niveaux d'utilisateurs :

| Rôle | Ce qu'il peut faire |
|---|---|
| **SUPER_ADMIN** | l'opérateur de la plateforme : gère les entreprises clientes (backoffice) |
| **ADMIN** | le patron d'une entreprise : gère ses utilisateurs et tout le reste |
| **GESTIONNAIRE** | catalogue, commandes, fournisseurs, stock, rapports |
| **VENDEUR** | ventes au comptoir et consultation |

---

## Envoyer des e-mails (optionnel)

Le backend peut envoyer des e-mails de confirmation (commande client, commande fournisseur) via SMTP Gmail.
Pour l'activer, ajoute tes identifiants SMTP au lancement :

```bash
DB_PASSWORD='****' MAIL_USERNAME='ton.email@gmail.com' MAIL_PASSWORD='mot-d-application' mvn spring-boot:run
```

Pas de panique si tu ne le configure pas : **l'application fonctionne très bien sans**, les e-mails sont simplement ignorés et leur échec ne bloque jamais une commande.

---

## Vérifier que tout marche

```bash
# Côté backend (dans backend/)
mvn test

# Côté frontend (dans frontend/)
npm run typecheck    # vérification des types
npm run lint         # analyse statique
npm test             # tests unitaires
```

---

## Aller plus loin

La documentation détaillée de chaque partie vit dans son dossier :

- [`backend/README.md`](backend/README.md) — configuration complète, variables d'environnement, sécurité, organisation du code
- [`frontend/README.md`](frontend/README.md) — architecture frontend, conventions, tests, audits
- [`frontend/PRD.md`](frontend/PRD.md) — le cahier des charges fonctionnel (règles métier, flux)
- [`frontend/ROADMAP.md`](frontend/ROADMAP.md) — l'état d'avancement et les phases de développement
- [`frontend/architecture.md`](frontend/architecture.md) — l'architecture détaillée du frontend
