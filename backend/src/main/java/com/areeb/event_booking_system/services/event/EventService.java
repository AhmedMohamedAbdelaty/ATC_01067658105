package com.areeb.event_booking_system.services.event;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.areeb.event_booking_system.dtos.event.EventDto;
import com.areeb.event_booking_system.models.event.EventCategory;
import com.areeb.event_booking_system.models.user.User;

public interface EventService {
    EventDto.EventResponse createEvent(EventDto.CreateEventRequest createEventRequest, User adminCreator);

    EventDto.EventResponse updateEvent(UUID eventId, EventDto.UpdateEventRequest updateEventRequest, User currentUser);

    void deleteEvent(UUID eventId, User currentUser);

    EventDto.EventResponse getEventById(UUID eventId);

    Page<EventDto.EventResponse> getAllEvents(Pageable pageable);

    Page<EventDto.EventResponse> getEventsByCategory(EventCategory category, Pageable pageable);
}
