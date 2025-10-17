/**
 * Esse é um projeto de quebra-cabeça 3D em realidade aumentada
 * utilizando A-Frame e Three.js
 * O objetivo é criar um quebra-cabeça interativo onde
 * o usuário pode montar as peças em um ambiente de RA
 * as peças são geradas com lados que se encaixam
 * e o usuário pode selecionar e mover as peças para montar o quebra-cabeça
 * o projeto inclui:
 * - Geração de peças com lados que se encaixam
 * - Embaralhamento das peças
 * - Renderização das peças na cena
 * - Interação do usuário para selecionar e mover peças
 * - Validação do encaixe das peças
 * - Feedback visual para erros de encaixe
 * - Indicação de conclusão do quebra-cabeça
 *
 * Alguns termos utilizados para documentar:
 * - Peça: cada parte individual do quebra-cabeça
 * - Lado: cada uma das quatro bordas de uma peça
 * - Encaixe: a ação de colocar uma peça na posição correta
 * - Esqueleto(skeleton): guia visual para posicionamento das peças
 * - Lixeira: área onde peças podem ser descartadas
 *
 * Conceitos complexos usados:
 * - Geometria 3D com THREE.ExtrudeGeometry, geração das peças com lados personalizados
 * - Interação com A-Frame, manipulação de eventos de mouse e clique
 * - Geração de esqueleto (skeleton) para posicionamento das peças
 * - Validação de encaixe das peças com base nos lados
 * - Raycasting para detecção de interseções
 */

/* ========== INFOS ========== */

/**
 * Com intuito de ajudar na leitura do codigo estou utilizando JSDoc
 * abaixo estou criando alguns tipos que vou utilizar durante a documentação
 */

/**
 * @typedef {0 | 1 | 2} SideType
 * Formato de lado da peça do quebra-cabeça:
 * - 0 = reto
 * - 1 = para dentro (reentrante)
 * - 2 = para fora (saliente)
 */

/**
 * @typedef {Object} SideShapes
 * @property {SideType} top - Formato do lado superior
 * @property {SideType} right - Formato do lado direito
 * @property {SideType} bottom - Formato do lado inferior
 * @property {SideType} left - Formato do lado esquerdo
 */

/**
 * @typedef {Object} Position3D
 * @property {number} x - Posição no eixo X
 * @property {number} y - Posição no eixo Y
 * @property {number} z - Posição no eixo Z
 */

/**
 * @typedef {Object} PuzzlePieceBase
 * @property {string} id - Identificador único da peça
 * @property {SideShapes} sides - Formatos dos lados da peça
 */

/**
 * @typedef {PuzzlePieceBase & { position: Position3D, name: string }} PuzzlePiece
 * Extensão de PuzzlePieceBase que inclui a posição 3D da peça
 */

/* ========== CLASSES ========== */
/**
 * Classe para controle da linha de seleção
 * @class Line
 * @property {boolean} active - Indica se a linha está ativa
 * @property {HTMLElement} element - Elemento HTML da linha
 * @property {string|null} initalElementName - Nome do elemento inicial selecionado
 * @property {HTMLElement|null} selectedElement - Elemento HTML atualmente selecionado
 * @method setStart(position, name, element) - Define o ponto inicial da linha
 * @method setEnd(position) - Define o ponto final da linha
 * @method reset() - Reseta a linha para o estado inicial
 */
/**
 * Classe para controle da linha de seleção
 * @class Line
 * @property {boolean} active - Indica se a linha está ativa
 * @property {HTMLElement} element - Elemento HTML da linha
 * @property {string|null} initalElementName - Nome do elemento inicial selecionado
 * @property {HTMLElement|null} selectedElement - Elemento HTML atualmente selecionado
 * @method setStart(position) - Define o ponto inicial da linha
 * @method setEnd(position) - Define o ponto final da linha
 * @method reset() - Reseta a linha para o estado inicial
 */
class Line {
  constructor() {
    this.active = false;
    this.element = document.querySelector("#line");
    this.initalElementName = null;
    this.selectedElement = null;
  }

  setStart(position, name, element) {
    this.element.setAttribute("line", { start: position });
    this.initalElementName = name;
    this.active = true;
    this.selectedElement = element;
  }

  setEnd(position) {
    this.element.setAttribute("line", { end: position });
    this.active = true;
  }

  reset() {
    this.element.setAttribute("line", { start: "0 0 0", end: "0 0 0" });
    this.active = false;
    this.initalElementName = null;
    this.selectedElement = null;
  }
}

