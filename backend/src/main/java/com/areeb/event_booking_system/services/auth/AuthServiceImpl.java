package com.areeb.event_booking_system.services.auth;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CookieUtil cookieUtil;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {

        String email = loginRequest.getEmailOrUsername();
        String password = loginRequest.getPassword();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));

        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElseThrow(() -> new RuntimeException("User not found"));

        OffsetDateTime now = OffsetDateTime.now();
        user.setLastLogin(now);
        user = userRepository.save(user);

        // Create access token
        String accessToken = jwtUtil.generateAccessToken(user);

        // Create refresh token
        String refreshTokenString = UUID.randomUUID().toString();

        // Save refresh token to database
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenString)
                .expiryDate(OffsetDateTime.now().plusDays(7))
                .build();

        refreshTokenRepository.save(refreshToken);

        return LoginResponse.builder()
                .token(accessToken)
                .refreshToken(refreshTokenString)
                .user(userMapper.toUserResponseDto(user))
                .build();
    }

    @Override
    @Transactional
    public UserResponseDto register(RegisterRequest requestDto) {
        String username = requestDto.getUsername();
        String email = requestDto.getEmail();

        if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) {
            throw new RuntimeException("Username or email already exists");
        }

        User newUser = userMapper.toUser(requestDto);
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));

        // Set USER as default role
        Role defaultRole = roleRepository.findByName(Role.RoleType.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));
        newUser.getRoles().add(defaultRole);

        newUser = userRepository.save(newUser);
        return userMapper.toUserResponseDto(newUser);
    }

    @Override
    @Transactional
    public RefreshTokenResponse refreshToken(HttpServletRequest request) {

        String refreshTokenString = cookieUtil.getRefreshTokenFromCookies(request);

        if (refreshTokenString == null) {
            throw new RuntimeException("Refresh token is required");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token has expired");
        }

        User user = refreshToken.getUser();

        refreshTokenRepository.delete(refreshToken);

        String newAccessToken = jwtUtil.generateAccessToken(user);
        String newRefreshTokenString = UUID.randomUUID().toString();

        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .token(newRefreshTokenString)
                .expiryDate(OffsetDateTime.now().plusDays(7))
                .build();

        refreshTokenRepository.save(newRefreshToken);

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenString)
                .build();
    }

    @Override
    @Transactional
    public String logout(HttpServletRequest request) {
        String refreshTokenString = cookieUtil.getRefreshTokenFromCookies(request);
        if (refreshTokenString != null) {
            refreshTokenRepository.findByToken(refreshTokenString)
                    .ifPresent(refreshTokenRepository::delete);
        }
        return cookieUtil.generateClearRefreshTokenCookieHeader();
    }

    @Override
    @Transactional(readOnly = true)
    public RefreshToken findRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
    }

    @Override
    @Transactional
    public void deleteRefreshToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }
}
