document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('bookings-container')) {
        loadUserBookings();
    }
});

async function loadUserBookings(page = 0, size = 6, sort = 'bookingTime,desc') {
    const bookingsContainer = document.getElementById('bookings-container');
    const paginationContainer = document.getElementById('pagination');

    if (!bookingsContainer) return;

    if (page === 0) {
        renderLoadingSpinner(bookingsContainer, 'Fetching your event bookings...');
    }

    try {
        const response = await BookingsAPI.getUserBookings(page, size, sort);

        if (response.success && response.data) {
            const bookings = response.data.content;
            const totalPages = response.data.totalPages;

            if (page === 0) bookingsContainer.innerHTML = '';

            if (bookings.length === 0 && page === 0) {
                renderEmptyState(
                    bookingsContainer,
                    'No Bookings Yet!',
                    "It looks like you haven't booked any events. Time to explore?",
                    'events.html',
                    'Browse Events Now',
                    'fas fa-calendar-alt',
                    'assets/images/icons/empty-box.png'
                );
                if (paginationContainer) paginationContainer.innerHTML = '';
                return;
            }

            const validBookings = bookings.filter(booking => {
                const hasValidId = booking.id && String(booking.id).trim() !== '' &&
                                String(booking.id).toLowerCase() !== 'null' &&
                                String(booking.id).toLowerCase() !== 'undefined';
                if (!hasValidId) {
                    console.warn("Skipping booking with invalid ID:", booking);
                }
                return hasValidId;
            });

            validBookings.forEach((booking, index) => {
                const cardHTML = createBookingCardHTML(booking, index);
                bookingsContainer.insertAdjacentHTML('beforeend', cardHTML);

                const cardElement = document.getElementById(`booking-card-${booking.id}`);
                if (cardElement) {
                    setTimeout(() => cardElement.classList.add('fade-in-item'), 10);
                }
            });

            if (totalPages > 1) {
                let paginationHTML = '';
                paginationHTML += `
                    <li class="page-item ${page === 0 ? 'disabled' : ''}">
                        <a class="page-link rounded-pill" href="#" data-page="${page - 1}" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                `;
                let startPage = Math.max(0, page - 2);
                let endPage = Math.min(totalPages - 1, page + 2);
                if (page < 2) endPage = Math.min(totalPages - 1, 4);
                if (page > totalPages - 3) startPage = Math.max(0, totalPages - 5);
                if (startPage > 0) {
                    paginationHTML += `<li class="page-item"><a class="page-link rounded-pill" href="#" data-page="0">1</a></li>`;
                    if (startPage > 1) paginationHTML += `<li class="page-item disabled"><span class="page-link rounded-pill">...</span></li>`;
                }
                for (let i = startPage; i <= endPage; i++) {
                    paginationHTML += `
                        <li class="page-item ${i === page ? 'active' : ''}">
                            <a class="page-link rounded-pill" href="#" data-page="${i}">${i + 1}</a>
                        </li>
                    `;
                }
                if (endPage < totalPages - 1) {
                    if (endPage < totalPages - 2) paginationHTML += `<li class="page-item disabled"><span class="page-link rounded-pill">...</span></li>`;
                    paginationHTML += `<li class="page-item"><a class="page-link rounded-pill" href="#" data-page="${totalPages - 1}">${totalPages}</a></li>`;
                }
                paginationHTML += `
                    <li class="page-item ${page === totalPages - 1 ? 'disabled' : ''}">
                        <a class="page-link rounded-pill" href="#" data-page="${page + 1}" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                `;
                if (paginationContainer) paginationContainer.innerHTML = paginationHTML;

                const paginationLinks = paginationContainer.querySelectorAll('.page-link[data-page]');
                paginationLinks.forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        if(this.closest('.page-item').classList.contains('disabled') || this.closest('.page-item').classList.contains('active')) return;
                        const newPage = parseInt(this.getAttribute('data-page'));
                        loadUserBookings(newPage, size, sort);
                        window.scrollTo({ top: bookingsContainer.offsetTop - 80, behavior: 'smooth' });
                    });
                });
            } else {
                if (paginationContainer) paginationContainer.innerHTML = '';
            }

            attachCancelEventListeners();

        } else {
            renderErrorState(
                bookingsContainer,
                'Oops! Something Went Wrong',
                response.error || "We couldn't load your bookings right now. Please try again in a moment.",
                () => loadUserBookings(page, size, sort)
            );
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        renderErrorState(
            bookingsContainer,
            'Oops! A Network Error Occurred',
            "We're having trouble connecting. Please check your internet and try again.",
            () => loadUserBookings(page, size, sort)
        );
    }
}

