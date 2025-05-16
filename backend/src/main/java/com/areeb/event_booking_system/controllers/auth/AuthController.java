package com.areeb.event_booking_system.controllers.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.areeb.event_booking_system.config.security.CookieUtil;
import com.areeb.event_booking_system.dtos.ResponseDto;
import com.areeb.event_booking_system.dtos.auth.AuthDto;
import com.areeb.event_booking_system.dtos.auth.AuthDto.LoginResponse;
import com.areeb.event_booking_system.dtos.auth.AuthDto.RefreshTokenResponse;
import com.areeb.event_booking_system.services.auth.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Auth API endpoints")
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Login user", description = "Authenticates a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully authenticated"),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<?> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        LoginResponse loginResponse = authService.login(request);
        String refreshTokenCookieHeader = cookieUtil.generateRefreshTokenCookieHeader(loginResponse.getRefreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookieHeader)
                .body(ResponseDto.success(loginResponse));
    }

    @PostMapping(value = "/register", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Register user", description = "Registers a new user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User successfully registered"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "409", description = "User already exists")
    })
    public ResponseEntity<?> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseDto.success(authService.register(request)));
    }

    @PostMapping(value = "/refresh", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Refresh token", description = "Refreshes an expired access token using a refresh token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token successfully refreshed"),
            @ApiResponse(responseCode = "401", description = "Invalid refresh token"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<?> refreshToken(
            @Parameter(name = "refresh_token", in = ParameterIn.COOKIE, description = "The refresh token", required = true) HttpServletRequest servletRequest) {
        RefreshTokenResponse refreshTokenResponse = authService.refreshToken(servletRequest);
        String newRefreshTokenCookieHeader = cookieUtil
                .generateRefreshTokenCookieHeader(refreshTokenResponse.getRefreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, newRefreshTokenCookieHeader)
                .body(ResponseDto.success(refreshTokenResponse));
    }

    @PostMapping(value = "/logout", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Logout user", description = "Logs out a user by invalidating their refresh token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully logged out"),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String logoutCookieHeader = authService.logout(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, logoutCookieHeader)
                .body(ResponseDto.success("Successfully logged out"));
    }
}
