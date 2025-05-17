FROM eclipse-temurin:21-jdk-jammy AS backend-builder

WORKDIR /app/backend

COPY ./backend/mvnw .
COPY ./backend/.mvn ./.mvn
COPY ./backend/pom.xml .

RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

COPY ./backend/src ./src

# no tests
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

RUN groupadd --system appuser && useradd --system --gid appuser appuser

COPY --from=backend-builder /app/backend/target/ebs.jar ./ebs.jar

RUN mkdir -p ./static-content
COPY ./frontend ./static-content/

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "./ebs.jar"]
