// server.js - API Serveur d'Authentification

const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DB_FILE = 'db.json';

// CONFIGURATION MIDDLEWARE
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Middleware CORS étendu
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token');
  res.header('Access-Control-Expose-Headers', 'X-Auth-Token');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // Log des requêtes
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Middleware de sécurité basique
server.use((req, res, next) => {
  // Protection contre les attaques par injection
  if (req.body && typeof req.body === 'object') {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
});

// FONCTIONS UTILITAIRES

 // Charge la base de données
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si le fichier n'existe pas, crée une structure par défaut
    if (error.code === 'ENOENT') {
      const defaultDB = {
        users: [],
        posts: [],
        notifications: []
      };
      await saveDatabase(defaultDB);
      return defaultDB;
    }
    throw error;
  }
}

 // Sauvegarde la base de données
async function saveDatabase(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

 // Génère un token JWT simulé sécurisé
function generateToken(userId) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `jwt_${userId}_${timestamp}_${randomBytes}`;
}

 // Extrait l'ID utilisateur depuis un token
function extractUserIdFromToken(token) {
  if (!token || !token.startsWith('jwt_')) return null;
  const parts = token.split('_');
  return parts[1] || null;
}

 // Valide un email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

 // Valide un mot de passe
function isValidPassword(password) {
  return password && password.length >= 6;
}

 //Hash un mot de passe 
 
function hashPassword(password) {
 
  return password; 
}

 // Vérifie un mot de passe
function verifyPassword(inputPassword, storedPassword) {
  // Si on utilisait du hash: bcrypt.compareSync(inputPassword, storedPassword)
  return inputPassword === storedPassword;
}

 // Nettoie l'objet utilisateur (enlève le mot de passe)

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ROUTES D'AUTHENTIFICATION

 // Route de connexion 
server.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation des entrées
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe sont requis'
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }
    
    // Charger les utilisateurs
    const db = await loadDatabase();
    const users = db.users || [];
    
    // Chercher l'utilisateur (email insensible à la casse)
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      await new Promise(resolve => setTimeout(resolve, 500)); // Délai pour éviter timing attacks
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
    
    // Vérifier le mot de passe
    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
    
    // Mettre à jour la dernière connexion
    user.lastLogin = new Date().toISOString();
    await saveDatabase(db);
    
    // Générer un token
    const token = generateToken(user.id);
    
    // Retourner la réponse
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: sanitizeUser(user)
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur interne'
    });
  }
});

 //  Route d'inscription 
 
server.post('/api/register', async (req, res) => {
  try {
    const { fullname, email, username, password } = req.body;
    
    // Validation complète
    const errors = [];
    
    if (!fullname || fullname.length < 2) {
      errors.push('Le nom complet doit contenir au moins 2 caractères');
    }
    
    if (!email || !isValidEmail(email)) {
      errors.push('Email invalide');
    }
    
    if (!username || username.length < 3) {
      errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }
    
    if (!password || !isValidPassword(password)) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }
    
    // Charger la base de données
    const db = await loadDatabase();
    const users = db.users || [];
    
    // Vérifier les doublons (insensible à la casse)
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    const usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }
    
    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà pris'
      });
    }
    
    // Créer le nouvel utilisateur
    const newUser = {
      id: Date.now().toString(), // ID unique basé sur le timestamp
      fullname: fullname.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim(),
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      bio: '',
      location: '',
      website: '',
      avatar: `./images/avatar${Math.floor(Math.random() * 5) + 1}.jpg`,
      followers: 0,
      following: 0,
      posts: 0,
      isActive: true,
      role: 'user'
    };
    
    // Ajouter à la base de données
    users.push(newUser);
    db.users = users;
    await saveDatabase(db);
    
    // Générer un token
    const token = generateToken(newUser.id);
    
    // Réponse de succès
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: sanitizeUser(newUser)
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur interne'
    });
  }
});

 // Route de vérification de token améliorée
