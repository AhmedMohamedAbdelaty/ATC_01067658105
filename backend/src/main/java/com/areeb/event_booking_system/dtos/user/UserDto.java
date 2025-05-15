package com.areeb.event_booking_system.dtos.user;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto implements Serializable {

    @Schema(name = "UserResponse", description = "User details")
    @Builder
    @Data
    public static class UserResponseDto {
        @Schema(description = "Unique ID of the user")
        UUID id;
        @Schema(description = "Username")
        String username;
        @Schema(description = "Email address")
        String email;
        @Schema(description = "Timestamp of the last login")
        OffsetDateTime lastLogin;
        @Schema(description = "Timestamp of user creation")
        OffsetDateTime createdAt;
        @Schema(description = "Timestamp of last update")
        OffsetDateTime updatedAt;
    }
}
