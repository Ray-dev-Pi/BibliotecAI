// emprestimos.js — Empréstimos no MySQL via API

const modalE = document.getElementById("modal-emprestimo");
const btnAddE = document.getElementById("btn-add-emprestimo");
const closeE = modalE?.querySelector(".close");
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

let emprestimos = [];
let usuarios = [];
let livros = [];
let modo = "ativos"; // ativos | pendencias | historico

// ---------- helpers ----------
async function apiGet(url) {
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.erro || "Erro na API.");
  return data;
}

async function apiPost(url, payload) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.erro || "Erro na API.");
  return data;
}

async function apiPatch(url) {
  const r = await fetch(url, { method: "PATCH" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.erro || "Erro na API.");
  return data;
}

function formatDateTimeBr(isoOrDate) {
  try {
    const d = new Date(isoOrDate);
    return d.toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
  } catch {
    return "-";
  }
}

function todayPlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------- modal open ----------
function abrirModal() {
  if (!modalE) return alert("Modal não encontrado (id modal-emprestimo).");
  modalE.classList.add("show");

  // data/hora automática (agora)
  dataHoraEmp.value = new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });

  // default: devolução em 7 dias (mude se quiser)
  if (!dataPrevista.value) dataPrevista.value = todayPlusDays(7);
}

// ---------- load ----------
async function carregarTudo() {
  try {
    // livros e usuários (para selects)
    [usuarios, livros] = await Promise.all([
      apiGet("/api/usuarios"),
      apiGet("/api/livros")
    ]);

    await carregarEmprestimos(); // conforme modo

    preencherLivros();
    preencherUsuarios(); // respeita tipo filtro
  } catch (err) {
    console.error(err);
    alert(err.message || "Falha ao carregar dados do banco.");
  }
}

async function carregarEmprestimos() {
  let url = "/api/emprestimos";
  if (modo === "pendencias") url = "/api/emprestimos/pendencias";
  if (modo === "historico") url = "/api/emprestimos/historico";

  emprestimos = await apiGet(url);
  renderEmprestimos();
}

// ---------- filtros ----------
function preencherUsuarios() {
  const tipo = tipoFiltro.value;
  const termo = (buscaUsuario.value || "").toLowerCase().trim();

  selUsuario.innerHTML = `<option value="">Selecione...</option>`;

  if (!tipo) {
    selUsuario.innerHTML = `<option value="">Selecione o tipo primeiro...</option>`;
    return;
  }

  const filtrados = usuarios
    .filter(u => (u.tipo || "Outro") === tipo)
    .filter(u => !termo || (u.nome || "").toLowerCase().includes(termo));

  if (filtrados.length === 0) {
    selUsuario.innerHTML = `<option value="">Nenhum ${tipo} encontrado...</option>`;
    return;
  }

  filtrados.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.nome} (ID ${u.id})`;
    selUsuario.appendChild(opt);
  });
}

function preencherLivros() {
  const termo = (buscaLivro.value || "").toLowerCase().trim();

  selLivro.innerHTML = `<option value="">Selecione...</option>`;

  const filtrados = livros
    .filter(l => Number(l.estoque) > 0)
    .filter(l => !termo || (l.titulo || "").toLowerCase().includes(termo));

  if (filtrados.length === 0) {
    selLivro.innerHTML = `<option value="">Nenhum livro com estoque disponível...</option>`;
    return;
  }

  filtrados.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = `${l.titulo} — estoque: ${l.estoque} (ID ${l.id})`;
    selLivro.appendChild(opt);
  });
}

// ---------- render ----------
function badgeStatus(status) {
  if (status === "Concluído") return `<span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">Concluído</span>`;
  if (status === "Atrasado") return `<span class="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-semibold">Atrasado</span>`;
  return `<span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 font-semibold">Ativo</span>`;
}

function renderEmprestimos() {
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

    row.innerHTML = `
      <td class="py-2 px-4">${e.id}</td>
      <td class="py-2 px-4">${e.usuario ?? "-"}</td>
      <td class="py-2 px-4">${e.livro ?? "-"}</td>
      <td class="py-2 px-4">${e.data_hora ? formatDateTimeBr(e.data_hora) : (e.data ?? "-")}</td>
      <td class="py-2 px-4">${e.data_prevista ?? "-"}</td>
      <td class="py-2 px-4">${badgeStatus(e.status)}</td>
      <td class="py-2 px-4 text-center">${btnDevolver}</td>
    `;
    emprestimosList.appendChild(row);
  });
}

// ---------- events ----------
btnAddE?.addEventListener("click", abrirModal);

closeE?.addEventListener("click", () => modalE.classList.remove("show"));
window.addEventListener("click", (e) => { if (e.target === modalE) modalE.classList.remove("show"); });

tipoFiltro.addEventListener("change", preencherUsuarios);
buscaUsuario.addEventListener("input", preencherUsuarios);

buscaLivro.addEventListener("input", preencherLivros);

formE.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario_id = Number(selUsuario.value);
  const livro_id = Number(selLivro.value);
  const data_prevista = dataPrevista.value;

  if (!usuario_id) return alert("Selecione um usuário.");
  if (!livro_id) return alert("Selecione um livro.");
  if (!data_prevista) return alert("Selecione a data prevista de devolução.");

  try {
    await apiPost("/api/emprestimos", { usuario_id, livro_id, data_prevista });
    modalE.classList.remove("show");
    formE.reset();
    dataPrevista.value = todayPlusDays(7);
    await carregarTudo();
  } catch (err) {
    alert(err.message || "Erro ao criar empréstimo.");
  }
});

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
    alert(err.message || "Erro ao devolver.");
  }
});

// tabs
function setTab(active) {
  modo = active;

  tabAtivos.className = "px-4 py-2 rounded-lg bg-white border text-gray-700 font-semibold";
  tabPendencias.className = "px-4 py-2 rounded-lg bg-white border text-gray-700 font-semibold";
  tabHistorico.className = "px-4 py-2 rounded-lg bg-white border text-gray-700 font-semibold";

  if (modo === "ativos") tabAtivos.className = "px-4 py-2 rounded-lg bg-green-700 text-white font-semibold";
  if (modo === "pendencias") tabPendencias.className = "px-4 py-2 rounded-lg bg-green-700 text-white font-semibold";
  if (modo === "historico") tabHistorico.className = "px-4 py-2 rounded-lg bg-green-700 text-white font-semibold";

  carregarEmprestimos().catch(console.error);
}

tabAtivos.addEventListener("click", () => setTab("ativos"));
tabPendencias.addEventListener("click", () => setTab("pendencias"));
tabHistorico.addEventListener("click", () => setTab("historico"));

document.addEventListener("DOMContentLoaded", carregarTudo);
