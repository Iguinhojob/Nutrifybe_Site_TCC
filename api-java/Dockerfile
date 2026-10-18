FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# O .env é versionado intencionalmente para a apresentação do projeto.
COPY .env .env
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/nutrifybe-api-1.0.0.jar app.jar
# O contêiner final também precisa do arquivo para carregar as configurações no Render.
COPY .env .env
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
