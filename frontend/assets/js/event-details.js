document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('event-details-container')) {
        // event id
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (eventId) {
            loadEventDetails(eventId);
        } else {
            window.location.href = '/index.html';
        }
    }
});

async function loadEventDetails(eventId) {
    const eventDetailsContainer = document.getElementById('event-details-container');

    try {
        // loading
        eventDetailsContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        // check if already booked
        let isBooked = false;
        if (localStorage.getItem('token')) {
            try {
                const bookingsResponse = await BookingsAPI.getUserBookings();
                if (bookingsResponse.success && bookingsResponse.data) {
                    isBooked = bookingsResponse.data.content.some(booking =>
                        booking.eventDetails.id === eventId
                    );
                }
            } catch (error) {
                console.error('Error fetching user bookings:', error);
            }
        }

        // Get event details
        const response = await EventsAPI.getEventById(eventId);

        if (response.success && response.data) {
            const event = response.data;
            const eventDate = new Date(event.eventDate);

            // Format date and time
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const timeOptions = { hour: '2-digit', minute: '2-digit' };

            const formattedDate = eventDate.toLocaleDateString(undefined, dateOptions);
            const formattedTime = eventDate.toLocaleTimeString(undefined, timeOptions);

            document.title = `${event.name} - Event Booking System`;

            eventDetailsContainer.innerHTML = `
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <img src="${event.imageUrl || 'https://via.placeholder.com/600x400?text=Event+Image'}"
                            class="img-fluid rounded event-image" alt="${event.name}">
                    </div>
                    <div class="col-md-6">
                        <h1 class="mb-3">${event.name}</h1>
                        <div class="event-info mb-4">
                            <div class="info-item">
                                <span class="info-label">Category:</span>
                                <span class="badge bg-primary">${event.category}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Date:</span>
                                <span>${formattedDate}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Time:</span>
                                <span>${formattedTime}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Venue:</span>
                                <span>${event.venue}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Price:</span>
                                <span class="fw-bold">$${event.price.toFixed(2)}</span>
                            </div>
                            ${event.maxCapacity ? `
                                <div class="info-item">
                                    <span class="info-label">Capacity:</span>
                                    <span>${event.currentBookingsCount} / ${event.maxCapacity}</span>
                                </div>
                            ` : ''}
                        </div>

                        <div class="d-grid gap-2">
                            ${!localStorage.getItem('token') ? `
                                <a href="login.html" class="btn btn-primary">Login to Book</a>
                            ` : isBooked ? `
                                <button class="btn btn-success" disabled>Already Booked</button>
                                <a href="my-bookings.html" class="btn btn-outline-primary">View My Bookings</a>
                            ` : `
                                <button id="book-now-btn" class="btn btn-primary">Book Now</button>
                            `}
                            <a href="index.html" class="btn btn-outline-secondary">Back to Events</a>
                        </div>
                    </div>
                </div>

                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Event Description</h5>
                            </div>
                            <div class="card-body">
                                <p>${event.description.replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            if (localStorage.getItem('token') && !isBooked) {
                const bookNowBtn = document.getElementById('book-now-btn');
                const confirmBookingBtn = document.getElementById('confirm-booking-btn');

                const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));

                bookNowBtn.addEventListener('click', function() {
                    bookingModal.show();
                });

                // click confirm create booking
                confirmBookingBtn.addEventListener('click', async function() {
                    try {
                        confirmBookingBtn.disabled = true;
                        confirmBookingBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

                        // call api: create booking
                        const bookingResponse = await BookingsAPI.createBooking(eventId);

                        bookingModal.hide();

                        if (bookingResponse.success) {
                            successModal.show();
                        } else {
                            alert('Booking failed. Please try again.');
                        }
                    } catch (error) {
                        console.error('Booking error:', error);
                        alert('Booking failed: ' + (error.message || 'Unknown error'));
                        bookingModal.hide();
                    } finally {
                        confirmBookingBtn.disabled = false;
                        confirmBookingBtn.textContent = 'Confirm Booking';
                    }
                });
            }
        } else {
            eventDetailsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Event Not Found</h4>
                    <p>The event you're looking for doesn't exist or has been removed.</p>
                    <hr>
                    <a href="index.html" class="btn btn-primary">Back to Events</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        eventDetailsContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Error</h4>
                <p>Failed to load event details. Please try again later.</p>
                <hr>
                <a href="index.html" class="btn btn-primary">Back to Events</a>
            </div>
        `;
    }
}
