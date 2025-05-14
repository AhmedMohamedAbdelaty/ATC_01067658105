# Backend Instructions: Event Booking System

## Prerequisites

Before you begin, make sure you have the following installed:

- Java JDK 21
- Docker (for PostgreSQL, or a standalone PostgreSQL instance)

## Quick Start

1.  Start PostgreSQL using Docker or use an existing instance:
    ```bash
    docker run --name event-db \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=root \
      -e POSTGRES_DB=event_booking \
      -p 5432:5432 \
      -d postgres:latest
    ```

2.  Configure Environment Variables (`.env` file):
    Create a `.env` file in the project root with your database and JWT secret:
    ```properties
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=root
    POSTGRES_DB=event_booking
    ```

3.  Configure Flyway
    Create a `flyway.conf` file in the project root (backend folder) with the following content:
    ```properties
    flyway.url=jdbc:postgresql://localhost:5432/event_booking
    flyway.user=postgres
    flyway.password=root
    flyway.locations=classpath:db/migration
    ```
    This configuration tells Flyway where to find the migration scripts and how to connect to the database.

4.  Build and Run the Application:
    Using the Maven wrapper: make sure you are on the `backend` folder and run:
    ```bash
    ./mvnw clean install
    ./mvnw spring-boot:run
    ```
    The application will start, and Flyway will apply database migrations automatically. It will be available at `http://localhost:8080`.
