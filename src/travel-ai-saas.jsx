import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const STEPS = ["destino", "viajantes", "datas", "orcamento", "preferencias", "pagamento"];

const STEP_LABELS = {
  destino: "Destino",
  viajantes: "Viajantes",
  datas: "Datas",
  orcamento: "Orçamento",
  preferencias: "Preferências",
  pagamento: "Pagamento",
};

const INTERESTS = [
  { id: "gastronomia", label: "Gastronomia", icon: "🍽️" },
  { id: "cultura", label: "Cultura & Arte", icon: "🏛️" },
  { id: "aventura", label: "Aventura", icon: "🏔️" },
  { id: "praia", label: "Praias", icon: "🏖️" },
  { id: "compras", label: "Compras", icon: "🛍️" },
  { id: "natureza", label: "Natureza", icon: "🌿" },
  { id: "historia", label: "História", icon: "📜" },
  { id: "vida_noturna", label: "Vida Noturna", icon: "🌙" },
  { id: "esportes", label: "Esportes", icon: "⚽" },
  { id: "fotografia", label: "Fotografia", icon: "📸" },
];

const PLANS = [
  {
    id: "basico",
    name: "Plano Essencial",
    price: "R$ 39",
    priceNum: 39,
    desc: "Roteiro completo para viajantes práticos",
    features: ["Roteiro diário detalhado", "Top 5 restaurantes", "Dicas de hospedagem", "Alertas importantes", "PDF para download"],
    color: "#C8A96E",
  },
  {
    id: "premium",
    name: "Plano Estratégico",
    price: "R$ 79",
    priceNum: 79,
    desc: "Análise completa com alternativas e finanças",
    features: ["Tudo do Essencial", "Análise comparativa de voos", "Planejamento financeiro detalhado", "Alternativa econômica + otimizada", "Checklist personalizado", "Suporte prioritário"],
    color: "#E8D5A3",
    highlight: true,
  },
  {
    id: "vip",
    name: "Plano VIP",
    price: "R$ 149",
    priceNum: 149,
    desc: "Consultoria premium com experiências exclusivas",
    features: ["Tudo do Estratégico", "Experiências exclusivas", "Restaurantes com reserva", "Transfers e logística", "3 revisões do plano", "WhatsApp direto"],
    color: "#B8860B",
  },
];

