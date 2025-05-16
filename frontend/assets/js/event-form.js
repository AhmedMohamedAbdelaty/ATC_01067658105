document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Event form - User data:', user);

    const isAdmin = user.roles && user.roles.some(role =>
        role === 'ROLE_ADMIN' ||
        (typeof role === 'object' && role.name === 'ROLE_ADMIN')
    );

    console.log('Is admin:', isAdmin);

    if (!isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    if (document.getElementById('event-form')) {
        setupEventForm();
    }
});

function setupEventForm() {
    const eventForm = document.getElementById('event-form');
    const formTitle = document.getElementById('form-title');
    const breadcrumbAction = document.getElementById('breadcrumb-action');
    const submitBtn = document.getElementById('submit-btn');
    const errorMessage = document.getElementById('error-message');

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    // form mode -> create or edit
    const isEditMode = !!eventId;

    if (isEditMode) {
        formTitle.textContent = 'Edit Event';
        breadcrumbAction.textContent = 'Edit Event';
        submitBtn.textContent = 'Update Event';

        // if editing, load event data
        loadEventData(eventId);
    }

    eventForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            category: document.getElementById('category').value,
            eventDate: new Date(document.getElementById('event-date').value).toISOString(),
            venue: document.getElementById('venue').value,
            price: parseFloat(document.getElementById('price').value),
            description: document.getElementById('description').value,
            imageUrl: document.getElementById('image-url').value || null
        };

        const maxCapacity = document.getElementById('max-capacity').value;
        if (maxCapacity) {
            formData.maxCapacity = parseInt(maxCapacity);
        }

        try {
            errorMessage.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' +
                (isEditMode ? 'Updating...' : 'Creating...');

            let response;

            if (isEditMode) {
                // Update
                response = await EventsAPI.updateEvent(eventId, formData);
            } else {
                // Create new
                response = await EventsAPI.createEvent(formData);
            }

            if (response.success) {
                window.location.href = 'index.html';
            } else {
                throw new Error(response.message || 'Failed to save event');
            }
        } catch (error) {
            console.error('Event save error:', error);
            errorMessage.textContent = error.message || 'Failed to save event. Please try again.';
            errorMessage.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? 'Update Event' : 'Create Event';
        }
    });
}

async function loadEventData(eventId) {
    const errorMessage = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');

    try {
        document.getElementById('event-form').querySelectorAll('input, select, textarea, button').forEach(el => {
            el.disabled = true;
        });

        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';

        const response = await EventsAPI.getEventById(eventId);

        if (response.success && response.data) {
            const event = response.data;

            document.getElementById('event-id').value = event.id;
            document.getElementById('name').value = event.name;
            document.getElementById('category').value = event.category;
            document.getElementById('venue').value = event.venue;
            document.getElementById('price').value = event.price;
            document.getElementById('description').value = event.description;

            if (event.imageUrl) {
                document.getElementById('image-url').value = event.imageUrl;
            }

            if (event.maxCapacity) {
                document.getElementById('max-capacity').value = event.maxCapacity;
            }

            // Format date
            // YYYY-MM-DDTHH:MM
            const eventDate = new Date(event.eventDate);
            const formattedDate = eventDate.toISOString().slice(0, 16);
            document.getElementById('event-date').value = formattedDate;
        } else {
            throw new Error(response.message || 'Failed to load event data');
        }
    } catch (error) {
        console.error('Error loading event data:', error);
        errorMessage.textContent = error.message || 'Failed to load event data. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        document.getElementById('event-form').querySelectorAll('input, select, textarea, button').forEach(el => {
            el.disabled = false;
        });

        submitBtn.textContent = 'Update Event';
    }
}
