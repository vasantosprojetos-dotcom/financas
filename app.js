/* =========================================================
   Finanças — app do casal (Fase 1)
   Código: GitHub Pages · Dados: Firebase Firestore
   ========================================================= */
import {
  initializeApp, getAuth, signInAnonymously, onAuthStateChanged,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, writeBatch
} from "./fb.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOeQ4xAZ9PXJ6RTP4Obwf-ipktXXvzVAY",
  authDomain: "financeiro-casal-d5ee5.firebaseapp.com",
  projectId: "financeiro-casal-d5ee5",
  storageBucket: "financeiro-casal-d5ee5.firebasestorage.app",
  messagingSenderId: "880759051185",
  appId: "1:880759051185:web:95edc1dfa114b8ee836390"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
let db;
try {
  db = initializeFirestore(fbApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  db = initializeFirestore(fbApp, {});
}

/* ---------------- Constantes ---------------- */
const LS = { casa: "fc_casa", eu: "fc_eu", pay: "fc_pay" };
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MES3 = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const FORMAS = ["Pix", "Débito", "Crédito", "Dinheiro", "Boleto", "Transferência"];
const CORES = ["#FF9F0A", "#5E5CE6", "#30B0C7", "#34C759", "#FF6B6B", "#BF5AF2", "#FF8FB1", "#A2845E", "#0A84FF", "#E5B800", "#8E8E93", "#0C8C95", "#1D1D1F"];
const TIPOS = { despesa: "Despesa", receita: "Receita", investimento: "Investimento" };

const cat = (id, emoji, nome, cor, subs = []) => ({ id, emoji, nome, cor, subs });
const DEFAULT_CATS = {
  despesa: [
    cat("alimentacao", "🍽️", "Alimentação", "#FF9F0A", ["Supermercado", "Restaurante", "Bar", "Lanche e café", "Delivery", "Padaria", "Feira e hortifrúti"]),
    cat("transporte", "🚗", "Transporte", "#0A84FF", ["Combustível", "Uber e 99", "Ônibus e metrô", "Estacionamento", "Manutenção do carro", "Seguro do carro", "IPVA e licenciamento", "Pedágio"]),
    cat("moradia", "🏠", "Moradia", "#5E5CE6", ["Aluguel", "Condomínio", "Luz", "Água", "Gás", "Internet", "Celular", "IPTU"]),
    cat("casa-lar", "🧺", "Casa & Lar", "#30B0C7", ["Produtos de limpeza", "Cama, mesa e banho", "Utensílios", "Manutenção e reparos", "Móveis e decoração", "Eletrodomésticos"]),
    cat("saude", "🩺", "Saúde", "#34C759", ["Plano de saúde", "Farmácia", "Consultas", "Exames", "Terapia", "Dentista", "Academia"]),
    cat("beleza", "💅", "Beleza", "#FF8FB1", ["Salão", "Depilação", "Cosméticos"]),
    cat("pets", "🐾", "Pets", "#A2845E", ["Ração", "Veterinário", "Banho e tosa", "Petiscos e brinquedos", "Medicamentos"]),
    cat("lazer", "🎟️", "Lazer", "#BF5AF2", ["Cinema e shows", "Viagens", "Passeios", "Hobbies", "Festas e eventos"]),
    cat("compras", "🛍️", "Compras", "#FF6B6B", ["Roupas", "Calçados", "Eletrônicos", "Presentes", "Acessórios"]),
    cat("educacao", "📚", "Educação", "#0C8C95", ["Cursos", "Pós-graduação", "Livros e material", "Mensalidade"]),
    cat("impostos", "🧾", "Impostos e taxas", "#8E8E93", ["Imposto de renda", "Taxas e anuidades", "Tarifas bancárias", "Juros e multas"]),
    cat("assinaturas", "🔁", "Assinaturas", "#E5B800", ["Streaming", "Música", "Apps e serviços", "Clubes"]),
    cat("outros", "✳️", "Outros", "#8E8E93", ["Doações", "Diversos"])
  ],
  receita: [
    cat("salario", "💼", "Salário", "#34C759"),
    cat("prefeitura", "🏛️", "Prefeitura de Contagem", "#0A84FF"),
    cat("col-loyola", "☀️", "Colônia Loyola", "#FF9F0A"),
    cat("col-sd", "🌈", "Colônia Santa Doroteia", "#FF8FB1"),
    cat("outros-trab", "🧑‍💼", "Outros trabalhos", "#5E5CE6"),
    cat("freela", "💻", "Freelancer", "#BF5AF2"),
    cat("rendimentos", "📈", "Rendimentos", "#0C8C95"),
    cat("restituicoes", "↩️", "Restituições", "#30B0C7"),
    cat("outras-rec", "➕", "Outras receitas", "#8E8E93")
  ],
  investimento: [
    cat("renda-fixa", "🏦", "Renda fixa", "#0C8C95", ["CDB", "LCI / LCA", "Poupança"]),
    cat("tesouro", "🏛️", "Tesouro Direto", "#0A84FF"),
    cat("acoes", "📊", "Ações e FIIs", "#5E5CE6"),
    cat("fundos", "🧺", "Fundos", "#30B0C7"),
    cat("previdencia", "🛡️", "Previdência", "#34C759"),
    cat("reserva", "🛟", "Reserva de emergência", "#FF9F0A"),
    cat("cripto", "🪙", "Cripto", "#E5B800")
  ]
};
const QUICK_DEFAULT = [
  ["alimentacao", "Lanche e café"], ["alimentacao", "Supermercado"], ["alimentacao", "Restaurante"], ["alimentacao", "Bar"],
  ["alimentacao", "Delivery"], ["transporte", "Combustível"], ["transporte", "Uber e 99"], ["saude", "Farmácia"]
];
const QUICK_EMOJI = { "Lanche e café": "☕", "Supermercado": "🛒", "Restaurante": "🍽️", "Bar": "🍻", "Delivery": "🛵", "Padaria": "🥐", "Combustível": "⛽", "Uber e 99": "🚕", "Farmácia": "💊", "Estacionamento": "🅿️" };

/* ---------------- Estado ---------------- */
const S = {
  casaId: null, cfg: null, cats: null,
  lanc: new Map(), rec: new Map(), cartoes: new Map(), contas: new Map(),
  mes: ymOf(todayStr()), view: "inicio", sub: null,
  filtro: "todos", busca: "", catTipo: "despesa",
  agrupar: (() => { try { return localStorage.getItem("fc_agrupar") || "cat"; } catch { return "cat"; } })(), fechadas: new Set(),
  pending: false, online: navigator.onLine, unsubs: []
};

/* ---------------- Utilidades ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl = (c) => fmtBRL.format((c || 0) / 100);
function pad(n) { return String(n).padStart(2, "0"); }

function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function ymOf(dateStr) { return dateStr.slice(0, 7); }
function addMonths(ym, n) {
  let [y, m] = ym.split("-").map(Number);
  m += n; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1;
  return `${y}-${pad(m)}`;
}
function diasNoMes(ym) { const [y, m] = ym.split("-").map(Number); return new Date(y, m, 0).getDate(); }
function dataNoMes(ym, dia) { return `${ym}-${pad(Math.min(Number(dia) || 1, diasNoMes(ym)))}`; }
function mesNome(ym) { return MESES[Number(ym.slice(5, 7)) - 1]; }
function mesCurto(ym) { return `${MES3[Number(ym.slice(5, 7)) - 1].toLowerCase()}/${ym.slice(2, 4)}`; }
function dataBonita(d) {
  const hoje = todayStr();
  const ontem = (() => { const x = new Date(); x.setDate(x.getDate() - 1); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; })();
  if (d === hoje) return "Hoje";
  if (d === ontem) return "Ontem";
  const [y, m, dd] = d.split("-").map(Number);
  const dt = new Date(y, m - 1, dd);
  const ano = String(y) !== hoje.slice(0, 4) ? ` de ${y}` : "";
  return `${SEMANA[dt.getDay()]}, ${dd} de ${MESES[m - 1].toLowerCase()}${ano}`;
}

/** Converte o que a pessoa digitou ("1.234,56", "8,5", "12.90") em centavos */
function parseValor(str) {
  let s = String(str || "").trim().replace(/[R$\s]/g, "");
  if (!s) return NaN;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/\.\d{1,2}$/.test(s)) { /* ponto decimal */ }
  else s = s.replace(/\./g, "");
  const v = Number(s);
  return Number.isFinite(v) ? Math.round(v * 100) : NaN;
}
const valorInput = (c) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");

/**
 * Em qual fatura (mês de vencimento) cai a parcela i de uma compra no cartão.
 * Regra: compra NO dia ou DEPOIS do "melhor dia" vai para a fatura seguinte.
 * Se o vencimento é num dia menor/igual ao melhor dia, a fatura vence no mês seguinte ao fechamento.
 */
function competenciaCartao(dataStr, cartao, i = 0) {
  const dia = Number(dataStr.slice(8, 10));
  const melhor = Number(cartao.melhorDia) || 1;
  const venc = Number(cartao.vencimento) || 1;
  let off = dia >= melhor ? 1 : 0;
  if (venc <= melhor) off += 1;
  return addMonths(ymOf(dataStr), off + i);
}
/** Divide o total em n parcelas; centavos que sobram vão para a última */
function dividir(total, n) {
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? total - base * (n - 1) : base));
}

const novoId = () => doc(collection(db, "_")).id;
const col = (nome) => collection(db, "casas", S.casaId, nome);
const ref = (nome, id) => doc(db, "casas", S.casaId, nome, id);
const eu = () => localStorage.getItem(LS.eu) || (S.cfg?.nomes?.[0] ?? "");
const nomes = () => (S.cfg?.nomes || ["", ""]).filter(Boolean);

function fire(p, msgErro = "Não consegui salvar") {
  p.catch((e) => { console.error(e); toast(`${msgErro}: ${e.code || e.message}`); });
}

function catsDe(tipo) { return S.cats?.[tipo] || []; }
function catInfo(tipo, id) {
  return catsDe(tipo).find((c) => c.id === id) || { id, emoji: "•", nome: "Sem categoria", cor: "#8E8E93", subs: [] };
}
const tint = (cor) => `${cor}1F`;

/* Lançamentos válidos (sem os "pulados") */
function lancAtivos() { return [...S.lanc.values()].filter((l) => l.status !== "pulado"); }
function lancDoMes(ym) { return lancAtivos().filter((l) => l.competencia === ym); }
function totais(ym) {
  const t = { receitas: 0, despesas: 0, investido: 0 };
  for (const l of lancDoMes(ym)) {
    if (l.tipo === "receita") t.receitas += l.valor;
    else if (l.tipo === "despesa") t.despesas += l.valor;
    else if (l.tipo === "investimento") t.investido += l.valor;
  }
  t.economia = t.receitas - t.despesas;
  t.pct = t.receitas > 0 ? t.economia / t.receitas : null;
  t.saldo = t.receitas - t.despesas - t.investido;
  return t;
}
function investidoTotal() { return lancAtivos().filter((l) => l.tipo === "investimento").reduce((s, l) => s + l.valor, 0); }

function pendentes(ym) {
  return [...S.rec.values()]
    .filter((r) => r.ativo !== false && (!r.inicio || r.inicio <= ym) && (!r.fim || r.fim >= ym) && !S.lanc.has(`rec_${r.id}_${ym}`))
    .sort((a, b) => (a.dia || 1) - (b.dia || 1));
}
function faturas(ym) {
  return [...S.cartoes.values()].sort(ordenar).map((c) => {
    const itens = lancDoMes(ym).filter((l) => l.tipo === "despesa" && l.cartaoId === c.id);
    return { cartao: c, total: itens.reduce((s, l) => s + l.valor, 0), itens, vence: dataNoMes(ym, c.vencimento) };
  });
}
const ordenar = (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || String(a.nome).localeCompare(String(b.nome));

/* ---------------- Ícones (SVG discretos) ---------------- */
const IC = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.5 12 3.8l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11"/><circle cx="4.5" cy="6.5" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="17.5" r="1" fill="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5.5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
};

/* =========================================================
   Início: autenticação e chave da casa
   ========================================================= */
const root = $("#app");
const authPronto = new Promise((res, rej) => {
  onAuthStateChanged(auth, (u) => { if (u) res(u); });
  signInAnonymously(auth).catch(rej);
});

async function hashChave(k) {
  // ignora maiúsculas, acentos e espaços extras (o corretor do iPhone não atrapalha)
  const norm = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("financas-casal|" + norm));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function boot() {
  try { await authPronto; }
  catch (e) {
    console.error(e);
    root.innerHTML = gateHTML(`<h1>Quase lá</h1><p>Não consegui conectar ao banco de dados (${esc(e.code || e.message)}). Confira a internet e se o "Acesso anônimo" está ativado no Firebase.</p><button class="btn" onclick="location.reload()">Tentar de novo</button>`);
    return;
  }
  const casa = localStorage.getItem(LS.casa);
  if (casa) entrar(casa); else telaChave();
}

