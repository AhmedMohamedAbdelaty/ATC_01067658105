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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.areeb.event_booking_system.dtos.ResponseDto;
import com.areeb.event_booking_system.dtos.booking.BookingDto;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.services.booking.BookingService;

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
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Booking Management", description = "APIs for managing event bookings")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAuthority('BOOKING_MANAGE_OWN')")
    @Operation(summary = "Create a new booking", description = "Allows authenticated users to book an event.")
    public ResponseEntity<ResponseDto<?>> createBooking(
            @Valid @RequestBody BookingDto.CreateBookingRequest createBookingRequest,
            @Parameter(hidden = true) @AuthenticationPrincipal User currentUser) {
        BookingDto.BookingResponse createdBooking = bookingService.createBooking(createBookingRequest, currentUser);
        return new ResponseEntity<>(ResponseDto.success(createdBooking), HttpStatus.CREATED);
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('BOOKING_MANAGE_OWN')")
    @Operation(summary = "Get current user's bookings", description = "Get a list of bookings for the currentl authenticated user.")
    @Parameters({
            @Parameter(name = "page", description = "Page number (0-indexed)", in = ParameterIn.QUERY, schema = @Schema(type = "integer", defaultValue = "0")),
            @Parameter(name = "size", description = "Number of items per page", in = ParameterIn.QUERY, schema = @Schema(type = "integer", defaultValue = "10")),
            @Parameter(name = "sort", description = "Sorting criteria in the format: property(,asc|desc). Default sort is by booking time descending.", in = ParameterIn.QUERY, array = @ArraySchema(schema = @Schema(type = "string", example = "bookingTime,desc")))
    })
    public ResponseEntity<ResponseDto<?>> getCurrentUserBookings(
            @Parameter(hidden = true) @AuthenticationPrincipal User currentUser,
            @Parameter(hidden = true) @PageableDefault(size = 10, sort = "bookingTime") Pageable pageable) {
        Page<BookingDto.BookingResponse> bookingsPage = bookingService.getUserBookings(currentUser.getId(), pageable);
        return ResponseEntity.ok(ResponseDto.success(bookingsPage));
    }

    @GetMapping("/{bookingId}")
    @PreAuthorize("hasAuthority('BOOKING_MANAGE_OWN')")
    @Operation(summary = "Get a specific booking by ID", description = "Retrieves a specific booking by its ID. User must own the booking or be an admin.")
    public ResponseEntity<ResponseDto<?>> getBookingById(
            @PathVariable UUID bookingId,
            @Parameter(hidden = true) @AuthenticationPrincipal User currentUser) {
        BookingDto.BookingResponse booking = bookingService.getBookingById(bookingId, currentUser);
        return ResponseEntity.ok(ResponseDto.success(booking));
    }

    @DeleteMapping("/{bookingId}")
    @PreAuthorize("hasAuthority('BOOKING_MANAGE_OWN')")
    @Operation(summary = "Cancel a booking", description = "Allows authenticated users to cancel their own booking.")
    public ResponseEntity<ResponseDto<?>> cancelBooking(
            @PathVariable UUID bookingId,
            @Parameter(hidden = true) @AuthenticationPrincipal User currentUser) {
        bookingService.cancelBooking(bookingId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
