package com.areeb.event_booking_system.mappers;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.areeb.event_booking_system.dtos.auth.AuthDto;
import com.areeb.event_booking_system.dtos.user.UserDto;
import com.areeb.event_booking_system.models.user.Role;
import com.areeb.event_booking_system.models.user.User;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    @Mapping(target = "username", source = "user", qualifiedByName = "extractUsername")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "roles", source = "roles", qualifiedByName = "rolesToStringList")
    UserDto.UserResponseDto toUserResponseDto(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "username", source = "username")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "password", source = "password")
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "lastLogin", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    User toUser(AuthDto.RegisterRequest registerRequest);

    @Named("extractUsername")
    default String extractUsername(User user) {
        return user.getName();
    }

    @Named("rolesToStringList")
    default List<String> rolesToStringList(Set<Role> roles) {
        if (roles == null) {
            return List.of();
        }
        return roles.stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
    }
}