function gateHTML(inner) {
  return `<div class="gate"><div class="gate-box"><img class="gate-logo" src="icons/icon-192.png" alt="">${inner}</div></div>`;
}

function telaChave() {
  root.innerHTML = gateHTML(`
    <h1>Bem-vindas</h1>
    <p>Digite a chave da casa para entrar.<br>Você só faz isso uma vez neste aparelho.</p>
    <form id="fChave">
      <div class="group">
        <label class="f full"><input id="chave" type="text" placeholder="Chave da casa" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" data-lpignore="true"></label>
      </div>
      <button class="btn" id="bEntrar">Entrar</button>
      <div class="erro hidden" id="erro"></div>
    </form>`);
  $("#fChave").onsubmit = async (e) => {
    e.preventDefault();
    const k = $("#chave").value;
    const erro = $("#erro");
    if (k.trim().length < 8) { erro.textContent = "A chave precisa ter pelo menos 8 caracteres."; erro.classList.remove("hidden"); return; }
    $("#bEntrar").disabled = true; $("#bEntrar").textContent = "Verificando…";
    try {
      const id = await hashChave(k);
      const snap = await getDoc(doc(db, "casas", id, "config", "geral"));
      if (snap.exists()) { localStorage.setItem(LS.casa, id); entrar(id); }
      else telaCriar(id, k);
    } catch (err) {
      console.error(err);
      $("#bEntrar").disabled = false; $("#bEntrar").textContent = "Entrar";
      erro.textContent = err.code === "permission-denied"
        ? "O banco ainda está trancado: faltam as regras de segurança no Firebase (veja o passo a passo que o Claude mandou)."
        : "Não consegui verificar a chave. Confira a internet e tente de novo.";
      erro.classList.remove("hidden");
    }
  };
}

function telaCriar(id, chave) {
  root.innerHTML = gateHTML(`
    <h1>Criar a casa</h1>
    <div class="aviso">Nenhuma casa usa essa chave ainda. Se é a primeira vez, confira a chave abaixo e crie a casa. Se vocês já criaram, volte e confira se ela foi digitada certinho.</div>
    <form id="fCriar">
      <div class="group">
        <label class="f"><span>Chave da casa</span><input id="chave2" type="text" value="${esc(chave)}" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
        <label class="f"><span>Nome 1</span><input id="n1" value="Vanessa"></label>
        <label class="f"><span>Nome 2</span><input id="n2" value="Ana"></label>
      </div>
      <button class="btn" id="bCriar">Criar nossa casa</button>
      <button type="button" class="btn ghost" id="bVoltar">Voltar</button>
      <div class="erro hidden" id="erro"></div>
    </form>`);
  $("#bVoltar").onclick = telaChave;
  $("#fCriar").onsubmit = async (e) => {
    e.preventDefault();
    const erro = $("#erro");
    const k2 = $("#chave2").value;
    if (k2.trim().length < 8) { erro.textContent = "A chave precisa ter pelo menos 8 caracteres."; erro.classList.remove("hidden"); return; }
    id = await hashChave(k2); // vale a chave como está escrita aqui
    $("#bCriar").disabled = true; $("#bCriar").textContent = "Criando…";
    try {
      const b = writeBatch(db);
      const n1 = $("#n1").value.trim() || "Vanessa", n2 = $("#n2").value.trim() || "Ana";
      b.set(doc(db, "casas", id, "config", "geral"), { nomes: [n1, n2], criadoEm: Date.now(), versao: 1 });
      b.set(doc(db, "casas", id, "config", "categorias"), DEFAULT_CATS);
      b.set(doc(collection(db, "casas", id, "contas")), { nome: "Conta conjunta", cor: "#5E5CE6", ordem: 0 });
      await b.commit();
      localStorage.setItem(LS.casa, id);
      localStorage.setItem(LS.eu, n1);
      entrar(id);
    } catch (err) {
      console.error(err);
      $("#bCriar").disabled = false; $("#bCriar").textContent = "Criar nossa casa";
      erro.textContent = "Não consegui criar: " + (err.code || err.message); erro.classList.remove("hidden");
    }
  };
}

/* =========================================================
   Sincronização em tempo real
   ========================================================= */
function entrar(id) {
  S.casaId = id;
  root.innerHTML = '<div class="splash"><div class="spinner"></div></div>';
  const ouvirColecao = (nome, mapa, meta) => onSnapshot(col(nome), { includeMetadataChanges: !!meta }, (snap) => {
    mapa.clear();
    snap.forEach((d) => mapa.set(d.id, { id: d.id, ...d.data() }));
    if (meta) S.pending = snap.metadata.hasPendingWrites;
    agendar();
  }, erroSync);
  S.unsubs.push(
    onSnapshot(ref("config", "geral"), (d) => { S.cfg = d.data() || { nomes: ["Vanessa", "Ana"] }; agendar(); }, erroSync),
    onSnapshot(ref("config", "categorias"), (d) => { S.cats = d.data() || DEFAULT_CATS; agendar(); }, erroSync),
    ouvirColecao("lancamentos", S.lanc, true),
    ouvirColecao("recorrentes", S.rec),
    ouvirColecao("cartoes", S.cartoes),
    ouvirColecao("contas", S.contas)
  );
}
function erroSync(e) {
  console.error(e);
  if (e.code === "permission-denied") toast("Sem permissão no banco. Confira as regras de segurança do Firebase.");
}
window.addEventListener("online", () => { S.online = true; agendar(); });
window.addEventListener("offline", () => { S.online = false; agendar(); });

let agendado = false;
function agendar() {
  if (agendado) return;
  agendado = true;
  requestAnimationFrame(() => { agendado = false; render(); });
}

/* =========================================================
   Renderização principal
   ========================================================= */
let ultimoMesRender = null;
function render() {
  if (!S.cfg || !S.cats) return;
  // preserva foco/scroll das abas de mês
  const ativo = document.activeElement;
  const focoId = ativo && root.contains(ativo) ? ativo.id : null;
  const sel = focoId && ativo.selectionStart != null ? [ativo.selectionStart, ativo.selectionEnd] : null;
  const scrollMeses = $(".months")?.scrollLeft;

  root.innerHTML = `<div class="shell">${topo()}<main id="view">${conteudo()}</main></div>${tabbar()}`;

  const meses = $(".months");
  if (meses) {
    if (ultimoMesRender !== S.mes || scrollMeses == null) {
      const on = $(".month.on", meses);
      if (on) meses.scrollLeft = on.offsetLeft - meses.clientWidth / 2 + on.clientWidth / 2;
    } else meses.scrollLeft = scrollMeses;
  }
  ultimoMesRender = S.mes;
  if (focoId) { const el = document.getElementById(focoId); if (el) { el.focus({ preventScroll: true }); if (sel) try { el.setSelectionRange(...sel); } catch (_) {} } }
}

