/**
 * Login Module
 * Handles UI logic for login and registration forms
 * @module LoginModule
 */

const LoginModule = {
  elements: {
    loginTab: null,
    registerTab: null,
    loginForm: null,
    registerForm: null,
    loginFormContainer: null,
    registerFormContainer: null,
    loginError: null,
    registerError: null,
    loginErrorMessage: null,
    registerErrorMessage: null,
    registerSuccess: null,
    termsAgreement: null,
  },

  /**
   * Initialize login module
   * @returns {void}
   */
  init() {
    this._cacheElements();
    this._checkExistingSession();
    this._setupEventListeners();
  },

  /**
   * Cache DOM elements
   * @private
   * @returns {void}
   */
  _cacheElements() {
    this.elements = {
      loginTab: document.getElementById("login-tab"),
      registerTab: document.getElementById("register-tab"),
      loginForm: document.getElementById("login-form"),
      registerForm: document.getElementById("register-form"),
      loginFormContainer: document.getElementById("login-form-container"),
      registerFormContainer: document.getElementById("register-form-container"),
      loginError: document.getElementById("login-error"),
      registerError: document.getElementById("register-error"),
      loginErrorMessage: document.getElementById("login-error-message"),
      registerErrorMessage: document.getElementById("register-error-message"),
      registerSuccess: document.getElementById("register-success"),
      termsAgreement: document.getElementById("terms-agreement"),
    };
  },

  /**
   * Set up event listeners
   * @private
   * @returns {void}
   */
  _setupEventListeners() {
    this.elements.loginTab.addEventListener("click", () =>
      this._switchTab("login"),
    );
    this.elements.registerTab.addEventListener("click", () =>
      this._switchTab("register"),
    );
    this.elements.loginForm.addEventListener("submit", (e) =>
      this._handleLoginSubmit(e),
    );
    this.elements.registerForm.addEventListener("submit", (e) =>
      this._handleRegisterSubmit(e),
    );
    this._setupPasswordToggle();
  },

  /**
   * Switch between login and register tabs
   * @private
   * @param {string} tab - Tab to switch to
   * @returns {void}
   */
  _switchTab(tab) {
    const isLogin = tab === "login";
    this.elements.loginTab.classList.toggle("active", isLogin);
    this.elements.registerTab.classList.toggle("active", !isLogin);
    this.elements.loginFormContainer.classList.toggle("hidden", !isLogin);
    this.elements.registerFormContainer.classList.toggle("hidden", isLogin);
  },

  /**
   * Setup password visibility toggle
   * @private
   * @returns {void}
   */
  _setupPasswordToggle() {
    document.querySelectorAll(".toggle-password").forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        const input = e.currentTarget.parentElement.querySelector("input");
        const icon = e.currentTarget.querySelector("i");
        const isPassword = input.type === "password";

        input.type = isPassword ? "text" : "password";
        icon.classList.toggle("fa-eye", isPassword);
        icon.classList.toggle("fa-eye-slash", !isPassword);
      });
    });
  },

  /**
   * Handle login form submission
   * @private
   * @param {Event} event - Form submit event
   * @returns {void}
   */
  _handleLoginSubmit(event) {
    event.preventDefault();
    this._hideErrors();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const rememberMe = document.getElementById("remember-me").checked;

    const result = Auth.login({ email, password, rememberMe });

    if (result.success) {
      this._showLoading("logging in...");
      setTimeout(() => {
        window.location.href = "main.html";
      }, 500);
    } else {
      this._showLoginError(result.message);
    }
  },

  /**
   * Handle register form submission
   * @private
   * @param {Event} event - Form submit event
   * @returns {void}
   */
  _handleRegisterSubmit(event) {
    event.preventDefault();
    this._hideErrors();

    if (!this.elements.termsAgreement.checked) {
      this._showRegisterError(
        "You must agree to the Terms of Service and Privacy Policy",
      );
      return;
    }

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById(
      "register-confirm-password",
    ).value;

    const result = Auth.register({ name, email, password, confirmPassword });

    if (result.success) {
      this._showRegisterSuccess(result.message);
      this.elements.registerForm.reset();
      setTimeout(() => this._switchTab("login"), 2000);
    } else {
      this._showRegisterError(result.message);
    }
  },

  /**
   * Show login error message
   * @private
   * @param {string} message - Error message
   * @returns {void}
   */
  _showLoginError(message) {
    this.elements.loginErrorMessage.textContent = message;
    this.elements.loginError.classList.remove("hidden");
  },

  /**
   * Show register error message
   * @private
   * @param {string} message - Error message
   * @returns {void}
   */
  _showRegisterError(message) {
    this.elements.registerErrorMessage.textContent = message;
    this.elements.registerError.classList.remove("hidden");
  },

  /**
   * Show register success message
   * @private
   * @param {string} message - Success message
   * @returns {void}
   */
  _showRegisterSuccess(message) {
    this.elements.registerSuccess.classList.remove("hidden");
  },

  /**
   * Hide error messages
   * @private
   * @returns {void}
   */
  _hideErrors() {
    this.elements.loginError.classList.add("hidden");
    this.elements.registerError.classList.add("hidden");
    this.elements.registerSuccess.classList.add("hidden");
  },

  /**
   * Show loading state on submit button
   * @private
   * @param {string} text - Loading text
   * @returns {void}
   */
  _showLoading(text) {
    const btn =
      document.querySelector('button[type="submit"]:focus') ||
      this.elements.loginForm.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = text;
    }
  },

  /**
   * Check if user has existing session
   * @private
   * @returns {void}
   */
  _checkExistingSession() {
    if (Auth.isAuthenticated()) {
      window.location.href = "main.html";
    } else {
      const remembered = localStorage.getItem("rememberedUser");
      if (remembered) {
        const user = JSON.parse(remembered);
        document.getElementById("login-email").value = user.email;
        document.getElementById("remember-me").checked = true;
      }
    }
  },
};

document.addEventListener("DOMContentLoaded", () => LoginModule.init());
