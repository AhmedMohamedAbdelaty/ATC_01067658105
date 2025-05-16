document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('bookings-container')) {
        loadUserBookings();
    }
});

async function loadUserBookings(page = 0, size = 10, sort = 'bookingTime,desc') {
    const bookingsContainer = document.getElementById('bookings-container');
    const paginationContainer = document.getElementById('pagination');

    if (!bookingsContainer) return;

    try {
        bookingsContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        // get all the bookings by the current user
        const response = await BookingsAPI.getUserBookings(page, size, sort);

        if (response.success && response.data) {
            const bookings = response.data.content;
            const totalPages = response.data.totalPages;

            if (bookings.length === 0) {
                bookingsContainer.innerHTML = `
                    <div class="alert alert-info">
                        <h4 class="alert-heading">No Bookings Found</h4>
                        <p>You haven't booked any events yet.</p>
                        <hr>
                        <a href="index.html" class="btn btn-primary">Browse Events</a>
                    </div>
                `;
                paginationContainer.innerHTML = '';
                return;
            }

            bookingsContainer.innerHTML = '';

            // Add booking cards
            bookings.forEach(booking => {
                const eventDate = new Date(booking.eventDetails.eventDate);
                const bookingDate = new Date(booking.bookingTime);

                bookingsContainer.innerHTML += `
                    <div class="card mb-3">
                        <div class="row g-0">
                            <div class="col-md-4">
                                <img src="${booking.eventDetails.imageUrl}"
                                    class="img-fluid rounded-start h-100" style="object-fit: cover;" alt="${booking.eventDetails.name}">
                            </div>
                            <div class="col-md-8">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <h5 class="card-title">${booking.eventDetails.name}</h5>
                                        <span class="badge bg-primary">${booking.eventDetails.category}</span>
                                    </div>
                                    <p class="card-text text-truncate">${booking.eventDetails.description}</p>

                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <small class="text-muted d-block">
                                                <i class="bi bi-calendar"></i> Event Date: ${eventDate.toLocaleDateString()}
                                            </small>
                                            <small class="text-muted d-block">
                                                <i class="bi bi-clock"></i> Event Time: ${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </small>
                                        </div>
                                        <div class="col-md-6">
                                            <small class="text-muted d-block">
                                                <i class="bi bi-geo-alt"></i> Venue: ${booking.eventDetails.venue}
                                            </small>
                                            <small class="text-muted d-block">
                                                <i class="bi bi-tag"></i> Price: $${booking.eventDetails.price.toFixed(2)}
                                            </small>
                                        </div>
                                    </div>

                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">Booked on: ${bookingDate.toLocaleDateString()} at ${bookingDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                        <div class="btn-group">
                                            <a href="event-details.html?id=${booking.eventDetails.id}" class="btn btn-sm btn-outline-primary">View Event</a>
                                            <button class="btn btn-sm btn-outline-danger cancel-booking-btn" data-booking-id="${booking.id}">Cancel Booking</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            if (totalPages > 1) {
                let paginationHTML = '';

                paginationHTML += `
                    <li class="page-item ${page === 0 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${page - 1}" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                `;

                for (let i = 0; i < totalPages; i++) {
                    paginationHTML += `
                        <li class="page-item ${i === page ? 'active' : ''}">
                            <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
                        </li>
                    `;
                }

                paginationHTML += `
                    <li class="page-item ${page === totalPages - 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${page + 1}" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                `;

                paginationContainer.innerHTML = paginationHTML;

                const paginationLinks = paginationContainer.querySelectorAll('.page-link');
                paginationLinks.forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const newPage = parseInt(this.getAttribute('data-page'));
                        loadUserBookings(newPage, size, sort);
                    });
                });
            } else {
                paginationContainer.innerHTML = '';
            }

            // cancel booking buttons
            const cancelButtons = document.querySelectorAll('.cancel-booking-btn');
            const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
            const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

            cancelButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const bookingId = this.getAttribute('data-booking-id');
                    confirmCancelBtn.setAttribute('data-booking-id', bookingId);
                    cancelModal.show();
                });
            });

            // if click confirm button
            confirmCancelBtn.addEventListener('click', async function() {
                const bookingId = this.getAttribute('data-booking-id');

                try {
                    confirmCancelBtn.disabled = true;
                    confirmCancelBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

                    // Cancel booking
                    const response = await BookingsAPI.cancelBooking(bookingId);

                    cancelModal.hide();

                    if (response.success) {
                        loadUserBookings(page, size, sort);
                    } else {
                        alert('Failed to cancel booking. Please try again.');
                    }
                } catch (error) {
                    console.error('Cancellation error:', error);
                    alert('Failed to cancel booking: ' + (error.message || 'Unknown error'));
                    cancelModal.hide();
                } finally {
                    confirmCancelBtn.disabled = false;
                    confirmCancelBtn.textContent = 'Yes, Cancel Booking';
                }
            });
        } else {
            bookingsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Error</h4>
                    <p>Failed to load your bookings. Please try again later.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Error</h4>
                <p>Failed to load your bookings. Please try again later.</p>
            </div>
        `;
    }
}
