const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
            cache: "no-store"
        });

        if (response.status === 204) {
            return { success: true, data: null };
        }

        // Handle empty responses
        const responseText = await response.text();
        if (!responseText) {
            console.log("Empty response from API");
            return { success: true, data: null };
        }

        // Try to parse the response as JSON
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (error) {
            console.error("Failed to parse API response:", responseText);
            throw new Error(`API response is not valid JSON: ${responseText.substring(0, 100)}...`);
        }

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
