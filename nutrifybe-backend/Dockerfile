FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean install -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/nutrifybe-backend-1.0.0.jar app.jar
EXPOSE $PORT
CMD java -Dserver.port=$PORT -jar app.jar