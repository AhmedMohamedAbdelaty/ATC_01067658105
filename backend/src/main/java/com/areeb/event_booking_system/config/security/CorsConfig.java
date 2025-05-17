package com.areeb.event_booking_system.config.security;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);

        // Add specific origins instead of wildcard pattern for better security
        config.addAllowedOrigin("https://v0-ebs-git-new-ui-ahmedmohamedabdelatys-projects.vercel.app");
        config.addAllowedOrigin("https://v0-ebs-one.vercel.app");
        config.addAllowedOrigin("https://v0-ebs.vercel.app");
        config.addAllowedOrigin("http://localhost:3000");

        // You can add a wildcard pattern as a fallback, but it's better to be specific
        config.addAllowedOriginPattern("*");

        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie", "Content-Disposition"));

        // Increase max age for OPTIONS preflight cache
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
