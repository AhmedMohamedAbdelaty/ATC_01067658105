package com.areeb.event_booking_system.services.auth;

import java.time.OffsetDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.areeb.event_booking_system.config.security.JwtUtil;
import com.areeb.event_booking_system.dtos.auth.AuthDto.LoginRequest;
import com.areeb.event_booking_system.dtos.auth.AuthDto.LoginResponse;
import com.areeb.event_booking_system.dtos.auth.AuthDto.RegisterRequest;
import com.areeb.event_booking_system.dtos.user.UserDto.UserResponseDto;
import com.areeb.event_booking_system.models.user.Role;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.repository.RoleRepository;
import com.areeb.event_booking_system.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

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
        String accessToken = jwtUtil.generateToken(user);

        return LoginResponse.builder()
                .token(accessToken)
                .user(UserResponseDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .lastLogin(user.getLastLogin())
                        .createdAt(user.getCreatedAt())
                        .updatedAt(user.getUpdatedAt())
                        .build())
                .build();
    }

    @Override
    @Transactional
    public UserResponseDto register(RegisterRequest requestDto) {
        String username = requestDto.getUsername();
        String email = requestDto.getEmail();
        String password = requestDto.getPassword();

        if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) {
            throw new RuntimeException("Username or email already exists");
        }

        User newUser = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .build();

        // Set USER as default role
        Role defaultRole = roleRepository.findByName(Role.RoleType.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));
        newUser.getRoles().add(defaultRole);

        newUser = userRepository.save(newUser);
        return UserResponseDto.builder()
                .id(newUser.getId())
                .username(newUser.getUsername())
                .email(newUser.getEmail())
                .lastLogin(newUser.getLastLogin())
                .createdAt(newUser.getCreatedAt())
                .updatedAt(newUser.getUpdatedAt())
                .build();
    }
}
