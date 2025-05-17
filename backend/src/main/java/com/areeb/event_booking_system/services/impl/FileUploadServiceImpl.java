package com.areeb.event_booking_system.services.impl;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.areeb.event_booking_system.services.FileUploadService;

@Service
public class FileUploadServiceImpl implements FileUploadService {

    private final Path fileStorageLocation;
    private final String fileStoragePathForUrl;

    public FileUploadServiceImpl(@Value("${file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.fileStoragePathForUrl = uploadDir.startsWith("./") ? uploadDir.substring(2) : uploadDir;

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file, UUID eventId) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Failed to store empty file.");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileExtension = "";
        try {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid file name: " + originalFilename);
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/"))) {
            throw new IllegalArgumentException("Invalid file type. Only images are allowed. Provided: " + contentType);
        }

        String uniqueFileName = "event_" + eventId + "_" + UUID.randomUUID().toString() + fileExtension;
        Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        }

        // path
        return "/" + fileStoragePathForUrl + "/" + uniqueFileName;
    }

    @Override
    public void deleteFile(String fileUrlPath) throws IOException {
        if (fileUrlPath == null || fileUrlPath.isBlank()) {
            return;
        }

        String relativePath = fileUrlPath.startsWith("/") ? fileUrlPath.substring(1) : fileUrlPath;

        if (!relativePath.startsWith(fileStoragePathForUrl)) {
            String fileName = Paths.get(relativePath).getFileName().toString();
            Path filePath = this.fileStorageLocation.resolve(fileName);
            Files.deleteIfExists(filePath);
            return;
        }

        String fileName = Paths.get(fileUrlPath).getFileName().toString();
        Path actualFilePath = this.fileStorageLocation.resolve(fileName);

        try {
            Files.deleteIfExists(actualFilePath);
        } catch (IOException e) {
            System.err.println("Failed to delete file: " + actualFilePath + " - " + e.getMessage());
        }
    }
}
