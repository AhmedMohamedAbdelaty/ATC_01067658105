document.addEventListener('DOMContentLoaded', async function () {
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

    // user info
    const userInitialsElement = document.getElementById('user-initials');
    const userNameElement = document.getElementById('user-name');

    if (userInitialsElement && user.username) {
        userInitialsElement.textContent = user.username.substring(0, 2).toUpperCase();
    }

    if (userNameElement && user.username) {
        userNameElement.textContent = user.username;
    }

    if (typeof AdminSidebar !== 'undefined') {
        AdminSidebar.init();
    }

    const eventForm = document.getElementById('event-form');
    const formTitle = document.getElementById('form-title');
    const breadcrumbAction = document.getElementById('breadcrumb-action');
    const submitBtn = document.getElementById('submit-btn');
    const errorMessage = document.getElementById('error-message');
    const imageInput = document.getElementById('event-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const currentImageContainer = document.getElementById('current-image-container');
    const removeImageBtn = document.getElementById('remove-image-btn');

    const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            await AuthAPI.logout();
            window.location.href = '../login.html';
        });
    }

    let isEditMode = false;
    let eventId = null;

    // edit mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
        eventId = urlParams.get('id');
        isEditMode = true;
        formTitle.textContent = 'Edit Event';
        breadcrumbAction.textContent = 'Edit Event';
        submitBtn.innerHTML = '<i class="bi bi-save"></i> Update Event';

        try {
            const response = await EventsAPI.getEventById(eventId);

            if (response.success && response.data) {
                fillFormWithEventData(response.data);
            } else {
                displayFormError('Failed to load event data.');
            }
        } catch (error) {
            console.error('Error loading event:', error);
            displayFormError(`Error loading event: ${error.message || 'Unknown error'}`);
        }
    }

    eventForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        const errorMsgEl = document.getElementById('error-message');
        if (errorMsgEl) errorMsgEl.style.display = 'none';

        try {
            const eventData = getEventData();
            let response;

            if (isEditMode) {
                response = await EventsAPI.updateEvent(eventId, eventData);
            } else {
                response = await EventsAPI.createEvent(eventData);
            }

            if (response.success) {
                const createdEventId = isEditMode ? eventId : response.data.id;

                const imageInput = document.getElementById('event-image');
                if (imageInput.files.length > 0) {
                    const imageFile = imageInput.files[0];
                    await EventsAPI.uploadEventImage(createdEventId, imageFile);
                }

                if (typeof showNotification === 'function') {
                    showNotification(`Event successfully ${isEditMode ? 'updated' : 'created'}!`, 'success', 3000);
                }

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                displayFormError(response.error || `Failed to ${isEditMode ? 'update' : 'create'} event.`);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, error);
            displayFormError(`Error: ${error.message || 'Unknown error'}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isEditMode ? '<i class="bi bi-save"></i> Update Event' : '<i class="bi bi-save"></i> Create Event';
        }
    });

    // Image preview
    imageInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
            };

            reader.readAsDataURL(this.files[0]);
        } else {
            imagePreviewContainer.style.display = 'none';
        }
    });

    // Remove image
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', async function () {
            try {
                if (isEditMode && eventId) {
                    const confirmed = confirm('Are you sure you want to remove the current image?');

                    if (confirmed) {
                        removeImageBtn.disabled = true;
                        removeImageBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Removing...';

                        const response = await EventsAPI.deleteEventImage(eventId);

                        if (response.success) {
                            currentImageContainer.style.display = 'none';
                            if (typeof showNotification === 'function') {
                                showNotification('Image removed successfully', 'success');
                            }
                        } else {
                            if (typeof showNotification === 'function') {
                                showNotification('Failed to remove image', 'danger');
                            } else {
                                alert('Failed to remove image');
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error removing image:', error);
                if (typeof showNotification === 'function') {
                    showNotification(`Error: ${error.message || 'Unknown error'}`, 'danger');
                } else {
                    alert(`Error: ${error.message || 'Unknown error'}`);
                }
            } finally {
                removeImageBtn.disabled = false;
                removeImageBtn.innerHTML = '<i class="bi bi-trash"></i> Remove';
            }
        });
    }

    function fillFormWithEventData(event) {
        document.getElementById('event-id').value = event.id;
        document.getElementById('name').value = event.name;
        document.getElementById('category').value = event.category;

        const eventDate = new Date(event.eventDate);
        const formattedDate = eventDate.toISOString().slice(0, 16);
        document.getElementById('event-date').value = formattedDate;

        document.getElementById('venue').value = event.venue;
        document.getElementById('price').value = event.price;

        if (event.maxCapacity) {
            document.getElementById('max-capacity').value = event.maxCapacity;
        }

        document.getElementById('description').value = event.description;

        if (event.imageUrl) {
            const currentImage = document.getElementById('current-image');
            const imageBaseUrl = API_URL.replace('/api', '');
            const imageUrl = event.imageUrl.startsWith('http') ? event.imageUrl : `${imageBaseUrl}${event.imageUrl.startsWith('/') ? '' : '/'}${event.imageUrl}`;
            currentImage.src = imageUrl;
            currentImageContainer.style.display = 'block';
        }
    }

    function getEventData() {
        const name = document.getElementById('name').value.trim();
        const category = document.getElementById('category').value;
        const eventDateInput = document.getElementById('event-date').value;
        const venue = document.getElementById('venue').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        const maxCapacityInput = document.getElementById('max-capacity').value.trim();
        const maxCapacity = maxCapacityInput ? parseInt(maxCapacityInput) : null;
        const description = document.getElementById('description').value.trim();

        let eventDate = eventDateInput;
        if (eventDate && !eventDate.includes('Z') && !eventDate.includes('+')) {
            if (!eventDate.match(/:\d\d$/)) {
                eventDate += ':00';
            }
            eventDate += 'Z';
        }

        return {
            name,
            category,
            eventDate,
            venue,
            price,
            maxCapacity,
            description,
        };
    }

    function validateForm() {
        const name = document.getElementById('name').value.trim();
        const category = document.getElementById('category').value;
        const eventDate = document.getElementById('event-date').value;
        const venue = document.getElementById('venue').value.trim();
        const price = document.getElementById('price').value;
        const description = document.getElementById('description').value.trim();

        if (!name) {
            displayFormError('Please enter an event name.');
            return false;
        }

        if (!category) {
            displayFormError('Please select a category.');
            return false;
        }

        if (!eventDate) {
            displayFormError('Please select an event date and time.');
            return false;
        }

        if (!venue) {
            displayFormError('Please enter a venue.');
            return false;
        }

        if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            displayFormError('Please enter a valid price (must be a positive number).');
            return false;
        }

        if (!description) {
            displayFormError('Please enter a description.');
            return false;
        }

        const maxCapacityInput = document.getElementById('max-capacity').value.trim();
        if (maxCapacityInput && (isNaN(parseInt(maxCapacityInput)) || parseInt(maxCapacityInput) <= 0)) {
            displayFormError('Max capacity must be a positive number.');
            return false;
        }

        return true;
    }
});
