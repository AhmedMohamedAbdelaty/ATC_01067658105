const AdminSidebar = {
    init: function () {
        const sidebarToggler = document.getElementById('admin-sidebar-toggler');
        if (sidebarToggler) {
            sidebarToggler.addEventListener('click', this.toggleSidebar);
        }

        this.setActiveMenuItem();

        this.checkScreenSize();
        window.addEventListener('resize', this.checkScreenSize);
    },

    toggleSidebar: function () {
        const sidebar = document.querySelector('.admin-sidebar');
        const content = document.querySelector('.admin-content');
        const header = document.querySelector('.admin-header');

        sidebar.classList.toggle('collapsed');
        content.classList.toggle('expanded');
        header.classList.toggle('expanded');
    },

    setActiveMenuItem: function () {
        const currentPath = window.location.pathname;
        const menuLinks = document.querySelectorAll('.admin-menu-link');

        menuLinks.forEach(link => {
            if (currentPath.includes(link.getAttribute('href'))) {
                link.classList.add('active');
            }
        });
    },

    checkScreenSize: function () {
        const sidebar = document.querySelector('.admin-sidebar');
        const content = document.querySelector('.admin-content');
        const header = document.querySelector('.admin-header');

        if (window.innerWidth < 992) {
            sidebar.classList.add('collapsed');
            content.classList.add('expanded');
            header.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            content.classList.remove('expanded');
            header.classList.remove('expanded');
        }
    },
};

