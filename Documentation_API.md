
# Documentation API - JSON Server 

## Objectif

Cette API simulée utilise `json-server` pour manipuler des **utilisateurs** (`/users`) et des **tweets** (`/tweets`), avec prise en charge des relations entre utilisateurs et tweets (via `userId` et `replyTo`).

---

## Prérequis

Avoir Node.js installé (version ≥ 14 recommandée, car `json-server` nécessite Node.js 14 ou supérieur)


```bash
npm install
```
Mettre en place le fichier `db.json` dans le dossier `database/` pour initialiser les données.
```bash
npm run init-data
```
---

## Démarrer le serveur

```bash
npm run server
```

---

## URL de base

```
http://localhost:3000
```

---

## Ressources disponibles

### `/users`

Liste des utilisateurs enregistrés.

#### Exemple de réponse

```json
{
  "id": 2,
  "name": "John DOE",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+33 123 456 789",
  "profilePicture": "https://example.com/johndoe.jpg",
  "bio": "Développeur passionné par le web et les API.",
  "location": "Paris, France",
  "website": "https://johndoe.com",
  "createdAt": "2023-10-02T09:00:00Z",
  "followers": 200,
  "following": 180
}
```

---

### `/tweets`

Liste des tweets postés par les utilisateurs.

#### Exemple de tweet avec média et réponse

```json
{
  "id": 3,
  "userId": 2,
  "content": "@johndoe Welcome to Twitter!",
  "media": [],
  "likes": 5,
  "retweets": 1,
  "replies": [],
  "createdAt": "2023-10-01T13:00:00Z",
  "replyTo": 1
}
```

---

## Détail des routes et paramètres

### GET `/users`

- Récupère tous les utilisateurs.

### GET `/users/:id`

- Récupère un utilisateur par son ID.

---

### POST `/users`

- Crée un nouvel utilisateur.

| Champ            | Type     | Obligatoire | Description                      |
|------------------|----------|-------------|----------------------------------|
| id               | number   | ✅          | ID unique                        |
| name             | string   | ✅          | Nom complet                      |
| username         | string   | ✅          | Nom d’utilisateur                |
| email            | string   | ✅          | Adresse mail                     |
| password         | string   | ✅          | Mot de passe                     |
| phone            | string   | ❌          | Téléphone                        |
| profilePicture   | string   | ❌          | URL de la photo de profil        |
| bio              | string   | ❌          | Bio                              |
| location         | string   | ❌          | Localisation                     |
| website          | string   | ❌          | Site web                         |
| createdAt        | string   | ✅          | Date ISO                         |
| followers        | number   | ❌          | Nombre de followers              |
| following        | number   | ❌          | Nombre de comptes suivis         |

---

### GET `/tweets`

- Récupère tous les tweets.

#### Paramètres (query) possibles :

| Paramètre  | Type     | Description                          |
|------------|----------|--------------------------------------|
| `userId`   | number   | Filtrer les tweets par utilisateur   |
| `replyTo`  | number   | Filtrer les tweets en réponse à un autre tweet |
| `_sort`    | string   | Tri (ex : `likes`, `createdAt`)     |
| `_order`   | string   | Ordre de tri : `asc` ou `desc`      |

---

### POST `/tweets`

- Crée un nouveau tweet.

| Champ       | Type     | Obligatoire | Description                            |
|-------------|----------|-------------|----------------------------------------|
| id          | number   | ✅          | ID unique du tweet                     |
| userId      | number   | ✅          | Référence à l’auteur (`/users/:id`)    |
| content     | string   | ✅          | Texte du tweet                         |
| media       | array    | ❌          | Liste d’objets `{ type, url }`         |
| likes       | number   | ✅          | Nombre de likes                        |
| retweets    | number   | ✅          | Nombre de retweets                     |
| replies     | array    | ✅          | Tableau des ID des tweets en réponse   |
| replyTo     | number   | ❌          | ID du tweet auquel on répond           |
| createdAt   | string   | ✅          | Date ISO                               |

---

### PATCH / PUT `/tweets/:id`

- Met à jour un tweet existant.

---

### DELETE `/tweets/:id`

- Supprime un tweet.



---

