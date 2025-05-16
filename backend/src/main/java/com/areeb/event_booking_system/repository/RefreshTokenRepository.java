package com.areeb.event_booking_system.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import com.areeb.event_booking_system.models.auth.RefreshToken;
import com.areeb.event_booking_system.models.user.User;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);
    
    List<RefreshToken> findAllByUser(User user);
    
    @Modifying
    void deleteByUser(User user);
    
    @Modifying
    void deleteByToken(String token);
}
