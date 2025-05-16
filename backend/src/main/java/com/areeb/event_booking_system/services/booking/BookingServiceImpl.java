package com.areeb.event_booking_system.services.booking;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.areeb.event_booking_system.dtos.booking.BookingDto;
import com.areeb.event_booking_system.exceptions.ResourceNotFoundException;
import com.areeb.event_booking_system.mappers.BookingMapper;
import com.areeb.event_booking_system.models.booking.Booking;
import com.areeb.event_booking_system.models.event.Event;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.repository.booking.BookingRepository;
import com.areeb.event_booking_system.repository.event.EventRepository;

import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final BookingMapper bookingMapper;

    @Override
    @Transactional
    public BookingDto.BookingResponse createBooking(BookingDto.CreateBookingRequest createBookingRequest,
            User currentUser) {
        log.info("User {} attempting to book event {}", currentUser.getUsername(), createBookingRequest.getEventId());

        Event event = eventRepository.findById(createBookingRequest.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", createBookingRequest.getEventId()));

        if (event.getEventDate().isBefore(OffsetDateTime.now())) {
            log.warn("Attempt to book past event {}: {}", event.getId(), event.getName());
            throw new IllegalArgumentException("Cannot book an event that has already passed.");
        }

        if (bookingRepository.existsByUserIdAndEventId(currentUser.getId(), event.getId())) {
            log.warn("User {} already booked event {}.", currentUser.getUsername(), event.getId());
            throw new DataIntegrityViolationException("You have already booked this event.");
        }

        // capacity check and optimistic locking retry
        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                Event currentEventVersion = eventRepository.findById(event.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Event", "id", event.getId()));

                if (currentEventVersion.getMaxCapacity() != null
                        && currentEventVersion.getCurrentBookingsCount() >= currentEventVersion.getMaxCapacity()) {
                    log.warn("Event {} is fully booked. Capacity: {}, Booked: {}",
                            currentEventVersion.getId(), currentEventVersion.getMaxCapacity(),
                            currentEventVersion.getCurrentBookingsCount());
                    throw new IllegalStateException("Event is fully booked. No more tickets available.");
                }

                // Increment booking count
                currentEventVersion.setCurrentBookingsCount(currentEventVersion.getCurrentBookingsCount() + 1);
                eventRepository.saveAndFlush(currentEventVersion);

                // No problems, create booking
                Booking booking = bookingMapper.createRequestToBooking(createBookingRequest, currentUser,
                        currentEventVersion);
                Booking savedBooking = bookingRepository.save(booking);
                log.info("User {} successfully booked event {}. Booking ID: {}", currentUser.getUsername(),
                        event.getId(), savedBooking.getId());

                return bookingMapper.bookingToBookingResponse(savedBooking);

            } catch (OptimisticLockException ole) {
                log.warn("Optimistic lock conflict for event {} on attempt {}. Retrying...", event.getId(),
                        attempt + 1);
                if (attempt == maxRetries - 1) {
                    log.error("Failed to book event {} after {} retries due to optimistic locking.", event.getId(),
                            maxRetries);
                    throw new IllegalStateException("Failed to book event due to high contention. Please try again.",
                            ole);
                }
                try {
                    Thread.sleep(50);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                    log.error("Thread interrupted during booking retry for event {}", event.getId());
                }
            }
        }
        throw new IllegalStateException("Booking process failed unexpectedly after retries.");
    }

    @Override
    @Transactional
    public void cancelBooking(UUID bookingId, User currentUser) {
        log.info("User {} attempting to cancel booking {}", currentUser.getUsername(), bookingId);
        Booking booking = bookingRepository.findByIdWithUserAndEvent(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not authorized to cancel this booking.");
        }

        UUID eventId = booking.getEvent().getId();

        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                Event currentEventVersion = eventRepository.findById(eventId)
                        .orElseThrow(() -> {
                            return new ResourceNotFoundException("Event", "id", eventId);
                        });

                if (currentEventVersion.getCurrentBookingsCount() > 0) {
                    currentEventVersion.setCurrentBookingsCount(currentEventVersion.getCurrentBookingsCount() - 1);
                    eventRepository.saveAndFlush(currentEventVersion);
                }

                // No problems, delete booking
                bookingRepository.delete(booking);
                log.info("Booking {} cancelled successfully by user {}. Event count updated for event {}.",
                        bookingId, currentUser.getUsername(), eventId);
                return;

            } catch (OptimisticLockException ole) {
                if (attempt == maxRetries - 1) {
                    throw new IllegalStateException(
                            "Failed to cancel booking due to high contention on event data. Please try again.", ole);
                }
            }
        }
        throw new IllegalStateException("Booking cancellation failed unexpectedly after retries for event " + eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingDto.BookingResponse> getUserBookings(UUID userId, Pageable pageable) {
        log.debug("Fetching bookings for user id: {} with pageable: {}", userId, pageable);
        Page<Booking> bookingsPage = bookingRepository.findByUserIdWithUserAndEvent(userId, pageable);
        return bookingsPage.map(bookingMapper::bookingToBookingResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('BOOKING_MANAGE_ALL') or @bookingSecurityService.isOwnerOfBooking(#bookingId)")
    public BookingDto.BookingResponse getBookingById(UUID bookingId, User currentUser) {
        log.debug("Fetching booking by id: {} for user {}", bookingId, currentUser.getUsername());
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        return bookingMapper.bookingToBookingResponse(booking);
    }
}
