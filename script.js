/* ==========================================================
   SISTEMA CAÓTICO
   Lógica do site em JavaScript.
   Os nomes das variáveis e funções estão em português.
   Não usa IA, servidor ou bibliotecas externas.
   ========================================================== */

// $ é uma função curta para encontrar um elemento pelo ID.
// Exemplo: encontrar("nomePersonagem") encontra aquele campo no HTML.
function encontrar(id) {
    return document.getElementById(id);
}

// Dados iniciais da ficha. Altere estes valores se quiser
// começar todas as fichas com outros atributos ou pontos de vida.
const fichaInicial = {
    nome: "",
    classe: "",
    nivel: 1,
    conceito: "",
    atributos: [
        { nome: "Corpo", fino: 4, bruto: 13 },
        { nome: "Alma", fino: 1, bruto: 3 },
        { nome: "Consciência", fino: 0, bruto: 4 },
        { nome: "Fala", fino: 0, bruto: 6 }
    ],
    vidaAtual: 91,
    vidaMaxima: 91,
    inventario: [],
    habilidades: [],
    condicoes: [],
    anotacoes: "",
    historico: []
};

// Recupera a ficha salva no navegador.
// Se ainda não existir uma ficha salva, usa os dados iniciais.
function carregarFicha() {
    const fichaSalva = localStorage.getItem("fichaSistemaCaotico");

    if (fichaSalva) {
        try {
            return Object.assign(
                JSON.parse(JSON.stringify(fichaInicial)),
                JSON.parse(fichaSalva)
            );
        } catch (erro) {
            return JSON.parse(JSON.stringify(fichaInicial));
        }
    }

    return JSON.parse(JSON.stringify(fichaInicial));
}

let ficha = carregarFicha();
let tipoAlteracaoVida = "dano";

// Salva os dados no próprio navegador. Não envia nada para a internet.
function salvarFicha() {
    localStorage.setItem("fichaSistemaCaotico", JSON.stringify(ficha));
    encontrar("estadoSalvamento").textContent = "● Salvamento automático · salvo";
}

// Evita que textos digitados pelo usuário sejam interpretados como HTML.
function protegerTexto(texto) {
    return String(texto).replace(/[&<>"']/g, function (caractere) {
        const caracteresSeguros = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return caracteresSeguros[caractere];
    });
}

// Adiciona uma mensagem ao histórico da ficha.
function registrarHistorico(mensagem) {
    const agora = new Date();
    const horario = agora.toLocaleString("pt-BR");

    ficha.historico.unshift({
        mensagem: mensagem,
        horario: horario
    });

    // Mantém apenas as 30 alterações mais recentes.
    ficha.historico = ficha.historico.slice(0, 30);

    mostrarHistorico();
    salvarFicha();
}

// Mostra os atributos na tela.
function mostrarAtributos() {
    const lista = encontrar("listaAtributos");
    lista.innerHTML = "";

    ficha.atributos.forEach(function (atributo, indice) {
        const linha = document.createElement("div");
        linha.className = "linha-atributo";

        linha.innerHTML = `
            <span class="nome-atributo">${protegerTexto(atributo.nome)}</span>
            <label class="celula-atributo">
                <small>FINO</small>
                <input class="valor-atributo" type="number"
                       data-indice="${indice}" data-tipo="fino"
                       value="${atributo.fino}">
            </label>
            <label class="celula-atributo">
                <small>BRUTO</small>
                <input class="valor-atributo" type="number"
                       data-indice="${indice}" data-tipo="bruto"
                       value="${atributo.bruto}">
            </label>
        `;

        lista.appendChild(linha);
    });

    // Quando um valor muda, atualiza os dados da ficha.
    document.querySelectorAll(".valor-atributo").forEach(function (campo) {
        campo.addEventListener("change", function () {
            const indice = Number(campo.dataset.indice);
            const tipo = campo.dataset.tipo;
            const atributo = ficha.atributos[indice];

            atributo[tipo] = Number(campo.value) || 0;
            registrarHistorico(
                atributo.nome + ": " + tipo + " alterado para " + campo.value + "."
            );
        });
    });
}

