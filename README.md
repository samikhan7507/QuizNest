# QuizNest

A responsive online quiz app built with **Java 17 + Spring Boot 3**, Spring Data JPA and an H2 file database.
The same app works on a laptop browser and on a phone, in a clean light theme.

## Features
- Topics: Java, DSA, DBMS, Operating Systems, Data Science & ML, plus a Mixed mode
- Choose 5, 10 or 15 random questions per attempt, with a live timer and progress bar
- Instant score, plus a review of every answer with a short explanation
- Leaderboard (all topics or per topic)
- Add your own questions from the app (protected by an admin key)
- Correct answers are never sent to the browser until you submit
- Keyboard shortcuts on laptop: 1-4 to choose, arrow keys to move, Enter for next

## Run it
Requirements: JDK 17+ and Maven.

    mvn spring-boot:run

Open http://localhost:8080

## Open it on your phone
1. Connect the phone and laptop to the same Wi-Fi.
2. Find the laptop's IP address (`ipconfig` on Windows, `ifconfig` on Mac/Linux), for example 192.168.1.8.
3. On the phone open http://192.168.1.8:8080
4. Use the browser menu, then "Add to Home screen", to get an app-like icon.

## Admin key
Default key is `admin123`. Change it with an environment variable before sharing:

    ADMIN_KEY=my-secret-key mvn spring-boot:run

## Deploy (Render, Docker)
The included Dockerfile builds the app. On Render create a Web Service from the repo, choose Docker,
and set `ADMIN_KEY`. Note: the H2 file database is erased on each redeploy on free hosting.
For permanent data, switch to PostgreSQL (add the driver and change `spring.datasource.*`).

## Project structure
    src/main/java/com/quiznest
      QuizApplication.java    app entry point
      QuizController.java     REST API (/api/categories, /quiz, /submit, /leaderboard, /admin/questions)
      Question, QuizResult    JPA entities
      *Repository.java        Spring Data repositories
      Dto.java                request and response records
      DataSeeder.java         30 starter questions
    src/main/resources/static  index.html, style.css, app.js (the whole UI)
