/* ========== INFOS ========== */

/**
 * Com intuito de ajudar na leitura do codigo estou utilizando JSDoc
 * abaixo estou criando alguns tipos que vou utilizar durante a documentação
 */

/**
 * @typedef {0 | 1 | 2} SideType
 * Formato de lado da peça do quebra-cabeça:
 * - 0 = reto
 * - 1 = para fora (saliente)
 * - 2 = para dentro (reentrante)
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
const zOffset = -4;
const pieces = [];

/* ========== INICIALIZAÇÃO ========== */
mountPuzzleSkeleton();

/* ========== AREA DE TESTES (executar funções no inicio para testar o codigo) ========== */

generatePieces();

pieces.forEach((piece) => {
  mountPuzzlePiece(piece.name, piece.sides, piece.position);
});

console.log("Peças geradas", pieces);

// mountPuzzlePiece(
//   "piece-2",
//   {
//     top: 2,
//     right: 0,
//     bottom: 0,
//     left: 1,
//   },
//   { x: 3, y: 3, z: zOffset }
// );

/* ========== FUNÇÕES DO SISTEMA ========== */

/* === EM DESENVOLVIMENTO === */

/** Gera as peças do quebra-cabeça com lados que se encaixam
 * essa função cria as peças do quebra-cabeça e define os lados
 * de cada peça para que elas possam se encaixar corretamente
 *
 * TO-DO: remover a posição daqui para que as peças sejam
 * geradas em posições aleatórias ao lado do esqueleto
 */
function generatePieces() {
  let count = 0;

  const heightInit = 0.5;
  const widthInit = -1.5;
  const gap = pieceSize;

  for (let row = 0; row < puzzleSize; row++) {
    for (let col = 0; col < puzzleSize; col++) {
      count++;

      const name = `piece-${count}`;
      const position = {
        x: widthInit + col * gap,
        y: heightInit + row * gap,
        z: zOffset,
      };

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
        name,
        position,
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
}

/* === FUNCOES DE INICIAIS (metodos que devem ser chamados na inicialização) === */

/** Monta o esqueleto do quebra-cabeça na cena
 * Esse metodo vai ser utilizado para criar o guia visual
 * ele chama o metodo de criação passando os parametros de nome e posição
 */
function mountPuzzleSkeleton() {
  const heightInit = 0.5;
  const widthInit = -1.5;
  const gap = pieceSize;

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

  if (name === "skeleton-1") {
    puzzleGroup.setAttribute("color", "#00FF00");
  }
  if (name === "skeleton-2") {
    puzzleGroup.setAttribute("color", "#0000ff");
  }
  if (name === "skeleton-3") {
    puzzleGroup.setAttribute("color", "#FFFF00");
  }
  if (name === "skeleton-4") {
    puzzleGroup.setAttribute("color", "#FFA500");
  }
  if (name === "skeleton-5") {
    puzzleGroup.setAttribute("color", "#800080");
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
    opacity: 0.5,
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

/* ========== COMPONENTES A-FRAME ========== */
// Componente para logar a posição do puzzle
// AFRAME.registerComponent("puzzle-skeleton", {
//   init: function () {
//     this.el.addEventListener("click", () => {
//       const position = this.el.getAttribute("position");
//       console.log("Posição do puzzle", position);
//     });
//   },
// });

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
    const currentPosition = this.el.getAttribute("position");

    this.el.addEventListener("click", () => {
      const prefixName = this.data.split("-")[0];

      if (
        lineSelection.active &&
        prefixName === "piece" &&
        lineSelection.initalElementName !== this.data
      ) {
        console.log("Não pode selecionar peça");
        return;
      }

      if (
        lineSelection.active &&
        lineSelection.initalElementName === this.data
      ) {
        lineSelection.reset();
        return;
      }

      if (
        lineSelection.active &&
        lineSelection.initalElementName !== this.data
      ) {
        lineSelection.active = false;
        lineSelection.selectedElement.setAttribute("position", {
          x: currentPosition.x - pieceSize / 2,
          y: currentPosition.y - pieceSize / 2,
          z: currentPosition.z - pieceDepth / 2,
        });
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
    });
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