export default function TravelAISaaS({ user, onPlanSaved }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    origem: "",
    destino: "",
    perfil: "casal",
    adultos: 2,
    criancas: 0,
    dataIda: "",
    dataVolta: "",
    orcamento: "",
    moeda: "BRL",
    interesses: [],
    restricoes: "",
    prioridade: "custo_beneficio",
  });
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [paymentStep, setPaymentStep] = useState("select");
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planContent, setPlanContent] = useState("");
  const [planGenerated, setPlanGenerated] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const planRef = useRef(null);

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleInterest = (id) => {
    setFormData((prev) => ({
      ...prev,
      interesses: prev.interesses.includes(id)
        ? prev.interesses.filter((i) => i !== id)
        : [...prev.interesses, id],
    }));
  };

  const validate = () => {
    const e = {};
    if (currentStep === 0) {
      if (!formData.origem.trim()) e.origem = "Informe a cidade de origem";
      if (!formData.destino.trim()) e.destino = "Informe o destino";
    }
    if (currentStep === 2) {
      if (!formData.dataIda) e.dataIda = "Informe a data de ida";
      if (!formData.dataVolta) e.dataVolta = "Informe a data de volta";
      if (formData.dataIda && formData.dataVolta && formData.dataIda >= formData.dataVolta)
        e.dataVolta = "A volta deve ser após a ida";
    }
    if (currentStep === 3) {
      if (!formData.orcamento || isNaN(formData.orcamento)) e.orcamento = "Informe um orçamento válido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (!validate()) return;
    setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
    setErrors({});
  };

  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 0));

  const handlePayment = async () => {
    setPaymentStep("processing");
    await new Promise((r) => setTimeout(r, 2200));
    setPaymentStep("done");
    await new Promise((r) => setTimeout(r, 800));
    generatePlan();
  };

  const generatePlan = async () => {
    setGeneratingPlan(true);
    setPlanContent("");
    setDisplayText("");

    const plan = PLANS.find((p) => p.id === selectedPlan);
    const interests = formData.interesses.map((i) => INTERESTS.find((x) => x.id === i)?.label).join(", ") || "variados";
    const dias = formData.dataIda && formData.dataVolta
      ? Math.ceil((new Date(formData.dataVolta) - new Date(formData.dataIda)) / (1000 * 60 * 60 * 24))
      : 7;

    const prompt = `Você é um Consultor Estratégico Global de Viagens com Inteligência Artificial de elite.

Gere um planejamento de viagem COMPLETO e DETALHADO com base nos dados abaixo. Use linguagem profissional, clara e inspiradora. Formate em Markdown com seções bem definidas.

DADOS DA VIAGEM:
- Origem: ${formData.origem}
- Destino: ${formData.destino}
- Perfil: ${formData.perfil} (${formData.adultos} adultos, ${formData.criancas} crianças)
- Datas: ${formData.dataIda || "flexível"} a ${formData.dataVolta || "flexível"} (${dias} dias)
- Orçamento: ${formData.moeda === "BRL" ? "R$" : "US$"} ${formData.orcamento}
- Interesses: ${interests}
- Prioridade: ${formData.prioridade}
- Restrições: ${formData.restricoes || "nenhuma"}
- Plano contratado: ${plan?.name}

ENTREGUE OBRIGATORIAMENTE (em Markdown formatado):

# ✈️ PLANEJAMENTO ESTRATÉGICO DE VIAGEM
## ${formData.destino.toUpperCase()} — ${dias} DIAS INESQUECÍVEIS

### 📋 RESUMO EXECUTIVO
[Síntese estratégica da viagem, highlights e expectativas]

### ✈️ ANÁLISE DE VOOS
Você é um especialista em tarifas aéreas. Analise as melhores opções de voo com 3 perfis obrigatórios:

**[A] MAIS BARATO** — menor custo total incluindo taxas e bagagem
**[B] MELHOR CUSTO-BENEFÍCIO** — equilíbrio entre preço, conforto e tempo  
**[C] MAIS RÁPIDO/CONVENIENTE** — menor duração ou melhores horários

Apresente em tabela:
| Perfil | Companhia | Data/Hora | Duração | Conexões | Bagagem | Preço Total |

Para cada perfil inclua: por que foi selecionado, pontos de atenção, estratégias de economia (melhores dias, milhas, bilhetes separados).

Inclua os links de busca abaixo (mantenha exatamente como está):
🔍 **Google Flights:** https://www.google.com/travel/flights?q=voos+de+${formData.origem}+para+${formData.destino}&hl=pt-BR
🔍 **Skyscanner:** https://www.skyscanner.com.br/transporte-aereo/${formData.origem}/${formData.destino}/${formData.dataIda}/${formData.dataVolta}
🔍 **Decolar:** https://www.decolar.com/voos/${formData.origem}/${formData.destino}/${formData.dataIda}/${formData.dataVolta}/${formData.adultos}/${formData.criancas}/0

Se origem e destino forem a mesma cidade, informe que não há necessidade de voos e sugira transporte terrestre premium.

### 🏨 HOSPEDAGEM RECOMENDADA
Analise as MELHORES opções de hospedagem para este perfil, cruzando dados de Booking.com, Airbnb, Google Hotels e TripAdvisor.

Para cada opção, apresente:
- Nome, tipo e bairro
- Preço por noite e total do período
- Nota média agregada das plataformas (mín. 8.0/10)
- Índice de Localização (1–10): proximidade aos pontos de interesse
- Índice de Economia (1–10): relação ao orçamento informado
- Índice de Valor: [(Nota × 0,4) + (Localização × 0,3) + (Economia × 0,3)]
- Ponto Forte Principal
- Ponto de Atenção
- Diferencial Exclusivo
- Política de cancelamento

Apresente em tabela ordenada pelo Índice de Valor (maior → menor):
| # | Nome | Tipo | Preço/Noite | Preço Total | Nota | Localização | Economia | Índice de Valor | Cancelamento |

Após a tabela, para cada hotel inclua os links no formato abaixo (substitua NOME_DO_HOTEL pelo nome real sem espaços, usando + entre palavras, e CIDADE pela cidade do destino):

🔍 **Buscar no Booking.com:** https://www.booking.com/search.html?ss=NOME_DO_HOTEL+CIDADE&checkin=${formData.dataIda}&checkout=${formData.dataVolta}&group_adults=${formData.adultos}&group_children=${formData.criancas}
🗺️ **Ver no Google Maps:** https://www.google.com/maps/search/NOME_DO_HOTEL+CIDADE
⭐ **Avaliações no TripAdvisor:** https://www.tripadvisor.com.br/Search?q=NOME_DO_HOTEL+CIDADE

Após os links, inclua:
- ✅ RECOMENDAÇÃO PRINCIPAL: qual escolher e por quê
- 📊 ALERTA DE PREÇO: se está acima/na média/abaixo da média histórica para o destino e época
- 📍 Distância de cada opção até o ponto turístico principal (a pé e de carro)

### 🗓️ ROTEIRO DIÁRIO
[Dia a dia detalhado com horários, atrações, dicas insider e tempo em cada local]

### 🍽️ RESTAURANTES IMPERDÍVEIS
[5-8 restaurantes com: nome, tipo de culinária, faixa de preço, prato recomendado e reserva necessária?]

### 📄 DOCUMENTAÇÃO NECESSÁRIA
[Visto, seguro viagem, vacinas, requisitos de entrada — específico para brasileiro visitando ${formData.destino}]

### 💰 PLANEJAMENTO FINANCEIRO
[Tabela detalhada: Categoria | Alternativa Econômica | Custo-Benefício | Premium]
Inclua: voos, hospedagem, alimentação, transporte local, atrações, extras

### ✅ CHECKLIST FINAL
[Lista de verificação completa: documentos, bagagem, reservas, apps, dicas finais]

### ⚠️ ALERTAS IMPORTANTES
[Avisos críticos: segurança, saúde, golpes comuns, épocas a evitar, culturais]

### 🆘 CONTATOS DE EMERGÊNCIA
Liste os principais contatos de emergência específicos para ${formData.destino}:

**Emergências Gerais:**
- Polícia: [número local]
- SAMU / Ambulância: [número local]
- Bombeiros: [número local]
- Emergência Geral: [número local]

**Embaixada/Consulado Brasileiro** (se destino internacional):
- Endereço, telefone e email do consulado brasileiro mais próximo
- Plantão consular 24h (se disponível)

**Hospitais e Pronto-Socorro:**
- 2-3 hospitais mais próximos da região de hospedagem recomendada com endereço

**Outros Contatos Úteis:**
- Polícia Turística (se existir no destino)
- Central de Informações Turísticas
- Número de emergência do cartão de crédito (orientar a salvar antes de viajar)
- App de emergência local (se houver)

Formate como lista clara e fácil de copiar para o celular.

Seja específico, use dados reais, seja inspirador. Este é um produto premium.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((c) => c.text || "").join("") || "Erro ao gerar o plano. Tente novamente.";
      setPlanContent(text);
      setPlanGenerated(true);
      setGeneratingPlan(false);

      // Salvar plano no Supabase
      if (user) {
        const plan = PLANS.find((p) => p.id === selectedPlan);
        supabase.from("planos").insert({
          user_id: user.id,
          user_email: user.email,
          origem: formData.origem,
          destino: formData.destino,
          data_ida: formData.dataIda || null,
          data_volta: formData.dataVolta || null,
          perfil: formData.perfil,
          adultos: formData.adultos,
          criancas: formData.criancas,
          orcamento: formData.orcamento,
          moeda: formData.moeda,
          plano_nome: plan?.name || "Plano",
          conteudo: text,
        });
      }

      let i = 0;
      setDisplayText("");
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText((prev) => prev + text[i]);
          i++;
          if (planRef.current) planRef.current.scrollTop = planRef.current.scrollHeight;
        } else {
          clearInterval(interval);
        }
      }, 5);
    } catch (err) {
      setGeneratingPlan(false);
      setPlanContent("Erro ao conectar com a IA. Verifique sua conexão.");
      setPlanGenerated(true);
    }
  };

  const formatMarkdown = (text) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="md-li md-oli"><span>$1.</span> $2</li>')
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split("|").filter((c) => c.trim());
        return "<tr>" + cells.map((c) => `<td>${c.trim()}</td>`).join("") + "</tr>";
      })
      .replace(/\n\n/g, '</p><p class="md-p">')
      .replace(/\n/g, "<br/>");
  };

  const getDias = () => {
    if (!formData.dataIda || !formData.dataVolta) return null;
    return Math.ceil((new Date(formData.dataVolta) - new Date(formData.dataIda)) / (1000 * 60 * 60 * 24));
  };

  // Plan page
  if (planGenerated || generatingPlan) {
    return (
      <div style={styles.planPage}>
        <style>{planCSS}</style>

        <div style={styles.planHeader}>
          <div style={styles.planHeaderInner}>
            <div style={styles.planLogo}>✈ VOYAGER<span style={{ color: "#C8A96E" }}>AI</span></div>
            <div style={styles.planMeta}>
              <span style={styles.planBadge}>{PLANS.find((p) => p.id === selectedPlan)?.name}</span>
              <span style={styles.planRoute}>{formData.origem} → {formData.destino}</span>
            </div>
          </div>
        </div>

        <div style={styles.planBody} ref={planRef}>
          {generatingPlan ? (
            <div style={styles.loadingWrap}>
              <div style={styles.loadingOrb}></div>
              <p style={styles.loadingText}>Gerando seu plano estratégico...</p>
              <p style={styles.loadingSubtext}>Nossa IA está analisando {formData.destino} para você</p>
            </div>
          ) : (
            <div style={styles.planContent}>
              <div className="plan-markdown" dangerouslySetInnerHTML={{ __html: formatMarkdown(displayText) }} />
              {displayText.length < planContent.length && <span style={styles.cursor}>▊</span>}
            </div>
          )}
        </div>

        {planGenerated && !generatingPlan && (
          <div style={styles.planFooter} className="no-print">
            <button style={styles.downloadBtn} onClick={() => window.print()}>⬇ Baixar PDF</button>
            <button style={styles.newPlanBtn} onClick={() => {
              setPlanGenerated(false);
              setDisplayText("");
              setPlanContent("");
              setCurrentStep(0);
              setPaymentStep("select");
              setFormData({ origem: "", destino: "", perfil: "casal", adultos: 2, criancas: 0, dataIda: "", dataVolta: "", orcamento: "", moeda: "BRL", interesses: [], restricoes: "", prioridade: "custo_beneficio" });
            }}>+ Novo Plano</button>
          </div>
        )}
      </div>
    );
  }

  // Payment flow
  if (currentStep === 5) {
    if (paymentStep === "processing") {
      return (
        <div style={styles.root}>
          <style>{css}</style>
          <div style={styles.processingWrap}>
            <div style={styles.processingOrb}></div>
            <h2 style={styles.processingTitle}>Processando pagamento...</h2>
            <p style={styles.processingText}>Aguarde um momento</p>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.root}>
        <style>{css}</style>
        <div style={styles.container}>
          <header style={styles.header}>
            <div style={styles.logo}>✈ VOYAGER<span style={{ color: "#C8A96E" }}>AI</span></div>
            <p style={styles.tagline}>Consultoria Estratégica de Viagens com IA</p>
          </header>

          {paymentStep === "select" && (
            <div style={styles.plansWrap}>
              <h2 style={styles.sectionTitle}>Escolha seu plano</h2>
              <p style={styles.sectionSub}>{formData.origem} → <strong>{formData.destino}</strong> · {getDias() || "?"} dias</p>
              <div style={styles.plansGrid}>
                {PLANS.map((plan) => (
                  <div key={plan.id} style={{ ...styles.planCard, ...(selectedPlan === plan.id ? styles.planCardSelected : {}), ...(plan.highlight ? styles.planCardHighlight : {}) }} onClick={() => setSelectedPlan(plan.id)}>
                    {plan.highlight && <div style={styles.planBadgeTop}>MAIS POPULAR</div>}
                    <div style={{ ...styles.planPrice, color: plan.color }}>{plan.price}</div>
                    <div style={styles.planName}>{plan.name}</div>
                    <div style={styles.planDesc}>{plan.desc}</div>
                    <ul style={styles.planFeatures}>
                      {plan.features.map((f, i) => (
                        <li key={i} style={styles.planFeature}><span style={{ color: plan.color }}>✓</span> {f}</li>
                      ))}
                    </ul>
                    <button style={{ ...styles.selectPlanBtn, background: selectedPlan === plan.id ? plan.color : "transparent", borderColor: plan.color, color: selectedPlan === plan.id ? "#0A0A0F" : plan.color }}>
                      {selectedPlan === plan.id ? "✓ Selecionado" : "Selecionar"}
                    </button>
                  </div>
                ))}
              </div>
              <button style={styles.proceedBtn} onClick={() => setPaymentStep("checkout")}>Continuar para Pagamento →</button>
            </div>
          )}

          {paymentStep === "checkout" && (
            <div style={styles.checkoutWrap}>
              <div style={styles.checkoutSummary}>
                <h3 style={styles.summaryTitle}>Resumo do Pedido</h3>
                <div style={styles.summaryRow}><span>{PLANS.find((p) => p.id === selectedPlan)?.name}</span><span style={{ color: "#C8A96E" }}>{PLANS.find((p) => p.id === selectedPlan)?.price}</span></div>
                <div style={styles.summaryRow}><span>Destino</span><span>{formData.destino}</span></div>
                <div style={styles.summaryRow}><span>Duração</span><span>{getDias() || "?"} dias</span></div>
                <div style={{ ...styles.summaryRow, borderTop: "1px solid #2A2A3A", paddingTop: 12, fontWeight: 700 }}>
                  <span>Total</span><span style={{ color: "#C8A96E", fontSize: 20 }}>{PLANS.find((p) => p.id === selectedPlan)?.price}</span>
                </div>
              </div>

              <div style={styles.checkoutForm}>
                <h3 style={styles.summaryTitle}>Dados do Cartão</h3>
                <div style={styles.cardPreview}>
                  <div style={styles.cardChip}>💳</div>
                  <div style={styles.cardNumber}>{cardData.number ? cardData.number.replace(/(.{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}</div>
                  <div style={styles.cardBottom}><span>{cardData.name || "NOME DO TITULAR"}</span><span>{cardData.expiry || "MM/AA"}</span></div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Número do Cartão</label>
                  <input style={styles.input} placeholder="0000 0000 0000 0000" maxLength={19} value={cardData.number} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 16); setCardData((p) => ({ ...p, number: v })); }} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nome no Cartão</label>
                  <input style={styles.input} placeholder="Como aparece no cartão" value={cardData.name} onChange={(e) => setCardData((p) => ({ ...p, name: e.target.value.toUpperCase() }))} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>Validade</label>
                    <input style={styles.input} placeholder="MM/AA" maxLength={5} value={cardData.expiry} onChange={(e) => { let v = e.target.value.replace(/\D/g, ""); if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4); setCardData((p) => ({ ...p, expiry: v })); }} />
                  </div>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>CVV</label>
                    <input style={styles.input} placeholder="•••" maxLength={4} type="password" value={cardData.cvv} onChange={(e) => setCardData((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
                  </div>
                </div>
                <button style={styles.payBtn} onClick={handlePayment}>🔒 Pagar {PLANS.find((p) => p.id === selectedPlan)?.price} e Gerar Plano</button>
                <p style={styles.secureText}>🔐 Pagamento 100% seguro · SSL · PCI DSS</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main form
  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div style={styles.root}>
      <style>{css}</style>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>✈ VOYAGER<span style={{ color: "#C8A96E" }}>AI</span></div>
          <p style={styles.tagline}>Consultoria Estratégica de Viagens com Inteligência Artificial</p>
        </header>

        <div style={styles.progressWrap}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <div style={styles.progressSteps}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ ...styles.progressStep, ...(i <= currentStep ? styles.progressStepActive : {}) }}>
                <div style={{ ...styles.progressDot, ...(i <= currentStep ? styles.progressDotActive : {}) }}>{i < currentStep ? "✓" : i + 1}</div>
                <span style={styles.progressLabel}>{STEP_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.formCard}>
          {step === "destino" && (
            <div style={styles.stepContent}>
              <h2 style={styles.stepTitle}>🌍 Para onde vamos?</h2>
              <p style={styles.stepSubtitle}>Informe sua cidade de origem e o destino dos sonhos</p>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cidade de Origem</label>
                <input style={{ ...styles.input, ...(errors.origem ? styles.inputError : {}) }} placeholder="Ex: São Paulo, SP" value={formData.origem} onChange={(e) => update("origem", e.target.value)} />
                {errors.origem && <span style={styles.error}>{errors.origem}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Destino</label>
                <input style={{ ...styles.input, ...(errors.destino ? styles.inputError : {}) }} placeholder="Ex: Paris, França" value={formData.destino} onChange={(e) => update("destino", e.target.value)} />
                {errors.destino && <span style={styles.error}>{errors.destino}</span>}
              </div>
            </div>
          )}

          {step === "viajantes" && (
            <div style={styles.stepContent}>
              <h2 style={styles.stepTitle}>👥 Quem vai viajar?</h2>
              <p style={styles.stepSubtitle}>Nos conte sobre o grupo de viajantes</p>
              <div style={styles.formGroup}>
                <label style={styles.label}>Perfil da Viagem</label>
                <div style={styles.profileGrid}>
                  {[{ id: "solo", label: "Solo", icon: "🧳" }, { id: "casal", label: "Casal", icon: "💑" }, { id: "familia", label: "Família", icon: "👨‍👩‍👧‍👦" }, { id: "amigos", label: "Amigos", icon: "🎉" }].map((p) => (
                    <button key={p.id} style={{ ...styles.profileBtn, ...(formData.perfil === p.id ? styles.profileBtnActive : {}) }} onClick={() => update("perfil", p.id)}>
                      <span style={{ fontSize: 28 }}>{p.icon}</span><span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Adultos</label>
                  <div style={styles.counter}>
                    <button style={styles.counterBtn} onClick={() => update("adultos", Math.max(1, formData.adultos - 1))}>−</button>
                    <span style={styles.counterVal}>{formData.adultos}</span>
                    <button style={styles.counterBtn} onClick={() => update("adultos", formData.adultos + 1)}>+</button>
                  </div>
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Crianças</label>
                  <div style={styles.counter}>
                    <button style={styles.counterBtn} onClick={() => update("criancas", Math.max(0, formData.criancas - 1))}>−</button>
                    <span style={styles.counterVal}>{formData.criancas}</span>
                    <button style={styles.counterBtn} onClick={() => update("criancas", formData.criancas + 1)}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "datas" && (
            <div style={styles.stepContent}>
              <h2 style={styles.stepTitle}>📅 Quando é a viagem?</h2>
              <p style={styles.stepSubtitle}>Defina as datas de ida e volta</p>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Data de Ida</label>
                  <input type="date" style={{ ...styles.input, ...(errors.dataIda ? styles.inputError : {}) }} value={formData.dataIda} min={new Date().toISOString().split("T")[0]} onChange={(e) => update("dataIda", e.target.value)} />
                  {errors.dataIda && <span style={styles.error}>{errors.dataIda}</span>}
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Data de Volta</label>
                  <input type="date" style={{ ...styles.input, ...(errors.dataVolta ? styles.inputError : {}) }} value={formData.dataVolta} min={formData.dataIda || new Date().toISOString().split("T")[0]} onChange={(e) => update("dataVolta", e.target.value)} />
                  {errors.dataVolta && <span style={styles.error}>{errors.dataVolta}</span>}
                </div>
              </div>
              {getDias() && <div style={styles.diasBadge}>🗓️ <strong>{getDias()} dias</strong> de viagem</div>}
            </div>
          )}

          {step === "orcamento" && (
            <div style={styles.stepContent}>
              <h2 style={styles.stepTitle}>💰 Qual é o orçamento?</h2>
              <p style={styles.stepSubtitle}>Informe o orçamento total disponível para a viagem</p>
              <div style={styles.formGroup}>
                <label style={styles.label}>Moeda</label>
                <div style={styles.moedaToggle}>
                  {["BRL", "USD", "EUR"].map((m) => (
                    <button key={m} style={{ ...styles.moedaBtn, ...(formData.moeda === m ? styles.moedaBtnActive : {}) }} onClick={() => update("moeda", m)}>
                      {m === "BRL" ? "R$ Real" : m === "USD" ? "$ Dólar" : "€ Euro"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Valor Total</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputPrefix}>{formData.moeda === "BRL" ? "R$" : formData.moeda === "USD" ? "$" : "€"}</span>
                  <input style={{ ...styles.input, ...styles.inputWithPrefix, ...(errors.orcamento ? styles.inputError : {}) }} placeholder="0,00" value={formData.orcamento} onChange={(e) => update("orcamento", e.target.value.replace(/\D/g, ""))} />
                </div>
                {errors.orcamento && <span style={styles.error}>{errors.orcamento}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prioridade</label>
                <div style={styles.prioridadeGrid}>
                  {[{ id: "economia", label: "Máxima Economia", icon: "💡" }, { id: "custo_beneficio", label: "Custo-Benefício", icon: "⚖️" }, { id: "conforto", label: "Conforto", icon: "✨" }, { id: "luxo", label: "Luxo Total", icon: "👑" }].map((p) => (
                    <button key={p.id} style={{ ...styles.prioridadeBtn, ...(formData.prioridade === p.id ? styles.prioridadeBtnActive : {}) }} onClick={() => update("prioridade", p.id)}>
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "preferencias" && (
            <div style={styles.stepContent}>
              <h2 style={styles.stepTitle}>🎯 Seus interesses</h2>
              <p style={styles.stepSubtitle}>Selecione o que mais combina com você (pode escolher vários)</p>
              <div style={styles.interestsGrid}>
                {INTERESTS.map((interest) => (
                  <button key={interest.id} style={{ ...styles.interestBtn, ...(formData.interesses.includes(interest.id) ? styles.interestBtnActive : {}) }} onClick={() => toggleInterest(interest.id)}>
                    <span style={{ fontSize: 22 }}>{interest.icon}</span>
                    <span style={{ fontSize: 12 }}>{interest.label}</span>
                  </button>
                ))}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Restrições ou observações (opcional)</label>
                <textarea style={styles.textarea} placeholder="Ex: vegetariano, mobilidade reduzida, medo de altura..." value={formData.restricoes} onChange={(e) => update("restricoes", e.target.value)} rows={3} />
              </div>
            </div>
          )}

          <div style={styles.navButtons}>
            {currentStep > 0 && <button style={styles.backBtn} onClick={prevStep}>← Voltar</button>}
            <button style={{ ...styles.nextBtn, marginLeft: currentStep === 0 ? "auto" : 0 }} onClick={nextStep}>
              {currentStep === STEPS.length - 2 ? "Ver Planos →" : "Continuar →"}
            </button>
          </div>
        </div>

        <footer style={styles.footer}>
          <p>🔐 Seus dados são protegidos · ✈️ VoyagerAI © 2025</p>
        </footer>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080810; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) sepia(1) saturate(2) hue-rotate(5deg); }
  input::placeholder, textarea::placeholder { color: #4A4A6A; }
  input:focus, textarea:focus { outline: none; border-color: #C8A96E !important; }
  @keyframes orbPulse { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.15);opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
`;

const planCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#080810; }
  @keyframes orbPulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.2);opacity:1} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  .plan-markdown { color:#C8C8D8; font-family:'DM Sans',sans-serif; font-size:1rem; line-height:1.9; }
  .md-h1 { font-family:'Cormorant Garamond',serif; font-size:2.4rem; color:#E8D5A3; margin:2.5rem 0 1rem; line-height:1.2; }
  .md-h2 { font-family:'Cormorant Garamond',serif; font-size:1.7rem; color:#C8A96E; margin:2.5rem 0 1rem; border-bottom:1px solid #2A2A3A; padding-bottom:0.5rem; }
  .md-h3 { font-size:1.15rem; color:#F0E8D0; margin:1.8rem 0 0.6rem; font-weight:700; letter-spacing:0.02em; }
  .md-p { margin:0.8rem 0; color:#C8C8D8; }
  .md-li { margin:0.4rem 0 0.4rem 1.6rem; line-height:1.8; color:#B8B8C8; }
  .md-oli span { color:#C8A96E; font-weight:700; margin-right:4px; }

  table { border-collapse:collapse; width:100%; margin:1.2rem 0; border-radius:8px; overflow:hidden; }
  td { padding:10px 16px; border:1px solid #2A2A3A; font-size:0.9rem; color:#B8B8C8; }
  tr:first-child td { background:#1A1A2A; font-weight:700; color:#C8A96E; font-size:0.85rem; letter-spacing:0.05em; text-transform:uppercase; }
  tr:nth-child(even) td { background:rgba(255,255,255,0.02); }
  strong { color:#E8D5A3; font-weight:600; }
  em { color:#A8A8C8; font-style:italic; }

  .no-print { }

  @media print {
    @page { margin: 15mm 20mm; size: A4; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

    body { background: white !important; }

    .plan-markdown { color: #1A1A2A !important; font-size: 10pt !important; line-height: 1.6 !important; }
    .md-h1 { color: #7A5010 !important; font-size: 20pt !important; margin: 16pt 0 8pt !important; page-break-after: avoid; }
    .md-h2 { color: #8B6914 !important; font-size: 14pt !important; margin: 14pt 0 6pt !important; border-bottom: 1px solid #C8A96E !important; page-break-after: avoid; }
    .md-h3 { color: #333 !important; font-size: 11pt !important; margin: 10pt 0 4pt !important; page-break-after: avoid; }
    .md-p { color: #1A1A2A !important; margin: 4pt 0 !important; }
    .md-li { color: #1A1A2A !important; margin: 2pt 0 2pt 16pt !important; }
    .md-oli span { color: #8B6914 !important; }

    table { margin: 8pt 0 !important; page-break-inside: avoid; }
    td { color: #1A1A2A !important; border-color: #CCC !important; padding: 6pt 10pt !important; font-size: 9pt !important; }
    tr:first-child td { background: #F5EDD0 !important; color: #7A5010 !important; }
    tr:nth-child(even) td { background: #FAFAFA !important; }

    strong { color: #5A3A00 !important; }
    em { color: #444 !important; }

    .no-print { display: none !important; }

    div[style*="planHeader"] { display: none !important; }
    div[style*="planFooter"] { display: none !important; }
    div[style*="planBody"] { padding: 0 !important; max-width: 100% !important; overflow: visible !important; }
    div[style*="planPage"] { background: white !important; min-height: auto !important; }
  }
`;

const styles = {
  root: { minHeight:"100vh", background:"linear-gradient(135deg,#080810 0%,#0D0D1A 50%,#0A0A14 100%)", fontFamily:"'DM Sans',sans-serif", color:"#E8E8F0", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"20px 16px 40px" },
  container: { width:"100%", maxWidth:700, animation:"fadeUp 0.6s ease" },
  header: { textAlign:"center", padding:"32px 0 24px" },
  logo: { fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:700, letterSpacing:"0.15em", color:"#F0E8D0" },
  tagline: { fontSize:13, color:"#6A6A8A", letterSpacing:"0.08em", marginTop:6, textTransform:"uppercase" },
  progressWrap: { marginBottom:28 },
  progressBar: { height:2, background:"#1A1A2A", borderRadius:2, marginBottom:16 },
  progressFill: { height:"100%", background:"linear-gradient(90deg,#8B6914,#C8A96E,#E8D5A3)", borderRadius:2, transition:"width 0.4s ease" },
  progressSteps: { display:"flex", justifyContent:"space-between" },
  progressStep: { display:"flex", flexDirection:"column", alignItems:"center", gap:4, opacity:0.4, transition:"opacity 0.3s" },
  progressStepActive: { opacity:1 },
  progressDot: { width:28, height:28, borderRadius:"50%", background:"#1A1A2A", border:"1px solid #2A2A3A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"#4A4A6A", transition:"all 0.3s" },
  progressDotActive: { background:"linear-gradient(135deg,#8B6914,#C8A96E)", border:"none", color:"#080810" },
  progressLabel: { fontSize:10, color:"#4A4A6A", letterSpacing:"0.05em" },
  formCard: { background:"linear-gradient(145deg,#0F0F1E,#12121F)", border:"1px solid #1E1E30", borderRadius:20, padding:36, boxShadow:"0 24px 80px rgba(0,0,0,0.5)" },
  stepContent: { animation:"fadeUp 0.4s ease" },
  stepTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:"#E8D5A3", marginBottom:8 },
  stepSubtitle: { fontSize:14, color:"#6A6A8A", marginBottom:28, lineHeight:1.5 },
  formGroup: { marginBottom:20 },
  label: { display:"block", fontSize:12, fontWeight:600, color:"#8A8AAA", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 },
  input: { width:"100%", padding:"14px 16px", background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:10, color:"#E8E8F0", fontSize:15, transition:"border-color 0.2s", fontFamily:"'DM Sans',sans-serif" },
  inputError: { borderColor:"#8B3030" },
  error: { fontSize:12, color:"#C06060", marginTop:4, display:"block" },
  inputWrap: { position:"relative" },
  inputPrefix: { position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:"#C8A96E", fontWeight:600, fontSize:15 },
  inputWithPrefix: { paddingLeft:48 },
  textarea: { width:"100%", padding:"14px 16px", background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:10, color:"#E8E8F0", fontSize:14, resize:"vertical", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 },
  profileGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 },
  profileBtn: { padding:"16px 8px", background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:12, color:"#8A8AAA", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, fontSize:13, fontWeight:500, transition:"all 0.2s", fontFamily:"'DM Sans',sans-serif" },
  profileBtnActive: { background:"rgba(200,169,110,0.12)", border:"1px solid #C8A96E", color:"#E8D5A3" },
  counter: { display:"flex", alignItems:"center", gap:16, padding:"10px 16px", background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:10 },
  counterBtn: { width:32, height:32, borderRadius:"50%", background:"#1A1A2A", border:"1px solid #2A2A3A", color:"#C8A96E", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", fontWeight:600 },
  counterVal: { fontSize:20, fontWeight:700, color:"#E8D5A3", minWidth:30, textAlign:"center" },
  diasBadge: { marginTop:16, padding:"12px 20px", background:"rgba(200,169,110,0.1)", border:"1px solid rgba(200,169,110,0.3)", borderRadius:10, color:"#C8A96E", fontSize:14, textAlign:"center" },
  moedaToggle: { display:"flex", gap:10 },
  moedaBtn: { flex:1, padding:"10px", background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:8, color:"#6A6A8A", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s" },
  moedaBtnActive: { background:"rgba(200,169,110,0.12)", border:"1px solid #C8A96E", color:"#E8D5A3" },
  prioridadeGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  prioridadeBtn: { padding:"12px 16px", background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:10, color:"#6A6A8A", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", display:"flex", gap:8, alignItems:"center", transition:"all 0.2s" },
  prioridadeBtnActive: { background:"rgba(200,169,110,0.12)", border:"1px solid #C8A96E", color:"#E8D5A3" },
  interestsGrid: { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:24 },
  interestBtn: { padding:"14px 8px", background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:12, color:"#6A6A8A", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all 0.2s", fontFamily:"'DM Sans',sans-serif" },
  interestBtnActive: { background:"rgba(200,169,110,0.12)", border:"1px solid #C8A96E", color:"#E8D5A3" },
  navButtons: { display:"flex", justifyContent:"space-between", marginTop:32, gap:12 },
  backBtn: { padding:"14px 28px", background:"transparent", border:"1px solid #2A2A3A", borderRadius:10, color:"#6A6A8A", cursor:"pointer", fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s" },
  nextBtn: { padding:"14px 36px", background:"linear-gradient(135deg,#8B6914,#C8A96E)", border:"none", borderRadius:10, color:"#080810", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.04em", transition:"all 0.2s" },
  footer: { textAlign:"center", padding:"24px 0", fontSize:12, color:"#3A3A5A" },
  plansWrap: { animation:"fadeUp 0.4s ease" },
  sectionTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:"#E8D5A3", textAlign:"center", marginBottom:8 },
  sectionSub: { textAlign:"center", color:"#6A6A8A", fontSize:14, marginBottom:32 },
  plansGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 },
  planCard: { background:"#0F0F1E", border:"1px solid #1E1E30", borderRadius:16, padding:24, cursor:"pointer", transition:"all 0.3s", position:"relative" },
  planCardSelected: { border:"1px solid #C8A96E", boxShadow:"0 0 30px rgba(200,169,110,0.15)" },
  planCardHighlight: { background:"linear-gradient(145deg,#0F0F1E,#141428)" },
  planBadgeTop: { position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#8B6914,#C8A96E)", color:"#080810", fontSize:9, fontWeight:700, padding:"4px 12px", borderRadius:20, letterSpacing:"0.1em", whiteSpace:"nowrap" },
  planPrice: { fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, marginBottom:4 },
  planName: { fontSize:14, fontWeight:700, color:"#F0E8D0", marginBottom:6 },
  planDesc: { fontSize:12, color:"#6A6A8A", marginBottom:16, lineHeight:1.5 },
  planFeatures: { listStyle:"none", marginBottom:20 },
  planFeature: { fontSize:12, color:"#8A8AAA", padding:"4px 0", display:"flex", gap:6, alignItems:"flex-start", lineHeight:1.4 },
  selectPlanBtn: { width:"100%", padding:"10px", border:"1px solid", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.05em", transition:"all 0.2s" },
  proceedBtn: { display:"block", width:"100%", padding:"16px", background:"linear-gradient(135deg,#8B6914,#C8A96E)", border:"none", borderRadius:12, color:"#080810", cursor:"pointer", fontSize:15, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.04em" },
  checkoutWrap: { display:"grid", gridTemplateColumns:"1fr 1.5fr", gap:24, animation:"fadeUp 0.4s ease" },
  checkoutSummary: { background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:16, padding:24, height:"fit-content" },
  summaryTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#E8D5A3", marginBottom:20 },
  summaryRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #1A1A2A", fontSize:13, color:"#8A8AAA" },
  checkoutForm: { background:"#0A0A16", border:"1px solid #1E1E32", borderRadius:16, padding:24 },
  cardPreview: { background:"linear-gradient(135deg,#1A1A2A,#2A2A3A)", borderRadius:14, padding:"20px 24px", marginBottom:24, position:"relative", border:"1px solid #3A3A4A" },
  cardChip: { fontSize:24, marginBottom:16 },
  cardNumber: { fontFamily:"monospace", fontSize:16, letterSpacing:"0.15em", color:"#E8D5A3", marginBottom:16 },
  cardBottom: { display:"flex", justifyContent:"space-between", fontSize:12, color:"#8A8AAA", letterSpacing:"0.05em" },
  payBtn: { width:"100%", padding:"16px", background:"linear-gradient(135deg,#1A5C1A,#2A8C2A)", border:"none", borderRadius:10, color:"#E8F5E8", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", marginTop:8, letterSpacing:"0.04em" },
  secureText: { textAlign:"center", fontSize:11, color:"#4A4A6A", marginTop:10 },
  processingWrap: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 },
  processingOrb: { width:80, height:80, borderRadius:"50%", background:"radial-gradient(circle,#C8A96E,#8B6914)", animation:"orbPulse 1.5s ease-in-out infinite", boxShadow:"0 0 40px rgba(200,169,110,0.4)" },
  processingTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:"#E8D5A3" },
  processingText: { fontSize:14, color:"#6A6A8A" },
  planPage: { minHeight:"100vh", background:"linear-gradient(135deg,#080810 0%,#0D0D1A 100%)", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" },
  planHeader: { background:"rgba(10,10,20,0.95)", borderBottom:"1px solid #1E1E30", padding:"16px 24px", position:"sticky", top:0, zIndex:100, backdropFilter:"blur(10px)" },
  planHeaderInner: { maxWidth:960, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" },
  planLogo: { fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:"#F0E8D0", letterSpacing:"0.1em" },
  planMeta: { display:"flex", gap:16, alignItems:"center" },
  planBadge: { padding:"4px 12px", background:"rgba(200,169,110,0.15)", border:"1px solid rgba(200,169,110,0.4)", borderRadius:20, color:"#C8A96E", fontSize:12, fontWeight:600 },
  planRoute: { fontSize:13, color:"#6A6A8A" },
  planBody: { flex:1, maxWidth:960, width:"100%", margin:"0 auto", padding:"48px 32px", overflowY:"auto" },
  loadingWrap: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:20 },
  loadingOrb: { width:70, height:70, borderRadius:"50%", background:"conic-gradient(#C8A96E,#8B6914,#E8D5A3,#C8A96E)", animation:"orbPulse 2s ease-in-out infinite", boxShadow:"0 0 50px rgba(200,169,110,0.3)" },
  loadingText: { fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#E8D5A3" },
  loadingSubtext: { fontSize:14, color:"#4A4A6A" },
  planContent: { color:"#C8C8D8", lineHeight:1.8, animation:"fadeUp 0.5s ease" },
  cursor: { display:"inline", color:"#C8A96E", animation:"blink 1s step-end infinite", fontSize:18 },
  planFooter: { background:"rgba(10,10,20,0.95)", borderTop:"1px solid #1E1E30", padding:"16px 24px", display:"flex", justifyContent:"center", gap:16, backdropFilter:"blur(10px)" },
  downloadBtn: { padding:"12px 32px", background:"linear-gradient(135deg,#8B6914,#C8A96E)", border:"none", borderRadius:10, color:"#080810", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.04em" },
  newPlanBtn: { padding:"12px 32px", background:"transparent", border:"1px solid #2A2A3A", borderRadius:10, color:"#6A6A8A", cursor:"pointer", fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif" },
};

