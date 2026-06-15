import React, { useState, useRef, useEffect } from 'react';

const SYSTEM_PROMPT = `You are an expert Academic Quality Assurance Agent. Your job is to analyze university evaluation questions and format them to match target standards perfectly.

You evaluate questions based on Bloom's Taxonomy cognitive levels paired with these program levels:
- Certificate: Focuses on Remembering and Understanding.
- Diploma: Focuses on Applying and Analyzing.
- Degree: Focuses on Analyzing and Evaluating.
- Master's: Focuses on Evaluating and Creating.

If the lecturer suggests a specific target mark, you must intercept that number and distribute it proportionally across sub-questions (i), (ii), and (iii). If no mark is found anywhere, use a logical distribution balancing out to a standard baseline (e.g., 20 marks).

You must structure your response exactly as formatted below, using the specific block tags [BLOCK_COGNITIVE], [BLOCK_SUITABILITY], [BLOCK_AUDIT_SCORE], [BLOCK_OVERALL_SCORE], [BLOCK_SUGGESTIONS], [BLOCK_PAPER], and [BLOCK_MARKING] as separators. Do not output normal markdown headers for these section tags.

[BLOCK_COGNITIVE]
Identify the exact Bloom's Taxonomy cognitive level (e.g., Analyzing, Evaluating, Remembering) with a brief 1-line justification based on the action verbs used.

[BLOCK_SUITABILITY]
State whether the question matches the targeted program level criteria. Clearly declare it as "Highly Suitable", "Too Easy", or "Too Complex", explaining why in 2 sentences.

[BLOCK_AUDIT_SCORE]
Provide a highly scannable, formatted scorecard summary for the audit metrics like this:
* Cognitive Weight Match Score: [X]/100% -> [Brief statement]
* Target Level Suitability Score: [Y]/100% -> [Brief statement]

[BLOCK_OVERALL_SCORE]
NUMERIC_SCORE: [Output just the raw standalone numerical rating out of 10 here, e.g., 7 or 8.5, with no text next to it]
★ BREAKDOWN SUMMARY METRICS:
- Taxonomy & Rigor Match: [Score]/2.5
- Program Level Fit: [Score]/2.5
- Outcome Blueprint Mapping: [Score]/2.5
- Mark Distribution Balance: [Score]/2.5
Summary Justification: [Provide a brief 1-2 sentence overall analytical quality statement.]

[BLOCK_SUGGESTIONS]
Provide 1 to 2 clear, bulleted recommendations on how the question can be rephrased or expanded to strengthen academic alignment to the requested level, CLO, and PLO.

[BLOCK_PAPER]
COURSE / SUBJECT: [Insert Course Name]
PROGRAM DOMAIN LEVEL: [Insert Selection Level]
---------------------------------------------------------------------------------------------------
QUESTION 1

[If the question contains a shared background scenario, context statement, or case detail, write it out clearly here first. If no scenario is needed, skip this line and go straight to the sub-segments.]

(i)   [Insert the first logical sub-question segment here, customized to match the requested domain level, CLO, and PLO]
                                                                                ([CLO X: PLO Y]) ([A] Marks)

(ii)  [Insert the second logical sub-question segment advancing or expanding on the concept]
                                                                                ([CLO X: PLO Y]) ([B] Marks)

(iii) [Insert a final sub-question segment requiring analysis, criticism, or design structure calculation]
                                                                                ([CLO X: PLO Y]) ([C] Marks)

                                                                                (Total: [Sum of A+B+C] Marks)
---------------------------------------------------------------------------------------------------

[BLOCK_MARKING]
Output ONLY clean, valid HTML for the marking scorecard using the exact Tailwind CSS structure below. Do NOT wrap the output in markdown code blocks. Replace the bracketed placeholder values with the actual generated rubric data while keeping the HTML tags perfectly intact.

<div class="font-sans w-full max-w-4xl mx-auto">
    <div class="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div class="flex flex-col gap-1 border-b border-slate-300 pb-2">
            <span class="font-bold text-slate-500 text-xs uppercase tracking-wider">Student Name / ID</span>
            <span class="text-slate-800 min-h-[20px]"></span>
        </div>
        <div class="flex flex-col gap-1 border-b border-slate-300 pb-2">
            <span class="font-bold text-slate-500 text-xs uppercase tracking-wider">Date</span>
            <span class="text-slate-800 min-h-[20px]"></span>
        </div>
        <div class="flex flex-col gap-1 border-b border-slate-300 pb-2">
            <span class="font-bold text-slate-500 text-xs uppercase tracking-wider">Examiner Name</span>
            <span class="text-slate-800 min-h-[20px]"></span>
        </div>
        <div class="flex flex-col gap-1 border-b border-slate-300 pb-2">
            <span class="font-bold text-slate-500 text-xs uppercase tracking-wider">Signature</span>
            <span class="text-slate-800 min-h-[20px]"></span>
        </div>
    </div>

    <table class="w-full border-collapse border border-slate-300 text-sm text-left shadow-sm rounded-lg overflow-hidden">
        <thead class="bg-slate-800 text-slate-100 uppercase text-xs tracking-wider">
            <tr>
                <th class="border border-slate-600 p-3 text-center w-16">Part</th>
                <th class="border border-slate-600 p-3">Model Solution Requirements</th>
                <th class="border border-slate-600 p-3 text-center w-24">Max Marks</th>
                <th class="border border-slate-600 p-3 text-center w-32">Score Awarded</th>
                <th class="border border-slate-600 p-3 w-48">Remarks</th>
            </tr>
        </thead>
        <tbody class="text-slate-700 align-top">
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="border border-slate-300 p-3 text-center font-bold bg-slate-100/50">(i)</td>
                <td class="border border-slate-300 p-3">
                    <div class="font-semibold text-slate-900 mb-1.5">[Briefly state 1-2 core keywords/definitions req.]</div>
                    <div class="text-xs text-slate-500 mb-1"><span class="font-semibold">Outcomes:</span> ([CLO X: PLO Y])</div>
                    <div class="text-xs text-rose-600 italic mt-2"><span class="font-semibold">Partial Rules:</span> [Deductions benchmarking rule]</div>
                </td>
                <td class="border border-slate-300 p-3 text-center font-bold text-slate-900 text-lg">[A]</td>
                <td class="border border-slate-300 p-3"></td>
                <td class="border border-slate-300 p-3"></td>
            </tr>
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="border border-slate-300 p-3 text-center font-bold bg-slate-100/50">(ii)</td>
                <td class="border border-slate-300 p-3">
                    <div class="font-semibold text-slate-900 mb-1.5">[List core conceptual points, formulas, steps req.]</div>
                    <div class="text-xs text-slate-500 mb-1"><span class="font-semibold">Outcomes:</span> ([CLO X: PLO Y])</div>
                    <div class="text-xs text-rose-600 italic mt-2"><span class="font-semibold">Partial Rules:</span> [Step-by-step scoring rules]</div>
                </td>
                <td class="border border-slate-300 p-3 text-center font-bold text-slate-900 text-lg">[B]</td>
                <td class="border border-slate-300 p-3"></td>
                <td class="border border-slate-300 p-3"></td>
            </tr>
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="border border-slate-300 p-3 text-center font-bold bg-slate-100/50">(iii)</td>
                <td class="border border-slate-300 p-3">
                    <div class="font-semibold text-slate-900 mb-1.5">[List requirements for deep synthesis/criticism]</div>
                    <div class="text-xs text-slate-500 mb-1"><span class="font-semibold">Outcomes:</span> ([CLO X: PLO Y])</div>
                    <div class="text-xs text-rose-600 italic mt-2"><span class="font-semibold">Partial Rules:</span> [Abstract response evaluation]</div>
                </td>
                <td class="border border-slate-300 p-3 text-center font-bold text-slate-900 text-lg">[C]</td>
                <td class="border border-slate-300 p-3"></td>
                <td class="border border-slate-300 p-3"></td>
            </tr>
            <tr class="bg-slate-100">
                <td colspan="2" class="border border-slate-300 p-4 text-right font-bold uppercase text-slate-800 tracking-wider">Total Score</td>
                <td class="border border-slate-300 p-4 text-center font-bold text-xl text-blue-700">[Sum]</td>
                <td class="border border-slate-300 p-4 text-center font-bold text-xl text-slate-400">/ [Sum]</td>
                <td class="border border-slate-300 p-4"></td>
            </tr>
        </tbody>
    </table>
</div>`;

