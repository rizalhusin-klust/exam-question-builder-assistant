import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import QuestionBuilder from './components/QuestionBuilder';
import FastAuditor from './components/FastAuditor';
import FasterAi from './components/FasterAi';
import SlowerAi from './components/SlowerAi';
import ExamPaper from './components/ExamPaper';

const defaultBankQuestions = [
  {
    id: "def-1",
    text: "Solve for x in the quadratic equation: x² - 5x + 6 = 0.",
    type: "multiple-choice",
    options: ["x = 2 or x = 3", "x = -2 or x = -3", "x = 1 or x = 5", "x = 0 or x = 6"],
    answer: 0,
    points: 5,
    difficulty: "Medium",
    subject: "Mathematics",
    topic: "Algebra",
    explanation: "Factoring the equation gives (x-2)(x-3) = 0. Therefore, the roots are x = 2 and x = 3."
  },
  {
    id: "def-2",
    text: "DNA replication occurs in the ________ phase of the cell cycle.",
    type: "fill-in-the-blank",
    options: [],
    answer: "S (Synthesis)",
    points: 4,
    difficulty: "Medium",
    subject: "Science",
    topic: "Biology",
    explanation: "DNA replication happens during the S phase (Synthesis phase) of interphase before mitosis/meiosis."
  },
  {
    id: "def-3",
    text: "Who was the first Emperor of the Roman Empire?",
    type: "multiple-choice",
    options: ["Julius Caesar", "Augustus (Octavian)", "Nero", "Marcus Aurelius"],
    answer: 1,
    points: 4,
    difficulty: "Medium",
    subject: "History",
    topic: "Ancient Rome",
    explanation: "Octavian became the first Roman Emperor in 27 BC under the name Augustus."
  }
];

// ==========================================================================
// CONFIGURATION: Hardcoded Gemini API Key. Paste your Gemini API Key here.
// ==========================================================================
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

function App() {
  // --- States ---
  const [questionsBank, setQuestionsBank] = useState(() => {
    const stored = localStorage.getItem("examcraft_bank");
    return stored ? JSON.parse(stored) : defaultBankQuestions;
  });

  const [activeView, setActiveView] = useState("builder");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("examcraft_theme") || "light";
  });

  const [toasts, setToasts] = useState([]);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem("examcraft_bank", JSON.stringify(questionsBank));
  }, [questionsBank]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("examcraft_theme", theme);
  }, [theme]);

  // --- Toast Manager ---
  const showToast = (message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "builder":
        return (
          <QuestionBuilder
            questionsBank={questionsBank}
            setQuestionsBank={setQuestionsBank}
            apiKey={GEMINI_API_KEY}
            showToast={showToast}
            switchView={setActiveView}
          />
        );
      case "fast":
        return (
          <FastAuditor
            apiKey={GEMINI_API_KEY}
            questionsBank={questionsBank}
            setQuestionsBank={setQuestionsBank}
            showToast={showToast}
          />
        );
      case "faster":
        return (
          <FasterAi
            apiKey={GEMINI_API_KEY}
            questionsBank={questionsBank}
            setQuestionsBank={setQuestionsBank}
            showToast={showToast}
          />
        );
      case "slower":
        return (
          <SlowerAi
            apiKey={GEMINI_API_KEY}
            questionsBank={questionsBank}
            setQuestionsBank={setQuestionsBank}
            showToast={showToast}
            theme={theme}
            setTheme={setTheme}
          />
        );
      case "bank":
        return (
          <ExamPaper
            questionsBank={questionsBank}
            setQuestionsBank={setQuestionsBank}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="app-layout" data-active-view={activeView}>
      {/* Sidebar Component */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        questionsBank={questionsBank}
        apiKey={GEMINI_API_KEY}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Content Area */}
      <main id="app-main">
        {renderActiveView()}
      </main>

      {/* Global Notification Toast Container */}
      <div className="toast-host" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map((toast) => {
          let svgIcon = "";
          if (toast.type === "success") {
            svgIcon = (
              <svg viewBox="0 0 24 24" className="toast-icon" style={{ width: '18px', height: '18px', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          } else if (toast.type === "error") {
            svgIcon = (
              <svg viewBox="0 0 24 24" className="toast-icon" style={{ width: '18px', height: '18px', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }}>
                <path d="M18.36 18.36L5.64 5.64m12.72 0L5.64 18.36" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          } else {
            svgIcon = (
              <svg viewBox="0 0 24 24" className="toast-icon" style={{ width: '18px', height: '18px', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }}>
                <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
              </svg>
            );
          }

          return (
            <div
              key={toast.id}
              className={`toast ${toast.type}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 18px',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--text-primary)',
                animation: 'slideIn 0.3s ease-out forwards',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'opacity 0.3s, transform 0.3s'
              }}
            >
              {svgIcon}
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