function saudacao() {
  const h = new Date().getHours();
  return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
function statusSync() {
  if (!S.online) return ["offline", "Sem internet — salva no aparelho e sincroniza depois"];
  if (S.pending) return ["salvando", "Sincronizando…"];
  return ["", "Sincronizado"];
}

function topo() {
  const [cls, txt] = statusSync();
  const titulos = { inicio: null, lanc: "Lançamentos", fixas: "Fixas do mês", mais: "Mais" };
  const ano = S.mes.slice(0, 4);
  const anoAtual = todayStr().slice(0, 4);
  const titulo = S.view === "inicio"
    ? `${mesNome(S.mes)}${ano !== anoAtual ? ` <small>${ano}</small>` : ""}`
    : titulos[S.view];
  const sub = S.view === "inicio" ? `${saudacao()}, ${esc(nomes().join(" & "))}` : `${mesNome(S.mes)} de ${ano}`;
  const hojeBtn = S.mes !== ymOf(todayStr()) ? `<button class="pill-btn" data-a="hoje">Hoje</button>` : "";
  const acao = S.view === "lanc" ? `<button class="pill-btn" data-a="novo">${IC.plus.replace("<svg", '<svg width="14" height="14"')} Novo</button>`
    : S.view === "fixas" ? `<button class="pill-btn" data-a="nova-fixa">${IC.plus.replace("<svg", '<svg width="14" height="14"')} Nova</button>` : "";
  const semMeses = S.view === "mais" && S.sub !== "cartoes";
  return `<header class="top">
    <div class="top-row">
      <div>
        <div class="greet"><i class="sync ${cls}" title="${txt}"></i>${sub}</div>
        <h1 class="title">${titulo}</h1>
      </div>
      <div class="top-actions">${hojeBtn}${acao}</div>
    </div>
    ${semMeses ? "" : `<nav class="months">${abasMeses()}</nav>`}
  </header>`;
}

function abasMeses() {
  const atual = ymOf(todayStr());
  let ini = addMonths(atual, -6), fim = addMonths(atual, 6);
  for (const l of S.lanc.values()) {
    if (!l.competencia) continue;
    if (l.competencia < ini) ini = l.competencia;
    if (l.competencia > fim) fim = l.competencia;
  }
  if (S.mes < ini) ini = S.mes;
  if (S.mes > fim) fim = S.mes;
  const out = [];
  for (let m = ini; m <= fim; m = addMonths(m, 1)) {
    out.push(`<button class="month${m === S.mes ? " on" : ""}${m === atual ? " now" : ""}" data-a="mes" data-v="${m}"><b>${MES3[Number(m.slice(5)) - 1]}</b><span>${m.slice(0, 4)}</span></button>`);
  }
  return out.join("");
}

function tabbar() {
  const t = (v, ic, nome) => `<button class="tab${S.view === v ? " on" : ""}" data-a="view" data-v="${v}">${ic}<span>${nome}</span></button>`;
  return `<nav class="tabbar"><div class="tabbar-in">
    ${t("inicio", IC.home, "Início")}${t("lanc", IC.list, "Lançamentos")}
    <button class="fab" data-a="rapido" aria-label="Lançamento rápido">${IC.plus}</button>
    ${t("fixas", IC.repeat, "Fixas")}${t("mais", IC.more, "Mais")}
  </div></nav>`;
}

function conteudo() {
  if (S.view === "lanc") return viewLanc();
  if (S.view === "fixas") return viewFixas();
  if (S.view === "mais") return viewMais();
  return viewInicio();
}

/* ---------------- Início (dashboard) ---------------- */
function viewInicio() {
  const t = totais(S.mes);
  const mesTxt = mesNome(S.mes).toLowerCase();
  const pctTxt = t.pct == null ? "" : `<span class="chip-pct${t.pct < 0 ? " neg" : ""}">${Math.round(t.pct * 100)}%</span>`;
  const base = Math.max(t.receitas, t.despesas + t.investido, 1);
  const barra = t.receitas || t.despesas || t.investido ? `
    <div class="hero-bar">
      <i style="width:${(t.despesas / base) * 100}%;background:var(--red)"></i>
      <i style="width:${(t.investido / base) * 100}%;background:var(--teal)"></i>
      <i style="width:${(Math.max(t.saldo, 0) / base) * 100}%;background:var(--green)"></i>
    </div>
    <div class="hero-legend"><span style="--c:var(--red)">Gasto</span><span style="--c:var(--teal)">Investido</span><span style="--c:var(--green)">Sobra</span></div>` : "";

  const colunaA = `
    <section class="card hero">
      <div class="label">Saldo disponível em ${mesTxt}</div>
      <div class="big num${t.saldo < 0 ? " neg" : ""}">${brl(t.saldo)}</div>
      <div class="sub">Receitas − despesas − investimentos do mês</div>
      ${barra}
    </section>
    <div class="tiles">
      <div class="tile" style="--c:var(--green)"><div class="t-l"><i></i>Receitas</div><div class="t-v num">${brl(t.receitas)}</div></div>
      <div class="tile" style="--c:var(--red)"><div class="t-l"><i></i>Despesas</div><div class="t-v num">${brl(t.despesas)}</div></div>
      <div class="tile" style="--c:var(--accent)"><div class="t-l"><i></i>Economia ${pctTxt}</div><div class="t-v num">${brl(t.economia)}</div><div class="t-s">${t.pct == null ? "sem receitas no mês" : "da renda economizada"}</div></div>
      <div class="tile invest" style="--c:var(--teal)"><div class="t-l"><i></i>Investido</div><div class="t-v num">${brl(t.investido)}</div><div class="t-s">Total acumulado: ${brl(investidoTotal())}</div></div>
    </div>
    ${cardCategorias()}`;

  const colunaB = `${cardPendencias()}${cardFaturas()}${cardRecentes()}`;
  return `<div class="dash"><div>${colunaA}</div><div>${colunaB}</div></div>`;
}

function cardCategorias() {
  const desp = lancDoMes(S.mes).filter((l) => l.tipo === "despesa");
  if (!desp.length) return "";
  const por = new Map();
  desp.forEach((l) => por.set(l.catId, (por.get(l.catId) || 0) + l.valor));
  const total = desp.reduce((s, l) => s + l.valor, 0);
  const lista = [...por.entries()].sort((a, b) => b[1] - a[1]);
  const max = lista[0][1];
  const linhas = lista.slice(0, 7).map(([id, v]) => {
    const c = catInfo("despesa", id);
    return `<div class="bar-row" style="--c:${c.cor}">
      <div class="b-ico">${c.emoji}</div>
      <div><div class="b-name"><span>${esc(c.nome)}</span><span class="muted">${Math.round((v / total) * 100)}%</span></div><div class="b-track"><div class="b-fill" style="width:${(v / max) * 100}%"></div></div></div>
      <div class="b-v num">${brl(v)}</div></div>`;
  }).join("");
  return `<section class="card"><div class="card-h"><h3>Gastos por categoria</h3></div><div class="bars">${linhas}</div></section>`;
}

function cardPendencias() {
  const pend = pendentes(S.mes);
  const hoje = todayStr();
  if (!pend.length && !S.rec.size) return "";
  const linhas = pend.map((r) => {
    const d = dataNoMes(S.mes, r.dia);
    const c = catInfo(r.tipo, r.catId);
    const atrasada = d < hoje && r.tipo === "despesa";
    return `<div class="pend${atrasada ? " late" : ""}">
      <div class="when"><b>${Number(d.slice(8))}</b><span>${MES3[Number(d.slice(5, 7)) - 1]}</span></div>
      <button class="row-main" style="text-align:left" data-a="abrir-pend" data-v="${r.id}">
        <div class="row-t">${c.emoji} ${esc(r.desc)}</div>
        <div class="row-s">${r.tipo === "receita" ? "A receber" : r.tipo === "investimento" ? "A investir" : "A pagar"} · ${brl(r.valor)}</div>
      </button>
      <button class="skip-btn" data-a="pular" data-v="${r.id}">Pular</button>
      <button class="ok-btn" data-a="confirmar" data-v="${r.id}" aria-label="Confirmar">✓</button>
    </div>`;
  }).join("");
  return `<section class="card"><div class="card-h"><h3>Fixas para confirmar</h3><button class="link" data-a="view" data-v="fixas">Ver todas</button></div>
    ${linhas || `<div class="empty" style="padding:10px"><b>Tudo confirmado ✨</b>As fixas deste mês já foram lançadas.</div>`}</section>`;
}

function cardFaturas() {
  const fs = faturas(S.mes);
  if (!fs.length) return `<section class="card"><div class="card-h"><h3>Cartões</h3></div>
    <div class="empty" style="padding:8px 4px 4px"><b>Nenhum cartão ainda</b>Cadastre seus cartões para as parcelas caírem na fatura certa.<br><br><button class="btn ghost" data-a="ir-cartoes" style="box-shadow:var(--shadow)">Cadastrar cartão</button></div></section>`;
  const total = fs.reduce((s, f) => s + f.total, 0);
  const linhas = fs.map((f) => linhaFatura(f)).join("");
  return `<section class="card"><div class="card-h"><h3>Faturas de ${mesNome(S.mes).toLowerCase()}</h3><span class="num" style="font-weight:600">${brl(total)}</span></div>${linhas}</section>`;
}
function linhaFatura(f) {
  const c = f.cartao;
  const lim = Number(c.limite) || 0;
  const [dd, mm] = [f.vence.slice(8), f.vence.slice(5, 7)];
  return `<button class="fat" data-a="fatura" data-v="${c.id}" style="--c:${c.cor || "#5E5CE6"}">
    <div class="cc"></div>
    <div class="row-main"><div class="row-t">${esc(c.nome)}</div><div class="row-s">Vence ${dd}/${mm} · ${f.itens.length} ${f.itens.length === 1 ? "lançamento" : "lançamentos"}</div>
    ${lim ? `<div class="limit"><i style="width:${Math.min(100, (f.total / lim) * 100)}%"></i></div>` : ""}</div>
    <div class="row-v num">${brl(f.total)}</div></button>`;
}

function cardRecentes() {
  const lista = lancDoMes(S.mes).filter((l) => l.tipo === "despesa").sort(ordemLanc).slice(0, 6);
  const corpo = lista.length ? `<div class="list">${lista.map(linhaLanc).join("")}</div>`
    : `<div class="empty"><div class="e-ico">☕️</div><b>Nenhuma despesa em ${mesNome(S.mes).toLowerCase()}</b>Toque no + para lançar a primeira.</div>`;
  return `<section class="card"><div class="card-h"><h3>Despesas recentes</h3>${lista.length ? `<button class="link" data-a="view" data-v="lanc">Ver todas</button>` : ""}</div>${corpo}</section>`;
}

const ordemLanc = (a, b) => (b.data || "").localeCompare(a.data || "") || (b.criadoEm || 0) - (a.criadoEm || 0);

function linhaLanc(l) {
  const c = catInfo(l.tipo, l.catId);
  const detalhes = [l.desc ? (l.sub || c.nome) : c.nome];
  if (l.cartaoId) detalhes.push(S.cartoes.get(l.cartaoId)?.nome || "Cartão");
  else if (l.forma) detalhes.push(l.forma);
  if (nomes().length > 1 && l.quem) detalhes.push(l.quem);
  const parc = l.parcelas > 1 ? `<span class="tag">${l.parcela}/${l.parcelas}</span>` : "";
  const fixa = l.recId ? `<span class="tag">fixa</span>` : "";
  const sinal = l.tipo === "receita" ? "+" : l.tipo === "despesa" ? "−" : "";
  const cls = l.tipo === "receita" ? " rec" : l.tipo === "investimento" ? " inv" : "";
  return `<button class="row" data-a="editar" data-v="${l.id}">
    <div class="ico" style="--tint:${tint(c.cor)}">${c.emoji}</div>
    <div class="row-main"><div class="row-t">${esc(l.desc || l.sub || c.nome)}${parc}${fixa}</div><div class="row-s">${esc(detalhes.join(" · "))}</div></div>
    <div class="row-v num${cls}">${sinal} ${brl(l.valor)}</div></button>`;
}

/* ---------------- Lançamentos ---------------- */
function viewLanc() {
  const t = totais(S.mes);
  let lista = lancDoMes(S.mes);
  if (S.filtro !== "todos") lista = lista.filter((l) => l.tipo === S.filtro);
  const q = S.busca.trim().toLowerCase();
  if (q) lista = lista.filter((l) => {
    const c = catInfo(l.tipo, l.catId);
    return [l.desc, l.sub, c.nome, l.obs, l.forma, S.cartoes.get(l.cartaoId)?.nome].some((x) => String(x || "").toLowerCase().includes(q));
  });
  lista.sort(ordemLanc);

  const vazio = `<div class="card empty"><div class="e-ico">🗂️</div><b>${q ? "Nada encontrado" : "Nenhum lançamento"}</b>${q ? "Tente outra palavra." : `Ainda não há lançamentos em ${mesNome(S.mes).toLowerCase()}.`}</div>`;
  let corpo;
  if (!lista.length) corpo = vazio;
  else if (S.agrupar === "data") {
    const grupos = new Map();
    lista.forEach((l) => { const k = l.data || ""; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(l); });
    corpo = [...grupos.entries()].map(([d, ls]) => {
      const soma = ls.reduce((s, l) => s + (l.tipo === "receita" ? l.valor : l.tipo === "despesa" ? -l.valor : 0), 0);
      return `<div class="day-h"><span>${esc(dataBonita(d))}</span>${soma ? `<span class="num">${soma > 0 ? "+" : "−"} ${brl(Math.abs(soma))}</span>` : ""}</div>
        <div class="day-card list">${ls.map(linhaLanc).join("")}</div>`;
    }).join("");
  } else {
    // Por categoria: despesas primeiro (maior gasto no topo), depois receitas e investimentos
    const ordemTipo = { despesa: 0, receita: 1, investimento: 2 };
    const grupos = new Map();
    lista.forEach((l) => { const k = `${l.tipo}|${l.catId}`; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(l); });
    const totTipo = { despesa: t.despesas, receita: t.receitas, investimento: t.investido };
    const titulos = { despesa: "Despesas", receita: "Receitas", investimento: "Investimentos" };
    const ordenados = [...grupos.entries()].map(([k, ls]) => ({ k, tipo: ls[0].tipo, cat: catInfo(ls[0].tipo, ls[0].catId), ls, total: ls.reduce((s, l) => s + l.valor, 0) }))
      .sort((a, b) => ordemTipo[a.tipo] - ordemTipo[b.tipo] || b.total - a.total);
    let tipoAtual = null;
    corpo = ordenados.map((g) => {
      const cab = S.filtro === "todos" && g.tipo !== tipoAtual ? `<div class="section-label">${titulos[g.tipo]}</div>` : "";
      tipoAtual = g.tipo;
      const pct = totTipo[g.tipo] ? Math.round((g.total / totTipo[g.tipo]) * 100) : 0;
      const fechado = S.fechadas.has(g.k);
      const cls = g.tipo === "receita" ? " rec" : g.tipo === "investimento" ? " inv" : "";
      return `${cab}<section class="cat-g${fechado ? " fechado" : ""}" style="--c:${g.cat.cor}">
        <button class="cat-h" data-a="toggle-cat" data-v="${esc(g.k)}">
          <div class="ico" style="--tint:${tint(g.cat.cor)}">${g.cat.emoji}</div>
          <div class="row-main"><div class="row-t">${esc(g.cat.nome)}</div>
            <div class="row-s">${g.ls.length} ${g.ls.length === 1 ? "lançamento" : "lançamentos"} · ${pct}%</div>
            <div class="cat-bar"><i style="width:${pct}%"></i></div></div>
          <div class="row-v num${cls}">${brl(g.total)}</div><span class="chev cat-chev">›</span>
        </button>
        <div class="cat-b list">${g.ls.map(linhaLanc).join("")}</div>
      </section>`;
    }).join("");
  }

  const f = (v, n) => `<button class="${S.filtro === v ? "on" : ""}" data-a="filtro" data-v="${v}">${n}</button>`;
  return `
    <div class="sumline">
      <div><small>Receitas</small><b class="num" style="color:var(--green)">${brl(t.receitas)}</b></div>
      <div><small>Despesas</small><b class="num" style="color:var(--red)">${brl(t.despesas)}</b></div>
      <div><small>Investido</small><b class="num" style="color:var(--teal)">${brl(t.investido)}</b></div>
    </div>
    <div class="seg">${f("todos", "Todos")}${f("despesa", "Despesas")}${f("receita", "Receitas")}${f("investimento", "Invest.")}</div>
    <div class="agrupar"><span>Agrupar por</span><div class="seg mini"><button class="${S.agrupar !== "data" ? "on" : ""}" data-a="agrupar" data-v="cat">Categoria</button><button class="${S.agrupar === "data" ? "on" : ""}" data-a="agrupar" data-v="data">Data</button></div></div>
    <label class="search">${IC.search}<input id="busca" type="search" placeholder="Buscar" value="${esc(S.busca)}" autocomplete="off"></label>
    ${corpo}`;
}

/* ---------------- Fixas (recorrentes) ---------------- */
function viewFixas() {
  const pend = pendentes(S.mes);
  const todas = [...S.rec.values()].sort((a, b) => (a.dia || 0) - (b.dia || 0));
  const confirmadas = todas.filter((r) => S.lanc.has(`rec_${r.id}_${S.mes}`));
  const linhaFixa = (r, extra = "") => {
    const c = catInfo(r.tipo, r.catId);
    const st = S.lanc.get(`rec_${r.id}_${S.mes}`);
    const status = st ? (st.status === "pulado" ? `<span class="tag">pulada</span>` : `<span class="tag" style="background:var(--green-soft);color:var(--green)">lançada</span>`) : "";
    return `<button class="row" data-a="editar-fixa" data-v="${r.id}">
      <div class="ico" style="--tint:${tint(c.cor)}">${c.emoji}</div>
      <div class="row-main"><div class="row-t">${esc(r.desc)}${status}${r.ativo === false ? `<span class="tag">pausada</span>` : ""}</div>
      <div class="row-s">Todo dia ${r.dia} · ${esc(r.sub || c.nome)}${extra}</div></div>
      <div class="row-v num${r.tipo === "receita" ? " rec" : r.tipo === "investimento" ? " inv" : ""}">${brl(r.valor)}</div><span class="chev">›</span></button>`;
  };
  const blocoPend = pend.length ? `<div class="section-label">Para confirmar em ${mesNome(S.mes).toLowerCase()}</div>
    <div class="card" style="padding:4px 16px">${pend.map((r) => {
      const d = dataNoMes(S.mes, r.dia); const c = catInfo(r.tipo, r.catId);
      return `<div class="pend${d < todayStr() && r.tipo === "despesa" ? " late" : ""}"><div class="when"><b>${Number(d.slice(8))}</b><span>${MES3[Number(d.slice(5, 7)) - 1]}</span></div>
      <button class="row-main" style="text-align:left" data-a="abrir-pend" data-v="${r.id}"><div class="row-t">${c.emoji} ${esc(r.desc)}</div><div class="row-s">${brl(r.valor)} · toque para ajustar o valor</div></button>
      <button class="skip-btn" data-a="pular" data-v="${r.id}">Pular</button><button class="ok-btn" data-a="confirmar" data-v="${r.id}">✓</button></div>`;
    }).join("")}</div>` : (todas.length ? `<div class="card empty"><div class="e-ico">✨</div><b>Tudo em dia</b>Todas as fixas de ${mesNome(S.mes).toLowerCase()} já foram lançadas.</div>` : "");

  // Fixas agrupadas por categoria (despesas, receitas, investimentos), maior total primeiro
  const ordemTipo = { despesa: 0, receita: 1, investimento: 2 };
  const titulosFx = { despesa: "Despesas fixas", receita: "Receitas fixas", investimento: "Investimentos fixos" };
  const gruposFx = new Map();
  todas.forEach((r) => { const k = `fx|${r.tipo}|${r.catId}`; if (!gruposFx.has(k)) gruposFx.set(k, []); gruposFx.get(k).push(r); });
  const totFx = {}; todas.filter((r) => r.ativo !== false).forEach((r) => (totFx[r.tipo] = (totFx[r.tipo] || 0) + r.valor));
  let tipoFx = null;
  const blocosFx = [...gruposFx.entries()].map(([k, rs]) => ({ k, tipo: rs[0].tipo, cat: catInfo(rs[0].tipo, rs[0].catId), rs, total: rs.filter((r) => r.ativo !== false).reduce((x, r) => x + r.valor, 0) }))
    .sort((a, b) => ordemTipo[a.tipo] - ordemTipo[b.tipo] || b.total - a.total)
    .map((g) => {
      const cab = g.tipo !== tipoFx ? `<div class="section-label" style="display:flex;justify-content:space-between"><span>${titulosFx[g.tipo]}</span><span class="num">${brl(totFx[g.tipo] || 0)}/mês</span></div>` : "";
      tipoFx = g.tipo;
      const pct = totFx[g.tipo] ? Math.round((g.total / totFx[g.tipo]) * 100) : 0;
      const cls = g.tipo === "receita" ? " rec" : g.tipo === "investimento" ? " inv" : "";
      return `${cab}<section class="cat-g${S.fechadas.has(g.k) ? " fechado" : ""}" style="--c:${g.cat.cor}">
        <button class="cat-h" data-a="toggle-cat" data-v="${esc(g.k)}">
          <div class="ico" style="--tint:${tint(g.cat.cor)}">${g.cat.emoji}</div>
          <div class="row-main"><div class="row-t">${esc(g.cat.nome)}</div>
            <div class="row-s">${g.rs.length} ${g.rs.length === 1 ? "fixa" : "fixas"} · ${pct}%</div>
            <div class="cat-bar"><i style="width:${pct}%"></i></div></div>
          <div class="row-v num${cls}">${brl(g.total)}</div><span class="chev cat-chev">›</span>
        </button>
        <div class="cat-b list">${g.rs.map((r) => linhaFixa(r)).join("")}</div>
      </section>`;
    }).join("");
  const lista = todas.length ? blocosFx + `
    <p class="help">Cada fixa gera exatamente uma pendência por mês. Ao confirmar (✓), ela vira um lançamento e some da lista até o mês seguinte. "Pular" serve para meses em que ela não acontece.</p>`
    : `<div class="card empty"><div class="e-ico">🔁</div><b>Nenhuma conta fixa ainda</b>Cadastre salário, aluguel, internet, assinaturas…<br>Elas aparecem todo mês para você confirmar com um toque.<br><br><button class="btn" data-a="nova-fixa">Cadastrar a primeira</button></div>`;
  return blocoPend + lista + (confirmadas.length ? "" : "");
}

/* ---------------- Mais ---------------- */
function viewMais() {
  if (S.sub === "cartoes") return pageCartoes();
  if (S.sub === "contas") return pageContas();
  if (S.sub === "categorias") return pageCategorias();
  if (S.sub === "ajustes") return pageAjustes();
  if (S.sub === "backup") return pageBackup();
  const item = (sub, emoji, cor, t, s) => `<button class="row" data-a="sub" data-v="${sub}"><div class="ico" style="--tint:${tint(cor)}">${emoji}</div><div class="row-main"><div class="row-t">${t}</div><div class="row-s">${s}</div></div><span class="chev">›</span></button>`;
  return `<div class="menu">
      ${item("cartoes", "💳", "#5E5CE6", "Cartões de crédito", `${S.cartoes.size} cadastrado${S.cartoes.size === 1 ? "" : "s"} · faturas e melhor dia`)}
      ${item("contas", "🏦", "#0C8C95", "Contas", `${S.contas.size} cadastrada${S.contas.size === 1 ? "" : "s"}`)}
      ${item("categorias", "🏷️", "#FF9F0A", "Categorias", "Editar categorias e subcategorias")}
    </div>
    <div class="menu">
      ${item("ajustes", "👋", "#34C759", "Nomes e aparelho", "Saudação e quem usa este aparelho")}
      ${item("backup", "📦", "#30B0C7", "Backup e exportação", "Baixar cópia, exportar CSV, restaurar")}
    </div>
    <div class="menu"><button class="row" data-a="sair"><div class="ico" style="--tint:${tint("#E0574F")}">🚪</div><div class="row-main"><div class="row-t" style="color:var(--red)">Sair desta casa neste aparelho</div><div class="row-s">Os dados continuam salvos; basta digitar a chave de novo</div></div></button></div>
    <p class="help" style="text-align:center">Finanças · versão 1.8 (Fase 1)</p>`;
}
const voltar = `<button class="back" data-a="sub" data-v="">‹ Mais</button>`;

function pageCartoes() {
  const fs = faturas(S.mes);
  return `${voltar}
    <div class="card" style="padding:4px 16px">${fs.length ? fs.map(linhaFatura).join("") : `<div class="empty"><b>Nenhum cartão</b>Cadastre para controlar faturas e parcelas.</div>`}</div>
    <button class="btn" data-a="novo-cartao">Adicionar cartão</button>
    <p class="help">Valores das faturas de ${mesNome(S.mes).toLowerCase()} (troque o mês nas abas acima). Toque num cartão para ver os lançamentos da fatura ou editar os dados dele.</p>`;
}
function pageContas() {
  const cs = [...S.contas.values()].sort(ordenar);
  return `${voltar}<div class="card" style="padding:2px 16px"><div class="list">${cs.map((c) => `<button class="row" data-a="editar-conta" data-v="${c.id}"><div class="ico" style="--tint:${tint(c.cor || "#5E5CE6")}">🏦</div><div class="row-main"><div class="row-t">${esc(c.nome)}</div></div><span class="chev">›</span></button>`).join("") || `<div class="empty">Nenhuma conta.</div>`}</div></div>
    <button class="btn" data-a="nova-conta">Adicionar conta</button>
    <p class="help">Contas são de onde o dinheiro sai ou para onde entra (conta corrente, carteira, conta de cada uma…). Servem para filtrar e organizar os lançamentos.</p>`;
}
function pageCategorias() {
  const f = (v, n) => `<button class="${S.catTipo === v ? "on" : ""}" data-a="cat-tipo" data-v="${v}">${n}</button>`;
  const lista = catsDe(S.catTipo).map((c) => `<button class="row" data-a="editar-cat" data-v="${c.id}"><div class="ico" style="--tint:${tint(c.cor)}">${c.emoji}</div><div class="row-main"><div class="row-t">${esc(c.nome)}</div><div class="row-s">${c.subs?.length ? esc(c.subs.join(", ")) : "Sem subcategorias"}</div></div><span class="chev">›</span></button>`).join("");
  return `${voltar}<div class="seg" style="margin-bottom:14px">${f("despesa", "Despesas")}${f("receita", "Receitas")}${f("investimento", "Investimentos")}</div>
    <div class="card" style="padding:2px 16px"><div class="list">${lista}</div></div>
    <button class="btn" data-a="nova-cat">Nova categoria</button>`;
}
function pageAjustes() {
  const ns = S.cfg.nomes || ["", ""];
  const meu = eu();
  return `${voltar}
    <div class="section-label">Saudação</div>
    <div class="group"><label class="f"><span>Nome 1</span><input id="aj-n1" value="${esc(ns[0] || "")}"></label><label class="f"><span>Nome 2</span><input id="aj-n2" value="${esc(ns[1] || "")}"></label></div>
    <button class="btn" data-a="salvar-nomes">Salvar nomes</button>
    <div class="section-label">Quem usa este aparelho?</div>
    <div class="seg">${nomes().map((n) => `<button class="${n === meu ? "on" : ""}" data-a="eu" data-v="${esc(n)}">${esc(n)}</button>`).join("")}</div>
    <p class="help">Assim cada lançamento mostra quem lançou. Cada uma escolhe o próprio nome no seu celular.</p>`;
}
function pageBackup() {
  return `${voltar}
    <div class="card"><div class="card-h"><h3>Cópia de segurança</h3></div>
      <p class="help" style="margin:0 0 14px">Baixa um arquivo com absolutamente tudo (lançamentos, fixas, cartões, contas e categorias). Guarde onde quiser, por tranquilidade.</p>
      <button class="btn" data-a="backup-json">Baixar cópia completa</button></div>
    <div class="card"><div class="card-h"><h3>Exportar para planilha</h3></div>
      <p class="help" style="margin:0 0 14px">Arquivo CSV que abre no Excel, Numbers ou Google Planilhas. A exportação em Excel com abas e gráficos chega na Fase 2.</p>
      <button class="btn ghost" style="box-shadow:inset 0 0 0 1px var(--line)" data-a="export-csv">Exportar lançamentos (CSV)</button></div>
    <div class="card"><div class="card-h"><h3>Restaurar uma cópia</h3></div>
      <p class="help" style="margin:0 0 14px">Escolha um arquivo de cópia baixado antes. Nada é apagado: os itens da cópia são regravados por cima dos atuais.</p>
      <label class="btn ghost" style="box-shadow:inset 0 0 0 1px var(--line);cursor:pointer">Escolher arquivo<input type="file" id="restaurar" accept=".json,application/json" hidden></label></div>`;
}

/* =========================================================
   Folhas (sheets), diálogos e avisos
   ========================================================= */
const sheetRoot = $("#sheet-root");
let sheetFechar = null;
function abrirSheet({ titulo, corpo, esquerda = "Cancelar", direita = null, onDireita = null, onMontar = null }) {
  fecharSheet(true);
  sheetRoot.innerHTML = `<div class="overlay"></div><div class="sheet" role="dialog" aria-label="${esc(titulo)}">
    <div class="sheet-h"><button class="l" data-s="fechar">${esquerda}</button><h2>${esc(titulo)}</h2>${direita ? `<button class="r" data-s="ok">${direita}</button>` : "<span></span>"}</div>
    <div class="sheet-b">${corpo}</div>
    ${direita ? `<div class="sheet-f"><button class="btn" data-s="ok2">${direita}</button></div>` : ""}</div>`;
  const ov = $(".overlay", sheetRoot), sh = $(".sheet", sheetRoot);
  requestAnimationFrame(() => { ov.classList.add("in"); sh.classList.add("in"); });
  ov.onclick = () => fecharSheet();
  $('[data-s="fechar"]', sh).onclick = () => fecharSheet();
  if (direita) { $('[data-s="ok"]', sh).onclick = () => onDireita?.(); $('[data-s="ok2"]', sh).onclick = () => onDireita?.(); }
  ajustarSheet();
  travarPagina(true);
  onMontar?.(sh);
  return sh;
}
/* Coloca o cursor no campo só depois que a janela terminou de subir
   (se o campo estiver fora da tela, o iPhone rola tudo para mostrá-lo) */
function focarDepois(el, ms = 460) {
  if (!el) return;
  setTimeout(() => { if (document.contains(el)) { el.focus({ preventScroll: true }); ajustarSheet(); } }, ms);
}

/* Trava a página de fundo (no iPhone, rolar o fundo desalinha os toques) */
let travadaEm = null;
function travarPagina(on) {
  const b = document.body;
  if (on && travadaEm === null) {
    travadaEm = window.scrollY;
    Object.assign(b.style, { position: "fixed", top: `-${travadaEm}px`, left: "0", right: "0", width: "100%", overflow: "hidden" });
  } else if (!on && travadaEm !== null) {
    const y = travadaEm; travadaEm = null;
    Object.assign(b.style, { position: "", top: "", left: "", right: "", width: "", overflow: "" });
    window.scrollTo(0, y);
  }
}

/* iPhone: mantém a folha inteira visível acima do teclado (o topo nunca some) */
function ajustarSheet() {
  const sh = $(".sheet", sheetRoot);
  const vv = window.visualViewport;
  if (!sh || !vv) return;
  if (window.innerWidth >= 700) { sh.style.top = sh.style.bottom = sh.style.height = ""; return; }
  // A folha fica presa no TOPO: abrir/fechar o teclado só muda a altura,
  // nada se mexe debaixo do dedo (evita tocar numa linha e abrir a de baixo).
  const teclado = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  sh.style.bottom = `${teclado}px`;
  sh.style.top = vv.offsetTop > 0 ? `${vv.offsetTop + 12}px` : "";
}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", ajustarSheet);
  window.visualViewport.addEventListener("scroll", ajustarSheet);
}
document.addEventListener("focusout", () => setTimeout(ajustarSheet, 60));

function fecharSheet(imediato = false) {
  const ov = $(".overlay", sheetRoot), sh = $(".sheet", sheetRoot);
  if (!sh) return;
  travarPagina(false);
  if (imediato) { sheetRoot.innerHTML = ""; return; }
  ov.classList.remove("in"); sh.classList.remove("in");
  setTimeout(() => { if ($(".sheet", sheetRoot) === sh) sheetRoot.innerHTML = ""; }, 350);
}

function perguntar(titulo, msg, botoes) {
  return new Promise((res) => {
    const dr = $("#dialog-root");
    dr.innerHTML = `<div class="dlg-wrap"><div class="dlg"><div class="dlg-c"><h4>${esc(titulo)}</h4>${msg ? `<p>${esc(msg)}</p>` : ""}</div>
      <div class="dlg-b">${botoes.map((b, i) => `<button data-i="${i}" class="${b.estilo || ""}">${esc(b.t)}</button>`).join("")}</div></div></div>`;
    $$("[data-i]", dr).forEach((b) => (b.onclick = () => { dr.innerHTML = ""; res(botoes[Number(b.dataset.i)].v); }));
  });
}

let toastTimer;
function toast(msg, desfazer) {
  const tr = $("#toast-root");
  clearTimeout(toastTimer);
  tr.innerHTML = `<div class="toast"><span>${esc(msg)}</span>${desfazer ? `<button>Desfazer</button>` : ""}</div>`;
  if (desfazer) $("button", tr).onclick = () => { desfazer(); tr.innerHTML = ""; };
  toastTimer = setTimeout(() => { const t = $(".toast", tr); if (t) { t.classList.add("out"); setTimeout(() => (tr.innerHTML = ""), 260); } }, desfazer ? 5000 : 2600);
}

/* ---------------- Formulário completo de lançamento ---------------- */
/**
 * modo: "novo" | "unico" (editar lançamento simples) | "compra" (editar compra parcelada inteira)
 *       | "parcela" (editar só uma parcela) | "rec" (confirmar uma fixa do mês)
 */
function formLanc({ modo = "novo", orig = null, preset = {} } = {}) {
  const b = { ...preset };
  if (orig) Object.assign(b, orig);
  const cartoes = [...S.cartoes.values()].sort(ordenar);
  const contas = [...S.contas.values()].sort(ordenar);
  const f = {
    tipo: b.tipo || "despesa",
    valor: modo === "compra" ? b.valorTotal : b.valor,
    desc: b.desc || "",
    data: b.data || todayStr(),
    catId: b.catId || "",
    sub: b.sub || "",
    forma: b.forma || (b.tipo === "receita" ? "Transferência" : "Pix"),
    contaId: b.contaId || contas[0]?.id || "",
    cartaoId: b.cartaoId || cartoes[0]?.id || "",
    parcelas: modo === "compra" ? b.parcelas : 1,
    obs: b.obs || "",
    quem: b.quem || eu()
  };
  if (!f.catId || !catsDe(f.tipo).some((c) => c.id === f.catId)) { f.catId = catsDe(f.tipo)[0]?.id || ""; }

  const travado = modo === "parcela" || modo === "rec";
  const titulo = { novo: "Novo lançamento", unico: "Editar lançamento", compra: "Editar compra", parcela: `Editar parcela ${b.parcela}/${b.parcelas}`, rec: "Confirmar fixa" }[modo];

  const corpoHTML = () => {
    const c = catInfo(f.tipo, f.catId);
    const credito = f.tipo === "despesa" && f.forma === "Crédito";
    const opt = (v, t, sel) => `<option value="${esc(v)}"${v === sel ? " selected" : ""}>${esc(t)}</option>`;
    return `
    ${modo === "parcela" ? "" : `<div class="seg" style="margin-bottom:6px">${Object.entries(TIPOS).map(([k, n]) => `<button type="button" class="${f.tipo === k ? "on" : ""}" data-t="${k}"${modo === "rec" ? " disabled" : ""}>${n}</button>`).join("")}</div>`}
    <div class="amount"><label>${modo === "compra" || (credito && f.parcelas > 1) ? "Valor total da compra" : "Valor"}</label>
      <div class="a-in"><em>R$</em><input id="fl-valor" inputmode="decimal" placeholder="0,00" value="${valorInput(f.valor)}" autocomplete="off"></div></div>
    <div class="group">
      <label class="f"><span>Descrição</span><input id="fl-desc" value="${esc(f.desc)}" placeholder="Ex.: Supernosso" autocomplete="off"></label>
      ${travado ? "" : `<label class="f"><span>Data</span><input id="fl-data" type="date" value="${f.data}"></label>`}
    </div>
    <div class="group">
      <label class="f sel"><span>Categoria</span><select id="fl-cat">${catsDe(f.tipo).map((x) => opt(x.id, `${x.emoji}  ${x.nome}`, f.catId)).join("")}</select></label>
      ${c.subs?.length ? `<label class="f sel"><span>Subcategoria</span><select id="fl-sub">${opt("", "—", f.sub)}${c.subs.map((s) => opt(s, s, f.sub)).join("")}${f.sub && !c.subs.includes(f.sub) ? opt(f.sub, f.sub, f.sub) : ""}</select></label>` : ""}
    </div>
    ${modo === "parcela" ? `<p class="f-hint">Você está editando só esta parcela. Para mudar cartão, data ou número de parcelas, edite a compra inteira.</p>` : `
    <div class="group">
      <label class="f sel"><span>Forma de pagamento</span><select id="fl-forma">${FORMAS.map((x) => opt(x, x, f.forma)).join("")}</select></label>
      ${credito ? (cartoes.length ? `
        <label class="f sel"><span>Cartão</span><select id="fl-cartao">${cartoes.map((x) => opt(x.id, x.nome, f.cartaoId)).join("")}</select></label>
        ${modo === "rec" ? "" : `<label class="f sel"><span>Parcelas</span><select id="fl-parc">${Array.from({ length: 24 }, (_, i) => opt(String(i + 1), i === 0 ? "À vista (1x)" : `${i + 1}x`, String(f.parcelas))).join("")}</select></label>`}`
        : `<div class="f"><span class="muted" style="font-size:14px">Cadastre um cartão em Mais › Cartões para usar o crédito.</span></div>`)
        : `<label class="f sel"><span>Conta</span><select id="fl-conta">${opt("", "—", f.contaId)}${contas.map((x) => opt(x.id, x.nome, f.contaId)).join("")}</select></label>`}
    </div>
    <div id="fl-prev"></div>`}
    <div class="group">
      ${nomes().length > 1 ? `<label class="f sel"><span>Quem lançou</span><select id="fl-quem">${nomes().map((n) => opt(n, n, f.quem)).join("")}</select></label>` : ""}
      <label class="f col"><span>Observações</span><textarea id="fl-obs" rows="2" placeholder="Opcional">${esc(f.obs)}</textarea></label>
    </div>
    ${modo !== "novo" && modo !== "rec" ? `<button class="btn danger" type="button" data-x="excluir">Excluir lançamento</button>` : ""}`;
  };

  const ler = (sh) => {
    const v = (id) => $(`#${id}`, sh)?.value;
    if (v("fl-valor") !== undefined) f.valor = parseValor(v("fl-valor"));
    f.desc = (v("fl-desc") ?? f.desc).trim();
    if (v("fl-data")) f.data = v("fl-data");
    if (v("fl-cat") !== undefined) f.catId = v("fl-cat");
    f.sub = v("fl-sub") ?? (catInfo(f.tipo, f.catId).subs?.includes(f.sub) ? f.sub : "");
    if (v("fl-forma") !== undefined) f.forma = v("fl-forma");
    if (v("fl-cartao") !== undefined) f.cartaoId = v("fl-cartao");
    if (v("fl-parc") !== undefined) f.parcelas = Number(v("fl-parc"));
    if (v("fl-conta") !== undefined) f.contaId = v("fl-conta");
    if (v("fl-quem") !== undefined) f.quem = v("fl-quem");
    f.obs = (v("fl-obs") ?? f.obs).trim();
  };

  const atualizarPrev = (sh) => {
    const box = $("#fl-prev", sh);
    if (!box) return;
    ler(sh);
    const cartao = S.cartoes.get(f.cartaoId);
    if (f.tipo !== "despesa" || f.forma !== "Crédito" || !cartao) { box.innerHTML = ""; return; }
    const n = modo === "rec" ? 1 : f.parcelas || 1;
    const comp = competenciaCartao(f.data, cartao, 0);
    const ult = competenciaCartao(f.data, cartao, n - 1);
    const valores = Number.isFinite(f.valor) && f.valor > 0 ? dividir(f.valor, n) : null;
    const vence = `${pad(Math.min(cartao.vencimento, diasNoMes(comp)))}/${comp.slice(5)}`;
    box.innerHTML = `<div class="preview">${n > 1
      ? `${valores ? `<b>${n}x de ${brl(valores[0])}</b>${valores[n - 1] !== valores[0] ? ` (última de ${brl(valores[n - 1])})` : ""}. ` : ""}1ª parcela na fatura de <b>${mesNome(comp).toLowerCase()}</b> (vence ${vence}) e a última em <b>${mesNome(ult).toLowerCase()}${ult.slice(0, 4) !== comp.slice(0, 4) ? ` de ${ult.slice(0, 4)}` : ""}</b>.`
      : `Entra na fatura de <b>${mesNome(comp).toLowerCase()}</b> do ${esc(cartao.nome)} (vence ${vence}).`}
      <br><span style="opacity:.75">Melhor dia de compra: ${cartao.melhorDia}. Compras a partir desse dia vão para a fatura seguinte.</span></div>`;
  };

  const montar = (sh) => {
    const body = $(".sheet-b", sh);
    body.innerHTML = corpoHTML();
    $$("[data-t]", body).forEach((bt) => (bt.onclick = () => {
      ler(sh); if (f.tipo === bt.dataset.t) return;
      f.tipo = bt.dataset.t; f.catId = catsDe(f.tipo)[0]?.id || ""; f.sub = "";
      if (f.tipo !== "despesa" && f.forma === "Crédito") f.forma = "Pix";
      if (f.tipo === "receita" && f.forma === "Pix" && !orig) f.forma = "Transferência";
      montar(sh);
    }));
    ["fl-cat", "fl-forma"].forEach((id) => { const el = $(`#${id}`, body); if (el) el.onchange = () => { ler(sh); if (id === "fl-cat") f.sub = ""; montar(sh); }; });
    ["fl-valor", "fl-data", "fl-cartao", "fl-parc"].forEach((id) => { const el = $(`#${id}`, body); if (el) { el.oninput = () => atualizarPrev(sh); el.onchange = () => atualizarPrev(sh); } });
    const ex = $('[data-x="excluir"]', body);
    if (ex) ex.onclick = () => excluirLanc(orig, modo);
    atualizarPrev(sh);
  };

  const salvar = (sh) => {
    ler(sh);
    if (!Number.isFinite(f.valor) || f.valor <= 0) { const el = $("#fl-valor", sh); el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); el.focus(); return; }
    salvarLanc(f, modo, orig);
    fecharSheet();
    toast(modo === "novo" || modo === "rec" ? "Lançado ✓" : "Alterações salvas ✓");
  };

  abrirSheet({ titulo, corpo: "", direita: "Salvar", onDireita: () => salvar($(".sheet", sheetRoot)), onMontar: (sh) => { montar(sh); if (modo === "novo") focarDepois($("#fl-valor", sh)); } });
}

