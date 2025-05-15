package com.areeb.event_booking_system.dtos.auth;

import com.areeb.event_booking_system.dtos.user.UserDto;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "LoginRequest", description = "DTO for user login request")
    public static class LoginRequest {
        @NotBlank(message = "Email or username cannot be blank")
        @Schema(description = "User's email address or username")
        private String emailOrUsername;

        @NotBlank(message = "Password cannot be blank")
        @Schema(description = "User's password")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "RegisterRequest", description = "DTO for user registration request")
    public static class RegisterRequest {
        @NotBlank(message = "Username cannot be blank")
        @Size(min = 3, max = 20, message = "Username must be between 3-20 characters")
        @Schema(description = "Desired username")
        private String username;

        @NotBlank(message = "Email cannot be blank")
        @Email(message = "Invalid email format")
        @Schema(description = "User's email address")
        private String email;

        @NotBlank(message = "Password cannot be blank")
        @Size(min = 8, message = "Password must be at least 8 characters")
        @Schema(description = "Desired password (min 8 characters)")
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(name = "LoginResponse", description = "DTO for user login response, containing the JWT token")
    public static class LoginResponse {
        @Schema(description = "JWT token")
        private String token;

        @Schema(description = "User details")
        private UserDto.UserResponseDto user;
    }
}
