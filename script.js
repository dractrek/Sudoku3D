const cubeElement = document.getElementById('cube');
const sceneElement = document.getElementById('scene');
const statusElement = document.getElementById('status');
const faceTemplate = document.getElementById('face-template');
const bodyElement = document.body;
const settingsContent = document.getElementById('settings-content');
const toggleSettingsButton = document.getElementById('toggle-settings');
const colorNumbersToggle = document.getElementById('color-numbers-toggle');
const newGameButton = document.getElementById('new-game');

const faceConfigs = [
  { key: 'front', label: 'Davant', className: 'face--front', coords: (row, col) => ({ x: col, y: row, z: 2 }) },
  { key: 'back', label: 'Darrere', className: 'face--back', coords: (row, col) => ({ x: 2 - col, y: row, z: 0 }) },
  { key: 'right', label: 'Dreta', className: 'face--right', coords: (row, col) => ({ x: 2, y: row, z: 2 - col }) },
  { key: 'left', label: 'Esquerra', className: 'face--left', coords: (row, col) => ({ x: 0, y: row, z: col }) },
  { key: 'top', label: 'Superior', className: 'face--top', coords: (row, col) => ({ x: col, y: 0, z: row }) },
  { key: 'bottom', label: 'Inferior', className: 'face--bottom', coords: (row, col) => ({ x: col, y: 2, z: 2 - row }) },
];

const isVisible = ({ x, y, z }) => x === 0 || x === 2 || y === 0 || y === 2 || z === 0 || z === 2;
const cubelets = [];
for (let x = 0; x < 3; x += 1) {
  for (let y = 0; y < 3; y += 1) {
    for (let z = 0; z < 3; z += 1) {
      if (!isVisible({ x, y, z })) continue;
      const id = `${x}${y}${z}`;
      cubelets.push({ id, x, y, z, solution: '', value: '', fixed: false });
    }
  }
}

const cubeletMap = new Map(cubelets.map((cubelet) => [cubelet.id, cubelet]));
const cellRegistry = new Map();

function cubeletId({ x, y, z }) {
  return `${x}${y}${z}`;
}

function updateCellAppearance(cell, value) {
  cell.dataset.digit = value ? String(value) : '';
}

function registerCell(cubelet, input) {
  const list = cellRegistry.get(cubelet.id) ?? [];
  list.push(input);
  cellRegistry.set(cubelet.id, list);
}

function syncCubelet(cubelet) {
  const cells = cellRegistry.get(cubelet.id) ?? [];
  cells.forEach((cell) => {
    cell.value = cubelet.value;
    cell.disabled = cubelet.fixed;
    cell.dataset.fixed = String(cubelet.fixed);
    updateCellAppearance(cell, cubelet.value);
    cell.classList.toggle('invalid', cell.dataset.invalid === 'true');
  });
}

function shuffle(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function baseSolutionFor(coords) {
  const { x, y, z } = coords;
  return ((x + y) % 3) + (3 * ((y + z) % 3)) + 1;
}

function createDigitMap() {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return new Map(digits.map((digit, index) => [index + 1, digit]));
}

function generateFixedIds() {
  const shuffledIds = shuffle(cubelets.map((cubelet) => cubelet.id));
  const fixedTarget = 14;
  const selected = new Set(shuffledIds.slice(0, fixedTarget));

  faceConfigs.forEach((faceConfig) => {
    const faceIds = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        faceIds.push(cubeletId(faceConfig.coords(row, col)));
      }
    }

    const fixedOnFace = faceIds.filter((id) => selected.has(id)).length;
    if (fixedOnFace < 3) {
      shuffle(faceIds.filter((id) => !selected.has(id))).slice(0, 3 - fixedOnFace).forEach((id) => selected.add(id));
    }
  });

  return selected;
}

function applyNewGame() {
  const digitMap = createDigitMap();
  const fixedIds = generateFixedIds();

  cubelets.forEach((cubelet) => {
    cubelet.solution = digitMap.get(baseSolutionFor(cubelet));
    cubelet.fixed = fixedIds.has(cubelet.id);
    cubelet.value = cubelet.fixed ? cubelet.solution : '';
    syncCubelet(cubelet);
  });

  validateBoard();
  statusElement.textContent = 'Nova partida creada: els números inicials i la solució s’han barallat.';
  statusElement.style.color = 'var(--accent)';
}