function salvarLanc(f, modo, orig) {
  const agora = Date.now();
  const credito = f.tipo === "despesa" && f.forma === "Crédito" && S.cartoes.get(f.cartaoId);
  const cartao = credito ? S.cartoes.get(f.cartaoId) : null;
  const comum = {
    tipo: f.tipo, desc: f.desc, catId: f.catId, sub: f.sub || "", forma: f.forma,
    contaId: credito ? null : (f.contaId || null), cartaoId: credito ? f.cartaoId : null,
    obs: f.obs, quem: f.quem || eu(), status: "ok", atualizadoEm: agora
  };
  const b = writeBatch(db);

  if (modo === "parcela") {
    const { id: _id, ...resto } = orig;
    b.set(ref("lancamentos", orig.id), { ...resto, ...comum, cartaoId: orig.cartaoId, forma: orig.forma, contaId: null, valor: f.valor });
  } else if (modo === "rec") {
    const id = `rec_${orig.recId}_${orig.mes}`;
    b.set(ref("lancamentos", id), {
      ...comum, valor: f.valor, data: orig.data, competencia: cartao ? competenciaCartao(orig.data, cartao) : ymOf(orig.data),
      recId: orig.recId, mes: orig.mes, compraId: null, parcela: null, parcelas: null, valorTotal: null,
      criadoEm: agora, criadoPor: eu()
    });
  } else {
    // remove versões antigas quando a estrutura muda
    if (modo === "compra") lancAtivos().filter((l) => l.compraId === orig.compraId).forEach((l) => b.delete(ref("lancamentos", l.id)));
    const n = credito ? Math.max(1, f.parcelas || 1) : 1;
    const manterId = modo === "unico" && n === 1 ? orig.id : null;
    if (modo === "unico" && n > 1) b.delete(ref("lancamentos", orig.id));
    const criadoEm = orig?.criadoEm || agora, criadoPor = orig?.criadoPor || eu();
    const extrasRec = orig?.recId ? { recId: orig.recId, mes: orig.mes } : {};
    if (n > 1) {
      const compraId = modo === "compra" ? orig.compraId : novoId();
      dividir(f.valor, n).forEach((v, i) => {
        b.set(ref("lancamentos", `${compraId}_${i + 1}`), {
          ...comum, valor: v, data: f.data, competencia: competenciaCartao(f.data, cartao, i),
          compraId, parcela: i + 1, parcelas: n, valorTotal: f.valor, criadoEm, criadoPor
        });
      });
    } else {
      b.set(ref("lancamentos", manterId || novoId()), {
        ...comum, ...extrasRec, valor: f.valor, data: f.data,
        competencia: cartao ? competenciaCartao(f.data, cartao) : ymOf(f.data),
        compraId: null, parcela: null, parcelas: null, valorTotal: null, criadoEm, criadoPor
      });
    }
  }
  fire(b.commit());
}

