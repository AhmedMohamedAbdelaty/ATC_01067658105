class Navbar {
    constructor(currentPage = '') {
        this.currentPage = currentPage;
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupLogoutButton();
            this.updateNavbarState();
        });
    }

    updateNavbarState() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = user && user.roles && user.roles.some(role => role === 'ROLE_ADMIN' || (typeof role === 'object' && role.name === 'ROLE_ADMIN'));

        const loggedInElements = document.querySelectorAll('.logged-in');
        const loggedOutElements = document.querySelectorAll('.logged-out');
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        const userGreetingElement = document.getElementById('user-greeting');

        const isTokenValid = token && !TokenUtils.isTokenExpired(token);

        if (isTokenValid) {
            loggedOutElements.forEach(el => (el.style.display = 'none'));
            loggedInElements.forEach(el => (el.style.display = 'list-item'));

            if (userGreetingElement) {
                userGreetingElement.textContent = `Welcome, ${user.username}!`;
                userGreetingElement.style.display = 'block';
            }

            adminOnlyElements.forEach(el => (el.style.display = isAdmin ? 'list-item' : 'none'));
        } else {
            loggedOutElements.forEach(el => (el.style.display = 'list-item'));
            loggedInElements.forEach(el => (el.style.display = 'none'));
            adminOnlyElements.forEach(el => (el.style.display = 'none'));

            if (userGreetingElement) {
                userGreetingElement.style.display = 'none';
            }
        }

        if (this.currentPage) {
            const activeLink = document.querySelector(`.nav-link[href*="${this.currentPage}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    setupLogoutButton() {
        const logoutButton = document.getElementById('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', async event => {
                event.preventDefault();
                try {
                    await window.authService.logout();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');

                    const isInAdminSection = window.location.pathname.includes('/admin/');
                    window.location.href = isInAdminSection ? '../login.html' : 'login.html';
                } catch (error) {
                    console.error('Logout failed:', error);
                    alert('Logout failed. Please try again.');
                }
            });
        }
    }
}

let navbarInstance = null;

function initializeNavbar(currentPage) {
    if (!currentPage) {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);
        currentPage = filename || 'index.html';
    }

    navbarInstance = new Navbar(currentPage);
    navbarInstance.init();
    return navbarInstance;
}

window.Navbar = Navbar;
window.initializeNavbar = initializeNavbar;

document.addEventListener('DOMContentLoaded', () => {
    if (!navbarInstance) {
        initializeNavbar();
    }
});
