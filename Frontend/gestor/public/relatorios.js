window.onload = () => {
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const livros = JSON.parse(localStorage.getItem("livros")) || [];

  const totalLivros = livros.length;
  const totalUsuarios = usuarios.length;
  const totalAlunos = usuarios.filter(u => u.tipo === "Aluno").length;
  const totalProfessores = usuarios.filter(u => u.tipo === "Professor").length;

  const pendentes = gerarPendenciasAleatorias(usuarios, livros);

  renderCards(totalLivros, totalUsuarios, totalAlunos, totalProfessores, pendentes.length);
  renderTabelaPendencias(pendentes);

  document.getElementById("btn-pdf").addEventListener("click", gerarPDF);
};

function gerarPendenciasAleatorias(usuarios, livros) {
  const pendentes = [];
  if (usuarios.length === 0 || livros.length === 0) return pendentes;

  const quantidade = Math.min(usuarios.length, Math.floor(Math.random() * 3) + 1);
  const usados = new Set();

  for (let i = 0; i < quantidade; i++) {
    let userIndex;
    do { userIndex = Math.floor(Math.random() * usuarios.length); }
    while (usados.has(userIndex));
    usados.add(userIndex);

    const user = usuarios[userIndex];
    const livro = livros[Math.floor(Math.random() * livros.length)];
    const diasAtraso = Math.floor(Math.random() * 10) + 1;

    pendentes.push({
      nome: user.nome,
      tipo: user.tipo,
      telefone: user.telefone || "—",
      livro: livro.titulo || "Livro Desconhecido",
      dias: diasAtraso
    });
  }
  return pendentes;
}

function renderCards(livros, usuarios, alunos, professores, pendentes) {
  const cardsContainer = document.getElementById("cards-container");
  cardsContainer.innerHTML = `
    ${criarCard("Total de Livros", livros, "fa-book", "border-green-600", "text-green-700")}
    ${criarCard("Total de Usuários", usuarios, "fa-users", "border-blue-600", "text-blue-700")}
    ${criarCard("Alunos", alunos, "fa-user-graduate", "border-yellow-500", "text-yellow-600")}
    ${criarCard("Professores", professores, "fa-chalkboard-teacher", "border-indigo-600", "text-indigo-700")}
    ${criarCard("Pendências", pendentes, "fa-exclamation-triangle", "border-red-600", "text-red-700")}
  `;
}

function criarCard(titulo, valor, icone, borda, texto) {
  return `
    <div class="card bg-white rounded-xl p-6 shadow-md border-l-4 ${borda}">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-700">${titulo}</h2>
          <p class="text-3xl font-bold ${texto}">${valor}</p>
        </div>
        <i class="fas ${icone} ${texto} text-3xl"></i>
      </div>
    </div>
  `;
}

function renderTabelaPendencias(pendentes) {
  const tbody = document.getElementById("pendencias-list");
  tbody.innerHTML = "";
  if (pendentes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhuma pendência encontrada.</td></tr>`;
    return;
  }

  pendentes.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="py-2 px-4">${p.nome}</td>
      <td class="py-2 px-4">${p.tipo}</td>
      <td class="py-2 px-4">${p.telefone}</td>
      <td class="py-2 px-4">${p.livro}</td>
      <td class="py-2 px-4">${p.dias} dias</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------- GERAR PDF ----------
async function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const relatorio = document.getElementById("relatorio-container");

  const pdf = new jsPDF("p", "mm", "a4");
  const canvas = await html2canvas(relatorio, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 190;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let position = 10;

  pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
  pdf.save(`Relatorio_BibliotecAI_${new Date().toLocaleDateString()}.pdf`);
}
