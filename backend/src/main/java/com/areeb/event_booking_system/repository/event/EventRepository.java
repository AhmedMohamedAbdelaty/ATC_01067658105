package com.areeb.event_booking_system.repository.event;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.areeb.event_booking_system.models.event.Event;
import com.areeb.event_booking_system.models.event.EventCategory;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID>, JpaSpecificationExecutor<Event> {

    @EntityGraph(attributePaths = {"adminCreator"})
    List<Event> findByAdminCreatorId(UUID adminCreatorId);

    @EntityGraph(attributePaths = {"adminCreator"})
    Page<Event> findByCategory(EventCategory category, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"adminCreator"})
    Page<Event> findAll(Pageable pageable);

    @Query("SELECT e FROM Event e LEFT JOIN FETCH e.adminCreator WHERE e.id = :id")
    Optional<Event> findByIdWithAdminCreator(@Param("id") UUID id);
}
