# Event Booking System

## Live Demo

Try it now: [https://zesty-maire-ahmed-muhammed-e26b0e5b.koyeb.app](https://zesty-maire-ahmed-muhammed-e26b0e5b.koyeb.app)

- We're running this on **Koyeb** with a **Neon** PostgreSQL database. The setup gives us fast loading times, automatic updates, and secure connections.
- Sometimes the app might take a bit to start up, especially if it's been idle for a while cuz of the free tier limitations.

# Using Docker to run the app

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

6. Display logs from the application container:
   ```bash
   docker logs -f event-booking-app
   ```

7. Access the application at `http://localhost:8080`

## If you prefer to run the app without Docker
- For backend setup and configuration, see [Backend README](backend/README.md)
- For frontend setup and information, see [Frontend README](frontend/README.md)
- For API documentation, access `/swagger-ui/index.html` when the backend is running

## Admin Access

To test admin functionalities, you can use the default admin credentials:

- Username: `admin`
- Email: `admin@gmail.com`
- Password: `password`
