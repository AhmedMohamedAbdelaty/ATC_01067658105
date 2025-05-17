const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8080/api';
    }
    return `${window.location.origin}/api`;
};

const API_URL = getApiBaseUrl();

let isRefreshingToken = false;
let tokenRefreshPromise = null;

async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = true) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresAuth) {
        await ensureValidAccessToken();
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            window.location.href = 'login.html';
            throw new Error('Authentication required, but no token available.');
        }
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
            credentials: 'include'
        });

        if (response.status === 204) {
            return { success: true, data: null };
        }

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (!window.location.pathname.endsWith('login.html')) {
                    window.location.href = 'login.html';
                }
                throw new Error(responseData.error || 'Unauthorized access - please log in again.');
            }
            throw new Error(responseData.error || `API request failed with status ${response.status}`);
        }

        return responseData;

    } catch (error) {
        console.error('API Request Error:', error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(error.toString());
        }
    }
}

const AuthAPI = {
    login: async (emailOrUsername, password) => {
        const response = await apiRequest('/auth/login', 'POST', { emailOrUsername, password }, false);
        if (response.success && response.data.token) {
            localStorage.setItem('token', response.data.token);

            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } else {
            if (!response.error) {
                throw new Error(response.message || 'Login failed: Invalid response from server.');
            }
        }
        return response;
    },

    register: async (username, email, password) => {
        return apiRequest('/auth/register', 'POST', { username, email, password }, false);
    },

    logout: async () => {
        try {
            await apiRequest('/auth/logout', 'POST', null, false);
        } catch (error) {
            console.error("Logout API call failed:", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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
        const response = await apiRequest(`/bookings/my?page=${page}&size=${size}&sort=${sort}`, 'GET', null, true);
        return response;
    },

    getBookingById: async (bookingId) => {
        return apiRequest(`/bookings/${bookingId}`, 'GET', null, true);
    },

    cancelBooking: async (bookingId) => {
        return apiRequest(`/bookings/${bookingId}`, 'DELETE', null, true);
    },

    getAllBookingsForAdmin: async (page = 0, size = 10, sort = 'bookingTime,desc') => {
        return apiRequest(`/bookings/admin/all?page=${page}&size=${size}&sort=${sort}`, 'GET', null, true);
    }
};

async function refreshToken() {
    if (isRefreshingToken && tokenRefreshPromise) {
        return tokenRefreshPromise;
    }

    isRefreshingToken = true;
    tokenRefreshPromise = (async () => {
        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {}
            });

            if (!response.ok) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return false;
            }

            const data = await response.json();

            if (data.success && data.data && data.data.accessToken) {
                localStorage.setItem('token', data.data.accessToken);
                return true;
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return false;
            }
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return false;
        } finally {
            isRefreshingToken = false;
            tokenRefreshPromise = null;
        }
    })();
    return tokenRefreshPromise;
}
