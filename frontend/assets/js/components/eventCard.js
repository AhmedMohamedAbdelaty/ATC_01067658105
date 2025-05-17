const DEFAULT_EVENT_IMAGE_PLACEHOLDER = 'assets/images/event-placeholder.jpg';

function getEventImageUrl(imageUrlPath) {
    if (imageUrlPath) {
        if (imageUrlPath.startsWith('http')) {
            return imageUrlPath;
        }
        const apiBaseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl().replace('/api', '') : '';
        return apiBaseUrl + imageUrlPath;
    }
    return DEFAULT_EVENT_IMAGE_PLACEHOLDER;
}

function createBookingCardHTML(booking, index = 0) {
    const event = booking.eventDetails;
    const eventDate = new Date(event.eventDate);
    const bookingDate = new Date(booking.bookingTime);
    const imageUrl = getEventImageUrl(event.imageUrl);

    const bookingId = booking.id || '';
    const isValidBookingId = bookingId && String(bookingId).trim() !== '' &&
                            String(bookingId).toLowerCase() !== 'null' &&
                            String(bookingId).toLowerCase() !== 'undefined';

    const cardId = isValidBookingId ?
                `booking-card-${bookingId}` :
                `booking-card-invalid-${Date.now()}-${index}`;

    let cancelBtnHTML;
    if (isValidBookingId) {
        cancelBtnHTML = `
                        <button class="btn btn-sm btn-outline-danger cancel-booking-btn rounded-pill px-3"
                                data-booking-id="${bookingId}"
                                data-card-id="${cardId}">
                            <i class="fas fa-times-circle me-1"></i>Cancel
                        </button>`;
    } else {
        cancelBtnHTML = `
                        <button class="btn btn-sm btn-outline-danger rounded-pill px-3" disabled
                                title="Cancellation unavailable: Booking ID is missing or invalid.">
                            <i class="fas fa-times-circle me-1"></i>Cancel
                        </button>`;
    }

    return `
        <div class="col-md-6 col-lg-4 mb-4 booking-card-item" id="${cardId}" style="animation-delay: ${index * 0.05}s">
            <div class="event-card-common booking-card-style shadow-sm">
                <div class="card-img-container">
                    <img src="${imageUrl}" class="card-img-top-custom" alt="${event.name}"
                        onerror="this.onerror=null; this.src='${DEFAULT_EVENT_IMAGE_PLACEHOLDER}';">
                </div>
                <div class="card-body-custom">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <h5 class="card-title-custom text-primary mb-0 text-truncate" title="${event.name}">${event.name}</h5>
                        <span class="badge bg-light text-dark border ms-2 rounded-pill">${event.category}</span>
                    </div>

                    <div class="event-meta-item mt-2">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${eventDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="text-truncate" title="${event.venue}">${event.venue}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-ticket-alt"></i>
                        <span>Price: <strong>${event.price > 0 ? `$${event.price.toFixed(2)}` : 'Free'}</strong></span>
                    </div>
                    <p class="booked-on-text mt-2 mb-0">
                        Booked on: ${bookingDate.toLocaleDateString()}
                    </p>
                </div>
                <div class="card-footer-custom">
                    <div class="d-flex justify-content-end">
                        <a href="event-details.html?id=${event.id}" class="btn btn-sm btn-outline-primary me-2 rounded-pill px-3">
                            <i class="fas fa-eye me-1"></i>View Event
                        </a>
                        ${cancelBtnHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}


function createEventListingCardHTML(event, index = 0) {
    const eventDate = new Date(event.eventDate);
    const imageUrl = getEventImageUrl(event.imageUrl);
    const cardId = `event-card-${event.id}`;
    const isBookedByCurrentUser = event.isCurrentUserBooked;
    const isFull = event.maxCapacity !== null && event.currentBookingsCount >= event.maxCapacity;

    let statusBadgeHTML = '';
    if (isBookedByCurrentUser) {
        statusBadgeHTML = `<span class="badge bg-success event-status-badge"><i class="fas fa-check-circle me-1"></i>Booked</span>`;
    } else if (isFull) {
        statusBadgeHTML = `<span class="badge bg-danger event-status-badge">Fully Booked</span>`;
    }

    let buttonHTML = '';
    if (isBookedByCurrentUser) {
        buttonHTML = `<a href="event-details.html?id=${event.id}" class="btn btn-success w-100 rounded-pill"><i class="fas fa-calendar-check me-1"></i>View Booking</a>`;
    } else if (isFull) {
        buttonHTML = `<a href="event-details.html?id=${event.id}" class="btn btn-outline-secondary w-100 rounded-pill" disabled>Fully Booked</a>`;
    } else {
        buttonHTML = `<a href="event-details.html?id=${event.id}" class="btn btn-primary w-100 rounded-pill"><i class="fas fa-ticket-alt me-1"></i>View & Book</a>`;
    }

    const availableSpots = event.maxCapacity ? (event.maxCapacity - event.currentBookingsCount) : Infinity;
    let availabilityText = '';
    if (event.maxCapacity) {
        if (availableSpots > 0 && availableSpots <= 10) {
            availabilityText = `<span class="event-availability text-warning fw-bold">${availableSpots} spots left!</span>`;
        } else if (availableSpots > 0) {
            availabilityText = `<span class="event-availability">${availableSpots} spots available</span>`;
        } else {
            availabilityText = `<span class="event-availability text-danger fw-bold">No spots left</span>`;
        }
    } else {
        availabilityText = '<span class="event-availability">Open availability</span>';
    }


    return `
        <div class="col-md-6 col-lg-4 mb-4 event-card-item" id="${cardId}" style="animation-delay: ${index * 0.05}s">
            <div class="event-card-common event-listing-card-style shadow-sm">
                <div class="card-img-container">
                    ${statusBadgeHTML}
                    <img src="${imageUrl}" class="card-img-top-custom" alt="${event.name}"
                        onerror="this.onerror=null; this.src='${DEFAULT_EVENT_IMAGE_PLACEHOLDER}';">
                </div>
                <div class="card-body-custom">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="card-title-custom text-truncate" title="${event.name}">${event.name}</h5>
                        <span class="badge bg-light text-dark border rounded-pill event-price-badge">${event.price > 0 ? `$${event.price.toFixed(2)}` : 'Free'}</span>
                    </div>
                    <p class="card-text-custom text-truncate-2-lines mb-2">${event.description || 'No description available.'}</p>

                    <div class="event-meta-item">
                        <i class="fas fa-tag"></i>
                        <span>${event.category}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${eventDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="text-truncate" title="${event.venue}">${event.venue}</span>
                    </div>
                    <div class="mt-auto pt-2"> <!-- Push availability and footer to bottom -->
                        <div class="text-center my-2">
                            ${availabilityText}
                        </div>
                        <div class="d-grid">
                            ${buttonHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
