package com.areeb.event_booking_system.config.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true, prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtRequestFilter jwtRequestFilter;
    private final AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .logout(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers(SecurityConstants.PUBLIC_PATHS)
                        .permitAll()
                        .requestMatchers(SecurityConstants.ADMIN_PATHS)
                        .hasRole("ADMIN")
                        .requestMatchers("/**")
                        .permitAll() // Allow all endpoints marked with permitAll()
                        .anyRequest()
                        .authenticated())
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin())
                        .xssProtection(Customizer.withDefaults())
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self';" +
                                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;" +
                                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;" +
                                "font-src 'self' https://cdn.jsdelivr.net data:;" +
                                "img-src 'self' https: data:;" +
                                "connect-src 'self';" +
                                "form-action 'self';" +
                                "upgrade-insecure-requests;"
                                )))
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(SecurityConstants.ALLOWED_ORIGINS);
        configuration.setAllowedMethods(SecurityConstants.ALLOWED_METHODS);
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "Cache-Control",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Headers",
                "Origin"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        configuration.setExposedHeaders(List.of("Set-Cookie", "Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

}
