package com.areeb.event_booking_system.dtos.booking;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.areeb.event_booking_system.dtos.event.EventDto;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingDto {

    @Data
    @Builder
    @Schema(name = "CreateBookingRequest", description = "DTO for creating a new booking")
    public static class CreateBookingRequest {
        @NotNull(message = "Event ID cannot be null")
        @Schema(description = "ID of the event to book", requiredMode = Schema.RequiredMode.REQUIRED)
        private UUID eventId;
    }

    @Data
    @Builder
    @Schema(name = "BookingResponse", description = "DTO for booking details in responses")
    public static class BookingResponse {
        private UUID id;
        private EventDto.EventResponse eventDetails;
        private UUID userId;
        private String userUsername;
        private OffsetDateTime bookingTime;
        private OffsetDateTime createdAt;
    }
}
