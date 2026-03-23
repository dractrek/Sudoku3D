const cubeElement = document.getElementById('cube');
const sceneElement = document.getElementById('scene');
const statusElement = document.getElementById('status');
const faceTemplate = document.getElementById('face-template');
const bodyElement = document.body;
const settingsContent = document.getElementById('settings-content');
const toggleSettingsButton = document.getElementById('toggle-settings');
const colorNumbersToggle = document.getElementById('color-numbers-toggle');
const newGameButton = document.getElementById('new-game');
const digitTrackerElement = document.getElementById('digit-tracker');
const sliceBoardsElement = document.getElementById('slice-boards');
const coreAnchorElement = document.getElementById('core-anchor');

const faceConfigs = [
  { key: 'front', label: 'Davant', className: 'face--front', coords: (row, col) => ({ x: col, y: row, z: 2 }) },
  { key: 'back', label: 'Darrere', className: 'face--back', coords: (row, col) => ({ x: 2 - col, y: row, z: 0 }) },
  { key: 'right', label: 'Dreta', className: 'face--right', coords: (row, col) => ({ x: 2, y: row, z: 2 - col }) },
  { key: 'left', label: 'Esquerra', className: 'face--left', coords: (row, col) => ({ x: 0, y: row, z: col }) },
  { key: 'top', label: 'Superior', className: 'face--top', coords: (row, col) => ({ x: col, y: 0, z: row }) },
  { key: 'bottom', label: 'Inferior', className: 'face--bottom', coords: (row, col) => ({ x: col, y: 2, z: 2 - row }) },
];

const sliceConfigs = [
  { key: 'slice-x', label: 'Tall central X', description: 'Pla esquerra-dreta del mig', coords: (row, col) => ({ x: 1, y: row, z: col }) },
  { key: 'slice-y', label: 'Tall central Y', description: 'Pla superior-inferior del mig', coords: (row, col) => ({ x: col, y: 1, z: row }) },
  { key: 'slice-z', label: 'Tall central Z', description: 'Pla davant-darrere del mig', coords: (row, col) => ({ x: col, y: row, z: 1 }) },
];

const validationGroups = [...faceConfigs, ...sliceConfigs];
const visibleFaceKeys = new Set(faceConfigs.map((config) => config.key));
const cubelets = [];

for (let x = 0; x < 3; x += 1) {
  for (let y = 0; y < 3; y += 1) {
    for (let z = 0; z < 3; z += 1) {
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

function coordsForBoard(boardConfig) {
  const coords = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      coords.push(boardConfig.coords(row, col));
    }
  }
  return coords;
}

function generateFixedIds() {
  const visibleIds = new Set();
  faceConfigs.forEach((faceConfig) => {
    coordsForBoard(faceConfig).forEach((coords) => visibleIds.add(cubeletId(coords)));
  });

  const internalFocusIds = new Set();
  sliceConfigs.forEach((sliceConfig) => {
    coordsForBoard(sliceConfig).forEach((coords) => {
      const id = cubeletId(coords);
      if (!visibleIds.has(id) || id === '111') internalFocusIds.add(id);
    });
  });

  const selected = new Set(shuffle([...visibleIds]).slice(0, 14));
  shuffle([...internalFocusIds]).slice(0, 4).forEach((id) => selected.add(id));
  selected.add('111');

  validationGroups.forEach((boardConfig) => {
    const boardIds = coordsForBoard(boardConfig).map(cubeletId);
    const fixedOnBoard = boardIds.filter((id) => selected.has(id)).length;
    if (fixedOnBoard < 3) {
      shuffle(boardIds.filter((id) => !selected.has(id))).slice(0, 3 - fixedOnBoard).forEach((id) => selected.add(id));
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
  statusElement.textContent = 'Nova partida creada: cares externes i talls centrals s’han regenerat amb una combinació nova.';
  statusElement.style.color = 'var(--accent)';
}

function createInputForCubelet(cubelet, label, boardKey, extraClassName = '') {
  const input = document.createElement('input');
  input.className = `cell ${extraClassName}`.trim();
  input.type = 'text';
  input.inputMode = 'numeric';
  input.maxLength = 1;
  input.dataset.cubeletId = cubelet.id;
  input.dataset.fixed = String(cubelet.fixed);
  input.dataset.board = boardKey;
  input.value = cubelet.value;
  input.disabled = cubelet.fixed;
  updateCellAppearance(input, cubelet.value);
  input.setAttribute('aria-label', label);

  input.addEventListener('input', (event) => {
    const raw = event.target.value.replace(/[^1-9]/g, '').slice(-1);
    cubelet.value = raw;
    syncCubelet(cubelet);
    validateBoard();
  });

  registerCell(cubelet, input);
  return input;
}

function renderBoard(boardConfig, mountElement, boardClassName = 'face-board') {
  const boardNode = faceTemplate.content.firstElementChild.cloneNode(true);
  boardNode.className = boardClassName;
  if (boardConfig.className) boardNode.classList.add(boardConfig.className);
  boardNode.dataset.board = boardConfig.key;
  boardNode.querySelector('.face-header').textContent = boardConfig.label;

  const grid = boardNode.querySelector('.face-grid');
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const coords = boardConfig.coords(row, col);
      const cubelet = cubeletMap.get(cubeletId(coords));
      const input = createInputForCubelet(
        cubelet,
        `${boardConfig.label} fila ${row + 1} columna ${col + 1}`,
        boardConfig.key,
        visibleFaceKeys.has(boardConfig.key) ? '' : 'cell--slice'
      );
      grid.appendChild(input);
    }
  }

  mountElement.appendChild(boardNode);
}

function renderFaces() {
  faceConfigs.forEach((faceConfig) => renderBoard(faceConfig, cubeElement));
}

function renderSliceBoards() {
  sliceConfigs.forEach((sliceConfig) => {
    const wrapper = document.createElement('article');
    wrapper.className = 'slice-card';

    const description = document.createElement('p');
    description.className = 'slice-card__description';
    description.textContent = sliceConfig.description;
    wrapper.appendChild(description);

    renderBoard(sliceConfig, wrapper, 'slice-board');
    sliceBoardsElement.appendChild(wrapper);
  });

  const coreCubelet = cubeletMap.get('111');
  const coreInput = createInputForCubelet(coreCubelet, 'Cub central ocult', 'core-anchor', 'core-cell');
  coreAnchorElement.appendChild(coreInput);
}

function getBoardValues(boardConfig) {
  const values = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const cubelet = cubeletMap.get(cubeletId(boardConfig.coords(row, col)));
      values.push(cubelet.value);
    }
  }
  return values;
}

