import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Helper to extract Authorization header
const getAuthHeader = (request: NextRequest): Record<string, string> => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
        return { "Authorization": authHeader };
    }
    return {};
}

// Define the context type based on Next.js 15 requirements for awaiting params
type ProxyRouteContextParams = { path: string[] };
type ProxyRouteContext = {
  params: Promise<ProxyRouteContextParams>
}

async function getPathFromContext(context: ProxyRouteContext | Promise<ProxyRouteContext>): Promise<string> {
    const resolvedContext = await Promise.resolve(context);
    if (!resolvedContext || !resolvedContext.params) {
        throw new Error("Invalid route context or params promise in proxy.");
    }

    const actualParamsObject = await resolvedContext.params; // Await the params object
    if (!actualParamsObject || !actualParamsObject.path) {
        throw new Error("Resolved params object or its path property is invalid.");
    }

    const pathValue = actualParamsObject.path; // pathValue is string[]

    if (!Array.isArray(pathValue)) {
        // This check might be redundant if types are correct, but good for safety
        throw new Error("Resolved path is not an array in proxy.");
    }
    return pathValue.join("/");
}

export async function GET(request: NextRequest, context: ProxyRouteContext | Promise<ProxyRouteContext>) {
    try {
        const path = await getPathFromContext(context);
        const searchParams = request.nextUrl.searchParams.toString()
        const url = `${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ""}`

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(request),
            },
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Proxy error (GET): upstream API returned error", response.status, errorText);
            return NextResponse.json({ success: false, error: `API error: ${response.status} ${errorText || response.statusText}` }, { status: response.status });
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Proxy error (GET):", error instanceof Error ? error.message : String(error))
        const errorMessage = error instanceof Error ? error.message : "Failed to process GET request in proxy";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
}

export async function POST(request: NextRequest, context: ProxyRouteContext | Promise<ProxyRouteContext>) {
    try {
        const path = await getPathFromContext(context);
        const url = `${API_BASE_URL}/${path}`

        const contentType = request.headers.get("content-type") || "";
        let response;

        // Handle FormData (multipart/form-data) differently than JSON
        if (contentType.includes("multipart/form-data")) {
            // Forward the FormData as is
            const formData = await request.formData();
            const headers = getAuthHeader(request);

            response = await fetch(url, {
                method: "POST",
                headers,
                body: formData,
            });
        } else if (contentType.includes("application/json")) {
            // Handle JSON requests
            let body;
            try {
                body = await request.json();
            } catch (jsonError) {
                console.error("Proxy error (POST) - JSON parsing error:", jsonError);
                const errorMessage = jsonError instanceof Error ? jsonError.message : "Invalid JSON body";
                return NextResponse.json({ success: false, error: `Invalid JSON body: ${errorMessage}` }, { status: 400 });
            }

            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader(request),
                },
                body: JSON.stringify(body),
            });
        } else {
            // Handle text/plain or other content types
            const textBody = await request.text();

            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": contentType,
                    ...getAuthHeader(request),
                },
                body: textBody || undefined,
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Proxy error (POST): upstream API returned error", response.status, errorText);
            let apiErrorData;
            try {
                apiErrorData = JSON.parse(errorText);
            } catch (e) {
                apiErrorData = { error: errorText || response.statusText };
            }
            return NextResponse.json({ success: false, ...apiErrorData }, { status: response.status });
        }

        // Handle 201 Created with potential body, or 204 No Content
        if (response.status === 201) {
            const responseText = await response.text();
            if (!responseText) return NextResponse.json({ success: true }, { status: 201 });
            try {
                 const data = JSON.parse(responseText);
                 return NextResponse.json(data, { status: 201 });
            } catch (e) {
                 return NextResponse.json({ success: true, message: responseText }, { status: 201 });
            }
        }
        if (response.status === 204) {
            return NextResponse.json({ success: true }, { status: 204 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy error (POST):", error instanceof Error ? error.message : String(error))
        const errorMessage = error instanceof Error ? error.message : "Failed to process POST request in proxy";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, context: ProxyRouteContext | Promise<ProxyRouteContext>) {
    try {
        const path = await getPathFromContext(context);
        const url = `${API_BASE_URL}/${path}`
        let body;

        const contentType = request.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            try {
                body = await request.json();
            } catch (jsonError) {
                console.error("Proxy error (PUT) - JSON parsing error:", jsonError);
                const errorMessage = jsonError instanceof Error ? jsonError.message : "Invalid JSON body";
                return NextResponse.json({ success: false, error: `Invalid JSON body: ${errorMessage}` }, { status: 400 });
            }
        } else {
            const textBody = await request.text();
            if (textBody) {
                console.warn("Proxy warning (PUT): Content-Type is not application/json, but body is present.");
                return NextResponse.json({ success: false, error: "Request body present but Content-Type is not application/json" }, { status: 415 });
            }
        }

        if (!body) {
             return NextResponse.json({ success: false, error: "Request body is required for PUT" }, { status: 400 });
        }

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(request),
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Proxy error (PUT): upstream API returned error", response.status, errorText);
            let apiErrorData;
            try {
                apiErrorData = JSON.parse(errorText);
            } catch (e) {
                apiErrorData = { error: errorText || response.statusText };
            }
            return NextResponse.json({ success: false, ...apiErrorData }, { status: response.status });
        }

        if (response.status === 204) {
            return NextResponse.json({ success: true }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy error (PUT):", error instanceof Error ? error.message : String(error))
        const errorMessage = error instanceof Error ? error.message : "Failed to process PUT request in proxy";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, context: ProxyRouteContext | Promise<ProxyRouteContext>) {
    try {
        const path = await getPathFromContext(context);
        const url = `${API_BASE_URL}/${path}`

        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                ...getAuthHeader(request),
            },
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Proxy error (DELETE): upstream API returned error", response.status, errorText);
             let apiErrorData;
            try {
                apiErrorData = JSON.parse(errorText);
            } catch (e) {
                apiErrorData = { error: errorText || response.statusText };
            }
            return NextResponse.json({ success: false, ...apiErrorData }, { status: response.status });
        }

        if (response.status === 204 || response.status === 200) {
            if (response.status === 204) {
                return NextResponse.json({ success: true, message: "Resource deleted successfully" }, { status: 204 });
            }
            const responseText = await response.text();
            if (!responseText) {
                 return NextResponse.json({ success: true, message: "Resource deleted successfully" }, { status: 200 });
            }
            try {
                const data = JSON.parse(responseText);
                return NextResponse.json(data.success !== undefined ? data : { success: true, data }, { status: 200 });
            } catch (e) {
                 return NextResponse.json({ success: true, message: responseText }, { status: 200 });
            }
        }

        const data = await response.json().catch(() => ({ success: true, message: "Operation successful, no content"}));
        return NextResponse.json(data);

    } catch (error) {
        console.error("Proxy error (DELETE):", error instanceof Error ? error.message : String(error))
        const errorMessage = error instanceof Error ? error.message : "Failed to process DELETE request in proxy";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
}
