import React from 'react';

function Sidebar({ activeView, setActiveView, questionsBank, apiKey, theme, setTheme }) {
  const bankCount = questionsBank.length;

  return (
    <aside id="app-sidebar">
      {/* Brand Header */}
      <div className="brand-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginBottom: '32px' }}>
        <img 
          src="https://klust.edu.my/wp-content/uploads/2025/07/logo-klust.png" 
          alt="KLUST Logo" 
          className="klust-logo-img" 
        />
        <span className="brand-name" style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.8, color: 'var(--text-secondary)' }}>Assessment Architect</span>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flexGrow: 1 }}>
        <ul className="nav-menu">
          <li className={`nav-item ${activeView === 'builder' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveView('builder')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Question Builder</span>
            </button>
          </li>
          
          <li className={`nav-item ${activeView === 'fast' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveView('fast')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>FAST AI</span>
            </button>
          </li>

          <li className={`nav-item ${activeView === 'faster' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveView('faster')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4m0-4h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>FASTer AI</span>
            </button>
          </li>

          <li className={`nav-item ${activeView === 'slower' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveView('slower')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>SLOWer AI</span>
            </button>
          </li>

          <li className={`nav-item ${activeView === 'bank' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveView('bank')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 21v-8H7v8M7 3v5h8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Exam Paper</span>
              {bankCount > 0 && (
                <span className="ai-badge" style={{ marginLeft: 'auto', display: 'inline-flex' }}>
                  {bankCount}
                </span>
              )}
            </button>
          </li>
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Theme Switcher */}
        <div className="theme-toggle-container">
          <button
            type="button"
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Light</span>
          </button>
          <button
            type="button"
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Dark</span>
          </button>
        </div>
        
        {/* User Profile Info */}
        <div className="user-profile">
          <div className="user-avatar">RH</div>
          <div className="user-details">
            <span className="user-name">Rizal Husin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
