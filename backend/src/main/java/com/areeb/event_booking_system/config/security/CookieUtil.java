package com.areeb.event_booking_system.config.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class CookieUtil {

    public static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

    @Value("${app.cookie.domain:localhost}")
    private String cookieDomain;

    private static final int REFRESH_TOKEN_DURATION = 7 * 24 * 60 * 60; // 7 days

    public String generateRefreshTokenCookieHeader(String token) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(REFRESH_TOKEN_DURATION)
                .sameSite("None")
                .build();
        return cookie.toString();
    }

    public String getRefreshTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public String generateClearRefreshTokenCookieHeader() {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();
        return cookie.toString();
    }
}