function renderFaces() {
  faceConfigs.forEach((faceConfig) => {
    const faceNode = faceTemplate.content.firstElementChild.cloneNode(true);
    faceNode.classList.add(faceConfig.className);
    faceNode.dataset.face = faceConfig.key;
    faceNode.querySelector('.face-header').textContent = faceConfig.label;

    const grid = faceNode.querySelector('.face-grid');
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const coords = faceConfig.coords(row, col);
        const cubelet = cubeletMap.get(cubeletId(coords));
        const input = document.createElement('input');
        input.className = 'cell';
        input.type = 'text';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.dataset.cubeletId = cubelet.id;
        input.dataset.fixed = String(cubelet.fixed);
        input.dataset.face = faceConfig.key;
        input.value = cubelet.value;
        input.disabled = cubelet.fixed;
        updateCellAppearance(input, cubelet.value);
        input.setAttribute('aria-label', `${faceConfig.label} fila ${row + 1} columna ${col + 1}`);

        input.addEventListener('input', (event) => {
          const raw = event.target.value.replace(/[^1-9]/g, '').slice(-1);
          cubelet.value = raw;
          syncCubelet(cubelet);
          validateBoard();
        });

        registerCell(cubelet, input);
        grid.appendChild(input);
      }
    }

    cubeElement.appendChild(faceNode);
  });
}

function getFaceValues(faceConfig) {
  const values = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const cubelet = cubeletMap.get(cubeletId(faceConfig.coords(row, col)));
      values.push(cubelet.value);
    }
  }
  return values;
}

function validateBoard() {
  cellRegistry.forEach((cells) => cells.forEach((cell) => {
    cell.dataset.invalid = 'false';
    cell.classList.remove('invalid');
  }));

  let hasConflicts = false;
  let complete = true;

  faceConfigs.forEach((faceConfig) => {
    const seen = new Map();
    getFaceValues(faceConfig).forEach((value, index) => {
      if (!value) {
        complete = false;
        return;
      }
      const key = String(value);
      const list = seen.get(key) ?? [];
      list.push(index);
      seen.set(key, list);
    });

    seen.forEach((indices) => {
      if (indices.length < 2) return;
      hasConflicts = true;
      indices.forEach((flatIndex) => {
        const row = Math.floor(flatIndex / 3);
        const col = flatIndex % 3;
        const cubelet = cubeletMap.get(cubeletId(faceConfig.coords(row, col)));
        (cellRegistry.get(cubelet.id) ?? []).forEach((cell) => {
          cell.dataset.invalid = 'true';
          cell.classList.add('invalid');
        });
      });
    });
  });

  if (hasConflicts) {
    statusElement.textContent = 'Hi ha números repetits en alguna cara.';
    statusElement.style.color = 'var(--warn)';
  } else if (complete && cubelets.every((cubelet) => String(cubelet.value) === String(cubelet.solution))) {
    statusElement.textContent = 'Perfecte! Has resolt el cub Sudoku 3D.';
    statusElement.style.color = 'var(--good)';
  } else if (complete) {
    statusElement.textContent = 'Totes les cares tenen 1-9, però encara no coincideixen amb la solució prototip.';
    statusElement.style.color = 'var(--accent)';
  } else {
    statusElement.textContent = 'Completa les caselles buides i comprova que cada cara contingui els números 1-9 sense repetir.';
    statusElement.style.color = 'var(--muted)';
  }
}

function toggleSettings() {
  const hidden = settingsContent.hasAttribute('hidden');
  if (hidden) {
    settingsContent.removeAttribute('hidden');
    toggleSettingsButton.textContent = 'Amaga opcions';
    toggleSettingsButton.setAttribute('aria-expanded', 'true');
  } else {
    settingsContent.setAttribute('hidden', '');
    toggleSettingsButton.textContent = 'Mostra opcions';
    toggleSettingsButton.setAttribute('aria-expanded', 'false');
  }
}

renderFaces();
bodyElement.classList.add('numbers-colored');
applyNewGame();

let rotationX = -24;
let rotationY = 32;
let dragging = false;
let pointerStart = { x: 0, y: 0 };
let rotationStart = { x: rotationX, y: rotationY };

function applyRotation() {
  cubeElement.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
}
applyRotation();

sceneElement.addEventListener('pointerdown', (event) => {
  dragging = true;
  pointerStart = { x: event.clientX, y: event.clientY };
  rotationStart = { x: rotationX, y: rotationY };
  sceneElement.setPointerCapture(event.pointerId);
});

sceneElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  rotationY = rotationStart.y + dx * 0.35;
  rotationX = rotationStart.x - dy * 0.35;
  applyRotation();
});

function stopDragging(event) {
  dragging = false;
  if (event?.pointerId !== undefined) sceneElement.releasePointerCapture(event.pointerId);
}
sceneElement.addEventListener('pointerup', stopDragging);
sceneElement.addEventListener('pointercancel', stopDragging);
sceneElement.addEventListener('pointerleave', () => { dragging = false; });

newGameButton.addEventListener('click', applyNewGame);
document.getElementById('reset-view').addEventListener('click', () => {
  rotationX = -24;
  rotationY = 32;
  applyRotation();
});

document.getElementById('check-board').addEventListener('click', validateBoard);
document.getElementById('fill-solution').addEventListener('click', () => {
  cubelets.forEach((cubelet) => {
    cubelet.value = cubelet.solution;
    syncCubelet(cubelet);
  });
  validateBoard();
});

toggleSettingsButton.addEventListener('click', toggleSettings);
colorNumbersToggle.addEventListener('change', (event) => {
  bodyElement.classList.toggle('numbers-colored', event.target.checked);
});
