// emprestimos.js — Empréstimos no MySQL via API

const modalE = document.getElementById("modal-emprestimo");
const btnAddE = document.getElementById("btn-add-emprestimo");
const closeE = modalE.querySelector(".close");
const formE = document.getElementById("form-emprestimo");

const emprestimosList = document.getElementById("emprestimos-list");
const selUsuario = document.getElementById("usuario_id");
const selLivro = document.getElementById("livro_id");

let emprestimos = [];
let usuarios = [];
let livros = [];

// ---------- API helpers ----------
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

// ---------- Load ----------
async function carregarTudo() {
  try {
    [emprestimos, usuarios, livros] = await Promise.all([
      apiGet("/api/emprestimos"),
      apiGet("/api/usuarios"),
      apiGet("/api/livros"),
    ]);

    renderEmprestimos();
    preencherSelects();
  } catch (err) {
    console.error(err);
    alert(err.message || "Falha ao carregar dados do banco.");
  }
}

function preencherSelects() {
  // Usuários
  selUsuario.innerHTML = `<option value="">Selecione um usuário...</option>`;
  usuarios.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.nome} (ID ${u.id})`;
    selUsuario.appendChild(opt);
  });

  // Livros com estoque > 0
  selLivro.innerHTML = `<option value="">Selecione um livro...</option>`;
  livros
    .filter((l) => Number(l.estoque) > 0)
    .forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = `${l.titulo} — estoque: ${l.estoque} (ID ${l.id})`;
      selLivro.appendChild(opt);
    });
}

// ---------- Render ----------
function renderEmprestimos() {
  emprestimosList.innerHTML = "";

  if (!emprestimos || emprestimos.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="py-4 px-4 text-gray-500" colspan="6">
        Nenhum empréstimo registrado ainda.
      </td>
    `;
    emprestimosList.appendChild(row);
    return;
  }

  emprestimos.forEach((e) => {
    const row = document.createElement("tr");

    const statusBadge =
      e.status === "Concluído"
        ? `<span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">Concluído</span>`
        : e.status === "Atrasado"
        ? `<span class="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-semibold">Atrasado</span>`
        : `<span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 font-semibold">Ativo</span>`;

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
      <td class="py-2 px-4">${e.data ?? "-"}</td>
      <td class="py-2 px-4">${statusBadge}</td>
      <td class="py-2 px-4 text-center">
        ${btnDevolver}
      </td>
    `;

    emprestimosList.appendChild(row);
  });
}

// ---------- Modal ----------
btnAddE.addEventListener("click", () => {
  modalE.classList.add("show");
});

closeE.addEventListener("click", () => modalE.classList.remove("show"));

window.addEventListener("click", (e) => {
  if (e.target === modalE) modalE.classList.remove("show");
});

// ---------- Submit ----------
formE.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario_id = Number(selUsuario.value);
  const livro_id = Number(selLivro.value);

  if (!usuario_id || !livro_id) {
    return alert("Selecione usuário e livro.");
  }

  try {
    await apiPost("/api/emprestimos", { usuario_id, livro_id });
    modalE.classList.remove("show");
    formE.reset();
    await carregarTudo(); // recarrega lista + estoque atualizado
  } catch (err) {
    alert(err.message || "Erro ao criar empréstimo.");
  }
});

// ---------- Ações na tabela ----------
emprestimosList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");
  if (!action || !id) return;

  if (action === "devolver") {
    if (!confirm("Confirmar devolução deste empréstimo?")) return;

    try {
      await apiPatch(`/api/emprestimos/${id}/devolver`);
      await carregarTudo();
    } catch (err) {
      alert(err.message || "Erro ao devolver empréstimo.");
    }
  }
});

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", carregarTudo);
