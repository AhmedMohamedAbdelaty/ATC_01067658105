package com.areeb.event_booking_system.services.booking;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.repository.booking.BookingRepository;

import lombok.RequiredArgsConstructor;

@Service("bookingSecurityService")
@RequiredArgsConstructor
public class BookingSecurityService {
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public boolean isOwnerOfBooking(UUID bookingId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User currentUser)) {
            return false;
        }

        return bookingRepository.findByIdWithUserAndEvent(bookingId)
                .map(booking -> booking.getUser().getId().equals(currentUser.getId()))
                .orElse(false);
    }
}