async function excluirLanc(l, modo) {
  let quais = [l];
  if (l.compraId && l.parcelas > 1) {
    const r = await perguntar("Excluir compra parcelada", `Esta compra tem ${l.parcelas} parcelas.`, [
      { t: "Só esta parcela", v: "uma" }, { t: `Todas as ${l.parcelas} parcelas`, v: "todas", estilo: "danger" }, { t: "Cancelar", v: null, estilo: "strong" }]);
    if (!r) return;
    if (r === "todas") quais = lancAtivos().filter((x) => x.compraId === l.compraId);
  } else {
    const r = await perguntar("Excluir lançamento?", l.recId ? "Ele volta para a lista de fixas a confirmar deste mês." : "Essa ação não pode ser desfeita.", [
      { t: "Excluir", v: true, estilo: "danger" }, { t: "Cancelar", v: false, estilo: "strong" }]);
    if (!r) return;
  }
  const backup = quais.map((x) => ({ ...x }));
  const b = writeBatch(db);
  quais.forEach((x) => b.delete(ref("lancamentos", x.id)));
  fire(b.commit());
  fecharSheet();
  toast(quais.length > 1 ? `${quais.length} parcelas excluídas` : "Lançamento excluído", () => {
    const b2 = writeBatch(db);
    backup.forEach(({ id, ...d }) => b2.set(ref("lancamentos", id), d));
    fire(b2.commit());
  });
}

