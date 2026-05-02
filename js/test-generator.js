/**
 * Test Generator Module
 * Creates and manages test generation with API integration and error handling
 *
 * @namespace TestGenerator
 */

const TestGenerator = {
  // Current generated test
  _currentTest: null,

  // Category and difficulty mappings
  _categories: {
    aptitude: "Aptitude",
    reading: "Reading Skills",
    writing: "Writing Skills",
    personality: "Personality Assessment",
  },

  _difficulties: {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  },

  /**
   * Initialize test generator with event listeners
   */
  init() {
    const generateForm = document.getElementById("generate-form");
    const takeGeneratedTestBtn = document.getElementById("take-generated-test");

    if (generateForm) {
      generateForm.addEventListener("submit", (e) =>
        this._handleGenerateForm(e),
      );
    }

    if (takeGeneratedTestBtn) {
      takeGeneratedTestBtn.addEventListener("click", () =>
        this._handleTakeGeneratedTest(),
      );
    }
  },

  /**
   * Handle form submission to generate test
   * @private
   * @param {Event} event - Form submit event
   */
  async _handleGenerateForm(event) {
    event.preventDefault();

    const userType = document.getElementById("user-type").value;
    const category = document.getElementById("test-category").value;
    const difficulty = document.getElementById("difficulty").value;
    const questionCount = parseInt(
      document.getElementById("question-count").value,
    );

    const submitBtn = event.submitter;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Generating...";
    submitBtn.disabled = true;

    try {
      const questions = await API.generateTest({
        userType,
        category,
        difficulty,
        questionCount,
      });

      this._currentTest = {
        id: this._generateTestId(),
        timestamp: new Date().toISOString(),
        userType,
        category,
        difficulty,
        questionCount,
        questions,
      };

      StorageManager.saveGeneratedTest(this._currentTest);
      this._displayTestDetails(this._currentTest);
    } catch (error) {
      console.error("Test generation failed:", error);
      this._handleGenerationError(error);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  },

  /**
   * Handle test generation errors
   * @private
   * @param {Error} error - Error object
   */
  _handleGenerationError(error) {
    const detailsDiv = document.getElementById("test-details");
    const resultDiv = document.getElementById("generation-result");

    if (error.code === "QUOTA_EXCEEDED") {
      detailsDiv.innerHTML = `
        <div class="text-red-600 p-4 bg-red-100 rounded">
          <strong>⏱️ Rate Limit Exceeded</strong>
          <p>Please wait ${error.retryAfter} seconds before generating another test.</p>
          <p>This is a temporary limit on the free AI service tier.</p>
        </div>
      `;
    } else {
      detailsDiv.innerHTML = `
        <div class="text-red-600 p-4 bg-red-100 rounded">
          <strong>❌ Error Generating Test</strong>
          <p>Failed to generate test. Using default questions instead.</p>
          <p class="text-sm text-gray-600">Try again in a moment.</p>
        </div>
      `;
    }

    resultDiv.classList.remove("hidden");
  },

  /**
   * Generate unique test ID
   * @private
   * @returns {string} - Unique test ID
   */
  _generateTestId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Display test details after generation
   * @private
   * @param {Object} test - Generated test
   */
  _displayTestDetails(test) {
    const resultDiv = document.getElementById("generation-result");
    const detailsDiv = document.getElementById("test-details");

    detailsDiv.innerHTML = `
      <p><strong>Category:</strong> ${this._formatCategory(test.category)}</p>
      <p><strong>Difficulty:</strong> ${this._formatDifficulty(test.difficulty)}</p>
      <p><strong>Questions:</strong> ${test.questionCount}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    `;

    resultDiv.classList.remove("hidden");
  },

  /**
   * Format category name for display
   * @private
   * @param {string} category - Category ID
   * @returns {string} - Formatted name
   */
  _formatCategory(category) {
    return this._categories[category] || category;
  },

  /**
   * Format difficulty name for display
   * @private
   * @param {string} difficulty - Difficulty ID
   * @returns {string} - Formatted name
   */
  _formatDifficulty(difficulty) {
    return this._difficulties[difficulty] || difficulty;
  },

  /**
   * Format category name (public for use by other modules)
   * @param {string} category - Category ID
   * @returns {string} - Formatted name
   */
  formatCategory(category) {
    return this._formatCategory(category);
  },

  /**
   * Format difficulty name (public for use by other modules)
   * @param {string} difficulty - Difficulty ID
   * @returns {string} - Formatted name
   */
  formatDifficulty(difficulty) {
    return this._formatDifficulty(difficulty);
  },

  /**
   * Handle taking generated test
   * @private
   */
  _handleTakeGeneratedTest() {
    if (this._currentTest) {
      const takeTab = document.querySelector('[data-tab="take"]');
      if (takeTab) takeTab.click();
      TestTaker.loadAndStartTest(this._currentTest.id);
    }
  },

  /**
   * Get test by ID from storage
   * @param {string} testId - Test ID
   * @returns {Object|null} - Test object or null
   */
  getTestById(testId) {
    return (
      StorageManager.getGeneratedTests().find((test) => test.id === testId) ||
      null
    );
  },
};
