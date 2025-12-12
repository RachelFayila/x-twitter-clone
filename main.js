/**
 * main.js - Fonctions avancées avec l'API json-server
 * Validation, authentification et opérations avec backend réel
 */

// Configuration de l'API
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

// API Service - Interface avec json-server
const ApiService = {
    /**
     * Appel API réel avec fetch()
     */
    async fetch(endpoint, options = {}) {
        console.log(`[API] ${options.method || 'GET'} ${endpoint}`);
        
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                ...options,
                headers: API_CONFIG.getHeaders()
            });
            
            // Vérifier si l'utilisateur doit être redirigé vers login
            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('Non authentifié');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
            }
            
            return response;
            
        } catch (error) {
            console.error(`Erreur API ${endpoint}:`, error);
            
            // Si c'est une erreur réseau, on peut simuler pour la démo
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.log('API hors ligne, simulation pour la démo...');
                return await this.simulateOfflineResponse(endpoint, options);
            }
            
            throw error;
        }
    },
    
    /**
     * Simule une réponse quand l'API est hors ligne
     */
    async simulateOfflineResponse(endpoint, options) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données de simulation en cas d'API hors ligne
        const mockData = this.getMockData(endpoint, options);
        
        return {
            ok: true,
            status: 200,
            json: async () => mockData
        };
    },
    
    /**
     * Données mockées pour le mode hors ligne
     */
    getMockData(endpoint, options) {
        const userData = localStorage.getItem('x_app_user');
        const user = userData ? JSON.parse(userData) : null;
        
        if (endpoint.includes('/auth/login')) {
            const { email, password } = JSON.parse(options.body || '{}');
            
            // Vérifier les identifiants en local
            const validCredentials = (
                (email === 'test@example.com' && password === 'password123') ||
                (email === 'rachel@example.com' && password === 'rachel2024')
            );
            
            if (validCredentials) {
                const mockUser = {
                    id: 1,
                    email,
                    username: email === 'rachel@example.com' ? 'FayilaDigitalHub' : 'testuser',
                    fullName: email === 'rachel@example.com' ? 'Rachel Fayila' : 'Test User',
                    avatar: email === 'rachel@example.com' ? './images/image rachel.jpg' : 'https://i.pravatar.cc/150?img=1'
                };
                
                localStorage.setItem('x_app_token', 'mock-offline-token');
                localStorage.setItem('x_app_user', JSON.stringify(mockUser));
                
                return {
                    success: true,
                    message: 'Connexion réussie (mode hors ligne)',
                    user: mockUser,
                    token: 'mock-offline-token'
                };
            } else {
                return {
                    success: false,
                    message: 'Identifiants incorrects'
                };
            }
        }
        
        if (endpoint.includes('/posts/timeline')) {
            return {
                success: true,
                posts: [
                    {
                        id: 1,
                        userId: 2,
                        content: "Mode hors ligne : Les données sont chargées localement.",
                        likes: 7,
                        retweets: 1,
                        comments: 3,
                        timestamp: new Date().toISOString(),
                        user: {
                            id: 2,
                            username: 'FayilaDigitalHub',
                            fullName: 'Rachel Fayila',
                            avatar: './images/image rachel.jpg'
                        }
                    }
                ],
                count: 1
            };
        }
        
        if (endpoint.includes('/profile/me')) {
            if (!user) {
                return {
                    success: false,
                    message: 'Utilisateur non connecté'
                };
            }
            
            return {
                success: true,
                profile: {
                    ...user,
                    followers: 1245,
                    following: 245,
                    postsCount: 12,
                    joined: 'Janvier 2025',
                    location: 'Kinshasa, République Démocratique du Congo',
                    website: 'www.fayiladigitalhub.com',
                    bio: 'Développeuse web passionnée par les nouvelles technologies.'
                }
            };
        }
        
        // Réponse par défaut
        return {
            success: true,
            message: 'Réponse simulée (API hors ligne)'
        };
    },
    
    /**
     * Gère les utilisateurs non authentifiés
     */
    handleUnauthorized() {
        // Enlever le token invalide
        localStorage.removeItem('x_app_token');
        
        // Rediriger vers login si sur une page protégée
        const protectedPages = ['index.html', 'explorer.html', 'notifications.html', 'profil.html'];
        const currentPath = window.location.pathname;
        const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
        
        if (isProtectedPage) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    }
};

