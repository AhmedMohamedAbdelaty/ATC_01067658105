import { toast } from "@/components/ui/use-toast"

// Use relative URL for API requests to use our proxy
const API_URL = "/api/proxy"
// Keep the original API base URL for assets
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

let isRefreshingToken = false
let tokenRefreshPromise: Promise<boolean> | null = null

async function apiRequest(endpoint: string, method = "GET", body: any = null, requiresAuth = true) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (requiresAuth) {
    await ensureValidAccessToken()
    const token = localStorage.getItem("token")
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  const url = `${API_URL}${endpoint}`
  console.log(`Making API request to: ${url}`)

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      credentials: "include",
      cache: "no-store"
    })

    if (response.status === 204) {
      return { success: true, data: null }
    }

    // Handle empty responses
    const responseText = await response.text()
    if (!responseText) {
      console.log("Empty response from API")
      return { success: true, data: null }
    }

    // Try to parse the response as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (error) {
      console.error("Failed to parse API response:", responseText)
      throw new Error(`API response is not valid JSON: ${responseText.substring(0, 100)}...`)
    }

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes("/auth/refresh")) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        if (typeof window !== "undefined" && !window.location.pathname.endsWith("login")) {
          window.location.href = "/login"
        }
        throw new Error(responseData.error || "Unauthorized access - please log in again.")
      }
      throw new Error(responseData.error || `API request failed with status ${response.status}`)
    }

    return responseData
  } catch (error) {
    console.error("API Request Error:", error)

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("Network error - Check if the API server is running and accessible")
      throw new Error(
        "Network error - Unable to connect to the API server. Please check your internet connection or try again later.",
      )
    }

    if (error instanceof Error) {
      throw error
    } else {
      throw new Error(String(error))
    }
  }
}

async function apiFormDataRequest(
  endpoint: string,
  method = "POST",
  formData: FormData | null = null,
  requiresAuth = true,
) {
  const headers: Record<string, string> = {}

  if (requiresAuth) {
    const token = localStorage.getItem("token")
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  const url = `${API_URL}${endpoint}`
  console.log(`Making API FormData request to: ${url}`)

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: formData,
      credentials: "include",
      cache: "no-store"
    })

    if (response.status === 204) {
      return { success: true, data: null }
    }

    // Handle empty responses
    const responseText = await response.text()
    if (!responseText) {
      console.log("Empty response from API")
      return { success: true, data: null }
    }

    // Try to parse the response as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (error) {
      console.error("Failed to parse API response:", responseText)
      throw new Error(`API response is not valid JSON: ${responseText.substring(0, 100)}...`)
    }

    if (!response.ok) {
      throw new Error(responseData.error || `API request failed with status ${response.status}`)
    }

    return responseData
  } catch (error) {
    console.error("API FormData Request Error:", error)
    throw error
  }
}

async function ensureValidAccessToken() {
  if (typeof window === "undefined") return

  const token = localStorage.getItem("token")
  if (!token) return

  // Check if token is expired or will expire soon (within 1 minute)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const expiryTime = payload.exp * 1000
    const isExpiredOrExpiringSoon = expiryTime < (Date.now() + 60000) // 60 seconds buffer

    if (isExpiredOrExpiringSoon) {
      console.log("Token is expired or expiring soon, attempting refresh")
      const refreshed = await refreshToken()
      if (!refreshed) {
        console.log("Token refresh failed, clearing auth state")
        localStorage.removeItem("token")
        localStorage.removeItem("user")

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.endsWith("login") &&
          !window.location.pathname.endsWith("register")
        ) {
          // Store the current URL to redirect back after login
          const currentPath = window.location.pathname
          if (currentPath !== "/" && !currentPath.includes("/login")) {
            sessionStorage.setItem("redirectAfterLogin", currentPath)
          }

          console.log("Redirecting to login page due to auth failure")
          window.location.href = "/login"
        }

        throw new Error("Token refresh failed. Please log in again.")
      } else {
        console.log("Token refreshed successfully")
      }
    }
  } catch (error) {
    console.error("Token validation error:", error)
    throw error
  }
}

