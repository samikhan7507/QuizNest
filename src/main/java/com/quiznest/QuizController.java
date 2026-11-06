package com.quiznest;

import com.quiznest.Dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class QuizController {

    private final QuestionRepository questions;
    private final ResultRepository results;

    @Value("${app.admin-key}")
    private String adminKey;

    public QuizController(QuestionRepository questions, ResultRepository results) {
        this.questions = questions;
        this.results = results;
    }

    private static boolean isAll(String category) {
        return category == null || category.isBlank() || "All".equalsIgnoreCase(category);
    }

    @GetMapping("/categories")
    public List<CategoryInfo> categories() {
        return questions.findAll().stream()
                .collect(Collectors.groupingBy(Question::getCategory, TreeMap::new, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new CategoryInfo(e.getKey(), e.getValue()))
                .toList();
    }

    @GetMapping("/quiz")
    public List<QuestionView> quiz(@RequestParam(defaultValue = "All") String category,
                                   @RequestParam(defaultValue = "10") int count) {
        List<Question> pool = new ArrayList<>(isAll(category) ? questions.findAll() : questions.findByCategory(category));
        if (pool.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No questions found for this topic.");
        }
        Collections.shuffle(pool);
        int n = Math.max(1, Math.min(count, Math.min(pool.size(), 30)));
        return pool.subList(0, n).stream()
                .map(q -> new QuestionView(q.getId(), q.getQuestionText(), new ArrayList<>(q.getOptions())))
                .toList();
    }

    @PostMapping("/submit")
    public SubmitResponse submit(@RequestBody SubmitRequest req) {
        if (req.answers() == null || req.answers().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No answers received.");
        }
        Map<Long, Question> byId = questions.findAllById(req.answers().keySet()).stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        List<ReviewItem> review = new ArrayList<>();
        int score = 0;
        for (Map.Entry<Long, Integer> e : req.answers().entrySet()) {
            Question q = byId.get(e.getKey());
            if (q == null) continue;
            int chosen = e.getValue() == null ? -1 : e.getValue();
            boolean correct = chosen == q.getCorrectIndex();
            if (correct) score++;
            review.add(new ReviewItem(q.getId(), q.getCorrectIndex(), chosen, correct, q.getExplanation()));
        }
        int total = review.size();
        if (total == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown questions.");
        }
        int percent = Math.round(score * 100f / total);

        String name = req.playerName() == null ? "" : req.playerName().trim();
        if (name.isEmpty()) name = "Guest";
        if (name.length() > 30) name = name.substring(0, 30);

        QuizResult r = new QuizResult();
        r.setPlayerName(name);
        r.setCategory(isAll(req.category()) ? "All" : req.category());
        r.setScore(score);
        r.setTotalQuestions(total);
        r.setScorePercent(percent);
        r.setTimeSeconds(Math.max(0, Math.min(req.seconds(), 86_400)));
        results.save(r);

        return new SubmitResponse(score, total, percent, review);
    }

    @GetMapping("/leaderboard")
    public List<LeaderRow> leaderboard(@RequestParam(required = false) String category) {
        List<QuizResult> rows = isAll(category)
                ? results.findTop20ByOrderByScorePercentDescTimeSecondsAsc()
                : results.findTop20ByCategoryOrderByScorePercentDescTimeSecondsAsc(category);
        return rows.stream()
                .map(r -> new LeaderRow(r.getPlayerName(), r.getCategory(), r.getScore(),
                        r.getTotalQuestions(), r.getScorePercent(), r.getTimeSeconds()))
                .toList();
    }

    @PostMapping("/admin/questions")
    public Map<String, Object> addQuestion(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                           @RequestBody NewQuestion nq) {
        if (!adminKey.equals(key)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong admin key.");
        }
        if (nq.category() == null || nq.category().isBlank()
                || nq.text() == null || nq.text().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Topic and question text are required.");
        }
        List<String> opts = nq.options() == null ? List.of()
                : nq.options().stream().map(s -> s == null ? "" : s.trim()).filter(s -> !s.isEmpty()).toList();
        if (opts.size() < 2 || opts.size() > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide 2 to 4 answer options.");
        }
        if (nq.correctIndex() < 0 || nq.correctIndex() >= opts.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick which option is correct.");
        }
        Question q = new Question();
        q.setCategory(nq.category().trim());
        q.setQuestionText(nq.text().trim());
        q.setOptions(new ArrayList<>(opts));
        q.setCorrectIndex(nq.correctIndex());
        q.setExplanation(nq.explanation() == null ? "" : nq.explanation().trim());
        questions.save(q);
        return Map.of("id", q.getId());
    }
}
