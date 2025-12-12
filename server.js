const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'votre-secret-jwt-tres-securise-changez-cela';
const PORT = 3000;

// Utiliser les middlewares par défaut et body-parser
server.use(middlewares);
server.use(bodyParser.json());

// Middleware pour CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Route personnalisée pour la connexion
server.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email et mot de passe requis'
    });
  }

  try {
    // Lire les utilisateurs depuis la base de données
    const db = router.db;
    const users = db.get('users').value();
    
    // Chercher l'utilisateur par email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retourner la réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    
    return res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route personnalisée pour l'inscription
server.post('/register', async (req, res) => {
  const { fullname, email, username, password, birthdate } = req.body;

  if (!fullname || !email || !username || !password || !birthdate) {
    return res.status(400).json({
      success: false,
      message: 'Tous les champs sont requis'
    });
  }

  try {
    const db = router.db;
    const users = db.get('users').value();

    // Vérifier si l'email existe déjà
    const emailExists = users.some(u => u.email === email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const usernameExists = users.some(u => u.username === username);
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà pris'
      });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = {
      id: Date.now().toString(),
      fullname,
      email,
      username,
      password: hashedPassword,
      birthdate,
      createdAt: new Date().toISOString(),
      bio: '',
      location: '',
      website: '',
      followers: 0,
      following: 0,
      posts: 0,
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    };

    // Ajouter l'utilisateur à la base de données
    db.get('users').push(newUser).write();

    // Générer un token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retourner la réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour vérifier le token
server.post('/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

// Middleware de protection des routes
server.use((req, res, next) => {
  const protectedRoutes = ['/posts', '/notifications', '/profile', '/follows'];
  const isProtectedRoute = protectedRoutes.some(route => req.url.startsWith(route));

  if (isProtectedRoute) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    try {
      jwt.verify(token, JWT_SECRET);
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
  } else {
    next();
  }
});

// Utiliser le routeur JSON Server
server.use(router);

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`JSON Server démarré sur le port ${PORT}`);
  console.log(`Login: POST http://localhost:${PORT}/login`);
  console.log(`Register: POST http://localhost:${PORT}/register`);
});