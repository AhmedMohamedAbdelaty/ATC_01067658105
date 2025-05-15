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
import com.areeb.event_booking_system.mappers.UserMapper;
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
    private final UserMapper userMapper;

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
}
