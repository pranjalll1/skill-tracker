/**
 * Dashboard Module
 * Handles visualization of test results and progress with data persistence
 *
 * @namespace Dashboard
 */

const Dashboard = {
  // Store loaded results
  results: [],

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
   * Initialize dashboard functionality
   */
  init() {
    this._loadResults();
    if (document.getElementById("dashboard")?.classList.contains("active")) {
      this.renderDashboard();
    }
  },

  /**
   * Load test results from storage manager
   * @private
   */
  _loadResults() {
    this.results = StorageManager.getTestResults().sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  },

  /**
   * Render the complete dashboard with all visualizations
   */
  renderDashboard() {
    this._renderRecentTests();
    this._renderSkillsChart();
    this._renderProgressChart();
    this._renderRecommendations();
  },

  /**
   * Render the recent tests table
   * @private
   */
  _renderRecentTests() {
    const tableBody = document.getElementById("tests-table");
    if (!tableBody) return;

    if (this.results.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-4 text-center text-gray-500">No test history available</td>
        </tr>
      `;
      return;
    }

    const html = this.results
      .slice(0, 5)
      .map(
        (result) => `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4">${new Date(result.timestamp).toLocaleDateString()}</td>
          <td class="px-6 py-4">${this._formatCategory(result.category)}</td>
          <td class="px-6 py-4">${this._formatDifficulty(result.difficulty)}</td>
          <td class="px-6 py-4">${result.score}%</td>
          <td class="px-6 py-4">
            <button class="view-result-btn text-blue-600 hover:underline" data-id="${result.testId}">
              View Details
            </button>
          </td>
        </tr>
      `,
      )
      .join("");

    tableBody.innerHTML = html;

    tableBody.querySelectorAll(".view-result-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        this._viewResultDetails(btn.dataset.id),
      );
    });
  },

  /**
   * Format category names for display
   * @private
   * @param {string} category - Category ID
   * @returns {string} - Formatted category name
   */
  _formatCategory(category) {
    return this._categories[category] || category;
  },

  /**
   * Format difficulty levels for display
   * @private
   * @param {string} difficulty - Difficulty ID
   * @returns {string} - Formatted difficulty name
   */
  _formatDifficulty(difficulty) {
    return this._difficulties[difficulty] || difficulty;
  },

  /**
   * Render skills bar chart by category
   * @private
   */
  _renderSkillsChart() {
    const chartContainer = document.getElementById("skills-chart");
    if (!chartContainer) return;

    if (this.results.length === 0) {
      chartContainer.innerHTML = `<p class="text-center text-gray-500 py-16">Complete tests to see your skills chart</p>`;
      return;
    }

    const avgScores = this._calculateAverageScores();
    const html = Object.entries(avgScores)
      .map(
        ([category, score]) => `
        <div class="mb-4">
          <div class="flex justify-between items-center mb-1">
            <div>${this._formatCategory(category)}</div>
            <div>${score}%</div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${score}%"></div>
          </div>
        </div>
      `,
      )
      .join("");

    chartContainer.innerHTML = `<div class="py-4">${html}</div>`;
  },

  /**
   * Calculate average scores per category
   * @private
   * @returns {Object} - Average scores by category
   */
  _calculateAverageScores() {
    const grouped = {};

    this.results.forEach((result) => {
      if (!grouped[result.category]) {
        grouped[result.category] = [];
      }
      grouped[result.category].push(result.score);
    });

    const avgScores = {};
    for (const [category, scores] of Object.entries(grouped)) {
      avgScores[category] = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      );
    }

    return avgScores;
  },

  /**
   * Render progress line chart over time
   * @private
   */
  _renderProgressChart() {
    const chartContainer = document.getElementById("progress-chart");
    if (!chartContainer) return;

    if (this.results.length < 2) {
      chartContainer.innerHTML = `<p class="text-center text-gray-500 py-16">Complete more tests to see your progress</p>`;
      return;
    }

    const sortedResults = [...this.results].sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    const points = sortedResults.slice(0, 5).map((result, index) => ({
      x: Math.round((index / 4) * 100),
      y: Math.round(100 - result.score),
      date: new Date(result.timestamp).toLocaleDateString(),
    }));

    const pointsString = points.map((p) => `${p.x},${p.y}`).join(" ");
    const circlesHtml = points
      .map((p) => `<circle cx="${p.x}%" cy="${p.y}%" r="4" fill="#2563eb"/>`)
      .join("");
    const datesHtml = points.map((p) => `<div>${p.date}</div>`).join("");

    chartContainer.innerHTML = `
      <div class="relative h-full py-4">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          ${datesHtml}
        </div>
        <div class="relative h-32 mt-2">
          <svg class="absolute inset-0 w-full h-full">
            <polyline points="${pointsString}" fill="none" stroke="#2563eb" stroke-width="2"/>
            ${circlesHtml}
          </svg>
        </div>
        <div class="mt-2 text-xs text-gray-500">Score percentages over time</div>
      </div>
    `;
  },

  /**
   * Render latest recommendations
   * @private
   */
  _renderRecommendations() {
    const recommendationsDiv = document.getElementById("ai-recommendations");
    if (!recommendationsDiv) return;

    if (this.results.length === 0) {
      recommendationsDiv.innerHTML = `<p class="text-gray-500">Complete more tests to receive personalized recommendations</p>`;
      return;
    }

    const latestResult = this.results.find((r) => r.recommendations);

    if (!latestResult?.recommendations) {
      recommendationsDiv.innerHTML = `<p class="text-gray-500">No recommendations available yet</p>`;
      return;
    }

    const recs = latestResult.recommendations;
    const recsHtml = recs.recommendations
      .slice(0, 3)
      .map((r) => `<li>${r}</li>`)
      .join("");
    const resourcesHtml = recs.resources
      .slice(0, 2)
      .map((r) => `<li><strong>${r.title}</strong>: ${r.description}</li>`)
      .join("");

    recommendationsDiv.innerHTML = `
      <div>
        <p class="mb-2">Based on your ${this._formatCategory(latestResult.category)} assessment:</p>
        <div class="mb-3">
          <h5 class="font-semibold">Recommendations:</h5>
          <ul class="list-disc pl-5">${recsHtml}</ul>
        </div>
        <div>
          <h5 class="font-semibold">Suggested Resources:</h5>
          <ul class="list-disc pl-5">${resourcesHtml}</ul>
        </div>
      </div>
    `;
  },

  /**
   * View detailed results for a specific test
   * @private
   * @param {string} testId - Test ID to view
   */
  _viewResultDetails(testId) {
    const result = this.results.find((r) => r.testId === testId);
    if (!result) return;

    const recHtml = result.recommendations
      ? `
      <div class="mb-6">
        <h4 class="font-semibold mb-2">Recommendations</h4>
        <div class="p-4 bg-gray-50 rounded">
          <div class="mb-3">
            <h5 class="font-medium">Strengths:</h5>
            <ul class="list-disc pl-5">${result.recommendations.strengths.map((s) => `<li>${s}</li>`).join("")}</ul>
          </div>
          <div class="mb-3">
            <h5 class="font-medium">Areas for Improvement:</h5>
            <ul class="list-disc pl-5">${result.recommendations.weaknesses.map((w) => `<li>${w}</li>`).join("")}</ul>
          </div>
          <div>
            <h5 class="font-medium">Suggested Resources:</h5>
            <ul class="list-disc pl-5">${result.recommendations.resources.map((r) => `<li><strong>${r.title}</strong>: ${r.description}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
    `
      : "";

    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-semibold">Test Result Details</h3>
          <button class="close-modal text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div><p class="text-sm text-gray-500">Category</p><p class="font-medium">${this._formatCategory(result.category)}</p></div>
            <div><p class="text-sm text-gray-500">Difficulty</p><p class="font-medium">${this._formatDifficulty(result.difficulty)}</p></div>
            <div><p class="text-sm text-gray-500">Score</p><p class="font-medium">${result.score}%</p></div>
            <div><p class="text-sm text-gray-500">Date</p><p class="font-medium">${new Date(result.timestamp).toLocaleDateString()}</p></div>
            <div><p class="text-sm text-gray-500">Time Spent</p><p class="font-medium">${Math.floor(result.timeSpent / 60)}m ${result.timeSpent % 60}s</p></div>
            <div><p class="text-sm text-gray-500">Skill Level</p><p class="font-medium">${result.skillLevel || "N/A"}</p></div>
          </div>
          ${recHtml}
          <div class="flex justify-end">
            <button class="close-modal bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });
  },
};

// Initialize dashboard when document is ready
document.addEventListener("DOMContentLoaded", () => {
  Dashboard.init();
});
