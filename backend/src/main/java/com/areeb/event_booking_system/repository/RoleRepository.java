package com.areeb.event_booking_system.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.areeb.event_booking_system.models.user.Role;
import com.areeb.event_booking_system.models.user.Role.RoleType;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleType roleUser);
}