/* ========== CONSTANTES GLOBAIS ========== */
const lineSelection = new Line();
const cursor = document.querySelector("#cursor");
const pieceSize = 1;
const pieceDepth = 1;
const puzzleSize = 4;
const zOffset = -6;
const heightInitGlobal = 1;
const widthInitGlobal = -1.5;

/* ========== INICIALIZAÇÃO ========== */
/**
 * Array que armazena as peças com id e forma
 * @type {Array<PuzzlePieceBase>}
 */
const pieces = generatePieces();

/**
 * Array que armazena as peças com id, forma, posição e nome
 * @type {Array<{PuzzlePiece}>}
 */
const piecesForRender = definePiecePositions();

/**
 * Array que armazena as peças que já foram posicionados pelo usuário
 * @type {Array<PuzzlePieceBase>}
 */
const piecesUserMounted = new Array(puzzleSize * puzzleSize).fill(null);

mountPuzzleSkeleton();
renderPieces();
/* ========== AREA DE TESTES (executar funções no inicio para testar o codigo) ========== */

/* === EM DESENVOLVIMENTO === */

/* === FUNCOES DE INICIAIS (metodos que devem ser chamados na inicialização) === */

/** Gera as peças do quebra-cabeça com lados que se encaixam
 * essa função cria as peças do quebra-cabeça e define os lados
 * de cada peça para que elas possam se encaixar corretamente
 * @returns {Array} - Array de peças com lados definidos
 */
function generatePieces() {
  let count = 0;

  const pieces = [];

  for (let row = 0; row < puzzleSize; row++) {
    for (let col = 0; col < puzzleSize; col++) {
      count++;

      const topSide = row === puzzleSize - 1 ? 0 : randomSideShape();
      const rightSide = col === puzzleSize - 1 ? 0 : randomSideShape();
      // o calculo dentro dos arrays "[]" serve para pegar o lado oposto da peça vizinha
      // precisa de tudo isso pois calcula a posição corrita no array
      const bottomSide =
        row === 0
          ? 0
          : pieces[(row - 1) * puzzleSize + col].sides.top === 1
          ? 2
          : 1;
      const leftSide =
        col === 0
          ? 0
          : pieces[row * puzzleSize + (col - 1)].sides.right === 1
          ? 2
          : 1;

      const piece = {
        id: crypto.randomUUID(),
        sides: {
          top: topSide,
          right: rightSide,
          bottom: bottomSide,
          left: leftSide,
        },
      };

      pieces.push(piece);
    }
  }

  return pieces;
}

/**
 * Embaralha as peças e define suas posições iniciais adicionando o nome
 */
function definePiecePositions() {
  const heightInit = heightInitGlobal;
  const widthInit = widthInitGlobal;
  const gap = pieceSize;
  const shuffledPieces = embaralharArray(pieces);
  const piecesForRender = [];

  for (let row = 0; row < puzzleSize; row++) {
    for (let col = 0; col < puzzleSize; col++) {
      const index = row * puzzleSize + col;
      const position = {
        x: widthInit + col * gap,
        y: heightInit + row * 1.5 * gap,
        z: zOffset,
      };

      if (col === 0) {
        position.x = widthInit - 1.5 + col * gap;
      }

      if (col === 1) {
        position.x = widthInit + 5 + col * gap;
      }

      if (col === 2) {
        position.x = widthInit - 5 + col * gap;
      }

      if (col === 3) {
        position.x = widthInit + 1.5 + col * gap;
      }

      piecesForRender.push({
        ...shuffledPieces[index],
        name: `piece-${index + 1}`,
        position,
      });
    }
  }

  return piecesForRender;
}

/**
 * Renderiza as peças do quebra-cabeça na cena
 * embaralhadas e com nome na cena
 */
function renderPieces() {
  piecesForRender.forEach((piece, index) => {
    mountPuzzlePiece(`piece-${index + 1}`, piece.sides, piece.position);
  });
}

/** Monta o esqueleto do quebra-cabeça na cena
 * Esse metodo vai ser utilizado para criar o guia visual
 * ele chama o metodo de criação passando os parametros de nome e posição
 */
