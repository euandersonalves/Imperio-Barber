/* =====================================================================
   SITE DA IMPÉRIO BARBER - ARQUIVO JAVASCRIPT (o comportamento do site)
   =====================================================================
   O JavaScript faz o site "ganhar vida": reage a cliques, move o
   carrossel, abre a foto ampliada etc.

   COMO LER ESTE ARQUIVO:
   - "var" cria uma variável (uma caixinha que guarda um valor)
   - "function nome() { ... }" cria uma função (um bloco de código que
     podemos chamar pelo nome quando precisarmos)
   - "document.getElementById('x')" busca no HTML o elemento com id="x"
   - "addEventListener('click', ...)" diz: "quando clicarem aqui, faça isso"

   ÍNDICE:
     1. EFEITO DE ONDA NOS CLIQUES
     2. PALAVRA "FELIZES" (muda de cor ao clicar)
     3. CARROSSEL DA GALERIA (andando sozinho, sem fim)
     4. FOTO AMPLIADA
     5. AVALIAÇÕES (troca automática com contador)

   O que você pode mudar com segurança:
     - fotosVisiveis ........ quantas fotos aparecem no carrossel (seção 3)
     - passosPorSegundo ..... velocidade do carrossel (seção 3)
     - O tempo das avaliações NÃO fica aqui: fica no CSS (--tempo-avaliacao)
   ===================================================================== */


/* =====================================================================
   1. EFEITO DE ONDA NOS CLIQUES
   Quando a pessoa clica num botão, num ícone de contato ou no mapa,
   nasce uma "onda" de luz no ponto exato do clique.
   ===================================================================== */

// Lista dos elementos que ganham o efeito (são classes do CSS)
var elementosComOnda = ".botao, .rede-link, .mapa";

// Cria a onda dentro de um elemento, na posição x, y da tela
function criarOnda(elemento, x, y) {
  var caixa = elemento.getBoundingClientRect(); // posição e tamanho do elemento
  var tamanho = Math.max(caixa.width, caixa.height) * 2.2;

  var onda = document.createElement("span");
  onda.className = "onda";
  onda.style.width = tamanho + "px";
  onda.style.height = tamanho + "px";
  // posiciona o centro da onda onde a pessoa clicou
  onda.style.left = (x - caixa.left - tamanho / 2) + "px";
  onda.style.top = (y - caixa.top - tamanho / 2) + "px";

  elemento.appendChild(onda);

  // quando a animação terminar, apaga a onda
  onda.addEventListener("animationend", function () {
    onda.remove();
  });
}

// Quando alguém encosta (mouse ou dedo) em qualquer lugar da página...
document.addEventListener("pointerdown", function (evento) {
  var elemento = evento.target.closest(elementosComOnda);
  if (elemento) {
    criarOnda(elemento, evento.clientX, evento.clientY);
  }
});

// Quando o clique vem do teclado (Enter), a onda nasce no meio do elemento
document.addEventListener("click", function (evento) {
  if (evento.detail !== 0) {
    return; // foi clique de mouse ou dedo, já tratado acima
  }
  var elemento = evento.target.closest(elementosComOnda);
  if (elemento) {
    var caixa = elemento.getBoundingClientRect();
    criarOnda(elemento, caixa.left + caixa.width / 2, caixa.top + caixa.height / 2);
  }
});


/* =====================================================================
   2. PALAVRA "FELIZES"
   Só estética: ao clicar, a palavra troca de cor. Clicando de novo,
   ela volta ao laranja. (A cor nova é definida no CSS, em
   .palavra-felizes.cor-alternativa)
   ===================================================================== */
var palavraFelizes = document.getElementById("palavra-felizes");

palavraFelizes.addEventListener("click", function () {
  // "toggle" liga a classe se ela não existe e desliga se ela já existe
  var ficouAlternativa = palavraFelizes.classList.toggle("cor-alternativa");

  if (ficouAlternativa) {
    palavraFelizes.setAttribute("aria-pressed", "true");
  } else {
    palavraFelizes.setAttribute("aria-pressed", "false");
  }
});


