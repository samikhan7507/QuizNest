package com.quiznest;

import java.util.List;
import java.util.Map;

/** Small request/response objects used by the REST API. */
public class Dto {
    public record CategoryInfo(String name, long count) {}

    /** A question as sent to the player: the correct answer is NOT included. */
    public record QuestionView(Long id, String text, List<String> options) {}

    /** answers: questionId -> chosen option index (-1 means skipped). */
    public record SubmitRequest(String playerName, String category, Map<Long, Integer> answers, int seconds) {}

    public record ReviewItem(Long id, int correctIndex, int chosenIndex, boolean correct, String explanation) {}

    public record SubmitResponse(int score, int total, int percent, List<ReviewItem> review) {}

    public record LeaderRow(String playerName, String category, int score, int total, int percent, int seconds) {}

    public record NewQuestion(String category, String text, List<String> options, int correctIndex, String explanation) {}
}
