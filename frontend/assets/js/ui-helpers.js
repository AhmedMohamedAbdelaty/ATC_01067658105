function showNotification(message, type = 'info', duration = 5000) {
    const notificationsContainer = document.getElementById('notifications-container');
    if (!notificationsContainer) {
        console.warn('Notifications container not found. Cannot display notification.');
        return;
    }

    const alertId = 'alert-' + Date.now();
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show custom-alert" role="alert" style="animation: slideInFromRight 0.5s ease-out;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    notificationsContainer.insertAdjacentHTML('beforeend', alertHTML);

    const alertElement = document.getElementById(alertId);

    if (duration > 0) {
        setTimeout(() => {
            if (alertElement) {
                const bsAlert = bootstrap.Alert.getInstance(alertElement);
                if (bsAlert) {
                    bsAlert.close();
                } else {
                    alertElement.style.animation = 'fadeOutToRight 0.5s ease-in forwards';
                    alertElement.addEventListener('animationend', () => alertElement.remove());
                }
            }
        }, duration);
    }
}

function displayFormError(message, errorElementId = 'error-message') {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        console.warn(`Error element with ID '${errorElementId}' not found. Cannot display form error.`);
        showNotification(message, 'danger');
    }
}

function renderLoadingSpinner(containerElement, message = 'Loading...') {
    if (!containerElement) return;
    containerElement.innerHTML = `
        <div class="col-12 text-center py-5 ui-helper-state">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">${message}</span>
            </div>
            <p class="mt-3 fs-5 text-muted">${message}</p>
        </div>`;
}

function renderErrorState(containerElement, title = 'Oops! Something Went Wrong', message = 'Please try again in a moment.', onRetry = null, retryButtonText = 'Try Again') {
    if (!containerElement) return;
    let retryButtonHTML = '';
    if (onRetry && typeof onRetry === 'function') {
        const retryFunctionName = 'retry_' + Date.now();
        window[retryFunctionName] = onRetry;
        retryButtonHTML = `<button class="btn btn-primary rounded-pill mt-3" onclick="${retryFunctionName}()">
                            <i class="fas fa-redo me-2"></i>${retryButtonText}
                        </button>`;
    }

    containerElement.innerHTML = `
        <div class="col-12 text-center py-5 ui-helper-state">
            <img src="assets/images/icons/error-triangle.svg" alt="Error" class="ui-helper-icon mb-3" style="width: 80px;">
            <h4 class="alert-heading">${title}</h4>
            <p class="text-muted">${message}</p>
            ${retryButtonHTML}
        </div>
    `;
}

function renderEmptyState(
    containerElement,
    title = 'Nothing to See Here',
    message = 'There is no data to display at the moment.',
    ctaLink = null,
    ctaText = 'Do Something',
    ctaIconClass = null,
    imageSrc = 'assets/images/icons/empty-box.svg'
) {
    if (!containerElement) return;
    let ctaButtonHTML = '';
    if (ctaLink) {
        const iconHTML = ctaIconClass ? `<i class="${ctaIconClass} me-2"></i>` : '';
        ctaButtonHTML = `<a href="${ctaLink}" class="btn btn-lg btn-primary rounded-pill mt-4">
                            ${iconHTML}${ctaText}
                        </a>`;
    }
    containerElement.innerHTML = `
        <div class="col-12 text-center py-5 ui-helper-state">
            <img src="${imageSrc}" alt="${title}" class="ui-helper-icon mb-4" style="width: 120px;">
            <h3 class="mb-3">${title}</h3>
            <p class="text-muted mb-3">${message}</p>
            ${ctaButtonHTML}
        </div>
    `;
}

function ensureAnimationStyles() {
    if (!document.getElementById('common-animation-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'common-animation-styles';
        styleSheet.innerText = `
            /* General Item Animations */
            .fade-in-item {
                opacity: 0;
                transform: translateY(20px);
                animation: itemFadeIn 0.5s ease-out forwards;
            }
            @keyframes itemFadeIn {
                to { opacity: 1; transform: translateY(0); }
            }

            .fade-out-item {
                animation: itemFadeOut 0.4s ease-in forwards;
            }
            @keyframes itemFadeOut {
                to { opacity: 0; transform: scale(0.9); }
            }

            /* Notification Animations */
            @keyframes slideInFromRight {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes fadeOutToRight { /* Or fadeOutUp, etc. */
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100%); }
            }
            .custom-alert {
                /* Base style for notifications if not already defined elsewhere */
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

document.addEventListener('DOMContentLoaded', ensureAnimationStyles);
