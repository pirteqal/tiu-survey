"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

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

type AnswerRow = {
  id: string;
  answers: { answers: (number | null)[]; other: string[] };
  submitted_at: string;
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [responses, setResponses] = useState<AnswerRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [clientTime, setClientTime] = useState<Date | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setClientTime(new Date());
    const interval = setInterval(() => setClientTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  const fetchResponses = async () => {
    setFetching(true);
    setFetchError("");
    const { data, error } = await supabase
      .from("survey_responses")
      .select("id, answers, submitted_at")
      .order("submitted_at", { ascending: false });

    setFetching(false);
    if (error) {
      setFetchError("Could not load responses: " + error.message);
      return;
    }
    setResponses((data as AnswerRow[]) || []);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    if (!session) return;
    fetchResponses();
    const interval = setInterval(fetchResponses, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSigningIn(false);
    if (error) {
      setLoginError("Incorrect email or password.");
      return;
    }
    setEmail("");
    setPassword("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setResponses([]);
  };

  // ---- Computed stats from real data ----
  const stats = useMemo(() => {
    if (!clientTime) {
      return {
        total: responses.length,
        today: 0,
        yesterday: 0,
        last7: 0,
        avgPerDay: 0,
      };
    }
    const now = clientTime;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const sevenDaysAgo = startOfToday - 6 * 86400000;
    let today = 0;
    let yesterday = 0;
    let last7 = 0;
    responses.forEach((r) => {
      const t = new Date(r.submitted_at).getTime();
      if (t >= startOfToday) today++;
      else if (t >= startOfYesterday) yesterday++;
      if (t >= sevenDaysAgo) last7++;
    });

    return {
      total: responses.length,
      today,
      yesterday,
      last7,
      avgPerDay: Math.round((last7 / 7) * 10) / 10,
    };
  }, [responses, clientTime]);

  const chartData = useMemo(() => {
    const counts = new Array(30).fill(0);
    if (!clientTime) return counts;
    const now = clientTime;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    responses.forEach((r) => {
      const t = new Date(r.submitted_at).getTime();
      const diffDays = Math.floor((startOfToday - t) / 86400000);
      if (diffDays >= 0 && diffDays < 30) counts[29 - diffDays]++;
    });
    return counts;
  }, [responses, clientTime]);

  const breakdowns = useMemo(() => {
    return Q.map(([_, options], qIndex) => {
      const counts = new Array(options.length).fill(0);
      responses.forEach((r) => {
        const a = r.answers?.answers?.[qIndex];
        if (typeof a === "number" && a >= 0 && a < options.length) counts[a]++;
      });
      return { qIndex, counts, total: responses.length };
    });
  }, [responses]);

  // ---- Chart drawing ----
  useEffect(() => {
    if (!session || typeof window === "undefined") return;

    const draw = () => {
      if (!canvasRef.current || !(window as unknown as { Chart?: unknown }).Chart) return;
      const Chart = (window as unknown as { Chart: new (el: HTMLCanvasElement, cfg: unknown) => { destroy: () => void } }).Chart;

      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy();

      const cs = getComputedStyle(document.documentElement);
      const cv = (k: string) => cs.getPropertyValue("--color-" + k).trim();
      const primary = cv("primary-ink") || "#781040";
      const textSecondary = cv("text-secondary") || "#6E6E73";
      const border = cv("border") || "rgba(0,0,0,.08)";

      const labels = chartData.map((_, k) => {
        const t = new Date();
        t.setDate(t.getDate() - 29 + k);
        return t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      });

      chartRef.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [{
            data: chartData,
            borderColor: primary,
            borderWidth: 1.5,
            backgroundColor: "rgba(120,16,64,.08)",
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0.3,
          }],
        },
        options: {
          maintainAspectRatio: false,
          animation: false,
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: { display: false },
            tooltip: {
              displayColors: false,
              backgroundColor: cv("surface") || "#fff",
              titleColor: cv("text") || "#1D1D1F",
              bodyColor: textSecondary,
              borderColor: border,
              borderWidth: 1,
              cornerRadius: 6,
              padding: 8,
              callbacks: { label: (c: { parsed: { y: number } }) => c.parsed.y + " responses" },
            },
          },
          scales: {
            x: { grid: { display: false }, border: { color: border }, ticks: { color: textSecondary, font: { size: 12 }, maxTicksLimit: 6, maxRotation: 0 } },
            y: { beginAtZero: true, grid: { display: false }, border: { display: false }, ticks: { color: textSecondary, font: { size: 12 }, maxTicksLimit: 4 } },
          },
        },
      });
    };

    if ((window as unknown as { Chart?: unknown }).Chart) {
      draw();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    script.onload = draw;
    document.head.appendChild(script);
  }, [session, chartData]);

  // ---- CSV export ----
  const handleExport = () => {
    if (responses.length === 0) return;
    const headers = ["id", "submitted_at", ...Q.map(([q], i) => `Q${i + 1}: ${q}`)];
    const rows = responses.map((r) => [
      r.id,
      r.submitted_at,
      ...Q.map(([_, options], i) => {
        const a = r.answers?.answers?.[i];
        if (typeof a !== "number" || a < 0 || a >= options.length) return "";
        const label = options[a];
        if (i === 7 && a === options.length - 1) {
          const other = r.answers?.other?.[7]?.trim();
          return other ? `${label}: ${other}` : label;
        }
        return label;
      }),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tiu-survey-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <header className="bar"><div>
          <strong>Tishk International University</strong>
          <span className="meta sub">Office of Institutional Research</span>
        </div></header>
        <main>
          <div className="wrap center" style={{ paddingTop: 120 }}>
            <p className="side">Loading...</p>
          </div>
        </main>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <header className="bar"><div>
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
        </div></header>
        <main>
          <section>
            <form className="card wrap login" onSubmit={handleLogin}>
              <h1 className="title">Administrator sign-in</h1>
              <div className="group">
                <label className="vh" htmlFor="em">Email</label>
                <input id="em" type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label className="vh" htmlFor="pw">Password</label>
                <input id="pw" type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {loginError && (
                <p style={{ color: "#B00020", fontSize: 14, margin: "0 0 12px", lineHeight: 1.4 }}>{loginError}</p>
              )}
              <button className="btn solid" type="submit" disabled={signingIn}>
                {signingIn ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="bar"><div>
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
        <button className="btn ghost hit" onClick={handleLogout} style={{ marginLeft: 0 }}>Sign out</button>
      </div></header>

      <main>
        <section id="s4">
          <div className="wrap wide">
            <div className="head">
              <h1 className="title">Responses</h1>
              <span className="meta pill">
                {fetching ? "Updating…" : lastRefreshed ? "Live" : "Loading…"}
              </span>
            </div>

            {fetchError && (
              <div
                className="card"
                style={{ borderColor: "rgba(176,0,32,.3)", background: "rgba(176,0,32,.04)", marginBottom: 16, padding: 16 }}
              >
                <p style={{ color: "#B00020", fontSize: 14, margin: 0 }}>{fetchError}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <button className="btn ghost" onClick={fetchResponses} disabled={fetching}>
                {fetching ? "Refreshing…" : "Refresh"}
              </button>
              <button className="btn ghost" onClick={handleExport} disabled={responses.length === 0}>
                Export CSV ({responses.length})
              </button>
            </div>

            <div className="tiles">
              <div className="card tile">
                <p className="meta">Total responses</p>
                <b>{stats.total}</b>
                <p>{stats.total === 0 ? "Waiting for first submission" : "Recorded submissions"}</p>
              </div>
              <div className="card tile">
                <p className="meta">Today</p>
                <b>{stats.today}</b>
                <p>
                  {stats.today === stats.yesterday
                    ? "Same as yesterday"
                    : stats.today > stats.yesterday
                    ? `${stats.today - stats.yesterday} more than yesterday`
                    : `${stats.yesterday - stats.today} fewer than yesterday`}
                </p>
              </div>
              <div className="card tile">
                <p className="meta">Last 7 days</p>
                <b>{stats.last7}</b>
                <p>{stats.avgPerDay} per day on average</p>
              </div>
              <div className="card tile">
                <p className="meta">Completion</p>
                <b>100%</b>
                <p>All recorded responses are complete</p>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="ch">
                <p className="meta side">Responses per day</p>
                <p className="side">Last 30 days</p>
              </div>
              <div className="chart">
                <canvas ref={canvasRef} role="img" aria-label="Line chart of daily responses over the last 30 days" />
              </div>
            </div>

            <div className="stack">
              {breakdowns.map(({ qIndex, counts, total }) => {
                const options = Q[qIndex][1];
                const qTotal = total || 1;
                return (
                  <section key={qIndex} className="card">
                    <h2 className="sm">{Q[qIndex][0]}</h2>
                    {counts.map((v, j) => (
                      <div key={j} className="row">
                        <span>{options[j]}</span>
                        <div className="track">
                          <i style={{ width: `${Math.round((v / qTotal) * 100)}%` }} />
                        </div>
                        <b>{Math.round((v / qTotal) * 100)}%</b>
                      </div>
                    ))}
                    <table>
                      <caption className="vh">Response counts</caption>
                      <tbody>
                        {counts.map((v, j) => (
                          <tr key={j}>
                            <th scope="row">{options[j]}</th>
                            <td>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}