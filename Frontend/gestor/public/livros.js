// livros.js — Livros no MySQL via API (Vercel/Railway)

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

  // Seus inputs do HTML:
  const tombo = document.getElementById("tombo").value;
  const vol = document.getElementById("vol").value;
  const ano = document.getElementById("ano").value;
  const edicao = document.getElementById("edicao").value;
  const area = document.getElementById("area").value;
  const autor = document.getElementById("autor").value;
  const titulo = document.getElementById("titulo").value;
  const local = document.getElementById("local").value;
  const editora = document.getElementById("editora").value;

  // ⚠️ Seu backend hoje salva só: titulo, autor, estoque.
  // Então aqui vamos usar:
  // - titulo = título do livro
  // - autor = autor do livro
  // - estoque = 1 (ou você pode definir estoque fixo)
  // E os outros campos (tombo, area, etc.) só vão ser realmente salvos
  // quando você atualizar a tabela 'livros' no banco e o POST do backend.

  if (!titulo || !titulo.trim()) return alert("Título é obrigatório.");
  if (!autor || !autor.trim()) return alert("Autor é obrigatório.");
  if (!area || !area.trim()) return alert("Área do conhecimento é obrigatória.");
  if (!editora || !editora.trim()) return alert("Editora é obrigatória.");
  if (!tombo) return alert("Tombo é obrigatório.");
  if (!ano) return alert("Ano é obrigatório.");

  try {
    await apiCreateLivro({
      titulo: titulo.trim(),
      autor: autor.trim(),
      estoque: 1
    });

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

  livros.forEach((l) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="py-2 px-4">-</td>
      <td class="py-2 px-4">${l.id ?? "-"}</td>
      <td class="py-2 px-4">-</td>
      <td class="py-2 px-4">${l.autor ?? "-"}</td>
      <td class="py-2 px-4">${l.titulo ?? "-"}</td>
      <td class="py-2 px-4">-</td>
      <td class="py-2 px-4">-</td>
      <td class="py-2 px-4">-</td>
      <td class="py-2 px-4">-</td>
      <td class="py-2 px-4">-</td>
      <td class="py-2 px-4 text-center">-</td>
    `;
    livrosList.appendChild(row);
  });
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", carregarLivros);
