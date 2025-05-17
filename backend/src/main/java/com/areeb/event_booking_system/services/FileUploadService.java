package com.areeb.event_booking_system.services;

import java.io.IOException;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

public interface FileUploadService {
    String storeFile(MultipartFile file, UUID eventId) throws IOException;

    void deleteFile(String filePath) throws IOException;
}
