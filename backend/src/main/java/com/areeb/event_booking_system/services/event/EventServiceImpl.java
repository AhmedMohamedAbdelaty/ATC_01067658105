package com.areeb.event_booking_system.services.event;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.areeb.event_booking_system.dtos.event.EventDto;
import com.areeb.event_booking_system.dtos.event.EventDto.EventResponse;
import com.areeb.event_booking_system.exceptions.ResourceNotFoundException;
import com.areeb.event_booking_system.mappers.EventMapper;
import com.areeb.event_booking_system.models.event.Event;
import com.areeb.event_booking_system.models.event.EventCategory;
import com.areeb.event_booking_system.models.user.User;
import com.areeb.event_booking_system.repository.event.EventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    @Override
    @Transactional
    public EventDto.EventResponse createEvent(EventDto.CreateEventRequest createEventRequest, User adminCreator) {
        log.info("Creating event: {} by admin: {}", createEventRequest.getName(), adminCreator.getUsername());
        Event event = eventMapper.createRequestToEvent(createEventRequest, adminCreator);
        Event savedEvent = eventRepository.save(event);
        log.info("Event created successfully with id: {}", savedEvent.getId());
        return eventMapper.eventToEventResponse(savedEvent);
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
        return eventMapper.eventToEventResponse(updatedEvent);
    }

    @Override
    @Transactional
    public void deleteEvent(UUID eventId, User currentUser) {
        log.info("Deleting event id: {} by user: {}", eventId, currentUser.getUsername());
        Event eventToDelete = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        eventRepository.delete(eventToDelete);
        log.info("Event deleted successfully: {}", eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDto.EventResponse getEventById(UUID eventId) {
        log.debug("Fetching event by id: {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        return eventMapper.eventToEventResponse(event);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EventDto.EventResponse> getAllEvents(Pageable pageable) {
        log.debug("Fetching all events: {}", pageable);
        Page<Event> eventsPage = eventRepository.findAll(pageable);
        return eventsPage.map(eventMapper::eventToEventResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EventResponse> getEventsByCategory(EventCategory category, Pageable pageable) {
        log.debug("Fetching events by category: {} with page: {}", category, pageable);
        if (category == null) {
            return Page.empty(pageable);
        }
        Page<Event> eventsPage = eventRepository.findByCategory(category, pageable);
        return eventsPage.map(eventMapper::eventToEventResponse);
    }
}
