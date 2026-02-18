// emprestimos.js — Empréstimos no MySQL via API

// ========= PEGAR ELEMENTOS (com segurança) =========
const modalE = document.getElementById("modal-emprestimo");
const btnAddE = document.getElementById("btn-add-emprestimo");
const closeE = modalE ? modalE.querySelector(".close") : null;
const formE = document.getElementById("form-emprestimo");

const emprestimosList = document.getElementById("emprestimos-list");

const tipoFiltro = document.getElementById("tipo_filtro");
const buscaUsuario = document.getElementById("busca_usuario");
const selUsuario = document.getElementById("usuario_id");

const buscaLivro = document.getElementById("busca_livro");
const selLivro = document.getElementById("livro_id");

const dataHoraEmp = document.getElementById("datahora_emprestimo");
const dataPrevista = document.getElementById("data_prevista");

const tabAtivos = document.getElementById("tab-ativos");
const tabPendencias = document.getElementById("tab-pendencias");
const tabHistorico = document.getElementById("tab-historico");

// ========= STATE =========
let emprestimos = [];
let usuarios = [];
let livros = [];
let modo = "ativos"; // ativos | pendencias | historico

// ========= API HELPERS =========
async function apiGet(url) {
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.erro || `Erro na API: ${url}`);
  return data;
}

async function apiPost(url, payload) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.erro || `Erro na API: ${url}`);
  return data;
}

async function apiPatch(url) {
  const r = await fetch(url, { method: "PATCH" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.erro || `Erro na API: ${url}`);
  return data;
}

// ========= DATAS =========
function nowBrString() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
}

function todayPlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseYMD(ymd) {
  // ymd: "YYYY-MM-DD"
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isOverdueBy2Days(dataPrevistaStr) {
  // atrasado se hoje > (data_prevista + 2 dias)
  const dp = parseYMD(dataPrevistaStr);
  if (!dp) return false;
  const limite = new Date(dp);
  limite.setDate(limite.getDate() + 2);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return hoje > limite;
}

// ========= MODAL =========
function abrirModal() {
  if (!modalE) {
    alert("Modal não encontrado (id modal-emprestimo).");
    return;
  }
  modalE.classList.add("show");

  if (dataHoraEmp) dataHoraEmp.value = nowBrString();
  if (dataPrevista && !dataPrevista.value) dataPrevista.value = todayPlusDays(7);

  // quando abrir: força preencher selects de acordo com filtros atuais
  preencherUsuarios();
  preencherLivros();
}

function fecharModal() {
  if (modalE) modalE.classList.remove("show");
}

// ========= LOAD =========
async function carregarTudo() {
  try {
    console.log("[emprestimos] carregando usuarios/livros/emprestimos...");
    [usuarios, livros] = await Promise.all([
      apiGet("/api/usuarios"),
      apiGet("/api/livros"),
    ]);

    await carregarEmprestimos();

    preencherLivros();
    preencherUsuarios();
  } catch (err) {
    console.error("[emprestimos] erro carregarTudo:", err);
    alert(err.message || "Falha ao carregar dados do banco.");
  }
}

async function carregarEmprestimos() {
  // ✅ fallback: seu backend hoje só tem /api/emprestimos
  const base = await apiGet("/api/emprestimos");
  emprestimos = Array.isArray(base) ? base : [];

  // Se o backend ainda não manda data_prevista, o filtro fica limitado
  const lista = emprestimos.map((e) => {
    // tenta normalizar
    const status = e.status || "Ativo";
    const dp = e.data_prevista || e.dataPrevista || null;

    // se o backend não marca atrasado, calculamos no front quando tiver data_prevista
    let statusFinal = status;
    if (statusFinal !== "Concluído" && dp && isOverdueBy2Days(dp)) {
      statusFinal = "Atrasado";
    }

    return { ...e, status: statusFinal, data_prevista: dp };
  });

  // aplica modo (tabs) no front
  let filtrados = lista;

  if (modo === "ativos") {
    filtrados = lista.filter((e) => e.status !== "Concluído" && e.status !== "Atrasado");
  } else if (modo === "pendencias") {
    filtrados = lista.filter((e) => e.status === "Atrasado");
  } else if (modo === "historico") {
    filtrados = lista.filter((e) => e.status === "Concluído");
  }

  emprestimos = filtrados;
  renderEmprestimos();
}

// ========= FILTROS =========
function preencherUsuarios() {
  if (!selUsuario) return;

  const tipo = (tipoFiltro?.value || "").trim();
  const termo = (buscaUsuario?.value || "").toLowerCase().trim();

  selUsuario.innerHTML = `<option value="">Selecione...</option>`;

  if (!tipo) {
    selUsuario.innerHTML = `<option value="">Selecione o tipo primeiro...</option>`;
    return;
  }

  const filtrados = (usuarios || [])
    .filter((u) => (u.tipo || "Outro") === tipo) // ✅ filtra por tipo
    .filter((u) => !termo || (u.nome || "").toLowerCase().includes(termo));

  if (filtrados.length === 0) {
    selUsuario.innerHTML = `<option value="">Nenhum ${tipo} encontrado...</option>`;
    return;
  }

  filtrados.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = String(u.id);
    opt.textContent = `${u.nome} (ID ${u.id})`;
    selUsuario.appendChild(opt);
  });
}