const StatsDashboard = {
    init: function () {
        this.loadStatistics();
    },

    loadStatistics: function () {
        try {
            const totalEvents = document.getElementById('total-events-stat');
            const totalBookings = document.getElementById('total-bookings-stat');
            const avgOccupancy = document.getElementById('avg-occupancy-stat');
            const totalRevenue = document.getElementById('total-revenue-stat');

            EventsAPI.getAllEvents(0, 1000)
                .then(eventsResponse => {
                    if (eventsResponse.success && eventsResponse.data) {
                        const events = eventsResponse.data.content;

                        if (totalEvents) {
                            totalEvents.textContent = events.length;
                        }

                        if (totalBookings) {
                            const bookingsCount = events.reduce((total, event) => total + (event.currentBookingsCount || 0), 0);
                            totalBookings.textContent = bookingsCount;
                        }

                        if (avgOccupancy) {
                            const eventsWithCapacity = events.filter(event => event.maxCapacity && event.maxCapacity > 0);
                            if (eventsWithCapacity.length > 0) {
                                const occupancyPercentages = eventsWithCapacity.map(event => (event.currentBookingsCount / event.maxCapacity) * 100);
                                const avgOccupancyValue = occupancyPercentages.reduce((sum, percent) => sum + percent, 0) / occupancyPercentages.length;
                                avgOccupancy.textContent = avgOccupancyValue.toFixed(1) + '%';
                            } else {
                                avgOccupancy.textContent = 'N/A';
                            }
                        }

                        if (totalRevenue) {
                            const revenue = events.reduce((total, event) => total + event.price * (event.currentBookingsCount || 0), 0);
                            totalRevenue.textContent = '$' + revenue.toFixed(2);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error loading dashboard statistics:', error);
                });
        } catch (error) {
            console.error('Error loading dashboard statistics:', error);
        }
    },
};

const EventsTable = {
    currentPage: 0,
    pageSize: 10,
    sortField: 'eventDate,asc',

    init: function () {
        this.loadEvents();
        this.initSortingListeners();
    },

    initSortingListeners: function () {
        const sortHeaders = document.querySelectorAll('[data-sort]');
        sortHeaders.forEach(header => {
            header.addEventListener('click', e => {
                e.preventDefault();
                const field = header.getAttribute('data-sort');
                const currentDirection = this.sortField.split(',')[1];
                const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
                this.sortField = `${field},${newDirection}`;

                // Update sort
                document.querySelectorAll('.sort-indicator').forEach(indicator => {
                    indicator.innerHTML = '';
                });

                const indicator = header.querySelector('.sort-indicator');
                indicator.innerHTML = newDirection === 'asc' ? '↑' : '↓';

                this.loadEvents();
            });
        });
    },

    loadEvents: function () {
        const eventsTableBody = document.getElementById('events-table-body');
        const paginationContainer = document.getElementById('admin-pagination');

        if (!eventsTableBody) return;

        try {
            // Show loading
            eventsTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                <div class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                </div>
            </td>
        </tr>
    `;

            EventsAPI.getAllEvents(this.currentPage, this.pageSize, this.sortField)
                .then(response => {
                    if (response.success && response.data) {
                        const events = response.data.content;
                        const totalPages = response.data.totalPages;

                        if (events.length === 0) {
                            eventsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No events found</td>
                </tr>
            `;
                            if (paginationContainer) {
                                paginationContainer.innerHTML = '';
                            }
                            return;
                        }

                        eventsTableBody.innerHTML = '';

                        events.forEach(event => {
                            const eventDate = new Date(event.eventDate);
                            const status = this.getEventStatus(event);

                            const imageBaseUrl = API_URL.replace('/api', '');
                            const imageUrl =
                                event.imageUrl &&
                                (event.imageUrl.startsWith('http') ? event.imageUrl : `${imageBaseUrl}${event.imageUrl.startsWith('/') ? '' : '/'}${event.imageUrl}`);

                            eventsTableBody.innerHTML += `
                <tr>
                    <td>
                    <div class="d-flex align-items-center">
                        ${
                            imageUrl
                                ? `<img src="${imageUrl}" alt="${event.name}" class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">`
                                : `<div class="me-2" style="width: 40px; height: 40px; background-color: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                            <i class="bi bi-image text-muted"></i>
                        </div>`
                        }
                        <div>
                          <div class="fw-bold">${event.name}</div>
                          <div class="small text-muted">${event.venue}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge bg-primary">${event.category}</span></td>
                    <td>
                      <div>${eventDate.toLocaleDateString()}</div>
                      <div class="small text-muted">${eventDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                      })}</div>
                    </td>
                    <td><span class="badge ${status.color}">${status.label}</span></td>
                    <td>$${event.price.toFixed(2)}</td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="me-2">${event.currentBookingsCount}${event.maxCapacity ? ` / ${event.maxCapacity}` : ''}</div>
                        ${
                            event.maxCapacity
                                ? `<div class="progress" style="width: 60px; height: 6px;">
                            <div class="progress-bar" role="progressbar" style="width: ${(event.currentBookingsCount / event.maxCapacity) * 100}%"></div>
                          </div>`
                                : ''
                        }
                      </div>
                    </td>
                    <td>
                        <div class="admin-action-buttons">
                            <a href="../event-details.html?id=${event.id}" class="admin-action-btn btn btn-outline-primary" title="View">
                                <i class="bi bi-eye"></i>
                            </a>
                            <a href="event-form.html?id=${event.id}" class="admin-action-btn btn btn-outline-secondary" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </a>
                            <button class="admin-action-btn btn btn-outline-danger delete-event-btn" data-event-id="${event.id}" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
                        });

                        // Set up delete buttons
                        const deleteButtons = document.querySelectorAll('.delete-event-btn');
                        const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
                        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

                        deleteButtons.forEach(button => {
                            button.addEventListener('click', function () {
                                const eventId = this.getAttribute('data-event-id');
                                confirmDeleteBtn.setAttribute('data-event-id', eventId);
                                confirmDeleteBtn.setAttribute('data-page', EventsTable.currentPage);
                                confirmDeleteBtn.setAttribute('data-size', EventsTable.pageSize);
                                confirmDeleteBtn.setAttribute('data-sort', EventsTable.sortField);
                                deleteModal.show();
                            });
                        });

                        if (paginationContainer && totalPages > 1) {
                            let paginationHTML = '';

                            paginationHTML += `
                <li class="page-item ${this.currentPage === 0 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${this.currentPage - 1}" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
            `;

                            const maxPages = 5;
                            let startPage = Math.max(0, this.currentPage - Math.floor(maxPages / 2));
                            let endPage = Math.min(totalPages - 1, startPage + maxPages - 1);

                            if (endPage - startPage + 1 < maxPages) {
                                startPage = Math.max(0, endPage - maxPages + 1);
                            }

                            if (startPage > 0) {
                                paginationHTML += `
                  <li class="page-item">
                      <a class="page-link" href="#" data-page="0">1</a>
                  </li>
                  ${startPage > 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
              `;
                            }

                            for (let i = startPage; i <= endPage; i++) {
                                paginationHTML += `
                  <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                      <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
                  </li>
              `;
                            }

                            if (endPage < totalPages - 1) {
                                paginationHTML += `
                  ${endPage < totalPages - 2 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
                  <li class="page-item">
                      <a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a>
                  </li>
              `;
                            }

                            paginationHTML += `
                <li class="page-item ${this.currentPage === totalPages - 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${this.currentPage + 1}" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            `;

                            paginationContainer.innerHTML = paginationHTML;

                            const pageLinks = paginationContainer.querySelectorAll('.page-link');
                            pageLinks.forEach(link => {
                                if (link.hasAttribute('data-page')) {
                                    link.addEventListener('click', e => {
                                        e.preventDefault();
                                        const pageNum = parseInt(link.getAttribute('data-page'));
                                        this.currentPage = pageNum;
                                        this.loadEvents();
                                    });
                                }
                            });
                        } else if (paginationContainer) {
                            paginationContainer.innerHTML = '';
                        }
                    } else {
                        eventsTableBody.innerHTML = `
              <tr>
                  <td colspan="7" class="text-center">Error loading events</td>
              </tr>
          `;
                    }
                })
                .catch(error => {
                    console.error('Error loading events table:', error);
                    eventsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Error loading events: ${error.message}</td>
            </tr>
        `;
                });
        } catch (error) {
            console.error('Error loading events table:', error);
            eventsTableBody.innerHTML = `
          <tr>
              <td colspan="7" class="text-center">Error loading events: ${error.message}</td>
          </tr>
      `;
        }
    },

    getEventStatus: function (event) {
        const now = new Date();
        const eventDate = new Date(event.eventDate);

        if (eventDate < now) {
            return {
                label: 'Past',
                color: 'bg-secondary'
            };
        }

        if (event.maxCapacity && event.currentBookingsCount >= event.maxCapacity) {
            return {
                label: 'Sold Out',
                color: 'bg-danger'
            };
        }

        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        if (eventDate <= threeDaysFromNow) {
            return {
                label: 'Upcoming Soon',
                color: 'bg-warning'
            };
        }

        return {
            label: 'Active',
            color: 'bg-success'
        };
    },
};

function handleDeleteEvent() {
    const eventId = this.getAttribute('data-event-id');
    const page = parseInt(this.getAttribute('data-page') || '0');
    const size = parseInt(this.getAttribute('data-size') || '10');
    const sort = this.getAttribute('data-sort') || 'eventDate,asc';
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));

    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

    // Delete event
    EventsAPI.deleteEvent(eventId)
        .then(response => {
            deleteModal.hide();

            if (response.success) {
                EventsTable.currentPage = page;
                EventsTable.pageSize = size;
                EventsTable.sortField = sort;
                EventsTable.loadEvents();

                if (typeof StatsDashboard !== 'undefined') {
                    StatsDashboard.loadStatistics();
                }

                showNotification('Event deleted successfully', 'success');
            } else {
                showNotification('Failed to delete event', 'danger');
            }
        })
        .catch(error => {
            console.error('Deletion error:', error);
            showNotification('Error: ' + (error.message || 'Unknown error'), 'danger');
            deleteModal.hide();
        })
        .finally(() => {
            this.disabled = false;
            this.textContent = 'Delete Event';
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || TokenUtils.isTokenExpired(token)) {
        window.location.href = '../login.html';
        return;
    }

    const isAdmin = user && user.roles && user.roles.some(role => role === 'ROLE_ADMIN' || (typeof role === 'object' && role.name === 'ROLE_ADMIN'));

    if (!isAdmin) {
        window.location.href = '../index.html';
        return;
    }

    AdminSidebar.init();

    if (document.getElementById('admin-dashboard')) {
        StatsDashboard.init();
    }

    if (document.getElementById('events-table-body')) {
        EventsTable.init();
    }

    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.removeEventListener('click', handleDeleteEvent);
        confirmDeleteBtn.addEventListener('click', handleDeleteEvent);
    }

    const userInitialsElement = document.getElementById('user-initials');
    const userNameElement = document.getElementById('user-name');

    if (userInitialsElement && user.username) {
        userInitialsElement.textContent = user.username.substring(0, 2).toUpperCase();
    }

    if (userNameElement && user.username) {
        userNameElement.textContent = user.username;
    }
});
