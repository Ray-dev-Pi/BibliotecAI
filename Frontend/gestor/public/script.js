    const modal = document.getElementById("modal-livro");
    const btnAdd = document.getElementById("btn-add-livro");
    const closeModal = modal.querySelector(".close");
    const formLivro = document.getElementById("form-livro");
    const livrosList = document.getElementById("livros-list");
    const modalTitle = document.getElementById("modal-title");
    const livroIdInput = document.getElementById("livro-id");

    let livros = [];
    let editIndex = null;

    // Abrir modal
    btnAdd.onclick = () => {
        modal.classList.add("show");
        modalTitle.textContent = "Adicionar Livro";
        formLivro.reset();
        editIndex = null;
    };

    // Fechar modal
    closeModal.onclick = () => modal.classList.remove("show");
    window.onclick = (e) => { if(e.target == modal) modal.classList.remove("show"); }

    // Salvar livro
    formLivro.onsubmit = function(e){
        e.preventDefault();
        const livro = {
            area: document.getElementById("area").value,
            id: livroIdInput.value || (livros.length + 1),
            tombo: document.getElementById("tombo").value,
            autor: document.getElementById("autor").value,
            titulo: document.getElementById("titulo").value,
            vol: document.getElementById("vol").value, // texto agora
            edicao: document.getElementById("edicao").value,
            local: document.getElementById("local").value,
            editora: document.getElementById("editora").value,
            ano: document.getElementById("ano").value
        };
        

        if(editIndex !== null){
            livros[editIndex] = livro;
        } else {
            livros.push(livro);
        }

        renderTable();
        modal.classList.remove("show");
        formLivro.reset();
    }

    // Renderizar tabela
    function renderTable(){
        livrosList.innerHTML = "";
        livros.forEach((livro, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${livro.area}</td>
                <td>${livro.id}</td>
                <td>${livro.tombo}</td>
                <td>${livro.autor}</td>
                <td>${livro.titulo}</td>
                <td>${livro.vol}</td>
                <td>${livro.edicao}</td>
                <td>${livro.local}</td>
                <td>${livro.editora}</td>
                <td>${livro.ano}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editLivro(${index})">Editar</button>
                    <button class="action-btn delete-btn" onclick="deleteLivro(${index})">Deletar</button>
                </td>
            `;
            livrosList.appendChild(row);
        });
    }

    // Editar livro
    function editLivro(index){
        const livro = livros[index];
        livroIdInput.value = livro.id;
        document.getElementById("area").value = livro.area;
        document.getElementById("tombo").value = livro.tombo;
        document.getElementById("autor").value = livro.autor;
        document.getElementById("titulo").value = livro.titulo;
        document.getElementById("vol").value = livro.vol;
        document.getElementById("edicao").value = livro.edicao;
        document.getElementById("local").value = livro.local;
        document.getElementById("editora").value = livro.editora;
        document.getElementById("ano").value = livro.ano;

        editIndex = index;
        modalTitle.textContent = "Editar Livro";
        modal.classList.add("show");
    }

    // Deletar livro
    function deleteLivro(index){
        if(confirm("Deseja realmente deletar este livro?")){
            livros.splice(index, 1);
            renderTable();
        }
    }
            