function preencherLivros() {
  if (!selLivro) return;

  const termo = (buscaLivro?.value || "").toLowerCase().trim();
  selLivro.innerHTML = `<option value="">Selecione...</option>`;

  const filtrados = (livros || [])
    .filter((l) => Number(l.estoque) > 0) // ✅ estoque > 0
    .filter((l) => !termo || (l.titulo || "").toLowerCase().includes(termo));

  if (filtrados.length === 0) {
    selLivro.innerHTML = `<option value="">Nenhum livro com estoque disponível...</option>`;
    return;
  }

  filtrados.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = String(l.id);
    opt.textContent = `${l.titulo} — estoque: ${l.estoque} (ID ${l.id})`;
    selLivro.appendChild(opt);
  });
}

// ========= RENDER =========
function badgeStatus(status) {
  if (status === "Concluído") {
    return `<span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">Concluído</span>`;
  }
  if (status === "Atrasado") {
    return `<span class="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-semibold">Atrasado</span>`;
  }
  return `<span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 font-semibold">Ativo</span>`;
}

function renderEmprestimos() {
  if (!emprestimosList) return;

  emprestimosList.innerHTML = "";

  if (!emprestimos || emprestimos.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="py-4 px-4 text-gray-500" colspan="7">Nenhum registro.</td>`;
    emprestimosList.appendChild(row);
    return;
  }

  emprestimos.forEach((e) => {
    const row = document.createElement("tr");

    const btnDevolver =
      e.status === "Concluído"
        ? `<button class="text-gray-400 cursor-not-allowed" title="Já devolvido"><i class="fas fa-check"></i></button>`
        : `<button class="text-blue-600 hover:text-blue-800" title="Devolver" data-action="devolver" data-id="${e.id}">
             <i class="fas fa-undo"></i>
           </button>`;

    // backend atual: `data` vem formatado (dd/mm/yyyy) e não tem hora
    const dataEmp = e.data_hora || e.data || "-";
    const prev = e.data_prevista || "-";

    row.innerHTML = `
      <td class="py-2 px-4">${e.id ?? "-"}</td>
      <td class="py-2 px-4">${e.usuario ?? "-"}</td>
      <td class="py-2 px-4">${e.livro ?? "-"}</td>
      <td class="py-2 px-4">${dataEmp}</td>
      <td class="py-2 px-4">${prev}</td>
      <td class="py-2 px-4">${badgeStatus(e.status)}</td>
      <td class="py-2 px-4 text-center">${btnDevolver}</td>
    `;
    emprestimosList.appendChild(row);
  });
}

// ========= EVENTS =========
if (btnAddE) btnAddE.addEventListener("click", abrirModal);

if (closeE) closeE.addEventListener("click", fecharModal);
window.addEventListener("click", (e) => {
  if (e.target === modalE) fecharModal();
});

// filtros (com segurança)
if (tipoFiltro) tipoFiltro.addEventListener("change", () => {
  preencherUsuarios();
  // limpa busca quando troca tipo (opcional)
  if (buscaUsuario) buscaUsuario.value = "";
});

if (buscaUsuario) buscaUsuario.addEventListener("input", preencherUsuarios);
if (buscaLivro) buscaLivro.addEventListener("input", preencherLivros);

// submit
if (formE) {
  formE.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario_id = Number(selUsuario?.value || 0);
    const livro_id = Number(selLivro?.value || 0);
    const data_prevista = dataPrevista?.value || "";

    if (!usuario_id) return alert("Selecione um usuário.");
    if (!livro_id) return alert("Selecione um livro.");
    if (!data_prevista) return alert("Selecione a data prevista de devolução.");

    try {
      await apiPost("/api/emprestimos", { usuario_id, livro_id, data_prevista });
      fecharModal();
      formE.reset();

      if (dataPrevista) dataPrevista.value = todayPlusDays(7);
      await carregarTudo();
    } catch (err) {
      console.error("[emprestimos] erro criar:", err);
      alert(err.message || "Erro ao criar empréstimo.");
    }
  });
}

// devolver
if (emprestimosList) {
  emprestimosList.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (action !== "devolver" || !id) return;

    if (!confirm("Confirmar devolução deste empréstimo?")) return;

    try {
      await apiPatch(`/api/emprestimos/${id}/devolver`);
      await carregarTudo();
    } catch (err) {
      console.error("[emprestimos] erro devolver:", err);
      alert(err.message || "Erro ao devolver.");
    }
  });
}

// tabs
function setTab(active) {
  modo = active;

  // reset
  if (tabAtivos) tabAtivos.className = "px-4 py-2 rounded-lg bg-white border text-gray-700 font-semibold";
  if (tabPendencias) tabPendencias.className = "px-4 py-2 rounded-lg bg-white border text-gray-700 font-semibold";
  if (tabHistorico) tabHistorico.className = "px-4 py-2 rounded-lg bg-white border text-gray-700 font-semibold";

  // active
  if (modo === "ativos" && tabAtivos) tabAtivos.className = "px-4 py-2 rounded-lg bg-green-700 text-white font-semibold";
  if (modo === "pendencias" && tabPendencias) tabPendencias.className = "px-4 py-2 rounded-lg bg-green-700 text-white font-semibold";
  if (modo === "historico" && tabHistorico) tabHistorico.className = "px-4 py-2 rounded-lg bg-green-700 text-white font-semibold";

  carregarEmprestimos().catch((err) => console.error(err));
}

if (tabAtivos) tabAtivos.addEventListener("click", () => setTab("ativos"));
if (tabPendencias) tabPendencias.addEventListener("click", () => setTab("pendencias"));
if (tabHistorico) tabHistorico.addEventListener("click", () => setTab("historico"));

// init
document.addEventListener("DOMContentLoaded", () => {
  console.log("[emprestimos] script carregado ✅");
  carregarTudo();
});
