# Stage 1: Build the Spring Boot application
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN ./gradlew --no-daemon bootJar -x test

# Stage 2: Run the built jar on a slim JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