/* =====================================================================
   3. CARROSSEL DA GALERIA
   O carrossel anda sozinho, devagar e sem parar. Quando a pessoa
   encosta (mouse ou dedo), ele desacelera até parar, e volta a andar
   alguns instantes depois que ela solta.

   COMO FUNCIONA O "SEM FIM":
   Colocamos CÓPIAS das fotos nas duas pontas:
      [cópias das últimas] [fotos de verdade] [cópias das primeiras]
   Quando o carrossel chega numa ponta, "pulamos" para o mesmo lugar
   no meio. Como as fotos são iguais, ninguém percebe o pulo.
   ===================================================================== */

// ----- Elementos do HTML -----
var carrossel = document.getElementById("carrossel");
var botaoAnterior = document.getElementById("botao-anterior");
var botaoProximo = document.getElementById("botao-proximo");

// ----- Configurações (pode mudar) -----
var fotosVisiveis = 4;        // quantas fotos aparecem ao mesmo tempo
var passosPorSegundo = 0.27;  // velocidade: 0.27 = uma foto a cada ~4 segundos
                              // (aumente para ir mais rápido, diminua para mais devagar)

// ----- As fotos de verdade (as que estão no HTML) -----
var fotosOriginais = carrossel.querySelectorAll(".foto-item");
var totalFotos = fotosOriginais.length;

// Anota o número de cada foto (0, 1, 2...). As cópias herdam esse número,
// assim sabemos qual foto abrir quando clicam numa cópia.
for (var i = 0; i < totalFotos; i++) {
  fotosOriginais[i].setAttribute("data-indice", i);
}

// Faz uma cópia de uma foto para colocar nas pontas
function criarCopia(foto) {
  var copia = foto.cloneNode(true);
  copia.setAttribute("aria-hidden", "true"); // leitores de tela ignoram a cópia
  copia.tabIndex = -1;                       // a tecla Tab pula a cópia
  return copia;
}

// Cópias das ÚLTIMAS fotos vão para o COMEÇO
for (var i = totalFotos - fotosVisiveis; i < totalFotos; i++) {
  carrossel.insertBefore(criarCopia(fotosOriginais[i]), fotosOriginais[0]);
}

// Cópias das PRIMEIRAS fotos vão para o FIM
for (var i = 0; i < fotosVisiveis; i++) {
  carrossel.appendChild(criarCopia(fotosOriginais[i]));
}

// Agora a lista tem tudo: cópias + originais + cópias
var todasAsFotos = carrossel.querySelectorAll(".foto-item");

// ----- Variáveis que guardam o estado do movimento -----
var posicaoExata = 0;          // posição do carrossel (com casas decimais)
var velocidadeAtual = 0;       // velocidade neste instante (pixels por segundo)
var mouseEmCima = false;       // o mouse está sobre o carrossel?
var dedoNaTela = false;        // o dedo está tocando o carrossel?
var pausarAte = 0;             // só volta a andar depois deste horário
var ultimoMovimentoManual = 0; // horário em que a pessoa mexeu por conta própria
var animacaoDaSeta = null;     // guarda os dados quando alguém clica numa seta
var tempoAnterior = performance.now();

// Pessoas que desligaram as animações no aparelho não veem o carrossel andar sozinho
var reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Largura de UM "passo" = largura de uma foto + o espaço entre as fotos
function larguraDoPasso() {
  return todasAsFotos[1].offsetLeft - todasAsFotos[0].offsetLeft;
}

// Coloca o carrossel na posição inicial (primeira foto de verdade)
function irParaOInicio() {
  carrossel.scrollLeft = fotosVisiveis * larguraDoPasso();
  posicaoExata = carrossel.scrollLeft;
}

irParaOInicio();
window.addEventListener("load", irParaOInicio);   // de novo, quando as imagens terminarem de carregar
window.addEventListener("resize", irParaOInicio); // e quando a tela mudar de tamanho

// Segura o movimento automático por 1,5 segundo (usado depois de alguma interação)
function pausarPorUmMomento() {
  pausarAte = performance.now() + 1500;
}

