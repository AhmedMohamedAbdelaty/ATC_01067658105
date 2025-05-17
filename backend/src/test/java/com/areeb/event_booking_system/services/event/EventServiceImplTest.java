package com.areeb.event_booking_system.services.event;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import com.areeb.event_booking_system.dtos.event.EventDto;
import com.areeb.event_booking_system.exceptions.ResourceNotFoundException;
import com.areeb.event_booking_system.mappers.EventMapper;
import com.areeb.event_booking_system.models.event.Event;
import com.areeb.event_booking_system.models.event.EventCategory;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.repository.UserRepository;
import com.areeb.event_booking_system.repository.booking.BookingRepository;
import com.areeb.event_booking_system.repository.event.EventRepository;
import com.areeb.event_booking_system.services.FileUploadService;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EventMapper eventMapper;
    @Mock
    private FileUploadService fileUploadService;
    @Mock
    private MultipartFile mockImageFile;
    @Mock(lenient = true)
    private Authentication authentication;
    @Mock(lenient = true)
    private SecurityContext securityContext;

    @InjectMocks
    private EventServiceImpl eventService;

    private User adminUser, regularUser;
    private Event event;
    private EventDto.CreateEventRequest createEventRequest;
    private EventDto.UpdateEventRequest updateEventRequest;
    private EventDto.EventResponse eventResponse;
    private UUID eventId;
    private UUID adminUserId, regularUserId;

    private MockedStatic<SecurityContextHolder> securityContextHolderMockedStatic;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();
        adminUser = User.builder().id(adminUserId).username("admin").build();

        regularUserId = UUID.randomUUID();
        regularUser = User.builder().id(regularUserId).username("user").build();

        eventId = UUID.randomUUID();
        event = Event.builder()
                .id(eventId)
                .name("Test Event")
                .description("Description")
                .category(EventCategory.CONFERENCE)
                .eventDate(OffsetDateTime.now().plusDays(10))
                .venue("Venue")
                .price(BigDecimal.valueOf(100))
                .maxCapacity(100)
                .imageUrl("image.jpg")
                .adminCreator(adminUser)
                .build();

        createEventRequest = EventDto.CreateEventRequest.builder()
                .name("New Event").description("New Desc").category(EventCategory.WORKSHOP)
                .eventDate(OffsetDateTime.now().plusDays(5))
                .venue("New Venue").price(BigDecimal.valueOf(50))
                .maxCapacity(50)
                .build();

        updateEventRequest = EventDto.UpdateEventRequest.builder()
                .name("Updated Event").description("Updated Desc").build();

        eventResponse = EventDto.EventResponse.builder()
                .id(eventId).name(event.getName())
                .isCurrentUserBooked(false)
                .build();

        securityContextHolderMockedStatic = Mockito.mockStatic(SecurityContextHolder.class);
        securityContextHolderMockedStatic.when(SecurityContextHolder::getContext).thenReturn(securityContext);
    }

    @AfterEach
    void tearDown() {
        securityContextHolderMockedStatic.close();
    }

    private void mockSecurityContext(User userPrincipal) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        if (userPrincipal != null) {
            when(authentication.getPrincipal()).thenReturn(userPrincipal);
        } else {
            when(authentication.getPrincipal()).thenReturn("anonymousUser");
        }
    }

    @Test
    void createEvent_Success() {
        when(eventMapper.createRequestToEvent(createEventRequest, adminUser)).thenReturn(event);
        when(eventRepository.save(event)).thenReturn(event);
        when(eventMapper.eventToEventResponse(event, false)).thenReturn(eventResponse); // Assuming not booked by
                                                                                        // creator initially

        EventDto.EventResponse response = eventService.createEvent(createEventRequest, adminUser);

        assertNotNull(response);
        assertEquals(eventResponse.getName(), response.getName());
        verify(eventRepository).save(event);
    }

    @Test
    void updateEvent_Success() {
        mockSecurityContext(adminUser);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenReturn(event);
        when(bookingRepository.existsByUserIdAndEventId(adminUserId, eventId)).thenReturn(false); // Assume admin hasn't booked
        when(eventMapper.eventToEventResponse(event, false)).thenReturn(eventResponse);

        EventDto.EventResponse response = eventService.updateEvent(eventId, updateEventRequest, adminUser);

        assertNotNull(response);
        verify(eventMapper).updateEventFromRequest(updateEventRequest, event);
        verify(eventRepository).save(event);
    }

    @Test
    void updateEvent_NotFound() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> eventService.updateEvent(eventId, updateEventRequest, adminUser));
    }

    @Test
    void deleteEvent_Success_WithImage() throws IOException {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        doNothing().when(fileUploadService).deleteFile("image.jpg");
        doNothing().when(bookingRepository).deleteByEventId(eventId);
        doNothing().when(eventRepository).deleteById(eventId);

        assertDoesNotThrow(() -> eventService.deleteEvent(eventId, adminUser));

        verify(fileUploadService).deleteFile("image.jpg");
        verify(bookingRepository).deleteByEventId(eventId);
        verify(eventRepository).deleteById(eventId);
    }

    @Test
    void deleteEvent_Success_NoImage() throws IOException {
        event.setImageUrl(null);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        doNothing().when(bookingRepository).deleteByEventId(eventId);
        doNothing().when(eventRepository).deleteById(eventId);

        assertDoesNotThrow(() -> eventService.deleteEvent(eventId, adminUser));

        verify(fileUploadService, never()).deleteFile(anyString());
        verify(bookingRepository).deleteByEventId(eventId);
        verify(eventRepository).deleteById(eventId);
    }

    @Test
    void deleteEvent_NotFound() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> eventService.deleteEvent(eventId, adminUser));
    }

    @Test
    void deleteEvent_ImageDeleteThrowsIOException() throws IOException {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        doThrow(new IOException("Delete failed")).when(fileUploadService).deleteFile("image.jpg");

        assertDoesNotThrow(() -> eventService.deleteEvent(eventId, adminUser)); // Service should catch and log

        verify(bookingRepository).deleteByEventId(eventId);
        verify(eventRepository).deleteById(eventId);
    }

    @Test
    void getEventById_Found_UserNotBooked() {
        mockSecurityContext(regularUser);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(bookingRepository.existsByUserIdAndEventId(regularUserId, eventId)).thenReturn(false);
        when(eventMapper.eventToEventResponse(event, false)).thenReturn(eventResponse);

        EventDto.EventResponse response = eventService.getEventById(eventId);

        assertNotNull(response);
        assertFalse(response.getIsCurrentUserBooked());
    }

    @Test
    void getEventById_Found_UserBooked() {
        mockSecurityContext(regularUser);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(bookingRepository.existsByUserIdAndEventId(regularUserId, eventId)).thenReturn(true);
        EventDto.EventResponse bookedResponse = EventDto.EventResponse.builder().id(eventId).name(event.getName())
                .isCurrentUserBooked(true).build();
        when(eventMapper.eventToEventResponse(event, true)).thenReturn(bookedResponse);

        EventDto.EventResponse response = eventService.getEventById(eventId);

        assertNotNull(response);
        assertTrue(response.getIsCurrentUserBooked());
    }

    @Test
    void getEventById_NotFound() {
        mockSecurityContext(regularUser);
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> eventService.getEventById(eventId));
    }

    @Test
    void getAllEvents_Success() {
        mockSecurityContext(regularUser); // User context to check bookings for each event
        Pageable pageable = PageRequest.of(0, 10);
        List<Event> events = Collections.singletonList(event);
        Page<Event> eventPage = new PageImpl<>(events, pageable, 1);

        when(eventRepository.findAll(pageable)).thenReturn(eventPage);
        when(bookingRepository.existsByUserIdAndEventId(regularUserId, eventId)).thenReturn(false);
        when(eventMapper.eventToEventResponse(event, false)).thenReturn(eventResponse);

        Page<EventDto.EventResponse> responsePage = eventService.getAllEvents(pageable);

        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
        assertFalse(responsePage.getContent().get(0).getIsCurrentUserBooked());
    }

    @Test
    void getEventsByCategory_Success() {
        mockSecurityContext(regularUser);
        Pageable pageable = PageRequest.of(0, 10);
        EventCategory category = EventCategory.CONFERENCE;
        List<Event> events = Collections.singletonList(event);
        Page<Event> eventPage = new PageImpl<>(events, pageable, 1);

        when(eventRepository.findByCategory(category, pageable)).thenReturn(eventPage);
        when(bookingRepository.existsByUserIdAndEventId(regularUserId, eventId)).thenReturn(false);
        when(eventMapper.eventToEventResponse(event, false)).thenReturn(eventResponse);

        Page<EventDto.EventResponse> responsePage = eventService.getEventsByCategory(category, pageable);

        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
    }

    @Test
    void getEventsByCategory_NullCategory() {
        mockSecurityContext(regularUser);
        Pageable pageable = PageRequest.of(0, 10);
        Page<EventDto.EventResponse> responsePage = eventService.getEventsByCategory(null, pageable);
        assertNotNull(responsePage);
        assertTrue(responsePage.getContent().isEmpty());
        assertEquals(0, responsePage.getTotalElements());
    }

    @Test
    void updateEventImage_Success_NewImage() throws IOException {
        mockSecurityContext(adminUser);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event)); // Event has Old image "image.jpg"
        when(mockImageFile.isEmpty()).thenReturn(false);
        when(fileUploadService.storeFile(mockImageFile, eventId)).thenReturn("new_image.jpg");
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.existsByUserIdAndEventId(adminUserId, eventId)).thenReturn(false);
        when(eventMapper.eventToEventResponse(any(Event.class), eq(false))).thenAnswer(invocation -> {
            Event savedEvent = invocation.getArgument(0);
            return EventDto.EventResponse.builder().id(savedEvent.getId()).name(savedEvent.getName())
                    .imageUrl(savedEvent.getImageUrl()).isCurrentUserBooked(false).build();
        });

        EventDto.EventResponse response = eventService.updateEventImage(eventId, mockImageFile, adminUser);

        assertNotNull(response);
        assertEquals("new_image.jpg", response.getImageUrl());
        verify(fileUploadService).deleteFile("image.jpg"); // Old image deleted
        verify(fileUploadService).storeFile(mockImageFile, eventId);
        verify(eventRepository).save(argThat(savedEvent -> "new_image.jpg".equals(savedEvent.getImageUrl())));
    }

    @Test
    void updateEventImage_Success_RemoveImage() throws IOException {
        mockSecurityContext(adminUser);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event)); // Event has "image.jpg"
        when(mockImageFile.isEmpty()).thenReturn(true); // Simulate removing image by passing empty file
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.existsByUserIdAndEventId(adminUserId, eventId)).thenReturn(false);
        when(eventMapper.eventToEventResponse(any(Event.class), eq(false))).thenAnswer(invocation -> {
            Event savedEvent = invocation.getArgument(0);
            return EventDto.EventResponse.builder().id(savedEvent.getId()).name(savedEvent.getName())
                    .imageUrl(savedEvent.getImageUrl()).isCurrentUserBooked(false).build();
        });

        EventDto.EventResponse response = eventService.updateEventImage(eventId, mockImageFile, adminUser);

        assertNotNull(response);
        assertNull(response.getImageUrl());
        verify(fileUploadService).deleteFile("image.jpg");
        verify(fileUploadService, never()).storeFile(any(), any());
        verify(eventRepository).save(argThat(savedEvent -> savedEvent.getImageUrl() == null));
    }

    @Test
    void updateEventImage_EventNotFound() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> eventService.updateEventImage(eventId, mockImageFile, adminUser));
    }

    @Test
    void updateEventImage_StoreFileThrowsIOException() throws IOException {
        mockSecurityContext(adminUser);
        event.setImageUrl(null);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(mockImageFile.isEmpty()).thenReturn(false);
        when(fileUploadService.storeFile(mockImageFile, eventId)).thenThrow(new IOException("Store failed"));

        assertThrows(IOException.class, () -> eventService.updateEventImage(eventId, mockImageFile, adminUser));

        verify(eventRepository, never()).save(any(Event.class));
        verify(eventMapper, never()).eventToEventResponse(any(Event.class), anyBoolean());
    }

    @Test
    void updateEventImage_DeleteOldFileThrowsIOException() throws IOException {
        mockSecurityContext(adminUser);
        // Event has an old image
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(mockImageFile.isEmpty()).thenReturn(false);
        // Deleting old image fails
        doThrow(new IOException("Delete old failed")).when(fileUploadService).deleteFile(event.getImageUrl());
        // Storing new image succeeds
        when(fileUploadService.storeFile(mockImageFile, eventId)).thenReturn("new_image.jpg");
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.existsByUserIdAndEventId(adminUserId, eventId)).thenReturn(false);
        when(eventMapper.eventToEventResponse(any(Event.class), eq(false))).thenAnswer(invocation -> {
            Event savedEvent = invocation.getArgument(0);
            return EventDto.EventResponse.builder().id(savedEvent.getId()).imageUrl(savedEvent.getImageUrl())
                    .isCurrentUserBooked(false).build();
        });

        EventDto.EventResponse response = eventService.updateEventImage(eventId, mockImageFile, adminUser);

        assertNotNull(response);
        assertEquals("new_image.jpg", response.getImageUrl());
        verify(eventRepository).save(argThat(e -> "new_image.jpg".equals(e.getImageUrl())));
    }
}
