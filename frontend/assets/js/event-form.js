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

    const eventImageInput = document.getElementById('event-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const currentImageContainer = document.getElementById('current-image-container');
    const currentImage = document.getElementById('current-image');
    const removeImageBtn = document.getElementById('remove-image-btn');

    let removeCurrentImage = false;

    // preview
    if (eventImageInput) {
        eventImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                    currentImageContainer.style.display = 'none';
                    removeCurrentImage = false;
                };
                reader.readAsDataURL(file);
            } else {
                imagePreviewContainer.style.display = 'none';
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to remove this image?')) {
                currentImageContainer.style.display = 'none';
                removeCurrentImage = true;
            }
        });
    }

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
            description: document.getElementById('description').value
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
            let eventIdToUse;

            if (isEditMode) {
                // Update
                response = await EventsAPI.updateEvent(eventId, formData);
                eventIdToUse = eventId;
            } else {
                // Create new
                response = await EventsAPI.createEvent(formData);
                if (response.success && response.data) {
                    eventIdToUse = response.data.id;
                }
            }

            if (!response.success) {
                throw new Error(response.error || 'Failed to save event');
            }

            if (eventIdToUse) {
                const newImageFile = eventImageInput.files[0];
                if (newImageFile) {
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading image...';

                    try {
                        const imageResponse = await EventsAPI.uploadEventImage(eventIdToUse, newImageFile);
                        if (!imageResponse.success) {
                            console.error('Image upload failed:', imageResponse.error);
                            alert('Event was saved but image upload failed: ' + (imageResponse.error || 'Unknown error'));
                        }
                    } catch (imageError) {
                        console.error('Image upload error:', imageError);
                        alert('Event was saved but image upload failed: ' + imageError.message);
                    }
                }
                else if (removeCurrentImage && isEditMode) {
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Removing image...';

                    try {
                        const deleteResponse = await EventsAPI.deleteEventImage(eventIdToUse);
                        if (!deleteResponse.success) {
                            console.error('Image deletion failed:', deleteResponse.error);
                            alert('Event was saved but image removal failed: ' + (deleteResponse.error || 'Unknown error'));
                        }
                    } catch (deleteError) {
                        console.error('Image deletion error:', deleteError);
                        alert('Event was saved but image removal failed: ' + deleteError.message);
                    }
                }
            }

            window.location.href = '../admin/index.html';

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
    const currentImageContainer = document.getElementById('current-image-container');
    const currentImage = document.getElementById('current-image');

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
                const apiBaseUrl = getApiBaseUrl().replace('/api', '');

                let fullImageUrl = event.imageUrl;
                if (!event.imageUrl.startsWith('http')) {
                    fullImageUrl = apiBaseUrl + event.imageUrl;
                }

                currentImage.src = fullImageUrl;
                currentImageContainer.style.display = 'block';
            } else {
                currentImageContainer.style.display = 'none';
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