// ----- Setas do carrossel -----
// direcao: -1 = voltar uma foto, 1 = avançar uma foto
function moverCarrossel(direcao) {
  animacaoDaSeta = {
    de: posicaoExata,
    para: posicaoExata + direcao * larguraDoPasso(),
    inicio: performance.now(),
    duracao: reduzirMovimento ? 1 : 650 // em milissegundos
  };
  pausarPorUmMomento();
}

botaoAnterior.addEventListener("click", function () {
  moverCarrossel(-1);
});

botaoProximo.addEventListener("click", function () {
  moverCarrossel(1);
});

// ----- Quando parar o movimento automático -----
// Mouse em cima: para (e volta quando o mouse sai)
carrossel.addEventListener("pointerenter", function (evento) {
  if (evento.pointerType === "mouse") {
    mouseEmCima = true;
  }
});

carrossel.addEventListener("pointerleave", function (evento) {
  if (evento.pointerType === "mouse") {
    mouseEmCima = false;
    pausarPorUmMomento();
  }
});

// Dedo na tela: para. Dedo saiu: espera um momento e volta.
carrossel.addEventListener("touchstart", function () {
  dedoNaTela = true;
}, { passive: true });

carrossel.addEventListener("touchend", function () {
  dedoNaTela = false;
  pausarPorUmMomento();
}, { passive: true });

carrossel.addEventListener("touchcancel", function () {
  dedoNaTela = false;
  pausarPorUmMomento();
}, { passive: true });

// ----- O "motor" do carrossel -----
// Esta função roda sozinha a cada quadro da tela (cerca de 60 vezes por segundo)
function animarCarrossel(agora) {
  requestAnimationFrame(animarCarrossel); // pede para rodar de novo no próximo quadro

  // Quantos segundos passaram desde o quadro anterior
  var segundos = (agora - tempoAnterior) / 1000;
  if (segundos > 0.05) {
    segundos = 0.05; // evita um "pulo" quando a pessoa volta de outra aba
  }
  tempoAnterior = agora;

  var passo = larguraDoPasso();
  var posicaoReal = carrossel.scrollLeft;

  if (animacaoDaSeta) {
    // ----- A) Alguém clicou numa seta: desliza uma foto, começando e terminando devagar -----
    var progresso = (agora - animacaoDaSeta.inicio) / animacaoDaSeta.duracao; // 0 a 1
    if (progresso > 1) {
      progresso = 1;
    }

    var suavizado;
    if (progresso < 0.5) {
      suavizado = 4 * progresso * progresso * progresso;
    } else {
      suavizado = 1 - Math.pow(2 - 2 * progresso, 3) / 2;
    }

    posicaoExata = animacaoDaSeta.de + (animacaoDaSeta.para - animacaoDaSeta.de) * suavizado;
    carrossel.scrollLeft = posicaoExata;

    if (progresso >= 1) {
      animacaoDaSeta = null; // terminou
    }

  } else {
    // ----- B) Movimento automático -----

    // Se a posição real é diferente da nossa, a pessoa mexeu (dedo ou trackpad).
    // Então aceitamos a posição dela e esperamos um pouco antes de voltar a andar.
    if (Math.abs(posicaoReal - posicaoExata) > 1.5) {
      posicaoExata = posicaoReal;
      ultimoMovimentoManual = agora;
      pausarAte = agora + 1500;
    }

    // Decide se deve parar agora
    var deveParar = mouseEmCima || dedoNaTela || agora < pausarAte ||
                    reduzirMovimento || document.hidden || fotoAmpliadaEstaAberta();

    // Velocidade que queremos atingir (0 = parado)
    var velocidadeDesejada = 0;
    if (!deveParar) {
      velocidadeDesejada = passosPorSegundo * passo;
    }

    // Em vez de parar/arrancar de uma vez, a velocidade muda aos poucos (efeito suave)
    var rapidezDaMudanca = 1.6; // arrancando
    if (deveParar) {
      rapidezDaMudanca = 6;     // freando
    }
    var fator = segundos * rapidezDaMudanca;
    if (fator > 1) {
      fator = 1;
    }
    velocidadeAtual = velocidadeAtual + (velocidadeDesejada - velocidadeAtual) * fator;

    if (dedoNaTela) {
      velocidadeAtual = 0;
    }

    // Anda um pouquinho
    if (velocidadeAtual > 0.5) {
      posicaoExata = posicaoExata + velocidadeAtual * segundos;
      carrossel.scrollLeft = posicaoExata;
    }
  }

  // ----- C) Volta para o meio quando chega nas pontas (efeito "sem fim") -----
  var podeReposicionar = !dedoNaTela &&
                         (animacaoDaSeta || velocidadeAtual > 0.5 || agora - ultimoMovimentoManual > 200);

  if (podeReposicionar) {
    var larguraDoConjunto = totalFotos * passo;     // largura de todas as fotos de verdade
    var fimDasOriginais = (fotosVisiveis + totalFotos) * passo;
    var inicioDasOriginais = fotosVisiveis * passo;

    if (posicaoExata >= fimDasOriginais) {
      // chegou nas cópias do fim: volta uma volta inteira para trás
      posicaoExata = posicaoExata - larguraDoConjunto;
      carrossel.scrollLeft = posicaoExata;
      if (animacaoDaSeta) {
        animacaoDaSeta.de = animacaoDaSeta.de - larguraDoConjunto;
        animacaoDaSeta.para = animacaoDaSeta.para - larguraDoConjunto;
      }
    } else if (posicaoExata < inicioDasOriginais - 2) {
      // chegou nas cópias do começo: avança uma volta inteira
      posicaoExata = posicaoExata + larguraDoConjunto;
      carrossel.scrollLeft = posicaoExata;
      if (animacaoDaSeta) {
        animacaoDaSeta.de = animacaoDaSeta.de + larguraDoConjunto;
        animacaoDaSeta.para = animacaoDaSeta.para + larguraDoConjunto;
      }
    }
  }
}