function getDigitUsage() {
  const counts = new Map(Array.from({ length: 9 }, (_, index) => [String(index + 1), 0]));

  validationGroups.forEach((boardConfig) => {
    getBoardValues(boardConfig).forEach((value) => {
      if (!value) return;
      const key = String(value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });

  return counts;
}

function renderDigitTracker() {
  const usage = getDigitUsage();
  digitTrackerElement.innerHTML = '';

  Array.from({ length: 9 }, (_, index) => String(index + 1)).forEach((digit) => {
    const count = usage.get(digit) ?? 0;
    const remaining = Math.max(0, 9 - count);
    const chip = document.createElement('article');
    chip.className = 'digit-chip';
    if (count >= 9) chip.classList.add('is-complete');
    chip.innerHTML = `
      <div class="digit-chip__top">
        <span class="digit-chip__number" data-digit="${digit}">${digit}</span>
        <span class="digit-chip__count">${count}/9</span>
      </div>
      <span class="digit-chip__status">${remaining === 0 ? 'Complet' : `Falten ${remaining}`}</span>
    `;
    digitTrackerElement.appendChild(chip);
  });
}

function validateBoard() {
  renderDigitTracker();
  cellRegistry.forEach((cells) => cells.forEach((cell) => {
    cell.dataset.invalid = 'false';
    cell.classList.remove('invalid');
  }));

  let hasConflicts = false;
  let complete = true;

  validationGroups.forEach((boardConfig) => {
    const seen = new Map();
    getBoardValues(boardConfig).forEach((value, index) => {
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
        const cubelet = cubeletMap.get(cubeletId(boardConfig.coords(row, col)));
        (cellRegistry.get(cubelet.id) ?? []).forEach((cell) => {
          cell.dataset.invalid = 'true';
          cell.classList.add('invalid');
        });
      });
    });
  });

  if (hasConflicts) {
    statusElement.textContent = 'Hi ha números repetits en alguna cara exterior o en algun tall central.';
    statusElement.style.color = 'var(--warn)';
  } else if (complete && cubelets.every((cubelet) => String(cubelet.value) === String(cubelet.solution))) {
    statusElement.textContent = 'Perfecte! Has resolt les cares externes, els tres talls centrals i el cub central ocult.';
    statusElement.style.color = 'var(--good)';
  } else if (complete) {
    statusElement.textContent = 'Tots els plans tenen 1-9, però encara no coincideixen amb la solució completa del prototip.';
    statusElement.style.color = 'var(--accent)';
  } else {
    statusElement.textContent = 'Completa les cares i els talls centrals assegurant que cada làmina 3×3 contingui els números 1-9 sense repetir.';
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
renderSliceBoards();
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