async function abrirEdicao(id) {
  const l = S.lanc.get(id);
  if (!l) return;
  if (l.compraId && l.parcelas > 1) {
    const r = await perguntar("Compra parcelada", `${l.desc || "Esta compra"} tem ${l.parcelas} parcelas. O que você quer editar?`, [
      { t: "A compra inteira", v: "compra", estilo: "strong" }, { t: `Só a parcela ${l.parcela}`, v: "parcela" }, { t: "Cancelar", v: null }]);
    if (!r) return;
    formLanc({ modo: r, orig: l });
  } else formLanc({ modo: "unico", orig: l });
}

/* ---------------- Lançamento rápido ---------------- */
function atalhosRapidos() {
  const limite = addMonths(ymOf(todayStr()), -4);
  const freq = new Map();
  lancAtivos().filter((l) => l.tipo === "despesa" && l.sub && (l.data || "") >= limite).forEach((l) => {
    const k = `${l.catId}|${l.sub}`; freq.set(k, (freq.get(k) || 0) + 1);
  });
  const lista = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k.split("|"));
  for (const d of QUICK_DEFAULT) if (!lista.some(([c, s]) => c === d[0] && s === d[1])) lista.push(d);
  return lista.filter(([c]) => catsDe("despesa").some((x) => x.id === c)).slice(0, 8);
}

function formRapido() {
  const cartoes = [...S.cartoes.values()].sort(ordenar);
  const opcoes = [["Pix", "Pix"], ["Débito", "Débito"], ["Dinheiro", "Dinheiro"], ...cartoes.map((c) => [`cc:${c.id}`, c.nome])];
  let pay = localStorage.getItem(LS.pay) || "Pix";
  if (!opcoes.some(([v]) => v === pay)) pay = "Pix";

  const corpo = `
    <div class="amount"><label>Quanto foi?</label><div class="a-in"><em>R$</em><input id="q-valor" inputmode="decimal" placeholder="0,00" autocomplete="off"></div></div>
    <div class="pay" id="q-pay">${opcoes.map(([v, n]) => `<button type="button" data-p="${esc(v)}" class="${v === pay ? "on" : ""}">${esc(n)}</button>`).join("")}</div>
    <div class="group q-desc"><label class="f full"><input id="q-desc" placeholder="Descrição (opcional)" autocomplete="off"></label></div>
    <div class="quick">${atalhosRapidos().map(([cid, sub]) => {
      const c = catInfo("despesa", cid);
      return `<button type="button" data-q="${esc(cid)}|${esc(sub)}"><div class="ico" style="--tint:${tint(c.cor)}">${QUICK_EMOJI[sub] || c.emoji}</div>${esc(sub)}</button>`;
    }).join("")}</div>
    <button class="linkish" type="button" id="q-full">Outra categoria, receita ou parcelado ›</button>`;

  abrirSheet({
    titulo: "Lançamento rápido", corpo, esquerda: "Fechar",
    onMontar: (sh) => {
      const inp = $("#q-valor", sh);
      focarDepois(inp);
      $$("[data-p]", sh).forEach((b) => (b.onclick = () => {
        pay = b.dataset.p; localStorage.setItem(LS.pay, pay);
        $$("[data-p]", sh).forEach((x) => x.classList.toggle("on", x === b));
      }));
      $$("[data-q]", sh).forEach((b) => (b.onclick = () => {
        const v = parseValor(inp.value);
        if (!Number.isFinite(v) || v <= 0) { inp.classList.remove("shake"); void inp.offsetWidth; inp.classList.add("shake"); inp.focus(); return; }
        const [catId, sub] = b.dataset.q.split("|");
        const cc = pay.startsWith("cc:") ? pay.slice(3) : null;
        const f = {
          tipo: "despesa", valor: v, desc: $("#q-desc", sh).value.trim(), data: todayStr(), catId, sub,
          forma: cc ? "Crédito" : pay, cartaoId: cc, contaId: [...S.contas.values()].sort(ordenar)[0]?.id || "",
          parcelas: 1, obs: "", quem: eu()
        };
        const id = novoId();
        salvarLancComId(f, id);
        fecharSheet();
        toast(`${QUICK_EMOJI[sub] || catInfo("despesa", catId).emoji} ${brl(v)} · ${sub}`, () => fire(deleteDoc(ref("lancamentos", id))));
      }));
      $("#q-full", sh).onclick = () => {
        const v = parseValor(inp.value);
        const cc = pay.startsWith("cc:") ? pay.slice(3) : null;
        formLanc({ preset: { valor: Number.isFinite(v) ? v : null, desc: $("#q-desc", sh).value.trim(), forma: cc ? "Crédito" : pay, cartaoId: cc || undefined } });
      };
    }
  });
}
function salvarLancComId(f, id) {
  const cartao = f.forma === "Crédito" ? S.cartoes.get(f.cartaoId) : null;
  const agora = Date.now();
  fire(setDoc(ref("lancamentos", id), {
    tipo: f.tipo, valor: f.valor, desc: f.desc, data: f.data, catId: f.catId, sub: f.sub, forma: f.forma,
    contaId: cartao ? null : (f.contaId || null), cartaoId: cartao ? f.cartaoId : null,
    competencia: cartao ? competenciaCartao(f.data, cartao) : ymOf(f.data),
    compraId: null, parcela: null, parcelas: null, valorTotal: null, obs: "", quem: f.quem,
    status: "ok", criadoEm: agora, criadoPor: eu(), atualizadoEm: agora
  }));
}

/* ---------------- Fixas: confirmar, pular, cadastrar ---------------- */
function lancDeFixa(r, ym) {
  return {
    tipo: r.tipo, valor: r.valor, desc: r.desc, data: dataNoMes(ym, r.dia), catId: r.catId, sub: r.sub || "",
    forma: r.forma || "Pix", contaId: r.contaId || "", cartaoId: r.cartaoId || "", parcelas: 1, obs: "", quem: eu(),
    recId: r.id, mes: ym
  };
}
function confirmarFixa(rid) {
  const r = S.rec.get(rid); if (!r) return;
  const f = lancDeFixa(r, S.mes);
  salvarLanc(f, "rec", { recId: r.id, mes: S.mes, data: f.data });
  toast(`${r.desc} lançada ✓`, () => fire(deleteDoc(ref("lancamentos", `rec_${r.id}_${S.mes}`))));
}
function pularFixa(rid) {
  const r = S.rec.get(rid); if (!r) return;
  const id = `rec_${r.id}_${S.mes}`;
  fire(setDoc(ref("lancamentos", id), { status: "pulado", recId: r.id, mes: S.mes, competencia: S.mes, criadoEm: Date.now() }));
  toast(`${r.desc} pulada em ${mesNome(S.mes).toLowerCase()}`, () => fire(deleteDoc(ref("lancamentos", id))));
}
function abrirPendencia(rid) {
  const r = S.rec.get(rid); if (!r) return;
  const p = lancDeFixa(r, S.mes);
  formLanc({ modo: "rec", orig: { recId: r.id, mes: S.mes, data: p.data }, preset: p });
}

