package com.areeb.event_booking_system.services.auth;

import org.springframework.http.ResponseCookie;

import com.areeb.event_booking_system.dtos.auth.AuthDto;
import com.areeb.event_booking_system.dtos.user.UserDto;
import com.areeb.event_booking_system.models.auth.RefreshToken;

import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    AuthDto.LoginResponse login(AuthDto.LoginRequest requestDto);

    UserDto.UserResponseDto register(AuthDto.RegisterRequest requestDto);

    AuthDto.RefreshTokenResponse refreshToken(HttpServletRequest request);

    ResponseCookie logout(HttpServletRequest request);

    RefreshToken findRefreshToken(String token);

    void deleteRefreshToken(String token);
}
