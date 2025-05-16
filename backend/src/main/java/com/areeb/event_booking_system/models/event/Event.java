package com.areeb.event_booking_system.models.event;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.areeb.event_booking_system.models.booking.Booking;
import com.areeb.event_booking_system.models.user.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "events")
@EntityListeners(AuditingEntityListener.class)
public class Event {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Event name cannot be blank")
    @Size(min = 3, max = 255, message = "Event name must be between 3 and 255 characters")
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 100)
    private EventCategory category;

    @NotNull(message = "Event date cannot be null")
    @FutureOrPresent(message = "Event date must be in the present or future")
    @Column(name = "event_date", nullable = false)
    private OffsetDateTime eventDate;

    @NotBlank(message = "Venue cannot be blank")
    @Size(max = 255, message = "Venue must be less than 255 characters")
    @Column(nullable = false)
    private String venue;

    @NotNull(message = "Price cannot be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be greater than or equal to 0")
    @Digits(integer = 8, fraction = 2, message = "Price format is invalid (e.g., 12345678.99)")
    @Column(nullable = false)
    private BigDecimal price;

    @Size(max = 2048, message = "Image URL is too long")
    @Column(name = "image_url", length = 2048)
    private String imageUrl;

    @Min(value = 1, message = "Maximum capacity must be at least 1 if specified")
    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Builder.Default
    @Min(value = 0, message = "Current bookings count cannot be negative")
    @Column(name = "current_bookings_count", nullable = false)
    private Integer currentBookingsCount = 0;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_creator_id", nullable = false)
    private User adminCreator;

    @Version
    @Column(nullable = false)
    private Long version;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Booking> bookings = new HashSet<>();

    public boolean isCapacityAvailable() {
        // No limit
        if (this.maxCapacity == null) {
            return true;
        }
        return this.currentBookingsCount < this.maxCapacity;
    }
}
