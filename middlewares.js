const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = 'votre-secret-jwt-tres-securise-changez-cela';

module.exports = (req, res, next) => {
  // Middleware pour l'authentification
  const authRoutes = ['/posts', '/notifications', '/profile', '/follows'];
  const requiresAuth = authRoutes.some(route => req.url.startsWith(route));
  
  // Exceptions pour les routes publiques
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password',
    '/trends',
    '/users?_public=true'
  ];
  
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  
  if (requiresAuth && !isPublicRoute) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token d\'authentification manquant' 
      });
    }
    
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
    next();
  }
};