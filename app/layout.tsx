import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tishk International University | Student Survey",
  description:
    "Two quick questions about you, then eight about your experience at Tishk International University. Takes about 2 minutes, anonymous, goes straight to the team planning next year.",
  openGraph: {
    title: "Student Experience Survey 2026 | Tishk International University",
    description:
      "Two quick questions, then eight about your experience. Anonymous, about 2 minutes.",
    type: "website",
  },
};

const themeScript = `
  var t;
  try { t = localStorage.getItem("theme"); } catch (e) {}
  t = t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = t;
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#F5F5F7" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}