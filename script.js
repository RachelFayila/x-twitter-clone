// Gestion des formulaires d'authentification
document.addEventListener('DOMContentLoaded', function() {
  // ========== CONNEXION ==========
  const loginForm = document.querySelector('form.auth-form')
  if (loginForm && window.location.pathname.includes('login.html')) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault()
      
      const email = document.getElementById('email').value
      const password = document.getElementById('password').value
      
      if (!email || !password) {
        alert('Veuillez remplir tous les champs')
        return
      }
      
      const submitBtn = this.querySelector('button[type="submit"]')
      const originalText = submitBtn.textContent
      submitBtn.disabled = true
      submitBtn.textContent = 'Connexion en cours...'
      
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Stocker le token et les infos utilisateur
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          
          // Redirection vers la page d'accueil
          window.location.href = 'index.html'
        } else {
          alert('Erreur: ' + data.message)
          submitBtn.disabled = false
          submitBtn.textContent = originalText
        }
      } catch (error) {
        console.error('Erreur:', error)
        alert('Erreur de connexion au serveur. Vérifiez que le serveur est démarré.')
        submitBtn.disabled = false
        submitBtn.textContent = originalText
      }
    })
  }
  
  // ========== INSCRIPTION ==========
  if (window.location.pathname.includes('register.html')) {
    const registerForm = document.querySelector('form.auth-form')
    
    if (registerForm) {
      registerForm.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        const fullname = document.getElementById('fullname').value
        const email = document.getElementById('email').value
        const username = document.getElementById('username').value
        const password = document.getElementById('password').value
        const birthdate = document.getElementById('birthdate').value
        
        // Validation
        if (!fullname || !email || !username || !password || !birthdate) {
          alert('Veuillez remplir tous les champs')
          return
        }
        
        if (password.length < 6) {
          alert('Le mot de passe doit contenir au moins 6 caractères')
          return
        }
        
        const submitBtn = this.querySelector('button[type="submit"]')
        const originalText = submitBtn.textContent
        submitBtn.disabled = true
        submitBtn.textContent = 'Inscription en cours...'
        
        try {
          const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fullname,
              email,
              username,
              password,
              birthdate
            })
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Stocker le token et les infos utilisateur
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            
            // Redirection vers la page d'accueil
            window.location.href = 'index.html'
          } else {
            alert('Erreur: ' + data.message)
            submitBtn.disabled = false
            submitBtn.textContent = originalText
          }
        } catch (error) {
          console.error('Erreur:', error)
          alert('Erreur lors de l\'inscription. Vérifiez que le serveur est démarré.')
          submitBtn.disabled = false
          submitBtn.textContent = originalText
        }
      })
    }
  }
  
  // ========== MOT DE PASSE OUBLIÉ ==========
  if (window.location.pathname.includes('forgot-password.html')) {
    const forgotForm = document.getElementById('forgot-password-form')
    
    if (forgotForm) {
      forgotForm.addEventListener('submit', function(e) {
        e.preventDefault()
        
        const email = document.getElementById('email').value
        const submitBtn = document.getElementById('reset-btn')
        
        if (!email) {
          alert('Veuillez entrer votre adresse email')
          return
        }
        
        // Simulation d'envoi d'email
        submitBtn.disabled = true
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...'
        
        setTimeout(() => {
          document.getElementById('success-message').style.display = 'block'
          forgotForm.style.display = 'none'
        }, 1500)
      })
    }
  }
  
  // ========== DÉCONNEXION ==========
  const logoutBtns = document.querySelectorAll('#logout-btn, #mobile-logout-btn')
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = 'login.html'
    })
  })
})