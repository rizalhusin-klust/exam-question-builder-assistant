import React, { useState, useEffect } from 'react';

function ExamPaper({ isActive, questionsBank, setQuestionsBank, showToast }) {
  // --- Search & Filters ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [uniqueSubjects, setUniqueSubjects] = useState([]);

  // --- Paper Settings ---
  const [paperFont, setPaperFont] = useState("sans");
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  // --- Paper Headings ---
  const [paperTitle, setPaperTitle] = useState("MID-TERM EXAMINATION");
  const [paperClass, setPaperClass] = useState("Grade 10 - Science B");
  const [paperInstructor, setPaperInstructor] = useState("Rizal Husin");
  const [paperInstructions, setPaperInstructions] = useState(
    "Read each question carefully. Write your answers clearly in the spaces provided. No electronic calculators allowed."
  );
  const [paperDate, setPaperDate] = useState("");

  // Initialize date on mount
  useEffect(() => {
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    setPaperDate(today.toLocaleDateString('en-US', options));
  }, []);

  // Update unique subjects list when bank changes
  useEffect(() => {
    const subjects = [...new Set(questionsBank.map((q) => q.subject))].filter(Boolean);
    setUniqueSubjects(subjects);
  }, [questionsBank]);

  // --- Reordering & Delete Handlers ---
  const moveQuestion = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= questionsBank.length) return;

    setQuestionsBank((prev) => {
      const updated = [...prev];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
  };

  const deleteQuestion = (idx) => {
    setQuestionsBank((prev) => prev.filter((_, i) => i !== idx));
    showToast("Deleted question from bank", "warning");
  };

  const clearAllQuestions = () => {
    if (window.confirm("Are you sure you want to clear all questions in your bank? This action cannot be undone.")) {
      setQuestionsBank([]);
      showToast("Cleared all questions from bank", "warning");
    }
  };

  // --- Export Markdown Rationale ---
  const handleExportMarkdown = () => {
    if (questionsBank.length === 0) {
      showToast("Cannot export empty question bank", "error");
      return;
    }

    let md = `# ${paperTitle.toUpperCase()}\n\n`;
    md += `**Date:** ${paperDate}  \n`;
    md += `**Class / Section:** ${paperClass}  \n`;
    md += `**Instructor:** ${paperInstructor}  \n`;
    md += `**Student Name:** ___________________________________\n\n`;
    md += `---\n\n`;
    md += `**INSTRUCTIONS:** *${paperInstructions}*\n\n`;
    md += `---\n\n`;

    questionsBank.forEach((q, idx) => {
      // Strip HTML tags for markdown if the text is audited HTML
      const plainText = q.text.replace(/<[^>]*>/g, '').trim();

      md += `### Question ${idx + 1} (${q.points} Points)\n`;
      md += `${plainText}\n\n`;

      if (q.type === "multiple-choice" || q.type === "true-false") {
        q.options.forEach((opt, optIdx) => {
          md += `- **${String.fromCharCode(65 + optIdx)}.** ${opt}\n`;
        });
        md += `\n`;
      } else if (q.type === "short-answer") {
        md += `*Provide your answer in the writing space below:*\n\n\n\n`;
      } else if (q.type === "fill-in-the-blank") {
        md += `*Answer:* ___________________________________\n\n`;
      }
    });

    // Add answer key at the bottom
    md += `\n---\n`;
    md += `# ANSWER KEY & EXPLANATIONS\n\n`;
    questionsBank.forEach((q, idx) => {
      let correctVal = "";
      if (q.type === "multiple-choice" || q.type === "true-false") {
        correctVal = `Option ${String.fromCharCode(65 + q.answer)} (${q.options[q.answer]})`;
      } else {
        correctVal = q.answer;
      }

      md += `**Q${idx + 1}.** Correct Answer: **${correctVal}**  \n`;
      if (q.explanation) {
        md += `*Rationale:* ${q.explanation.replace(/<[^>]*>/g, '')}  \n`;
      }
      md += `\n`;
    });

    navigator.clipboard.writeText(md)
      .then(() => {
        showToast("Markdown compiled & copied to clipboard!");
      })
      .catch((err) => {
        console.error("Clipboard copy error:", err);
        alert("Exam Markdown generated! Please copy the text below:\n\n" + md);
      });
  };

  // --- Filtering Logic ---
  const filteredQuestions = questionsBank.filter((q) => {
    const query = searchQuery.toLowerCase().trim();
    const textMatch = q.text.toLowerCase().includes(query) || 
                      q.subject.toLowerCase().includes(query) || 
                      q.topic.toLowerCase().includes(query);
    const subMatch = !selectedSubject || q.subject === selectedSubject;
    const diffMatch = !selectedDifficulty || q.difficulty === selectedDifficulty;
    return textMatch && subMatch && diffMatch;
  });

  return (
    <section className={`page-view ${isActive ? 'active' : ''}`} id="view-bank-pane" style={{ display: isActive ? 'flex' : 'none' }}>
      {/* Left Sidebar: Questions list & Filters */}
      <div className="bank-list-sidebar no-print">
        <h2 className="section-title">Question Bank</h2>
        <p className="section-desc">Review and reorder items inside your exam paper.</p>
        
        <div className="bank-filters">
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-selects">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        
        {/* Bank List container */}
        <div className="bank-items" style={{ flexGrow: 1, overflowY: 'auto' }}>
          {filteredQuestions.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "24px", height: "24px", marginBottom: "6px" }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <h3>No matching questions</h3>
              <p>Try adjusting your search query or filters.</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              // Find index in complete bank array for moving/swapping
              const trueIdx = questionsBank.findIndex((item) => item.id === q.id);
              const isFirst = trueIdx === 0;
              const isLast = trueIdx === questionsBank.length - 1;

              // Strip HTML tags for sidebar card summary text
              const displayBodyText = q.text.replace(/<[^>]*>/g, '').trim();

              return (
                <div className="bank-item-card" key={q.id}>
                  <div className="bank-item-controls">
                    <button
                      type="button"
                      className="item-control-btn btn-move-up"
                      title="Move Up"
                      onClick={() => moveQuestion(trueIdx, -1)}
                      disabled={isFirst}
                      style={isFirst ? { opacity: 0.3, cursor: 'default' } : {}}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4.5 15.75l7.5-7.5 7.5 7.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="item-control-btn btn-move-down"
                      title="Move Down"
                      onClick={() => moveQuestion(trueIdx, 1)}
                      disabled={isLast}
                      style={isLast ? { opacity: 0.3, cursor: 'default' } : {}}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="item-control-btn delete-btn"
                      title="Delete Question"
                      onClick={() => deleteQuestion(trueIdx)}
                      style={{ marginTop: "8px" }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="bank-item-details">
                    <div className="bank-item-header">
                      <span>Q{trueIdx + 1} &bull; {q.subject} ({q.difficulty})</span>
                      <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>{q.points} pts</span>
                    </div>
                    <div className="bank-item-body" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {displayBodyText}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {questionsBank.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearAllQuestions}
              style={{ padding: "10px 14px", fontSize: "13px", color: "var(--color-error)", flex: 1 }}
            >
              Clear All Questions
            </button>
          </div>
        )}
      </div>
      
      {/* Right Side: realistic paper sheet */}
      <div className="exam-preview-workspace" style={{ overflowY: 'auto' }}>
        
        {/* Control bar for paper settings */}
        <div className="paper-controls no-print">
          <div className="paper-controls-group">
            <label htmlFor="paper-font-select" style={{ fontSize: "12px", marginRight: "4px" }}>Typography:</label>
            <select
              id="paper-font-select"
              className="form-control"
              style={{ padding: "6px 12px", fontSize: "12px", width: "120px" }}
              value={paperFont}
              onChange={(e) => setPaperFont(e.target.value)}
            >
              <option value="sans">Clean Sans</option>
              <option value="serif">Classic Serif</option>
            </select>
            
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={showAnswerKey}
                onChange={(e) => setShowAnswerKey(e.target.checked)}
                style={{ accentColor: "var(--color-primary)" }}
              />
              <span>Show Answer Key</span>
            </label>
          </div>
          
          <div className="paper-controls-group">
            <button type="button" className="btn btn-secondary" onClick={handleExportMarkdown} style={{ padding: "8px 16px", fontSize: "12px" }}>
              Export Markdown
            </button>
            <button type="button" className="btn btn-primary" onClick={() => window.print()} style={{ padding: "8px 16px", fontSize: "12px", gap: "6px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "14px", height: "14px" }}>
                <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Print Paper</span>
            </button>
          </div>
        </div>
        
        {/* Printable A4 Sheet Simulator */}
        <div className={`paper-sheet ${paperFont === 'serif' ? 'font-serif' : ''}`} id="paper-sheet-printable" style={{ color: '#1e293b' }}>
          
          {/* Exam Header */}
          <header className="paper-header">
            <input
              type="text"
              className="paper-title-input no-print"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              style={{ width: '100%' }}
            />
            {/* Print-only static title */}
            <h1 className="print-only" style={{ display: 'none', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              {paperTitle}
            </h1>
            
            <div className="paper-meta-grid">
              <div className="paper-meta-row">
                <span className="paper-meta-label">STUDENT NAME:</span>
                <div className="paper-meta-input" style={{ borderBottom: "1px dotted #1e293b", flexGrow: 1 }}></div>
              </div>
              <div className="paper-meta-row">
                <span className="paper-meta-label">DATE:</span>
                <input
                  type="text"
                  className="paper-meta-input no-print"
                  value={paperDate}
                  onChange={(e) => setPaperDate(e.target.value)}
                />
                <span className="print-only" style={{ display: 'none', borderBottom: '1px solid #1e293b', flexGrow: 1, paddingLeft: '8px' }}>
                  {paperDate}
                </span>
              </div>
              <div className="paper-meta-row">
                <span className="paper-meta-label">CLASS / SECTION:</span>
                <input
                  type="text"
                  className="paper-meta-input no-print"
                  value={paperClass}
                  onChange={(e) => setPaperClass(e.target.value)}
                />
                <span className="print-only" style={{ display: 'none', borderBottom: '1px solid #1e293b', flexGrow: 1, paddingLeft: '8px' }}>
                  {paperClass}
                </span>
              </div>
              <div className="paper-meta-row">
                <span className="paper-meta-label">INSTRUCTOR:</span>
                <input
                  type="text"
                  className="paper-meta-input no-print"
                  value={paperInstructor}
                  onChange={(e) => setPaperInstructor(e.target.value)}
                />
                <span className="print-only" style={{ display: 'none', borderBottom: '1px solid #1e293b', flexGrow: 1, paddingLeft: '8px' }}>
                  {paperInstructor}
                </span>
              </div>
            </div>
            
            <div className="paper-instructions-wrap">
              <span className="paper-meta-label" style={{ fontSize: "13px" }}>INSTRUCTIONS:</span>
              <input
                type="text"
                className="paper-instructions-input no-print"
                value={paperInstructions}
                onChange={(e) => setPaperInstructions(e.target.value)}
                style={{ width: '100%' }}
              />
              <p className="print-only" style={{ display: 'none', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                {paperInstructions}
              </p>
            </div>
          </header>
          
          {/* Questions list rendered directly on paper */}
          <div className="paper-questions-list" id="paper-questions-render">
            {questionsBank.length === 0 ? (
              <div style={{ textAlign: "center", color: "#777", padding: "100px 20px", fontStyle: "italic", border: "2px dashed #ccc", borderRadius: "4px", backgroundColor: "#fafafa" }}>
                No questions added to the exam sheet yet. 
                Please use the Question Builder or FAST AI view to create some questions!
              </div>
            ) : (
              questionsBank.map((q, idx) => (
                <article className="paper-question" key={q.id}>
                  <div className="paper-question-header">
                    <span className="paper-question-text">
                      <strong>{idx + 1}.</strong>
                      {q.isHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: q.text }} style={{ marginLeft: '4px', display: 'inline-block' }} />
                      ) : (
                        <span style={{ marginLeft: '4px' }}>{q.text}</span>
                      )}
                    </span>
                    <span className="paper-question-points">[{q.points} Point{q.points === 1 ? "" : "s"}]</span>
                  </div>
                  
                  {/* Options choices grid */}
                  {(q.type === "multiple-choice" || q.type === "true-false") && (
                    <ul className="paper-options-list">
                      {q.options.map((opt, optIdx) => {
                        const marker = String.fromCharCode(65 + optIdx);
                        const isCorrect = q.answer === optIdx;
                        
                        return (
                          <li className="paper-option" key={optIdx}>
                            {showAnswerKey && isCorrect ? (
                              <span className="paper-option-correct-key" style={{ color: "var(--color-success)", fontWeight: 900 }}>
                                ✓ [{marker}] <span style={{ fontWeight: 700 }}>{opt}</span>
                              </span>
                            ) : (
                              <span><span className="paper-option-marker">{marker}.</span> {opt}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  
                  {q.type === "short-answer" && !q.isHtml && (
                    <div className="paper-writing-lines" />
                  )}
                  
                  {q.type === "fill-in-the-blank" && (
                    <div style={{ margin: "12px 0 6px 20px", fontSize: "14px", color: "#555" }}>
                      Answer: __________________________________________________
                    </div>
                  )}
                  
                  {/* Answer rationales */}
                  {showAnswerKey && (
                    <div className="paper-answer-box" style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid var(--color-primary)', borderRadius: '4px', fontSize: '12px', lineHeight: '1.4' }}>
                      <div>
                        <span className="paper-answer-label" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                          Correct Answer:
                        </span>{' '}
                        {q.type === "multiple-choice" || q.type === "true-false" ? (
                          `Option ${String.fromCharCode(65 + q.answer)} (${q.options[q.answer]})`
                        ) : (
                          q.answer
                        )}
                      </div>
                      {q.explanation && (
                        <div style={{ marginTop: '6px' }}>
                          <span className="paper-explanation-label" style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                            Rationale & Explanation:
                          </span>{' '}
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
          
        </div>
      </div>
    </section>
  );
}

export default ExamPaper;
