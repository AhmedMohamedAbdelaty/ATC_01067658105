document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();

    // Setup logout button
    setupLogoutButton();

    // login form if on login page
    if (document.getElementById('login-form')) {
        setupLoginForm();
    }

    // register form if on register page
    if (document.getElementById('register-form')) {
        setupRegisterForm();
    }

    // go to login page if not logged in
    protectAuthenticatedPages();

    // go to home page if not admin
    protectAdminPages();
});

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const loggedInElements = document.querySelectorAll('.logged-in');
    const loggedOutElements = document.querySelectorAll('.logged-out');
    const adminElements = document.querySelectorAll('.admin-only');

    if (token && user.username) {
        loggedInElements.forEach(el => el.style.display = 'block');
        loggedOutElements.forEach(el => el.style.display = 'none');

        // If admin
        console.log('User roles:', user.roles);
        const isAdmin = user.roles && user.roles.some(role => {
            if (typeof role === 'string') {
                return role === 'ROLE_ADMIN';
            } else if (typeof role === 'object') {
                return role.name === 'ROLE_ADMIN';
            }
            return false;
        });
        console.log('Is admin:', isAdmin);
        adminElements.forEach(el => el.style.display = isAdmin ? 'block' : 'none');
    } else {
        loggedInElements.forEach(el => el.style.display = 'none');
        loggedOutElements.forEach(el => el.style.display = 'block');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                await AuthAPI.logout();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout failed:', error);
                window.location.href = 'index.html';
            }
        });
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            errorMessage.style.display = 'none';
            const loginButton = loginForm.querySelector('button[type="submit"]');
            loginButton.disabled = true;
            loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';

            // call login api
            await AuthAPI.login(username, password);
            window.location.href = 'index.html';
        } catch (error) {
            errorMessage.textContent = error.message || 'Invalid username or password';
            errorMessage.style.display = 'block';

            const loginButton = loginForm.querySelector('button[type="submit"]');
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    });
}

function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            errorMessage.style.display = 'block';
            return;
        }

        try {
            errorMessage.style.display = 'none';
            const registerButton = registerForm.querySelector('button[type="submit"]');
            registerButton.disabled = true;
            // show loading state
            registerButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';

            // call register api
            await AuthAPI.register(username, email, password);
            alert('Registration successful! Please login with your credentials.');
            window.location.href = 'login.html';
        } catch (error) {
            errorMessage.textContent = error.message || 'Registration failed. Please try again.';
            errorMessage.style.display = 'block';

            const registerButton = registerForm.querySelector('button[type="submit"]');
            registerButton.disabled = false;
            registerButton.textContent = 'Register';
        }
    });
}

function protectAuthenticatedPages() {
    const authenticatedPages = [
        '/',
        'index.html',
        'my-bookings.html',
        'admin/index.html',
        'admin/event-form.html',
    ];

    const currentPath = window.location.pathname;
    const token = localStorage.getItem('token');

    const requiresAuth = authenticatedPages.some(page => currentPath.endsWith(page));

    // go to login page
    if (requiresAuth && !token) {
        window.location.href = 'login.html';
    }
}

function protectAdminPages() {
    const adminPages = [
        'admin/index.html',
        "admin/event-form.html",
    ];

    const currentPath = window.location.pathname;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Checking admin access, user:', user);
    const isAdmin = user.roles && user.roles.some(role => {
        if (typeof role === 'string') {
            return role === 'ROLE_ADMIN';
        } else if (typeof role === 'object') {
            return role.name === 'ROLE_ADMIN';
        }
        return false;
    });

    const requiresAdmin = adminPages.some(page => currentPath.endsWith(page));

    if (requiresAdmin && !isAdmin) {
        window.location.href = 'index.html';
    }
}
