// livros.js — Livros no MySQL via API (Vercel/Railway) [COMPLETO]

const modalL = document.getElementById("modal-livro");
const btnAddL = document.getElementById("btn-add-livro");
const closeL = modalL.querySelector(".close");
const formL = document.getElementById("form-livro");
const livrosList = document.getElementById("livros-list");
const modalTitleL = document.getElementById("modal-title");
const livroIdInput = document.getElementById("livro-id");

let livros = [];

// ---------- API ----------
async function apiGetLivros() {
  const resp = await fetch("/api/livros");
  if (!resp.ok) throw new Error("Falha ao carregar livros.");
  return resp.json();
}

async function apiCreateLivro(payload) {
  const resp = await fetch("/api/livros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
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

  const payload = {
    tombo: document.getElementById("tombo").value,
    vol: document.getElementById("vol").value,
    ano: document.getElementById("ano").value,
    edicao: document.getElementById("edicao").value,
    area: document.getElementById("area").value,
    autor: document.getElementById("autor").value,
    titulo: document.getElementById("titulo").value,
    local: document.getElementById("local").value,
    editora: document.getElementById("editora").value,
    estoque: 1
  };

  // validações (iguais ao backend)
  if (!payload.area || !payload.area.trim()) return alert("Área do conhecimento é obrigatória.");
  if (payload.tombo === undefined || payload.tombo === null || String(payload.tombo).trim() === "") return alert("Tombo é obrigatório.");
  if (!payload.autor || !payload.autor.trim()) return alert("Autor é obrigatório.");
  if (!payload.titulo || !payload.titulo.trim()) return alert("Título é obrigatório.");
  if (!payload.editora || !payload.editora.trim()) return alert("Editora é obrigatória.");
  if (payload.ano === undefined || payload.ano === null || String(payload.ano).trim() === "") return alert("Ano é obrigatório.");

  try {
    await apiCreateLivro(payload);
    await carregarLivros();
    modalL.classList.remove("show");
    formL.reset();
  } catch (err) {
    alert(err.message);
  }
});

// ---------- RENDER ----------
function renderLivros() {
  livrosList.innerHTML = "";

  livros.forEach((livro, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="py-2 px-4">${livro.area ?? "-"}</td>
      <td class="py-2 px-4">${livro.id ?? "-"}</td>
      <td class="py-2 px-4">${livro.tombo ?? "-"}</td>
      <td class="py-2 px-4">${livro.autor ?? "-"}</td>
      <td class="py-2 px-4">${livro.titulo ?? "-"}</td>
      <td class="py-2 px-4">${livro.vol ?? "-"}</td>
      <td class="py-2 px-4">${livro.edicao ?? "-"}</td>
      <td class="py-2 px-4">${livro.local ?? "-"}</td>
      <td class="py-2 px-4">${livro.editora ?? "-"}</td>
      <td class="py-2 px-4">${livro.ano ?? "-"}</td>
      <td class="py-2 px-4 text-center">
        <span class="text-gray-400">—</span>
      </td>
    `;
    livrosList.appendChild(row);
  });
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", carregarLivros);