function formFixa(id) {
  const orig = id ? S.rec.get(id) : null;
  const cartoes = [...S.cartoes.values()].sort(ordenar);
  const contas = [...S.contas.values()].sort(ordenar);
  const f = {
    tipo: orig?.tipo || "despesa", desc: orig?.desc || "", valor: orig?.valor ?? null, dia: orig?.dia || Number(todayStr().slice(8)),
    catId: orig?.catId || "", sub: orig?.sub || "", forma: orig?.forma || "Pix", contaId: orig?.contaId || contas[0]?.id || "",
    cartaoId: orig?.cartaoId || cartoes[0]?.id || "", inicio: orig?.inicio || S.mes, fim: orig?.fim || "", ativo: orig?.ativo !== false
  };
  if (!catsDe(f.tipo).some((c) => c.id === f.catId)) f.catId = catsDe(f.tipo)[0]?.id || "";
  const opt = (v, t, sel) => `<option value="${esc(v)}"${String(v) === String(sel) ? " selected" : ""}>${esc(t)}</option>`;

  const html = () => {
    const c = catInfo(f.tipo, f.catId);
    return `<div class="seg" style="margin-bottom:6px">${Object.entries(TIPOS).map(([k, n]) => `<button type="button" class="${f.tipo === k ? "on" : ""}" data-t="${k}">${n}</button>`).join("")}</div>
    <div class="amount"><label>Valor mensal</label><div class="a-in"><em>R$</em><input id="ff-valor" inputmode="decimal" placeholder="0,00" value="${valorInput(f.valor)}"></div></div>
    <div class="group">
      <label class="f"><span>Nome</span><input id="ff-desc" value="${esc(f.desc)}" placeholder="Ex.: Aluguel"></label>
      <label class="f sel"><span>Dia do mês</span><select id="ff-dia">${Array.from({ length: 31 }, (_, i) => opt(i + 1, `Dia ${i + 1}`, f.dia)).join("")}</select></label>
    </div>
    <div class="group">
      <label class="f sel"><span>Categoria</span><select id="ff-cat">${catsDe(f.tipo).map((x) => opt(x.id, `${x.emoji}  ${x.nome}`, f.catId)).join("")}</select></label>
      ${c.subs?.length ? `<label class="f sel"><span>Subcategoria</span><select id="ff-sub">${opt("", "—", f.sub)}${c.subs.map((s) => opt(s, s, f.sub)).join("")}</select></label>` : ""}
    </div>
    <div class="group">
      <label class="f sel"><span>Forma de pagamento</span><select id="ff-forma">${FORMAS.filter((x) => f.tipo === "despesa" || x !== "Crédito").map((x) => opt(x, x, f.forma)).join("")}</select></label>
      ${f.tipo === "despesa" && f.forma === "Crédito" && cartoes.length
        ? `<label class="f sel"><span>Cartão</span><select id="ff-cartao">${cartoes.map((x) => opt(x.id, x.nome, f.cartaoId)).join("")}</select></label>`
        : `<label class="f sel"><span>Conta</span><select id="ff-conta">${opt("", "—", f.contaId)}${contas.map((x) => opt(x.id, x.nome, f.contaId)).join("")}</select></label>`}
    </div>
    <div class="group">
      <label class="f"><span>Começa em</span><input id="ff-ini" type="month" value="${f.inicio}"></label>
      <label class="f"><span>Termina em</span><input id="ff-fim" type="month" value="${f.fim}" placeholder="sem fim"></label>
      ${orig ? `<label class="f sel"><span>Situação</span><select id="ff-ativo">${opt("1", "Ativa", f.ativo ? "1" : "0")}${opt("0", "Pausada", f.ativo ? "1" : "0")}</select></label>` : ""}
    </div>
    <p class="f-hint">Deixe "Termina em" vazio para repetir sempre. Mudar uma fixa não altera os meses já lançados.</p>
    ${orig ? `<button class="btn danger" type="button" data-x="excluir">Excluir fixa</button>` : ""}`;
  };
  const ler = (sh) => {
    const v = (i) => $(`#${i}`, sh)?.value;
    f.valor = parseValor(v("ff-valor")); f.desc = (v("ff-desc") || "").trim(); f.dia = Number(v("ff-dia"));
    f.catId = v("ff-cat") ?? f.catId; f.sub = v("ff-sub") ?? ""; f.forma = v("ff-forma") ?? f.forma;
    if (v("ff-cartao") !== undefined) f.cartaoId = v("ff-cartao");
    if (v("ff-conta") !== undefined) f.contaId = v("ff-conta");
    f.inicio = v("ff-ini") || S.mes; f.fim = v("ff-fim") || "";
    if (v("ff-ativo") !== undefined) f.ativo = v("ff-ativo") === "1";
  };
  const montar = (sh) => {
    const body = $(".sheet-b", sh); body.innerHTML = html();
    $$("[data-t]", body).forEach((bt) => (bt.onclick = () => { ler(sh); f.tipo = bt.dataset.t; f.catId = catsDe(f.tipo)[0]?.id || ""; f.sub = ""; if (f.tipo !== "despesa" && f.forma === "Crédito") f.forma = "Pix"; montar(sh); }));
    ["ff-cat", "ff-forma"].forEach((i) => { const el = $(`#${i}`, body); if (el) el.onchange = () => { ler(sh); if (i === "ff-cat") f.sub = ""; montar(sh); }; });
    const ex = $('[data-x="excluir"]', body);
    if (ex) ex.onclick = async () => {
      const r = await perguntar("Excluir esta fixa?", "Os lançamentos já confirmados continuam no histórico.", [{ t: "Excluir", v: true, estilo: "danger" }, { t: "Cancelar", v: false, estilo: "strong" }]);
      if (!r) return; fire(deleteDoc(ref("recorrentes", id))); fecharSheet(); toast("Fixa excluída");
    };
  };
  abrirSheet({
    titulo: orig ? "Editar fixa" : "Nova fixa", corpo: "", direita: "Salvar",
    onMontar: montar,
    onDireita: () => {
      const sh = $(".sheet", sheetRoot); ler(sh);
      if (!f.desc) { $("#ff-desc", sh).focus(); toast("Dê um nome para a fixa"); return; }
      if (!Number.isFinite(f.valor) || f.valor <= 0) { const el = $("#ff-valor", sh); el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); return; }
      const credito = f.tipo === "despesa" && f.forma === "Crédito" && S.cartoes.get(f.cartaoId);
      fire(setDoc(ref("recorrentes", id || novoId()), {
        tipo: f.tipo, desc: f.desc, valor: f.valor, dia: f.dia, catId: f.catId, sub: f.sub, forma: f.forma,
        cartaoId: credito ? f.cartaoId : null, contaId: credito ? null : (f.contaId || null),
        inicio: f.inicio, fim: f.fim || null, ativo: f.ativo, atualizadoEm: Date.now(), criadoEm: orig?.criadoEm || Date.now()
      }));
      fecharSheet(); toast(orig ? "Fixa atualizada ✓" : "Fixa cadastrada ✓");
    }
  });
}

/* ---------------- Cartões ---------------- */
function verFatura(cid) {
  const c = S.cartoes.get(cid); if (!c) return;
  const f = faturas(S.mes).find((x) => x.cartao.id === cid);
  const itens = f.itens.sort(ordemLanc);
  abrirSheet({
    titulo: c.nome, esquerda: "Fechar", direita: "Editar", onDireita: () => formCartao(cid),
    corpo: `<div class="card hero" style="--c:${c.cor}"><div class="label">Fatura de ${mesNome(S.mes).toLowerCase()} · vence ${f.vence.slice(8)}/${f.vence.slice(5, 7)}</div>
      <div class="big num">${brl(f.total)}</div>${c.limite ? `<div class="sub">Limite ${brl(c.limite)} · ${Math.round((f.total / c.limite) * 100)}% usado</div>` : ""}</div>
      <div class="card" style="padding:2px 16px">${itens.length ? `<div class="list">${itens.map(linhaLanc).join("")}</div>` : `<div class="empty">Nenhum lançamento nesta fatura.</div>`}</div>`
  });
}
function formCartao(id) {
  const o = id ? S.cartoes.get(id) : null;
  let cor = o?.cor || CORES[1];
  const dias = (sel) => Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}"${i + 1 === Number(sel) ? " selected" : ""}>Dia ${i + 1}</option>`).join("");
  abrirSheet({
    titulo: o ? "Editar cartão" : "Novo cartão", direita: "Salvar",
    corpo: `<div class="group">
        <label class="f"><span>Nome</span><input id="cc-nome" value="${esc(o?.nome || "")}" placeholder="Ex.: Nubank"></label>
        <label class="f sel"><span>Melhor dia de compra</span><select id="cc-melhor">${dias(o?.melhorDia || 1)}</select></label>
        <label class="f sel"><span>Vencimento</span><select id="cc-venc">${dias(o?.vencimento || 10)}</select></label>
        <label class="f"><span>Limite</span><input id="cc-lim" inputmode="decimal" placeholder="opcional" value="${valorInput(o?.limite)}"></label>
      </div>
      <p class="f-hint">Melhor dia de compra: comprando nesse dia ou depois, a compra (ou a 1ª parcela) vai para a fatura seguinte. Mudar esses dias não recalcula compras já lançadas.</p>
      <div class="group"><div class="f"><span>Cor</span></div><div class="swatches">${CORES.map((c) => `<button type="button" style="--c:${c}" data-c="${c}" class="${c === cor ? "on" : ""}"></button>`).join("")}</div></div>
      ${o ? `<button class="btn danger" type="button" data-x="excluir">Excluir cartão</button>` : ""}`,
    onMontar: (sh) => {
      $$("[data-c]", sh).forEach((b) => (b.onclick = () => { cor = b.dataset.c; $$("[data-c]", sh).forEach((x) => x.classList.toggle("on", x === b)); }));
      const ex = $('[data-x="excluir"]', sh);
      if (ex) ex.onclick = async () => {
        const usados = lancAtivos().filter((l) => l.cartaoId === id).length;
        const r = await perguntar("Excluir cartão?", usados ? `${usados} lançamentos usam este cartão; eles continuam no histórico.` : "", [{ t: "Excluir", v: true, estilo: "danger" }, { t: "Cancelar", v: false, estilo: "strong" }]);
        if (r) { fire(deleteDoc(ref("cartoes", id))); fecharSheet(); toast("Cartão excluído"); }
      };
    },
    onDireita: () => {
      const sh = $(".sheet", sheetRoot);
      const nome = $("#cc-nome", sh).value.trim();
      if (!nome) { $("#cc-nome", sh).focus(); return; }
      const lim = parseValor($("#cc-lim", sh).value);
      fire(setDoc(ref("cartoes", id || novoId()), {
        nome, melhorDia: Number($("#cc-melhor", sh).value), vencimento: Number($("#cc-venc", sh).value),
        limite: Number.isFinite(lim) ? lim : null, cor, ordem: o?.ordem ?? S.cartoes.size
      }));
      fecharSheet(); toast("Cartão salvo ✓");
    }
  });
}

/* ---------------- Contas ---------------- */
function formConta(id) {
  const o = id ? S.contas.get(id) : null;
  let cor = o?.cor || CORES[11];
  abrirSheet({
    titulo: o ? "Editar conta" : "Nova conta", direita: "Salvar",
    corpo: `<div class="group"><label class="f"><span>Nome</span><input id="ct-nome" value="${esc(o?.nome || "")}" placeholder="Ex.: Itaú da Vanessa"></label></div>
      <div class="group"><div class="f"><span>Cor</span></div><div class="swatches">${CORES.map((c) => `<button type="button" style="--c:${c}" data-c="${c}" class="${c === cor ? "on" : ""}"></button>`).join("")}</div></div>
      ${o ? `<button class="btn danger" type="button" data-x="excluir">Excluir conta</button>` : ""}`,
    onMontar: (sh) => {
      $$("[data-c]", sh).forEach((b) => (b.onclick = () => { cor = b.dataset.c; $$("[data-c]", sh).forEach((x) => x.classList.toggle("on", x === b)); }));
      const ex = $('[data-x="excluir"]', sh);
      if (ex) ex.onclick = async () => {
        const r = await perguntar("Excluir conta?", "Os lançamentos continuam no histórico.", [{ t: "Excluir", v: true, estilo: "danger" }, { t: "Cancelar", v: false, estilo: "strong" }]);
        if (r) { fire(deleteDoc(ref("contas", id))); fecharSheet(); }
      };
    },
    onDireita: () => {
      const sh = $(".sheet", sheetRoot); const nome = $("#ct-nome", sh).value.trim();
      if (!nome) { $("#ct-nome", sh).focus(); return; }
      fire(setDoc(ref("contas", id || novoId()), { nome, cor, ordem: o?.ordem ?? S.contas.size }));
      fecharSheet(); toast("Conta salva ✓");
    }
  });
}

