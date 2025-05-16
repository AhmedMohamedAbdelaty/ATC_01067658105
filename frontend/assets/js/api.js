const API_URL = 'http://localhost:8080/api';

async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            window.location.href = 'login.html';
            return;
        }
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Adding auth header:', `Bearer ${token.substring(0, 10)}...`);
    }

    const options = {
        method,
        headers,
        credentials: 'include'
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log(`Making ${method} request to ${API_URL}${endpoint}`, body);
        const response = await fetch(`${API_URL}${endpoint}`, options);
        console.log(`Response status: ${response.status}`);

        // Unauthorized
        if (response.status === 401 && requiresAuth) {
            const refreshed = await refreshToken();
            if (refreshed) {
                return apiRequest(endpoint, method, body, requiresAuth);
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
        }

        if (response.status === 204) {
            return { success: true };
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            console.error('API error response:', data);
            if (data.error) {
                throw new Error(data.error);
            } else if (data.message) {
                throw new Error(data.message);
            } else {
                throw new Error(`Request failed with status ${response.status}`);
            }
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

const AuthAPI = {
    login: async (username, password) => {
        try {
            const response = await apiRequest('/auth/login', 'POST', { emailOrUsername: username, password });
            console.log('Login response:', response);

            if (response.success && response.data) {
                localStorage.setItem('token', response.data.token);
                console.log('Token stored:', response.data.token.substring(0, 10) + '...');

                // Store user data with roles
                const userData = {
                    id: response.data.user.id,
                    username: response.data.user.username,
                    email: response.data.user.email,
                    roles: response.data.user.roles
                };

                console.log('Storing user data:', userData);
                localStorage.setItem('user', JSON.stringify(userData));

                // Verify the stored data
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                console.log('Verified stored user data:', storedUser);

                return response.data;
            }
            throw new Error(response.message || 'Login failed');
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    },

    register: async (username, email, password) => {
        try {
            const response = await apiRequest('/auth/register', 'POST', { username, email, password });
            return response;
        } catch (error) {
            console.error('Registration Error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await apiRequest('/auth/logout', 'POST');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return true;
        } catch (error) {
            console.error('Logout Error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return false;
        }
    }
};

const EventsAPI = {
    getAllEvents: async (page = 0, size = 10, sort = 'eventDate,asc', category = null) => {
        let endpoint = `/events?page=${page}&size=${size}&sort=${sort}`;
        if (category) {
            endpoint = `/events/category/${category}?page=${page}&size=${size}&sort=${sort}`;
        }
        return apiRequest(endpoint);
    },

    getEventById: async (eventId) => {
        return apiRequest(`/events/${eventId}`);
    },

    createEvent: async (eventData) => {
        return apiRequest('/events', 'POST', eventData, true);
    },

    updateEvent: async (eventId, eventData) => {
        return apiRequest(`/events/${eventId}`, 'PUT', eventData, true);
    },

    deleteEvent: async (eventId) => {
        return apiRequest(`/events/${eventId}`, 'DELETE', null, true);
    }
};

const BookingsAPI = {
    createBooking: async (eventId) => {
        return apiRequest('/bookings', 'POST', { eventId }, true);
    },

    getUserBookings: async (page = 0, size = 10, sort = 'bookingTime,desc') => {
        return apiRequest(`/bookings/my?page=${page}&size=${size}&sort=${sort}`, 'GET', null, true);
    },

    getBookingById: async (bookingId) => {
        return apiRequest(`/bookings/${bookingId}`, 'GET', null, true);
    },

    cancelBooking: async (bookingId) => {
        return apiRequest(`/bookings/${bookingId}`, 'DELETE', null, true);
    }
};

async function refreshToken() {
    try {
        console.log('Attempting to refresh token...');
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Token refresh failed with status:', response.status);
            return false;
        }

        const data = await response.json();
        console.log('Token refresh response:', data);

        if (data.success && data.data) {
            localStorage.setItem('token', data.data.accessToken);
            console.log('Token refreshed successfully:', data.data.accessToken.substring(0, 10) + '...');

            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                console.error('Failed to store refreshed token in localStorage');
                return false;
            }

            return true;
        }

        console.error('Token refresh response did not contain expected data');
        return false;
    } catch (error) {
        console.error('Token Refresh Error:', error);
        return false;
    }
}
