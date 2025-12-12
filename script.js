/**
 * Configuration pour l'API réelle
 */
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    getHeaders() {
        const token = localStorage.getItem('x_app_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
};

/**
 * Remplace handleAuthFormSubmit pour utiliser l'API réelle
 */
async function handleAuthFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const form = event.target;
    const formType = form.closest('.auth-card') ? 
        (form.querySelector('input[type="date"]') ? 'register' : 'login') : 'unknown';
    
    // Récupérer les données du formulaire
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        showNotification(`Traitement ${formType === 'register' ? 'd\'inscription' : 'de connexion'}...`, 'info');
        
        let endpoint, response;
        
        if (formType === 'login') {
            response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({
                    email: data.email,
                    password: data.password
                })
            });
        } else if (formType === 'register') {
            response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
                method: 'POST',
                headers: API_CONFIG.getHeaders(),
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    username: data.username,
                    fullName: data.fullName,
                    birthdate: data.birthdate
                })
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Stocker le token et les infos utilisateur
            localStorage.setItem('x_app_token', result.token);
            localStorage.setItem('x_app_user', JSON.stringify(result.user));
            
            showNotification(result.message, 'success');
            
            // Rediriger vers la page d'accueil
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showNotification(result.message, 'error');
        }
        
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

/**
 * Fonction pour charger la timeline
 */
async function loadTimeline() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/posts/timeline`, {
            headers: API_CONFIG.getHeaders()
        });
        
        if (response.status === 401) {
            // Non authentifié, rediriger vers login
            window.location.href = 'login.html';
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.posts) {
            renderTimeline(result.posts);
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la timeline:', error);
    }
}

/**
 * Fonction pour créer un post
 */
async function createPost(content) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/posts`, {
            method: 'POST',
            headers: API_CONFIG.getHeaders(),
            body: JSON.stringify({ content })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Post publié avec succès!', 'success');
            loadTimeline(); // Recharger la timeline
            return result.post;
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la création du post:', error);
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

/**
 * Fonction pour liker un post
 */
async function likePost(postId) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: API_CONFIG.getHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            return result;
        }
    } catch (error) {
        console.error('Erreur lors du like:', error);
    }
}

/**
 * Fonction pour suivre un utilisateur
 */
async function followUser(userId) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/follow/${userId}`, {
            method: 'POST',
            headers: API_CONFIG.getHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            return result.isFollowing;
        }
    } catch (error) {
        console.error('Erreur lors du follow:', error);
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

// Modifier la fonction initApp pour vérifier l'authentification
function initApp() {
    // Vérifier si l'utilisateur est authentifié
    const token = localStorage.getItem('x_app_token');
    const currentPath = window.location.pathname;
    
    // Si sur une page protégée sans token, rediriger vers login
    const protectedPages = ['index.html', 'explorer.html', 'notifications.html', 'profil.html'];
    const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
    
    if (isProtectedPage && !token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Si sur login/register avec token, rediriger vers l'accueil
    const authPages = ['login.html', 'register.html'];
    const isAuthPage = authPages.some(page => currentPath.includes(page));
    
    if (isAuthPage && token) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialiser le reste de l'application
    initAuthButtons();
    initMobileMenu();
    
    // Si sur la page d'accueil, charger la timeline
    if (currentPath.includes('index.html') && token) {
        loadTimeline();
    }
    
    console.log('Application X initialisée avec json-server');
}