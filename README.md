# Savvy AI Skill Tracker

A gamified web application that helps users generate, take, and track progress on various skill assessment tests.

## Features

- **Test Generation**: Create customized tests for different skill categories:

  - Aptitude
  - Reading Skills
  - Writing Skills
  - Personality Assessment

- **Test Taking**: Take tests with varying difficulty levels (Easy, Medium, Hard)

- **Results Dashboard**:
  - View test scores and skill level assessments
  - Track progress over time with visual charts
  - Receive AI-generated personalized recommendations for improvement

## Technologies Used

- HTML5/CSS3 with Tailwind CSS
- Vanilla JavaScript
- Google Gemini API for AI-powered content generation

## Project Structure

```
skill-tracker/
│
├── index.html              # Landing page
├── css/                    # Styling files
│   ├── style.css           # Main stylesheet
│   └── tailwind.css        # Tailwind integration
│
├── js/                     # JavaScript modules
│   ├── app.js              # Main application logic
│   ├── api.js              # API integration module
│   ├── test-generator.js   # Test generation module
│   ├── test-taker.js       # Test taking interface logic
│   └── dashboard.js        # Dashboard visualization
│
└── data/                   # JSON files for data handling
    ├── questions.json      # Sample questions
    ├── results.json        # User test results
    └── recommendations.json # Generated recommendations
```

## Getting Started

### Prerequisites

- Modern web browser
- Internet connection (for API calls)
- Google Gemini API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/skill-tracker.git
   ```
2. Navigate to the project directory:
   ```
   cd skill-tracker
   ```
3. Open `index.html` in your browser

## How to Use

1. **Generate a Test**:

   - Select user type, test category, difficulty, and number of questions
   - Click "Generate Test" to create a custom assessment

2. **Take a Test**:

   - Navigate to the "Take Test" tab
   - Select test type and difficulty
   - Complete the questions and submit your answers

3. **View Results**:
   - Check your score and skill level assessment
   - Review the progress chart showing improvement over time
   - Read AI-generated recommendations for further skill development

## License

MIT License
