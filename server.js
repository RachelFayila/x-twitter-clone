const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
const fs = require('fs')
const path = require('path')

const PORT = 3000

// Configuration CORS complète
server.use(middlewares)
server.use(jsonServer.bodyParser)

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  
  console.log(`${req.method} ${req.url}`)
  next()
})

// === ROUTES D'AUTHENTIFICATION SIMULÉES ===

// Route de connexion (simulée)
server.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body
    
    console.log('Tentative de connexion:', email)
    
    // Lire les utilisateurs depuis db.json
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'))
    const users = db.users || []
    
    // Chercher l'utilisateur
    const user = users.find(u => u.email === email)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      })
    }
    
    // Vérifier le mot de passe (simplifié - en réel utiliser bcrypt)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      })
    }
    
    // Créer un token simulé
    const token = `fake-jwt-token-${Date.now()}-${user.id}`
    
    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword
    })
    
  } catch (error) {
    console.error('Erreur login:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    })
  }
})

// Route d'inscription (simulée)
server.post('/api/register', (req, res) => {
  try {
    const { fullname, email, username, password, birthdate } = req.body
    
    console.log('Inscription:', email, username)
    
    // Validation simple
    if (!fullname || !email || !username || !password || !birthdate) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      })
    }
    
    // Lire la base de données
    const dbPath = path.join(__dirname, 'db.json')
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    const users = db.users || []
    
    // Vérifier si l'email existe
    if (users.some(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      })
    }
    
    // Vérifier si le username existe
    if (users.some(u => u.username === username)) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà pris'
      })
    }
    
    // Créer le nouvel utilisateur
    const newUser = {
      id: (users.length + 1).toString(),
      fullname,
      email,
      username,
      password, // En production : hasher avec bcrypt
      birthdate,
      createdAt: new Date().toISOString(),
      bio: '',
      location: '',
      website: '',
      followers: 0,
      following: 0,
      posts: 0,
      avatar: `./images/image${Math.floor(Math.random() * 5) + 1}.jpg`
    }
    
    // Ajouter à la base de données
    users.push(newUser)
    db.users = users
    
    // Sauvegarder dans db.json
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    
    // Créer un token
    const token = `fake-jwt-token-${Date.now()}-${newUser.id}`
    
    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = newUser
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: userWithoutPassword
    })
    
  } catch (error) {
    console.error('Erreur inscription:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    })
  }
})

// Route de vérification de token
server.post('/api/verify-token', (req, res) => {
  const { token } = req.body
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token manquant'
    })
  }
  
  // Simuler une vérification (en réel vérifier JWT)
  if (token.startsWith('fake-jwt-token-')) {
    // Extraire l'ID utilisateur du token
    const userId = token.split('-').pop()
    
    // Chercher l'utilisateur
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'))
    const user = (db.users || []).find(u => u.id === userId)
    
    if (user) {
      const { password, ...userWithoutPassword } = user
      return res.json({
        success: true,
        user: userWithoutPassword
      })
    }
  }
  
  res.status(401).json({
    success: false,
    message: 'Token invalide'
  })
})

// Utiliser les routes de JSON Server pour les autres endpoints
server.use('/api', router)

// Route pour vérifier que le serveur fonctionne
server.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur JSON en fonctionnement' })
})

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(` Serveur démarré sur http://localhost:${PORT}`)
  console.log(` Health check: http://localhost:${PORT}/health`)
  console.log(` Login: POST http://localhost:${PORT}/api/login`)
  console.log(` Register: POST http://localhost:${PORT}/api/register`)
  console.log(` Users: GET http://localhost:${PORT}/api/users`)
  console.log(` Utilisez ces identifiants pour tester:`)
  console.log(`   Email: rachel@example.com`)
  console.log(`   Mot de passe: password123`)
})