document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('events-container')) {
        loadEvents();

        // filter by category
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                loadEvents(0, 10, 'eventDate,asc', this.value);
            });
        }

        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', function() {
                const searchInput = document.getElementById('search-input');
                // TODO: search functionality
                alert('will implement later');
            });
        }
    }
});

async function loadEvents(page = 0, size = 10, sort = 'eventDate,asc', category = null) {
    const eventsContainer = document.getElementById('events-container');
    const paginationContainer = document.getElementById('pagination');

    if (!eventsContainer) return;

    try {
        // loading
        eventsContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        // check which events are already booked
        let userBookings = [];
        if (localStorage.getItem('token')) {
            try {
                const bookingsResponse = await BookingsAPI.getUserBookings();
                if (bookingsResponse.success && bookingsResponse.data) {
                    userBookings = bookingsResponse.data.content.map(booking => booking.eventDetails.id);
                }
            } catch (error) {
                console.error('Error fetching user bookings:', error);
            }
        }

        // ghets all events
        const response = await EventsAPI.getAllEvents(page, size, sort, category);

        if (response.success && response.data) {
            const events = response.data.content;
            const totalPages = response.data.totalPages;

            if (events.length === 0) {
                eventsContainer.innerHTML = `
                    <div class="col-12 text-center">
                        <p>No events found.</p>
                    </div>
                `;
                paginationContainer.innerHTML = '';
                return;
            }

            eventsContainer.innerHTML = '';

            // Add card for each event
            events.forEach(event => {
                const isBooked = userBookings.includes(event.id);
                const eventDate = new Date(event.eventDate);

                eventsContainer.innerHTML += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card event-card h-100">
                            ${isBooked ? '<span class="badge bg-success booked-badge">Booked</span>' : ''}
                            <img src="${event.imageUrl}" class="card-img-top" alt="${event.name}">
                            <div class="card-body">
                                <h5 class="card-title">${event.name}</h5>
                                <p class="card-text text-truncate">${event.description}</p>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-primary">${event.category}</span>
                                    <span class="text-muted">$${event.price.toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">
                                        <i class="bi bi-calendar"></i> ${eventDate.toLocaleDateString()}
                                    </small>
                                    <small class="text-muted">
                                        <i class="bi bi-geo-alt"></i> ${event.venue}
                                    </small>
                                </div>
                            </div>
                            <div class="card-footer">
                                <div class="d-grid">
                                    ${isBooked
                                        ? '<button class="btn btn-success" disabled>Booked</button>'
                                        : `<a href="event-details.html?id=${event.id}" class="btn btn-outline-primary">View Details</a>`
                                    }
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
                        loadEvents(newPage, size, sort, category);
                    });
                });
            } else {
                paginationContainer.innerHTML = '';
            }
        } else {
            eventsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>Error loading events. Please try again later.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading events:', error);
        eventsContainer.innerHTML = `
            <div class="col-12 text-center">
                <p>Error loading events. Please try again later.</p>
            </div>
        `;
    }
}
