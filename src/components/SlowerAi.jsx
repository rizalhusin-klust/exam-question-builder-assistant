import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

function SlowerAi({ apiKey, questionsBank, setQuestionsBank, showToast, theme, setTheme }) {
  // --- States ---
  const [studyLevel, setStudyLevel] = useState("Bachelor's Degree");
  const [feedbackTone, setFeedbackTone] = useState("balanced");
  const [clo, setClo] = useState("");
  const [rawQuestion, setRawQuestion] = useState("");
  const [localApiKey, setLocalApiKey] = useState(() => {
    return localStorage.getItem('aiza_api_key') || '';
  });
  const [status, setStatus] = useState("empty"); // "empty" | "loading" | "success"

  // Evaluation results
  const [category, setCategory] = useState("");
  const [advice, setAdvice] = useState("");
  const [scoreSummary, setScoreSummary] = useState([]);
  const [suggestedMarks, setSuggestedMarks] = useState("");
  const [markingStrategy, setMarkingStrategy] = useState([]);
  const [oneClickSuggestion, setOneClickSuggestion] = useState("");
  const [currentScore, setCurrentScore] = useState(null);

  // Animation states for conic gradient
  const [scoreAngle, setScoreAngle] = useState(0);
  const [scoreColor, setScoreColor] = useState('var(--success)');

  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });



  // Save key to localStorage on changes
  useEffect(() => {
    localStorage.setItem('aiza_api_key', localApiKey);
  }, [localApiKey]);

  const showToastLocal = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const animateScore = (targetScore, targetColor) => {
    setScoreColor(targetColor);
    const targetAngle = (targetScore / 100) * 360;
    
    // Clear any active transitions
    setScoreAngle(0);
    
    let currentAngle = 0;
    const step = targetAngle / 30; // 30 steps
    const timer = setInterval(() => {
      currentAngle += step;
      if (currentAngle >= targetAngle) {
        currentAngle = targetAngle;
        clearInterval(timer);
      }
      setScoreAngle(currentAngle);
    }, 16);
  };

  const fetchWithRetry = async (url, options, maxRetries = 5) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await fetch(url, options);
        const json = await response.json().catch(() => ({}));
        
        if (!response.ok) {
          const errorMsg = json.error?.message || `HTTP Error: ${response.status}`;
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            const err = new Error(errorMsg);
            err.isClientError = true;
            throw err;
          }
          throw new Error(errorMsg);
        }
        return json;
      } catch (error) {
        if (error.isClientError) throw error;
        retries++;
        if (retries >= maxRetries) throw error;
        await new Promise(res => setTimeout(res, Math.pow(2, retries - 1) * 1000));
      }
    }
  };

  const evaluateQuestion = async () => {
    const keyToUse = localApiKey.trim() || apiKey;
    if (!keyToUse) {
      showToastLocal('Please verify your Gemini API Key is configured.', 'error');
      if (showToast) showToast('Please verify your Gemini API Key is configured.', 'error');
      return;
    }

    if (!rawQuestion.trim()) {
      showToastLocal('Please enter a draft question to analyze.', 'error');
      if (showToast) showToast('Please enter a draft question to analyze.', 'error');
      return;
    }

    setStatus("loading");
    setCurrentScore(null);

    // Determine Tone Instructions
    let toneInstruction = "";
    if (feedbackTone === "strict") {
      toneInstruction = "TONE: Be extremely strict. Enforce rules rigidly. Point out even minor flaws in alignment or wording. Do not praise unless the draft is flawless.";
    } else if (feedbackTone === "casual") {
      toneInstruction = "TONE: Be encouraging, gentle, and highly supportive. Frame corrections as 'suggestions to make this even better' rather than errors.";
    } else {
      toneInstruction = "TONE: Balanced, constructive, and professional.";
    }
    
    const systemPrompt = `You are Aiza, an expert instructional design assistant. Evaluate the user's drafted question against four strict frameworks:
1) Constructive Alignment (CLO verb must match Study Level).
2) UDL Policy (Zero double negatives, max 25 words per sentence, clear structure).
3) Academic Rigor (Webb's Depth of Knowledge - ensure MCQs aren't just recall, and distractors are plausible misconceptions).
4) Value Based Education (VBE) (Ensure the question incorporates or encourages positive values, ethical reasoning, integrity, or professional values/social responsibility, and advise on how to embed a good value if missing).

IMPORTANT: Evaluate the score out of 100. Provide a 'score_summary' as an array of specific checklist items explaining exactly why the question earned its score, including at least one check item on VBE/values. ALSO, based on the cognitive load and complexity, determine the 'suggested_marks' (e.g., '10 Marks') and outline a step-by-step 'marking_strategy' (array of strings) detailing how to allocate partial or full marks. ${toneInstruction}`;
    
    const userPrompt = `Study Level (MQF): ${studyLevel}\nCourse Learning Outcome (CLO) Statement: ${clo || 'Not provided'}\n\nDraft Question:\n${rawQuestion}`;

    const runRequest = async (modelName) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${keyToUse}`;
      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              category: { type: "string", enum: ["UDL", "Rigor", "Alignment", "VBE", "Excellent"] },
              current_score: { type: "number" },
              advice: { type: "string" },
              score_summary: { 
                type: "array", 
                items: { type: "string" } 
              },
              suggested_marks: { type: "string" },
              marking_strategy: {
                type: "array",
                items: { type: "string" }
              },
              one_click_suggestion: { type: "string" }
            },
            required: ["category", "current_score", "advice", "score_summary", "suggested_marks", "marking_strategy", "one_click_suggestion"]
          }
        }
      };
      return await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };

    try {
      let data;
      // Try gemini-2.5-flash first (as in user's template)
      try {
        data = await runRequest("gemini-2.5-flash");
      } catch (err) {
        console.warn("gemini-2.5-flash failed, trying gemini-3.5-flash fallback...", err);
        try {
          data = await runRequest("gemini-3.5-flash");
        } catch (err2) {
          throw new Error(`AI models failed: ${err2.message}`);
        }
      }

      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error("Empty response from API");
      }

      const result = JSON.parse(textResponse);

      setCategory(result.category);
      setAdvice(result.advice);
      setScoreSummary(result.score_summary || []);
      setSuggestedMarks(result.suggested_marks || "");
      setMarkingStrategy(result.marking_strategy || []);
      setOneClickSuggestion(result.one_click_suggestion || "");
      setCurrentScore(result.current_score);

      // Score UI Math & Colors
      const scoreVal = parseFloat(result.current_score) || 0;
      let color = 'var(--success)';
      if (scoreVal < 60) color = 'var(--danger)';
      else if (scoreVal < 85) color = 'var(--warning)';

      setStatus("success");
      animateScore(scoreVal, color);
      showToastLocal('Evaluation complete!');
      if (showToast) showToast('Evaluation complete!');

    } catch (error) {
      console.error(error);
      showToastLocal(`Error: ${error.message}`, 'error');
      if (showToast) showToast(`Evaluation failed: ${error.message}`, 'error');
      setStatus("empty");
    }
  };

  const handleApplyFix = () => {
    if (oneClickSuggestion) {
      setRawQuestion(oneClickSuggestion);
      showToastLocal("Applied suggested fix!");
      if (showToast) showToast("Applied suggested fix!");
    }
  };

  const handleAddToBank = () => {
    if (status !== "success" || currentScore === null) return;

    let difficulty = "Medium";
    if (studyLevel.includes("Certificate") || studyLevel.includes("Diploma")) {
      difficulty = "Easy";
    } else if (studyLevel.includes("Master")) {
      difficulty = "Hard";
    }

    const marksNum = parseInt(suggestedMarks) || 10;

    const newQuestion = {
      id: `slower-${Date.now()}`,
      text: rawQuestion,
      type: "short-answer",
      options: [],
      answer: markingStrategy.join("\n"),
      points: marksNum,
      difficulty,
      subject: "Aiza Assessment Blueprint",
      topic: "SLOWer AI Evaluated",
      explanation: `MQF Level: ${studyLevel}\nCLO: ${clo}\nCategory: ${category}\nAdvice: ${advice}\n\nChecklist:\n${scoreSummary.map(x => `- ${x}`).join("\n")}`,
      isHtml: false,
      isHtmlAnswer: false
    };

    setQuestionsBank((prev) => [...prev, newQuestion]);
    showToastLocal("Question added to Question Bank!");
    if (showToast) showToast("Question added to Question Bank!");
  };

  const isDarkMode = theme === 'dark';

  return (
    <div className={`slower-ai-container ${isDarkMode ? 'dark' : ''}`} style={{ height: '100%', width: '100%', overflowY: 'auto', paddingBottom: '96px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      
      {/* Local styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .slower-ai-container {
            --primary: var(--text-primary);
            --primary-dark: var(--text-secondary);
            --accent: var(--color-primary);
            --accent-hover: var(--color-primary-hover);
            --success: var(--color-success);
            --warning: var(--color-warning);
            --danger: var(--color-error);
            --bg-color: var(--bg-app);
            --text-color: var(--text-primary);
            --panel-bg: var(--bg-surface);
            --border-color: var(--border-color);
            --score-color: var(--success);
            --score-angle: 0deg;
        }

        .slower-ai-container.dark {
            --primary: var(--text-primary);
            --primary-dark: var(--text-secondary);
            --accent: var(--color-primary);
            --accent-hover: var(--color-primary-hover);
            --bg-color: var(--bg-app);
            --text-color: var(--text-primary);
            --panel-bg: var(--bg-surface);
            --border-color: var(--border-color);
        }

        .slower-ai-container * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        .slower-ai-container header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            background: var(--panel-bg);
        }

        .slower-ai-container .logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--accent);
        }

        .slower-ai-container .header-controls {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .slower-ai-container .api-input {
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--bg-color);
            color: var(--text-color);
            width: 250px;
            outline: none;
        }

        .slower-ai-container .theme-toggle {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: var(--text-color);
        }

        .slower-ai-container .container {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
        }

        @media (max-width: 768px) {
            .slower-ai-container .container {
                grid-template-columns: 1fr;
            }
            .slower-ai-container .header-controls {
                flex-direction: column;
                align-items: flex-end;
            }
        }

        .slower-ai-container .panel {
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .slower-ai-container .panel-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--primary);
        }

        .slower-ai-container .form-group {
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .slower-ai-container label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 13px;
            color: var(--text-secondary);
        }

        .slower-ai-container select, 
        .slower-ai-container input[type="text"], 
        .slower-ai-container textarea {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            background: var(--bg-panel);
            color: var(--text-primary);
            font-size: 14px;
            font-family: inherit;
            outline: none;
            box-sizing: border-box;
            transition: all var(--transition-fast);
        }

        .slower-ai-container select {
            appearance: none;
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(100, 110, 130, 0.7)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 16px center;
            background-size: 16px;
            padding-right: 44px;
            cursor: pointer;
        }

        .slower-ai-container select:focus, 
        .slower-ai-container input[type="text"]:focus, 
        .slower-ai-container textarea:focus {
            border-color: var(--color-primary);
            background-color: var(--bg-surface);
            box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .slower-ai-container textarea {
            height: 150px;
            resize: vertical;
        }

        .slower-ai-container button {
            background: var(--accent);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
        }

        .slower-ai-container button:hover {
            background: var(--accent-hover);
        }

        .slower-ai-container button:active {
            transform: scale(0.98);
        }

        .slower-ai-container button:disabled {
            background: var(--primary-dark);
            cursor: not-allowed;
            opacity: 0.5;
        }

        .slower-ai-container .score-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
        }

        .slower-ai-container .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .slower-ai-container .score-circle::before {
            content: "";
            position: absolute;
            width: 100px;
            height: 100px;
            background: var(--panel-bg);
            border-radius: 50%;
        }

        .slower-ai-container .score-text {
            position: relative;
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .slower-ai-container .gold-badge {
            background: linear-gradient(135deg, #fef08a, #eab308);
            color: #854d0e;
            padding: 10px 15px;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 15px;
            text-align: center;
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);
            width: 100%;
        }

        .slower-ai-container .btn-print {
            background: var(--primary);
            margin-top: 15px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 0;
        }

        .slower-ai-container .btn-print:hover {
            background: var(--primary-dark);
        }

        @keyframes popIn {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }

        .slower-ai-container .feedback-box {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            text-align: left;
            margin-top: 20px;
            max-height: 450px;
            overflow-y: auto;
        }

        .slower-ai-container .category-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 10px;
            background: var(--primary);
            color: white;
            text-transform: uppercase;
        }

        .slower-ai-container .advice-text {
            margin-bottom: 15px;
            line-height: 1.5;
            font-size: 0.95rem;
        }

        .slower-ai-container .summary-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .slower-ai-container .summary-list li {
            font-size: 0.9rem;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            line-height: 1.4;
        }

        .slower-ai-container .summary-list li span {
            flex-shrink: 0;
        }

        .slower-ai-container .suggestion-box {
            background: var(--panel-bg);
            border-left: 4px solid var(--accent);
            padding: 12px;
            margin-bottom: 15px;
            font-style: italic;
            font-size: 0.9rem;
            margin-top: 20px;
        }

        .slower-ai-container .btn-apply {
            background: var(--success);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 0;
        }

        .slower-ai-container .btn-apply:hover { background: #16a34a; }
        .slower-ai-container .btn-apply.applied { background: #14532d; }

        .slower-ai-container .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 15px;
            color: var(--accent);
            font-weight: 500;
        }

        .slower-ai-container .spinner {
            width: 20px;
            height: 20px;
            border: 3px solid var(--border-color);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }

        .slower-ai-container .toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
        }

        .slower-ai-container .toast {
            background: #ef4444; /* Danger color */
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-weight: 500;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        }

        .slower-ai-container .toast.show {
            opacity: 1;
            transform: translateY(0);
        }

        .slower-ai-container .print-section {
            display: none;
            padding: 40px;
            background: white;
            color: black;
        }

        @media print {
            body * { visibility: hidden !important; }
            #root * { visibility: hidden !important; }
            .print-section, .print-section * { visibility: visible !important; }
            .print-section {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
            }
            body { background: white !important; padding: 0 !important; }
            h2 { border-bottom: 2px solid #ccc !important; padding-bottom: 10px !important; margin-bottom: 20px !important; }
            h3 { color: #333 !important; margin-top: 25px !important; margin-bottom: 10px !important; }
            .print-row { margin-bottom: 15px !important; text-align: left !important; }
            .print-label { font-weight: bold !important; color: #555 !important; }
            .print-field { background: #f9f9f9 !important; padding: 15px !important; border: 1px solid #ddd !important; border-radius: 4px !important; white-space: pre-wrap !important; color: black !important; text-align: left !important; }
            .print-score-badge { display: inline-block !important; padding: 8px 15px !important; border: 2px solid #22c55e !important; color: #16a34a !important; font-weight: bold !important; border-radius: 20px !important; font-size: 1.2rem !important; }
            .print-checklist-item { margin-bottom: 8px !important; display: flex !important; align-items: flex-start !important; gap: 8px !important; text-align: left !important; }
        }
      `}} />

      {/* Local Toast Messages */}
      <div className="toast-container" id="toastContainer">
        {toast.visible && (
          <div className="toast show" style={{ backgroundColor: toast.type === 'success' ? '#22c55e' : '#ef4444' }}>
            {toast.message}
          </div>
        )}
      </div>

      <header className="header-block no-print">
        <div className="logo">SLOWer Academic Question Auditor & Blueprint Planner</div>
        <div className="header-controls">
          <button 
            id="themeToggle" 
            className="theme-toggle" 
            title="Toggle Dark Mode"
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="container no-print" id="main-ui">
        
        {/* Left Panel: Configuration */}
        <div className="panel draft-setup-box">
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg className="text-blue-600 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', flexShrink: 0 }}>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg> 
            Question Draft Setup
          </div>
          
          <div className="form-group">
            <label htmlFor="studyLevel">Study Level (MQF)</label>
            <select 
              id="studyLevel"
              value={studyLevel}
              onChange={(e) => setStudyLevel(e.target.value)}
            >
              <option value="Certificate/Diploma">Certificate/Diploma</option>
              <option value="Bachelor's Degree">Bachelor's Degree</option>
              <option value="Master's Degree">Master's Degree</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="feedbackTone">Feedback Tone</label>
            <select 
              id="feedbackTone"
              value={feedbackTone}
              onChange={(e) => setFeedbackTone(e.target.value)}
            >
              <option value="strict">Strict (Strong Requirements)</option>
              <option value="balanced">Balanced (Constructive)</option>
              <option value="casual">Casual (Gentle Suggestions)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="clo">Course Learning Outcome (CLO) Statement</label>
            <input 
              type="text" 
              id="clo" 
              placeholder="e.g., Analyze complex algorithms for time complexity..." 
              value={clo}
              onChange={(e) => setClo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="draftQuestion">Draft Question / Scenario <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--accent)', marginLeft: '6px' }}>(Audits alignment, UDL, Rigor, & VBE values)</span></label>
            <textarea 
              id="draftQuestion" 
              placeholder="Paste your assessment question or scenario here..."
              value={rawQuestion}
              onChange={(e) => setRawQuestion(e.target.value)}
            />
          </div>

          <button 
            id="analyzeBtn" 
            onClick={evaluateQuestion}
            disabled={status === 'loading'}
            style={{ border: '0', cursor: 'pointer' }}
          >
            Analyse SLOWly
          </button>
          
          {status === 'loading' && (
            <div id="loading" className="loading">
              <div className="spinner"></div>
              Aiza is evaluating constructive alignment...
            </div>
          )}
        </div>

        {/* Right Panel: Quality Dashboard */}
        <div className="panel">
          <div className="panel-title">Quality Dashboard</div>
          
          <div className="score-container">
            <div 
              className="score-circle" 
              id="scoreCircle"
              style={{
                background: `conic-gradient(${scoreColor} ${scoreAngle}deg, var(--border-color) 0deg)`,
                transition: 'background-color 0.5s'
              }}
            >
              <div className="score-text" id="scoreText">
                {currentScore !== null ? currentScore.toFixed(0) : '--'}
              </div>
            </div>
            
            {currentScore >= 85 && (
              <div className="gold-badge" id="goldBadge">
                🌟 Master Architect: 85+ Achieved! 🌟
              </div>
            )}
            
            {currentScore >= 85 && (
              <div className="w-full flex flex-col gap-2 mt-4">
                <button 
                  id="printBtn" 
                  className="btn-print text-white font-semibold rounded-lg py-3 cursor-pointer border-0 w-full"
                  onClick={() => window.print()}
                >
                  🖨️ Print Assessment Blueprint
                </button>
                <button 
                  onClick={handleAddToBank}
                  className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold cursor-pointer border-0 w-full"
                >
                  📥 Add to Question Bank
                </button>
              </div>
            )}
          </div>

          {/* Feedback Box */}
          {status === 'success' && (
            <div className="feedback-box" id="feedbackBox" style={{ display: 'block' }}>
              <div 
                className="category-badge" 
                id="categoryBadge"
                style={{ backgroundColor: scoreColor }}
              >
                {category}
              </div>
              <div className="advice-text" id="adviceText">
                {advice}
              </div>
              
              {currentScore >= 85 && scoreSummary.length > 0 && (
                <div id="scoreSummary" style={{ display: 'block', marginTop: '15px' }}>
                  <h4 style={{ marginBottom: '10px', color: 'var(--primary)', fontWeight: '600' }}>Score Summary</h4>
                  <ul className="summary-list" id="summaryList">
                    {scoreSummary.map((item, idx) => (
                      <li key={idx}>
                        <span>✅</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentScore >= 85 && suggestedMarks && markingStrategy.length > 0 && (
                <div id="markingSection" style={{ display: 'block', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '10px', color: 'var(--primary)', fontWeight: '600' }}>
                    Suggested Marks: <span id="uiMarks" style={{ color: 'var(--text-color)', fontWeight: 'normal' }}>{suggestedMarks}</span>
                  </h4>
                  <ul className="summary-list" id="uiMarkingStrategy">
                    {markingStrategy.map((step, idx) => (
                      <li key={idx}>
                        <span>⚖️</span> {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {oneClickSuggestion && (
                <div id="suggestionWrapper">
                  <div className="suggestion-box" id="suggestionBox">
                    {oneClickSuggestion}
                  </div>
                  <button 
                    className="btn-apply text-white font-semibold py-2.5 rounded-lg cursor-pointer border-0 w-full" 
                    id="applyBtn"
                    onClick={handleApplyFix}
                  >
                    ✨ 1-Click Apply Fix
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Print Section (rendered via Portal to avoid parent visibility constraints) */}
      {createPortal(
        <div className="print-section">
          <h2>Assessment Blueprint</h2>
          
          <div className="print-row">
            <div className="print-label">Study Level (MQF):</div>
            <div>{studyLevel}</div>
          </div>
          
          <div className="print-row" style={{ marginTop: '15px' }}>
            <div className="print-label">Course Learning Outcome (CLO) Statement:</div>
            <div>{clo || 'Not provided'}</div>
          </div>
          
          <div className="print-row" style={{ marginTop: '15px' }}>
            <div className="print-label">Assessment Question / Scenario:</div>
            <div className="print-field" style={{ marginTop: '6px' }}>{rawQuestion}</div>
          </div>

          {currentScore !== null && (
            <div style={{ marginTop: '30px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
              <h2>Quality Evaluation</h2>
              <div className="print-score-badge" style={{ marginTop: '10px' }}>
                Final Score: {currentScore.toFixed(0)} / 100
              </div>
              
              <h3 style={{ marginTop: '25px' }}>Score Justification</h3>
              <div className="print-field" style={{ marginTop: '10px', marginBottom: '20px' }}>
                {advice}
                {scoreSummary.length > 0 && (
                  <ul className="summary-list" style={{ marginTop: '10px' }}>
                    {scoreSummary.map((item, idx) => (
                      <li key={idx} className="print-checklist-item">
                        <span>☑️</span> {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {suggestedMarks && (
                <>
                  <h3 style={{ marginTop: '25px' }}>Marking Strategy ({suggestedMarks})</h3>
                  <div className="print-field" style={{ marginTop: '10px' }}>
                    {markingStrategy.length > 0 && (
                      <ul className="summary-list">
                        {markingStrategy.map((item, idx) => (
                          <li key={idx} className="print-checklist-item">
                            <span>⚖️</span> {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>,
        document.body
      )}

    </div>
  );
}

export default SlowerAi;
