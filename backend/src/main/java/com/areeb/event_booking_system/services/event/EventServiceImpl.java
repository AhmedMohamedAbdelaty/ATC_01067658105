package com.areeb.event_booking_system.services.event;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.areeb.event_booking_system.dtos.event.EventDto;
import com.areeb.event_booking_system.dtos.event.EventDto.EventResponse;
import com.areeb.event_booking_system.exceptions.ResourceNotFoundException;
import com.areeb.event_booking_system.mappers.EventMapper;
import com.areeb.event_booking_system.models.event.Event;
import com.areeb.event_booking_system.models.event.EventCategory;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.repository.UserRepository;
import com.areeb.event_booking_system.repository.booking.BookingRepository;
import com.areeb.event_booking_system.repository.event.EventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EventMapper eventMapper;

    @Override
    @Transactional
    public EventDto.EventResponse createEvent(EventDto.CreateEventRequest createEventRequest, User adminCreator) {
        log.info("Creating event: {} by admin: {}", createEventRequest.getName(), adminCreator.getUsername());
        Event event = eventMapper.createRequestToEvent(createEventRequest, adminCreator);
        Event savedEvent = eventRepository.save(event);
        log.info("Event created successfully with id: {}", savedEvent.getId());
        return eventMapper.eventToEventResponse(savedEvent, false);
    }

    @Override
    @Transactional
    public EventDto.EventResponse updateEvent(UUID eventId, EventDto.UpdateEventRequest updateEventRequest,
            User currentUser) {
        log.info("Updating event id: {} by user: {}", eventId, currentUser.getUsername());
        Event existingEvent = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        eventMapper.updateEventFromRequest(updateEventRequest, existingEvent);
        Event updatedEvent = eventRepository.save(existingEvent);
        log.info("Event updated successfully: {}", updatedEvent.getId());
        return mapEventToResponse(updatedEvent);
    }

    @Override
    @Transactional
    public void deleteEvent(UUID eventId, User currentUser) {
        log.info("Deleting event id: {} by user: {}", eventId, currentUser.getUsername());
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event", "id", eventId);
        }
        bookingRepository.deleteByEventId(eventId);
        eventRepository.deleteById(eventId);
        log.info("Event deleted successfully: {}", eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDto.EventResponse getEventById(UUID eventId) {
        log.debug("Fetching event by id: {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        return mapEventToResponse(event);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EventDto.EventResponse> getAllEvents(Pageable pageable) {
        log.debug("Fetching all events: {}", pageable);
        Page<Event> eventsPage = eventRepository.findAll(pageable);
        java.util.List<EventResponse> eventResponses = eventsPage.getContent().stream()
                .map(event -> mapEventToResponse(event))
                .collect(Collectors.toList());
        return new PageImpl<>(eventResponses, pageable, eventsPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EventResponse> getEventsByCategory(EventCategory category, Pageable pageable) {
        log.debug("Fetching events by category: {} with page: {}", category, pageable);
        if (category == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }
        Page<Event> eventsPage = eventRepository.findByCategory(category, pageable);
        java.util.List<EventResponse> eventResponses = eventsPage.getContent().stream()
                .map(event -> mapEventToResponse(event))
                .collect(Collectors.toList());
        return new PageImpl<>(eventResponses, pageable, eventsPage.getTotalElements());
    }

    private boolean isCurrentUserBooked(UUID eventId) {
        return getCurrentUserId()
                .map(userId -> bookingRepository.existsByUserIdAndEventId(userId, eventId))
                .orElse(false);
    }

    private Optional<UUID> getCurrentUserId() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getPrincipal)
                .filter(principal -> !(principal instanceof String))
                .flatMap(principal -> principal instanceof User user ? Optional.of(user.getId())
                        : userRepository
                                .findByUsername(
                                        ((org.springframework.security.core.userdetails.User) principal).getUsername())
                                .map(User::getId));
    }

    private EventResponse mapEventToResponse(Event event) {
        boolean isBooked = isCurrentUserBooked(event.getId());
        return eventMapper.eventToEventResponse(event, isBooked);
    }
}