// Services existants inchangés (Validation, Auth, UI)
const ValidationService = {
    /**
     * Valide un email
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Valide un mot de passe
     */
    validatePassword(password) {
        if (password.length < 8) {
            return {
                valid: false,
                message: 'Le mot de passe doit contenir au moins 8 caractères'
            };
        }
        
        if (!/\d/.test(password)) {
            return {
                valid: false,
                message: 'Le mot de passe doit contenir au moins un chiffre'
            };
        }
        
        if (!/[a-zA-Z]/.test(password)) {
            return {
                valid: false,
                message: 'Le mot de passe doit contenir au moins une lettre'
            };
        }
        
        return {
            valid: true,
            message: 'Mot de passe valide'
        };
    },
    
    /**
     * Valide un nom d'utilisateur
     */
    validateUsername(username) {
        if (username.length < 3) {
            return {
                valid: false,
                message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
            };
        }
        
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return {
                valid: false,
                message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'
            };
        }
        
        return {
            valid: true,
            message: 'Nom d\'utilisateur valide'
        };
    },
    
    /**
     * Valide une date de naissance
     */
    validateBirthdate(dateString) {
        const birthdate = new Date(dateString);
        const today = new Date();
        const age = today.getFullYear() - birthdate.getFullYear();
        
        if (age < 13) {
            return {
                valid: false,
                message: 'Vous devez avoir au moins 13 ans pour créer un compte'
            };
        }
        
        return {
            valid: true,
            message: 'Date de naissance valide'
        };
    },
    
    /**
     * Valide un formulaire complet
     */
    validateForm(formData, formType) {
        const errors = [];
        
        if (formType === 'login') {
            if (!formData.email) {
                errors.push('L\'email est requis');
            }
            
            if (!formData.password) {
                errors.push('Le mot de passe est requis');
            }
        }
        
        if (formType === 'register') {
            if (!formData.fullName) {
                errors.push('Le nom complet est requis');
            }
            
            if (!formData.email) {
                errors.push('L\'email est requis');
            } else if (!this.validateEmail(formData.email)) {
                errors.push('L\'email n\'est pas valide');
            }
            
            if (!formData.username) {
                errors.push('Le nom d\'utilisateur est requis');
            } else {
                const usernameValidation = this.validateUsername(formData.username);
                if (!usernameValidation.valid) {
                    errors.push(usernameValidation.message);
                }
            }
            
            if (!formData.password) {
                errors.push('Le mot de passe est requis');
            } else {
                const passwordValidation = this.validatePassword(formData.password);
                if (!passwordValidation.valid) {
                    errors.push(passwordValidation.message);
                }
            }
            
            if (!formData.birthdate) {
                errors.push('La date de naissance est requise');
            } else {
                const birthdateValidation = this.validateBirthdate(formData.birthdate);
                if (!birthdateValidation.valid) {
                    errors.push(birthdateValidation.message);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
};

const AuthService = {
    /**
     * Vérifie si l'utilisateur est connecté
     */
    isAuthenticated() {
        const token = localStorage.getItem('x_app_token');
        const user = localStorage.getItem('x_app_user');
        return !!(token && user);
    },
    
    /**
     * Récupère l'utilisateur connecté
     */
    getCurrentUser() {
        const userData = localStorage.getItem('x_app_user');
        return userData ? JSON.parse(userData) : null;
    },
    
    /**
     * Déconnecte l'utilisateur
     */
    logout() {
        localStorage.removeItem('x_app_token');
        localStorage.removeItem('x_app_user');
        window.location.href = 'login.html';
    },
    
    /**
     * Met à jour le profil utilisateur localement
     */
    updateLocalProfile(profileData) {
        const userData = this.getCurrentUser();
        if (!userData) return null;
        
        const updatedUser = { ...userData, ...profileData };
        localStorage.setItem('x_app_user', JSON.stringify(updatedUser));
        
        return updatedUser;
    }
};

const UIService = {
    /**
     * Affiche un message d'erreur
     */
    showError(element, message) {
        this.clearError(element);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = '#f4212e';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '0.25rem';
        
        element.parentNode.insertBefore(errorElement, element.nextSibling);
        element.classList.add('has-error');
        element.style.borderColor = '#f4212e';
    },
    
    /**
     * Efface les messages d'erreur
     */
    clearError(element) {
        const errorElement = element.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        
        element.classList.remove('has-error');
        element.style.borderColor = '';
    },
    
    /**
     * Affiche un loader
     */
    showLoader(button) {
        const originalText = button.textContent;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
        button.disabled = true;
        
        return () => {
            button.textContent = originalText;
            button.disabled = false;
        };
    },
    
    /**
     * Affiche un message de succès
     */
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #00BA7C;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// Main Application Logic avec API réelle
class XApp {
    constructor() {
        this.api = ApiService;
        this.validation = ValidationService;
        this.auth = AuthService;
        this.ui = UIService;
    }
    
    /**
     * Initialise l'application
     */
    init() {
        console.log('XApp initialisé avec json-server');
        
        // Vérifier l'authentification
        this.checkAuthStatus();
        
        // Initialiser les formulaires
        this.initForms();
        
        // Initialiser les événements globaux
        this.initGlobalEvents();
        
        // Charger les données initiales si connecté
        if (this.auth.isAuthenticated()) {
            this.loadInitialData();
        }
    }
    
    /**
     * Vérifie le statut d'authentification
     */
    checkAuthStatus() {
        const token = localStorage.getItem('x_app_token');
        const currentPath = window.location.pathname;
        
        // Pages protégées
        const protectedPages = ['index.html', 'explorer.html', 'notifications.html', 'profil.html'];
        const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
        
        // Pages d'authentification
        const authPages = ['login.html', 'register.html'];
        const isAuthPage = authPages.some(page => currentPath.includes(page));
        
        // Redirection si nécessaire
        if (isProtectedPage && !token) {
            console.log('Non authentifié sur page protégée, redirection...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 500);
            return;
        }
        
        if (isAuthPage && token) {
            console.log('Déjà authentifié, redirection vers l\'accueil...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
            return;
        }
    }
    
    /**
     * Initialise les formulaires
     */
    initForms() {
        // Formulaires d'authentification
        const authForms = document.querySelectorAll('.auth-form');
        authForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });
        
        // Validation en temps réel
        this.initRealTimeValidation();
    }
    
    /**
     * Gère la soumission des formulaires
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formType = form.closest('.auth-card') ? 
            (form.querySelector('input[type="date"]') ? 'register' : 'login') : 'unknown';
        
        // Récupérer les données du formulaire
        const formData = this.getFormData(form);
        
        // Valider le formulaire
        const validation = this.validation.validateForm(formData, formType);
        
        if (!validation.valid) {
            validation.errors.forEach(error => {
                this.ui.showError(form, error);
            });
            return;
        }
        
        // Afficher le loader
        const submitButton = form.querySelector('button[type="submit"]');
        const restoreButton = this.ui.showLoader(submitButton);
        
        try {
            let endpoint, body;
            
            if (formType === 'login') {
                endpoint = '/auth/login';
                body = JSON.stringify({
                    email: formData.email,
                    password: formData.password
                });
            } else if (formType === 'register') {
                endpoint = '/auth/register';
                body = JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    username: formData.username,
                    fullName: formData.fullName,
                    birthdate: formData.birthdate
                });
            }
            
            const response = await this.api.fetch(endpoint, {
                method: 'POST',
                body
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Stocker le token et les infos utilisateur
                localStorage.setItem('x_app_token', result.token);
                localStorage.setItem('x_app_user', JSON.stringify(result.user));
                
                this.ui.showSuccess(result.message);
                
                // Redirection après succès
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.ui.showError(form, result.message);
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'authentification:', error);
            this.ui.showError(form, error.message || 'Erreur de connexion au serveur');
        } finally {
            restoreButton();
        }
    }
    
    /**
     * Récupère les données d'un formulaire
     */
    getFormData(form) {
        const formData = {};
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.name && !input.disabled) {
                formData[input.name] = input.value.trim();
            }
        });
        
        return formData;
    }
    
    /**
     * Initialise la validation en temps réel
     */
    initRealTimeValidation() {
        // Validation email
        const emailInputs = document.querySelectorAll('input[type="email"], input[name="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !this.validation.validateEmail(input.value)) {
                    this.ui.showError(input, 'Veuillez entrer un email valide');
                } else {
                    this.ui.clearError(input);
                }
            });
        });
        
        // Validation mot de passe
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value) {
                    const validation = this.validation.validatePassword(input.value);
                    if (!validation.valid) {
                        this.ui.showError(input, validation.message);
                    } else {
                        this.ui.clearError(input);
                    }
                }
            });
        });
        
        // Validation nom d'utilisateur
        const usernameInputs = document.querySelectorAll('input[name="username"]');
        usernameInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value) {
                    const validation = this.validation.validateUsername(input.value);
                    if (!validation.valid) {
                        this.ui.showError(input, validation.message);
                    } else {
                        this.ui.clearError(input);
                    }
                }
            });
        });
    }
    
    /**
     * Initialise les événements globaux
     */
    initGlobalEvents() {
        // Déconnexion
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', () => this.auth.logout());
        });
        
        // Boutons "Suivre" (si sur la page)
        const followButtons = document.querySelectorAll('.btn-follow:not([data-initialized])');
        followButtons.forEach(button => {
            button.setAttribute('data-initialized', 'true');
            button.addEventListener('click', (e) => this.handleFollow(e));
        });
        
        // Boutons "Like" sur les posts
        const likeButtons = document.querySelectorAll('.post-action .fa-heart');
        likeButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleLike(e));
        });
    }
    
    /**
     * Gère l'action "Suivre"
     */
    async handleFollow(event) {
        const button = event.currentTarget;
        const userId = button.getAttribute('data-user-id');
        
        if (!userId || !this.auth.isAuthenticated()) {
            this.ui.showError(button, 'Vous devez être connecté');
            return;
        }
        
        const restoreButton = this.ui.showLoader(button);
        
        try {
            const response = await this.api.fetch(`/follow/${userId}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour le bouton
                button.textContent = result.isFollowing ? 'Suivi' : 'Suivre';
                button.classList.toggle('btn-follow');
                button.classList.toggle('btn-secondary');
                
                // Mettre à jour le compteur localement si présent
                const statsElement = button.closest('.profile-stats') || 
                                   button.closest('.follow-user-info')?.parentElement;
                if (statsElement) {
                    const followersCount = statsElement.querySelector('[data-followers-count]');
                    if (followersCount) {
                        const currentCount = parseInt(followersCount.textContent) || 0;
                        followersCount.textContent = result.isFollowing ? currentCount + 1 : currentCount - 1;
                    }
                }
                
                this.ui.showSuccess(result.message);
            }
        } catch (error) {
            console.error('Erreur lors du follow:', error);
            this.ui.showError(button, 'Erreur lors de l\'opération');
        } finally {
            restoreButton();
        }
    }
    
    /**
     * Gère l'action "Like"
     */
    async handleLike(event) {
        const heartIcon = event.currentTarget;
        const postAction = heartIcon.closest('.post-action');
        const postElement = postAction.closest('.post');
        const postId = postElement.getAttribute('data-post-id');
        
        if (!postId || !this.auth.isAuthenticated()) {
            this.ui.showError(postAction, 'Vous devez être connecté');
            return;
        }
        
        try {
            const response = await this.api.fetch(`/posts/${postId}/like`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour l'interface
                const countSpan = postAction.querySelector('span');
                if (countSpan) {
                    countSpan.textContent = result.likes;
                }
                
                // Changer l'icône et la couleur
                if (result.isLiked) {
                    heartIcon.classList.remove('far');
                    heartIcon.classList.add('fas');
                    heartIcon.style.color = '#f4212e';
                } else {
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                    heartIcon.style.color = '';
                }
            }
        } catch (error) {
            console.error('Erreur lors du like:', error);
        }
    }
    
    /**
     * Charge les données initiales
     */
    async loadInitialData() {
        try {
            // Charger le profil
            await this.loadProfile();
            
            // Charger la timeline si sur la page d'accueil
            if (window.location.pathname.includes('index.html')) {
                await this.loadTimeline();
            }
            
            // Charger les notifications si sur la page notifications
            if (window.location.pathname.includes('notifications.html')) {
                await this.loadNotifications();
            }
            
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }
    
    /**
     * Charge le profil utilisateur
     */
    async loadProfile() {
        try {
            const response = await this.api.fetch('/profile/me');
            const result = await response.json();
            
            if (result.success) {
                console.log('Profil chargé:', result.profile.username);
                
                // Mettre à jour l'interface si sur la page profil
                if (window.location.pathname.includes('profil.html')) {
                    this.updateProfileUI(result.profile);
                }
                
                return result.profile;
            }
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
        }
    }
    
    /**
     * Charge la timeline
     */
    async loadTimeline() {
        try {
            const response = await this.api.fetch('/posts/timeline');
            const result = await response.json();
            
            if (result.success) {
                console.log(`${result.count} posts chargés`);
                
                // Mettre à jour l'interface
                this.renderTimeline(result.posts);
                
                return result.posts;
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la timeline:', error);
        }
    }
    
    /**
     * Charge les notifications
     */
    async loadNotifications() {
        try {
            const response = await this.api.fetch('/notifications');
            const result = await response.json();
            
            if (result.success) {
                console.log(`${result.count} notifications chargées`);
                return result.notifications;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des notifications:', error);
        }
    }
    
    /**
     * Met à jour l'interface du profil
     */
    updateProfileUI(profile) {
        // Sélecteurs communs de la page profil
        const selectors = {
            name: '.profile-name, .profile-details h1',
            handle: '.profile-handle, [data-user-handle]',
            bio: '.profile-bio',
            location: '.profile-location span',
            website: '.profile-website a',
            joined: '.profile-joined span',
            followers: '[data-followers-count]',
            following: '[data-following-count]',
            posts: '[data-posts-count]'
        };
        
        Object.entries(selectors).forEach(([key, selector]) => {
            const element = document.querySelector(selector);
            if (element) {
                switch(key) {
                    case 'name':
                        element.textContent = profile.fullName;
                        break;
                    case 'handle':
                        element.textContent = `@${profile.username}`;
                        break;
                    case 'bio':
                        element.textContent = profile.bio || '';
                        break;
                    case 'location':
                        element.textContent = profile.location || '';
                        break;
                    case 'website':
                        element.textContent = profile.website || '';
                        element.href = profile.website || '#';
                        break;
                    case 'joined':
                        element.textContent = `A rejoint X en ${profile.joined}`;
                        break;
                    case 'followers':
                        element.textContent = profile.followers || 0;
                        break;
                    case 'following':
                        element.textContent = profile.following || 0;
                        break;
                    case 'posts':
                        element.textContent = profile.postsCount || 0;
                        break;
                }
            }
        });
    }
    
    /**
     * Affiche la timeline
     */
    renderTimeline(posts) {
        const timeline = document.querySelector('.timeline');
        if (!timeline) return;
        
        // Vider la timeline existante (sauf le créateur de post)
        const postCreator = timeline.querySelector('.post-creator');
        timeline.innerHTML = '';
        if (postCreator) {
            timeline.appendChild(postCreator);
        }
        
        // Ajouter chaque post
        posts.forEach(post => {
            const postElement = this.createPostElement(post);
            timeline.appendChild(postElement);
        });
        
        // Réinitialiser les événements
        this.initGlobalEvents();
    }
    
    /**
     * Crée un élément post
     */
    createPostElement(post) {
        const div = document.createElement('div');
        div.className = 'post';
        div.setAttribute('data-post-id', post.id);
        
        div.innerHTML = `
            <div class="post-avatar">
                <img src="${post.user?.avatar || 'https://i.pravatar.cc/150?img=1'}" alt="Avatar">
            </div>
            <div class="post-content">
                <div class="post-header">
                    <span class="post-author">${post.user?.fullName || 'Utilisateur'}</span>
                    <span class="post-handle">@${post.user?.username || 'user'} · ${this.formatTime(post.timestamp)}</span>
                </div>
                <div class="post-text">${post.content}</div>
                <div class="post-actions">
                    <button class="post-action" data-action="comment">
                        <i class="far fa-comment"></i>
                        <span>${post.comments || 0}</span>
                    </button>
                    <button class="post-action" data-action="retweet">
                        <i class="fas fa-retweet"></i>
                        <span>${post.retweets || 0}</span>
                    </button>
                    <button class="post-action" data-action="like">
                        <i class="${post.isLiked ? 'fas' : 'far'} fa-heart" style="${post.isLiked ? 'color: #f4212e' : ''}"></i>
                        <span>${post.likes || 0}</span>
                    </button>
                    <button class="post-action" data-action="share">
                        <i class="far fa-share-square"></i>
                    </button>
                </div>
            </div>
        `;
        
        return div;
    }
    
    /**
     * Formate la date pour l'affichage
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short' 
        });
    }
    
    /**
     * Crée un nouveau post
     */
    async createPost(content) {
        if (!content.trim()) {
            throw new Error('Le contenu du post ne peut pas être vide');
        }
        
        try {
            const response = await this.api.fetch('/posts', {
                method: 'POST',
                body: JSON.stringify({ content })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.ui.showSuccess('Post publié avec succès !');
                
                // Recharger la timeline
                if (window.location.pathname.includes('index.html')) {
                    await this.loadTimeline();
                }
                
                return result.post;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erreur lors de la création du post:', error);
            throw error;
        }
    }
    
    /**
     * Met à jour le profil
     */
    async updateProfile(profileData) {
        try {
            // Note: Vous devrez créer cette route dans votre backend
            const response = await this.api.fetch('/profile/me', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Mettre à jour le localStorage
                this.auth.updateLocalProfile(profileData);
                
                this.ui.showSuccess('Profil mis à jour avec succès !');
                return result.profile;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            throw error;
        }
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const app = new XApp();
    app.init();
    
    // Exposer l'application globalement pour le débogage
    window.XApp = app;
});

// Export pour les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ApiService,
        ValidationService,
        AuthService,
        UIService,
        XApp
    };
}