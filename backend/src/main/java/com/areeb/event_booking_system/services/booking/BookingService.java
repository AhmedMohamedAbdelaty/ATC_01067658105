package com.areeb.event_booking_system.services.booking;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.areeb.event_booking_system.dtos.booking.BookingDto;
import com.areeb.event_booking_system.models.user.User;

public interface BookingService {
    BookingDto.BookingResponse createBooking(BookingDto.CreateBookingRequest createBookingRequest, User currentUser);

    void cancelBooking(UUID bookingId, User currentUser);

    Page<BookingDto.BookingResponse> getUserBookings(UUID userId, Pageable pageable);

    BookingDto.BookingResponse getBookingById(UUID bookingId, User currentUser);
}
