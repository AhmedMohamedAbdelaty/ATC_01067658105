package com.areeb.event_booking_system.dtos.event;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.areeb.event_booking_system.models.event.EventCategory;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventDto {

    @Data
    @Builder
    @Schema(name = "CreateEventRequest", description = "DTO for creating a new event")
    public static class CreateEventRequest {
        @NotBlank(message = "Event name cannot be blank")
        @Size(min = 3, max = 255)
        @Schema(description = "Name of the event", requiredMode = Schema.RequiredMode.REQUIRED)
        private String name;

        @Size(max = 5000, message = "Description can be up to 5000 characters")
        @Schema(description = "Detailed description of the event")
        private String description;

        @NotNull(message = "Event category cannot be null")
        @Schema(description = "Category of the event", requiredMode = Schema.RequiredMode.REQUIRED)
        @Enumerated(EnumType.STRING)
        private EventCategory category;

        @NotNull(message = "Event date cannot be null")
        @FutureOrPresent(message = "Event date must be in the present or future")
        @Schema(description = "Date and time of the event", requiredMode = Schema.RequiredMode.REQUIRED)
        private OffsetDateTime eventDate;

        @NotBlank(message = "Venue cannot be blank")
        @Size(max = 255)
        @Schema(description = "Location of the event", requiredMode = Schema.RequiredMode.REQUIRED)
        private String venue;

        @NotNull(message = "Price cannot be null")
        @DecimalMin(value = "0.0", inclusive = true)
        @Digits(integer = 8, fraction = 2)
        @Schema(description = "Ticket price for the event", requiredMode = Schema.RequiredMode.REQUIRED)
        private BigDecimal price;

        @Schema(description = "URL of the event image")
        private String imageUrl;

        @Min(value = 1, message = "Maximum capacity must be at least 1 if specified")
        @Schema(description = "Maximum number of attendees for the event (optional)", example = "500")
        private Integer maxCapacity;
    }

    @Data
    @Builder
    @Schema(name = "UpdateEventRequest", description = "DTO for updating an existing event (all fields optional)")
    public static class UpdateEventRequest {
        @Size(min = 3, max = 255)
        private String name;
        @Size(max = 5000)
        private String description;
        @Enumerated(EnumType.STRING)
        private EventCategory category;
        @FutureOrPresent
        private OffsetDateTime eventDate;
        @Size(max = 255)
        private String venue;
        @DecimalMin(value = "0.0", inclusive = true)
        @Digits(integer = 8, fraction = 2)
        private BigDecimal price;
        private String imageUrl;
        @Min(value = 1)
        private Integer maxCapacity;
    }

    @Data
    @Builder
    @Schema(name = "EventResponse", description = "DTO for event details in responses")
    public static class EventResponse {
        private UUID id;
        private String name;
        private String description;
        private EventCategory category;
        private OffsetDateTime eventDate;
        private String venue;
        private BigDecimal price;
        private String imageUrl;
        private Integer maxCapacity;
        private Integer currentBookingsCount;
        private Boolean isCurrentUserBooked;
        private String adminCreatorUsername;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
    }
}
