/**
 * Storage Manager Module
 * Handles all data persistence operations with dual-storage strategy
 * @module StorageManager
 */

const StorageManager = {
  // Storage keys
  KEYS: {
    USERS: "users",
    CURRENT_SESSION: "currentSession",
    TEST_RESULTS: "testResults",
    GENERATED_TESTS: "generatedTests",
    CHAT_HISTORY: "chatHistory",
  },

  /**
   * Initialize storage with default data structure
   * @returns {void}
   */
  init() {
    this._ensureStorageExists();
  },

  /**
   * Ensure all storage structures exist
   * @private
   * @returns {void}
   */
  _ensureStorageExists() {
    const defaults = {
      [this.KEYS.USERS]: [],
      [this.KEYS.TEST_RESULTS]: [],
      [this.KEYS.GENERATED_TESTS]: [],
      [this.KEYS.CHAT_HISTORY]: [],
    };

    Object.entries(defaults).forEach(([key, defaultValue]) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
      }
    });
  },

  /**
   * Add or update user in storage
   * @param {Object} userData - User data object
   * @returns {boolean} - Success status
   */
  saveUser(userData) {
    try {
      const users = this.getUsers();
      const existingIndex = users.findIndex((u) => u.email === userData.email);

      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...userData };
      } else {
        users.push(userData);
      }

      localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
      return true;
    } catch (error) {
      console.error("Error saving user:", error);
      return false;
    }
  },

  /**
   * Get all users
   * @returns {Array} - Array of user objects
   */
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
    } catch (error) {
      console.error("Error retrieving users:", error);
      return [];
    }
  },

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object|null} - User object or null
   */
  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find((u) => u.email === email) || null;
  },

  /**
   * Create session for user
   * @param {Object} userData - User data
   * @returns {Object} - Session object
   */
  createSession(userData) {
    const session = {
      sessionId: this._generateId(),
      userId: userData.email,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || "",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    sessionStorage.setItem(this.KEYS.CURRENT_SESSION, JSON.stringify(session));
    return session;
  },

  /**
   * Get current session
   * @returns {Object|null} - Session object or null
   */
  getCurrentSession() {
    try {
      const session = JSON.parse(
        sessionStorage.getItem(this.KEYS.CURRENT_SESSION),
      );
      if (session && new Date(session.expiresAt) > new Date()) {
        return session;
      }
      sessionStorage.removeItem(this.KEYS.CURRENT_SESSION);
      return null;
    } catch (error) {
      console.error("Error retrieving session:", error);
      return null;
    }
  },

  /**
   * Save test result
   * @param {Object} result - Test result object
   * @returns {boolean} - Success status
   */
  saveTestResult(result) {
    try {
      const results = this.getTestResults();
      result.id = this._generateId();
      result.timestamp = new Date().toISOString();
      results.push(result);
      localStorage.setItem(this.KEYS.TEST_RESULTS, JSON.stringify(results));
      return true;
    } catch (error) {
      console.error("Error saving test result:", error);
      return false;
    }
  },

  /**
   * Get all test results
   * @returns {Array} - Array of test results
   */
  getTestResults() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.TEST_RESULTS)) || [];
    } catch (error) {
      console.error("Error retrieving test results:", error);
      return [];
    }
  },

  /**
   * Get user test results
   * @param {string} email - User email
   * @returns {Array} - User's test results
   */
  getUserTestResults(email) {
    const results = this.getTestResults();
    return results.filter((r) => r.userEmail === email);
  },

  /**
   * Save generated test
   * @param {Object} test - Test object
   * @returns {boolean} - Success status
   */
  saveGeneratedTest(test) {
    try {
      const tests = this.getGeneratedTests();
      test.id = this._generateId();
      test.timestamp = new Date().toISOString();
      tests.push(test);
      localStorage.setItem(this.KEYS.GENERATED_TESTS, JSON.stringify(tests));
      return true;
    } catch (error) {
      console.error("Error saving generated test:", error);
      return false;
    }
  },

  /**
   * Get all generated tests
   * @returns {Array} - Array of generated tests
   */
  getGeneratedTests() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.GENERATED_TESTS)) || [];
    } catch (error) {
      console.error("Error retrieving generated tests:", error);
      return [];
    }
  },

  /**
   * Destroy session
   * @returns {void}
   */
  destroySession() {
    sessionStorage.removeItem(this.KEYS.CURRENT_SESSION);
  },

  /**
   * Save chat history
   * @param {Array} history - Chat history array
   * @returns {boolean} - Success status
   */
  saveChatHistory(history) {
    try {
      localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error("Error saving chat history:", error);
      return false;
    }
  },

  /**
   * Get chat history
   * @returns {Array} - Chat history array
   */
  getChatHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.CHAT_HISTORY)) || [];
    } catch (error) {
      console.error("Error retrieving chat history:", error);
      return [];
    }
  },

  /**
   * Clear chat history
   * @returns {boolean} - Success status
   */
  clearChatHistory() {
    try {
      localStorage.removeItem(this.KEYS.CHAT_HISTORY);
      return true;
    } catch (error) {
      console.error("Error clearing chat history:", error);
      return false;
    }
  },

  /**
   * Generate unique ID
   * @private
   * @returns {string} - Unique ID
   */
  _generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};

// Initialize on script load
StorageManager.init();
