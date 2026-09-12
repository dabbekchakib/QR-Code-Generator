"use client";

/**
 * Last-resort error boundary: catches errors thrown inside the root layout.
 * Renders a full HTML document (no stack traces, no secrets).
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr" dir="ltr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0B1120",
          color: "#F8FAFC",
        }}
      >
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: "#94A3B8", marginTop: "0.5rem" }}>
            Quelque chose s&apos;est mal passé. Rechargez la page pour continuer.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #334155",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}