package com.areeb.event_booking_system.services.booking;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import com.areeb.event_booking_system.dtos.booking.BookingDto;
import com.areeb.event_booking_system.dtos.event.EventDto;
import com.areeb.event_booking_system.exceptions.ResourceNotFoundException;
import com.areeb.event_booking_system.mappers.BookingMapper;
import com.areeb.event_booking_system.models.booking.Booking;
import com.areeb.event_booking_system.models.event.Event;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.repository.booking.BookingRepository;
import com.areeb.event_booking_system.repository.event.EventRepository;

import jakarta.persistence.OptimisticLockException;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private BookingMapper bookingMapper;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private User currentUser;
    private Event availableEvent, pastEvent, fullEvent;
    private Booking booking;
    private BookingDto.CreateBookingRequest createBookingRequest;
    private BookingDto.BookingResponse bookingResponse;
    private UUID eventId, bookingId, userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        currentUser = User.builder().id(userId).username("testUser").build();

        eventId = UUID.randomUUID();
        availableEvent = Event.builder()
                .id(eventId)
                .name("Available Event")
                .eventDate(OffsetDateTime.now().plusDays(5))
                .maxCapacity(10)
                .currentBookingsCount(5)
                .version(0L)
                .price(BigDecimal.TEN)
                .build();

        pastEvent = Event.builder()
                .id(UUID.randomUUID())
                .name("Past Event")
                .eventDate(OffsetDateTime.now().minusDays(1))
                .maxCapacity(10)
                .currentBookingsCount(0)
                .version(0L)
                .price(BigDecimal.TEN)
                .build();

        fullEvent = Event.builder()
                .id(UUID.randomUUID())
                .name("Full Event")
                .eventDate(OffsetDateTime.now().plusDays(5))
                .maxCapacity(5)
                .currentBookingsCount(5)
                .version(0L)
                .price(BigDecimal.TEN)
                .build();

        bookingId = UUID.randomUUID();
        createBookingRequest = BookingDto.CreateBookingRequest.builder().eventId(eventId).build();

        booking = Booking.builder()
                .id(bookingId)
                .user(currentUser)
                .event(availableEvent)
                .bookingTime(OffsetDateTime.now())
                .build();

        EventDto.EventResponse mockEventDetails = EventDto.EventResponse.builder()
                .id(availableEvent.getId())
                .name(availableEvent.getName())
                .eventDate(availableEvent.getEventDate())
                .build();

        bookingResponse = BookingDto.BookingResponse.builder()
                .id(bookingId)
                .userId(userId)
                .userUsername(currentUser.getUsername())
                .bookingTime(booking.getBookingTime())
                .eventDetails(mockEventDetails)
                .build();
    }

    @Test
    void createBooking_Success() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(availableEvent));
        when(bookingRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(eventRepository.saveAndFlush(any(Event.class))).thenAnswer(invocation -> {
            Event savedEvent = invocation.getArgument(0);
            savedEvent.setVersion(savedEvent.getVersion() + 1);
            return savedEvent;
        });
        when(bookingMapper.createRequestToBooking(createBookingRequest, currentUser, availableEvent))
                .thenReturn(booking);
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(bookingMapper.bookingToBookingResponse(booking)).thenReturn(bookingResponse);

        BookingDto.BookingResponse response = bookingService.createBooking(createBookingRequest, currentUser);

        assertNotNull(response);
        assertEquals(bookingId, response.getId());
        assertEquals(6, availableEvent.getCurrentBookingsCount());
        verify(eventRepository).saveAndFlush(availableEvent);
        verify(bookingRepository).save(booking);
    }

    @Test
    void createBooking_EventNotFound() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> bookingService.createBooking(createBookingRequest, currentUser));
    }

    @Test
    void createBooking_PastEvent() {
        createBookingRequest = BookingDto.CreateBookingRequest.builder().eventId(pastEvent.getId()).build();
        when(eventRepository.findById(pastEvent.getId())).thenReturn(Optional.of(pastEvent));
        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(createBookingRequest, currentUser));
    }

    @Test
    void createBooking_AlreadyBooked() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(availableEvent));
        when(bookingRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(true);
        assertThrows(DataIntegrityViolationException.class,
                () -> bookingService.createBooking(createBookingRequest, currentUser));
    }

    @Test
    void createBooking_EventFull() {
        createBookingRequest = BookingDto.CreateBookingRequest.builder().eventId(fullEvent.getId()).build();
        when(eventRepository.findById(fullEvent.getId())).thenReturn(Optional.of(fullEvent));
        when(bookingRepository.existsByUserIdAndEventId(userId, fullEvent.getId())).thenReturn(false);
        // First call to findById in the loop
        when(eventRepository.findById(fullEvent.getId())).thenReturn(Optional.of(fullEvent));

        assertThrows(IllegalStateException.class,
                () -> bookingService.createBooking(createBookingRequest, currentUser));
    }

    @Test
    void createBooking_OptimisticLock_FailsAfterRetries() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(availableEvent));
        when(bookingRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(eventRepository.saveAndFlush(any(Event.class))).thenThrow(OptimisticLockException.class);

        assertThrows(IllegalStateException.class,
                () -> bookingService.createBooking(createBookingRequest, currentUser));
        verify(eventRepository, times(3)).saveAndFlush(any(Event.class)); // verify 3 attempts
    }

    @Test
    void createBooking_OptimisticLock_SucceedsOnRetry() {
        Event eventInitialFetch = Event.builder().id(eventId).name("Version 0 Event")
                .eventDate(OffsetDateTime.now().plusDays(1)).maxCapacity(10).currentBookingsCount(5).version(0L)
                .price(BigDecimal.TEN).build();
        Event eventAfterConcurrentUpdate = Event.builder().id(eventId).name("Version 1 Event")
                .eventDate(OffsetDateTime.now().plusDays(1)).maxCapacity(10).currentBookingsCount(5).version(1L)
                .price(BigDecimal.TEN).build();
        Event eventToBeSuccessfullySaved = Event.builder().id(eventId).name("Version 1 Event for save")
                .eventDate(OffsetDateTime.now().plusDays(1)).maxCapacity(10).currentBookingsCount(5).version(1L)
                .price(BigDecimal.TEN).build();

        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(eventInitialFetch))
                .thenReturn(Optional.of(eventInitialFetch))
                .thenReturn(Optional.of(eventAfterConcurrentUpdate));

        when(bookingRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);

        when(eventRepository.saveAndFlush(any(Event.class)))
                .thenThrow(new OptimisticLockException("OLE on first attempt"))
                .thenAnswer(invocation -> {
                    Event eventPassedToSave = invocation.getArgument(0);
                    assertSame(eventAfterConcurrentUpdate, eventPassedToSave,
                            "Instance passed to saveAndFlush on retry is not eventAfterConcurrentUpdate");
                    eventPassedToSave.setVersion(eventPassedToSave.getVersion() + 1);
                    return eventPassedToSave;
                });

        when(bookingMapper.createRequestToBooking(eq(createBookingRequest), eq(currentUser),
                argThat(eventArg -> eventArg.getCurrentBookingsCount() == 6))).thenReturn(booking);
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(bookingMapper.bookingToBookingResponse(booking)).thenReturn(bookingResponse);

        BookingDto.BookingResponse response = bookingService.createBooking(createBookingRequest, currentUser);
        assertNotNull(response);
        verify(eventRepository, times(2)).saveAndFlush(any(Event.class));
        assertEquals(6, eventAfterConcurrentUpdate.getCurrentBookingsCount());
    }

    @Test
    void cancelBooking_Success() {
        Booking bookingToCancel = Booking.builder().id(bookingId).user(currentUser).event(availableEvent).build();
        when(bookingRepository.findByIdWithUserAndEvent(bookingId)).thenReturn(Optional.of(bookingToCancel));
        when(eventRepository.findById(availableEvent.getId())).thenReturn(Optional.of(availableEvent));
        when(eventRepository.saveAndFlush(any(Event.class))).thenAnswer(invocation -> {
            Event savedEvent = invocation.getArgument(0);
            savedEvent.setVersion(savedEvent.getVersion() + 1);
            return savedEvent;
        });
        doNothing().when(bookingRepository).delete(bookingToCancel);

        assertDoesNotThrow(() -> bookingService.cancelBooking(bookingId, currentUser));

        assertEquals(4, availableEvent.getCurrentBookingsCount());
        verify(eventRepository).saveAndFlush(availableEvent);
        verify(bookingRepository).delete(bookingToCancel);
    }

    @Test
    void cancelBooking_NotFound() {
        when(bookingRepository.findByIdWithUserAndEvent(bookingId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> bookingService.cancelBooking(bookingId, currentUser));
    }

    @Test
    void cancelBooking_AccessDenied() {
        User anotherUser = User.builder().id(UUID.randomUUID()).build();
        Booking bookingOfAnotherUser = Booking.builder().id(bookingId).user(anotherUser).event(availableEvent).build();
        when(bookingRepository.findByIdWithUserAndEvent(bookingId)).thenReturn(Optional.of(bookingOfAnotherUser));

        assertThrows(AccessDeniedException.class, () -> bookingService.cancelBooking(bookingId, currentUser));
    }

    @Test
    void cancelBooking_EventNotFoundDuringUpdate() {
        Booking bookingToCancel = Booking.builder().id(bookingId).user(currentUser).event(availableEvent).build();
        when(bookingRepository.findByIdWithUserAndEvent(bookingId)).thenReturn(Optional.of(bookingToCancel));
        when(eventRepository.findById(availableEvent.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> bookingService.cancelBooking(bookingId, currentUser));
    }

    @Test
    void getUserBookings_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Booking> bookingPage = new PageImpl<>(Collections.singletonList(booking), pageable, 1);
        when(bookingRepository.findByUserIdWithUserAndEvent(userId, pageable)).thenReturn(bookingPage);
        when(bookingMapper.bookingToBookingResponse(booking)).thenReturn(bookingResponse);

        Page<BookingDto.BookingResponse> responsePage = bookingService.getUserBookings(userId, pageable);

        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
        assertEquals(bookingId, responsePage.getContent().get(0).getId());
    }

    @Test
    void getBookingById_Success() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingMapper.bookingToBookingResponse(booking)).thenReturn(bookingResponse);

        BookingDto.BookingResponse response = bookingService.getBookingById(bookingId, currentUser);

        assertNotNull(response);
        assertEquals(bookingId, response.getId());
    }

    @Test
    void getBookingById_NotFound() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> bookingService.getBookingById(bookingId, currentUser));
    }
}
