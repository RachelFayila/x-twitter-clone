const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('backend/db.json');
const middlewares = jsonServer.defaults();
const authMiddleware = require('./middlewares');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = 'votre-secret-jwt-tres-securise-changez-cela';

// Configuration du serveur
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Middleware personnalisé pour l'authentification
server.use(authMiddleware);

// Routes personnalisées
server.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = router.db;
  
  const user = db.get('users').find({ email }).value();
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Identifiants incorrects' 
    });
  }
  
  // Vérifier le mot de passe (en production, utiliser bcrypt.compare)
  // Pour la démo, on utilise un mot de passe simple
  const isValidPassword = password === 'password123' || 
                         password === 'rachel2024' || 
                         bcrypt.compareSync(password, user.password);
  
  if (!isValidPassword) {
    return res.status(401).json({ 
      success: false, 
      message: 'Identifiants incorrects' 
    });
  }
  
  // Créer le token JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  // Créer une session
  db.get('sessions').push({
    userId: user.id,
    token,
    createdAt: new Date().toISOString()
  }).write();
  
  // Retourner la réponse sans le mot de passe
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    message: 'Connexion réussie',
    user: userWithoutPassword,
    token
  });
});

server.post('/auth/register', async (req, res) => {
  const { email, password, username, fullName, birthdate } = req.body;
  const db = router.db;
  
  // Vérifier si l'utilisateur existe déjà
  const existingUser = db.get('users').find({ 
    $or: [{ email }, { username }] 
  }).value();
  
  if (existingUser) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email ou nom d\'utilisateur déjà utilisé' 
    });
  }
  
  // Hacher le mot de passe
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // Créer le nouvel utilisateur
  const newUser = {
    id: Date.now(),
    email,
    password: hashedPassword,
    username,
    fullName,
    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
    bio: '',
    location: '',
    website: '',
    joined: new Date().toISOString().split('T')[0],
    followers: 0,
    following: 0,
    postsCount: 0,
    createdAt: new Date().toISOString(),
    isVerified: false
  };
  
  db.get('users').push(newUser).write();
  
  // Créer le token JWT
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  // Retourner la réponse sans le mot de passe
  const { password: _, ...userWithoutPassword } = newUser;
  
  res.status(201).json({
    success: true,
    message: 'Inscription réussie',
    user: userWithoutPassword,
    token
  });
});

server.post('/auth/reset-password', (req, res) => {
  const { email } = req.body;
  
  // En production, ici on enverrait un email avec un lien de réinitialisation
  // Pour la démo, on simule juste l'envoi
  
  res.json({
    success: true,
    message: 'Un lien de réinitialisation a été envoyé à votre email.'
  });
});

server.get('/profile/me', (req, res) => {
  const db = router.db;
  const userId = req.userId;
  
  const user = db.get('users').find({ id: userId }).value();
  
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'Utilisateur non trouvé' 
    });
  }
  
  // Compter les posts de l'utilisateur
  const postsCount = db.get('posts').filter({ userId }).value().length;
  
  // Compter les followers et following
  const followers = db.get('follows').filter({ followingId: userId }).value().length;
  const following = db.get('follows').filter({ followerId: userId }).value().length;
  
  // Mettre à jour les compteurs
  db.get('users').find({ id: userId })
    .assign({ 
      postsCount,
      followers,
      following 
    })
    .write();
  
  const { password, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    profile: userWithoutPassword
  });
});

server.get('/posts/timeline', (req, res) => {
  const db = router.db;
  const userId = req.userId;
  
  // Récupérer les posts des utilisateurs suivis + propres posts
  const following = db.get('follows').filter({ followerId: userId }).value();
  const followingIds = following.map(f => f.followingId);
  followingIds.push(userId); // Inclure ses propres posts
  
  const posts = db.get('posts')
    .filter(post => followingIds.includes(post.userId))
    .sortBy('createdAt')
    .reverse()
    .value();
  
  // Ajouter les informations utilisateur
  const postsWithUser = posts.map(post => {
    const user = db.get('users').find({ id: post.userId }).value();
    return {
      ...post,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar
      }
    };
  });
  
  res.json({
    success: true,
    posts: postsWithUser,
    count: postsWithUser.length
  });
});

server.post('/posts', (req, res) => {
  const db = router.db;
  const userId = req.userId;
  const { content } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Le contenu ne peut pas être vide' 
    });
  }
  
  const newPost = {
    id: Date.now(),
    userId,
    content: content.trim(),
    likes: 0,
    retweets: 0,
    comments: 0,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isLiked: false,
    isRetweeted: false
  };
  
  db.get('posts').push(newPost).write();
  
  // Incrémenter le compteur de posts de l'utilisateur
  const user = db.get('users').find({ id: userId });
  const currentCount = user.value().postsCount || 0;
  user.assign({ postsCount: currentCount + 1 }).write();
  
  res.status(201).json({
    success: true,
    message: 'Post publié avec succès',
    post: newPost
  });
});

