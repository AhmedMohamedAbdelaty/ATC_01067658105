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
            "http://localhost:8080",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://zesty-maire-ahmed-muhammed-e26b0e5b.koyeb.app",
            "https://*.koyeb.app");

    public static final List<String> ALLOWED_METHODS = List.of(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");

    public static final List<String> EXPOSED_HEADERS = List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "X-Requested-With",
            "Cache-Control");
}
