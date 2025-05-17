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
            let eventsHTML = '';

            const defaultImageUrl = 'assets/images/event-placeholder.jpg';
            const apiBaseUrl = getApiBaseUrl().replace('/api', '');


            events.forEach(event => {
                const isBookedByCurrentUser = event.isCurrentUserBooked;
                const isFull = event.maxCapacity !== null && event.currentBookingsCount >= event.maxCapacity;
                const eventDate = new Date(event.eventDate);

                let imageUrl;
                if (event.imageUrl) {
                    if (event.imageUrl.startsWith('http')) {
                        imageUrl = event.imageUrl;
                    }
                    else {
                        imageUrl = apiBaseUrl + event.imageUrl;
                    }
                } else {
                    imageUrl = defaultImageUrl;
                }

                let badgeHTML = '';
                if (isBookedByCurrentUser) {
                    badgeHTML = `<a href="event-details.html?id=${event.id}" class="badge bg-success booked-badge booked-badge-link text-decoration-none position-absolute top-0 start-0 m-2">Booked</a>`;
                } else if (isFull) {
                    badgeHTML = `<span class="badge bg-danger fully-booked-badge position-absolute top-0 start-0 m-2">Fully Booked</span>`;
                }

                let buttonHTML = '';
                if (isBookedByCurrentUser) {
                    buttonHTML = `<a href="event-details.html?id=${event.id}" class="btn btn-success">View Booking</a>`;
                } else if (isFull) {
                    buttonHTML = `<button class="btn btn-outline-secondary view-details-btn" data-event-id="${event.id}" disabled>Fully Booked</button>`;
                } else {
                    buttonHTML = `<button class="btn btn-outline-primary view-details-btn" data-event-id="${event.id}">View Details & Book</button>`;
                }

                eventsHTML += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card event-card h-100 position-relative">
                            ${badgeHTML}
                            <img src="${imageUrl}" class="card-img-top" alt="${event.name}" onerror="this.onerror=null; this.src='${defaultImageUrl}';" style="height: 200px; object-fit: cover; margin-top: ${badgeHTML ? '1.5rem' : '0'};">
                            <div class="card-body">
                                <h5 class="card-title">${event.name}</h5>
                                <p class="card-text text-truncate">${event.description || 'No description available.'}</p>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-primary">${event.category}</span>
                                    <span class="text-muted">${event.price > 0 ? `$${event.price.toFixed(2)}` : 'Free'}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">
                                        <i class="bi bi-calendar"></i> ${eventDate.toLocaleDateString()}
                                    </small>
                                    <small class="text-muted">
                                        <i class="bi bi-geo-alt"></i> ${event.venue}
                                    </small>
                                </div>
                                <div class="mt-2">
                                    <small class="text-muted">Available Spots: ${event.maxCapacity ? (event.maxCapacity - event.currentBookingsCount) : 'Unlimited'} / ${event.maxCapacity || 'Unlimited'}</small>
                                </div>
                            </div>
                            <div class="card-footer">
                                <div class="d-grid">
                                    ${buttonHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            eventsContainer.innerHTML = eventsHTML;

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

            const viewDetailsButtons = document.querySelectorAll('.view-details-btn:not([disabled])');
            viewDetailsButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const eventId = this.getAttribute('data-event-id');
                    window.location.href = `event-details.html?id=${eventId}`;
                });
            });
        } else {
            eventsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>Error loading events: ${response.error || 'Please try again later.'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading events:', error);
        eventsContainer.innerHTML = `
            <div class="col-12 text-center">
                <p>An unexpected error occurred while loading events. Please try again later.</p>
            </div>
        `;
    }
}