server.post('/api/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token manquant'
      });
    }
    
    // Extraire l'ID utilisateur
    const userId = extractUserIdFromToken(token);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    
    // Charger la base de données
    const db = await loadDatabase();
    const users = db.users || [];
    
    // Chercher l'utilisateur
    const user = users.find(u => u.id === userId && u.isActive !== false);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou compte désactivé'
      });
    }
    
    // Vérifier si le token est récent (optionnel)
    const tokenParts = token.split('_');
    const tokenTimestamp = parseInt(tokenParts[2]);
    const tokenAge = Date.now() - tokenTimestamp;
    
    // Token expiré après 7 jours (optionnel)
    if (tokenAge > 7 * 24 * 60 * 60 * 1000) {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        requiresRefresh: true
      });
    }
    
    res.json({
      success: true,
      user: sanitizeUser(user),
      tokenValid: true,
      tokenAge: Math.floor(tokenAge / (1000 * 60 * 60)) // Âge en heures
    });
    
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur interne'
    });
  }
});

 // Route de profil utilisateur
server.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = await loadDatabase();
    const users = db.users || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      user: sanitizeUser(user)
    });
    
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur interne'
    });
  }
});

 // Route de recherche d'utilisateurs
server.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Requête de recherche trop courte'
      });
    }
    
    const db = await loadDatabase();
    const users = db.users || [];
    
    const searchTerm = q.toLowerCase();
    const results = users
      .filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.fullname.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
      .map(user => sanitizeUser(user))
      .slice(0, 10); // Limiter à 10 résultats
    
    res.json({
      success: true,
      count: results.length,
      users: results
    });
    
  } catch (error) {
    console.error('Erreur recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur interne'
    });
  }
});

// ROUTES DE SANTÉ ET STATUT

 //  Route de santé
server.get('/health', async (req, res) => {
  try {
    const db = await loadDatabase();
    const userCount = db.users ? db.users.length : 0;
    const postCount = db.posts ? db.posts.length : 0;
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        file: DB_FILE,
        users: userCount,
        posts: postCount,
        healthy: true
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

 // Route d'accueil
server.get('/', (req, res) => {
  res.json({
    name: 'API Authentification Twitter-like',
    version: '1.0.0',
    description: 'API pour l\'authentification et la gestion des utilisateurs',
    endpoints: {
      auth: {
        login: 'POST /api/login',
        register: 'POST /api/register',
        verify: 'POST /api/verify-token'
      },
      users: {
        profile: 'GET /api/profile/:id',
        search: 'GET /api/users/search?q=term',
        all: 'GET /api/users'
      },
      health: 'GET /health'
    },
    documentation: 'Consultez le README pour plus d\'informations'
  });
});

// UTILISER LES ROUTES JSON-SERVER
server.use('/api', router);

// GESTION DES ERREURS 404
server.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.url,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/login',
      'POST /api/register',
      'POST /api/verify-token',
      'GET /api/profile/:id',
      'GET /api/users/search'
    ]
  });
});

// DÉMARRAGE DU SERVEUR
server.listen(PORT, async () => {
  console.log(`

    Serveur API Authentification     
`);
  
  console.log(` Serveur démarré sur: http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Documentation: http://localhost:${PORT}/`);
  
  console.log('\n  ENDPOINTS D\'AUTHENTIFICATION:');
  console.log('   POST /api/login          - Connexion utilisateur');
  console.log('   POST /api/register       - Inscription utilisateur');
  console.log('   POST /api/verify-token   - Vérification token');
  
  console.log('\n  ENDPOINTS UTILISATEURS:');
  console.log('   GET  /api/profile/:id    - Profil utilisateur');
  console.log('   GET  /api/users/search   - Recherche utilisateurs');
  console.log('   GET  /api/users          - Liste des utilisateurs');
  
  console.log('\n  ENDPOINTS JSON-SERVER:');
  console.log('   GET    /api/:resource    - Lister');
  console.log('   GET    /api/:resource/:id - Détails');
  console.log('   POST   /api/:resource    - Créer');
  console.log('   PUT    /api/:resource/:id - Mettre à jour');
  console.log('   DELETE /api/:resource/:id - Supprimer');
  
  console.log('\n DONNÉES DE TEST:');
  console.log('   Email: test@test.com');
  console.log('   Mot de passe: test123');
  
  console.log('\n MODE: Développement local');
  console.log(`Base de données: ${DB_FILE}`);
  console.log('Démarrage réussi à:', new Date().toLocaleTimeString());
  console.log('\n────────────────────────────────────────────');
});