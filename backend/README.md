# 🔧 Event Booking System - Backend

This directory contains the backend application for the Event Booking System, built with Spring Boot 3 and Java 21.

## 🌟 Key Features

- **Modern Java Architecture**: Built with Spring Boot 3 and Java 21
- **Security**: JWT-based authentication with proper token refresh
- **Database**: PostgreSQL with Flyway migrations
- **API Design**: RESTful API with proper error handling
- **Documentation**: OpenAPI/Swagger documentation
- **Testing**: JUnit and Mockito for unit and integration tests

## 🚀 Technical Implementation

### Security Implementation
- JWT authentication with access and refresh tokens
- Role-based access control with fine-grained permissions
- HTTP-only cookies for storing refresh tokens
- Proper CORS configuration for cross-domain requests
- Password encryption with BCrypt

### Database Design
- Entity models with proper relationships:
  - User-Role-Permission for authorization
  - Event-Booking core business models
  - RefreshToken for session management
- UUID primary keys for enhanced security
- Proper foreign key relationships with cascade options
- Optimistic locking to prevent concurrent update issues
- Auditing with created/updated timestamps

### Error Handling
- Global exception handler for consistent API responses
- Custom exceptions for specific error cases
- Proper HTTP status codes for different error scenarios
- Detailed error messages for debugging

### Performance Optimizations
- Connection pooling for database operations
- Pagination for list endpoints
- Lazy loading for entity relationships
- Optimistic locking for concurrent operations

## 🛠️ Prerequisites

Before you begin, make sure you have the following installed:

- Java JDK 21
- Maven
- Docker (for PostgreSQL, or a standalone PostgreSQL instance)

## 🚀 Quick Start

1. Start PostgreSQL using Docker or use an existing instance:
   ```bash
   docker run --name event-db \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=root \
    -e POSTGRES_DB=event_booking \
    -p 5432:5432 \
    -d postgres:latest
   ```

2. Configure Environment Variables (`.env` file):
   Create a `.env` file in the project root with your database and JWT secret:
   ```properties
   DB_URL=jdbc:postgresql://localhost:5432/event_booking
   DB_USER=postgres
   DB_PASSWORD=root
   JWT_SECRET=7q5J7xK0zxjH9jpLtJ1KKDgJpZ0nuS1sT2WubI2SXgY=
   ```
   Replace the JWT secret with a secure value of your choice.

3. Configure Flyway
   Create a `flyway.conf` file in the project root (backend folder) with the following content:
   ```properties
   flyway.url=jdbc:postgresql://localhost:5432/event_booking
   flyway.user=postgres
   flyway.password=root
   flyway.locations=classpath:db/migration
   ```
   This configuration tells Flyway where to find the migration scripts and how to connect to the database.

4. Build and Run the Application:
   Using the Maven wrapper: make sure you are in the `backend` folder and run:
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```
   The application will start, and Flyway will apply database migrations automatically. It will be available at `http://localhost:8080`.

## 🔍 API Documentation

The API is documented using OpenAPI/Swagger. When the application is running, you can access the documentation at:

- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## 🧪 Testing

The application includes unit and integration tests. To run the tests:

```bash
./mvnw test
```

## 📄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens

### Events
- `GET /api/events` - Get all events with pagination
- `GET /api/events/{id}` - Get event details
- `POST /api/events` - Create a new event (admin only)
- `PUT /api/events/{id}` - Update an event (admin only)
- `DELETE /api/events/{id}` - Delete an event (admin only)
- `POST /api/events/{id}/image` - Upload event image (admin only)
- `DELETE /api/events/{id}/image` - Delete event image (admin only)

### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/my` - Get user's bookings
- `GET /api/bookings/{id}` - Get booking details
- `DELETE /api/bookings/{id}` - Cancel a booking

## 🔒 Security

The application implements several security features:

1. **JWT Authentication**: JSON Web Tokens for stateless authentication
2. **Refresh Tokens**: Secure refresh tokens stored in HTTP-only cookies
3. **Role-Based Access Control**: Different permissions for users and admins
4. **Password Encryption**: BCrypt for secure password storage
5. **CORS Configuration**: Secure cross-origin resource sharing

## 📦 Deployment

The backend is deployed on Koyeb, a serverless platform:

1. Build the application: `./mvnw clean package`
2. Create a Docker image: `docker build -t event-booking-backend .`
3. Push to a container registry
4. Deploy to Koyeb with configuration for:
   - Environment variables
   - Database connection (Neon PostgreSQL)
   - Memory and CPU allocation

## 🧩 Integration with Frontend

The backend provides a RESTful API that the frontend Next.js application consumes:
- JWT authentication for secure operations
- JSON responses for all endpoints
- Proper error handling and status codes
- CORS configuration for cross-origin requests
