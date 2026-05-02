/**
 * Google Gemini API Integration Module
 * Handles API communication with error handling, rate limiting, and retry logic
 *
 * @namespace API
 */

const API = {
  // Configuration - move API_KEY to environment variables in production
  API_KEY: "AIzaSyDjVVOusls7BLLaBDptc9lbX8uQHW6pYSI",
  API_URL:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",

  // Rate limiting
  maxRetries: 3,
  retryDelay: 1000,
  quotaResetTime: 0,

  /**
   * Makes a request to the Gemini API with retry logic and quota handling
   * @param {string} prompt - The prompt to send to the API
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} - The API response
   */
  async makeRequest(prompt, retryCount = 0) {
    try {
      // Check if we're still in quota reset period
      if (this.quotaResetTime > Date.now()) {
        const waitTime = Math.ceil((this.quotaResetTime - Date.now()) / 1000);
        const error = new Error(
          `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
        );
        error.code = "QUOTA_EXCEEDED";
        error.retryAfter = waitTime;
        throw error;
      }

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (response.status === 429) {
        return this._handleQuotaExceeded(await response.json());
      }

      if (!response.ok) {
        if (response.status >= 500 && retryCount < this.maxRetries) {
          return this._retryWithBackoff(prompt, retryCount);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  },

  /**
   * Handle quota exceeded (429) response
   * @private
   * @param {Object} data - Response data
   * @throws {Error} - Quota exceeded error
   */
  _handleQuotaExceeded(data) {
    const retryAfter = data?.details?.find((d) =>
      d["@type"]?.includes("RetryInfo"),
    )?.retryDelay;
    const retrySeconds = retryAfter ? parseInt(retryAfter.split("s")[0]) : 60;
    this.quotaResetTime = Date.now() + retrySeconds * 1000;
    const error = new Error(
      `API quota exceeded. Service available in ${retrySeconds}s.`,
    );
    error.code = "QUOTA_EXCEEDED";
    error.retryAfter = retrySeconds;
    throw error;
  },

  /**
   * Retry request with exponential backoff
   * @private
   * @param {string} prompt - Request prompt
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise} - Request result
   */
  async _retryWithBackoff(prompt, retryCount) {
    const delay = this.retryDelay * Math.pow(2, retryCount);
    console.warn(`Server error, retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.makeRequest(prompt, retryCount + 1);
  },

  /**
   * Generates test questions based on given parameters
   * @param {Object} params - Test parameters
   * @returns {Promise<Array>} - Array of generated questions
   */
  async generateTest(params) {
    const { userType, category, difficulty, questionCount } = params;

    const prompt = `Generate a JSON array containing ${questionCount} ${difficulty} level ${category} questions for a ${userType}. 
        
        For multiple choice questions, include 4 options with exactly one correct answer marked.
        For writing questions, include instructions and evaluation criteria.
        
        Format your output as valid JSON.
        Each question should have: id, type (multiple_choice, text_input), question_text, options (for multiple choice), 
        correct_answer (for multiple choice) and criteria (for writing).

        Output ONLY valid JSON with no additional text or explanation.`;

    try {
      const response = await this.makeRequest(prompt);

      if (!response || !response.candidates || !response.candidates[0]) {
        return this.getDefaultQuestions(category);
      }

      // Extract the JSON string from the response
      const jsonText = response.candidates[0].content.parts[0].text;
      // Parse JSON, remove any markdown code blocks if present
      const cleanJson = jsonText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      if (error.code === "QUOTA_EXCEEDED") throw error;
      console.error("Failed to generate test:", error);
      return this.getDefaultQuestions(category);
    }
  },

  /**
   * Generates recommendations based on test results
   * @param {Object} results - Test results and user performance
   * @returns {Promise<Object>} - Personalized recommendations
   */
  async generateRecommendations(results) {
    const { category, score, wrongAnswers, userType } = results;

    const prompt = `Based on a ${userType}'s performance on a ${category} test with a score of ${score}%, 
        generate personalized professional recommendations for improvement. They struggled with the following concepts: 
        ${wrongAnswers.join(", ")}.
        
        Format your response as JSON with the following structure:
        {
          "skillLevel": "beginner/intermediate/advanced",
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"],
          "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"],
          "resources": [
            {"title": "Resource Name 1", "type": "book/website/course", "description": "Brief description"},
            {"title": "Resource Name 2", "type": "book/website/course", "description": "Brief description"}
          ]
        }
        
        Output ONLY valid JSON with no additional text or explanation.`;

    try {
      const response = await this.makeRequest(prompt);

      if (!response || !response.candidates || !response.candidates[0]) {
        return this.getDefaultRecommendations();
      }

      return this._extractJSON(response);
    } catch (error) {
      if (error.code === "QUOTA_EXCEEDED") throw error;
      console.error("Failed to generate recommendations:", error);
      return this.getDefaultRecommendations();
    }
  },

  /**
   * Extract and parse JSON from API response
   * @private
   * @param {Object} response - API response
   * @returns {Object|Array} - Parsed JSON
   */
  _extractJSON(response) {
    const jsonText = response.candidates[0].content.parts[0].text;
    const cleanJson = jsonText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  },

  /**
   * Provides fallback questions in case API fails
   * @param {string} category - The category of questions
   * @returns {Array} - Default questions
   */
  getDefaultQuestions(category) {
    // Simple fallback questions
    return [
      {
        id: 1,
        type: "multiple_choice",
        question_text:
          "What is the primary benefit of using AI for skill assessment?",
        options: [
          "Cost reduction",
          "Personalized learning paths",
          "Entertainment value",
          "Reducing human involvement",
        ],
        correct_answer: "Personalized learning paths",
      },
      {
        id: 2,
        type: "multiple_choice",
        question_text:
          "Which of these is NOT a common category in skill assessment?",
        options: [
          "Aptitude testing",
          "Reading comprehension",
          "Gaming ability",
          "Personality assessment",
        ],
        correct_answer: "Gaming ability",
      },
      {
        id: 3,
        type: "text_input",
        question_text:
          "Describe how you would approach learning a new skill. What steps would you take?",
        criteria: "Clarity of thought, logical progression, realistic approach",
      },
    ];
  },

  /**
   * Provides fallback recommendations in case API fails
   * @returns {Object} - Default recommendations
   */
  getDefaultRecommendations() {
    return {
      skillLevel: "intermediate",
      strengths: ["Concept understanding", "Basic application"],
      weaknesses: ["Advanced application", "Critical thinking"],
      recommendations: [
        "Focus on practical applications of concepts",
        "Increase complexity of practice gradually",
        "Seek feedback from peers or mentors",
      ],
      resources: [
        {
          title: "Online Learning Platform",
          type: "website",
          description: "Interactive courses with practical exercises",
        },
        {
          title: "Practice Workbook",
          type: "book",
          description: "Contains progressively challenging exercises",
        },
      ],
    };
  },
};
