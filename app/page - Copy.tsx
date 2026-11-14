"use client";

export default function Home() {
  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <header className="bar">
        <div>
          <strong>Tishk International University</strong>
          <span className="meta sub">Office of Institutional Research</span>
          <button
            className="tg hit"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <svg
              className="sun"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
            </svg>
            <svg
              className="moon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
            </svg>
          </button>
        </div>
      </header>

      <main>
        <section id="s1">
          <div id="intro">
            <div className="wrap hero">
              <div className="logo-tile">
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 600,
                    color: "#781040",
                  }}
                >
                  T
                </span>
              </div>
              <p className="meta eyebrow">Student Experience Survey 2026</p>
              <h1 className="display">
                Your voice shapes what TIU does next.
              </h1>
              <p className="lede">
                Two quick questions about you, then eight about your
                experience. Anonymous, one tap each, about 2 minutes, and it
                goes straight to the people planning next year.
              </p>
              <ul className="facts">
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  8 questions
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  About 2 minutes
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Anonymous
                </li>
              </ul>
              <button className="btn solid start">Start survey</button>
            </div>
            <div className="wrap">
              <p className="note">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 1l4 1.5v3.2c0 2.3-1.7 4-4 5.3-2.3-1.3-4-3-4-5.3V2.5z" />
                </svg>
                <span>
                  Your responses are anonymous. We do not record your name,
                  email address or student ID. Your faculty and grade are only
                  used to group results, and results are only reported for
                  groups of ten or more.
                </span>
              </p>
            </div>
          </div>
          <footer>
            <div className="wrap">
              <span>© 2026 Tishk International University</span>
              <a href="#" className="hit">
                Privacy
              </a>
            </div>
          </footer>
        </section>
      </main>
    </>
  );
}