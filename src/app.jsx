import { useState, useEffect } from "react";
import AuthPage, { useAuth } from "./auth";
import TravelAISaaS from "./travel-ai-saas";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ADMIN_EMAIL = "josedouglas13@gmail.com"; // seu email de admin

// ── Renderiza markdown com tabelas e links ─────────────────────────────────
function formatPlanContent(text) {
  if (!text) return "";
  const lines = text.split("\n");
  const result = [];
  const tables = [];
  let tableRows = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    const isSep = /^\|[-:\s|]+\|$/.test(trimmed);
    const isRow = trimmed.startsWith("|") && trimmed.endsWith("|") && !isSep;
    if (isRow) {
      inTable = true;
      tableRows.push(trimmed.slice(1,-1).split("|").map(c => c.trim()));
    } else if (isSep) {
      // skip
    } else {
      if (inTable && tableRows.length > 0) {
        let html = "<table class=\"ph-table\"><thead><tr>";
        tableRows[0].forEach(c => { html += "<th>" + c + "</th>"; });
        html += "</tr></thead><tbody>";
        for (let r = 1; r < tableRows.length; r++) {
          html += "<tr>";
          tableRows[r].forEach(c => { html += "<td>" + c + "</td>"; });
          html += "</tr>";
        }
        html += "</tbody></table>";
        const ph = "TBLPH" + tables.length + "TBLEND";
        tables.push(html);
        result.push(ph);
        tableRows = []; inTable = false;
      }
      result.push(raw);
    }
  }
  if (inTable && tableRows.length > 0) {
    let html = "<table class=\"ph-table\"><thead><tr>";
    tableRows[0].forEach(c => { html += "<th>" + c + "</th>"; });
    html += "</tr></thead><tbody>";
    for (let r = 1; r < tableRows.length; r++) {
      html += "<tr>";
      tableRows[r].forEach(c => { html += "<td>" + c + "</td>"; });
      html += "</tr>";
    }
    html += "</tbody></table>";
    const ph = "TBLPH" + tables.length + "TBLEND";
    tables.push(html); result.push(ph);
  }

  let out = result.join("\n")
    .replace(/^### (.+)$/gm, "<h3 style=\"font-size:1rem;color:#F0E8D0;margin:1.2rem 0 0.4rem;font-weight:700\">$1</h3>")
    .replace(/^## (.+)$/gm,  "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:1.3rem;color:#C8A96E;margin:1.8rem 0 0.6rem;border-bottom:1px solid #2A2A3A;padding-bottom:0.3rem\">$1</h2>")
    .replace(/^# (.+)$/gm,   "<h1 style=\"font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#E8D5A3;margin:2rem 0 1rem\">$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong style=\"color:#E8D5A3\">$1</strong>")
    .replace(/\*(.+?)\*/g,   "<em style=\"color:#A8A8C8\">$1</em>")
    .replace(/^[-*] (.+)$/gm, "<li style=\"margin:0.25rem 0 0.25rem 1.2rem;color:#C8C8D8\">$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li style=\"margin:0.25rem 0 0.25rem 1.2rem;color:#C8C8D8\"><span style=\"color:#C8A96E;font-weight:700\">$1.</span> $2</li>")
    .replace(/^---+$/gm, "<hr style=\"border:none;border-top:1px solid #2A2A3A;margin:1.5rem 0\"/>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      "<a href=\"$2\" target=\"_blank\" rel=\"noopener\" style=\"color:#C8A96E;text-decoration:underline;word-break:break-all\">$1 ↗</a>")
    .replace(/(^|[\s>])(https?:\/\/[^\s<)"']+)/g,
      "$1<a href=\"$2\" target=\"_blank\" rel=\"noopener\" style=\"color:#C8A96E;text-decoration:underline;word-break:break-all\">$2 ↗</a>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");

  tables.forEach((html, idx) => {
    out = out.split("TBLPH" + idx + "TBLEND").join(html);
  });
  return out;
}

// ── Download plano como HTML ───────────────────────────────────────────────
function downloadHtml(contentHtml, titulo) {
  const css =
    "*{box-sizing:border-box;margin:0;padding:0;}" +
    "body{background:#fff;color:#111;font-family:Arial,sans-serif;font-size:11pt;line-height:1.8;padding:20mm;}" +
    "h1{font-size:20pt;color:#7A5010;margin:16pt 0 8pt;border-bottom:2px solid #C8A96E;padding-bottom:4pt;}" +
    "h2{font-size:14pt;color:#8B6914;margin:14pt 0 6pt;border-bottom:1px solid #E8D5A3;padding-bottom:3pt;}" +
    "h3{font-size:11pt;color:#222;margin:10pt 0 4pt;font-weight:bold;}" +
    "h4{font-size:10pt;color:#333;margin:8pt 0 3pt;font-weight:bold;}" +
    "li{margin:3pt 0 3pt 16pt;color:#111;}" +
    "strong{color:#5A3A00;}em{color:#333;}" +
    "a{color:#8B6914;word-break:break-all;text-decoration:underline;}" +
    ".ph-table{border-collapse:collapse;width:100%;margin:10pt 0;}" +
    ".ph-table th{padding:7pt 10pt;border:1px solid #CCC;background:#F5EDD0;color:#7A5010;font-size:9pt;font-weight:bold;text-align:left;}" +
    ".ph-table td{padding:7pt 10pt;border:1px solid #CCC;font-size:9pt;color:#111;}" +
    ".ph-table tbody tr:nth-child(even) td{background:#FAFAF7;}" +
    "hr{border:none;border-top:1px solid #CCC;margin:12pt 0;}" +
    ".header{text-align:center;padding-bottom:12pt;margin-bottom:20pt;border-bottom:2px solid #C8A96E;}" +
    "@page{margin:15mm 20mm;size:A4;}" +
    "@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}";

  const doc =
    "<!DOCTYPE html><html lang=\"pt-BR\"><head>" +
    "<meta charset=\"UTF-8\">" +
    "<title>VoyagerAI - " + titulo + "</title>" +
    "<style>" + css + "</style>" +
    "</head><body>" +
    "<div class=\"header\">" +
    "<h1>\u2708 VOYAGERAI</h1>" +
    "<p style=\"color:#555;font-size:10pt;margin-top:4pt\">Consultoria Estratégica de Viagens com IA</p>" +
    "<p style=\"color:#777;font-size:9pt;margin-top:2pt\">" + titulo + "</p>" +
    "</div>" +
    contentHtml +
    "</body></html>";

  const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "VoyagerAI-" + titulo.replace(/\s+/g, "-") + ".html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <AuthPage onAuthSuccess={() => {}} />;
  return <Dashboard user={user} onSignOut={signOut} />;
}

function Dashboard({ user, onSignOut }) {
  const [view, setView] = useState("home");
  const isAdmin = user.email === ADMIN_EMAIL;

  const navItems = [
    { id: "home", icon: "🏠", label: "Início" },
    { id: "newPlan", icon: "✈️", label: "Novo Plano" },
    { id: "history", icon: "📋", label: "Meus Planos" },
    { id: "account", icon: "👤", label: "Minha Conta" },
    ...(isAdmin ? [{ id: "admin", icon: "⚙️", label: "Admin" }] : []),
  ];

  return (
    <div style={s.root}>
      <style>{css}</style>
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          ✈ VOYAGER<span style={{ color: "#C8A96E" }}>AI</span>
        </div>
        <nav style={s.nav}>
          {navItems.map((item) => (
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
              <div style={s.userName}>{user.user_metadata?.full_name || "Viajante"}</div>
              <div style={s.userEmail}>{user.email}</div>
            </div>
          </div>
          <button style={s.signOutBtn} onClick={onSignOut}>Sair</button>
        </div>
      </aside>
      <main style={s.main}>
        {view === "home" && <HomeView user={user} setView={setView} />}
        {view === "newPlan" && <TravelAISaaS user={user} onPlanSaved={() => setView("history")} />}
        {view === "history" && <HistoryView user={user} />}
        {view === "account" && <AccountView user={user} />}
        {view === "admin" && isAdmin && <AdminView />}
      </main>
    </div>
  );
}

function HomeView({ user, setView }) {
  const [stats, setStats] = useState({ total: 0, lastPlan: null });
  const name = user.user_metadata?.full_name?.split(" ")[0] || "Viajante";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  useEffect(() => {
    supabase.from("planos").select("*", { count: "exact" }).eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1)
      .then(({ data, count }) => setStats({ total: count || 0, lastPlan: data?.[0] || null }));
  }, [user.id]);

  const destinations = [
    { city: "Paris", country: "França", emoji: "🗼", temp: "18°C", tag: "Romance" },
    { city: "Tóquio", country: "Japão", emoji: "⛩️", temp: "22°C", tag: "Cultura" },
    { city: "Cancún", country: "México", emoji: "🏖️", temp: "31°C", tag: "Praia" },
    { city: "Nova York", country: "EUA", emoji: "🗽", temp: "15°C", tag: "Urbano" },
    { city: "Lisboa", country: "Portugal", emoji: "🎭", temp: "20°C", tag: "História" },
    { city: "Florianópolis", country: "Brasil", emoji: "🌊", temp: "28°C", tag: "Nacional" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>

      {/* HERO */}
      <div style={sh.hero}>
        <div style={sh.heroOverlay} />
        <div style={sh.heroContent}>
          <div style={sh.heroBadge}>{greeting}, {name} ✈️</div>
          <h1 style={sh.heroTitle}>Para onde vamos<br/>hoje?</h1>
          <p style={sh.heroSub}>Nossa IA cria seu roteiro completo com voos, hotéis, restaurantes e emergências em minutos.</p>
          <div style={sh.heroActions}>
            <button style={sh.heroBtn} onClick={() => setView("newPlan")}>✦ Criar Novo Plano</button>
            {stats.lastPlan && (
              <button style={sh.heroBtnSecondary} onClick={() => setView("history")}>
                Último: {stats.lastPlan.destino} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={sh.statsRow}>
        {[
          { icon: "🗺️", label: "Planos Gerados", value: stats.total, color: "#C8A96E" },
          { icon: "⏱️", label: "Tempo Médio", value: "~2min", color: "#6E9EC8" },
          { icon: "🌍", label: "Destinos Cobertos", value: "50+", color: "#6EC88A" },
          { icon: "⭐", label: "Satisfação", value: "98%", color: "#C86E9E" },
        ].map((stat) => (
          <div key={stat.label} style={sh.statCard}>
            <div style={sh.statIconWrap}>
              <span style={{ fontSize: 22 }}>{stat.icon}</span>
            </div>
            <div>
              <div style={{ ...sh.statValue, color: stat.color }}>{stat.value}</div>
              <div style={sh.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* INSPIRAÇÕES */}
      <div style={sh.section}>
        <div style={sh.sectionHeader}>
          <div>
            <div style={sh.sectionLabel}>✦ Inspirações</div>
            <h2 style={sh.sectionTitle}>Destinos em alta</h2>
          </div>
          <button style={sh.sectionLink} onClick={() => setView("newPlan")}>Planejar viagem →</button>
        </div>
        <div style={sh.destGrid}>
          {destinations.map((d) => (
            <div key={d.city} style={sh.destCard} onClick={() => setView("newPlan")}>
              <div style={sh.destEmoji}>{d.emoji}</div>
              <div style={sh.destTag}>{d.tag}</div>
              <div style={sh.destCity}>{d.city}</div>
              <div style={sh.destCountry}>{d.country}</div>
              <div style={sh.destTemp}>{d.temp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={sh.section}>
        <div style={sh.sectionLabel}>✦ Acesso Rápido</div>
        <div style={sh.quickGrid}>
          <div style={sh.quickCard} onClick={() => setView("newPlan")}>
            <span style={sh.quickIcon}>✈️</span>
            <div style={sh.quickTitle}>Novo Plano</div>
            <div style={sh.quickDesc}>Crie um roteiro completo com IA</div>
          </div>
          <div style={sh.quickCard} onClick={() => setView("history")}>
            <span style={sh.quickIcon}>📋</span>
            <div style={sh.quickTitle}>Meus Planos</div>
            <div style={sh.quickDesc}>{stats.total} plano{stats.total !== 1 ? "s" : ""} salvo{stats.total !== 1 ? "s" : ""}</div>
          </div>
          <div style={sh.quickCard} onClick={() => window.open("https://wa.me/5547996855528", "_blank")}>
            <span style={sh.quickIcon}>💬</span>
            <div style={sh.quickTitle}>Falar com Consultor</div>
            <div style={sh.quickDesc}>WhatsApp Shoppingtur</div>
          </div>
        </div>
      </div>

    </div>
  );
}

function HistoryView({ user }) {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    supabase.from("planos").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setPlanos(data || []); setLoading(false); });
  }, [user.id]);

  if (selected) {
    const htmlContent = formatPlanContent(selected.conteudo || "");
    return (
      <div style={s.view}>
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
          <button style={s.backBtn2} onClick={() => setSelected(null)}>← Voltar</button>
          <button style={s.pdfBtn} onClick={() => downloadHtml(htmlContent, selected.origem + " → " + selected.destino)}>⬇ Baixar Plano (.html)</button>
        </div>
        <div style={s.planViewCard}>
          <h2 style={s.planViewTitle}>{selected.origem} → {selected.destino}</h2>
          <p style={s.planViewMeta}>{selected.plano_nome} · {new Date(selected.created_at).toLocaleDateString("pt-BR")}</p>
          <div style={{ ...s.planViewContent, fontFamily:"DM Sans,sans-serif" }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.view}>
      <h2 style={s.viewTitle}>Meus Planos</h2>
      {loading ? (
        <div style={s.emptyState}><p style={{ color: "#4A4A6A" }}>Carregando...</p></div>
      ) : planos.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: 48 }}>📋</span>
          <p style={{ color: "#4A4A6A", marginTop: 16 }}>Nenhum plano gerado ainda.</p>
          <p style={{ color: "#3A3A5A", fontSize: 13, marginTop: 8 }}>Seus planos aparecerão aqui após a geração.</p>
        </div>
      ) : (
        <div style={s.planosList}>
          {planos.map((plano) => (
            <div key={plano.id} style={s.planoCard} onClick={() => setSelected(plano)}>
              <div style={s.planoCardIcon}>✈️</div>
              <div style={s.planoCardInfo}>
                <div style={s.planoCardTitle}>{plano.origem} → {plano.destino}</div>
                <div style={s.planoCardMeta}>
                  {plano.plano_nome} · {plano.data_ida ? new Date(plano.data_ida).toLocaleDateString("pt-BR") : "–"} a {plano.data_volta ? new Date(plano.data_volta).toLocaleDateString("pt-BR") : "–"}
                </div>
                <div style={s.planoCardDate}>{new Date(plano.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
              </div>
              <div style={s.planoCardArrow}>→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminView() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("planos").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setPlanos(data || []); setLoading(false); });
  }, []);

  const filtered = planos.filter(p =>
    p.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    p.destino?.toLowerCase().includes(search.toLowerCase()) ||
    p.origem?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    const htmlContent = formatPlanContent(selected.conteudo || "");
    return (
      <div style={s.view}>
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
          <button style={s.backBtn2} onClick={() => setSelected(null)}>← Voltar</button>
          <button style={s.pdfBtn} onClick={() => downloadHtml(htmlContent, selected.origem + " → " + selected.destino)}>⬇ Baixar Plano (.html)</button>
        </div>
        <div style={s.planViewCard}>
          <p style={{ color:"#C8A96E", fontSize:12, marginBottom:8 }}>👤 {selected.user_email}</p>
          <h2 style={s.planViewTitle}>{selected.origem} → {selected.destino}</h2>
          <p style={s.planViewMeta}>{selected.plano_nome} · {new Date(selected.created_at).toLocaleDateString("pt-BR")}</p>
          <div style={{ ...s.planViewContent, fontFamily:"DM Sans,sans-serif" }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    );
  }

  return (
    <div style={s.view}>
      <h2 style={s.viewTitle}>⚙️ Painel Admin</h2>
      <div style={s.adminStats}>
        <div style={s.adminStatCard}>
          <span style={s.adminStatNum}>{planos.length}</span>
          <span style={s.adminStatLabel}>Total de Planos</span>
        </div>
        <div style={s.adminStatCard}>
          <span style={s.adminStatNum}>{new Set(planos.map(p => p.user_id)).size}</span>
          <span style={s.adminStatLabel}>Clientes Únicos</span>
        </div>
        <div style={s.adminStatCard}>
          <span style={s.adminStatNum}>{planos.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</span>
          <span style={s.adminStatLabel}>Últimos 7 dias</span>
        </div>
      </div>

      <input
        style={s.searchInput}
        placeholder="🔍 Buscar por email, origem ou destino..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <p style={{ color: "#4A4A6A" }}>Carregando...</p>
      ) : (
        <div style={s.planosList}>
          {filtered.map((plano) => (
            <div key={plano.id} style={s.planoCard} onClick={() => setSelected(plano)}>
              <div style={s.planoCardIcon}>✈️</div>
              <div style={s.planoCardInfo}>
                <div style={s.planoCardTitle}>{plano.origem} → {plano.destino}</div>
                <div style={s.planoCardMeta}>{plano.plano_nome} · {plano.user_email}</div>
                <div style={s.planoCardDate}>{new Date(plano.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div style={s.planoCardArrow}>→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountView({ user }) {
  return (
    <div style={s.view}>
      <h2 style={s.viewTitle}>Minha Conta</h2>
      <div style={s.accountCard}>
        <div style={s.accountAvatar}>{(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}</div>
        <div style={s.accountInfo}>
          <div style={s.accountName}>{user.user_metadata?.full_name || "Usuário"}</div>
          <div style={s.accountEmail}>{user.email}</div>
          <div style={s.accountMeta}>Membro desde {new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "2px solid #1A1A2A", borderTopColor: "#C8A96E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#4A4A6A", fontSize: 13 }}>CARREGANDO...</p>
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

const sh = {
  hero: { position:"relative", borderRadius:20, overflow:"hidden", minHeight:280, background:"linear-gradient(135deg,#0A0A14 0%,#12102A 50%,#0A1420 100%)", marginBottom:20, display:"flex", alignItems:"flex-end" },
  heroOverlay: { position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 70% 50%,rgba(200,169,110,0.12) 0%,transparent 70%)" },
  heroContent: { position:"relative", padding:"48px 40px", zIndex:1 },
  heroBadge: { display:"inline-block", padding:"5px 14px", background:"rgba(200,169,110,0.15)", border:"1px solid rgba(200,169,110,0.3)", borderRadius:20, color:"#C8A96E", fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:16 },
  heroTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(32px,4vw,52px)", fontWeight:400, color:"#F0E8D0", lineHeight:1.1, marginBottom:12 },
  heroSub: { fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.7, maxWidth:460, marginBottom:28 },
  heroActions: { display:"flex", gap:12, flexWrap:"wrap" },
  heroBtn: { padding:"12px 28px", background:"linear-gradient(135deg,#8B6914,#C8A96E)", border:"none", borderRadius:8, color:"#080810", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.05em" },
  heroBtnSecondary: { padding:"12px 24px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" },
  statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 },
  statCard: { background:"#0F0F1E", border:"1px solid #1A1A28", borderRadius:14, padding:"18px 20px", display:"flex", alignItems:"center", gap:14 },
  statIconWrap: { width:44, height:44, borderRadius:10, background:"rgba(200,169,110,0.08)", border:"1px solid rgba(200,169,110,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  statValue: { fontSize:22, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, lineHeight:1 },
  statLabel: { fontSize:11, color:"#4A4A6A", marginTop:3, letterSpacing:"0.04em" },
  section: { marginBottom:28 },
  sectionHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16 },
  sectionLabel: { fontSize:11, color:"#C8A96E", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 },
  sectionTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:"#E8D5A3", fontWeight:400 },
  sectionLink: { background:"none", border:"none", color:"#6A6A8A", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"color 0.2s" },
  destGrid: { display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 },
  destCard: { background:"#0F0F1E", border:"1px solid #1A1A28", borderRadius:14, padding:"20px 16px", cursor:"pointer", transition:"all 0.2s", textAlign:"center", position:"relative", overflow:"hidden" },
  destEmoji: { fontSize:32, marginBottom:10 },
  destTag: { fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#C8A96E", background:"rgba(200,169,110,0.1)", padding:"2px 8px", borderRadius:10, display:"inline-block", marginBottom:8 },
  destCity: { fontSize:14, fontWeight:700, color:"#E8D5A3", marginBottom:2 },
  destCountry: { fontSize:11, color:"#4A4A6A", marginBottom:8 },
  destTemp: { fontSize:12, color:"#6A6A8A" },
  quickGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 },
  quickCard: { background:"#0F0F1E", border:"1px solid #1A1A28", borderRadius:14, padding:"24px", cursor:"pointer", transition:"all 0.2s", display:"flex", flexDirection:"column", gap:8 },
  quickIcon: { fontSize:28 },
  quickTitle: { fontSize:15, fontWeight:700, color:"#E8D5A3" },
  quickDesc: { fontSize:12, color:"#4A4A6A", lineHeight:1.5 },
};

const s = {
  root: { minHeight:"100vh", background:"#080810", display:"flex", fontFamily:"'DM Sans',sans-serif", color:"#E8E8F0" },
  sidebar: { width:240, minHeight:"100vh", background:"linear-gradient(180deg,#0C0C18,#0A0A14)", borderRight:"1px solid #1A1A28", display:"flex", flexDirection:"column", padding:"28px 0", position:"sticky", top:0, height:"100vh", flexShrink:0 },
  sidebarLogo: { fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:"#F0E8D0", letterSpacing:"0.12em", padding:"0 24px 28px", borderBottom:"1px solid #1A1A28", marginBottom:16 },
  nav: { display:"flex", flexDirection:"column", gap:4, padding:"0 12px", flex:1 },
  navItem: { display:"flex", alignItems:"center", gap:12, padding:"11px 16px", background:"transparent", border:"none", borderRadius:10, color:"#4A4A6A", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", textAlign:"left" },
  navItemActive: { background:"rgba(200,169,110,0.1)", color:"#C8A96E" },
  sidebarFooter: { padding:"20px 16px 0", borderTop:"1px solid #1A1A28", marginTop:16 },
  userInfo: { display:"flex", alignItems:"center", gap:10, marginBottom:12 },
  userAvatar: { width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#8B6914,#C8A96E)", display:"flex", alignItems:"center", justifyContent:"center", color:"#080810", fontWeight:700, fontSize:14, flexShrink:0 },
  userName: { fontSize:13, fontWeight:600, color:"#C8C8D8" },
  userEmail: { fontSize:11, color:"#4A4A6A", marginTop:1 },
  signOutBtn: { width:"100%", padding:"9px", background:"transparent", border:"1px solid #1A1A28", borderRadius:8, color:"#4A4A6A", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" },
  main: { flex:1, overflowY:"auto", padding:"40px" },
  view: { animation:"fadeUp 0.4s ease", maxWidth:860 },
  viewTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:"#E8D5A3", marginBottom:28 },
  welcomeHero: { position:"relative", background:"linear-gradient(145deg,#0F0F1E,#12121F)", border:"1px solid #1E1E30", borderRadius:20, padding:"40px", marginBottom:24, overflow:"hidden" },
  welcomeOrb: { position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(200,169,110,0.08) 0%,transparent 70%)", right:-50, top:-50, animation:"orbFloat 6s ease-in-out infinite" },
  welcomeTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:"#E8D5A3", marginBottom:12, position:"relative" },
  welcomeText: { color:"#6A6A8A", fontSize:15, lineHeight:1.6, maxWidth:480, marginBottom:28, position:"relative" },
  ctaBtn: { padding:"13px 28px", background:"linear-gradient(135deg,#8B6914,#C8A96E)", border:"none", borderRadius:10, color:"#080810", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.04em", position:"relative" },
  statsGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 },
  statCard: { background:"linear-gradient(145deg,#0F0F1E,#0C0C18)", border:"1px solid #1A1A28", borderRadius:16, padding:"24px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, textAlign:"center" },
  statValue: { fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:"#C8A96E", fontWeight:700 },
  statLabel: { fontSize:12, color:"#4A4A6A", letterSpacing:"0.05em" },
  emptyState: { textAlign:"center", padding:"60px 40px", background:"#0F0F1E", border:"1px solid #1A1A28", borderRadius:16 },
  planosList: { display:"flex", flexDirection:"column", gap:12 },
  planoCard: { background:"#0F0F1E", border:"1px solid #1A1A28", borderRadius:14, padding:"20px 24px", display:"flex", alignItems:"center", gap:16, cursor:"pointer", transition:"all 0.2s" },
  planoCardIcon: { fontSize:28, flexShrink:0 },
  planoCardInfo: { flex:1 },
  planoCardTitle: { fontSize:16, fontWeight:700, color:"#E8D5A3", marginBottom:4 },
  planoCardMeta: { fontSize:13, color:"#6A6A8A", marginBottom:2 },
  planoCardDate: { fontSize:11, color:"#3A3A5A" },
  planoCardArrow: { color:"#C8A96E", fontSize:18 },
  backBtn2: { marginBottom:20, padding:"8px 20px", background:"transparent", border:"1px solid #2A2A3A", borderRadius:8, color:"#6A6A8A", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" },
  planViewCard: { background:"#0F0F1E", border:"1px solid #1A1A28", borderRadius:16, padding:32 },
  planViewTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:"#E8D5A3", marginBottom:8 },
  planViewMeta: { fontSize:13, color:"#6A6A8A", marginBottom:24 },
  planViewContent: { color:"#C8C8D8", fontSize:14, lineHeight:1.8 },
  adminStats: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 },
  adminStatCard: { background:"linear-gradient(145deg,#0F0F1E,#0C0C18)", border:"1px solid #1A1A28", borderRadius:14, padding:"20px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, textAlign:"center" },
  adminStatNum: { fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:"#C8A96E", fontWeight:700 },
  adminStatLabel: { fontSize:12, color:"#4A4A6A" },
  searchInput: { width:"100%", padding:"12px 16px", background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:10, color:"#E8E8F0", fontSize:14, fontFamily:"'DM Sans',sans-serif", marginBottom:16 },
  accountCard: { background:"#0F0F1E", border:"1px solid #1A1A28", borderRadius:16, padding:28, display:"flex", alignItems:"center", gap:20 },
  accountAvatar: { width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#8B6914,#C8A96E)", display:"flex", alignItems:"center", justifyContent:"center", color:"#080810", fontWeight:700, fontSize:24, flexShrink:0 },
  accountInfo: { display:"flex", flexDirection:"column", gap:4 },
  accountName: { fontSize:18, fontWeight:600, color:"#E8D5A3" },
  accountEmail: { fontSize:14, color:"#6A6A8A" },
  accountMeta: { fontSize:12, color:"#3A3A5A", marginTop:4 },
  pdfBtn: { padding:"9px 20px", background:"linear-gradient(135deg,#8B6914,#C8A96E)", border:"none", borderRadius:8, color:"#080810", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.04em" },
};
