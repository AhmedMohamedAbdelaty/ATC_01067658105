package com.areeb.event_booking_system.mappers;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.areeb.event_booking_system.dtos.booking.BookingDto;
import com.areeb.event_booking_system.models.booking.Booking;
import com.areeb.event_booking_system.models.event.Event;
import com.areeb.event_booking_system.models.user.User;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = { EventMapper.class })
public interface BookingMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "event", source = "eventEntity")
    @Mapping(target = "user", source = "userEntity")
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Booking createRequestToBooking(BookingDto.CreateBookingRequest dto, User userEntity, Event eventEntity);

    @Mapping(source = "event", target = "eventDetails")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.username", target = "userUsername")
    BookingDto.BookingResponse bookingToBookingResponse(Booking booking);

    List<BookingDto.BookingResponse> bookingsToBookingResponses(List<Booking> bookings);
}
