import { BrowserRouter, Route, Routes, useSearchParams } from "react-router";
import { Chess } from 'chess.js';
import ChessPage from "./ChessPage";
import Home from "./Home";
import { useState, useEffect } from "react";
import botImage from "./assets/bot_image.png";

function AuthGate({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(() => {
    return searchParams.get("token") || localStorage.getItem("chess_access_token");
  });
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  const verifyToken = async (tokenToVerify: string | null) => {
    if (!tokenToVerify) {
      setIsVerifying(false);
      setIsValid(false);
      return;
    }

    // En dev local, on autorise directement
    if (import.meta.env.DEV) {
      setIsValid(true);
      setIsVerifying(false);
      localStorage.setItem("chess_access_token", tokenToVerify);
      return;
    }

    try {
      setIsVerifying(true);
      const res = await fetch(`/api/verify-token?token=${encodeURIComponent(tokenToVerify)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setIsValid(true);
        setErrorMsg(null);
        setRemainingTime(data.remaining_seconds);
        localStorage.setItem("chess_access_token", tokenToVerify);
      } else {
        setIsValid(false);
        setErrorMsg(data.detail || "Invalid or expired token.");
        localStorage.removeItem("chess_access_token");
      }
    } catch {
      setErrorMsg("Unable to verify token with the server.");
      setIsValid(false);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    } else {
      verifyToken(token);
    }
  }, [searchParams]);

  if (isVerifying) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", color: "var(--text-h)" }}>
        <img src={botImage} alt="AI Chess Coach" style={{ width: 64, height: 80, marginBottom: 16 }} />
        <p>Verifying access session...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div style={{
        maxWidth: 500,
        margin: "80px auto",
        padding: 30,
        backgroundColor: "#20222a",
        border: "1px solid var(--border)",
        borderRadius: 12,
        color: "var(--text-h)",
        textAlign: "center"
      }}>
        <img src={botImage} alt="AI Chess Coach" style={{ width: 64, height: 80, marginBottom: 16 }} />
        <h2 style={{ marginBottom: 12 }}>Access Restricted</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 20 }}>
          This application runs on a dedicated cloud GPU. To prevent excessive compute costs, a demo access link is required.
        </p>
        {errorMsg && (
          <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{errorMsg}</p>
        )}
        <form onSubmit={(e) => { e.preventDefault(); if (manualInput.trim()) { setToken(manualInput.trim()); verifyToken(manualInput.trim()); } }}>
          <input
            type="text"
            placeholder="Paste your access token..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--text-h)",
              marginBottom: 12,
              boxSizing: "border-box"
            }}
          />
          <button type="submit" className="analyze-button" style={{ width: "100%", margin: 0 }}>
            Enter Demo
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      {remainingTime !== null && remainingTime > 0 && (
        <div style={{
          position: "fixed",
          top: 10,
          right: 15,
          zIndex: 999,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          padding: "6px 12px",
          borderRadius: 20,
          fontSize: 12,
          color: "#aaa",
          border: "1px solid #444"
        }}>
          ⏱️ Demo session active
        </div>
      )}
      {children}
    </>
  );
}

function App() {
  const [game, setGame] = useState(new Chess());

  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route path="/" element={<Home setGame={setGame} />} />
          <Route path="/board" element={<ChessPage game={game} />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}

export default App;
