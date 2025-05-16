document.addEventListener('DOMContentLoaded', async function() {
    const publicPages = [
            'login.html',
            'register.html'
    ]
    const currentPath = window.location.pathname.split('/').pop();

    // public
    if (publicPages.includes(currentPath)) {
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
            if (currentPath === 'login.html' || currentPath === 'register.html') {
                window.location.href = 'index.html';
                return;
            }
        }
        checkAuthStatus();
        setupLogoutButton();
        if (document.getElementById('login-form') && currentPath === 'login.html') {
            setupLoginForm();
        }
        if (document.getElementById('register-form') && currentPath === 'register.html') {
            setupRegisterForm();
        }
        return;
    }

    // not public
    try {
        await ensureValidAccessToken();

        checkAuthStatus();
        setupLogoutButton();
    } catch (error) {
        console.error('Authentication error on protected page:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
    }
});

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

function isTokenExpired(token) {
    if (!token) {
        return true;
    }
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) {
        return true;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = decoded.exp;
    const isExpired = expiryTime < currentTime;

    return isExpired;
}

async function ensureValidAccessToken() {
    let token = localStorage.getItem('token');

    const expired = isTokenExpired(token);

    if (expired) {
        const refreshed = await refreshToken();
        if (!refreshed) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
                window.location.href = 'login.html';
            }
            throw new Error('Token refresh failed and redirecting.');
        }
        token = localStorage.getItem('token');
    } else {
    }
}


function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const loggedInElements = document.querySelectorAll('.logged-in');
    const loggedOutElements = document.querySelectorAll('.logged-out');
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const userGreetingElement = document.getElementById('user-greeting');

    if (token && user && !isTokenExpired(token)) {
        loggedOutElements.forEach(el => el.style.display = 'none');
        loggedInElements.forEach(el => el.style.display = 'list-item');

        if (userGreetingElement) {
            userGreetingElement.textContent = `Welcome, ${user.username}!`;
            userGreetingElement.style.display = 'block';
        }

        const isAdminUser = user.roles && user.roles.includes('ROLE_ADMIN');
        adminOnlyElements.forEach(el => el.style.display = isAdminUser ? 'list-item' : 'none');

    } else {
        loggedOutElements.forEach(el => el.style.display = 'list-item');
        loggedInElements.forEach(el => el.style.display = 'none');
        adminOnlyElements.forEach(el => el.style.display = 'none');
        if (userGreetingElement) {
            userGreetingElement.style.display = 'none';
        }
    }
}

function setupLogoutButton() {
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', async function(event) {
            event.preventDefault();
            try {
                await AuthAPI.logout();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                checkAuthStatus();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout failed:', error);
                alert('Logout failed. Please try again.');
            }
        });
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const emailOrUsernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const errorMessageDiv = document.getElementById('error-message');

            if (!emailOrUsernameInput || !passwordInput || !errorMessageDiv) {
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = "error occurred with the login form.";
                    errorMessageDiv.style.display = 'block';
                }
                return;
            }

            const emailOrUsername = emailOrUsernameInput.value;
            const password = passwordInput.value;

            try {
                const response = await AuthAPI.login(emailOrUsername, password);
                if (response.success && response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    checkAuthStatus();
                    window.location.href = 'index.html';
                } else {
                    errorMessageDiv.textContent = response.error || 'Login failed. Please check your credentials.';
                    errorMessageDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Login API error:', error);
                errorMessageDiv.textContent = error.message || 'An unexpected error occurred during login.';
                errorMessageDiv.style.display = 'block';
            }
        });
    }
}

function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorMessageDiv = document.getElementById('register-error-message');

            if (password !== confirmPassword) {
                errorMessageDiv.textContent = "Passwords do not match.";
                errorMessageDiv.style.display = 'block';
                return;
            }

            try {
                const response = await AuthAPI.register(username, email, password);
                if (response.success) {
                    alert('Registration successful! Please log in.');
                    window.location.href = 'login.html';
                } else {
                    errorMessageDiv.textContent = response.error || 'Registration failed.';
                    errorMessageDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Registration API error:', error);
                errorMessageDiv.textContent = error.message || 'An unexpected error occurred during registration.';
                errorMessageDiv.style.display = 'block';
            }
        });
    }
}


function isAdminPage() {
    const adminPaths = [
        'admin.html',
        '/admin/',
        'create-event.html',
        'edit-event.html'
    ];
    const currentPath = window.location.pathname;
    return adminPaths.some(path => currentPath.includes(path));
}