function mountPuzzleSkeleton() {
  const heightInit = heightInitGlobal;
  const widthInit = widthInitGlobal;
  const gap = pieceSize;
  const finalHeight = heightInit + puzzleSize * gap;

  let count = 0;

  for (let row = 0; row < puzzleSize; row++) {
    for (let col = 0; col < puzzleSize; col++) {
      count++;
      const position = {
        x: widthInit + col * gap,
        y: heightInit + row * gap,
        z: zOffset,
      };
      skeletonSphere(`skeleton-${count}`, position);
    }
  }

  mountTrashBox(finalHeight);

  for (let col = 0; col < puzzleSize - 1; col++) {
    count++;
    const position = {
      x: widthInit + col * (gap + 0.5),
      y: finalHeight + 0.5,
      z: zOffset,
    };
    skeletonSphere(`trash-${count}`, position);
  }
}

/* === FUNCOES DE CRIACAO (criação de componentes a partir de parametros) === */
/**
 * Monta uma esfera do esqueleto na cena
 * Esqueleto serve como guia para o posicionamento das peças
 * ele vai ser o ponto central de cada peça e vai definir a posição
 * correta de cada uma
 * @param {string} name - Nome da esfera
 * @param {object} position - Posição inicial da esfera
 */
function skeletonSphere(name, position = { x: 1, y: 1, z: -3 }) {
  const sceneEl = document.querySelector("a-scene");
  const puzzleGroup = document.createElement("a-sphere");
  puzzleGroup.setAttribute("id", name);
  puzzleGroup.setAttribute("puzzle-skeleton", "");
  puzzleGroup.setAttribute("puzzle-component", name);
  puzzleGroup.setAttribute("radius", "0.1");
  puzzleGroup.setAttribute("color", "#EF2D5E");
  puzzleGroup.setAttribute("class", "clickable");

  if (name.startsWith("trash")) {
    puzzleGroup.setAttribute("color", "#c7c7c7");
  }

  puzzleGroup.setAttribute(
    "position",
    `${position.x} ${position.y} ${position.z}`
  );
  sceneEl.appendChild(puzzleGroup);
}

/**
 * Monta uma peça do quebra-cabeça na cena
 * essa função cria um entity do A-Frame e adiciona os componentes
 * necessários para a peça funcionar
 * @param {string} name - Nome da peça
 * @param {SideShapes} sideShapes - Formatos dos lados da peça
 * @param {Position3D} position - Posição inicial da peça
 */
function mountPuzzlePiece(
  name,
  sideShapes,
  position = { x: 0, y: 0, z: zOffset }
) {
  const sideShapesFormatted = `top:${sideShapes.top};left:${sideShapes.left};bottom:${sideShapes.bottom};right:${sideShapes.right}`;

  const sceneEl = document.querySelector("a-scene");
  const puzzleGroup = document.createElement("a-entity");
  puzzleGroup.setAttribute("id", name);
  puzzleGroup.setAttribute("puzzle-component", name);
  puzzleGroup.setAttribute("puzzle-piece", sideShapesFormatted);
  puzzleGroup.setAttribute("position", position);
  puzzleGroup.setAttribute("shadow", "cast:true;receive:true");
  puzzleGroup.setAttribute("class", "clickable");
  sceneEl.appendChild(puzzleGroup);
}

/**
 * Monta um background para os skeletons que serve como lixeira
 * @param {number} finalHeight - Altura final
 */
function mountTrashBox(finalHeight) {
  const ascene = document.querySelector("a-scene");
  const trashContainer = document.createElement("a-box");
  trashContainer.setAttribute("id", "trash-container");
  trashContainer.setAttribute("position", {
    x: 0,
    y: finalHeight + pieceSize / 2,
    z: zOffset - pieceDepth / 2,
  });
  trashContainer.setAttribute("width", pieceSize * puzzleSize + 0.5);
  trashContainer.setAttribute("height", pieceSize + 0.5);
  trashContainer.setAttribute("color", "red");
  trashContainer.setAttribute("opacity", "0.5");
  trashContainer.setAttribute("depth", "0.5");
  ascene.appendChild(trashContainer);
}

/**
 * Cria a forma da peça do quebra-cabeça com base nos formatos dos lados
 * @param {SideShapes} borderShapes - Formatos dos lados da peça
 * @returns {THREE.Mesh} - Mesh 3D da peça do quebra-cabeça
 */
