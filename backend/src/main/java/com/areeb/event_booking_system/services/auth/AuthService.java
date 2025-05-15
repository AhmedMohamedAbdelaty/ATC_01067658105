package com.areeb.event_booking_system.services.auth;

import com.areeb.event_booking_system.dtos.auth.AuthDto;
import com.areeb.event_booking_system.dtos.user.UserDto;

public interface AuthService {
    AuthDto.LoginResponse login(AuthDto.LoginRequest requestDto);

    UserDto.UserResponseDto register(AuthDto.RegisterRequest requestDto);
}
