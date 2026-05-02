/**
 * Test Taker Module
 * Handles test taking experience with timing, scoring, and results
 *
 * @namespace TestTaker
 */

const TestTaker = {
  // Current test state
  _currentTest: null,
  _currentQuestionIndex: 0,
  _answers: [],
  _timer: null,
  _timeSpent: 0,

  // DOM element cache
  _elements: {},

  /**
   * Initialize test taker with event listeners
   */
  init() {
    this._cacheElements();
    this._setupEventListeners();
  },

  /**
   * Cache DOM elements for performance
   * @private
   */
  _cacheElements() {
    this._elements = {
      startBtn: document.getElementById("start-test"),
      prevBtn: document.getElementById("prev-question"),
      nextBtn: document.getElementById("next-question"),
      submitBtn: document.getElementById("submit-test"),
      viewDashboardBtn: document.getElementById("view-dashboard"),
    };
  },

  /**
   * Setup all event listeners
   * @private
   */
  _setupEventListeners() {
    if (this._elements.startBtn) {
      this._elements.startBtn.addEventListener("click", () =>
        this._handleStartTest(),
      );
    }
    if (this._elements.prevBtn) {
      this._elements.prevBtn.addEventListener("click", () =>
        this._handlePrevQuestion(),
      );
    }
    if (this._elements.nextBtn) {
      this._elements.nextBtn.addEventListener("click", () =>
        this._handleNextQuestion(),
      );
    }
    if (this._elements.submitBtn) {
      this._elements.submitBtn.addEventListener("click", () =>
        this._handleSubmitTest(),
      );
    }
    if (this._elements.viewDashboardBtn) {
      this._elements.viewDashboardBtn.addEventListener("click", () =>
        this._handleViewDashboard(),
      );
    }
  },

  /**
   * Handle starting a new test
   * @private
   */
  async _handleStartTest() {
    const category = document.getElementById("take-test-category").value;
    const difficulty = document.getElementById("take-difficulty").value;

    let test = null;
    const currentTestId = StorageManager.getCurrentTestId?.();

    if (currentTestId) {
      test = TestGenerator.getTestById(currentTestId);
      if (
        test &&
        (test.category !== category || test.difficulty !== difficulty)
      ) {
        test = null;
      }
    }

    if (!test) {
      const startBtn = this._elements.startBtn;
      startBtn.textContent = "Generating Test...";
      startBtn.disabled = true;

      try {
        const questions = await API.generateTest({
          userType: "general",
          category,
          difficulty,
          questionCount: 10,
        });

        test = {
          id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          userType: "general",
          category,
          difficulty,
          questionCount: questions.length,
          questions,
        };

        StorageManager.saveGeneratedTest(test);
      } catch (error) {
        console.error("Test generation failed:", error);
        startBtn.textContent = "Start Test";
        startBtn.disabled = false;

        if (error.code === "QUOTA_EXCEEDED") {
          alert(
            `⏱️ Rate limit exceeded. Please wait ${error.retryAfter} seconds and try again.`,
          );
        } else {
          alert("❌ Failed to generate test. Please try again.");
        }
        return;
      }

      startBtn.textContent = "Start Test";
      startBtn.disabled = false;
    }

    this.loadAndStartTest(test.id);
  },

  /**
   * Load and start a test by ID
   * @param {string} testId - Test ID to start
   */
  loadAndStartTest(testId) {
    const test = TestGenerator.getTestById(testId);
    if (!test) {
      console.error("Test not found:", testId);
      return;
    }

    // Initialize state
    this._currentTest = test;
    this._currentQuestionIndex = 0;
    this._answers = new Array(test.questions.length).fill(null);
    this._timeSpent = 0;

    // Update UI
    document.getElementById("test-selection").classList.add("hidden");
    document.getElementById("test-container").classList.remove("hidden");
    document.getElementById("test-title").textContent =
      `${TestGenerator.formatCategory(test.category)} - ${TestGenerator.formatDifficulty(test.difficulty)}`;

    // Start timer and show first question
    this._startTimer();
    this._showQuestion(0);
  },

  /**
   * Start the test timer
   * @private
   */
  _startTimer() {
    if (this._timer) clearInterval(this._timer);

    const timerDisplay = document.getElementById("test-timer");
    const startTime = Date.now();

    this._timer = setInterval(() => {
      this._timeSpent = Math.floor((Date.now() - startTime) / 1000);
      timerDisplay.textContent = this._formatTime(this._timeSpent);
    }, 1000);
  },

  /**
   * Format seconds as MM:SS
   * @private
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time
   */
  _formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },

  /**
   * Display a question by index
   * @private
   * @param {number} index - Question index
   */
  _showQuestion(index) {
    if (
      !this._currentTest ||
      index < 0 ||
      index >= this._currentTest.questions.length
    ) {
      return;
    }

    this._currentQuestionIndex = index;
    const question = this._currentTest.questions[index];
    const container = document.getElementById("question-container");

    // Update progress bar
    const progressPercent =
      ((index + 1) / this._currentTest.questions.length) * 100;
    document.getElementById("progress-bar").style.width = `${progressPercent}%`;

    let html = `
      <div class="mb-4">
        <div class="text-sm text-gray-500 mb-1">Question ${index + 1} of ${this._currentTest.questions.length}</div>
        <div class="question-text">${question.question_text}</div>
      </div>
    `;

    if (question.type === "reading" && question.passage) {
      html += `<div class="reading-passage">${question.passage}</div>`;
    }

    // Render question based on type
    switch (question.type) {
      case "multiple_choice":
        html += this._renderMultipleChoiceQuestion(question, index);
        break;
      case "text_input":
      case "writing":
        html += this._renderTextInputQuestion(question, index);
        break;
      default:
        html += "<p>Unsupported question type.</p>";
    }

    container.innerHTML = html;

    // Attach event listeners
    if (question.type === "multiple_choice") {
      container.querySelectorAll(".option").forEach((option) => {
        option.addEventListener("click", (e) => this._handleOptionSelect(e));
      });
    } else if (question.type === "text_input" || question.type === "writing") {
      const textarea = container.querySelector(".text-answer");
      textarea.addEventListener("input", (e) => this._handleTextInput(e));
      if (this._answers[index]) {
        textarea.value = this._answers[index];
      }
    }

    this._updateNavigationButtons();
  },

  /**
   * Render multiple choice question
   * @private
   * @param {Object} question - Question data
   * @param {number} index - Question index
   * @returns {string} - HTML string
   */
  _renderMultipleChoiceQuestion(question, index) {
    let html = '<div class="options-container">';

    question.options.forEach((option, optIndex) => {
      const isSelected = this._answers[index] === option;
      const selectedClass = isSelected ? "selected" : "";

      html += `
        <div class="option ${selectedClass}" data-index="${optIndex}" data-value="${option}">
          <div class="flex items-center">
            <div class="w-5 h-5 rounded-full border border-gray-400 mr-3 flex items-center justify-center">
              ${isSelected ? '<div class="w-3 h-3 rounded-full bg-blue-600"></div>' : ""}
            </div>
            <div>${option}</div>
          </div>
        </div>
      `;
    });

    html += "</div>";
    return html;
  },

  /**
   * Render text input question
   * @private
   * @param {Object} question - Question data
   * @param {number} index - Question index
   * @returns {string} - HTML string
   */
  _renderTextInputQuestion(question, index) {
    return `
      <div>
        ${question.criteria ? `<p class="text-sm text-gray-600 mb-2">Criteria: ${question.criteria}</p>` : ""}
        <textarea class="text-answer" placeholder="Type your answer here...">${this._answers[index] || ""}</textarea>
      </div>
    `;
  },

  /**
   * Update navigation buttons state
   * @private
   */
  _updateNavigationButtons() {
    const prevBtn = this._elements.prevBtn;
    const nextBtn = this._elements.nextBtn;
    const submitBtn = this._elements.submitBtn;

    prevBtn.disabled = this._currentQuestionIndex === 0;
    prevBtn.classList.toggle("opacity-50", prevBtn.disabled);

    const isLastQuestion =
      this._currentQuestionIndex === this._currentTest.questions.length - 1;
    nextBtn.classList.toggle("hidden", isLastQuestion);
    submitBtn.classList.toggle("hidden", !isLastQuestion);
  },

  /**
   * Handle option selection
   * @private
   * @param {Event} event - Click event
   */
  _handleOptionSelect(event) {
    const optionDiv = event.currentTarget;
    const value = optionDiv.dataset.value;

    this._answers[this._currentQuestionIndex] = value;

    const options = optionDiv.parentElement.querySelectorAll(".option");
    options.forEach((opt) => {
      opt.classList.remove("selected");
      opt.querySelector(".w-3")?.remove();
    });

    optionDiv.classList.add("selected");
    const indicator = optionDiv.querySelector(".w-5");
    indicator.innerHTML =
      '<div class="w-3 h-3 rounded-full bg-blue-600"></div>';
  },

  /**
   * Handle text input
   * @private
   * @param {Event} event - Input event
   */
  _handleTextInput(event) {
    this._answers[this._currentQuestionIndex] = event.currentTarget.value;
  },

  /**
   * Navigate to previous question
   * @private
   */
  _handlePrevQuestion() {
    if (this._currentQuestionIndex > 0) {
      this._showQuestion(this._currentQuestionIndex - 1);
    }
  },

  /**
   * Navigate to next question
   * @private
   */
  _handleNextQuestion() {
    if (this._currentQuestionIndex < this._currentTest.questions.length - 1) {
      this._showQuestion(this._currentQuestionIndex + 1);
    }
  },

  /**
   * Handle test submission
   * @private
   */
  async _handleSubmitTest() {
    clearInterval(this._timer);

    const score = this._calculateScore();
    const wrongAnswers = this._getWrongAnswers();
    const skillLevel = this._getSkillLevel(score.percentage);

    // Hide test container and show results
    document.getElementById("test-container").classList.add("hidden");
    document.getElementById("test-result").classList.remove("hidden");

    // Display score
    document.getElementById("score-percentage").textContent =
      `${score.percentage}%`;
    document.getElementById("skill-level").innerHTML = `
      <p>Your skill level: <strong>${skillLevel}</strong></p>
      <p>You answered ${score.correct} out of ${this._currentTest.questions.length} questions correctly.</p>
      <p>Time taken: ${this._formatTime(this._timeSpent)}</p>
    `;

    // Show loading message
    document.getElementById("recommendation-text").innerHTML = `
      <div class="flex justify-center items-center py-6">
        <div class="spinner mr-3"></div>
        <p>Generating personalized recommendations...</p>
      </div>
    `;

    // Generate recommendations
    let recommendations = await this._getRecommendations(
      score,
      wrongAnswers,
      skillLevel,
    );

    // Display recommendations
    document.getElementById("recommendation-text").innerHTML =
      this._formatRecommendations(recommendations);

    // Save results
    StorageManager.saveTestResult({
      testId: this._currentTest.id,
      category: this._currentTest.category,
      difficulty: this._currentTest.difficulty,
      score: score.percentage,
      timeSpent: this._timeSpent,
      timestamp: new Date().toISOString(),
      skillLevel,
      recommendations,
    });
  },

  /**
   * Get recommendations from API with error handling
   * @private
   * @param {Object} score - Score object
   * @param {Array} wrongAnswers - Wrong answer concepts
   * @param {string} skillLevel - Skill level
   * @returns {Promise<Object>} - Recommendations
   */
  async _getRecommendations(score, wrongAnswers, skillLevel) {
    try {
      return await API.generateRecommendations({
        category: this._currentTest.category,
        score: score.percentage,
        wrongAnswers,
        userType: this._currentTest.userType,
      });
    } catch (error) {
      console.error("Recommendations failed:", error);

      if (error.code === "QUOTA_EXCEEDED") {
        return {
          skillLevel,
          strengths: ["Assessment completed"],
          weaknesses: ["Unable to fetch personalized analysis"],
          recommendations: [
            `Please wait ${error.retryAfter} seconds and refresh for detailed recommendations.`,
            "The AI service is temporarily rate-limited.",
          ],
          resources: [
            {
              title: "Skill Development Guide",
              type: "website",
              description: "General tips for skill improvement",
            },
          ],
        };
      }

      return API.getDefaultRecommendations();
    }
  },

  /**
   * Calculate test score
   * @private
   * @returns {Object} - Score information
   */
  _calculateScore() {
    let correct = 0;

    this._currentTest.questions.forEach((question, i) => {
      if (question.type === "multiple_choice") {
        if (this._answers[i] === question.correct_answer) {
          correct++;
        }
      } else if (this._answers[i] && this._answers[i].length > 50) {
        correct += 0.5;
      }
    });

    const total = this._currentTest.questions.length;
    return {
      correct,
      total,
      percentage: Math.round((correct / total) * 100),
    };
  },

  /**
   * Get skill level from score
   * @private
   * @param {number} percentage - Score percentage
   * @returns {string} - Skill level
   */
  _getSkillLevel(percentage) {
    if (percentage >= 80) return "Advanced";
    if (percentage >= 50) return "Intermediate";
    return "Beginner";
  },

  /**
   * Get wrong answers for recommendations
   * @private
   * @returns {Array} - Concepts from wrong answers
   */
  _getWrongAnswers() {
    const wrongAnswers = [];

    this._currentTest.questions.forEach((question, i) => {
      if (
        question.type === "multiple_choice" &&
        this._answers[i] !== question.correct_answer
      ) {
        const concept = question.question_text.split(" ").slice(0, 3).join(" ");
        wrongAnswers.push(concept);
      }
    });

    return wrongAnswers;
  },

  /**
   * Format recommendations for display
   * @private
   * @param {Object} recs - Recommendations from API
   * @returns {string} - Formatted HTML
   */
  _formatRecommendations(recs) {
    const skillLevelPercentage = {
      beginner: 33,
      intermediate: 66,
      advanced: 100,
    };

    const levelPercentage =
      skillLevelPercentage[recs.skillLevel.toLowerCase()] || 50;

    return `
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <h5 class="font-semibold text-gray-800">Skill Proficiency Level:</h5>
          <span class="text-sm font-medium capitalize text-blue-700">${recs.skillLevel}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${levelPercentage}%"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-green-50 p-4 rounded-lg border border-green-100">
          <h5 class="font-semibold text-green-800 flex items-center mb-3">
            <i class="fa-solid fa-circle-check mr-2"></i>
            Strengths
          </h5>
          <ul class="list-disc pl-5 space-y-1.5 text-green-800">
            ${recs.strengths.map((s) => `<li>${s}</li>`).join("")}
          </ul>
        </div>

        <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <h5 class="font-semibold text-amber-800 flex items-center mb-3">
            <i class="fa-solid fa-triangle-exclamation mr-2"></i>
            Areas for Improvement
          </h5>
          <ul class="list-disc pl-5 space-y-1.5 text-amber-800">
            ${recs.weaknesses.map((w) => `<li>${w}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div class="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h5 class="font-semibold text-blue-800 flex items-center mb-3">
          <i class="fa-solid fa-lightbulb mr-2"></i>
          Professional Development Plan
        </h5>
        <ol class="list-decimal pl-5 space-y-2 text-blue-800">
          ${recs.recommendations.map((r) => `<li class="pb-2">${r}</li>`).join("")}
        </ol>
      </div>

      <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <h5 class="font-semibold text-indigo-800 flex items-center mb-3">
          <i class="fa-solid fa-book mr-2"></i>
          Recommended Resources
        </h5>
        <div class="space-y-3">
          ${recs.resources
            .map(
              (r) => `
            <div class="resource-item border-l-4 border-indigo-300 pl-3 py-1">
              <h6 class="font-medium text-indigo-900">${r.title}</h6>
              <div class="flex items-center text-xs text-indigo-600 mb-1">
                <span class="bg-indigo-100 rounded px-2 py-0.5">${r.type}</span>
              </div>
              <p class="text-indigo-800 text-sm">${r.description}</p>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  },

  /**
   * Handle view dashboard button
   * @private
   */
  _handleViewDashboard() {
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    if (dashboardTab) dashboardTab.click();
  },

  /**
   * Public method to get current test for testing
   */
  getCurrentTest() {
    return this._currentTest;
  },

  /**
   * Public method to get current answers for testing
   */
  getAnswers() {
    return this._answers;
  },
};

// Initialize test taker when document is ready
document.addEventListener("DOMContentLoaded", () => {
  TestTaker.init();
});