server.post('/posts/:id/like', (req, res) => {
  const db = router.db;
  const postId = parseInt(req.params.id);
  const userId = req.userId;
  
  const post = db.get('posts').find({ id: postId });
  const currentPost = post.value();
  
  if (!currentPost) {
    return res.status(404).json({ 
      success: false, 
      message: 'Post non trouvé' 
    });
  }
  
  const isLiked = currentPost.isLiked;
  const newLikes = isLiked ? currentPost.likes - 1 : currentPost.likes + 1;
  
  post.assign({ 
    likes: newLikes,
    isLiked: !isLiked 
  }).write();
  
  // Créer une notification si ce n'est pas le propriétaire du post
  if (userId !== currentPost.userId && !isLiked) {
    const user = db.get('users').find({ id: userId }).value();
    
    db.get('notifications').push({
      id: Date.now(),
      userId: currentPost.userId,
      type: 'like',
      fromUserId: userId,
      fromUsername: user.username,
      fromAvatar: user.avatar,
      content: 'a aimé votre post.',
      postId,
      postPreview: currentPost.content.substring(0, 100) + '...',
      isRead: false,
      createdAt: new Date().toISOString()
    }).write();
  }
  
  res.json({
    success: true,
    message: isLiked ? 'Like retiré' : 'Post liké',
    likes: newLikes,
    isLiked: !isLiked
  });
});

server.post('/follow/:userId', (req, res) => {
  const db = router.db;
  const followerId = req.userId;
  const followingId = parseInt(req.params.userId);
  
  // Vérifier si l'utilisateur à suivre existe
  const userToFollow = db.get('users').find({ id: followingId }).value();
  
  if (!userToFollow) {
    return res.status(404).json({ 
      success: false, 
      message: 'Utilisateur non trouvé' 
    });
  }
  
  // Vérifier si déjà suivi
  const existingFollow = db.get('follows').find({ 
    followerId, 
    followingId 
  }).value();
  
  if (existingFollow) {
    // Dé-s'abonner
    db.get('follows').remove({ id: existingFollow.id }).write();
    
    // Mettre à jour les compteurs
    db.get('users').find({ id: followerId }).update(user => ({
      ...user,
      following: (user.following || 0) - 1
    })).write();
    
    db.get('users').find({ id: followingId }).update(user => ({
      ...user,
      followers: (user.followers || 0) - 1
    })).write();
    
    return res.json({
      success: true,
      message: 'Abonnement retiré',
      isFollowing: false
    });
  } else {
    // S'abonner
    const newFollow = {
      id: Date.now(),
      followerId,
      followingId,
      createdAt: new Date().toISOString()
    };
    
    db.get('follows').push(newFollow).write();
    
    // Mettre à jour les compteurs
    db.get('users').find({ id: followerId }).update(user => ({
      ...user,
      following: (user.following || 0) + 1
    })).write();
    
    db.get('users').find({ id: followingId }).update(user => ({
      ...user,
      followers: (user.followers || 0) + 1
    })).write();
    
    // Créer une notification
    const follower = db.get('users').find({ id: followerId }).value();
    
    db.get('notifications').push({
      id: Date.now(),
      userId: followingId,
      type: 'follow',
      fromUserId: followerId,
      fromUsername: follower.username,
      fromAvatar: follower.avatar,
      content: 'a commencé à vous suivre.',
      isRead: false,
      createdAt: new Date().toISOString()
    }).write();
    
    return res.json({
      success: true,
      message: 'Abonnement réussi',
      isFollowing: true
    });
  }
});

server.get('/notifications', (req, res) => {
  const db = router.db;
  const userId = req.userId;
  
  const notifications = db.get('notifications')
    .filter({ userId })
    .sortBy('createdAt')
    .reverse()
    .value();
  
  res.json({
    success: true,
    notifications,
    count: notifications.length,
    unreadCount: notifications.filter(n => !n.isRead).length
  });
});

server.post('/notifications/read-all', (req, res) => {
  const db = router.db;
  const userId = req.userId;
  
  db.get('notifications')
    .filter({ userId })
    .each(notification => {
      notification.isRead = true;
    })
    .write();
  
  res.json({
    success: true,
    message: 'Toutes les notifications ont été marquées comme lues'
  });
});

// Utiliser les routes par défaut de json-server pour le reste
server.use(router);

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(` Serveur JSON démarré sur http://localhost:${PORT}`);
  console.log(` Base de données: http://localhost:${PORT}/db`);
  console.log(` Routes d'authentification:`);
  console.log(`   POST http://localhost:${PORT}/auth/login`);
  console.log(`   POST http://localhost:${PORT}/auth/register`);
  console.log(`   POST http://localhost:${PORT}/auth/reset-password`);
  console.log(` Routes protégées (nécessitent un token):`);
  console.log(`   GET  http://localhost:${PORT}/profile/me`);
  console.log(`   GET  http://localhost:${PORT}/posts/timeline`);
  console.log(`   POST http://localhost:${PORT}/posts`);
  console.log(`   POST http://localhost:${PORT}/posts/:id/like`);
  console.log(`   POST http://localhost:${PORT}/follow/:userId`);
});