const API_URL = "/api/proxy";

async function apiRequest(endpoint: string, method = "GET", body: any = null, requiresAuth = true) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (requiresAuth) {
        const token = localStorage.getItem("token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    const url = `${API_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
            credentials: "include",
        });

        if (response.status === 204) {
            return { success: true, data: null };
        }

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || `API request failed with status ${response.status}`);
        }

        return responseData;
    } catch (error) {
        console.error("API Request Error:", error);
        throw error;
    }
}

const BookingsAPI = {
    getUserBookings: async (page = 0, size = 10) => {
        return await apiRequest(`/bookings/my?page=${page}&size=${size}`);
    },

    createBooking: async (eventId: string) => {
        return await apiRequest('/bookings', 'POST', { eventId });
    },

    getBookingById: async (bookingId: string) => {
        return await apiRequest(`/bookings/${bookingId}`);
    },

    cancelBooking: async (bookingId: string) => {
        return await apiRequest(`/bookings/${bookingId}`, 'DELETE');
    }
};

export default BookingsAPI;
