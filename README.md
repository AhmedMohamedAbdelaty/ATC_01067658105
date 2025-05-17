# 🎟️ Event Booking System

A full-stack event booking platform that allows users to browse events, book tickets, and manage their bookings. The system includes a comprehensive admin panel for event management with role-based access control.

## 🌟 Live Demo

Try it now:
- Frontend: [EBS Frontend](https://v0-ebs-one.vercel.app/)
- Backend: [EBS Backend](https://zesty-maire-ahmed-muhammed-e26b0e5b.koyeb.app/swagger-ui/index.html)

> **Note:** When accessing the demo for the first time, there might be a slight delay as the backend service wakes up from idle (free tier limitation).

## 🔑 Key Features

- **User Authentication:** Secure register/login system with JWT tokens
- **Event Discovery:** Browse events with filtering by category
- **Booking Management:** Book events and manage your bookings
- **Admin Panel:** Create, edit, and delete events
- **Image Upload:** Upload and manage event images
- **Responsive Design:** Works on desktop and mobile devices

## 🔐 Security Implementation

The application implements a robust security architecture:

1. **JWT-Based Authentication:**
   - Short-lived access tokens (15 minutes)
   - Refresh tokens stored in HTTP-only cookies
   - Automatic token refresh mechanism

2. **Role-Based Access Control:**
   - Fine-grained permissions system
   - User roles (ROLE_USER, ROLE_ADMIN)
   - Method-level security with @PreAuthorize annotations

3. **Data Protection:**
   - Password encryption with BCrypt
   - Input validation on both client and server
   - Protection against CSRF attacks
   - XSS prevention

4. **API Security:**
   - Proper CORS configuration
   - Request filtering
   - Authentication entry point for unauthorized access
   - HTTP security headers

## 🧰 Technologies Used

### Backend
- **Java 21** with **Spring Boot 3**
- **Spring Security** for authentication and authorization
- **PostgreSQL** for data storage
- **Flyway** for database migrations
- **JUnit** and **Mockito** for testing
- **OpenAPI/Swagger** for API documentation

### Frontend
- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **Shadcn UI** component library
- **JWT** authentication
- **React Context API** for state management

### DevOps & Deployment
- **Docker** for containerization
- **Vercel** for frontend hosting
- **Koyeb** for backend hosting
- **Neon PostgreSQL** for database (serverless)

## 🛠️ Quick Start with Docker

The easiest way to run the application locally is using Docker:

1. Create a `.env.docker` file in the root directory with the following environment variables:
   ```properties
   SPRING_DATASOURCE_URL=jdbc:postgresql://event-db:5432/event_booking
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=root

   JWT_SECRET=7q5J7xK0zxjH9jpLtJ1KKDgJpZ0nuS1sT2WubI2SXgY=

   SPRING_PROFILES_ACTIVE=dev

   FLYWAY_URL=jdbc:postgresql://event-db:5432/event_booking
   FLYWAY_USER=postgres
   FLYWAY_PASSWORD=root
   ```

   > **Important**:
   > - Replace the JWT secret with a secure value of your choice
   > - If using an external database, update the database connection details accordingly
   > - Make sure the database host name matches your Docker network configuration

2. Create a network for the containers:
   ```bash
   docker network create event-booking-network
   ```

3. Run the PostgreSQL container:
   ```bash
   docker run --name event-db \
     --network event-booking-network \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=root \
     -e POSTGRES_DB=event_booking \
     -d postgres:latest
   ```

4. Build the Docker image:
   ```bash
   docker build -t ebs-app .
   ```

5. Run the application container:
   ```bash
   docker run --name event-booking-app \
     --network event-booking-network \
     --env-file .env.docker \
     -p 8080:8080 \
     -d ebs-app
   ```

6. Access the application at `http://localhost:8080`

## 🏗️ Development Setup

If you prefer to run the application without Docker for development purposes:

- For backend setup and configuration, see [Backend README](backend/README.md)
- For frontend setup and information, see [Frontend README](frontend/README.md)
- For API documentation, access `/swagger-ui/index.html` when the backend is running

## 👨‍💼 Admin Access

To test admin functionalities, you can use the default admin credentials:

- Username: `admin`
- Email: `admin@gmail.com`
- Password: `password`

## ⭐ Implemented Bonus Features

The project includes several optional enhancements and bonus features:

1. **Backend Deployment:**
   - Deployed on Koyeb with automatic CI/CD pipeline
   - Connected to Neon PostgreSQL serverless database

2. **Role-Based Permissions:**
   - Detailed permission system beyond basic roles
   - Granular access control for different operations

3. **Event Image Upload:**
   - Secure file upload functionality
   - Image storage and management

4. **Categories for Events:**
   - Event categorization system
   - Filtering events by category

5. **Pagination:**
   - Server-side pagination for events and bookings
   - Optimized queries for large datasets

6. **Responsive Design:**
   - Mobile-friendly interface
   - Adapts to different screen sizes

7. **Dark Mode Support:**
   - System preference detection
   - Manual toggle between light and dark modes

## 🏛️ Architecture Overview

The application follows a clean, layered architecture:

### Backend Architecture
- **Controller Layer:** API endpoints and request handling
- **Service Layer:** Business logic and transaction management
- **Repository Layer:** Data access with JPA/Hibernate
- **DTO Layer:** Data transfer objects for API contracts
- **Model Layer:** Entity definitions with relationships
- **Security Layer:** Authentication, authorization, and CORS

### Frontend Architecture
- **Pages:** Next.js routes and views
- **Components:** Reusable UI elements
- **Context:** Global state management
- **API Client:** Backend communication layer
- **Middleware:** API route handlers and proxying

## 🔍 Key Implementation Details

### Database Design
- Entity-relationship model with proper constraints
- UUID primary keys for enhanced security
- Auditing for created/updated timestamps
- Optimistic locking for concurrent operations
- Proper database indexing for performance

### API Design
- RESTful endpoints following best practices
- Consistent response format with wrapped data
- Proper HTTP status codes
- Comprehensive error handling
- Complete API documentation with Swagger