/* ---------------- Categorias ---------------- */
function formCategoria(tipo, id) {
  const lista = catsDe(tipo);
  const o = id ? lista.find((c) => c.id === id) : null;
  let cor = o?.cor || CORES[0];
  let subs = (o?.subs || []).map((s) => ({ orig: s, nome: s }));
  const subsHTML = () => subs.map((s, i) => `<div class="sub-item"><input data-si="${i}" value="${esc(s.nome)}"><button type="button" data-sr="${i}" aria-label="Remover">⊖</button></div>`).join("");
  abrirSheet({
    titulo: o ? "Editar categoria" : "Nova categoria", direita: "Salvar",
    corpo: `<div class="group">
        <label class="f"><span>Ícone</span><input id="ca-emoji" value="${esc(o?.emoji || "🏷️")}" maxlength="8" style="font-size:22px"></label>
        <label class="f"><span>Nome</span><input id="ca-nome" value="${esc(o?.nome || "")}" placeholder="Ex.: Viagem"></label>
      </div>
      <div class="group"><div class="f"><span>Cor</span></div><div class="swatches">${CORES.map((c) => `<button type="button" style="--c:${c}" data-c="${c}" class="${c === cor ? "on" : ""}"></button>`).join("")}</div></div>
      <div class="section-label" style="margin-top:6px">Subcategorias</div>
      <div class="group"><div class="subs"><div id="ca-subs">${subsHTML()}</div>
        <div class="sub-add"><input id="ca-nova" placeholder="Nova subcategoria"><button type="button" id="ca-add">Adicionar</button></div></div></div>
      <p class="f-hint">Renomear uma subcategoria atualiza também os lançamentos antigos.</p>
      ${o ? `<button class="btn danger" type="button" data-x="excluir">Excluir categoria</button>` : ""}`,
    onMontar: (sh) => {
      $$("[data-c]", sh).forEach((b) => (b.onclick = () => { cor = b.dataset.c; $$("[data-c]", sh).forEach((x) => x.classList.toggle("on", x === b)); }));
      const sync = () => $$("[data-si]", sh).forEach((inp) => (subs[Number(inp.dataset.si)].nome = inp.value));
      const redesenhar = () => { $("#ca-subs", sh).innerHTML = subsHTML(); ligar(); };
      const ligar = () => $$("[data-sr]", sh).forEach((b) => (b.onclick = () => { sync(); subs.splice(Number(b.dataset.sr), 1); redesenhar(); }));
      ligar();
      const add = () => { sync(); const v = $("#ca-nova", sh).value.trim(); if (!v) return; subs.push({ orig: null, nome: v }); $("#ca-nova", sh).value = ""; redesenhar(); };
      $("#ca-add", sh).onclick = add;
      $("#ca-nova", sh).onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } };
      sh._sync = sync;
      const ex = $('[data-x="excluir"]', sh);
      if (ex) ex.onclick = async () => {
        const usados = [...S.lanc.values()].filter((l) => l.tipo === tipo && l.catId === id).length;
        const r = await perguntar("Excluir categoria?", usados ? `${usados} lançamentos usam "${o.nome}". Eles vão aparecer como "Sem categoria".` : "", [{ t: "Excluir", v: true, estilo: "danger" }, { t: "Cancelar", v: false, estilo: "strong" }]);
        if (!r) return;
        fire(setDoc(ref("config", "categorias"), { ...S.cats, [tipo]: lista.filter((c) => c.id !== id) }));
        fecharSheet(); toast("Categoria excluída");
      };
    },
    onDireita: () => {
      const sh = $(".sheet", sheetRoot); sh._sync();
      const nome = $("#ca-nome", sh).value.trim();
      if (!nome) { $("#ca-nome", sh).focus(); return; }
      const novas = subs.map((s) => ({ ...s, nome: s.nome.trim() })).filter((s) => s.nome);
      const catId = id || (nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat") + "-" + Date.now().toString(36);
      const nova = { id: catId, emoji: $("#ca-emoji", sh).value.trim() || "🏷️", nome, cor, subs: novas.map((s) => s.nome) };
      const b = writeBatch(db);
      b.set(ref("config", "categorias"), { ...S.cats, [tipo]: o ? lista.map((c) => (c.id === id ? nova : c)) : [...lista, nova] });
      // renomeações de subcategoria propagam para lançamentos e fixas
      novas.filter((s) => s.orig && s.orig !== s.nome).forEach((s) => {
        [...S.lanc.values()].filter((l) => l.tipo === tipo && l.catId === id && l.sub === s.orig).forEach((l) => b.update(ref("lancamentos", l.id), { sub: s.nome }));
        [...S.rec.values()].filter((r) => r.tipo === tipo && r.catId === id && r.sub === s.orig).forEach((r) => b.update(ref("recorrentes", r.id), { sub: s.nome }));
      });
      fire(b.commit());
      fecharSheet(); toast("Categoria salva ✓");
    }
  });
}

/* ---------------- Backup e exportação ---------------- */
async function entregarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const arquivo = new File([blob], nome, { type: tipo });
  if (navigator.canShare && navigator.canShare({ files: [arquivo] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [arquivo], title: nome }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function backupJSON() {
  const semId = (m) => [...m.values()];
  const dados = {
    app: "financas-casal", versao: 1, exportadoEm: new Date().toISOString(),
    config: S.cfg, categorias: S.cats,
    lancamentos: semId(S.lanc), recorrentes: semId(S.rec), cartoes: semId(S.cartoes), contas: semId(S.contas)
  };
  entregarArquivo(`financas-backup-${todayStr()}.json`, JSON.stringify(dados, null, 2), "application/json");
}
function exportarCSV() {
  const linhas = [["Data", "Competência (mês)", "Tipo", "Descrição", "Categoria", "Subcategoria", "Forma", "Conta", "Cartão", "Parcela", "Valor", "Quem", "Observações"]];
  lancAtivos().sort((a, b) => (a.competencia || "").localeCompare(b.competencia || "") || (a.data || "").localeCompare(b.data || "")).forEach((l) => {
    const [y, m, d] = (l.data || "").split("-");
    linhas.push([
      l.data ? `${d}/${m}/${y}` : "", l.competencia ? `${l.competencia.slice(5)}/${l.competencia.slice(0, 4)}` : "", TIPOS[l.tipo] || l.tipo,
      l.desc, catInfo(l.tipo, l.catId).nome, l.sub, l.forma, S.contas.get(l.contaId)?.nome || "", S.cartoes.get(l.cartaoId)?.nome || "",
      l.parcelas > 1 ? `${l.parcela}/${l.parcelas}` : "", ((l.tipo === "despesa" ? -1 : 1) * l.valor / 100).toFixed(2).replace(".", ","), l.quem, l.obs
    ]);
  });
  const csv = linhas.map((r) => r.map((c) => { const s = String(c ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(";")).join("\r\n");
  entregarArquivo(`financas-lancamentos-${todayStr()}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
}
async function restaurar(file) {
  let dados;
  try { dados = JSON.parse(await file.text()); } catch { toast("Arquivo inválido"); return; }
  if (dados.app !== "financas-casal") { toast("Esse arquivo não é uma cópia deste app"); return; }
  const qtd = (dados.lancamentos || []).length;
  const ok = await perguntar("Restaurar cópia?", `Cópia de ${new Date(dados.exportadoEm).toLocaleString("pt-BR")} com ${qtd} lançamentos. Os itens serão regravados por cima dos atuais.`, [{ t: "Restaurar", v: true, estilo: "strong" }, { t: "Cancelar", v: false }]);
  if (!ok) return;
  const ops = [];
  if (dados.config) ops.push([ref("config", "geral"), dados.config]);
  if (dados.categorias) ops.push([ref("config", "categorias"), dados.categorias]);
  for (const nome of ["lancamentos", "recorrentes", "cartoes", "contas"]) (dados[nome] || []).forEach(({ id, ...d }) => id && ops.push([ref(nome, id), d]));
  try {
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db);
      ops.slice(i, i + 400).forEach(([r, d]) => b.set(r, d));
      await b.commit();
    }
    toast(`Cópia restaurada: ${ops.length} itens ✓`);
  } catch (e) { toast("Erro ao restaurar: " + (e.code || e.message)); }
}

/* =========================================================
   Cliques (delegação de eventos)
   ========================================================= */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-a]");
  if (!el || !root.contains(el) && !sheetRoot.contains(el)) return;
  const a = el.dataset.a, v = el.dataset.v;
  switch (a) {
    case "mes": S.mes = v; agendar(); break;
    case "hoje": S.mes = ymOf(todayStr()); agendar(); break;
    case "view": S.view = v; S.sub = null; window.scrollTo({ top: 0 }); agendar(); break;
    case "sub": S.sub = v || null; window.scrollTo({ top: 0 }); agendar(); break;
    case "filtro": S.filtro = v; agendar(); break;
    case "agrupar": S.agrupar = v; try { localStorage.setItem("fc_agrupar", v); } catch {} agendar(); break;
    case "toggle-cat": S.fechadas.has(v) ? S.fechadas.delete(v) : S.fechadas.add(v); agendar(); break;
    case "cat-tipo": S.catTipo = v; agendar(); break;
    case "rapido": formRapido(); break;
    case "novo": formLanc({ preset: { data: S.mes === ymOf(todayStr()) ? todayStr() : `${S.mes}-01` } }); break;
    case "editar": abrirEdicao(v); break;
    case "confirmar": confirmarFixa(v); break;
    case "pular": pularFixa(v); break;
    case "abrir-pend": abrirPendencia(v); break;
    case "nova-fixa": formFixa(); break;
    case "editar-fixa": formFixa(v); break;
    case "ir-cartoes": S.view = "mais"; S.sub = "cartoes"; agendar(); break;
    case "fatura": verFatura(v); break;
    case "novo-cartao": formCartao(); break;
    case "nova-conta": formConta(); break;
    case "editar-conta": formConta(v); break;
    case "nova-cat": formCategoria(S.catTipo); break;
    case "editar-cat": formCategoria(S.catTipo, v); break;
    case "eu": localStorage.setItem(LS.eu, v); agendar(); toast(`Este aparelho é da ${v} ✓`); break;
    case "salvar-nomes": {
      const n1 = $("#aj-n1").value.trim(), n2 = $("#aj-n2").value.trim();
      const antigos = S.cfg.nomes || [];
      if (antigos.includes(eu())) { const i = antigos.indexOf(eu()); localStorage.setItem(LS.eu, [n1, n2][i] || n1); }
      fire(setDoc(ref("config", "geral"), { ...S.cfg, nomes: [n1, n2] })); toast("Nomes salvos ✓"); break;
    }
    case "backup-json": backupJSON(); break;
    case "export-csv": exportarCSV(); break;
    case "sair":
      perguntar("Sair desta casa?", "Os dados continuam salvos no banco. Para voltar, basta digitar a chave da casa.", [{ t: "Sair", v: true, estilo: "danger" }, { t: "Cancelar", v: false, estilo: "strong" }])
        .then((r) => { if (r) { localStorage.removeItem(LS.casa); location.reload(); } });
      break;
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "busca") { S.busca = e.target.value; agendar(); }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "restaurar" && e.target.files[0]) { restaurar(e.target.files[0]); e.target.value = ""; }
});

// Campo de valor grande: largura acompanha o número (o "R$" fica colado)
function ajustarValores() {
  $$(".amount input").forEach((i) => { i.style.width = `${Math.max(4, (i.value || i.placeholder).length + 0.6)}ch`; });
}
document.addEventListener("input", (e) => { if (e.target.closest(".amount")) ajustarValores(); });
new MutationObserver(ajustarValores).observe(sheetRoot, { childList: true, subtree: true });

/* ---------------- Seletor próprio (substitui o menu nativo do iPhone) ----------------
   Guarda a linha exata em que o dedo encostou; mesmo que a tela se mexa
   entre o toque e o clique, abre a escolha certa. */
let linhaTocada = null;
document.addEventListener("pointerdown", (e) => {
  const row = e.target.closest(".f.sel");
  linhaTocada = row ? { row, t: Date.now() } : null;
  if (row && document.activeElement && document.activeElement.matches("input, textarea")) document.activeElement.blur();
}, true);
document.addEventListener("click", (e) => {
  const alvo = e.target.closest(".f.sel");
  if (!alvo) return;
  e.preventDefault(); e.stopPropagation();
  const row = linhaTocada && Date.now() - linhaTocada.t < 1500 && document.contains(linhaTocada.row) ? linhaTocada.row : alvo;
  linhaTocada = null;
  const sel = $("select", row);
  if (sel && !sel.disabled) abrirSeletor(sel, $("span", row)?.textContent || "");
}, true);

function abrirSeletor(sel, titulo) {
  const dr = $("#dialog-root");
  const ops = [...sel.options];
  dr.innerHTML = `<div class="pk-wrap"><div class="pk" role="listbox" aria-label="${esc(titulo)}">
    <div class="pk-h"><span>${esc(titulo)}</span><button type="button" data-pk="x">Fechar</button></div>
    <div class="pk-l">${ops.map((o, i) => `<button type="button" class="pk-o${o.value === sel.value ? " on" : ""}" data-pk="${i}"><span>${esc(o.textContent)}</span>${o.value === sel.value ? "<b>✓</b>" : ""}</button>`).join("")}</div>
  </div></div>`;
  const wrap = $(".pk-wrap", dr);
  requestAnimationFrame(() => wrap.classList.add("in"));
  const fechar = () => { wrap.classList.remove("in"); setTimeout(() => { if (dr.contains(wrap)) dr.innerHTML = ""; }, 220); };
  wrap.onclick = (e) => {
    const b = e.target.closest("[data-pk]");
    if (!b) { if (e.target === wrap) fechar(); return; }
    if (b.dataset.pk !== "x") {
      const o = ops[Number(b.dataset.pk)];
      if (o.value !== sel.value) {
        sel.value = o.value;
        sel.dispatchEvent(new Event("input", { bubbles: true }));
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    fechar();
  };
  const on = $(".pk-o.on", wrap), lista = $(".pk-l", wrap);
  if (on) lista.scrollTop = Math.max(0, on.offsetTop - lista.clientHeight / 2 + on.offsetHeight / 2);
  // ignora toques enquanto a lista ainda está aparecendo
  const abertoEm = Date.now();
  wrap.addEventListener("click", (e) => { if (Date.now() - abertoEm < 280) { e.stopPropagation(); e.preventDefault(); } }, true);
}

// Ao voltar para o app (ex.: virou o dia), redesenha
document.addEventListener("visibilitychange", () => { if (!document.hidden) agendar(); });

boot();

// Exposto só para testes automatizados
window.__fin = { competenciaCartao, dividir, parseValor, addMonths, S };
