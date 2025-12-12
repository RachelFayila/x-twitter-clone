const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'votre-secret-jwt-tres-securise-changez-cela';
const PORT = 3000;

// Middleware pour CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Utiliser les middlewares par défaut
server.use(middlewares);
server.use(jsonServer.bodyParser);

// ==================== ROUTES PUBLIQUES ====================

// Route pour la connexion
server.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email et mot de passe requis'
    });
  }

  try {
    const db = router.db;
    const users = db.get('users').value();
    
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
      { 
        userId: user.id, 
        email: user.email, 
        username: user.username 
      },
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

// Route pour l'inscription
server.post('/api/register', async (req, res) => {
  const { fullname, email, username, password, birthdate } = req.body;

  // Validation simple
  if (!fullname || !email || !username || !password || !birthdate) {
    return res.status(400).json({
      success: false,
      message: 'Tous les champs sont requis'
    });
  }

  // Validation d'email basique
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Format d\'email invalide'
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

    // Vérifier l'âge (minimum 13 ans)
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez avoir au moins 13 ans pour créer un compte'
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

    // Ajouter l'utilisateur
    db.get('users').push(newUser).write();

    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        username: newUser.username 
      },
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
server.post('/api/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Récupérer les infos utilisateur complètes
    const db = router.db;
    const user = db.get('users').find({ id: decoded.userId }).value();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const { password, ...userWithoutPassword } = user;
    
    return res.json({
      success: true,
      user: userWithoutPassword
    });
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
});

// Route pour mot de passe oublié
server.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email requis'
    });
  }
  
  const db = router.db;
  const users = db.get('users').value();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Aucun compte trouvé avec cet email'
    });
  }
  
  // En production, vous enverriez un email ici
  console.log(`[DEV] Lien de réinitialisation pour ${email}`);
  console.log(`[DEV] Token simulé: reset_${Date.now()}`);
  
  return res.json({
    success: true,
    message: 'Un lien de réinitialisation a été envoyé à votre email'
  });
});

// Middleware de protection des routes
server.use((req, res, next) => {
  // Routes qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/api/login',
    '/api/register',
    '/api/forgot-password',
    '/api/verify-token'
  ];
  
  const isPublicRoute = publicRoutes.some(route => req.url === route);
  
  if (isPublicRoute) {
    return next();
  }
  
  // Pour les autres routes API, vérifier le token
  if (req.url.startsWith('/api/')) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
  } else {
    // Pour les routes non-API, laisser passer
    next();
  }
});

// Utiliser le routeur JSON Server pour les autres routes
server.use('/api', router);

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Login:    POST http://localhost:${PORT}/api/login`);
  console.log(`Register: POST http://localhost:${PORT}/api/register`);
  console.log(`Verify:   POST http://localhost:${PORT}/api/verify-token`);
});