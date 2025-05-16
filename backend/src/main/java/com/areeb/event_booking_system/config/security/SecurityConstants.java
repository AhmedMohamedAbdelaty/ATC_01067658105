package com.areeb.event_booking_system.config.security;

import java.util.List;

public final class SecurityConstants {
    private SecurityConstants() {
    }

    public static final String[] PUBLIC_PATHS = {
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/webjars/**",
    };

    public static final String[] ADMIN_PATHS = {
    };

    public static final List<String> ALLOWED_ORIGINS = List.of(
            "http://localhost:8080");

    public static final List<String> ALLOWED_METHODS = List.of(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");

    public static final List<String> EXPOSED_HEADERS = List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "X-Requested-With",
            "Cache-Control");
}