function attachCancelEventListeners() {
    const cancelModalElement = document.getElementById('cancelModal');
    if (!cancelModalElement) return;
    const cancelModal = new bootstrap.Modal(cancelModalElement);
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    document.querySelectorAll('.cancel-booking-btn').forEach(button => {
        const bookingId = button.getAttribute('data-booking-id');
        const cardId = button.getAttribute('data-card-id');

        button.removeEventListener('click', handleCancelClick);
        button.addEventListener('click', handleCancelClick);

        // store bookingId and cardId on the button
        button.dataset.bookingId = bookingId;
        button.dataset.cardId = cardId;
    });

    if (confirmCancelBtn) {
        confirmCancelBtn.removeEventListener('click', handleConfirmCancel);
        confirmCancelBtn.addEventListener('click', handleConfirmCancel);
    }
}

function handleCancelClick(event) {
    const bookingId = this.dataset.bookingId;
    const cardId = this.dataset.cardId;

    if (!bookingId || bookingId.trim() === '' ||
        bookingId.toLowerCase() === 'null' ||
        bookingId.toLowerCase() === 'undefined') {
        console.error("Invalid bookingId for cancellation:", bookingId);
        showNotification('<strong>Error:</strong> Cannot cancel booking. Invalid booking ID.', 'danger');
        return;
    }

    const cancelModalElement = document.getElementById('cancelModal');
    if (!cancelModalElement) return;

    const cancelModal = new bootstrap.Modal(cancelModalElement);
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    if (confirmCancelBtn) {
        confirmCancelBtn.dataset.bookingId = bookingId;
        confirmCancelBtn.dataset.cardId = cardId;
    }

    cancelModal.show();
}

async function handleConfirmCancel() {
    const bookingId = this.dataset.bookingId;
    const cardId = this.dataset.cardId;
    const originalButtonText = this.innerHTML;

    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';

    if (!bookingId || bookingId.trim() === '' ||
        bookingId.toLowerCase() === 'null' ||
        bookingId.toLowerCase() === 'undefined') {
        console.error("Invalid bookingId for cancellation:", bookingId);
        showNotification('<strong>Error:</strong> Cannot cancel booking. Invalid booking ID provided.', 'danger');
        this.disabled = false;
        this.innerHTML = originalButtonText;

        document.querySelector('#cancelModal .btn-close').click();
        return;
    }

    try {
        const response = await BookingsAPI.cancelBooking(bookingId);

        document.querySelector('#cancelModal .btn-close').click();

        if (response.success) {
            showNotification('<strong>Success!</strong> Your booking has been cancelled.', 'success');
            const cardToRemove = document.getElementById(cardId);
            if (cardToRemove) {
                cardToRemove.classList.add('fade-out-item');
                cardToRemove.addEventListener('transitionend', () => {
                    cardToRemove.remove();
                    const bookingsContainer = document.getElementById('bookings-container');
                    if (bookingsContainer && bookingsContainer.children.length === 0) {
                        loadUserBookings();
                    }
                });
            }
        } else {
            showNotification(`<strong>Cancellation Failed:</strong> ${response.error || 'Please try again.'}`, 'danger');
        }
    } catch (error) {
        console.error('Cancellation error:', error);
        showNotification(`<strong>Cancellation Error:</strong> ${error.message || 'An unknown error occurred.'}`, 'danger');

        document.querySelector('#cancelModal .btn-close').click();
    } finally {
        this.disabled = false;
        this.innerHTML = originalButtonText;
    }
}
