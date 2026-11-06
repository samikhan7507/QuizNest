package com.quiznest;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Fills an empty database with starter questions on first run. */
@Component
public class DataSeeder implements CommandLineRunner {

    private final QuestionRepository repo;

    public DataSeeder(QuestionRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return;
        List<Question> l = new ArrayList<>();

        // ---------- Java ----------
        add(l, "Java", "Which keyword is used to inherit a class in Java?", 1,
                "A class inherits another class with extends. implements is used for interfaces.",
                "implements", "extends", "inherits", "super");
        add(l, "Java", "Which of these is NOT a primitive data type in Java?", 2,
                "String is a class (reference type). int, boolean and char are primitives.",
                "int", "boolean", "String", "char");
        add(l, "Java", "What is the default value of an int instance variable?", 0,
                "Numeric instance variables default to 0. Local variables have no default.",
                "0", "null", "undefined", "-1");
        add(l, "Java", "Which collection does not allow duplicate elements?", 2,
                "A Set, such as HashSet, stores unique elements only.",
                "ArrayList", "LinkedList", "HashSet", "Vector");
        add(l, "Java", "What does JVM stand for?", 3,
                "The Java Virtual Machine runs compiled Java bytecode on any platform.",
                "Java Variable Method", "Joint Virtual Memory", "Java Verified Module", "Java Virtual Machine");
        add(l, "Java", "Which method is the entry point of a Java program?", 1,
                "The JVM starts execution from public static void main(String[] args).",
                "start()", "public static void main(String[] args)", "run()", "init()");

        // ---------- DSA ----------
        add(l, "DSA", "What is the time complexity of binary search on a sorted array?", 2,
                "Each step halves the search space, so it takes O(log n) steps.",
                "O(n)", "O(n log n)", "O(log n)", "O(1)");
        add(l, "DSA", "Which data structure follows the LIFO principle?", 0,
                "A stack removes the most recently added element first (Last In, First Out).",
                "Stack", "Queue", "Array", "Heap");
        add(l, "DSA", "Which traversal of a binary search tree gives elements in sorted order?", 1,
                "Inorder (left, root, right) visits BST nodes in ascending order.",
                "Preorder", "Inorder", "Postorder", "Level order");
        add(l, "DSA", "What is the worst-case time complexity of quicksort?", 3,
                "With consistently bad pivots, quicksort degrades to O(n squared).",
                "O(n)", "O(n log n)", "O(log n)", "O(n squared)");
        add(l, "DSA", "Which data structure is used in Breadth-First Search (BFS)?", 1,
                "BFS explores level by level, so it uses a queue.",
                "Stack", "Queue", "Priority queue", "Tree");
        add(l, "DSA", "What is the average time to look up a key in a hash table?", 0,
                "With a good hash function, lookups take constant time, O(1), on average.",
                "O(1)", "O(n)", "O(log n)", "O(n log n)");

        // ---------- DBMS ----------
        add(l, "DBMS", "Which SQL command removes all rows from a table but keeps its structure?", 2,
                "TRUNCATE empties the table quickly and keeps the table definition. DROP removes the table itself.",
                "DROP", "DELETE TABLE", "TRUNCATE", "REMOVE");
        add(l, "DBMS", "What is true about a primary key?", 1,
                "A primary key uniquely identifies each row and cannot be NULL.",
                "It can contain duplicates", "It is unique and cannot be NULL", "A table can have many primary keys", "It must be a number");
        add(l, "DBMS", "Which normal form removes partial dependency?", 1,
                "2NF requires that non-key attributes depend on the whole primary key, not part of it.",
                "1NF", "2NF", "3NF", "BCNF");
        add(l, "DBMS", "In ACID properties, what does the letter I stand for?", 2,
                "Isolation means concurrent transactions do not interfere with each other.",
                "Integrity", "Indexing", "Isolation", "Inheritance");
        add(l, "DBMS", "Which JOIN returns only the rows that match in both tables?", 0,
                "INNER JOIN keeps rows with matching values in both tables.",
                "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN");
        add(l, "DBMS", "Which clause filters groups after GROUP BY?", 3,
                "WHERE filters rows before grouping; HAVING filters the groups afterwards.",
                "WHERE", "FILTER", "ORDER BY", "HAVING");

        // ---------- Operating Systems ----------
        add(l, "Operating Systems", "Which scheduling algorithm can cause starvation?", 2,
                "Low-priority processes may wait forever if higher-priority ones keep arriving.",
                "Round Robin", "FCFS", "Priority scheduling", "None of these");
        add(l, "Operating Systems", "Which of these is NOT a necessary condition for deadlock?", 3,
                "Deadlock needs mutual exclusion, hold and wait, no preemption and circular wait. Allowing preemption prevents it.",
                "Mutual exclusion", "Hold and wait", "Circular wait", "Resource preemption");
        add(l, "Operating Systems", "What does virtual memory do?", 1,
                "It uses disk space as an extension of RAM so programs can be larger than physical memory.",
                "Makes the CPU faster", "Uses disk space as an extension of RAM", "Encrypts memory", "Replaces the cache");
        add(l, "Operating Systems", "What do threads of the same process share?", 0,
                "Threads share the process address space (code, data, heap) but each has its own stack.",
                "Address space", "Stack", "Registers", "Program counter");
        add(l, "Operating Systems", "Which page replacement algorithm removes the page not used for the longest time?", 2,
                "LRU (Least Recently Used) evicts the page that has been idle the longest.",
                "FIFO", "Optimal", "LRU", "Random");
        add(l, "Operating Systems", "What is the smallest unit of CPU utilization?", 1,
                "A thread is the basic unit of CPU scheduling inside a process.",
                "Process", "Thread", "Program", "Job");

        // ---------- Data Science & ML ----------
        add(l, "Data Science & ML", "Which type of problem predicts a continuous value such as a house price?", 1,
                "Regression predicts numbers; classification predicts categories.",
                "Classification", "Regression", "Clustering", "Association");
        add(l, "Data Science & ML", "What does overfitting mean?", 2,
                "An overfitted model memorizes training data and performs poorly on new data.",
                "Model is too simple", "Model trains too slowly", "Works well on training data but poorly on new data", "Model has too few features");
        add(l, "Data Science & ML", "Which Python library is most used for tabular data (DataFrames)?", 0,
                "pandas provides the DataFrame structure for cleaning and analysing tables.",
                "pandas", "Flask", "Pygame", "Tkinter");
        add(l, "Data Science & ML", "Which metric is mainly used for regression, not classification?", 3,
                "Mean Squared Error measures numeric prediction error. Accuracy, precision and recall are classification metrics.",
                "Accuracy", "Precision", "Recall", "Mean Squared Error");
        add(l, "Data Science & ML", "Which of these is an unsupervised learning algorithm?", 1,
                "K-Means groups unlabeled data into clusters.",
                "Linear regression", "K-Means", "Logistic regression", "Decision tree");
        add(l, "Data Science & ML", "Why do we split data into training and test sets?", 2,
                "The test set shows how the model performs on data it has never seen.",
                "To make training faster", "To remove missing values", "To evaluate the model on unseen data", "To reduce file size");

        repo.saveAll(l);
    }

    private void add(List<Question> list, String category, String text, int correct, String why, String... options) {
        Question q = new Question();
        q.setCategory(category);
        q.setQuestionText(text);
        q.setOptions(new ArrayList<>(Arrays.asList(options)));
        q.setCorrectIndex(correct);
        q.setExplanation(why);
        list.add(q);
    }
}