// Liga o motor
requestAnimationFrame(animarCarrossel);


/* =====================================================================
   4. FOTO AMPLIADA
   Ao clicar numa foto da galeria, abre uma janela grande com a foto,
   o título e a descrição. Dá para trocar de foto sem fechar:
     - pelas setas da janela
     - arrastando o dedo para o lado (celular)
     - pelas setas ← → do teclado (computador)
   Para fechar: botão X, tecla Esc, ou clicar fora da foto.
   Os textos vêm do HTML (data-titulo e data-descricao de cada foto).
   ===================================================================== */

// ----- Elementos do HTML -----
var janelaAmpliada = document.getElementById("ampliada");
var figuraAmpliada = document.getElementById("ampliada-figura");
var imagemAmpliada = document.getElementById("ampliada-imagem");
var tituloAmpliada = document.getElementById("ampliada-titulo");
var descricaoAmpliada = document.getElementById("ampliada-descricao");
var botaoFechar = document.getElementById("ampliada-fechar");
var botaoFotoAnterior = document.getElementById("ampliada-anterior");
var botaoFotoProxima = document.getElementById("ampliada-proximo");

// ----- Variáveis -----
var fotoAtual = 0;            // número da foto que está aberta (0 = primeira)
var elementoQueAbriu = null;  // guarda o botão clicado, para devolver o foco ao fechar
var inicioDoToqueX = null;    // onde o dedo encostou (para detectar o arrastar)

// Diz se a janela está aberta
function fotoAmpliadaEstaAberta() {
  return janelaAmpliada.classList.contains("aberta");
}

// Coloca a imagem, o título e a descrição da foto número "indice" na janela
function preencherFotoAmpliada(indice) {
  var foto = fotosOriginais[indice];
  imagemAmpliada.src = foto.querySelector("img").src;
  imagemAmpliada.alt = foto.getAttribute("data-titulo");
  tituloAmpliada.textContent = foto.getAttribute("data-titulo");
  descricaoAmpliada.textContent = foto.getAttribute("data-descricao");
}

function abrirFotoAmpliada(indice) {
  elementoQueAbriu = document.activeElement;
  fotoAtual = indice;
  preencherFotoAmpliada(indice);
  janelaAmpliada.classList.add("aberta");
  document.body.style.overflow = "hidden"; // trava a rolagem da página de trás
  botaoFechar.focus();
}