async function refreshToken() {
  if (isRefreshingToken && tokenRefreshPromise) {
    console.log("Token refresh already in progress, waiting for result")
    return tokenRefreshPromise
  }

  isRefreshingToken = true
  console.log("Starting token refresh")

  tokenRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {},
      })

      if (!response.ok) {
        console.error(`Token refresh failed with status: ${response.status}`)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        return false
      }

      const data = await response.json()

      if (data.success && data.data && data.data.accessToken) {
        console.log("Received new access token")
        localStorage.setItem("token", data.data.accessToken)
        return true
      } else {
        console.error("Token refresh response did not contain a valid token")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        return false
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      return false
    } finally {
      isRefreshingToken = false
      tokenRefreshPromise = null
    }
  })()

  return tokenRefreshPromise
}

export const EventsAPI = {
  getAllEvents: async (page = 0, size = 10, sort = "eventDate,asc", category?: string) => {
    let endpoint = `/events?page=${page}&size=${size}&sort=${sort}`

    if (category && category !== "ALL") {
      const normalizedCategory = category.endsWith("S") ? category.slice(0, -1) : category
      endpoint = `/events/category/${normalizedCategory}?page=${page}&size=${size}&sort=${sort}`
    }

    return apiRequest(endpoint, "GET", null, false)
  },

  getEventById: async (eventId: string) => {
    return apiRequest(`/events/${eventId}`, "GET", null, false)
  },

  createEvent: async (eventData: any) => {
    return apiRequest("/events", "POST", eventData, true)
  },

  updateEvent: async (eventId: string, eventData: any) => {
    return apiRequest(`/events/${eventId}`, "PUT", eventData, true)
  },

  deleteEvent: async (eventId: string) => {
    return apiRequest(`/events/${eventId}`, "DELETE", null, true)
  },

  uploadEventImage: async (eventId: string, imageFile: File) => {
    const formData = new FormData()
    formData.append("imageFile", imageFile)
    return apiFormDataRequest(`/events/${eventId}/image`, "POST", formData, true)
  },

  deleteEventImage: async (eventId: string) => {
    return apiRequest(`/events/${eventId}/image`, "DELETE", null, true)
  },
}

export const BookingsAPI = {
  createBooking: async (eventId: string) => {
    return apiRequest("/bookings", "POST", { eventId }, true)
  },

  getUserBookings: async (page = 0, size = 10, sort = "bookingTime,desc") => {
    return apiRequest(`/bookings/my?page=${page}&size=${size}&sort=${sort}`, "GET", null, true)
  },

  getBookingById: async (bookingId: string) => {
    return apiRequest(`/bookings/${bookingId}`, "GET", null, true)
  },

  cancelBooking: async (bookingId: string) => {
    try {
      // apiRequest will throw an error if response.ok is false, which will be caught below.
      // If it doesn't throw, the operation was successful at the HTTP level.
      const responseData = await apiRequest(`/bookings/${bookingId}`, "DELETE", null, true);

      // Assuming successful DELETE by proxy might return { success: true, ... } or just be a 204/200
      // The proxy normalizes DELETE to return JSON, e.g. { success: true, message: "..." }
      if (responseData && (responseData.success || responseData.message)) {
        toast({
          title: "Booking Cancelled",
          description: responseData.message || "Your booking has been successfully cancelled.",
          variant: "default", // Explicitly default, can be success if you have that variant
        });
      } else {
        // This case might occur if apiRequest succeeded (e.g. 200 OK) but data indicates logical failure
        toast({
          title: "Cancellation Status Unknown",
          description: "The cancellation request was processed, but the outcome is unclear.",
          variant: "default",
        });
      }
      return responseData; // Return the data from apiRequest
    } catch (error) {
      // Errors thrown by apiRequest (network, HTTP error status) are already handled by handleApiError
      // in the page components that call this. We re-throw to let them handle it.
      // If we don't want the page to call handleApiError again, we can consume it here, but
      // typically API layer functions propagate errors.
      console.error("Cancel booking error in BookingsAPI:", error);
      // No need to toast here if page component's catch block will call handleApiError which toasts.
      throw error;
    }
  },
}

export function handleApiError(error: any) {
  console.error("API Error:", error)
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

  toast({
    variant: "destructive",
    title: "Error",
    description: errorMessage,
  })

  return errorMessage
}
