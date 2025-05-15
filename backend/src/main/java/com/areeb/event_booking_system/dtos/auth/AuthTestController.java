package com.areeb.event_booking_system.dtos.auth;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class AuthTestController {

    @GetMapping("/open")
    public String openEndpoint() {
        return "Available for authenticated users";
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/admin")
    public String adminEndpoint() {
        return "Hello Admin!";
    }

    @PreAuthorize("hasAuthority('ROLE_USER')")
    @GetMapping("/user")
    public String userEndpoint() {
        return "Hello User!";
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/public")
    public String permitAllEndpoint() {
        return "Publicly available endpoint";
    }

}
