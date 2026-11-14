"use client";

import { submitSurvey } from "./actions";
import { useEffect, useRef, useState } from "react";

const Q: [string, string[]][] = [
  ["Which faculty are you in?", ["Engineering", "Dentistry", "Pharmacy", "Nursing", "Applied Science", "Law", "Education", "Administrative Science", "Economics"]],
  ["Which grade are you in?", ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"]],
  ["How would you rate your overall experience at the university?", ["Excellent", "Good", "Fair", "Poor"]],
  ["How effective are your instructors at helping you learn?", ["Very effective", "Mostly effective", "Somewhat effective", "Not effective"]],
  ["How satisfied are you with the quality and availability of the university's student resting areas?", ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"]],
  ["How well has your course developed the knowledge and skills you think you will need for your future?", ["Very well", "Well", "To some extent", "Not very well", "Not at all"]],
  ["How reliable are the university's digital learning tools?", ["Always reliable", "Mostly reliable", "Often unreliable", "Rarely work"]],
  ["Which university facility or resource most urgently needs improvement?", ["Laboratories and equipment", "Library and research resources", "Classrooms and lecture halls", "Internet and Wi-Fi", "Computers and software", "Online learning platforms", "Study spaces", "Restrooms and common areas", "Other (please specify)"]],
  ["Would you prefer to spend time on campus after your lectures have finished?", ["Definitely yes", "Probably yes", "Not sure", "Probably not", "Definitely not"]],
  ["Would you recommend this university to a prospective student?", ["Definitely", "Probably", "Probably not", "Definitely not"]],
];

const CH = ["About you", "About you", "Overall", "Teaching and learning", "Teaching and learning", "Teaching and learning", "Facilities and resources", "Facilities and resources", "Support", "Recommendation"];

const OT = new Set([7]);
const G5 = new Set([0, 1, 2, 5]);
const P = 2;
const WHY = ["Only used to group results, never to identify you.", "Choose the year you're studying now."];

const IC = [
  '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
];

const SEC: { name: string; start: number; end: number }[] = [];
CH.forEach((name, k) => {
  const last = SEC[SEC.length - 1];
  if (last && last.name === name) last.end = k + 1;
  else SEC.push({ name, start: k, end: k + 1 });
});

type Toast = { key: number; header: string; body: string } | null;

export default function Home() {
  const [view, setView] = useState<"intro" | "survey" | "confirmation" | "already">("intro");
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Q.map(() => null));
  const [otherText, setOtherText] = useState<string[]>(Q.map(() => ""));
  const [elapsed, setElapsed] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const t0Ref = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("survey_submitted") === "1") {
      setView("already");
    }
  }, []);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownToastsRef = useRef<Set<number>>(new Set());
  const prevIRef = useRef(0);
  const raysDoneRef = useRef(false);

  const clearAutoTimer = () => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  };

  const showToast = (key: number, header: string, body: string) => {
    if (shownToastsRef.current.has(key)) return;
    shownToastsRef.current.add(key);
    setToast({ key, header, body });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  };

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";

    const applyNow = () => {
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch {}
    };

    const docAny = document as any;
    if (!docAny.startViewTransition) {
      applyNow();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;
    const rad = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    docAny.startViewTransition(applyNow).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
        { duration: 450, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  };

  const handleStart = () => {
    t0Ref.current = Date.now();
    setView("survey");
  };

  const advance = (newIndex: number) => {
    clearAutoTimer();
    setTransitioning(true);
    setLeaving(true);
    setTimeout(() => {
      setI(newIndex);
      setLeaving(false);
      setArriving(true);
      setTimeout(() => {
        setArriving(false);
        setTransitioning(false);
      }, 200);
    }, 150);
  };

  const handlePick = (optionIndex: number) => {
    if (transitioning) return;
    const newAnswers = [...answers];
    newAnswers[i] = optionIndex;
    if (i === 0 && newAnswers[1] !== null && newAnswers[1] === 4 && !G5.has(optionIndex)) {
      newAnswers[1] = null;
    }
    if (OT.has(i) && optionIndex !== Q[i][1].length - 1) {
      const newOther = [...otherText];
      newOther[i] = "";
      setOtherText(newOther);
    }
    setAnswers(newAnswers);

    clearAutoTimer();
    const isOtherSelected = OT.has(i) && optionIndex === Q[i][1].length - 1;
    if (i < Q.length - 1 && !isOtherSelected) {
      autoTimerRef.current = setTimeout(() => {
        advance(i + 1);
      }, 350);
    }
  };

  const handleOptionClick = (optionIndex: number) => {
    if (!transitioning && answers[i] === optionIndex && i < Q.length - 1) {
      const isOtherSelected = OT.has(i) && optionIndex === Q[i][1].length - 1;
      if (!isOtherSelected) {
        clearAutoTimer();
        advance(i + 1);
      }
    }
  };

  const handleNext = async () => {
    if (transitioning || submitting) return;
    clearAutoTimer();
    if (i >= Q.length - 1) {
      let token = localStorage.getItem("participant_token");
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem("participant_token", token);
      }

      setSubmitting(true);
      setSubmitError("");
      const result = await submitSurvey({
        token,
        answers,
        otherText,
      });
      setSubmitting(false);

      if (result.ok) {
        localStorage.setItem("survey_submitted", "1");
        const secs = t0Ref.current
          ? Math.round((Date.now() - t0Ref.current) / 1000)
          : 0;
        setElapsed(secs);
        setView("confirmation");
      } else {
        if (result.duplicate) {
          localStorage.setItem("survey_submitted", "1");
        }
        setSubmitError(result.error);
      }
      return;
    }
    advance(i + 1);
  };

  const handlePrev = () => {
    if (transitioning || i === 0) return;
    clearAutoTimer();
    advance(i - 1);
  };

  const handleRestart = () => {
    clearAutoTimer();
    raysDoneRef.current = false;
    setView("intro");
    setI(0);
    prevIRef.current = 0;
    setAnswers(Q.map(() => null));
    setOtherText(Q.map(() => ""));
    setElapsed(0);
    t0Ref.current = 0;
    shownToastsRef.current = new Set();
  };

  const handleShare = async () => {
    const surveyUrl = window.location.href.split("#")[0];
    if (window.location.protocol === "file:") {
      showToast(99, "Link not shareable yet", "This works once the survey is online.");
      return;
    }
    try {
      if (navigator.share && navigator.canShare) {
        const data = {
          title: "TIU Student Experience Survey 2026",
          text: "I just took the TIU student survey — 2 minutes, anonymous. Help shape next year:",
          url: surveyUrl,
        };
        if (navigator.canShare(data)) {
          await navigator.share(data);
          return;
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(surveyUrl);
        showToast(98, "Link copied", "Paste it anywhere to share the survey.");
        return;
      }
      showToast(97, "Could not copy the link", "Please copy it from the address bar.");
    } catch (err: any) {
      if (err && err.name === "AbortError") return;
      showToast(96, "Could not share automatically", "Please copy the link from the address bar.");
    }
  };

  // Milestone toasts on forward navigation only
  useEffect(() => {
    const prev = prevIRef.current;
    prevIRef.current = i;
    if (i > prev) {
      if (i === P + 4) showToast(5, "Halfway there", "Four down, four to go.");
      if (i === P + 7) showToast(8, "Almost done", "Just one more question.");
    }
  }, [i]);

  // Ray burst when confirmation appears
  useEffect(() => {
    if (view !== "confirmation") {
      raysDoneRef.current = false;
      return;
    }
    if (raysDoneRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(() => {
      raysDoneRef.current = true;
      const check = document.getElementById("checkmark");
      if (!check) return;
      for (let n = 0; n < 24; n++) {
        const r = document.createElement("i");
        const big = n % 2 === 0;
        r.className = "ray";
        check.appendChild(r);
        const f = `rotate(${n * 15}deg) translateY(`;
        const g = `scaleY(${big ? 1.15 : 0.7})`;
        const anim = r.animate(
          [
            { transform: `${f}-34px) scaleY(.3)`, opacity: 0 },
            { transform: `${f}-${big ? 58 : 52}px) ${g}`, opacity: 1, offset: 0.45 },
            { transform: `${f}-${big ? 72 : 62}px) ${g}`, opacity: 0 },
          ],
          { duration: 1000, delay: (n % 4) * 40, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
        );
        anim.onfinish = () => r.remove();
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [view]);

  // Keyboard shortcuts 1-9
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (view !== "survey" || transitioning) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).id === "otx") return;
      const k = parseInt(e.key, 10);
      if (!isNaN(k) && k >= 1 && k <= Q[i][1].length) {
        e.preventDefault();
        handlePick(k - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view, i, transitioning, answers]);

  const question = Q[i];
  const options = i === 1 && answers[0] !== null && !G5.has(answers[0])
    ? question[1].slice(0, 4)
    : question[1];
  const isLast = i === Q.length - 1;
  const hasAnswer = answers[i] !== null;
  const isOther = OT.has(i) && answers[i] === question[1].length - 1;
  const isProfile = i < P;
  const cur = isProfile ? i + 1 : i - P + 1;
  const tot = isProfile ? P : Q.length - P;
  const u = i + (hasAnswer ? 1 : 0.4);

  return (
    <>
      <header className="bar">
        <div>
          <strong>Tishk International University</strong>
          <span className="meta sub">Office of Institutional Research</span>
          <button className="tg hit" onClick={toggleTheme} aria-label="Toggle theme">
            <svg className="sun" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
            </svg>
            <svg className="moon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
              <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
            </svg>
          </button>
        </div>
      </header>

      <main>
        {view === "intro" && (
          <section id="s1">
            <div id="intro">
              <div className="wrap hero">
                <div className="logo-tile">
                  <img src="/logo.png" alt="Tishk International University logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <p className="meta eyebrow">Student Experience Survey 2026</p>
                <h1 className="display">Your voice shapes what TIU does next.</h1>
                <p className="lede">
                  Two quick questions about you, then eight about your experience. Anonymous, one tap each, about 2 minutes, and it goes straight to the people planning next year.
                </p>
                <ul className="facts">
                  <li><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>8 questions</li>
                  <li><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>About 2 minutes</li>
                  <li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>Anonymous</li>
                </ul>
                <button className="btn solid start" onClick={handleStart}>Start survey</button>
              </div>
              <div className="wrap">
                <p className="note">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true"><path d="M6 1l4 1.5v3.2c0 2.3-1.7 4-4 5.3-2.3-1.3-4-3-4-5.3V2.5z" /></svg>
                  <span>Your responses are anonymous. We do not record your name, email address or student ID. Your faculty and grade are only used to group results, and results are only reported for groups of ten or more.</span>
                </p>
              </div>
            </div>
            <footer>
              <div className="wrap">
                <span>© 2026 Tishk International University</span>
                <a href="#" className="hit">Privacy</a>
              </div>
            </footer>
          </section>
        )}

        {view === "survey" && (
          <section id="s1">
            <div>
              <div className="pstick">
                <div className="wrap">
                  <div className="prow">
                    <span className="meta">{CH[i]}</span>
                    <span className="side">{cur} of {tot}</span>
                  </div>
                  <div className="prog" role="progressbar" aria-label={`Survey progress: step ${cur} of ${tot}`} aria-valuemin={0} aria-valuemax={tot} aria-valuenow={cur}>
                    {SEC.map((seg, k) => {
                      const fill = Math.min(1, Math.max(0, (u - seg.start) / (seg.end - seg.start)));
                      return (
                        <div key={k} className="seg" style={{ flex: seg.end - seg.start }}>
                          <i style={{ transform: `scaleX(${fill})` }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="wrap flowbody">
                <div className={`card ${isProfile ? `profile p${i}` : ""} ${leaving ? "leaving" : ""} ${arriving ? "arriving" : ""}`} id="qcard" role="radiogroup" aria-labelledby="qt">
                  <span className="qicon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24">${IC[i]}</svg>` }} />
                  <h2 className="q" id="qt" tabIndex={-1}>{question[0]}</h2>
                  {WHY[i] && <p className="why">{WHY[i]}</p>}
                  <div className="opts">
                    {options.map((opt, k) => (
                      <label key={k} className="opt" onClick={() => handleOptionClick(k)}>
                        <input type="radio" name="q" checked={answers[i] === k} onChange={() => handlePick(k)} />
                        <span className="dot" />
                        <span>{opt}</span>
                        <kbd className="k" aria-hidden="true">{k + 1}</kbd>
                      </label>
                    ))}
                  </div>
                  {isOther && (
                    <div className="other">
                      <input
                        type="text"
                        id="otx"
                        maxLength={200}
                        placeholder="Please specify (optional, no names)"
                        value={otherText[i] || ""}
                        onChange={(e) => {
                          const newOther = [...otherText];
                          newOther[i] = e.target.value;
                          setOtherText(newOther);
                        }}
                      />
                    </div>
                  )}
              </div>

                {submitError && (
                  <p
                    style={{
                      color: "#B00020",
                      background: "rgba(176,0,32,.06)",
                      border: "1px solid rgba(176,0,32,.25)",
                      borderRadius: 8,
                      padding: "12px 16px",
                      marginBottom: 16,
                      fontSize: 14,
                      lineHeight: 1.4,
                    }}
                  >
                    {submitError}
                  </p>
                )}

              <div className="qnav">
                <button className="btn back" onClick={handlePrev} disabled={i === 0}>Previous</button>
                               <button
                  className="btn solid"
                  onClick={handleNext}
                  disabled={!hasAnswer || submitting}
                  style={{ display: isLast || isOther ? "" : "none" }}
                >
                  {submitting ? "Submitting..." : isLast ? "Submit responses" : "Continue"}
                </button>
              </div>
              </div>
            </div>
          </section>
        )}
        {view === "already" && (
          <section id="s2">
            <div className="wrap center">
              <div className="check">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <h1 className="title" tabIndex={-1}>You have already participated.</h1>
              <p>Each student can submit this survey once. Thank you for taking part — your response is already recorded.</p>
            </div>
          </section>
        )}
        {view === "confirmation" && (
          <section id="s2">
            <div className="wrap center">
              <div className="check" id="checkmark">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 10.5l3.5 3.5L15 6.5" />
                </svg>
              </div>
              <h1 className="title" tabIndex={-1}>That's everything. Thank you.</h1>
              <p>Your response has been recorded. It's anonymous, and it goes straight to the team planning next year at Tishk International University.</p>
              {elapsed > 0 && (
                <p className="took">You finished in {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}.</p>
              )}
              <button className="btn solid" type="button" onClick={handleShare} aria-label="Share this survey" style={{ display: "flex", width: "fit-content", margin: "32px auto 0", gap: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share this survey
              </button>
              <button className="link" onClick={handleRestart}>Back to survey home</button>
            </div>
          </section>
        )}
      </main>

      {toast && (
        <div className="toast on" role="status">
          <span className="ti">
            <span style={{ fontSize: 20, fontWeight: 600, color: "#781040" }}>T</span>
          </span>
          <span className="tx">
            <b>{toast.header}</b>
            <span>{toast.body}</span>
          </span>
        </div>
      )}
    </>
  );
}