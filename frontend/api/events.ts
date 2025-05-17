interface EventData {
    name: string;
    description?: string;
    category: string;
    eventDate: string;
    venue: string;
    price: number;
    maxCapacity?: number | null;
    imageUrl?: string | null;
    [key: string]: any;
}

const API_URL = "/api/proxy";

// Implementation matches what's in lib/api.ts but simpler for our use case
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

async function apiFormDataRequest(
    endpoint: string,
    method = "POST",
    formData: FormData | null = null,
    requiresAuth = true,
) {
    const headers: Record<string, string> = {};

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
            body: formData,
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
        console.error("API FormData Request Error:", error);
        throw error;
    }
}

const EventsAPI = {
    /**
     * Get all events with pagination
     */
    getAllEvents: async (page = 0, size = 10, sort = 'eventDate,asc', category?: string) => {
        let endpoint = `/events?page=${page}&size=${size}&sort=${sort}`;
        if (category) {
            endpoint = `/events/category/${category}?page=${page}&size=${size}&sort=${sort}`;
        }
        return await apiRequest(endpoint);
    },

    /**
     * Get event by ID
     */
    getEventById: async (eventId: string) => {
        return await apiRequest(`/events/${eventId}`);
    },

    /**
     * Create a new event
     */
    createEvent: async (eventData: EventData) => {
        return await apiRequest('/events', 'POST', eventData);
    },

    /**
     * Update an existing event
     */
    updateEvent: async (eventId: string, eventData: EventData) => {
        return await apiRequest(`/events/${eventId}`, 'PUT', eventData);
    },

    /**
     * Delete an event
     */
    deleteEvent: async (eventId: string) => {
        return await apiRequest(`/events/${eventId}`, 'DELETE');
    },

    /**
     * Upload an image for an event
     */
    uploadEventImage: async (eventId: string, imageFile: File) => {
        const formData = new FormData();
        formData.append('imageFile', imageFile);
        return await apiFormDataRequest(`/events/${eventId}/image`, 'POST', formData);
    },

    /**
     * Delete an event image
     */
    deleteEventImage: async (eventId: string) => {
        return await apiRequest(`/events/${eventId}/image`, 'DELETE');
    }
};

export default EventsAPI;