function fecharFotoAmpliada() {
  janelaAmpliada.classList.remove("aberta");
  document.body.style.overflow = "";
  pausarPorUmMomento();

  // Se a foto que a pessoa estava vendo não está visível no carrossel,
  // leva o carrossel até ela.
  var passo = larguraDoPasso();
  var posicaoNaLista = Math.round(carrossel.scrollLeft / passo);
  var primeiraVisivel = posicaoNaLista - fotosVisiveis;
  while (primeiraVisivel < 0) {
    primeiraVisivel = primeiraVisivel + totalFotos;
  }
  while (primeiraVisivel >= totalFotos) {
    primeiraVisivel = primeiraVisivel - totalFotos;
  }
  var distancia = fotoAtual - primeiraVisivel;
  while (distancia < 0) {
    distancia = distancia + totalFotos;
  }
  if (distancia > fotosVisiveis - 1) {
    carrossel.scrollLeft = (fotosVisiveis + fotoAtual) * passo;
  }

  if (elementoQueAbriu) {
    elementoQueAbriu.focus({ preventScroll: true });
  }
}

// Troca para outra foto sem fechar a janela. direcao: -1 = anterior, 1 = próxima
function trocarFotoAmpliada(direcao) {
  var novaFoto = fotoAtual + direcao;
  if (novaFoto < 0) {
    novaFoto = totalFotos - 1; // depois da primeira volta para a última
  }
  if (novaFoto >= totalFotos) {
    novaFoto = 0;              // depois da última volta para a primeira
  }
  fotoAtual = novaFoto;

  // a foto some rapidinho, troca o conteúdo e aparece de novo
  figuraAmpliada.style.opacity = 0;
  setTimeout(function () {
    preencherFotoAmpliada(fotoAtual);
    figuraAmpliada.style.opacity = 1;
  }, 150);
}

// ----- Clicar nas fotos do carrossel (inclusive nas cópias) -----
// Esta função existe para cada foto "lembrar" o número dela
function ligarCliqueDaFoto(foto) {
  foto.addEventListener("click", function () {
    var numero = Number(foto.getAttribute("data-indice"));
    abrirFotoAmpliada(numero);
  });
}

for (var i = 0; i < todasAsFotos.length; i++) {
  ligarCliqueDaFoto(todasAsFotos[i]);
}

// ----- Botões da janela -----
botaoFotoAnterior.addEventListener("click", function () {
  trocarFotoAmpliada(-1);
});

botaoFotoProxima.addEventListener("click", function () {
  trocarFotoAmpliada(1);
});

botaoFechar.addEventListener("click", fecharFotoAmpliada);

// Clicar no fundo escuro (fora da foto) também fecha
janelaAmpliada.addEventListener("click", function (evento) {
  if (evento.target === janelaAmpliada) {
    fecharFotoAmpliada();
  }
});

// ----- Teclado -----
document.addEventListener("keydown", function (evento) {
  if (!fotoAmpliadaEstaAberta()) {
    return; // com a janela fechada, as teclas não fazem nada aqui
  }
  if (evento.key === "Escape") {
    fecharFotoAmpliada();
  } else if (evento.key === "ArrowLeft") {
    trocarFotoAmpliada(-1);
  } else if (evento.key === "ArrowRight") {
    trocarFotoAmpliada(1);
  }
});

// ----- Arrastar o dedo para o lado (celular) -----
figuraAmpliada.addEventListener("touchstart", function (evento) {
  inicioDoToqueX = evento.touches[0].clientX;
}, { passive: true });

figuraAmpliada.addEventListener("touchend", function (evento) {
  if (inicioDoToqueX === null) {
    return;
  }
  var fimDoToqueX = evento.changedTouches[0].clientX;
  var diferenca = fimDoToqueX - inicioDoToqueX;
  inicioDoToqueX = null;

  // só conta como "arrastar" se o dedo andou mais de 40 pixels
  if (diferenca < -40) {
    trocarFotoAmpliada(1);   // arrastou para a esquerda: próxima foto
  } else if (diferenca > 40) {
    trocarFotoAmpliada(-1);  // arrastou para a direita: foto anterior
  }
});


