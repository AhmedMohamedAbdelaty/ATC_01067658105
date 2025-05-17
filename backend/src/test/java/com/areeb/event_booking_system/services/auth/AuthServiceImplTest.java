package com.areeb.event_booking_system.services.auth;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.areeb.event_booking_system.config.security.CookieUtil;
import com.areeb.event_booking_system.config.security.JwtUtil;
import com.areeb.event_booking_system.dtos.auth.AuthDto.LoginRequest;
import com.areeb.event_booking_system.dtos.auth.AuthDto.LoginResponse;
import com.areeb.event_booking_system.dtos.auth.AuthDto.RefreshTokenResponse;
import com.areeb.event_booking_system.dtos.auth.AuthDto.RegisterRequest;
import com.areeb.event_booking_system.dtos.user.UserDto.UserResponseDto;
import com.areeb.event_booking_system.mappers.UserMapper;
import com.areeb.event_booking_system.models.auth.RefreshToken;
import com.areeb.event_booking_system.models.user.Role;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.repository.RefreshTokenRepository;
import com.areeb.event_booking_system.repository.RoleRepository;
import com.areeb.event_booking_system.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private CookieUtil cookieUtil;
    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private AuthServiceImpl authService;

    private User user;
    private Role userRole;
    private UserResponseDto userResponseDto;
    private LoginRequest loginRequest;
    private RegisterRequest registerRequest;
    private RefreshToken refreshToken;
    private UUID userId;
    private UUID refreshTokenId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        refreshTokenId = UUID.randomUUID();

        userRole = new Role();
        userRole.setId(1L);
        userRole.setName(Role.RoleType.ROLE_USER);

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        user = User.builder()
                .id(userId)
                .username("ahmed")
                .email("ahmed@gmail.com")
                .password("password")
                .roles(roles)
                .build();

        userResponseDto = UserResponseDto.builder()
                .id(userId)
                .username("ahmed")
                .email("ahmed@gmail.com")
                .build();

        loginRequest = new LoginRequest("ahmed@gmail.com", "password");
        registerRequest = new RegisterRequest("ahmed", "ahmed@gmail.com", "password");

        refreshToken = RefreshToken.builder()
                .id(refreshTokenId)
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(OffsetDateTime.now().plusDays(7))
                .build();
    }

    @Test
    void login_Success() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail(loginRequest.getEmailOrUsername())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtUtil.generateAccessToken(user)).thenReturn("accessToken");
        when(userMapper.toUserResponseDto(user)).thenReturn(userResponseDto);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(refreshToken);

        LoginResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("accessToken", response.getToken());
        assertNotNull(response.getRefreshToken());
        assertEquals(userResponseDto, response.getUser());
        verify(userRepository).save(user);
    }

    @Test
    void login_UserNotFound() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail(loginRequest.getEmailOrUsername())).thenReturn(Optional.empty());
        when(userRepository.findByUsername(loginRequest.getEmailOrUsername())).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void login_BadCredentials() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        Exception exception = assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
        assertEquals("Bad credentials", exception.getMessage());
    }

    @Test
    void register_Success() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);

        User newUserFromRequest = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(registerRequest.getPassword())
                .roles(new HashSet<>())
                .build();

        User userAfterSave = User.builder()
                .id(UUID.randomUUID())
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password("encodedPassword")
                .roles(Set.of(userRole))
                .build();

        UserResponseDto expectedResponseDto = UserResponseDto.builder()
                .id(userAfterSave.getId())
                .username(userAfterSave.getUsername())
                .email(userAfterSave.getEmail())
                .build();

        when(userMapper.toUser(registerRequest)).thenReturn(newUserFromRequest);
        when(passwordEncoder.encode(newUserFromRequest.getPassword())).thenReturn("encodedPassword");
        when(roleRepository.findByName(Role.RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
        ArgumentCaptor<User> userArgumentCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userArgumentCaptor.capture())).thenReturn(userAfterSave);
        when(userMapper.toUserResponseDto(userAfterSave)).thenReturn(expectedResponseDto);

        UserResponseDto response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals(expectedResponseDto.getUsername(), response.getUsername());
        assertEquals(expectedResponseDto.getId(), response.getId());

        User capturedUser = userArgumentCaptor.getValue();
        assertEquals(registerRequest.getUsername(), capturedUser.getName());
        assertEquals(registerRequest.getEmail(), capturedUser.getEmail());
        assertEquals("encodedPassword", capturedUser.getPassword());
        assertTrue(capturedUser.getRoles().contains(userRole));
        assertEquals(1, capturedUser.getRoles().size());
        assertNull(capturedUser.getId());

        verify(userMapper).toUserResponseDto(userAfterSave);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_UsernameExists() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(true);

        Exception exception = assertThrows(RuntimeException.class, () -> authService.register(registerRequest));
        assertEquals("Username or email already exists", exception.getMessage());
    }

    @Test
    void register_EmailExists() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        Exception exception = assertThrows(RuntimeException.class, () -> authService.register(registerRequest));
        assertEquals("Username or email already exists", exception.getMessage());
    }

    @Test
    void register_DefaultRoleNotFound() {
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(userMapper.toUser(registerRequest)).thenReturn(user);
        when(passwordEncoder.encode(user.getPassword())).thenReturn("encodedPassword");
        when(roleRepository.findByName(Role.RoleType.ROLE_USER)).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> authService.register(registerRequest));
        assertEquals("Default role not found", exception.getMessage());
    }

    @Test
    void refreshToken_Success() {
        String oldTokenString = refreshToken.getToken();
        when(cookieUtil.getRefreshTokenFromCookies(httpServletRequest)).thenReturn(oldTokenString);
        when(refreshTokenRepository.findByToken(oldTokenString)).thenReturn(Optional.of(refreshToken));
        when(jwtUtil.generateAccessToken(user)).thenReturn("newAccessToken");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(refreshToken); // Mock saving new token

        RefreshTokenResponse response = authService.refreshToken(httpServletRequest);

        assertNotNull(response);
        assertEquals("newAccessToken", response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertNotEquals(oldTokenString, response.getRefreshToken()); // Ensure a new refresh token is generated
        verify(refreshTokenRepository).delete(refreshToken);
        verify(refreshTokenRepository).save(argThat(savedToken -> !savedToken.getToken().equals(oldTokenString)));
    }

    @Test
    void refreshToken_TokenRequired() {
        when(cookieUtil.getRefreshTokenFromCookies(httpServletRequest)).thenReturn(null);

        Exception exception = assertThrows(RuntimeException.class, () -> authService.refreshToken(httpServletRequest));
        assertEquals("Refresh token is required", exception.getMessage());
    }

    @Test
    void refreshToken_TokenNotFound() {
        String tokenString = "nonExistentToken";
        when(cookieUtil.getRefreshTokenFromCookies(httpServletRequest)).thenReturn(tokenString);
        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> authService.refreshToken(httpServletRequest));
        assertEquals("Refresh token not found", exception.getMessage());
    }

    @Test
    void refreshToken_TokenExpired() {
        refreshToken.setExpiryDate(OffsetDateTime.now().minusDays(1)); // Make token expired
        String tokenString = refreshToken.getToken();
        when(cookieUtil.getRefreshTokenFromCookies(httpServletRequest)).thenReturn(tokenString);
        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.of(refreshToken));

        Exception exception = assertThrows(RuntimeException.class, () -> authService.refreshToken(httpServletRequest));
        assertEquals("Refresh token has expired", exception.getMessage());
        verify(refreshTokenRepository).delete(refreshToken);
    }

    @Test
    void logout_WithToken() {
        String tokenString = refreshToken.getToken();
        when(cookieUtil.getRefreshTokenFromCookies(httpServletRequest)).thenReturn(tokenString);
        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.of(refreshToken));
        when(cookieUtil.generateClearRefreshTokenCookieHeader()).thenReturn("Clear-Cookie-Header");

        String result = authService.logout(httpServletRequest);

        assertEquals("Clear-Cookie-Header", result);
        verify(refreshTokenRepository).delete(refreshToken);
    }

    @Test
    void logout_WithoutToken() {
        when(cookieUtil.getRefreshTokenFromCookies(httpServletRequest)).thenReturn(null);
        when(cookieUtil.generateClearRefreshTokenCookieHeader()).thenReturn("Clear-Cookie-Header");

        String result = authService.logout(httpServletRequest);

        assertEquals("Clear-Cookie-Header", result);
        verify(refreshTokenRepository, never()).findByToken(anyString());
        verify(refreshTokenRepository, never()).delete(any(RefreshToken.class));
    }

    @Test
    void findRefreshToken_Success() {
        String tokenString = refreshToken.getToken();
        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.of(refreshToken));

        RefreshToken foundToken = authService.findRefreshToken(tokenString);

        assertNotNull(foundToken);
        assertEquals(tokenString, foundToken.getToken());
    }

    @Test
    void findRefreshToken_NotFound() {
        String tokenString = "nonExistentToken";
        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> authService.findRefreshToken(tokenString));
        assertEquals("Refresh token not found", exception.getMessage());
    }

    @Test
    void deleteRefreshToken_Success() {
        String tokenString = "tokenToDelete";
        doNothing().when(refreshTokenRepository).deleteByToken(tokenString);

        assertDoesNotThrow(() -> authService.deleteRefreshToken(tokenString));
        verify(refreshTokenRepository).deleteByToken(tokenString);
    }
}
