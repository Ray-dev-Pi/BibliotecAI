// livros.js — Livros no MySQL via API (Vercel/Railway)

const modalL = document.getElementById("modal-livro");
const btnAddL = document.getElementById("btn-add-livro");
const closeL = modalL.querySelector(".close");
const formL = document.getElementById("form-livro");
const livrosList = document.getElementById("livros-list");
const modalTitleL = document.getElementById("modal-title");
const livroIdInput = document.getElementById("livro-id");

let livros = [];

// ---------- helpers ----------
function v(id) {
  const el = document.getElementById(id);
  return el ? (el.value ?? "").toString().trim() : "";
}

async function apiGetLivros() {
  const resp = await fetch("/api/livros");
  if (!resp.ok) throw new Error("Falha ao carregar livros.");
  return resp.json();
}

async function apiCreateLivro(payload) {
  const resp = await fetch("/api/livros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.erro || "Erro ao cadastrar livro.");
  return data;
}

// ---------- LOAD ----------
async function carregarLivros() {
  try {
    livros = await apiGetLivros();
    renderLivros();
  } catch (err) {
    console.error(err);
    alert("Não foi possível carregar livros do banco.");
  }
}

// ---------- MODAL ----------
btnAddL.addEventListener("click", () => {
  modalL.classList.add("show");
  formL.reset();
  livroIdInput.value = "";
  modalTitleL.textContent = "Adicionar Livro";
});

closeL.addEventListener("click", () => modalL.classList.remove("show"));
window.addEventListener("click", (e) => {
  if (e.target === modalL) modalL.classList.remove("show");
});

// ---------- SALVAR ----------
formL.addEventListener("submit", async (e) => {
  e.preventDefault();

  // pega os valores SEM depender de variável global
  const tombo = v("tombo");
  const vol = v("vol");
  const ano = v("ano");
  const edicao = v("edicao");
  const area = v("area");
  const autor = v("autor");
  const titulo = v("titulo");
  const local = v("local");
  const editora = v("editora");

  console.log("[DEBUG LIVRO]", { tombo, vol, ano, edicao, area, autor, titulo, local, editora });

  if (!area) return alert("Área do conhecimento é obrigatória.");
  if (!autor) return alert("Autor é obrigatório.");
  if (!titulo) return alert("Título é obrigatório.");
  if (!editora) return alert("Editora é obrigatória.");
  if (!tombo) return alert("Tombo é obrigatório.");
  if (!ano) return alert("Ano é obrigatório.");

  try {
    // Agora que sua tabela já tem colunas extras, vamos salvar tudo
    await apiCreateLivro({
      area,
      tombo: Number(tombo),
      autor,
      titulo,
      vol: vol || null,
      edicao: edicao || null,
      local: local || null,
      editora,
      ano: Number(ano),
      estoque: 1,
    });

    await carregarLivros();

    modalL.classList.remove("show");
    formL.reset();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// ---------- RENDER ----------
function renderLivros() {
  livrosList.innerHTML = "";

  livros.forEach((l, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="py-2 px-4">${l.area ?? "-"}</td>
      <td class="py-2 px-4">${l.id ?? "-"}</td>
      <td class="py-2 px-4">${l.tombo ?? "-"}</td>
      <td class="py-2 px-4">${l.autor ?? "-"}</td>
      <td class="py-2 px-4">${l.titulo ?? "-"}</td>
      <td class="py-2 px-4">${l.vol ?? "-"}</td>
      <td class="py-2 px-4">${l.edicao ?? "-"}</td>
      <td class="py-2 px-4">${l.local ?? "-"}</td>
      <td class="py-2 px-4">${l.editora ?? "-"}</td>
      <td class="py-2 px-4">${l.ano ?? "-"}</td>
      <td class="py-2 px-4 text-center">-</td>
    `;
    livrosList.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", carregarLivros);
