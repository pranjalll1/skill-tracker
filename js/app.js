/**
 * Main Application Module
 * Handles initialization, navigation, and global utilities
 *
 * @namespace App
 */

const App = {
  /**
   * Initialize application
   */
  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this._initModules();
      this._setupTabNavigation();
      this._setupStartButtons();
    });
  },

  /**
   * Initialize all application modules
   * @private
   */
  _initModules() {
    if (typeof TestGenerator !== "undefined") TestGenerator.init();
    if (typeof TestTaker !== "undefined") TestTaker.init();
    if (typeof Dashboard !== "undefined") Dashboard.init();
  },

  /**
   * Setup tab navigation with active tab tracking
   * @private
   */
  _setupTabNavigation() {
    const tabButtons = document.querySelectorAll(".tab-btn");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this._switchTab(button.getAttribute("data-tab"));
      });
    });
  },

  /**
   * Switch to specified tab
   * @private
   * @param {string} tabId - Tab identifier
   */
  _switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.classList.add("hidden");
      tab.classList.remove("active");
    });

    // Remove active from buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.classList.remove("hidden");
      selectedTab.classList.add("active");

      // Trigger dashboard render if switching to dashboard
      if (tabId === "dashboard" && typeof Dashboard !== "undefined") {
        Dashboard.renderDashboard();
      }
    }

    // Mark button as active
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add("active");
    }
  },

  /**
   * Setup start buttons for quick navigation
   * @private
   */
  _setupStartButtons() {
    const startButtons = document.querySelectorAll(".start-btn");

    startButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabId = button.getAttribute("data-tab");
        const tabButton = document.querySelector(
          `.tab-btn[data-tab="${tabId}"]`,
        );
        if (tabButton) tabButton.click();
      });
    });
  },

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @returns {string} - Formatted date string (MMM DD, YYYY)
   */
  formatDate(date) {
    if (typeof date === "string") {
      date = new Date(date);
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  /**
   * Format time duration in seconds to MM:SS format
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted time string
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },

  /**
   * Show notification toast message
   * @param {string} message - Notification message
   * @param {string} type - Message type: 'success' or 'error'
   * @param {number} duration - Display duration in milliseconds (default 5000)
   */
  showNotification(message, type = "success", duration = 5000) {
    const notification = document.createElement("div");
    const bgColor = type === "success" ? "bg-green-100" : "bg-red-100";
    const borderColor =
      type === "success" ? "border-green-400" : "border-red-400";
    const textColor = type === "success" ? "text-green-700" : "text-red-700";

    notification.className = `fixed top-4 right-4 ${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded shadow-lg z-50`;
    notification.innerHTML = `
      <span class="block sm:inline">${message}</span>
      <button class="absolute top-0 right-0 px-4 py-3" aria-label="Close notification">
        <svg class="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
        </svg>
      </button>
    `;

    document.body.appendChild(notification);

    // Close button handler
    notification.querySelector("button").addEventListener("click", () => {
      notification.remove();
    });

    // Auto-remove after duration
    setTimeout(() => {
      notification.remove();
    }, duration);
  },
};

// Initialize app on page load
App.init();
