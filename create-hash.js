const bcrypt = require('bcryptjs');

async function createHash() {
  const password = 'password123'; // Mot de passe pour l'utilisateur test
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash généré:', hash);
  
  // Test de vérification
  const isValid = await bcrypt.compare('password123', hash);
  console.log('Vérification:', isValid ? 'OK' : 'Échec');
}

createHash();