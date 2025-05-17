async function handleDeleteEvent() {
    const eventId = this.getAttribute('data-event-id');
    const page = parseInt(this.getAttribute('data-page') || '0');
    const size = parseInt(this.getAttribute('data-size') || '10');
    const sort = this.getAttribute('data-sort') || 'eventDate,asc';
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));

    try {
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

        // Delete event
        const response = await EventsAPI.deleteEvent(eventId);

        deleteModal.hide();

        if (response.success) {
            loadEventsForAdmin(page, size, sort);
        } else {
            alert('Failed to delete event. Please try again.');
        }
    } catch (error) {
        console.error('Deletion error:', error);
        alert('Failed to delete event: ' + (error.message || 'Unknown error'));
        deleteModal.hide();
    } finally {
        this.disabled = false;
        this.textContent = 'Delete Event';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || isTokenExpired(token)) {
        console.log('No valid token found, redirecting to login');
        window.location.href = '../login.html';
        return;
    }

    console.log('Admin check - User data:', user);

    const isAdmin = user && user.roles && user.roles.some(role =>
        role === 'ROLE_ADMIN' ||
        (typeof role === 'object' && role.name === 'ROLE_ADMIN')
    );

    console.log('Is admin:', isAdmin);

    if (!isAdmin) {
        console.log('Not an admin, redirecting to home');
        window.location.href = '../index.html';
        return;
    }

    if (document.getElementById('events-table-body')) {
        loadEventsForAdmin();
    }
});

function isTokenExpired(token) {
    if (!token) {
        return true;
    }
    try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (!decoded || !decoded.exp) {
            return true;
        }
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch (e) {
        console.error('Error decoding token:', e);
        return true;
    }
}

async function loadEventsForAdmin(page = 0, size = 10, sort = 'eventDate,asc') {
    const eventsTableBody = document.getElementById('events-table-body');
    const paginationContainer = document.getElementById('pagination');

    if (!eventsTableBody) return;

    try {
        // loading
        eventsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        // get events
        const response = await EventsAPI.getAllEvents(page, size, sort);

        if (response.success && response.data) {
            const events = response.data.content;
            const totalPages = response.data.totalPages;

            if (events.length === 0) {
                eventsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">No events found.</td>
                    </tr>
                `;
                paginationContainer.innerHTML = '';
                return;
            }

            eventsTableBody.innerHTML = '';

            // Add event rows
            events.forEach(event => {
                const eventDate = new Date(event.eventDate);

                eventsTableBody.innerHTML += `
                    <tr>
                        <td>${event.name}</td>
                        <td><span class="badge bg-primary">${event.category}</span></td>
                        <td>${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td>${event.venue}</td>
                        <td>$${event.price.toFixed(2)}</td>
                        <td>${event.currentBookingsCount}${event.maxCapacity ? ` / ${event.maxCapacity}` : ''}</td>
                        <td>
                            <div class="action-buttons">
                                <a href="../event-details.html?id=${event.id}" class="btn btn-sm btn-outline-primary">
                                    <i class="bi bi-eye"></i>
                                </a>
                                <a href="event-form.html?id=${event.id}" class="btn btn-sm btn-outline-secondary">
                                    <i class="bi bi-pencil"></i>
                                </a>
                                <button class="btn btn-sm btn-outline-danger delete-event-btn" data-event-id="${event.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
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
                        loadEventsForAdmin(newPage, size, sort);
                    });
                });
            } else {
                paginationContainer.innerHTML = '';
            }

            const deleteButtons = document.querySelectorAll('.delete-event-btn');
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
            const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

            deleteButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const eventId = this.getAttribute('data-event-id');
                    confirmDeleteBtn.setAttribute('data-event-id', eventId);
                    deleteModal.show();
                });
            });

            // remove existing event listeners to prevent duplicates
            confirmDeleteBtn.removeEventListener('click', handleDeleteEvent);

            // add new event listener
            confirmDeleteBtn.addEventListener('click', handleDeleteEvent);

            confirmDeleteBtn.setAttribute('data-page', page);
            confirmDeleteBtn.setAttribute('data-size', size);
            confirmDeleteBtn.setAttribute('data-sort', sort);
        } else {
            eventsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Error loading events. Please try again later.</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading events for admin:', error);
        eventsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Error loading events. Please try again later.</td>
            </tr>
        `;
    }
}
