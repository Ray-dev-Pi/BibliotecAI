// dashboard.js — conecta ao backend /api
window.onload = () => {
  carregarResumoEmprestimos();
  carregarUltimosEmprestimos();
};

async function carregarResumoEmprestimos() {
  try {
    // Faz 3 requisições simultâneas
    const [livrosRes, usuariosRes, emprestimosRes] = await Promise.all([
      fetch("/api/livros"),
      fetch("/api/usuarios"),
      fetch("/api/emprestimos/resumo")
    ]);

    // Converte todas as respostas em JSON
    const livros = await livrosRes.json();
    const usuarios = await usuariosRes.json();
    const emprestimosResumo = await emprestimosRes.json();

    // Garante que as chaves existam mesmo que estejam ausentes
    const totalLivros = livros.length || 0;
    const totalUsuarios = usuarios.length || 0;
    const totalEmprestimos = emprestimosResumo.total || 0;
    const atrasados = emprestimosResumo.atrasados || 0;
    const concluidos = emprestimosResumo.concluidos || 0;

    // Renderiza os cards
    renderizarCards(totalLivros, totalUsuarios, totalEmprestimos, atrasados, concluidos);
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

async function carregarUltimosEmprestimos() {
  try {
    const res = await fetch("/api/emprestimos");
    const emprestimos = await res.json();
    renderizarTabela(emprestimos);
  } catch (error) {
    console.error("Erro ao carregar empréstimos:", error);
  }
}

function renderizarCards(livros, usuarios, totalEmprestimos, atrasados, concluidos) {
  const container = document.getElementById("cards-emprestimos");
  container.innerHTML = `
    ${criarCard("Total de Livros", livros, "fa-book", "text-green-700", "border-green-600")}
    ${criarCard("Usuários Cadastrados", usuarios, "fa-users", "text-blue-700", "border-blue-600")}
    ${criarCard("Total de Empréstimos", totalEmprestimos, "fa-handshake", "text-indigo-700", "border-indigo-600")}
    ${criarCard("Pendências (Atrasos)", atrasados, "fa-exclamation-triangle", "text-red-700", "border-red-600")}
    ${criarCard("Concluídos", concluidos, "fa-check-circle", "text-yellow-700", "border-yellow-600")}
  `;
}

function criarCard(titulo, valor, icone, corTexto, corBorda) {
  return `
    <div class="bg-white rounded-xl p-6 shadow-md border-l-4 ${corBorda}">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-700">${titulo}</h2>
          <p class="text-3xl font-bold ${corTexto}">${valor}</p>
        </div>
        <i class="fas ${icone} ${corTexto} text-3xl"></i>
      </div>
    </div>
  `;
}

function renderizarTabela(emprestimos) {
  const tbody = document.getElementById("lista-emprestimos");
  if (!tbody) return; // evita erro se o elemento não existir ainda
  tbody.innerHTML = "";

  if (!Array.isArray(emprestimos) || emprestimos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="py-4 text-center text-gray-500">
          Nenhum empréstimo encontrado.
        </td>
      </tr>`;
    return;
  }

  emprestimos.forEach(e => {
    const corStatus =
      e.status === "Atrasado"
        ? "text-red-600 font-semibold"
        : e.status === "Concluído"
        ? "text-blue-600 font-semibold"
        : "text-green-600 font-semibold";

    const dataFormatada = e.data_emprestimo
      ? new Date(e.data_emprestimo).toLocaleDateString("pt-BR")
      : "-";

    tbody.innerHTML += `
      <tr>
        <td class="py-2 px-4">${e.usuario || "Desconhecido"}</td>
        <td class="py-2 px-4">${e.livro || "Sem título"}</td>
        <td class="py-2 px-4">${dataFormatada}</td>
        <td class="py-2 px-4 ${corStatus}">${e.status || "Em andamento"}</td>
      </tr>
    `;
  });
}
