package com.areeb.event_booking_system.dtos;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResponseDto<T> {

    private HttpStatus status;
    private boolean success;
    private T data;
    private String error;
    private LocalDateTime timestamp;

    public static <T> ResponseDto<T> success(T data) {
        return ResponseDto.<T>builder()
                .status(HttpStatus.OK)
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ResponseDto<T> error(String error, HttpStatus status) {
        return ResponseDto.<T>builder()
                .status(status)
                .success(false)
                .error(error)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public ResponseDto() {
        this.timestamp = LocalDateTime.now();
        this.status = HttpStatus.OK;
        this.success = true;
    }
}
