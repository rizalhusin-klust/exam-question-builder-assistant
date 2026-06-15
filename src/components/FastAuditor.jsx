import React, { useState } from 'react';

function FastAuditor({ isActive, apiKey, questionsBank, setQuestionsBank, showToast, theme, setTheme }) {
  const isDarkMode = theme === 'dark';
  // --- States ---
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("Degree");
  const [rawInput, setRawInput] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);

  // Result States
  const [rigorText, setRigorText] = useState("Pending...");
  const [scoreText, setScoreText] = useState("Not evaluated");
  const [scoreVal, setScoreVal] = useState("-");
  const [formattedHtml, setFormattedHtml] = useState(
    `<p class="text-slate-400 text-center italic mt-20" style="color: var(--text-muted); text-align: center; font-style: italic; padding: 40px 0;">The professionally formatted university question will appear here...</p>`
  );
  const [markingScheme, setMarkingScheme] = useState("");
  const [isEditingHtml, setIsEditingHtml] = useState(false);

  // --- Actions ---
  const runFastAudit = async () => {
    if (!rawInput.trim()) {
      showToast("Please paste a draft question to audit", "error");
      return;
    }

    if (!apiKey) {
      showToast("Please verify your Gemini API Key is configured in App.jsx.", "error");
      return;
    }

    setIsAuditing(true);
    setRigorText("Analyzing Rigor...");
    setScoreText("Evaluating quality...");
    setScoreVal("-");

    const prompt = `You are an academic auditor. Subject: ${subject || "General"}, Level: ${level}. 
Task: Analyze this draft question: "${rawInput}". 
Output exactly 4 blocks separated by the delimiter [SPLIT]:
1. Short Rigor Analysis (Cognitive level - e.g., Bloom's Taxonomy, complexity evaluation).
2. Numeric Score out of 10 and 1-sentence justification.
3. Professionally formatted University Question (HTML format). Do NOT wrap it in code blocks; output raw HTML markup ready to render.
   *CRITICAL REQUIREMENT*: Do NOT include any university headers, table sections, or cover fields for Faculty, Program, Course Code, Course Title, Date, or Instructions. Output ONLY the clean, formatted exam question, sub-questions (e.g. part a, b, c), and marks distribution (e.g. [5 marks]).
4. Detailed Marking Scheme Table (HTML format). Do NOT wrap it in code blocks; output raw HTML table markup ready to render. Make it a clean, professional table containing columns: Part, Solution/Answer Key, and Marks.`;

    const modelName = "gemini-3.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.candidates[0].content.parts[0].text;
      
      const parts = resultText.split('[SPLIT]');
      const rText = parts[0]?.trim() || "Analysis failed";
      const sText = parts[1]?.trim() || "Score evaluation failed";
      const htmlText = parts[2]?.trim() || "<p>Formatting failed</p>";
      const mSchemeText = parts[3]?.trim() || "Marking scheme generation failed";

      // Clean up markdown block wraps if model outputs them
      const cleanHtml = htmlText.replace(/^```html/, "").replace(/```$/, "").trim();

      setRigorText(rText);
      setScoreText(sText);
      
      const matchedScore = sText.match(/\d+/);
      setScoreVal(matchedScore ? matchedScore[0] : "-");
      setFormattedHtml(cleanHtml);
      setMarkingScheme(mSchemeText);
      showToast("Question audited and formatted!");

    } catch (err) {
      console.error(err);
      showToast("Audit failed. Check API Key or console logs.", "error");
      setRigorText("Error evaluating rigor.");
      setScoreText("API Connection Error.");
      setScoreVal("-");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAddToBank = () => {
    if (scoreVal === "-") {
      showToast("Cannot add to bank. Please audit a question first.", "error");
      return;
    }

    // Attempt to parse out some details for classification
    let difficulty = "Medium";
    const lowerRigor = rigorText.toLowerCase();
    if (lowerRigor.includes("easy") || lowerRigor.includes("remember") || lowerRigor.includes("recall")) {
      difficulty = "Easy";
    } else if (lowerRigor.includes("hard") || lowerRigor.includes("evaluate") || lowerRigor.includes("create")) {
      difficulty = "Hard";
    }

    // Add to bank
    const newQuestion = {
      id: `fast-${Date.now()}`,
      text: formattedHtml, // This holds the HTML representation
      type: "short-answer", // Audited university questions are typically open-ended/complex
      options: [],
      answer: markingScheme || "See marking scheme",
      points: Number(scoreVal) || 10,
      difficulty,
      subject: subject.trim() || "General",
      topic: "Audited",
      explanation: rigorText + "\n\n" + scoreText,
      isHtml: true // Flag to render as HTML
    };

    setQuestionsBank((prev) => [...prev, newQuestion]);
    showToast("Audited question added to Exam Paper!");
  };

  return (
    <section className={`page-view ${isActive ? 'active' : ''}`} id="view-builder-pane" style={{ display: isActive ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
      <header className="header-block no-print">
        <div className="logo">FAST Academic Question Auditor & Blueprint Planner</div>
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

      <div className="view-split" style={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Side: Audit Inputs */}
        <div className="builder-workspace" style={{ overflowY: 'auto' }}>
          <div className="creator-form draft-setup-box" style={{ marginTop: '0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg className="text-blue-600 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg> 
              Question Draft Setup
            </h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Course Name / Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Thermodynamics"
                  className="form-control"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label>Academic Level</label>
                <select
                  className="form-control"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="Certificate">Certificate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Degree">Degree</option>
                  <option value="Master">Master</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Raw Question Draft</label>
                <textarea
                  rows="10"
                  placeholder="Paste your messy draft question here (it can be loose, ungrammatical, or contain raw prompt notes)..."
                  className="form-control"
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                />
              </div>
            </div>

            <div className="form-action-row" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 20px', fontWeight: 'bold' }}
                onClick={runFastAudit}
                disabled={isAuditing}
              >
                {isAuditing ? "Auditing Rigor & Formatting..." : "Audit & Format Question"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Evaluation Results */}
        <div className="builder-preview" style={{ overflowY: 'auto', paddingRight: '4px' }}>


          {/* Formatted output sheet */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Formatted Blueprint Booklet</h3>
            {scoreVal !== "-" && (
              <button
                className="text-btn"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                onClick={() => setIsEditingHtml(!isEditingHtml)}
              >
                {isEditingHtml ? "🔒 Done Editing" : "✏️ Edit HTML"}
              </button>
            )}
          </div>

          <div className="paper-sheet print-print fast-blueprint-paper" style={{ minHeight: '320px', padding: '24px', backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-md)', color: '#1e293b' }}>
            {isEditingHtml ? (
              <textarea
                className="form-control"
                style={{ width: '100%', minHeight: '260px', fontFamily: 'monospace', fontSize: '12px', color: '#1e293b', border: '1px solid #cbd5e1', padding: '10px' }}
                value={formattedHtml}
                onChange={(e) => setFormattedHtml(e.target.value)}
              />
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: formattedHtml }}
                style={{ outline: 'none', fontSize: '14px', fontFamily: 'serif', lineHeight: '1.6' }}
              />
            )}
          </div>

          {/* Marking Scheme */}
          {markingScheme && (
            <div className="print-print" style={{ marginTop: '16px', width: '100%' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }} className="print-print">Detailed Marking Scheme</h3>
              <div className="paper-sheet print-print" style={{ padding: '24px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#1e293b' }}>
                {/* Visible on screen when editing, hidden on print */}
                {isEditingHtml && (
                  <textarea
                    className="form-control no-print"
                    style={{
                      width: '100%',
                      minHeight: '260px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      padding: '10px'
                    }}
                    value={markingScheme}
                    onChange={(e) => setMarkingScheme(e.target.value)}
                  />
                )}
                {/* Visible on screen when NOT editing, and ALWAYS visible when printing */}
                {(!isEditingHtml) ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: markingScheme }}
                    style={{ outline: 'none', fontSize: '14px', lineHeight: '1.6' }}
                  />
                ) : (
                  <div
                    className="print-only"
                    dangerouslySetInnerHTML={{ __html: markingScheme }}
                    style={{ outline: 'none', fontSize: '14px', lineHeight: '1.6' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          {scoreVal !== "-" && (
            <div style={{ marginTop: '16px', width: '100%', display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px' }}
                onClick={handleAddToBank}
              >
                Add to Question Bank
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => window.print()}
              >
                Print Audited Question
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default FastAuditor;