// Atualiza os números e a barra de vida.
function mostrarVida() {
    encontrar("vidaAtual").value = ficha.vidaAtual;
    encontrar("vidaMaxima").value = ficha.vidaMaxima;
    encontrar("vidaAtualTexto").textContent = ficha.vidaAtual;
    encontrar("vidaMaximaTexto").textContent = ficha.vidaMaxima;

    let porcentagem = (ficha.vidaAtual / ficha.vidaMaxima) * 100;
    porcentagem = Math.max(0, Math.min(100, porcentagem));

    encontrar("preenchimentoVida").style.width = porcentagem + "%";

    if (porcentagem <= 25) {
        encontrar("preenchimentoVida").style.background =
            "linear-gradient(90deg, #9e344b, #e07886)";
    } else {
        encontrar("preenchimentoVida").style.background =
            "linear-gradient(90deg, #8c4caa, #c17bcf)";
    }
}

// Mostra os itens do inventário.
function mostrarInventario() {
    const lista = encontrar("listaInventario");
    encontrar("contadorItens").textContent = ficha.inventario.length + " ITENS";

    if (ficha.inventario.length === 0) {
        lista.className = "lista-registros vazio";
        lista.textContent = "Nenhum item registrado.";
        return;
    }

    lista.className = "lista-registros";
    lista.innerHTML = "";

    ficha.inventario.forEach(function (item, indice) {
        const registro = document.createElement("div");
        registro.className = "registro";
        registro.innerHTML = `
            <div class="registro-conteudo">
                <span class="registro-nome">${protegerTexto(item.nome)}</span>
                <span class="registro-quantidade">× ${item.quantidade}</span>
            </div>
            <button class="botao-remover" type="button"
                    data-remover-item="${indice}" aria-label="Remover item">×</button>
        `;
        lista.appendChild(registro);
    });

    document.querySelectorAll("[data-remover-item]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const indice = Number(botao.dataset.removerItem);
            const itemRemovido = ficha.inventario.splice(indice, 1)[0];
            registrarHistorico("Item removido: " + itemRemovido.nome + ".");
            mostrarInventario();
        });
    });
}

// Mostra as habilidades cadastradas.
function mostrarHabilidades() {
    const lista = encontrar("listaHabilidades");
    encontrar("contadorHabilidades").textContent =
        ficha.habilidades.length + " REGISTROS";

    if (ficha.habilidades.length === 0) {
        lista.className = "lista-registros vazio";
        lista.textContent = "Nenhuma habilidade registrada.";
        return;
    }

    lista.className = "lista-registros";
    lista.innerHTML = "";

    ficha.habilidades.forEach(function (habilidade, indice) {
        const registro = document.createElement("div");
        registro.className = "registro";

        registro.innerHTML = `
            <div class="registro-conteudo">
                <div class="registro-nome">${protegerTexto(habilidade.nome)}</div>
                <div class="registro-descricao">${protegerTexto(habilidade.descricao)}</div>
            </div>
            <button class="botao-remover" type="button"
                    data-remover-habilidade="${indice}" aria-label="Remover habilidade">×</button>
        `;

        lista.appendChild(registro);
    });

    document.querySelectorAll("[data-remover-habilidade]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const indice = Number(botao.dataset.removerHabilidade);
            const removida = ficha.habilidades.splice(indice, 1)[0];
            registrarHistorico("Habilidade removida: " + removida.nome + ".");
            mostrarHabilidades();
        });
    });
}

