import { useState } from "react";
import AuthPage, { useAuth } from "./auth";
// import TravelAISaaS from "./travel-ai-saas"; // descomente quando integrar

// ─────────────────────────────────────────────
// App principal — gerencia auth + rotas
// ─────────────────────────────────────────────
export default function App() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthPage onAuthSuccess={() => {}} />;
  return <Dashboard user={user} onSignOut={signOut} />;
}

// ─────────────────────────────────────────────
// Dashboard do usuário autenticado
// ─────────────────────────────────────────────
function Dashboard({ user, onSignOut }) {
  const [view, setView] = useState("home"); // home | newPlan

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          ✈ VOYAGER<span style={{ color: "#C8A96E" }}>AI</span>
        </div>

        <nav style={s.nav}>
          {[
            { id: "home", icon: "🏠", label: "Início" },
            { id: "newPlan", icon: "✈️", label: "Novo Plano" },
            { id: "history", icon: "📋", label: "Meus Planos" },
            { id: "account", icon: "👤", label: "Minha Conta" },
          ].map((item) => (
            <button
              key={item.id}
              style={{ ...s.navItem, ...(view === item.id ? s.navItemActive : {}) }}
              onClick={() => setView(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.userInfo}>
            <div style={s.userAvatar}>
              {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={s.userName}>
                {user.user_metadata?.full_name || "Viajante"}
              </div>
              <div style={s.userEmail}>{user.email}</div>
            </div>
          </div>
          <button style={s.signOutBtn} onClick={onSignOut}>
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={s.main}>
        {view === "home" && <HomeView user={user} setView={setView} />}
        {view === "newPlan" && <NewPlanView />}
        {view === "history" && <HistoryView />}
        {view === "account" && <AccountView user={user} />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// Views
// ─────────────────────────────────────────────
function HomeView({ user, setView }) {
  const name = user.user_metadata?.full_name?.split(" ")[0] || "Viajante";
  return (
    <div style={s.view}>
      <div style={s.welcomeHero}>
        <div style={s.welcomeOrb} />
        <h1 style={s.welcomeTitle}>
          Olá, {name} ✈️
        </h1>
        <p style={s.welcomeText}>
          Pronto para planejar sua próxima aventura? Nossa IA cria roteiros personalizados em minutos.
        </p>
        <button style={s.ctaBtn} onClick={() => setView("newPlan")}>
          Criar Novo Plano →
        </button>
      </div>

      <div style={s.statsGrid}>
        {[
          { icon: "🗺️", label: "Planos Gerados", value: "0" },
          { icon: "🌍", label: "Países Visitados", value: "0" },
          { icon: "✈️", label: "KM Planejados", value: "0" },
        ].map((stat) => (
          <div key={stat.label} style={s.statCard}>
            <span style={{ fontSize: 28 }}>{stat.icon}</span>
            <span style={s.statValue}>{stat.value}</span>
            <span style={s.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewPlanView() {
  return (
    <div style={s.view}>
      <h2 style={s.viewTitle}>Novo Plano de Viagem</h2>
      <div style={s.placeholder}>
        {/* 
          ✅ INTEGRAÇÃO: Importe e use o componente TravelAISaaS aqui
          import TravelAISaaS from "./travel-ai-saas";
          <TravelAISaaS userId={user.id} />
        */}
        <div style={s.integrationNote}>
          <span style={{ fontSize: 40 }}>✈️</span>
          <p style={{ color: "#C8A96E", fontSize: 18, fontWeight: 600, marginTop: 16 }}>
            Formulário de Viagem
          </p>
          <p style={{ color: "#4A4A6A", fontSize: 14, marginTop: 8 }}>
            Integre o componente <code style={{ color: "#C8A96E" }}>TravelAISaaS</code> aqui
          </p>
        </div>
      </div>
    </div>
  );
}

function HistoryView() {
  return (
    <div style={s.view}>
      <h2 style={s.viewTitle}>Meus Planos</h2>
      <div style={s.emptyState}>
        <span style={{ fontSize: 48 }}>📋</span>
        <p style={{ color: "#4A4A6A", marginTop: 16 }}>Nenhum plano gerado ainda.</p>
        <p style={{ color: "#3A3A5A", fontSize: 13, marginTop: 8 }}>
          Seus planos de viagem aparecerão aqui após a geração.
        </p>
      </div>
    </div>
  );
}

function AccountView({ user }) {
  return (
    <div style={s.view}>
      <h2 style={s.viewTitle}>Minha Conta</h2>
      <div style={s.accountCard}>
        <div style={s.accountAvatar}>
          {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
        </div>
        <div style={s.accountInfo}>
          <div style={s.accountName}>
            {user.user_metadata?.full_name || "Usuário"}
          </div>
          <div style={s.accountEmail}>{user.email}</div>
          <div style={s.accountMeta}>
            Membro desde {new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "2px solid #1A1A2A", borderTopColor: "#C8A96E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#4A4A6A", fontSize: 13, letterSpacing: "0.1em" }}>CARREGANDO...</p>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080810; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes orbFloat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
`;

const s = {
  root: {
    minHeight: "100vh",
    background: "#080810",
    display: "flex",
    fontFamily: "'DM Sans', sans-serif",
    color: "#E8E8F0",
  },
  sidebar: {
    width: 240,
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0C0C18, #0A0A14)",
    borderRight: "1px solid #1A1A28",
    display: "flex",
    flexDirection: "column",
    padding: "28px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  sidebarLogo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#F0E8D0",
    letterSpacing: "0.12em",
    padding: "0 24px 28px",
    borderBottom: "1px solid #1A1A28",
    marginBottom: 16,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0 12px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 16px",
    background: "transparent",
    border: "none",
    borderRadius: 10,
    color: "#4A4A6A",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
    textAlign: "left",
  },
  navItemActive: {
    background: "rgba(200,169,110,0.1)",
    color: "#C8A96E",
  },
  sidebarFooter: {
    padding: "20px 16px 0",
    borderTop: "1px solid #1A1A28",
    marginTop: 16,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8B6914, #C8A96E)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#080810",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: "#C8C8D8" },
  userEmail: { fontSize: 11, color: "#4A4A6A", marginTop: 1 },
  signOutBtn: {
    width: "100%",
    padding: "9px",
    background: "transparent",
    border: "1px solid #1A1A28",
    borderRadius: 8,
    color: "#4A4A6A",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  main: {
    flex: 1,
    overflowY: "auto",
    padding: "40px",
  },
  view: { animation: "fadeUp 0.4s ease", maxWidth: 800 },
  viewTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32,
    color: "#E8D5A3",
    marginBottom: 28,
  },
  welcomeHero: {
    position: "relative",
    background: "linear-gradient(145deg, #0F0F1E, #12121F)",
    border: "1px solid #1E1E30",
    borderRadius: 20,
    padding: "40px",
    marginBottom: 24,
    overflow: "hidden",
  },
  welcomeOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)",
    right: -50,
    top: -50,
    animation: "orbFloat 6s ease-in-out infinite",
  },
  welcomeTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 36,
    color: "#E8D5A3",
    marginBottom: 12,
    position: "relative",
  },
  welcomeText: {
    color: "#6A6A8A",
    fontSize: 15,
    lineHeight: 1.6,
    maxWidth: 480,
    marginBottom: 28,
    position: "relative",
  },
  ctaBtn: {
    padding: "13px 28px",
    background: "linear-gradient(135deg, #8B6914, #C8A96E)",
    border: "none",
    borderRadius: 10,
    color: "#080810",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.04em",
    position: "relative",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  statCard: {
    background: "linear-gradient(145deg, #0F0F1E, #0C0C18)",
    border: "1px solid #1A1A28",
    borderRadius: 16,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    textAlign: "center",
  },
  statValue: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32,
    color: "#C8A96E",
    fontWeight: 700,
  },
  statLabel: { fontSize: 12, color: "#4A4A6A", letterSpacing: "0.05em" },
  placeholder: {
    background: "#0F0F1E",
    border: "1px dashed #2A2A3A",
    borderRadius: 16,
    minHeight: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  integrationNote: {
    textAlign: "center",
    padding: 40,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 40px",
    background: "#0F0F1E",
    border: "1px solid #1A1A28",
    borderRadius: 16,
  },
  accountCard: {
    background: "#0F0F1E",
    border: "1px solid #1A1A28",
    borderRadius: 16,
    padding: 28,
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  accountAvatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8B6914, #C8A96E)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#080810",
    fontWeight: 700,
    fontSize: 24,
    flexShrink: 0,
  },
  accountInfo: { display: "flex", flexDirection: "column", gap: 4 },
  accountName: { fontSize: 18, fontWeight: 600, color: "#E8D5A3" },
  accountEmail: { fontSize: 14, color: "#6A6A8A" },
  accountMeta: { fontSize: 12, color: "#3A3A5A", marginTop: 4 },
};
