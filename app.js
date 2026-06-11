// ==========================================================================
// Exam Question Builder Assistant - Application Logic (JavaScript)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // --- State Variables ---
  let questionsBank = [];
  let activeView = "builder";
  let theme = "light";
  
  // Default fallback questions to populate the bank if empty (so it looks beautiful immediately)
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

  // --- DOM Elements ---
  const sidebar = document.getElementById("app-sidebar");
  const navBuilder = document.getElementById("nav-builder");
  const navBank = document.getElementById("nav-bank");
  const viewBuilderPane = document.getElementById("view-builder-pane");
  const viewBankPane = document.getElementById("view-bank-pane");
  
  const themeLightBtn = document.getElementById("theme-light");
  const themeDarkBtn = document.getElementById("theme-dark");
  
  // Form elements
  const form = document.getElementById("question-creator-form");
  const inputText = document.getElementById("q-input-text");
  const inputType = document.getElementById("q-input-type");
  const inputDifficulty = document.getElementById("q-input-difficulty");
  const inputSubject = document.getElementById("q-input-subject");
  const inputTopic = document.getElementById("q-input-topic");
  const inputPoints = document.getElementById("q-input-points");
  const pointsSliderVal = document.getElementById("points-slider-val");
  const optionsEditorContainer = document.getElementById("options-editor-container");
  const optionsListEditor = document.getElementById("options-list-editor");
  const btnAddOption = document.getElementById("btn-add-option");
  const inputExplanation = document.getElementById("q-input-explanation");
  
  const btnClearFields = document.getElementById("btn-clear-fields");
  const btnAddToBank = document.getElementById("btn-add-to-bank");
  
  // AI Panel elements
  const aiPromptInput = document.getElementById("ai-prompt-input");
  const btnAiGenerate = document.getElementById("btn-ai-generate");
  const aiStreamContainer = document.getElementById("ai-stream-container");
  const aiStreamText = document.getElementById("ai-stream-text");
  const aiStreamStatus = document.getElementById("ai-stream-status");
  const suggestionChips = document.querySelectorAll(".suggestion-chip");
  
  // Preview panels
  const builderCardPreviewContainer = document.getElementById("builder-card-preview-container");
  const bankCountBadge = document.getElementById("bank-count-badge");
  const quickCountVal = document.getElementById("quick-count-val");
  const btnGotoBankView = document.getElementById("btn-goto-bank-view");
  
  // Bank page elements
  const bankCardsListContainer = document.getElementById("bank-cards-list-container");
  const bankSearch = document.getElementById("bank-search");
  const filterSubject = document.getElementById("filter-subject");
  const filterDifficulty = document.getElementById("filter-difficulty");
  const btnClearAllBank = document.getElementById("btn-clear-all-bank");
  
  // Paper sheet elements
  const paperSheet = document.getElementById("paper-sheet-printable");
  const paperQuestionsRender = document.getElementById("paper-questions-render");
  const paperFontSelect = document.getElementById("paper-font-select");
  const paperShowAnswersKey = document.getElementById("paper-show-answers-key");
  const btnPrintExam = document.getElementById("btn-print-exam");
  const btnExportMarkdown = document.getElementById("btn-export-markdown");
  
  const paperTitle = document.getElementById("paper-title");
  const paperDate = document.getElementById("paper-date");
  const paperClass = document.getElementById("paper-class");
  const paperInstructor = document.getElementById("paper-instructor");
  const paperInstructions = document.getElementById("paper-instructions");
  
  const toastHost = document.getElementById("toast-host");

  // --- Initial Setup ---
  init();

  function init() {
    // 1. Load data from LocalStorage
    const storedQuestions = localStorage.getItem("examcraft_bank");
    if (storedQuestions) {
      questionsBank = JSON.parse(storedQuestions);
    } else {
      questionsBank = [...defaultBankQuestions];
      saveToStorage();
    }
    
    // 2. Load theme
    const storedTheme = localStorage.getItem("examcraft_theme") || "light";
    setAppTheme(storedTheme);
    
    // 3. Set default date
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    paperDate.value = today.toLocaleDateString('en-US', options);
    
    // 4. Initial renders
    updateBankCountElements();
    renderFormOptionsList();
    renderLiveCardPreview();
    renderBankListViews();
    populateSubjectFilterDropdown();
    
    // 5. Event bindings
    bindEvents();
  }

  // --- LocalStorage Helpers ---
  function saveToStorage() {
    localStorage.setItem("examcraft_bank", JSON.stringify(questionsBank));
  }

  // --- Theme Management ---
  function setAppTheme(newTheme) {
    theme = newTheme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("examcraft_theme", theme);
    
    if (theme === "dark") {
      themeDarkBtn.classList.add("active");
      themeLightBtn.classList.remove("active");
    } else {
      themeLightBtn.classList.add("active");
      themeDarkBtn.classList.remove("active");
    }
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Navigation Routing
    navBuilder.addEventListener("click", () => switchView("builder"));
    navBank.addEventListener("click", () => switchView("bank"));
    btnGotoBankView.addEventListener("click", () => switchView("bank"));
    
    // Theme buttons
    themeLightBtn.addEventListener("click", () => setAppTheme("light"));
    themeDarkBtn.addEventListener("click", () => setAppTheme("dark"));
    
    // Form range slider
    inputPoints.addEventListener("input", (e) => {
      pointsSliderVal.textContent = `${e.target.value} pts`;
      renderLiveCardPreview();
    });
    
    // Creator Form inputs - real-time update preview
    inputText.addEventListener("input", renderLiveCardPreview);
    inputType.addEventListener("change", () => {
      renderFormOptionsList();
      renderLiveCardPreview();
    });
    inputDifficulty.addEventListener("change", renderLiveCardPreview);
    inputSubject.addEventListener("input", renderLiveCardPreview);
    inputTopic.addEventListener("input", renderLiveCardPreview);
    inputExplanation.addEventListener("input", renderLiveCardPreview);
    
    // Option builder events
    btnAddOption.addEventListener("click", addOptionEditorRow);
    
    // Creator action buttons
    btnClearFields.addEventListener("click", resetCreatorForm);
    btnAddToBank.addEventListener("click", handleAddQuestionToBank);
    
    // AI Panel events
    btnAiGenerate.addEventListener("click", handleAiGenerateRequest);
    aiPromptInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAiGenerateRequest();
      }
    });
    
    // Chips clicks
    suggestionChips.forEach(chip => {
      chip.addEventListener("click", () => {
        aiPromptInput.value = chip.getAttribute("data-prompt");
        handleAiGenerateRequest();
      });
    });
    
    // Bank list search & filter
    bankSearch.addEventListener("input", renderBankListViews);
    filterSubject.addEventListener("change", renderBankListViews);
    filterDifficulty.addEventListener("change", renderBankListViews);
    
    btnClearAllBank.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all questions in your bank? This action cannot be undone.")) {
        questionsBank = [];
        saveToStorage();
        updateBankCountElements();
        renderBankListViews();
        populateSubjectFilterDropdown();
        showToast("Cleared all questions from bank", "warning");
      }
    });
    
    // Paper settings
    paperFontSelect.addEventListener("change", (e) => {
      if (e.target.value === "serif") {
        paperSheet.classList.add("font-serif");
      } else {
        paperSheet.classList.remove("font-serif");
      }
    });
    
    paperShowAnswersKey.addEventListener("change", renderPaperQuestions);
    btnPrintExam.addEventListener("click", () => {
      window.print();
    });
    
    btnExportMarkdown.addEventListener("click", handleExportMarkdown);
  }

  // --- Router View Switcher ---
  function switchView(target) {
    if (activeView === target) return;
    
    // Custom logic to handle SPA View Transition API if supported for fluid visual states
    const transition = () => {
      activeView = target;
      if (target === "builder") {
        navBuilder.classList.add("active");
        navBank.classList.remove("active");
        viewBuilderPane.classList.add("active");
        viewBankPane.classList.remove("active");
      } else {
        navBank.classList.add("active");
        navBuilder.classList.remove("active");
        viewBankPane.classList.add("active");
        viewBuilderPane.classList.remove("active");
        
        // Refresh bank view state
        populateSubjectFilterDropdown();
        renderBankListViews();
      }
    };
    
    if (document.startViewTransition) {
      document.startViewTransition(transition);
    } else {
      transition();
    }
  }

  // --- Toast Notification System ---
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let svgIcon = "";
    if (type === "success") {
      svgIcon = `<svg viewBox="0 0 24 24" class="toast-icon"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else if (type === "error") {
      svgIcon = `<svg viewBox="0 0 24 24" class="toast-icon"><path d="M18.36 18.36L5.64 5.64m12.72 0L5.64 18.36" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else {
      svgIcon = `<svg viewBox="0 0 24 24" class="toast-icon"><circle cx="12" cy="12" r="10" stroke-linecap="round"/><path d="M12 8v4m0 4h.01" stroke-linecap="round"/></svg>`;
    }
    
    toast.innerHTML = `
      ${svgIcon}
      <span>${message}</span>
    `;
    
    toastHost.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Form Generation / Custom Select Option Rows ---
  function renderFormOptionsList() {
    const type = inputType.value;
    optionsListEditor.innerHTML = "";
    
    if (type === "multiple-choice") {
      optionsEditorContainer.style.display = "flex";
      btnAddOption.style.display = "flex";
      
      // Render standard 4 options
      for (let i = 0; i < 4; i++) {
        addOptionEditorRow(`Option Choice ${String.fromCharCode(65 + i)}`, i === 0);
      }
    } else if (type === "true-false") {
      optionsEditorContainer.style.display = "flex";
      btnAddOption.style.display = "none";
      
      // Exactly True and False options (read-only texts)
      addOptionEditorRow("True", true, true);
      addOptionEditorRow("False", false, true);
    } else {
      // Short Answer & Fill in the blank do not use option configurations
      optionsEditorContainer.style.display = "none";
    }
  }

  function addOptionEditorRow(val = "", isChecked = false, isReadOnly = false) {
    const list = optionsListEditor;
    const rowId = `opt-row-${Math.random().toString(36).substring(2, 9)}`;
    const row = document.createElement("div");
    row.className = "option-edit-row";
    row.id = rowId;
    
    const count = list.children.length;
    
    // Correct radio select
    const isTF = inputType.value === "true-false";
    const correctInput = document.createElement("input");
    correctInput.type = isTF ? "radio" : "radio"; // Always use radio to select exactly one correct answer
    correctInput.name = "correct-choice-key";
    correctInput.className = "option-correct-input";
    correctInput.checked = isChecked;
    correctInput.title = "Mark as correct answer";
    correctInput.addEventListener("change", renderLiveCardPreview);
    
    // Text option input
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.className = "form-control option-text-input";
    textInput.placeholder = `Enter option text...`;
    textInput.value = val;
    if (isReadOnly) textInput.readOnly = true;
    textInput.addEventListener("input", renderLiveCardPreview);
    
    row.appendChild(correctInput);
    row.appendChild(textInput);
    
    // Remove option action button if NOT read-only and multiple-choice (keep at least 2 options)
    if (!isReadOnly) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "remove-option-btn";
      deleteBtn.title = "Remove Option";
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      deleteBtn.addEventListener("click", () => {
        if (list.children.length > 2) {
          row.remove();
          // Rename options A, B, C etc placeholders if needed
          reIndexOptionPlaceholders();
          renderLiveCardPreview();
        } else {
          showToast("A multiple choice question must have at least 2 choices", "error");
        }
      });
      row.appendChild(deleteBtn);
    }
    
    list.appendChild(row);
    renderLiveCardPreview();
  }

  function reIndexOptionPlaceholders() {
    const rows = optionsListEditor.querySelectorAll(".option-edit-row");
    rows.forEach((row, i) => {
      const txt = row.querySelector(".option-text-input");
      if (txt && !txt.readOnly && !txt.value) {
        txt.placeholder = `Option Choice ${String.fromCharCode(65 + i)}`;
      }
    });
  }

  // Helper to compile options and answers from creator form
  function compileCurrentQuestionData() {
    const text = inputText.value.trim();
    const type = inputType.value;
    const difficulty = inputDifficulty.value;
    const subject = inputSubject.value.trim() || "General";
    const topic = inputTopic.value.trim() || "General";
    const points = parseInt(inputPoints.value, 10);
    const explanation = inputExplanation.value.trim();
    
    let options = [];
    let answer = null;
    
    if (type === "multiple-choice" || type === "true-false") {
      const optionRows = optionsListEditor.querySelectorAll(".option-edit-row");
      optionRows.forEach((row, idx) => {
        const textVal = row.querySelector(".option-text-input").value.trim() || `Option ${String.fromCharCode(65 + idx)}`;
        const isCorrect = row.querySelector(".option-correct-input").checked;
        
        options.push(textVal);
        if (isCorrect) {
          answer = idx;
        }
      });
    } else if (type === "short-answer" || type === "fill-in-the-blank") {
      // Single text based answer key
      options = [];
      answer = "Instructor Evaluation / Student Handwrite";
    }
    
    return {
      text: text || "Untitled Question Prompt",
      type,
      options,
      answer,
      points,
      difficulty,
      subject,
      topic,
      explanation
    };
  }

  // --- Real-Time Live Preview Card Rendering ---
  function renderLiveCardPreview() {
    const q = compileCurrentQuestionData();
    builderCardPreviewContainer.innerHTML = "";
    
    const card = document.createElement("div");
    card.className = "q-card";
    
    // Tags row
    let difficultyClass = `tag-difficulty-${q.difficulty.toLowerCase()}`;
    card.innerHTML = `
      <div class="q-card-meta">
        <div class="q-card-tags">
          <span class="tag" style="background-color: var(--color-primary-light); color: var(--color-primary); font-weight:700;">${q.subject}</span>
          <span class="tag">${q.topic}</span>
          <span class="tag ${difficultyClass}">${q.difficulty}</span>
        </div>
        <span class="q-card-points">${q.points} Points</span>
      </div>
      <div class="q-card-text">${q.text}</div>
    `;
    
    // Question option cards
    if (q.type === "multiple-choice" || q.type === "true-false") {
      const optionsContainer = document.createElement("ul");
      optionsContainer.className = "q-card-options-list";
      
      q.options.forEach((optText, idx) => {
        const li = document.createElement("li");
        const isCorrect = q.answer === idx;
        li.className = `q-card-option ${isCorrect ? "correct" : ""}`;
        
        li.innerHTML = `
          <div class="q-card-option-circle">
            ${isCorrect ? "✓" : String.fromCharCode(65 + idx)}
          </div>
          <span>${optText}</span>
        `;
        optionsContainer.appendChild(li);
      });
      card.appendChild(optionsContainer);
    } else if (q.type === "short-answer") {
      const mockLines = document.createElement("div");
      mockLines.className = "paper-writing-lines";
      mockLines.style.opacity = "0.7";
      card.appendChild(mockLines);
    } else if (q.type === "fill-in-the-blank") {
      const textPlaceholder = document.createElement("div");
      textPlaceholder.style.border = "1px dashed var(--border-color)";
      textPlaceholder.style.padding = "10px";
      textPlaceholder.style.borderRadius = "4px";
      textPlaceholder.style.fontSize = "13px";
      textPlaceholder.style.color = "var(--text-muted)";
      textPlaceholder.style.fontStyle = "italic";
      textPlaceholder.innerHTML = "Fill in the blank field: ________________________";
      card.appendChild(textPlaceholder);
    }
    
    // Explanation
    if (q.explanation) {
      const expDiv = document.createElement("div");
      expDiv.className = "q-card-explanation";
      expDiv.innerHTML = `
        <strong>Answer Key & Rationale:</strong>
        <p>${q.explanation}</p>
      `;
      card.appendChild(expDiv);
    }
    
    builderCardPreviewContainer.appendChild(card);
  }

  // --- Manual Creator Submissions ---
  function handleAddQuestionToBank() {
    const text = inputText.value.trim();
    if (!text) {
      showToast("Please enter a question text prompt", "error");
      inputText.focus();
      return;
    }
    
    const q = compileCurrentQuestionData();
    
    // Additional validation for multiple choice / T-F keys
    if ((q.type === "multiple-choice" || q.type === "true-false") && q.answer === null) {
      showToast("Please check one correct answer option in options list", "error");
      return;
    }
    
    // Give it a unique ID
    q.id = `usr-${Date.now()}`;
    
    // Append and save
    questionsBank.push(q);
    saveToStorage();
    
    // Reset form states
    resetCreatorForm();
    
    // Updates
    updateBankCountElements();
    showToast("Added question to exam paper!");
    
    // Smooth pulse preview update
    renderLiveCardPreview();
  }

  function resetCreatorForm() {
    form.reset();
    pointsSliderVal.textContent = "5 pts";
    inputPoints.value = 5;
    inputSubject.value = "General";
    
    // Trigger redraw option editor fields
    renderFormOptionsList();
    renderLiveCardPreview();
  }

  // --- AI Simulated Streaming Generator Engine ---
  function handleAiGenerateRequest() {
    const prompt = aiPromptInput.value.trim();
    if (!prompt) {
      showToast("Please enter a topic or instruction for the AI assistant", "error");
      aiPromptInput.focus();
      return;
    }
    
    // Show streaming container
    aiStreamContainer.style.display = "block";
    aiStreamText.textContent = "";
    aiStreamStatus.textContent = "Parsing command parameters...";
    
    btnAiGenerate.disabled = true;
    aiPromptInput.disabled = true;
    
    // Analyze prompt keywords
    const lowerPrompt = prompt.toLowerCase();
    let selectedSubject = "General";
    let selectedDifficulty = "Medium";
    let count = 2; // Default count
    
    if (lowerPrompt.includes("math") || lowerPrompt.includes("algebra") || lowerPrompt.includes("calculus") || lowerPrompt.includes("geometry")) {
      selectedSubject = "Mathematics";
    } else if (lowerPrompt.includes("bio") || lowerPrompt.includes("science") || lowerPrompt.includes("physics") || lowerPrompt.includes("chemistry")) {
      selectedSubject = "Science";
    } else if (lowerPrompt.includes("history") || lowerPrompt.includes("rome") || lowerPrompt.includes("egypt") || lowerPrompt.includes("war")) {
      selectedSubject = "History";
    } else if (lowerPrompt.includes("literature") || lowerPrompt.includes("shakespeare") || lowerPrompt.includes("poem") || lowerPrompt.includes("book")) {
      selectedSubject = "Literature";
    }
    
    if (lowerPrompt.includes("easy")) {
      selectedDifficulty = "Easy";
    } else if (lowerPrompt.includes("hard") || lowerPrompt.includes("difficult")) {
      selectedDifficulty = "Hard";
    } else if (lowerPrompt.includes("medium")) {
      selectedDifficulty = "Medium";
    }
    
    // Match question counts
    const countMatch = lowerPrompt.match(/\b([1-9])\s*question/i) || lowerPrompt.match(/\bgenerate\s*([1-9])\b/i);
    if (countMatch && countMatch[1]) {
      count = parseInt(countMatch[1], 10);
    }
    
    // Extract matching questions from mock questions list
    const pool = mockQuestionsDatabase.filter(q => 
      q.subject.toLowerCase() === selectedSubject.toLowerCase() || 
      (selectedSubject === "General" && Math.random() > 0.4)
    );
    
    // Shuffle pool to provide random queries on repeat prompts
    const shuffledPool = pool.sort(() => 0.5 - Math.random());
    const matchedQuestions = shuffledPool.slice(0, count);
    
    // In case pool is too small, fill with random questions from base database
    while (matchedQuestions.length < count) {
      const fallbackQ = mockQuestionsDatabase[Math.floor(Math.random() * mockQuestionsDatabase.length)];
      if (!matchedQuestions.find(mq => mq.text === fallbackQ.text)) {
        matchedQuestions.push({ ...fallbackQ });
      }
    }
    
    // Stream generating animation script
    let currentIdx = 0;
    const fullStreamText = createStreamScript(prompt, selectedSubject, selectedDifficulty, count, matchedQuestions);
    
    // Simulate streaming speed
    const streamInterval = setInterval(() => {
      if (currentIdx < fullStreamText.length) {
        aiStreamText.textContent += fullStreamText.charAt(currentIdx);
        currentIdx++;
        aiStreamText.scrollTop = aiStreamText.scrollHeight;
        
        // Progress updates
        if (currentIdx > fullStreamText.length * 0.7) {
          aiStreamStatus.textContent = "Writing final rationales...";
        } else if (currentIdx > fullStreamText.length * 0.35) {
          aiStreamStatus.textContent = "Drafting choice structures...";
        }
      } else {
        clearInterval(streamInterval);
        
        // Streaming finished: Append to state bank
        matchedQuestions.forEach(q => {
          questionsBank.push({
            ...q,
            id: `ai-${Date.now()}-${Math.floor(Math.random() * 100000)}`
          });
        });
        
        saveToStorage();
        updateBankCountElements();
        
        // Finish updates
        aiStreamStatus.textContent = "Success (Loaded)";
        showToast(`AI generated and loaded ${count} questions!`);
        
        // Enable prompt controls
        btnAiGenerate.disabled = false;
        aiPromptInput.disabled = false;
        aiPromptInput.value = "";
        
        // Fade out streaming container shortly
        setTimeout(() => {
          if (aiStreamContainer.style.display === "block") {
            aiStreamContainer.style.display = "none";
          }
        }, 8000);
      }
    }, 15);
  }

  function createStreamScript(prompt, subject, difficulty, count, questions) {
    let output = `[ENGINE INITIALIZED]\n`;
    output += `User Prompt: "${prompt}"\n`;
    output += `Determining parameters -> Subject: [${subject}] | Difficulty: [${difficulty}] | Count: ${count}\n`;
    output += `Scanning curriculum guidelines databank...\n`;
    output += `Formatting high-density pedagogy templates...\n`;
    output += `====================================================\n\n`;
    
    questions.forEach((q, i) => {
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
    output += `Injecting generated question array into client Question Bank storage.`;
    return output;
  }

  // --- Bank Counts & Badges Sync ---
  function updateBankCountElements() {
    const total = questionsBank.length;
    
    if (total > 0) {
      bankCountBadge.textContent = total;
      bankCountBadge.style.display = "inline-flex";
    } else {
      bankCountBadge.style.display = "none";
    }
    
    quickCountVal.textContent = `${total} question${total === 1 ? "" : "s"}`;
  }

  // --- PAGE 2: Dynamic Bank List Views & Drag/Re-order logic ---
  function populateSubjectFilterDropdown() {
    // Get unique subjects present in the bank list
    const subjects = [...new Set(questionsBank.map(q => q.subject))].filter(s => s);
    
    // Clear dynamic options
    filterSubject.innerHTML = '<option value="">All Subjects</option>';
    
    subjects.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      filterSubject.appendChild(opt);
    });
  }

  function renderBankListViews() {
    renderBankCardsSidebar();
    renderPaperQuestions();
  }

  function renderBankCardsSidebar() {
    bankCardsListContainer.innerHTML = "";
    
    const query = bankSearch.value.toLowerCase().trim();
    const selSub = filterSubject.value;
    const selDiff = filterDifficulty.value;
    
    // Filters logic
    const filteredList = questionsBank.filter(q => {
      const textMatch = q.text.toLowerCase().includes(query) || q.subject.toLowerCase().includes(query) || q.topic.toLowerCase().includes(query);
      const subMatch = !selSub || q.subject === selSub;
      const diffMatch = !selDiff || q.difficulty === selDiff;
      return textMatch && subMatch && diffMatch;
    });
    
    if (filteredList.length === 0) {
      bankCardsListContainer.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; margin-bottom: 6px;">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <h3>No matching questions</h3>
          <p>Try adjusting your search query or filters.</p>
        </div>
      `;
      return;
    }
    
    filteredList.forEach((q, idx) => {
      // Find true index in complete bank array for movement modifications
      const trueIdx = questionsBank.findIndex(item => item.id === q.id);
      
      const itemCard = document.createElement("div");
      itemCard.className = "bank-item-card";
      itemCard.innerHTML = `
        <div class="bank-item-controls">
          <button type="button" class="item-control-btn btn-move-up" title="Move Up" ${trueIdx === 0 ? "disabled style='opacity:0.3; cursor:default;'" : ""}>
            <svg viewBox="0 0 24 24"><path d="M4.5 15.75l7.5-7.5 7.5 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button type="button" class="item-control-btn btn-move-down" title="Move Down" ${trueIdx === questionsBank.length - 1 ? "disabled style='opacity:0.3; cursor:default;'" : ""}>
            <svg viewBox="0 0 24 24"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button type="button" class="item-control-btn delete-btn" title="Delete Question" style="margin-top: 8px;">
            <svg viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="bank-item-details">
          <div class="bank-item-header">
            <span>Q${trueIdx + 1} &bull; ${q.subject} (${q.difficulty})</span>
            <span style="font-weight: 700; color: var(--color-primary);">${q.points} pts</span>
          </div>
          <div class="bank-item-body">${q.text}</div>
        </div>
      `;
      
      // Bind reorder/delete button events
      if (trueIdx > 0) {
        itemCard.querySelector(".btn-move-up").addEventListener("click", () => moveQuestionInBank(trueIdx, -1));
      }
      if (trueIdx < questionsBank.length - 1) {
        itemCard.querySelector(".btn-move-down").addEventListener("click", () => moveQuestionInBank(trueIdx, 1));
      }
      itemCard.querySelector(".delete-btn").addEventListener("click", () => deleteQuestionFromBank(trueIdx));
      
      bankCardsListContainer.appendChild(itemCard);
    });
  }

  function moveQuestionInBank(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= questionsBank.length) return;
    
    // Swap items in database array
    const temp = questionsBank[index];
    questionsBank[index] = questionsBank[targetIdx];
    questionsBank[targetIdx] = temp;
    
    saveToStorage();
    renderBankListViews();
  }

  function deleteQuestionFromBank(index) {
    const deletedQ = questionsBank[index];
    questionsBank.splice(index, 1);
    saveToStorage();
    
    updateBankCountElements();
    populateSubjectFilterDropdown();
    renderBankListViews();
    
    showToast("Deleted question from bank", "warning");
  }

  // --- Dynamic Exam Paper Layout Sheet Rendering ---
  function renderPaperQuestions() {
    paperQuestionsRender.innerHTML = "";
    const showAnswers = paperShowAnswersKey.checked;
    
    if (questionsBank.length === 0) {
      paperQuestionsRender.innerHTML = `
        <div style="text-align: center; color: #777; padding: 100px 20px; font-style: italic; border: 2px dashed #ccc; border-radius: 4px; background-color: #fafafa;">
          No questions added to the exam sheet yet. 
          Please use the Question Builder view to generate or create some questions!
        </div>
      `;
      return;
    }
    
    questionsBank.forEach((q, idx) => {
      const qBlock = document.createElement("article");
      qBlock.className = "paper-question";
      
      qBlock.innerHTML = `
        <div class="paper-question-header">
          <span class="paper-question-text">
            <strong>${idx + 1}.</strong> ${q.text}
          </span>
          <span class="paper-question-points">[${q.points} Point${q.points === 1 ? "" : "s"}]</span>
        </div>
      `;
      
      // Render options list for types containing choices
      if (q.type === "multiple-choice" || q.type === "true-false") {
        const oList = document.createElement("ul");
        oList.className = "paper-options-list";
        
        q.options.forEach((opt, optIdx) => {
          const marker = String.fromCharCode(65 + optIdx);
          const isCorrect = q.answer === optIdx;
          
          const li = document.createElement("li");
          li.className = "paper-option";
          
          // If answer key mode is on, highlight the text marker
          if (showAnswers && isCorrect) {
            li.innerHTML = `
              <span class="paper-option-marker" style="color: var(--color-success); font-weight:900;">✓ [${marker}]</span>
              <span style="font-weight: 700; color: var(--color-success);">${opt}</span>
            `;
          } else {
            li.innerHTML = `
              <span class="paper-option-marker">${marker}.</span>
              <span>${opt}</span>
            `;
          }
          oList.appendChild(li);
        });
        qBlock.appendChild(oList);
      } else if (q.type === "short-answer") {
        // Draw physical hand-writing notebook lined grids
        const lines = document.createElement("div");
        lines.className = "paper-writing-lines";
        qBlock.appendChild(lines);
      } else if (q.type === "fill-in-the-blank") {
        const line = document.createElement("div");
        line.style.margin = "12px 0 6px 20px";
        line.style.fontSize = "14px";
        line.style.color = "#777";
        line.innerHTML = "Answer: __________________________________________________";
        qBlock.appendChild(line);
      }
      
      // Render answer rationale details block under question block if key enabled
      if (showAnswers) {
        const keyBlock = document.createElement("div");
        keyBlock.className = "paper-answer-box";
        
        let correctValueStr = "";
        if (q.type === "multiple-choice" || q.type === "true-false") {
          correctValueStr = `Option ${String.fromCharCode(65 + q.answer)} (${q.options[q.answer]})`;
        } else {
          correctValueStr = q.answer;
        }
        
        keyBlock.innerHTML = `
          <div><span class="paper-answer-label">Correct Answer:</span> ${correctValueStr}</div>
          ${q.explanation ? `<div><span class="paper-explanation-label">Pedagogy Rationale & Explanation:</span> ${q.explanation}</div>` : ""}
        `;
        qBlock.appendChild(keyBlock);
      }
      
      paperQuestionsRender.appendChild(qBlock);
    });
  }

  // --- Markdown Compiler & Clipboard Copy ---
  function handleExportMarkdown() {
    if (questionsBank.length === 0) {
      showToast("Cannot export empty question bank", "error");
      return;
    }
    
    const titleVal = paperTitle.value.toUpperCase();
    const instVal = paperInstructions.value;
    const dateVal = paperDate.value;
    const classVal = paperClass.value;
    const teacherVal = paperInstructor.value;
    
    let md = `# ${titleVal}\n\n`;
    md += `**Date:** ${dateVal}  \n`;
    md += `**Class / Section:** ${classVal}  \n`;
    md += `**Instructor:** ${teacherVal}  \n`;
    md += `**Student Name:** ___________________________________\n\n`;
    md += `---\n\n`;
    md += `**INSTRUCTIONS:** *${instVal}*\n\n`;
    md += `---\n\n`;
    
    questionsBank.forEach((q, idx) => {
      md += `### Question ${idx + 1} (${q.points} Points)\n`;
      md += `${q.text}\n\n`;
      
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
        md += `*Rationale:* ${q.explanation}  \n`;
      }
      md += `\n`;
    });
    
    // Modern direct writing clipboard API
    navigator.clipboard.writeText(md)
      .then(() => {
        showToast("Markdown compiled & copied to clipboard!");
      })
      .catch((err) => {
        console.error("Clipboard copy error:", err);
        // Fallback: prompt alert window showing text to copy
        alert("Exam Markdown generated! Please copy the text below:\n\n" + md);
      });
  }
  
});
