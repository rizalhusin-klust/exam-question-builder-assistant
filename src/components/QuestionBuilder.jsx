import React, { useState, useEffect, useRef } from 'react';
import { mockQuestionsDatabase } from '../../mock-questions';

function QuestionBuilder({ questionsBank, setQuestionsBank, apiKey, showToast, switchView }) {
  // --- Manual Builder States ---
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("multiple-choice");
  const [qDifficulty, setQDifficulty] = useState("Medium");
  const [qSubject, setQSubject] = useState("General");
  const [qTopic, setQTopic] = useState("");
  const [qPoints, setQPoints] = useState(5);
  const [qExplanation, setQExplanation] = useState("");

  // Options state for Multiple Choice and True/False questions
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);

  // --- AI Generator States ---
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamStatus, setStreamStatus] = useState("");
  const [showStream, setShowStream] = useState(false);
  const streamEndRef = useRef(null);

  // Sync scroll on streaming container
  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamText]);

  // Adjust options list when question type changes
  useEffect(() => {
    if (qType === "multiple-choice") {
      setOptions(["", "", "", ""]);
      setCorrectAnswerIndex(0);
    } else if (qType === "true-false") {
      setOptions(["True", "False"]);
      setCorrectAnswerIndex(0);
    } else {
      setOptions([]);
      setCorrectAnswerIndex(null);
    }
  }, [qType]);

  // --- Helpers ---
  const handleOptionChange = (index, val) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const addOptionRow = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const removeOptionRow = (index) => {
    if (options.length <= 2) {
      showToast("A multiple choice question must have at least 2 choices", "error");
      return;
    }
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
    if (correctAnswerIndex === index) {
      setCorrectAnswerIndex(0);
    } else if (correctAnswerIndex > index) {
      setCorrectAnswerIndex((prev) => prev - 1);
    }
  };

  const resetFields = () => {
    setQText("");
    setQType("multiple-choice");
    setQDifficulty("Medium");
    setQSubject("General");
    setQTopic("");
    setQPoints(5);
    setQExplanation("");
    setOptions(["", "", "", ""]);
    setCorrectAnswerIndex(0);
  };

  const compileManualQuestion = () => {
    let finalOptions = [];
    let finalAnswer = null;

    if (qType === "multiple-choice" || qType === "true-false") {
      finalOptions = options.map((opt, idx) => opt.trim() || `Option ${String.fromCharCode(65 + idx)}`);
      finalAnswer = correctAnswerIndex;
    } else {
      finalAnswer = "Instructor Evaluation / Student Handwrite";
    }

    return {
      id: `usr-${Date.now()}`,
      text: qText.trim() || "Untitled Question Prompt",
      type: qType,
      options: finalOptions,
      answer: finalAnswer,
      points: Number(qPoints),
      difficulty: qDifficulty,
      subject: qSubject.trim() || "General",
      topic: qTopic.trim() || "General",
      explanation: qExplanation.trim()
    };
  };

  const handleAddToBank = () => {
    if (!qText.trim()) {
      showToast("Please enter a question text prompt", "error");
      return;
    }

    if ((qType === "multiple-choice" || qType === "true-false") && correctAnswerIndex === null) {
      showToast("Please select the correct answer choice", "error");
      return;
    }

    const question = compileManualQuestion();
    setQuestionsBank((prev) => [...prev, question]);
    showToast("Added question to exam paper!");
    resetFields();
  };

  // --- AI Generator Logic ---
  const handleAiGenerate = async (forcedPrompt = null) => {
    const promptToUse = forcedPrompt || aiPrompt;
    if (!promptToUse.trim()) {
      showToast("Please enter a topic or instruction for the AI assistant", "error");
      return;
    }

    setIsGenerating(true);
    setShowStream(true);
    setStreamText("");
    setStreamStatus("Initializing engine...");

    // 1. Analyze prompt variables (Subject, Difficulty, Count)
    const lowerPrompt = promptToUse.toLowerCase();
    let detectedSubject = "General";
    let detectedDifficulty = "Medium";
    let count = 2;

    if (lowerPrompt.includes("math") || lowerPrompt.includes("algebra") || lowerPrompt.includes("calculus") || lowerPrompt.includes("geometry")) {
      detectedSubject = "Mathematics";
    } else if (lowerPrompt.includes("bio") || lowerPrompt.includes("science") || lowerPrompt.includes("physics") || lowerPrompt.includes("chemistry")) {
      detectedSubject = "Science";
    } else if (lowerPrompt.includes("history") || lowerPrompt.includes("rome") || lowerPrompt.includes("egypt") || lowerPrompt.includes("war")) {
      detectedSubject = "History";
    } else if (lowerPrompt.includes("literature") || lowerPrompt.includes("shakespeare") || lowerPrompt.includes("poem") || lowerPrompt.includes("book")) {
      detectedSubject = "Literature";
    }

    if (lowerPrompt.includes("easy")) detectedDifficulty = "Easy";
    else if (lowerPrompt.includes("hard") || lowerPrompt.includes("difficult")) detectedDifficulty = "Hard";
    else if (lowerPrompt.includes("medium")) detectedDifficulty = "Medium";

    const countMatch = lowerPrompt.match(/\b([1-9])\s*question/i) || lowerPrompt.match(/\bgenerate\s*([1-9])\b/i);
    if (countMatch && countMatch[1]) {
      count = parseInt(countMatch[1], 10);
    }

    // Check if we use Real Gemini API or Offline Simulation
    if (apiKey) {
      setStreamStatus("Calling Gemini API...");
      const modelName = "gemini-3.5-flash";
      const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const sysPrompt = `You are a professional university professor and academic question generator.
Generate exactly ${count} educational questions of difficulty level '${detectedDifficulty}' in subject area '${detectedSubject}' reflecting user details: '${promptToUse}'.

Format the response strictly as a JSON array where each object has this structure:
{
  "text": "The question prompt text",
  "type": "multiple-choice" | "true-false" | "short-answer" | "fill-in-the-blank",
  "options": ["Choice A", "Choice B", "Choice C", "Choice D"], // Empty array if short-answer or fill-in-the-blank. Exactly 2 options ("True", "False") if true-false.
  "answer": 0, // Numeric index (0-indexed) of the correct choice if multiple-choice or true-false. A single-sentence ideal answer string if short-answer or fill-in-the-blank.
  "points": number, // Standard scoring weight (e.g. 2 to 10 points)
  "difficulty": "Easy" | "Medium" | "Hard",
  "subject": "${detectedSubject}",
  "topic": "Specific sub-topic details",
  "explanation": "Clear educational rationale explaining the correct answer"
}`;

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: sysPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API Error: Status ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        const generatedQuestions = JSON.parse(responseText);

        // Streaming Effect for the results
        let logText = `[GEMINI CONNECTION SUCCESS]\n`;
        logText += `Received ${generatedQuestions.length} parsed academic questions.\n`;
        logText += `====================================================\n\n`;

        generatedQuestions.forEach((q, idx) => {
          logText += `[QUESTION ${idx + 1} / ${generatedQuestions.length} (${q.difficulty})]\n`;
          logText += `Text: "${q.text}"\n`;
          logText += `Type: ${q.type}\n`;
          if (q.options.length > 0) {
            logText += `Options:\n`;
            q.options.forEach((opt, oIdx) => {
              logText += `  [${String.fromCharCode(65 + oIdx)}] ${opt}\n`;
            });
            logText += `Correct Key: Option ${String.fromCharCode(65 + q.answer)}\n`;
          } else {
            logText += `Correct Key: ${q.answer}\n`;
          }
          logText += `Points: ${q.points} pts\n`;
          logText += `Rationale: ${q.explanation}\n`;
          logText += `----------------------------------------------------\n\n`;
        });

        logText += `[INJECTING INTO EXAM BANK]`;
        
        // Stream out the text character by character
        let currentPos = 0;
        const speed = 10;
        const streamInterval = setInterval(() => {
          if (currentPos < logText.length) {
            setStreamText((prev) => prev + logText.charAt(currentPos));
            currentPos++;
            if (currentPos > logText.length * 0.7) {
              setStreamStatus("Finalizing layout insertion...");
            } else if (currentPos > logText.length * 0.35) {
              setStreamStatus("Structuring question components...");
            }
          } else {
            clearInterval(streamInterval);
            // Append generated questions to database
            const formattedQs = generatedQuestions.map((q) => ({
              ...q,
              id: `ai-${Date.now()}-${Math.floor(Math.random() * 100000)}`
            }));
            setQuestionsBank((prev) => [...prev, ...formattedQs]);
            setStreamStatus("Loaded successfully");
            showToast(`Real AI generated and loaded ${formattedQs.length} questions!`);
            setIsGenerating(false);
            setAiPrompt("");
            setTimeout(() => setShowStream(false), 6000);
          }
        }, speed);

      } catch (err) {
        console.error(err);
        setStreamStatus("API Fallback Triggered");
        showToast("Gemini Key failed or response parsing failed. Falling back to offline simulation.", "error");
        runSimulation(detectedSubject, detectedDifficulty, count);
      }
    } else {
      // Offline Simulation
      runSimulation(detectedSubject, detectedDifficulty, count);
    }
  };

  const runSimulation = (subject, difficulty, count) => {
    setStreamStatus("Offline Simulation: Compiling local data pool...");
    
    const pool = mockQuestionsDatabase.filter(
      (q) => q.subject.toLowerCase() === subject.toLowerCase() || (subject === "General" && Math.random() > 0.4)
    );

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    while (selected.length < count) {
      const fallback = mockQuestionsDatabase[Math.floor(Math.random() * mockQuestionsDatabase.length)];
      if (!selected.some((item) => item.text === fallback.text)) {
        selected.push({ ...fallback });
      }
    }

    let output = `[OFFLINE ENGINE INITIALIZED]\n`;
    output += `Parameters -> Subject: [${subject}] | Difficulty: [${difficulty}] | Count: ${count}\n`;
    output += `Scanning curriculum guidelines databank...\n`;
    output += `Note: To get authentic generation, configure your Gemini API Key in App.jsx.\n`;
    output += `====================================================\n\n`;

    selected.forEach((q, i) => {
      output += `[QUESTION ${i + 1} / ${count} (${q.difficulty})]\n`;
      output += `Text: "${q.text}"\n`;
      output += `Type: ${q.type}\n`;
      if (q.options.length > 0) {
        output += `Options:\n`;
        q.options.forEach((opt, idx) => {
          output += `  [${String.fromCharCode(65 + idx)}] ${opt}\n`;
        });
        output += `Correct Key: Option ${String.fromCharCode(65 + q.answer)}\n`;
      } else {
        output += `Correct Key: ${q.answer}\n`;
      }
      output += `Points: ${q.points} pts\n`;
      output += `Rationale: ${q.explanation}\n`;
      output += `----------------------------------------------------\n\n`;
    });

    output += `[COMPILATION COMPLETE]\n`;
    output += `Injecting simulated question array into client Question Bank.`;

    let currentIdx = 0;
    const speed = 10;
    const streamInterval = setInterval(() => {
      if (currentIdx < output.length) {
        setStreamText((prev) => prev + output.charAt(currentIdx));
        currentIdx++;
        if (currentIdx > output.length * 0.7) {
          setStreamStatus("Writing final rationales...");
        } else if (currentIdx > output.length * 0.35) {
          setStreamStatus("Drafting choice structures...");
        }
      } else {
        clearInterval(streamInterval);
        const addedQs = selected.map((q) => ({
          ...q,
          id: `sim-${Date.now()}-${Math.floor(Math.random() * 100000)}`
        }));
        setQuestionsBank((prev) => [...prev, ...addedQs]);
        setStreamStatus("Success (Loaded)");
        showToast(`AI simulated and loaded ${count} questions!`);
        setIsGenerating(false);
        setAiPrompt("");
        setTimeout(() => setShowStream(false), 6000);
      }
    }, speed);
  };

  // Compile active live preview question data
  const currentPreviewData = compileManualQuestion();
  const difficultyClass = `tag-difficulty-${currentPreviewData.difficulty.toLowerCase()}`;

  return (
    <section className="page-view active" id="view-builder-pane">
      <div className="view-split">
        
        {/* Workspace Inputs */}
        <div className="builder-workspace" style={{ overflowY: 'auto', paddingRight: '6px' }}>
          <div className="section-title-wrap">
            <div>
              <h1 className="section-title">Question Builder</h1>
              <p className="section-desc">Create questions manually or leverage custom AI generator algorithms.</p>
            </div>
          </div>
          
          {/* AI Prompt Assistant Panel */}
          <div className="ai-assistant-card">
            <div className="ai-title-row">
              <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'none', stroke: 'var(--color-primary)', strokeWidth: '2' }}>
                <path d="M9.813 15.904L9 21l-.813-5.096A4 4 0 005.096 12.813L0 12l5.096-.813a4 4 0 003.091-3.091L9 3l.813 5.096a4 4 0 003.091 3.091L18 12l-5.096.813a4 4 0 00-3.091 3.091z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.071 4.929L18.5 8l-.571-3.071A2 2 0 0016.07 3.071L13 2.5l3.071-.571a2 2 0 001.358-1.358L18 0l.571 3.071a2 2 0 001.358 1.358L23 2.5l-3.071.571a2 2 0 00-1.358 1.358z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="ai-badge">AI Generator</span>
              <span className="section-desc" style={{ margin: "0 0 0 auto;" }}>
                {apiKey ? "Gemini 1.5 Flash Connected" : "Local Simulator Mode"}
              </span>
            </div>
            <p className="section-desc" style={{ marginTop: "-6px", marginBottom: "8px" }}>
              Enter a topic, difficulty, and count to generate new custom questions directly into your exam bank.
            </p>
            
            <div className="ai-prompt-box">
              <textarea
                placeholder="e.g., Generate 3 algebra questions about quadratic equations..."
                rows="2"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isGenerating}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAiGenerate();
                  }
                }}
              />
              <button
                type="button"
                className="ai-submit-btn"
                onClick={() => handleAiGenerate()}
                disabled={isGenerating}
                title="Generate with AI"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="prompt-suggestions">
              <span
                className="suggestion-chip"
                onClick={() => !isGenerating && handleAiGenerate("Generate 3 Algebra questions about factorization (Medium)")}
              >
                Algebra factorization
              </span>
              <span
                className="suggestion-chip"
                onClick={() => !isGenerating && handleAiGenerate("Generate 2 Biology questions about cellular structure (Easy)")}
              >
                Biology cell structures
              </span>
              <span
                className="suggestion-chip"
                onClick={() => !isGenerating && handleAiGenerate("Generate 1 History question about Ancient Rome (Hard)")}
              >
                Ancient Rome
              </span>
              <span
                className="suggestion-chip"
                onClick={() => !isGenerating && handleAiGenerate("Generate 2 Literature questions about Shakespeare (Medium)")}
              >
                Shakespeare plays
              </span>
            </div>

            {/* Stream Output panel */}
            {showStream && (
              <div className="ai-stream-panel" style={{ display: 'block' }}>
                <div className="stream-header">
                  <div className="stream-spinner">
                    {isGenerating && <div className="spinner-icon"></div>}
                    <span>{isGenerating ? "AI Engine Processing..." : "Generation Completed"}</span>
                  </div>
                  <span>{streamStatus}</span>
                </div>
                <div className="stream-content" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '11px' }}>
                    {streamText}
                  </pre>
                  <div ref={streamEndRef} />
                </div>
              </div>
            )}
          </div>
          
          {/* Manual Creator Form */}
          <form className="creator-form" onSubmit={(e) => e.preventDefault()}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              Manual Builder
            </h2>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="q-input-text">Question Text</label>
                <textarea
                  id="q-input-text"
                  className="form-control"
                  placeholder="Type your question prompt here..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="q-input-type">Question Type</label>
                <select
                  id="q-input-type"
                  className="form-control"
                  value={qType}
                  onChange={(e) => setQType(e.target.value)}
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True / False</option>
                  <option value="short-answer">Short Answer</option>
                  <option value="fill-in-the-blank">Fill in the Blank</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="q-input-difficulty">Difficulty Level</label>
                <select
                  id="q-input-difficulty"
                  className="form-control"
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="q-input-subject">Subject</label>
                <input
                  type="text"
                  id="q-input-subject"
                  className="form-control"
                  placeholder="e.g., Mathematics"
                  value={qSubject}
                  onChange={(e) => setQSubject(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="q-input-topic">Topic</label>
                <input
                  type="text"
                  id="q-input-topic"
                  className="form-control"
                  placeholder="e.g., Equations"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Assign Points</label>
                <div className="slider-group-wrap">
                  <input
                    type="range"
                    id="q-input-points"
                    className="points-slider"
                    min="1"
                    max="20"
                    value={qPoints}
                    onChange={(e) => setQPoints(e.target.value)}
                  />
                  <span className="points-val">{qPoints} pts</span>
                </div>
              </div>
            </div>

            {/* Options Editor Panel */}
            {(qType === "multiple-choice" || qType === "true-false") && (
              <div className="options-editor-panel" style={{ display: 'flex' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Answer Options & Correct Key Selection</span>
                  <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    Check circle to mark correct answer
                  </span>
                </label>
                <div id="options-list-editor">
                  {options.map((opt, idx) => (
                    <div className="option-edit-row" key={idx}>
                      <input
                        type="radio"
                        name="correct-choice-key"
                        className="option-correct-input"
                        checked={correctAnswerIndex === idx}
                        onChange={() => setCorrectAnswerIndex(idx)}
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        className="form-control option-text-input"
                        placeholder={qType === "true-false" ? "" : `Option Choice ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        readOnly={qType === "true-false"}
                      />
                      {qType === "multiple-choice" && options.length > 2 && (
                        <button
                          type="button"
                          className="remove-option-btn"
                          title="Remove Option"
                          onClick={() => removeOptionRow(idx)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {qType === "multiple-choice" && (
                  <div className="add-option-btn-wrap">
                    <button type="button" className="text-btn" onClick={addOptionRow}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Add option choice</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Answer Explanation */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="q-input-explanation">Answer Explanation / Feedback (Optional)</label>
              <textarea
                id="q-input-explanation"
                className="form-control"
                placeholder="Explain why the answer is correct or add step-by-step solutions..."
                style={{ minHeight: "60px" }}
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
              />
            </div>

            {/* Action buttons */}
            <div className="form-action-row">
              <button type="button" className="btn btn-secondary" onClick={resetFields}>
                Clear Fields
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddToBank}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Add to Question Bank</span>
              </button>
            </div>
          </form>
        </div>
        
        {/* Live Preview Side */}
        <div className="builder-preview">
          <h2 className="preview-header">Live Card Preview</h2>
          
          <div style={{ flexGrow: 1 }}>
            <div className="q-card">
              <div className="q-card-meta">
                <div className="q-card-tags">
                  <span className="tag" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 700 }}>
                    {currentPreviewData.subject}
                  </span>
                  {currentPreviewData.topic && <span className="tag">{currentPreviewData.topic}</span>}
                  <span className={`tag ${difficultyClass}`}>{currentPreviewData.difficulty}</span>
                </div>
                <span className="q-card-points">{currentPreviewData.points} Points</span>
              </div>
              <div className="q-card-text">
                {currentPreviewData.text}
              </div>
              
              {/* Option Rendering in Preview */}
              {(currentPreviewData.type === "multiple-choice" || currentPreviewData.type === "true-false") && currentPreviewData.options.length > 0 && (
                <ul className="q-card-options-list">
                  {currentPreviewData.options.map((optText, idx) => {
                    const isCorrect = currentPreviewData.answer === idx;
                    return (
                      <li className={`q-card-option ${isCorrect ? "correct" : ""}`} key={idx}>
                        <div className="q-card-option-circle">
                          {isCorrect ? "✓" : String.fromCharCode(65 + idx)}
                        </div>
                        <span>{optText || `Option ${String.fromCharCode(65 + idx)}`}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {currentPreviewData.type === "short-answer" && (
                <div className="paper-writing-lines" style={{ opacity: 0.7 }} />
              )}

              {currentPreviewData.type === "fill-in-the-blank" && (
                <div style={{ border: "1px dashed var(--border-color)", padding: "10px", borderRadius: "4px", fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Fill in the blank field: ________________________
                </div>
              )}

              {currentPreviewData.explanation && (
                <div className="q-card-explanation">
                  <strong>Answer Key & Rationale:</strong>
                  <p>{currentPreviewData.explanation}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Paper Info */}
          <div className="empty-state" style={{ borderStyle: "solid", padding: "20px", marginTop: "auto" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "28px", height: "28px", marginBottom: "8px", color: 'var(--color-primary)' }}>
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Question Bank Status</h3>
            <p>You have <strong>{questionsBank.length} questions</strong> in your bank paper. Ready to organize and export.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => switchView("bank")}
              style={{ width: "100%", marginTop: "14px", padding: "8px 16px", fontSize: "12px" }}
            >
              Go to Exam Paper
            </button>
          </div>
        </div>
        
      </div>
    </section>
  );
}

export default QuestionBuilder;
