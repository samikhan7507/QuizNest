package com.quiznest;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findTop20ByOrderByScorePercentDescTimeSecondsAsc();
    List<QuizResult> findTop20ByCategoryOrderByScorePercentDescTimeSecondsAsc(String category);
}
