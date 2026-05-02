/**
 * Chatbot Module
 * AI-powered chatbot for skill evaluation and suggestions with rate limiting
 *
 * @namespace Chatbot
 */

const Chatbot = {
  // DOM elements cache
  _elements: {
    container: null,
    toggle: null,
    box: null,
    messages: null,
    inputField: null,
    sendButton: null,
    closeButton: null,
  },

  // Chat history
  _chatHistory: [],

  // Rate limiting
  _isRateLimited: false,
  _rateLimitResetTime: 0,

  /**
   * Initialize chatbot functionality and event listeners
   */
  init() {
    this._cacheElements();
    this._setupEventListeners();
    this._loadChatHistory();
  },

  /**
   * Cache DOM elements for better performance
   * @private
   */
  _cacheElements() {
    this._elements.container = document.getElementById("chatbot-container");
    this._elements.toggle = document.getElementById("chatbot-toggle");
    this._elements.box = document.getElementById("chatbot-box");
    this._elements.messages = document.getElementById("chatbot-messages");
    this._elements.inputField = document.getElementById("chatbot-input-field");
    this._elements.sendButton = document.getElementById("chatbot-send-btn");
    this._elements.closeButton = document.getElementById("close-chatbot");
  },

  /**
   * Setup all event listeners
   * @private
   */
  _setupEventListeners() {
    this._elements.toggle.addEventListener("click", () =>
      this._toggleChatbot(),
    );
    this._elements.closeButton.addEventListener("click", () =>
      this._toggleChatbot(),
    );
    this._elements.sendButton.addEventListener("click", () =>
      this._sendMessage(),
    );
    this._elements.inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this._sendMessage();
    });
  },

  /**
   * Toggle chatbot visibility
   * @private
   */
  _toggleChatbot() {
    this._elements.box.classList.toggle("active");
    if (this._elements.box.classList.contains("active")) {
      setTimeout(() => this._elements.inputField.focus(), 300);
    }
  },

  /**
   * Send user message and get AI response
   * @private
   */
  async _sendMessage() {
    const userInput = this._elements.inputField.value.trim();
    if (!userInput) return;

    this._addMessage(userInput, "user");
    this._elements.inputField.value = "";
    this._showTypingIndicator();
    await this._getResponse(userInput);
  },

  /**
   * Add message to chat display and history
   * @private
   * @param {string} text - Message text
   * @param {string} sender - Sender: 'user' or 'bot'
   */
  _addMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `<p>${text}</p>`;

    this._elements.messages.appendChild(messageDiv);
    this._chatHistory.push({ text, sender });
    this._saveChatHistory();
    this._scrollToBottom();
  },

  /**
   * Show typing indicator while waiting for response
   * @private
   */
  _showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-typing";
    typingDiv.id = "typing-indicator";

    for (let i = 0; i < 3; i++) {
      typingDiv.appendChild(
        Object.assign(document.createElement("span"), {
          className: "typing-dot",
        }),
      );
    }

    this._elements.messages.appendChild(typingDiv);
    this._scrollToBottom();
  },

  /**
   * Remove typing indicator
   * @private
   */
  _removeTypingIndicator() {
    document.getElementById("typing-indicator")?.remove();
  },

  /**
   * Get AI response for user input
   * @private
   * @param {string} userInput - User message
   */
  async _getResponse(userInput) {
    try {
      // Check rate limiting
      if (this._isRateLimited && this._rateLimitResetTime > Date.now()) {
        this._removeTypingIndicator();
        const waitTime = Math.ceil(
          (this._rateLimitResetTime - Date.now()) / 1000,
        );
        this._addMessage(
          `⏱️ API rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
          "bot",
        );
        return;
      }

      const prompt = `As an expert skill evaluator, provide helpful advice on: "${userInput}"
      
Focus on concrete, actionable feedback. If not related to skill assessment, politely redirect.
Response should be concise (1 paragraph, 2-3 key points), specific with practical tips, encouraging, and educational.
Respond in conversational tone.`;

      const data = await API.makeRequest(prompt);
      this._removeTypingIndicator();

      let responseText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I couldn't generate a response at this time.";

      this._addMessage(responseText, "bot");
    } catch (error) {
      this._removeTypingIndicator();
      this._handleError(error);
    }
  },

  /**
   * Handle API errors with appropriate messages
   * @private
   * @param {Error} error - Error object
   */
  _handleError(error) {
    if (error.code === "QUOTA_EXCEEDED") {
      this._isRateLimited = true;
      this._rateLimitResetTime = Date.now() + error.retryAfter * 1000;
      this._addMessage(
        `⏱️ API rate limit reached. Please wait ${error.retryAfter} seconds and try again.`,
        "bot",
      );
    } else if (error.message.includes("status 5")) {
      this._addMessage(
        "🔧 The AI service is temporarily unavailable. Please try again in a moment.",
        "bot",
      );
    } else {
      this._addMessage(
        "❌ Sorry, I encountered an error processing your request. Please try again later.",
        "bot",
      );
    }
  },

  /**
   * Scroll chat to bottom
   * @private
   */
  _scrollToBottom() {
    this._elements.messages.scrollTop = this._elements.messages.scrollHeight;
  },

  /**
   * Save chat history to storage
   * @private
   */
  _saveChatHistory() {
    StorageManager.saveChatHistory(this._chatHistory);
  },

  /**
   * Load chat history from storage
   * @private
   */
  _loadChatHistory() {
    this._chatHistory = StorageManager.getChatHistory();

    if (this._chatHistory.length > 0) {
      this._elements.messages.innerHTML = "";
      this._chatHistory.slice(-10).forEach((message) => {
        this._addMessage(message.text, message.sender);
      });
    }
  },
};

// Initialize chatbot when document is ready
document.addEventListener("DOMContentLoaded", () => {
  Chatbot.init();
});