function FasterAi({ apiKey, questionsBank, setQuestionsBank, showToast, theme, setTheme }) {
  // --- States ---
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("Degree");
  const [targetMark, setTargetMark] = useState("");
  const [clo, setClo] = useState("");
  const [cloStatement, setCloStatement] = useState("");
  const [plo, setPlo] = useState("");
  const [rawQuestion, setRawQuestion] = useState("");
  const [localApiKey, setLocalApiKey] = useState("");
  const [status, setStatus] = useState("empty"); // "empty" | "loading" | "success"

  // Parsed Results
  const [cognitive, setCognitive] = useState("");
  const [suitability, setSuitability] = useState("");
  const [auditScore, setAuditScore] = useState("");
  const [overallText, setOverallText] = useState("");
  const [scoreVal, setScoreVal] = useState("-");
  const [suggestions, setSuggestions] = useState("");
  const [formattedQuestionText, setFormattedQuestionText] = useState("");
  const [markingSchemeHtml, setMarkingSchemeHtml] = useState("");

  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const paperRef = useRef(null);
  const markingRef = useRef(null);
  const isDarkMode = theme === 'dark';



  const showToastLocal = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const copyToClipboard = (text, name) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showToastLocal(`${name} copied to clipboard!`);
        if (showToast) showToast(`${name} copied to clipboard!`);
      })
      .catch(() => {
        showToastLocal(`Failed to copy ${name}`, 'error');
        if (showToast) showToast(`Failed to copy ${name}`, 'error');
      });
  };

  const extractBlock = (text, startTag, endTag) => {
    try {
      if (!text.includes(startTag)) return '';
      const startIdx = text.indexOf(startTag) + startTag.length;
      const endIdx = endTag && text.includes(endTag) ? text.indexOf(endTag) : text.length;
      return text.substring(startIdx, endIdx).trim();
    } catch (e) {
      return "Error parsing section.";
    }
  };

  // Fetch with Exponential Backoff and Smart Error Handling
  const fetchWithRetry = async (url, options, maxRetries = 5) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await fetch(url, options);
        const json = await response.json().catch(() => ({}));
        
        if (!response.ok) {
          const errorMsg = json.error?.message || `HTTP Error: ${response.status}`;
          // Fail instantly on client errors (400-499) except Rate Limits (429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            const err = new Error(errorMsg);
            err.isClientError = true;
            throw err;
          }
          throw new Error(errorMsg);
        }
        return json;
      } catch (error) {
        if (error.isClientError) throw error; // Don't retry Bad Requests
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
      showToastLocal('Please add a raw draft question first.', 'error');
      if (showToast) showToast('Please add a raw draft question first.', 'error');
      return;
    }

    setStatus("loading");

    const userPrompt = `Please evaluate the following request:
- **Intended Program Level:** ${level}
- **Course/Subject:** ${subject || "General Module"}
- **Target Course Learning Outcome (CLO):** ${clo || "Unspecified"}
- **Course Learning Outcome Statement:** ${cloStatement || "None provided"}
- **Target Program Learning Outcome (PLO):** ${plo || "Unspecified"}
- **Explicitly Suggested Target Mark:** ${targetMark || "None provided"}
- **Raw Question Text:** ${rawQuestion}`;

    const runRequest = async (modelName) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${keyToUse}`;
      const payload = {
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
      };
      return await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };

    try {
      let data;
      // Try gemini-2.5-flash first (user's template)
      try {
        data = await runRequest("gemini-2.5-flash");
      } catch (err) {
        console.warn("gemini-2.5-flash failed, trying gemini-3.5-flash fallback...", err);
        try {
          data = await runRequest("gemini-3.5-flash");
        } catch (err2) {
          throw new Error(`AI models failed. ${err2.message}`);
        }
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error("Raw API Response:", data);
        throw new Error("Invalid or empty response from API (Blocked by safety filters or empty output)");
      }

      // Parse Text Blocks
      const cognitiveData = extractBlock(text, '[BLOCK_COGNITIVE]', '[BLOCK_SUITABILITY]');
      const suitabilityData = extractBlock(text, '[BLOCK_SUITABILITY]', '[BLOCK_AUDIT_SCORE]');
      const auditScoreData = extractBlock(text, '[BLOCK_AUDIT_SCORE]', '[BLOCK_OVERALL_SCORE]');
      const overallScoreData = extractBlock(text, '[BLOCK_OVERALL_SCORE]', '[BLOCK_SUGGESTIONS]');
      const suggestionsData = extractBlock(text, '[BLOCK_SUGGESTIONS]', '[BLOCK_PAPER]');
      
      const balanceParts = text.split('[BLOCK_PAPER]')[1] || "";
      const paperData = balanceParts.split('[BLOCK_MARKING]')[0] || "Parsing index error on layout.";
      const markingData = balanceParts.split('[BLOCK_MARKING]')[1] || "Parsing index error on guidelines.";

      const overallCleanText = overallScoreData.trim();
      const firstLine = overallCleanText.split('\n')[0];
      const matchScore = firstLine.match(/NUMERIC_SCORE:\s*([\d.]+)/i);
      const scoreValue = matchScore ? matchScore[1] : '?';

      setCognitive(cognitiveData);
      setSuitability(suitabilityData);
      setAuditScore(auditScoreData);
      setOverallText(overallCleanText.replace(firstLine, '').trim());
      setScoreVal(scoreValue);
      setSuggestions(suggestionsData);
      setFormattedQuestionText(paperData.trim());

      const rawMarkingData = markingData.trim().replace(/^```(html)?|```$/gm, '');
      setMarkingSchemeHtml(rawMarkingData.trim());

      setStatus("success");
      showToastLocal('Audit complete! Blueprints generated.');
      if (showToast) showToast('Audit complete! Blueprints generated.');

    } catch (error) {
      console.error("Evaluation Error:", error);
      showToastLocal(`Failed: ${error.message}`, 'error');
      if (showToast) showToast(`Failed: ${error.message}`, 'error');
      setStatus("empty");
    }
  };

  const handleAddToBank = () => {
    if (status !== "success") return;

    let difficulty = "Medium";
    if (level === "Certificate") {
      difficulty = "Easy";
    } else if (level === "Master's") {
      difficulty = "Hard";
    }

    const paperContent = paperRef.current ? paperRef.current.innerText : formattedQuestionText;
    const markingContent = markingRef.current ? markingRef.current.innerHTML : markingSchemeHtml;

    const newQuestion = {
      id: `faster-${Date.now()}`,
      text: paperContent,
      type: "short-answer",
      options: [],
      answer: markingContent,
      points: Number(targetMark) || Number(scoreVal) || 20,
      difficulty,
      subject: subject || "General Module",
      topic: "FASTer AI Audited",
      explanation: cognitive + "\n\n" + suitability + "\n\n" + suggestions,
      isHtml: false,
      isHtmlAnswer: true // Renders answer grading scorecard as HTML
    };

    setQuestionsBank((prev) => [...prev, newQuestion]);
    showToastLocal("Audited blueprint question added to Exam Paper!");
    if (showToast) showToast("Audited blueprint question added to Exam Paper!");
  };

  const handleCopyElement = (ref, name) => {
    const el = ref.current;
    if (!el) return;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
      document.execCommand('copy');
      showToastLocal(`${name} copied to clipboard!`);
      if (showToast) showToast(`${name} copied to clipboard!`);
    } catch (err) {
      showToastLocal(`Failed to copy ${name}`, 'error');
      if (showToast) showToast(`Failed to copy ${name}`, 'error');
    }
    selection.removeAllRanges();
  };

  return (
    <section className="page-view active bg-slate-50 text-slate-800 selection:bg-blue-200" id="view-faster-pane" style={{ display: 'block', overflowY: 'auto', height: '100%', width: '100%', paddingBottom: '96px' }}>
      
      {/* Toast Notification Container */}
      <div 
        id="toastContainer" 
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 ${toast.visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
        style={{
          backgroundColor: toast.type === 'success' ? '#059669' : '#dc2626',
          color: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'fixed'
        }}
      >
        {toast.type === 'success' ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        <span>{toast.message}</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .academic-font { font-family: 'Times New Roman', Times, serif; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
        
        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 
            to { transform: rotate(360deg); } 
        }

        /* Form Controls Consistency */
        #view-faster-pane input,
        #view-faster-pane select,
        #view-faster-pane textarea {
            background-color: var(--bg-panel) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: var(--radius-md) !important;
            padding: 12px 16px !important;
            font-size: 14px !important;
            font-family: inherit !important;
            outline: none !important;
            transition: all var(--transition-fast) !important;
        }
        #view-faster-pane select {
            appearance: none !important;
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(100, 110, 130, 0.7)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E") !important;
            background-repeat: no-repeat !important;
            background-position: right 16px center !important;
            background-size: 16px !important;
            padding-right: 44px !important;
            cursor: pointer !important;
        }
        #view-faster-pane input:focus,
        #view-faster-pane select:focus,
        #view-faster-pane textarea:focus {
            border-color: var(--color-primary) !important;
            background-color: var(--bg-surface) !important;
            box-shadow: 0 0 0 3px var(--color-primary-light) !important;
        }
        #view-faster-pane label {
            color: var(--text-secondary) !important;
        }

        #view-faster-pane {
            background-color: var(--bg-app) !important;
            color: var(--text-primary) !important;
        }
        [data-theme="dark"] #view-faster-pane .bg-white {
            background-color: var(--bg-surface) !important;
            color: var(--text-primary) !important;
        }
        [data-theme="dark"] #view-faster-pane .text-slate-900,
        [data-theme="dark"] #view-faster-pane .text-slate-800 {
            color: var(--text-primary) !important;
        }
        [data-theme="dark"] #view-faster-pane .text-slate-700,
        [data-theme="dark"] #view-faster-pane .text-slate-600 {
            color: var(--text-secondary) !important;
        }
        [data-theme="dark"] #view-faster-pane .border-slate-200,
        [data-theme="dark"] #view-faster-pane .border-slate-100 {
            border-color: var(--border-color) !important;
        }
        [data-theme="dark"] #view-faster-pane input::placeholder,
        [data-theme="dark"] #view-faster-pane textarea::placeholder {
            color: var(--text-muted) !important;
        }

        /* Print Override inside component */
        @media print {
            body * { visibility: hidden !important; }
            #root * { visibility: hidden !important; }
            #view-faster-pane, #view-faster-pane * { visibility: visible !important; }
            #view-faster-pane { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; display: block !important; }
            .print-container, .print-container * { visibility: visible !important; }
            .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; display: block !important; }
            .paper-break { page-break-before: always !important; margin-top: 40px !important; }
            .no-print { display: none !important; }
            .print-container .no-print { display: block !important; }
            .paper-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; background: transparent !important; }
        }
      `}} />

      <header className="header-block no-print">
        <div className="logo">FASTer Academic Question Auditor & Blueprint Planner</div>
        <div className="header-controls">
          <button 
            type="button"
            id="themeToggle" 
            className="theme-toggle" 
            title="Toggle Dark Mode"
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        
        {/* LEFT COLUMN: Input Form */}
        <section className="lg:col-span-4 space-y-6 no-print">
          <div className="draft-setup-box sticky top-28">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 border-0 pb-0 bg-transparent m-0" style={{ color: 'var(--text-primary)' }}>
              <svg className="text-blue-600 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg> 
              Question Draft Setup
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject / Course Name</label>
                <input 
                  type="text" 
                  id="subject" 
                  placeholder="e.g., Database Systems Engineering" 
                  className="w-full text-sm p-3 bg-slate-50 border border-solid border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Academic Level</label>
                  <select 
                    id="level" 
                    className="w-full text-sm p-3 bg-slate-50 border border-solid border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option value="Certificate">Certificate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Degree">Degree</option>
                    <option value="Master's">Master's</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Marks</label>
                  <input 
                    type="text" 
                    id="targetMark" 
                    placeholder="e.g., 20" 
                    className="w-full text-sm p-3 bg-slate-50 border border-solid border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    value={targetMark}
                    onChange={(e) => setTargetMark(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Course L.O.</label>
                  <input 
                    type="text" 
                    id="clo" 
                    placeholder="e.g., CLO 3" 
                    className="w-full text-sm p-3 bg-slate-50 border border-solid border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    value={clo}
                    onChange={(e) => setClo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Program L.O.</label>
                  <input 
                    type="text" 
                    id="plo" 
                    placeholder="e.g., PLO 2" 
                    className="w-full text-sm p-3 bg-slate-50 border border-solid border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    value={plo}
                    onChange={(e) => setPlo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Course Learning Outcome (CLO) Statement</label>
                <input 
                  type="text" 
                  id="cloStatement" 
                  placeholder="e.g., Apply normalization techniques to optimize database performance." 
                  className="w-full text-sm p-3 bg-slate-50 border border-solid border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  value={cloStatement}
                  onChange={(e) => setCloStatement(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Raw Draft Question Input</label>
                <textarea 
                  id="rawQuestion" 
                  rows="8" 
                  placeholder="Paste your raw, messy, or unformatted question draft text here..." 
                  className="w-full text-sm p-3 bg-slate-50 border border-solid border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-y"
                  value={rawQuestion}
                  onChange={(e) => setRawQuestion(e.target.value)}
                />
              </div>

              <button 
                id="btnSubmit" 
                onClick={evaluateQuestion} 
                disabled={status === 'loading'}
                className={`w-full hover:shadow-lg active:scale-[0.98] text-white font-semibold py-3.5 px-4 rounded-lg transition-all flex justify-center items-center gap-2 border-0 cursor-pointer ${status === 'loading' ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {status !== 'loading' && (
                  <svg id="btnIcon" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {status === 'loading' && <div id="btnSpinner" className="spinner"></div>}
                <span id="btnText">{status === 'loading' ? 'Analyzing Rigor Matrix...' : 'Audit & Build Blueprints'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Results Workspace */}
        <section className="lg:col-span-8 space-y-6">
            
          {/* Empty State / Dashboard View */}
          {status === 'empty' && (
            <div id="emptyState" className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-solid border-slate-300 rounded-2xl bg-slate-50/50">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-solid border-slate-100 flex items-center justify-center">
                <svg className="h-10 w-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2 m-0">Workspace Ready</h3>
              <p className="text-slate-500 max-w-md m-0 leading-relaxed mt-2">
                Enter your raw examination question on the left and click 'Audit & Build Blueprints' to generate a comprehensive quality matrix, formatting layouts, and marking schemes.
              </p>
            </div>
          )}

          {/* Skeletons for Loading State */}
          {status === 'loading' && (
            <div id="loadingState" className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
              <div className="h-32 bg-slate-200 rounded-xl"></div>
              <div className="h-32 bg-slate-200 rounded-xl"></div>
              <div className="h-40 bg-slate-200 rounded-xl sm:col-span-2"></div>
              <div className="h-48 bg-slate-200 rounded-xl sm:col-span-2"></div>
              <div className="h-64 bg-slate-200 rounded-xl sm:col-span-2"></div>
            </div>
          )}

          {/* Populated Results Dashboard */}
          {status === 'success' && (
            <div id="resultsState" className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                
              {/* Block 1: Cognitive Level */}
              <div className="bg-white border-l-4 border-l-blue-500 border-solid border-y border-r border-slate-200 p-5 rounded-r-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-blue-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-2 m-0">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 17 22 12" />
                  </svg>
                  Cognitive Level
                </h3>
                <div id="blockCognitive" className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {cognitive}
                </div>
              </div>

              {/* Block 2: Target Suitability */}
              <div className="bg-white border-l-4 border-l-emerald-500 border-solid border-y border-r border-slate-200 p-5 rounded-r-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-emerald-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-2 m-0">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  Target Suitability
                </h3>
                <div id="blockSuitability" className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {suitability}
                </div>
              </div>
              
              {/* Block 3: Rigor Alignment Summary Score */}
              <div className="bg-white border-l-4 border-l-indigo-500 border-solid border-y border-r border-slate-200 p-5 rounded-r-xl shadow-sm sm:col-span-2 hover:shadow-md transition-shadow">
                <h3 className="text-indigo-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-2 m-0">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Rigor Verification Index
                </h3>
                <div id="blockAuditScore" className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                  {auditScore}
                </div>
              </div>

              {/* Block 4: Overall Rating */}
              <div className="bg-gradient-to-br from-purple-50 to-white border border-solid border-purple-200 p-6 rounded-xl shadow-sm sm:col-span-2 flex justify-between items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-purple-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-3 m-0">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                    Blueprint Assessment Rating
                  </h3>
                  <div id="blockOverallText" className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {overallText}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-purple-600 text-white font-extrabold rounded-2xl w-28 h-28 shrink-0 shadow-lg border-4 border-solid border-purple-200 transform rotate-2">
                  <span id="bigScoreBadge" className="text-5xl leading-none tracking-tight">{scoreVal}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-90 mt-1">OUT OF 10</span>
                </div>
              </div>

              {/* Block 5: Suggestions */}
              <div className="bg-amber-50 border border-solid border-amber-200 p-5 rounded-xl shadow-sm sm:col-span-2">
                <h3 className="text-amber-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-2 m-0">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
                    <line x1="9" y1="18" x2="15" y2="18" />
                    <line x1="10" y1="22" x2="14" y2="22" />
                  </svg>
                  Improvement Suggestions
                </h3>
                <div id="blockSuggestions" className="text-sm text-amber-950 whitespace-pre-line leading-relaxed">
                  {suggestions}
                </div>
              </div>

              {/* Print Container Area */}
              <div className="print-container space-y-8 sm:col-span-2 mt-4 w-full">
                  
                {/* Formatted Paper Output */}
                <div className="bg-white rounded-xl shadow-sm border border-solid border-slate-200 overflow-hidden no-print transition-all">
                  <div className="bg-slate-50 border-b border-solid border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 m-0">
                        <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Formatted Question Layout
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 m-0">Review and fine-tune the final academic paper structure.</p>
                    </div>
                    <button 
                      onClick={() => handleCopyElement(paperRef, "Question layout")} 
                      className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-3 rounded-lg border border-solid border-slate-300 shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Output
                    </button>
                  </div>
                  <div className="p-8 bg-white overflow-x-auto">
                    <div 
                      ref={paperRef}
                      contentEditable={true} 
                      suppressContentEditableWarning={true}
                      spellCheck={false} 
                      onBlur={(e) => setFormattedQuestionText(e.target.innerText)}
                      className="academic-font text-[11pt] leading-relaxed text-black outline-none min-h-[200px] whitespace-pre-wrap fast-blueprint-paper"
                      style={{ color: 'black', fontFamily: "'Times New Roman', Times, serif" }}
                    >
                      {formattedQuestionText}
                    </div>
                  </div>
                </div>

                {/* Marking Matrix Output */}
                <div className="bg-white rounded-xl shadow-sm border border-solid border-slate-200 overflow-hidden paper-break no-print">
                  <div className="bg-slate-50 border-b border-solid border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 m-0">
                        <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        Evaluation Marking Scorecard
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 m-0">Lecturer's grading rubric and mark distribution matrix.</p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <button 
                        onClick={handleAddToBank}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg border-0 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        Add to Bank
                      </button>
                      <button 
                        onClick={() => handleCopyElement(markingRef, "Marking scheme")} 
                        className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-3 rounded-lg border border-solid border-slate-300 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Table
                      </button>
                      <button 
                        onClick={() => window.print()} 
                        className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer border-0"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Print Booklet
                      </button>
                    </div>
                  </div>
                  <div className="p-8 bg-white overflow-x-auto">
                    <div 
                      ref={markingRef}
                      contentEditable={true} 
                      suppressContentEditableWarning={true}
                      spellCheck={false} 
                      onBlur={(e) => setMarkingSchemeHtml(e.target.innerHTML)}
                      className="outline-none min-h-[200px] w-full marking-sheet-container"
                      dangerouslySetInnerHTML={{ __html: markingSchemeHtml }}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>
      </main>
    </section>
  );
}

export default FasterAi;
