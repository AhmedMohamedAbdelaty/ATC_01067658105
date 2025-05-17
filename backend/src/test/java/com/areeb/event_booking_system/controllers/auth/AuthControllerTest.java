package com.areeb.event_booking_system.controllers.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.areeb.event_booking_system.config.security.AuthEntryPointJwt;
import com.areeb.event_booking_system.config.security.CookieUtil;
import com.areeb.event_booking_system.config.security.JwtUtil;
import com.areeb.event_booking_system.config.security.SecurityConfig;
import com.areeb.event_booking_system.dtos.auth.AuthDto;
import com.areeb.event_booking_system.dtos.user.UserDto;
import com.areeb.event_booking_system.services.auth.AuthService;
import com.areeb.event_booking_system.services.auth.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CookieUtil cookieUtil;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private AuthEntryPointJwt authEntryPointJwt;

    @Autowired
    private ObjectMapper objectMapper;

    private AuthDto.LoginRequest loginRequest;
    private AuthDto.LoginResponse loginResponse;
    private AuthDto.RegisterRequest registerRequest;
    private UserDto.UserResponseDto userResponseDto;
    private AuthDto.RefreshTokenResponse refreshTokenResponse;
    private String MOCK_ACCESS_TOKEN = "mockAccessToken";
    private String MOCK_REFRESH_TOKEN = "mockRefreshToken";
    private String MOCK_NEW_REFRESH_TOKEN = "newMockRefreshToken";

    @BeforeEach
    void setUp() {
        loginRequest = new AuthDto.LoginRequest("test@example.com", "password");
        userResponseDto = UserDto.UserResponseDto.builder()
                .id(UUID.randomUUID())
                .username("testUser")
                .email("test@example.com")
                .build();
        loginResponse = new AuthDto.LoginResponse(MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN, userResponseDto);

        registerRequest = new AuthDto.RegisterRequest("testUser", "test@example.com", "password");

        refreshTokenResponse = new AuthDto.RefreshTokenResponse(MOCK_ACCESS_TOKEN, MOCK_NEW_REFRESH_TOKEN);
    }

    @Test
    void login_Success() throws Exception {
        when(authService.login(any(AuthDto.LoginRequest.class))).thenReturn(loginResponse);
        when(cookieUtil.generateRefreshTokenCookieHeader(MOCK_REFRESH_TOKEN)).thenReturn("refreshToken="
                + MOCK_REFRESH_TOKEN + "; HttpOnly; Path=/api/auth/refresh; Max-Age=604800; SameSite=Lax");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value(MOCK_ACCESS_TOKEN))
                .andExpect(jsonPath("$.data.user.username").value(userResponseDto.getUsername()))
                .andExpect(jsonPath("$.data.refreshToken").value(MOCK_REFRESH_TOKEN));

        verify(cookieUtil).generateRefreshTokenCookieHeader(MOCK_REFRESH_TOKEN);
    }

    @Test
    void login_InvalidRequest_ShouldReturnBadRequest() throws Exception {
        AuthDto.LoginRequest invalidLoginRequest = new AuthDto.LoginRequest(null, ""); // Invalid data

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidLoginRequest))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void register_Success() throws Exception {
        when(authService.register(any(AuthDto.RegisterRequest.class))).thenReturn(userResponseDto);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest))
                .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value(userResponseDto.getUsername()));
    }

    @Test
    void register_InvalidRequest_ShouldReturnBadRequest() throws Exception {
        AuthDto.RegisterRequest invalidRegisterRequest = new AuthDto.RegisterRequest("usr", "", "pass"); // Invalid data

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRegisterRequest))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void refreshToken_Success() throws Exception {
        Cookie mockCookie = new Cookie("refresh_token", MOCK_REFRESH_TOKEN);
        when(authService.refreshToken(any())).thenReturn(refreshTokenResponse);
        when(cookieUtil.generateRefreshTokenCookieHeader(MOCK_NEW_REFRESH_TOKEN)).thenReturn("refreshToken="
                + MOCK_NEW_REFRESH_TOKEN + "; HttpOnly; Path=/api/auth/refresh; Max-Age=604800; SameSite=Lax");

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(mockCookie)
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value(MOCK_ACCESS_TOKEN))
                .andExpect(jsonPath("$.data.refreshToken").value(MOCK_NEW_REFRESH_TOKEN));
        verify(cookieUtil).generateRefreshTokenCookieHeader(MOCK_NEW_REFRESH_TOKEN);
    }

    @Test
    void refreshToken_MissingCookie_ShouldReturnBadRequest() throws Exception {
        when(authService.refreshToken(any())).thenThrow(new RuntimeException("Refresh token is required"));

        mockMvc.perform(post("/api/auth/refresh") // No cookie provided
                .with(csrf()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("An unexpected error occurred: Refresh token is required"));
    }

    @Test
    void logout_Success() throws Exception {
        String clearCookieHeader = "refreshToken=; HttpOnly; Path=/api/auth/refresh; Max-Age=0; SameSite=Lax";
        when(authService.logout(any())).thenReturn(clearCookieHeader);

        mockMvc.perform(post("/api/auth/logout")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Successfully logged out"));
        verify(authService).logout(any());
    }
}