/* =====================================================================
   5. AVALIAÇÕES
   Mostra uma avaliação por vez. O anel laranja em volta do perfil ativo
   é um contador (o tempo é definido no CSS, em --tempo-avaliacao).
   Quando o contador termina, passa para o próximo perfil.
   Clicar em um perfil mostra a avaliação dele e reinicia o contador.
   ===================================================================== */

// ----- Elementos do HTML -----
var secaoAvaliacoes = document.getElementById("avaliacoes");
var listaDeAvaliacoes = secaoAvaliacoes.querySelectorAll(".avaliacao"); // as mensagens
var listaDePerfis = secaoAvaliacoes.querySelectorAll(".perfil");        // os botões redondos
var caixaDaAvaliacao = secaoAvaliacoes.querySelector(".avaliacao-caixa");

// Mostra a avaliação número "numero" (0 = primeira, 1 = segunda, 2 = terceira)
// Se "reiniciar" for true, o contador do perfil volta ao começo.
function mostrarAvaliacao(numero, reiniciar) {

  // Mensagens: só a escolhida fica com a classe "ativa"
  for (var i = 0; i < listaDeAvaliacoes.length; i++) {
    if (i === numero) {
      listaDeAvaliacoes[i].classList.add("ativa");
      listaDeAvaliacoes[i].setAttribute("aria-hidden", "false");
    } else {
      listaDeAvaliacoes[i].classList.remove("ativa");
      listaDeAvaliacoes[i].setAttribute("aria-hidden", "true");
    }
  }

  // Perfis: só o escolhido fica com a classe "ativo"
  for (var j = 0; j < listaDePerfis.length; j++) {
    var perfil = listaDePerfis[j];

    if (j === numero) {
      if (reiniciar) {
        // Truque para reiniciar a animação do contador: tira a classe,
        // força o navegador a "perceber" a mudança, e coloca de volta.
        perfil.classList.remove("ativo");
        void perfil.offsetWidth;
      }
      perfil.classList.add("ativo");
      perfil.setAttribute("aria-pressed", "true");
    } else {
      perfil.classList.remove("ativo");
      perfil.setAttribute("aria-pressed", "false");
    }
  }

  // Avisa o CSS qual perfil está ativo (a setinha da caixa vai até ele)
  caixaDaAvaliacao.style.setProperty("--posicao-perfil", numero);
}

// Liga os eventos de UM perfil. Esta função existe para cada perfil
// "lembrar" o número dele.
function ligarPerfil(perfil, numero) {

  // Clicou no perfil: mostra a avaliação dele e reinicia o contador
  perfil.addEventListener("click", function () {
    mostrarAvaliacao(numero, true);
  });

  // O contador terminou: passa para o próximo perfil
  var contador = perfil.querySelector(".anel-contador");
  contador.addEventListener("animationend", function () {
    if (perfil.classList.contains("ativo")) {
      var proximo = numero + 1;
      if (proximo >= listaDePerfis.length) {
        proximo = 0; // depois do último, volta para o primeiro
      }
      mostrarAvaliacao(proximo, false);
    }
  });
}

for (var k = 0; k < listaDePerfis.length; k++) {
  ligarPerfil(listaDePerfis[k], k);
}

// O contador só começa a andar quando a seção aparece na tela.
// O "observador" avisa quando a seção entra ou sai da tela, e nós
// ligamos/desligamos a classe "visivel" (que o CSS usa).
if ("IntersectionObserver" in window) {
  var observador = new IntersectionObserver(function (entradas) {
    if (entradas[0].isIntersecting) {
      secaoAvaliacoes.classList.add("visivel");
    } else {
      secaoAvaliacoes.classList.remove("visivel");
    }
  }, { threshold: 0.4 }); // considera "visível" quando 40% da seção está na tela

  observador.observe(secaoAvaliacoes);
} else {
  // Navegador muito antigo: deixa o contador sempre rodando
  secaoAvaliacoes.classList.add("visivel");
}
