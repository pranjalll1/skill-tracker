/**
 * Authentication Module
 * Handles user authentication and session management
 * @module Authentication
 */

const Auth = {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Email validity
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with strength details
   */
  validatePassword(password) {
    const result = {
      isValid: true,
      strength: "weak",
      errors: [],
    };

    if (password.length < 6) {
      result.isValid = false;
      result.errors.push("Password must be at least 6 characters long");
    }

    if (password.length >= 6 && password.length < 12) {
      result.strength = "medium";
    } else if (password.length >= 12) {
      result.strength = "strong";
    }

    return result;
  },

  /**
   * Hash password (simple implementation - use bcrypt in production)
   * @param {string} password - Password to hash
   * @returns {string} - Hashed password
   */
  hashPassword(password) {
    return btoa(password);
  },

  /**
   * Verify password
   * @param {string} password - Plain password
   * @param {string} hash - Hashed password
   * @returns {boolean} - Match result
   */
  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Object} - Registration result
   */
  register(userData) {
    const { name, email, password, confirmPassword } = userData;

    if (!name || !email || !password || !confirmPassword) {
      return {
        success: false,
        message: "All fields are required",
      };
    }

    if (!this.validateEmail(email)) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        message: "Passwords do not match",
      };
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.errors[0],
      };
    }

    if (StorageManager.getUserByEmail(email)) {
      return {
        success: false,
        message: "Email is already registered",
      };
    }

    const newUser = {
      userId: StorageManager._generateId(),
      name,
      email,
      password: this.hashPassword(password),
      avatar: this._generateAvatar(name),
      createdAt: new Date().toISOString(),
      lastLogin: null,
      stats: {
        totalTests: 0,
        averageScore: 0,
        skillLevel: "Beginner",
      },
    };

    if (StorageManager.saveUser(newUser)) {
      return {
        success: true,
        message: "Registration successful! Please login.",
      };
    }

    return {
      success: false,
      message: "Registration failed. Please try again.",
    };
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Object} - Login result
   */
  login(credentials) {
    const { email, password, rememberMe } = credentials;

    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required",
      };
    }

    if (!this.validateEmail(email)) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    const user = StorageManager.getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    if (!this.verifyPassword(password, user.password)) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    user.lastLogin = new Date().toISOString();
    StorageManager.saveUser(user);

    const session = StorageManager.createSession(user);

    if (rememberMe) {
      localStorage.setItem(
        "rememberedUser",
        JSON.stringify({
          email: user.email,
          name: user.name,
        }),
      );
    }

    return {
      success: true,
      message: "Login successful",
      session,
    };
  },

  /**
   * Logout user
   * @returns {void}
   */
  logout() {
    StorageManager.destroySession();
    localStorage.removeItem("rememberedUser");
  },

  /**
   * Get current user
   * @returns {Object|null} - Current user or null
   */
  getCurrentUser() {
    const session = StorageManager.getCurrentSession();
    if (session) {
      return StorageManager.getUserByEmail(session.email);
    }
    return null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated() {
    return StorageManager.getCurrentSession() !== null;
  },

  /**
   * Generate avatar initials
   * @private
   * @param {string} name - User name
   * @returns {string} - Avatar initials
   */
  _generateAvatar(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  },
};