function createShape(borderShapes) {
  const pieceShape = new THREE.Shape();

  // face de baixo
  if (borderShapes.bottom === 1 || borderShapes.bottom === 2) {
    const bottomCurve = borderShapes.bottom;
    const yCurveCalc = pieceSize * 0.3;
    const ycurvepoints = bottomCurve === 1 ? yCurveCalc : -yCurveCalc;

    pieceShape.lineTo(pieceSize * 0.3, 0);
    pieceShape.bezierCurveTo(
      // ponto 1da
      pieceSize * 0.3,
      ycurvepoints,
      // ponto 2
      pieceSize * 0.7,
      ycurvepoints,
      // ponto 3d
      pieceSize * 0.7,
      0
    );
  }

  pieceShape.lineTo(pieceSize, 0);

  // face direita
  if (borderShapes.right === 1 || borderShapes.right === 2) {
    const rightCurve = borderShapes.right;
    const xcurvepoints = rightCurve === 1 ? pieceSize * 0.7 : pieceSize * 1.3;

    pieceShape.lineTo(pieceSize, pieceSize * 0.3);
    pieceShape.bezierCurveTo(
      // ponto 1
      xcurvepoints,
      pieceSize * 0.3,
      // ponto 2
      xcurvepoints,
      pieceSize * 0.7,
      // ponto 3d
      pieceSize,
      pieceSize * 0.7
    );
    pieceShape.lineTo(pieceSize, pieceSize);
  }

  pieceShape.lineTo(pieceSize, pieceSize);

  // face de cima
  if (borderShapes.top === 1 || borderShapes.top === 2) {
    const topCurve = borderShapes.top;
    const ycurvepoints = topCurve === 1 ? pieceSize * 0.7 : pieceSize * 1.3;

    pieceShape.lineTo(pieceSize * 0.7, pieceSize);
    pieceShape.bezierCurveTo(
      // ponto 1
      pieceSize * 0.7,
      ycurvepoints,
      // ponto 2
      pieceSize * 0.3,
      ycurvepoints,
      // ponto 3d
      pieceSize * 0.3,
      pieceSize
    );
  }

  pieceShape.lineTo(0, pieceSize);

  // face esquerda
  if (borderShapes.left === 1 || borderShapes.left === 2) {
    const leftCurve = borderShapes.left;
    const xCurveCalc = pieceSize * 0.3;
    const xcurvepoints = leftCurve === 1 ? xCurveCalc : -xCurveCalc;

    pieceShape.lineTo(0, pieceSize * 0.7);
    pieceShape.bezierCurveTo(
      // ponto 1
      xcurvepoints,
      pieceSize * 0.7,
      // ponto 2
      xcurvepoints,
      pieceSize * 0.3,
      // ponto 3d
      0,
      pieceSize * 0.3
    );
  }

  pieceShape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 1,
    depth: pieceDepth,
    bevelEnabled: false,
  };
  const geometry = new THREE.ExtrudeGeometry(pieceShape, extrudeSettings);

  // Material padrão
  const material = new THREE.MeshStandardMaterial({
    color: 0x156289,
    flatShading: true,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/* === FUNCOES UTILITÁRIAS (criadas para ajudar na criação de outros metodos e do funcionamento) === */
/**
 * Gera um formato de lado aleatório (1 ou 2)
 * essa função ta limitada a retornar 1 ou 2 pois vai ser
 * usada para gerar lados que precisam de encaixe
 * @returns {SideType} - Formato do lado (1 ou 2)
 */
function randomSideShape() {
  return Math.random() > 0.5 ? 1 : 2;
}

/**
 * Embaralha um array utilizando o algoritmo de Fisher-Yates
 * esse método cria uma cópia do array original para manter
 * o array original intacto
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} - Novo array embaralhado
 */
function embaralharArray(array) {
  const copia = [...array]; // cria uma cópia para manter o original intacto

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

/**
 * Mostra uma mensagem de erro na tela por 2 segundos
 */
function showErrorMessage() {
  const error = document.querySelector("#error");
  error.setAttribute("visible", "true");

  setTimeout(() => {
    error.setAttribute("visible", "false");
  }, 2000);
}

/**
 * Valida se duas peças de quebra-cabeça se encaixam
 * @param {SideType} sideA - Lado da peça A
 * @param {SideType} sideB - Lado da peça B
 * @returns {boolean} - Retorna verdadeiro se as peças se encaixam, falso caso contrário
 */
function validatePiecesFit(sideA, sideB) {
  return (
    (sideA === 1 && sideB === 2) ||
    (sideA === 2 && sideB === 1) ||
    (sideA === 0 && sideB === 0) ||
    (sideA === 1 && sideB === 1) ||
    (sideA === 0 && sideB === 1) ||
    (sideA === 1 && sideB === 0)
  );
}

/**
 * Move uma peça para uma posição específica no espaço 3D
 * @param {AFRAME.Element} pieceElement - O elemento A-Frame que representa a peça do quebra-cabeça.
 * @param {THREE.Vector3} skeletonPosition - A posição alvo no espaço 3D.
 * @param {string} skeletonName - O nome do esqueleto para o qual a peça está sendo movida.
 * @returns {void}
 */
function movePieceToPosition(pieceElement, skeletonPosition, skeletonName) {
  const skeleton = skeletonName.split("-");
  const skeletonType = skeleton[0];
  const mountedArrayIndex = skeleton[1] - 1;
  const pieceName = pieceElement.getAttribute("puzzle-component");
  const pieceSelectedId = piecesForRender.find((p) => p.name === pieceName).id;
  const piece = pieces.find((p) => p.id === pieceSelectedId);

  if (skeletonType === "skeleton") {
    const topPiece = piecesUserMounted[mountedArrayIndex + puzzleSize];
    const bottomPiece = piecesUserMounted[mountedArrayIndex - puzzleSize];
    const leftPiece = piecesUserMounted[mountedArrayIndex - 1];
    const rightPiece = piecesUserMounted[mountedArrayIndex + 1];

    if (
      (topPiece &&
        !validatePiecesFit(piece.sides.top, topPiece.sides.bottom)) ||
      (rightPiece &&
        !validatePiecesFit(piece.sides.right, rightPiece.sides.left)) ||
      (bottomPiece &&
        !validatePiecesFit(piece.sides.bottom, bottomPiece.sides.top)) ||
      (leftPiece && !validatePiecesFit(piece.sides.left, leftPiece.sides.right))
    ) {
      showErrorMessage();
      return;
    }

    piecesUserMounted[mountedArrayIndex] = piece;
  }

  pieceElement.setAttribute("position", {
    x: skeletonPosition.x - pieceSize / 2,
    y: skeletonPosition.y - pieceSize / 2,
    z: skeletonPosition.z - pieceDepth / 2,
  });

  const fill = piecesUserMounted.includes(null);

  if (!fill) {
    console.log("puzzle completo!");

    console.log("piecesUserMounted", piecesUserMounted);
    console.log("piecesForRender", pieces);

    const isValid = piecesUserMounted.every((p, index) => {
      return p.id === pieces[index].id;
    });

    if (isValid) {
      console.log("parabéns, você completou o quebra-cabeça!");
    } else {
      console.log("quebra-cabeça incorreto, tente novamente!");
    }
  }
}

/* ========== COMPONENTES A-FRAME ========== */

/**
 * Componente A-Frame para criar uma peça de quebra-cabeça com lados personalizados
 * esse componente utiliza o THREE.ExtrudeGeometry para criar a geometria 3D
 * baseado nos formatos dos lados fornecidos.
 * @component puzzle-piece
 * @property {SideType} top - Formato do lado superior
 * @property {SideType} left - Formato do lado esquerdo
 * @property {SideType} bottom - Formato do lado inferior
 * @property {SideType} right - Formato do lado direito
 */
AFRAME.registerComponent("puzzle-piece", {
  schema: {
    top: { type: "int", default: 0 },
    left: { type: "int", default: 0 },
    bottom: { type: "int", default: 0 },
    right: { type: "int", default: 0 },
  },

  init: function () {
    const size = pieceSize;
    const depth = pieceDepth;
    const pieceShape = createShape(this.data);
    const position = this.el.getAttribute("position");

    this.el.setObject3D("mesh", pieceShape);
    this.el.setAttribute("position", {
      x: position.x - size / 2,
      y: position.y - size / 2,
      z: position.z - depth / 2,
    });
  },
});

/**
 * Componente A-Frame para gerenciar a interação com peças do quebra-cabeça
 * e esferas do esqueleto. Permite selecionar e mover peças com base na lógica
 * de seleção de linha.
 * @component puzzle-component
 * @property {string} - Nome do componente, usado para identificar peças e esferas
 * @requires raycaster - Dependência para detecção de cliques
 */
AFRAME.registerComponent("puzzle-component", {
  dependencies: ["raycaster"],
  schema: { type: "string", default: "none" },

  init: function () {
    let clickTimeoutId = null;

    this.el.addEventListener("mouseenter", () => {
      this.handleMouseEnter(this.el, this.data);
    });

    this.el.addEventListener("mouseleave", () => {
      this.handleMouseLeave();
    });

    this.el.addEventListener("click", () => {
      this.handleMouseClick();
    });

    // this.el.addEventListener("click", () => {
    //   const prefixName = this.data.split("-")[0];

    //   if (
    //     lineSelection.active &&
    //     prefixName === "piece" &&
    //     lineSelection.initalElementName !== this.data
    //   ) {
    //     return;
    //   }

    //   if (
    //     lineSelection.active &&
    //     lineSelection.initalElementName === this.data
    //   ) {
    //     lineSelection.reset();
    //     return;
    //   }

    //   if (
    //     lineSelection.active &&
    //     lineSelection.initalElementName !== this.data
    //   ) {
    //     movePieceToPosition(
    //       lineSelection.selectedElement,
    //       currentPosition,
    //       this.data
    //     );
    //     lineSelection.reset();
    //     return;
    //   }

    //   if (!lineSelection.active && prefixName === "piece") {
    //     lineSelection.setStart(
    //       {
    //         x: currentPosition.x + pieceSize / 2,
    //         y: currentPosition.y + pieceSize / 2,
    //         z: currentPosition.z + pieceDepth / 2,
    //       },
    //       this.data,
    //       this.el
    //     );
    //   }
    // });
  },
  /**
   * Manipula o evento de mouseenter na peça, iniciando um timeout de clique
   * e atualizando a aparência do cursor.
   * @param {HTMLElement} element
   * @param {string} name
   */
  handleMouseEnter: function () {
    const timeoutDuration = piecesUserMounted.find(
      (piece) => piece?.name === this.data
    )
      ? 1000
      : 500;

    cursor.setAttribute("animation__fill", {
      property: "geometry.radiusInner",
      to: "0",
      dur: timeoutDuration,
      easing: "linear",
    });

    if (this.clickTimeoutId) {
      clearTimeout(this.clickTimeoutId);
    }

    this.clickTimeoutId = setTimeout(() => {
      this.el.emit("click");
      this.clickTimeoutId = null;
    }, timeoutDuration);
  },
  /**
   * Manipula o evento de mouseleave na peça, cancelando o timeout de clique
   * e resetando a aparência do cursor.
   */
  handleMouseLeave: function () {
    if (this.clickTimeoutId) {
      clearTimeout(this.clickTimeoutId);
      this.clickTimeoutId = null;
    }

    cursor.removeAttribute("animation__fill");
    cursor.setAttribute("geometry", {
      primitive: "ring",
      radiusInner: 0.015,
      radiusOuter: 0.02,
    });
  },
  /**
   * Lógica que ocorre quando a peça é clicada
   */
  handleMouseClick: function () {
    const currentPosition = this.el.getAttribute("position");
    const prefixName = this.data.split("-")[0];

    if (
      lineSelection.active &&
      prefixName === "piece" &&
      lineSelection.initalElementName !== this.data
    ) {
      return;
    }

    if (lineSelection.active && lineSelection.initalElementName === this.data) {
      lineSelection.reset();
      return;
    }

    if (lineSelection.active && lineSelection.initalElementName !== this.data) {
      movePieceToPosition(
        lineSelection.selectedElement,
        currentPosition,
        this.data
      );
      lineSelection.reset();
      return;
    }

    if (!lineSelection.active && prefixName === "piece") {
      lineSelection.setStart(
        {
          x: currentPosition.x + pieceSize / 2,
          y: currentPosition.y + pieceSize / 2,
          z: currentPosition.z + pieceDepth / 2,
        },
        this.data,
        this.el
      );
    }
  },
});

/**
 * Componente A-Frame para gerenciar a posição do cursor e atualizar a linha de seleção
 * conforme o cursor se move. Se uma linha de seleção estiver ativa, o ponto final
 * da linha será atualizado para a posição atual do cursor.
 * @component cursor-ring
 * @requires raycaster - Dependência para detecção de interseções
 */
AFRAME.registerComponent("cursor-ring", {
  init: function () {
    this.lastPosition = new THREE.Vector3();
    this.el.object3D.getWorldPosition(this.lastPosition);
  },
  tick: function () {
    const currentPosition = new THREE.Vector3();

    this.el.object3D.getWorldPosition(currentPosition);

    if (lineSelection.active) {
      lineSelection.setEnd(currentPosition);
    }
  },
});
