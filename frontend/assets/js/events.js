document.addEventListener('DOMContentLoaded', function() {
    const eventsContainer = document.getElementById('events-container');
    if (eventsContainer) {
        loadEvents();

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                const searchInput = document.getElementById('search-input');
                loadEvents(0, EVENTS_PAGE_SIZE, 'eventDate,asc', this.value, searchInput ? searchInput.value : null);
            });
        }

        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');

        const performSearch = () => {
            const searchTerm = searchInput ? searchInput.value : null;
            const category = categoryFilter ? categoryFilter.value : null;
            loadEvents(0, EVENTS_PAGE_SIZE, 'eventDate,asc', category, searchTerm);
        };

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }
});

const EVENTS_PAGE_SIZE = 9;

async function loadEvents(page = 0, size = EVENTS_PAGE_SIZE, sort = 'eventDate,asc', category = null, searchTerm = null) {
    const eventsContainer = document.getElementById('events-container');
    const paginationContainer = document.getElementById('pagination');

    if (!eventsContainer) return;

    if (page === 0) {
        renderLoadingSpinner(eventsContainer, 'Fetching events...');
    }

    try {
        const response = await EventsAPI.getAllEvents(page, size, sort, category, searchTerm);

        if (page === 0) eventsContainer.innerHTML = '';

        if (response.success && response.data) {
            const events = response.data.content;
            const totalPages = response.data.totalPages;

            if (events.length === 0 && page === 0) {
                let emptyMessage = "No events match your current filters.";
                if (!category && !searchTerm) emptyMessage = "There are currently no events scheduled. Check back soon!";

                renderEmptyState(
                    eventsContainer,
                    'No Events Found',
                    emptyMessage,
                    null,
                    null,
                    null,
                    'assets/images/icons/empty-calendar.png'
                );
                if (paginationContainer) paginationContainer.innerHTML = '';
                return;
            }

            events.forEach((event, index) => {
                const cardHTML = createEventListingCardHTML(event, index);
                eventsContainer.insertAdjacentHTML('beforeend', cardHTML);
                const cardElement = document.getElementById(`event-card-${event.id}`);
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
                        loadEvents(newPage, size, sort, category, searchTerm);
                        const filterRow = document.querySelector('.row.mb-4');
                        const scrollTarget = filterRow || eventsContainer;
                        window.scrollTo({ top: scrollTarget.offsetTop - 80, behavior: 'smooth' });
                    });
                });
            } else {
                if (paginationContainer) paginationContainer.innerHTML = '';
            }

        } else {
            renderErrorState(
                eventsContainer,
                'Failed to Load Events',
                response.error || "We couldn't retrieve events at this time. Please try again.",
                () => loadEvents(page, size, sort, category, searchTerm)
            );
        }
    } catch (error) {
        console.error('Error loading events:', error);
        renderErrorState(
            eventsContainer,
            'Network Error',
            "An error occurred while trying to fetch events. Please check your connection and try again.",
            () => loadEvents(page, size, sort, category, searchTerm)
        );
    }
}
