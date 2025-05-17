package com.areeb.event_booking_system.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.areeb.event_booking_system.dtos.event.EventDto;
import com.areeb.event_booking_system.models.event.Event;
import com.areeb.event_booking_system.models.user.User;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EventMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "name", source = "dto.name")
    @Mapping(target = "currentBookingsCount", constant = "0")
    @Mapping(target = "adminCreator", source = "adminCreatorUser")
    @Mapping(target = "bookings", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Event createRequestToEvent(EventDto.CreateEventRequest dto, User adminCreatorUser);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "adminCreator", ignore = true)
    @Mapping(target = "currentBookingsCount", ignore = true)
    @Mapping(target = "bookings", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEventFromRequest(EventDto.UpdateEventRequest dto, @MappingTarget Event existingEvent);

    @Mapping(source = "event.adminCreator.username", target = "adminCreatorUsername")
    @Mapping(source = "isCurrentUserBooked", target = "isCurrentUserBooked")
    EventDto.EventResponse eventToEventResponse(Event event, Boolean isCurrentUserBooked);
}
