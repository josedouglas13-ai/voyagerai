import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ⚙️ Configure com suas credenciais do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://SEU_PROJETO.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "SUA_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────
// Hook de autenticação — use em qualquer componente
// ─────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pega sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
}

// ─────────────────────────────────────────────
// Componente principal de Auth
// ─────────────────────────────────────────────
export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSuccess("Conta criada! Verifique seu email para confirmar.");

      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess?.(data.user);

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess("Link de recuperação enviado para seu email!");
      }
    } catch (err) {
      const msgs = {
        "Invalid login credentials": "Email ou senha incorretos.",
        "User already registered": "Este email já está cadastrado.",
        "Password should be at least 6 characters": "Senha deve ter pelo menos 6 caracteres.",
        "Email not confirmed": "Confirme seu email antes de entrar.",
      };
      setError(msgs[err.message] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* Background decorativo */}
      <div style={s.bgOrb1} />
      <div style={s.bgOrb2} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          ✈ VOYAGER<span style={{ color: "#C8A96E" }}>AI</span>
        </div>
        <p style={s.logoSub}>Consultoria Estratégica de Viagens</p>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
          >
            Entrar
          </button>
          <button
            style={{ ...s.tab, ...(mode === "signup" ? s.tabActive : {}) }}
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
          >
            Criar Conta
          </button>
        </div>

        {/* Form */}
        <div style={s.form}>
          {mode === "signup" && (
            <div style={s.field}>
              <label style={s.label}>Nome completo</label>
              <input
                style={s.input}
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {mode !== "forgot" && (
            <div style={s.field}>
              <label style={s.label}>Senha</label>
              <input
                style={s.input}
                type="password"
                placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          )}

          {mode === "login" && (
            <button
              style={s.forgotLink}
              onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
            >
              Esqueci minha senha
            </button>
          )}

          {error && (
            <div style={s.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={s.successBox}>
              ✅ {success}
            </div>
          )}

          <button
            style={{ ...s.submitBtn, ...(loading ? s.submitBtnLoading : {}) }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span style={s.spinner} />
            ) : mode === "login" ? "Entrar →" : mode === "signup" ? "Criar Conta →" : "Enviar Link →"}
          </button>

          {mode !== "forgot" && (
            <>
              <div style={s.divider}>
                <span style={s.dividerLine} />
                <span style={s.dividerText}>ou continue com</span>
                <span style={s.dividerLine} />
              </div>

              <button style={s.googleBtn} onClick={handleGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
                </svg>
                Continuar com Google
              </button>
            </>
          )}

          {mode === "forgot" && (
            <button
              style={s.backLink}
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            >
              ← Voltar para o login
            </button>
          )}
        </div>

        <p style={s.terms}>
          Ao continuar, você concorda com os{" "}
          <span style={{ color: "#C8A96E", cursor: "pointer" }}>Termos de Uso</span> e{" "}
          <span style={{ color: "#C8A96E", cursor: "pointer" }}>Política de Privacidade</span>
        </p>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input::placeholder { color: #3A3A5A; }
  input:focus { outline: none; border-color: #C8A96E !important; box-shadow: 0 0 0 3px rgba(200,169,110,0.1); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,15px) scale(0.95)} }
  @keyframes spin { to{transform:rotate(360deg)} }
`;

const s = {
  root: {
    minHeight: "100vh",
    background: "#080810",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: 20,
  },
  bgOrb1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(200,169,110,0.07) 0%, transparent 70%)",
    top: -100,
    right: -100,
    animation: "orbFloat 12s ease-in-out infinite",
    pointerEvents: "none",
  },
  bgOrb2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,105,20,0.05) 0%, transparent 70%)",
    bottom: -80,
    left: -80,
    animation: "orbFloat 16s ease-in-out infinite reverse",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "linear-gradient(145deg, #0F0F1E, #0C0C18)",
    border: "1px solid #1E1E30",
    borderRadius: 24,
    padding: "40px 36px",
    boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,169,110,0.05)",
    animation: "fadeUp 0.5s ease",
    position: "relative",
    zIndex: 1,
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32,
    fontWeight: 700,
    color: "#F0E8D0",
    letterSpacing: "0.15em",
    textAlign: "center",
    marginBottom: 4,
  },
  logoSub: {
    fontSize: 11,
    color: "#4A4A6A",
    textAlign: "center",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 32,
  },
  tabs: {
    display: "flex",
    background: "#0A0A14",
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
    border: "1px solid #1A1A28",
  },
  tab: {
    flex: 1,
    padding: "10px",
    background: "transparent",
    border: "none",
    borderRadius: 9,
    color: "#4A4A6A",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "linear-gradient(135deg, #1A1A2A, #1E1E30)",
    color: "#C8A96E",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6A6A8A",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  input: {
    padding: "13px 16px",
    background: "#0A0A16",
    border: "1px solid #1A1A2C",
    borderRadius: 10,
    color: "#E8E8F0",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  forgotLink: {
    background: "none",
    border: "none",
    color: "#4A4A6A",
    fontSize: 12,
    cursor: "pointer",
    textAlign: "right",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: -8,
    padding: 0,
  },
  errorBox: {
    padding: "12px 14px",
    background: "rgba(180,50,50,0.12)",
    border: "1px solid rgba(180,50,50,0.3)",
    borderRadius: 10,
    color: "#E08080",
    fontSize: 13,
  },
  successBox: {
    padding: "12px 14px",
    background: "rgba(50,150,80,0.12)",
    border: "1px solid rgba(50,150,80,0.3)",
    borderRadius: 10,
    color: "#80C890",
    fontSize: 13,
  },
  submitBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #8B6914, #C8A96E)",
    border: "none",
    borderRadius: 12,
    color: "#080810",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.05em",
    transition: "opacity 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: 4,
  },
  submitBtnLoading: { opacity: 0.7, cursor: "not-allowed" },
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid rgba(8,8,16,0.3)",
    borderTopColor: "#080810",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "4px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#1A1A2A",
  },
  dividerText: {
    fontSize: 11,
    color: "#3A3A5A",
    whiteSpace: "nowrap",
    letterSpacing: "0.05em",
  },
  googleBtn: {
    padding: "13px",
    background: "#0A0A16",
    border: "1px solid #1E1E30",
    borderRadius: 12,
    color: "#C8C8D8",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "border-color 0.2s",
  },
  backLink: {
    background: "none",
    border: "none",
    color: "#6A6A8A",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
    padding: "8px 0",
  },
  terms: {
    fontSize: 11,
    color: "#3A3A5A",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 1.6,
  },
};
