package com.areeb.event_booking_system.controllers;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.areeb.event_booking_system.dtos.ResponseDto;
import com.areeb.event_booking_system.dtos.event.EventDto;
import com.areeb.event_booking_system.models.event.EventCategory;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.services.event.EventService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Event Management", description = "APIs for managing events")
public class EventController {

    private final EventService eventService;

    @PostMapping
    @PreAuthorize("hasAuthority('EVENT_MANAGE_ALL')")
    @Operation(summary = "Create a new event", description = "Allows admins to create a new event.")
    public ResponseEntity<ResponseDto<?>> createEvent(
            @Valid @RequestBody EventDto.CreateEventRequest createEventRequest,
            @Parameter(hidden = true) @AuthenticationPrincipal User currentUser) {
        EventDto.EventResponse createdEvent = eventService.createEvent(createEventRequest, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDto.success(createdEvent));
    }

    @GetMapping
    @Operation(summary = "Get all events", description = "Get a list of all events with pagination and sorting.")
    @Parameters({
            @Parameter(name = "page", description = "Page number (0-indexed)", in = ParameterIn.QUERY, schema = @Schema(type = "integer", defaultValue = "0")),
            @Parameter(name = "size", description = "Number of items per page", in = ParameterIn.QUERY, schema = @Schema(type = "integer", defaultValue = "10")),
            @Parameter(name = "sort", description = "Sorting criteria in the format: property(,asc|desc). ", in = ParameterIn.QUERY, array = @ArraySchema(schema = @Schema(type = "string", example = "price,desc")))
    })
    public ResponseEntity<ResponseDto<?>> getAllEvents(
            @Parameter(hidden = true) @PageableDefault(size = 10, sort = "eventDate") Pageable pageable) {
        Page<EventDto.EventResponse> eventsPage = eventService.getAllEvents(pageable);
        return ResponseEntity.ok(ResponseDto.success(eventsPage));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get events by category", description = "Retrieves events filtered by a specific category.")
    @Parameters({
            @Parameter(name = "category", description = "Category of the events", in = ParameterIn.PATH, required = true, schema = @Schema(implementation = EventCategory.class)),
            @Parameter(name = "page", description = "Page number (0-indexed)", in = ParameterIn.QUERY, schema = @Schema(type = "integer", defaultValue = "0")),
            @Parameter(name = "size", description = "Number of items per page", in = ParameterIn.QUERY, schema = @Schema(type = "integer", defaultValue = "10")),
            @Parameter(name = "sort", description = "Sorting criteria in the format: property(,asc|desc). ", in = ParameterIn.QUERY, array = @ArraySchema(schema = @Schema(type = "string", example = "eventDate,asc")))
    })
    public ResponseEntity<ResponseDto<Page<EventDto.EventResponse>>> getEventsByCategory(
            @PathVariable EventCategory category,
            @Parameter(hidden = true) @PageableDefault(size = 10, sort = "eventDate") Pageable pageable) {
        Page<EventDto.EventResponse> eventsPage = eventService.getEventsByCategory(category, pageable);
        return ResponseEntity.ok(ResponseDto.success(eventsPage));
    }

    @GetMapping("/{eventId}")
    @Operation(summary = "Get event by ID", description = "Retrieves an event by its ID")
    public ResponseEntity<ResponseDto<EventDto.EventResponse>> getEventById(@PathVariable UUID eventId) {
        EventDto.EventResponse event = eventService.getEventById(eventId);
        return ResponseEntity.ok(ResponseDto.success(event));
    }

    @PutMapping("/{eventId}")
    @PreAuthorize("hasAuthority('EVENT_MANAGE_ALL')")
    @Operation(summary = "Update an existing event", description = "Allows admins to update an existing event.")
    public ResponseEntity<ResponseDto<EventDto.EventResponse>> updateEvent(
            @PathVariable UUID eventId,
            @Valid @RequestBody EventDto.UpdateEventRequest updateEventRequest,
            @Parameter(hidden = true) @AuthenticationPrincipal User currentUser) {
        EventDto.EventResponse updatedEvent = eventService.updateEvent(eventId, updateEventRequest, currentUser);
        return ResponseEntity.ok(ResponseDto.success(updatedEvent));
    }

    @DeleteMapping("/{eventId}")
    @PreAuthorize("hasAuthority('EVENT_MANAGE_ALL')")
    @Operation(summary = "Delete an event", description = "Allows admins to delete an event.")
    public ResponseEntity<ResponseDto<?>> deleteEvent(
            @PathVariable UUID eventId,
            @Parameter(hidden = true) @AuthenticationPrincipal User currentUser) {
        eventService.deleteEvent(eventId, currentUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(ResponseDto.success("Event deleted successfully."));
    }
}
