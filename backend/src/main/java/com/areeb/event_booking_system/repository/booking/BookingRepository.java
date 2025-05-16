package com.areeb.event_booking_system.repository.booking;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.areeb.event_booking_system.models.booking.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @EntityGraph(attributePaths = { "user", "event", "event.adminCreator" })
    List<Booking> findByUserId(UUID userId);

    @EntityGraph(attributePaths = { "user", "event", "event.adminCreator" })
    Optional<Booking> findByUserIdAndEventId(UUID userId, UUID eventId);

    boolean existsByUserIdAndEventId(UUID userId, UUID eventId);

    long countByEventId(UUID eventId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.event e LEFT JOIN FETCH e.adminCreator WHERE b.id = :bookingId")
    Optional<Booking> findByIdWithUserAndEvent(@Param("bookingId") UUID bookingId);

    @Override
    @EntityGraph(attributePaths = { "user", "event", "event.adminCreator" })
    Optional<Booking> findById(UUID bookingId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.user u JOIN FETCH b.event e LEFT JOIN FETCH e.adminCreator WHERE u.id = :userId")
    Page<Booking> findByUserIdWithUserAndEvent(@Param("userId") UUID userId, Pageable pageable);

    @Override
    @Query(value = "SELECT b FROM Booking b JOIN FETCH b.user u JOIN FETCH b.event e LEFT JOIN FETCH e.adminCreator", countQuery = "SELECT count(b) FROM Booking b")
    Page<Booking> findAll(Pageable pageable);
}