// Mostra as condições ativas.
function mostrarCondicoes() {
    const lista = encontrar("listaCondicoes");
    encontrar("contadorCondicoes").textContent =
        ficha.condicoes.length + " ATIVAS";

    if (ficha.condicoes.length === 0) {
        lista.className = "lista-condicoes vazio";
        lista.textContent = "Nenhuma condição ativa.";
        return;
    }

    lista.className = "lista-condicoes";
    lista.innerHTML = "";

    ficha.condicoes.forEach(function (condicao, indice) {
        const etiqueta = document.createElement("span");
        etiqueta.className = "condicao";
        etiqueta.innerHTML = `
            ${protegerTexto(condicao)}
            <button type="button" data-remover-condicao="${indice}"
                    aria-label="Remover condição">×</button>
        `;
        lista.appendChild(etiqueta);
    });

    document.querySelectorAll("[data-remover-condicao]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const indice = Number(botao.dataset.removerCondicao);
            const removida = ficha.condicoes.splice(indice, 1)[0];
            registrarHistorico("Condição removida: " + removida + ".");
            mostrarCondicoes();
        });
    });
}

// Mostra o histórico de alterações.
function mostrarHistorico() {
    const lista = encontrar("listaHistorico");

    if (ficha.historico.length === 0) {
        lista.className = "lista-historico vazio";
        lista.textContent = "Nenhuma alteração registrada ainda.";
        return;
    }

    lista.className = "lista-historico";
    lista.innerHTML = "";

    ficha.historico.forEach(function (registro) {
        const linha = document.createElement("div");
        linha.className = "linha-historico";
        linha.innerHTML = `
            <span>${protegerTexto(registro.mensagem)}</span>
            <time>${protegerTexto(registro.horario)}</time>
        `;
        lista.appendChild(linha);
    });
}

// Coloca os dados salvos nos campos da página.
function mostrarFicha() {
    encontrar("nomePersonagem").value = ficha.nome;
    encontrar("classePersonagem").value = ficha.classe;
    encontrar("nivelPersonagem").value = ficha.nivel;
    encontrar("conceitoPersonagem").value = ficha.conceito;
    encontrar("anotacoes").value = ficha.anotacoes;

    encontrar("tituloPersonagem").textContent =
        ficha.nome || "O desconhecido";

    mostrarAtributos();
    mostrarVida();
    mostrarInventario();
    mostrarHabilidades();
    mostrarCondicoes();
    mostrarHistorico();
}

// Atualiza o título enquanto o nome é digitado.
encontrar("nomePersonagem").addEventListener("input", function () {
    ficha.nome = encontrar("nomePersonagem").value;
    encontrar("tituloPersonagem").textContent = ficha.nome || "O desconhecido";
    salvarFicha();
});

// Salva os outros campos de texto.
encontrar("classePersonagem").addEventListener("input", function () {
    ficha.classe = this.value;
    salvarFicha();
});

encontrar("nivelPersonagem").addEventListener("change", function () {
    ficha.nivel = Math.max(1, Number(this.value) || 1);
    this.value = ficha.nivel;
    salvarFicha();
});

encontrar("conceitoPersonagem").addEventListener("input", function () {
    ficha.conceito = this.value;
    salvarFicha();
});

encontrar("anotacoes").addEventListener("input", function () {
    ficha.anotacoes = this.value;
    salvarFicha();
});

// Permite editar os pontos de vida diretamente nos campos.
encontrar("vidaAtual").addEventListener("change", function () {
    ficha.vidaAtual = Math.max(0, Number(this.value) || 0);
    mostrarVida();
    registrarHistorico("Vida atual ajustada para " + ficha.vidaAtual + " PV.");
});

encontrar("vidaMaxima").addEventListener("change", function () {
    ficha.vidaMaxima = Math.max(1, Number(this.value) || 1);
    ficha.vidaAtual = Math.min(ficha.vidaAtual, ficha.vidaMaxima);
    mostrarVida();
    registrarHistorico("Vida máxima ajustada para " + ficha.vidaMaxima + " PV.");
});

// Abre a janela para aplicar dano ou recuperar vida.
function abrirJanelaVida(tipo) {
    tipoAlteracaoVida = tipo;

    if (tipo === "dano") {
        encontrar("tituloJanela").textContent = "Receber dano";
    } else {
        encontrar("tituloJanela").textContent = "Recuperar vida";
    }

    encontrar("janelaVida").classList.add("aberta");
    encontrar("quantidadeVida").value = 1;
    encontrar("quantidadeVida").focus();
}

function fecharJanelaVida() {
    encontrar("janelaVida").classList.remove("aberta");
}

encontrar("botaoDano").addEventListener("click", function () {
    abrirJanelaVida("dano");
});

encontrar("botaoCura").addEventListener("click", function () {
    abrirJanelaVida("cura");
});

encontrar("botaoFecharJanela").addEventListener("click", fecharJanelaVida);

// Faz o cálculo de dano ou cura quando o formulário é enviado.
encontrar("formularioVida").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const quantidade = Math.max(1, Number(encontrar("quantidadeVida").value) || 1);
    const vidaAntes = ficha.vidaAtual;

    if (tipoAlteracaoVida === "dano") {
        ficha.vidaAtual = Math.max(0, ficha.vidaAtual - quantidade);
    } else {
        ficha.vidaAtual = Math.min(ficha.vidaMaxima, ficha.vidaAtual + quantidade);
    }

    mostrarVida();

    const diferenca = Math.abs(ficha.vidaAtual - vidaAntes);
    const acao = tipoAlteracaoVida === "dano" ? "Dano recebido" : "Vida recuperada";

    registrarHistorico(
        acao + ": " + diferenca + " PV (" + vidaAntes + " → " + ficha.vidaAtual + ")."
    );

    fecharJanelaVida();
});

// Adiciona um item ao inventário.
encontrar("formularioItem").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nome = encontrar("nomeItem").value.trim();
    const quantidade = Math.max(1, Number(encontrar("quantidadeItem").value) || 1);

    if (nome === "") return;

    ficha.inventario.push({ nome: nome, quantidade: quantidade });

    encontrar("nomeItem").value = "";
    encontrar("quantidadeItem").value = 1;

    mostrarInventario();
    registrarHistorico("Item adicionado: " + nome + " (quantidade: " + quantidade + ").");
});

// Adiciona uma habilidade.
encontrar("formularioHabilidade").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nome = encontrar("nomeHabilidade").value.trim();
    const descricao = encontrar("descricaoHabilidade").value.trim();

    if (nome === "") return;

    ficha.habilidades.push({ nome: nome, descricao: descricao });

    encontrar("nomeHabilidade").value = "";
    encontrar("descricaoHabilidade").value = "";

    mostrarHabilidades();
    registrarHistorico("Habilidade registrada: " + nome + ".");
});

// Adiciona uma condição.
encontrar("formularioCondicao").addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nome = encontrar("nomeCondicao").value.trim();

    if (nome === "") return;

    ficha.condicoes.push(nome);
    encontrar("nomeCondicao").value = "";

    mostrarCondicoes();
    registrarHistorico("Condição aplicada: " + nome + ".");
});

// Apaga somente o histórico.
encontrar("botaoLimparHistorico").addEventListener("click", function () {
    if (confirm("Deseja apagar todo o histórico?")) {
        ficha.historico = [];
        mostrarHistorico();
        salvarFicha();
    }
});

// Restaura todos os campos para os valores iniciais.
encontrar("botaoRestaurar").addEventListener("click", function () {
    const confirmou = confirm(
        "Restaurar a ficha? Todos os dados atuais serão apagados."
    );

    if (confirmou) {
        ficha = JSON.parse(JSON.stringify(fichaInicial));
        mostrarFicha();
        salvarFicha();
    }
});

// Fecha a janela se o usuário clicar fora dela.
encontrar("janelaVida").addEventListener("click", function (evento) {
    if (evento.target === encontrar("janelaVida")) {
        fecharJanelaVida();
    }
});

// Inicia o site mostrando os dados que foram carregados.
mostrarFicha();
salvarFicha();
