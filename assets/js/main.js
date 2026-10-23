const CREATION_MENU = {
  'imprime': {
    id: 'imprime',
    name: 'Design imprimé',
    lastIndex: 16,
  },
  'illustration': {
    id: 'illustration',
    name: 'Illustration',
    lastIndex: 39,
  },
  'typo': {
    id: 'typo',
    name: 'Typos',
    lastIndex: 17,
  },
  'numerique': {
    id: 'numerique',
    name: 'Design Numérique',
    lastIndex: 13,
  },
  'photo': {
    id: 'photo',
    name: 'Photos',
    lastIndex: 24,
  },
};

const DEFAULT_MENU = 'imprime';

const BASE_WIDTH = 2980;
const BASE_HEIGHT = 1459;

const LANDSCAPE_THRESHOLD = BASE_WIDTH / BASE_HEIGHT;
const PORTRAIT_THRESHOLD = BASE_HEIGHT / BASE_WIDTH;
const MOBILE_MQ = '(max-width: 768px)';

const FADE_MS = 380;
const STAGGER_MS = 38;
const STAGGER_CAP_MS = 420;
const OVERLAY_CROSSFADE_MS = 180;

let images = [];
const imageSizeCache = new Map();
const allImageContainers = new Map();
const categoryGrids = new Map();
const loadedCategories = new Set();
let currentActiveTab = null;
let hideTimeouts = [];
let overlaySwapTimeout = null;
let isOverlayOpen = false;
let currentGridCols = 0;

const getGridColumnCount = () => 3;

const createEmptyRow = (cols) => Array.from({ length: cols }, () => 0);

window.onload = async () => {
  /* Menu */
  const mobileIcon = document.querySelector('.mobile-icon');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileIcon) {
    let isMenuDisplayed = false;
    mobileIcon.addEventListener('click', () => {
      navMenu.style.display = isMenuDisplayed ? 'none' : 'block';
      isMenuDisplayed = !isMenuDisplayed;
    });
  }
  /********/

  /* Creations */
  if (document.querySelector('#creations')) {
    const urlHash = window.location.hash.substring(1);
    const creationSelectedMenu = CREATION_MENU[urlHash] ? urlHash : DEFAULT_MENU;
    const subMenus = document.querySelectorAll('.creation-link');

    for (const sub of subMenus) {
      sub.classList.toggle('active', sub.dataset.id === creationSelectedMenu);
    }

    const imageOverlay = document.querySelector('.image-overlay');
    const leftBtn = document.querySelector('.left-button');
    const rightBtn = document.querySelector('.right-button');
    const closeBtn = document.querySelector('.close-button');

    /* Menu déroulant des thèmes (mobile) */
    const creationMenu = document.querySelector('.creation-menu');
    const creationToggle = document.querySelector('.creation-toggle');
    const toggleLabel = document.querySelector('.creation-toggle-label');
    const setMenuOpen = (open) => {
      creationMenu.classList.toggle('open', open);
      creationToggle.setAttribute('aria-expanded', String(open));
    };
    const updateToggleLabel = () => {
      const active = document.querySelector('.creation-link.active');
      if (active) toggleLabel.textContent = active.textContent;
    };
    creationToggle.addEventListener('click', () => {
      setMenuOpen(!creationMenu.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!creationMenu.contains(e.target)) setMenuOpen(false);
    });
    updateToggleLabel();

    for (const s of subMenus) {
      s.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (id === currentActiveTab) return;

        currentActiveTab = id;
        for (const sub of subMenus) {
          sub.classList.toggle('active', sub === e.currentTarget);
        }
        showCreationImages(id);
        updateToggleLabel();
        setMenuOpen(false);
      });
    }

    currentActiveTab = creationSelectedMenu;
    initializeAllImages();
    showCreationImages(creationSelectedMenu);

    // Prefetch other categories after first paint settles
    requestIdleCallbackSafe(() => {
      for (const id of Object.keys(CREATION_MENU)) {
        if (id !== creationSelectedMenu) {
          loadCategorySources(id);
        }
      }
    }, 900);

    imageOverlay.addEventListener('click', (e) => {
      if (e.target !== leftBtn && e.target !== rightBtn) {
        closeOverlay();
      }
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeOverlay();
    });

    leftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateOverlay(-1);
    });

    rightBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateOverlay(1);
    });

    document.addEventListener('keydown', (e) => {
      if (!isOverlayOpen) return;

      if (e.key === 'Escape') {
        closeOverlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateOverlay(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateOverlay(1);
      }
    });
  }
  /*************/

  /* Blog */
  const blockLinks = document.querySelectorAll('.block-link');

  for (const b of blockLinks) {
    b.addEventListener('click', function () {
      if (this.dataset.url) {
        window.location.href = this.dataset.url;
      }
    });
  }
  /********/
};

const requestIdleCallbackSafe = (fn, timeout = 1000) => {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, Math.min(timeout, 400));
  }
};

const openOverlay = (imageId) => {
  const imageOverlay = document.querySelector('.image-overlay');
  isOverlayOpen = true;
  document.body.style.overflow = 'hidden';
  imageOverlay.classList.add('is-open');
  imageOverlay.dataset.currentImageId = imageId;
  setOverlayImage(imageId, false);
};

const closeOverlay = () => {
  const imageOverlay = document.querySelector('.image-overlay');
  isOverlayOpen = false;
  document.body.style.overflow = '';
  imageOverlay.classList.remove('is-open');

  const figure = document.querySelector('.image-overlay .image');
  const current = figure.querySelector('img');
  if (current) {
    current.classList.remove('is-shown');
  }

  clearTimeout(overlaySwapTimeout);
  overlaySwapTimeout = setTimeout(() => {
    if (!isOverlayOpen) {
      figure.replaceChildren();
      imageOverlay.dataset.currentImageId = '';
    }
  }, FADE_MS);
};

const navigateOverlay = (direction) => {
  const imageOverlay = document.querySelector('.image-overlay');
  if (!images.length) return;

  const currentId = imageOverlay.dataset.currentImageId;
  let idx = images.findIndex((img) => img.dataset.imageId === currentId);
  if (idx === -1) idx = 0;

  const nextIdx = (idx + direction + images.length) % images.length;
  const nextId = images[nextIdx].dataset.imageId;
  imageOverlay.dataset.currentImageId = nextId;
  setOverlayImage(nextId, true);
};

const setOverlayImage = (imageId, animate) => {
  const figure = document.querySelector('.image-overlay .image');
  const sourceImage = document.querySelector(`[data-image-id="${imageId}"]`);
  if (!sourceImage) return;

  const clonedImage = sourceImage.cloneNode(true);
  clonedImage.removeAttribute('data-image-id');
  clonedImage.classList.remove('is-shown');

  clearTimeout(overlaySwapTimeout);

  const existing = figure.querySelector('img');
  if (existing && animate) {
    existing.classList.remove('is-shown');
    overlaySwapTimeout = setTimeout(() => {
      figure.replaceChildren(clonedImage);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => clonedImage.classList.add('is-shown'));
      });
    }, OVERLAY_CROSSFADE_MS);
  } else {
    figure.replaceChildren(clonedImage);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => clonedImage.classList.add('is-shown'));
    });
  }
};

const placeImageInGrid = (container, imageSize, grid, cols) => {
  const r = imageSize.width / imageSize.height;
  let placed = false;

  const ensureRows = (neededIndex) => {
    while (grid.length <= neededIndex) {
      grid.push(createEmptyRow(cols));
    }
  };

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    if (placed) break;

    for (let colIndex = 0; colIndex < cols; colIndex++) {
      if (grid[rowIndex][colIndex] !== 0) continue;

      if (r >= LANDSCAPE_THRESHOLD) {
        if (colIndex + 1 >= cols) continue;
        if (grid[rowIndex][colIndex + 1] !== 0) continue;

        placed = true;
        grid[rowIndex][colIndex] = 1;
        grid[rowIndex][colIndex + 1] = 1;

        container.style.gridRowStart = rowIndex + 1;
        container.style.gridColumnStart = colIndex + 1;
        container.style.gridColumnEnd = 'span 2';
        container.style.gridRowEnd = '';
      } else if (r <= PORTRAIT_THRESHOLD) {
        ensureRows(rowIndex + 1);
        if (grid[rowIndex + 1][colIndex] !== 0) continue;

        placed = true;
        grid[rowIndex][colIndex] = 1;
        grid[rowIndex + 1][colIndex] = 1;

        container.style.gridRowStart = rowIndex + 1;
        container.style.gridRowEnd = 'span 2';
        container.style.gridColumnStart = colIndex + 1;
        container.style.gridColumnEnd = '';
      } else {
        placed = true;
        grid[rowIndex][colIndex] = 1;

        container.style.gridRowStart = rowIndex + 1;
        container.style.gridColumnStart = colIndex + 1;
        container.style.gridColumnEnd = '';
        container.style.gridRowEnd = '';
      }

      break;
    }
  }

  if (!placed) {
    grid.push(createEmptyRow(cols));
    const rowIndex = grid.length - 1;
    grid[rowIndex][0] = 1;
    container.style.gridRowStart = rowIndex + 1;
    container.style.gridColumnStart = 1;
    container.style.gridColumnEnd = '';
    container.style.gridRowEnd = '';
  }
};

const resetCategoryGrid = (id, cols) => {
  const creationInfo = CREATION_MENU[id];
  const rowCount = Math.ceil(creationInfo.lastIndex / cols) * 2 + 2;
  const grid = Array.from({ length: rowCount }, () => createEmptyRow(cols));
  categoryGrids.set(id, grid);
  return grid;
};

const relayoutCategory = (id, cols) => {
  const grid = resetCategoryGrid(id, cols);
  const containers = allImageContainers.get(id) || [];

  for (const container of containers) {
    const img = container.querySelector('img');
    if (!img?.src || !img.naturalWidth) continue;

    const imageSize = imageSizeCache.get(img.src) || {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
    imageSizeCache.set(img.src, imageSize);
    placeImageInGrid(container, imageSize, grid, cols);
  }
};

const initializeAllImages = () => {
  const imageGridElt = document.querySelector('.image-grid');
  currentGridCols = getGridColumnCount();

  for (const [id, creationInfo] of Object.entries(CREATION_MENU)) {
    const imgContainers = [];
    resetCategoryGrid(id, currentGridCols);

    const indices = Array.from({ length: creationInfo.lastIndex }, (_, i) => i + 1);
    shuffleArray(indices);

    for (const i of indices) {
      const img = document.createElement('img');
      img.dataset.imageId = `${id}_${i}`;
      img.dataset.category = id;
      img.alt = '';

      const imgContainer = document.createElement('figure');
      imgContainer.classList.add('image-container');
      imgContainer.dataset.category = id;

      img.addEventListener('click', (e) => {
        openOverlay(e.currentTarget.dataset.imageId);
      });

      img.onload = function () {
        const categoryId = this.dataset.category;
        let imageSize;
        if (imageSizeCache.has(this.src)) {
          imageSize = imageSizeCache.get(this.src);
        } else {
          imageSize = { width: this.naturalWidth, height: this.naturalHeight };
          imageSizeCache.set(this.src, imageSize);
        }

        const container = this.parentElement;
        const categoryGrid = categoryGrids.get(categoryId);
        placeImageInGrid(container, imageSize, categoryGrid, currentGridCols);

        container.classList.remove('loading');

        if (currentActiveTab === categoryId) {
          const activeContainers = allImageContainers.get(categoryId) || [];
          const index = activeContainers.indexOf(container);
          const delay = Math.min(Math.max(index, 0) * STAGGER_MS, STAGGER_CAP_MS);
          container.style.display = 'block';
          container.style.transitionDelay = `${delay}ms`;
          requestAnimationFrame(() => {
            container.classList.add('visible');
          });
        }
      };

      imgContainer.appendChild(img);
      imageGridElt.appendChild(imgContainer);
      imgContainers.push(imgContainer);
    }

    allImageContainers.set(id, imgContainers);
  }

  window.addEventListener('resize', () => {
    const cols = getGridColumnCount();
    if (cols === currentGridCols) return;
    currentGridCols = cols;
    for (const id of Object.keys(CREATION_MENU)) {
      relayoutCategory(id, cols);
    }
  });
};

const loadCategorySources = (id) => {
  if (loadedCategories.has(id)) return;
  loadedCategories.add(id);

  const containers = allImageContainers.get(id) || [];
  containers.forEach((container) => {
    const img = container.querySelector('img');
    if (!img || img.getAttribute('src')) return;

    if (currentActiveTab === id) {
      container.classList.add('loading');
      container.style.display = 'block';
    }

    img.src = `/assets/images/${img.dataset.imageId}.jpg`;
  });
};

const showCreationImages = (id) => {
  const imageOverlay = document.querySelector('.image-overlay');
  if (isOverlayOpen) {
    closeOverlay();
  } else {
    imageOverlay.dataset.currentImageId = '';
  }

  history.replaceState(null, '', `#${id}`);
  currentActiveTab = id;
  loadCategorySources(id);

  hideTimeouts.forEach(clearTimeout);
  hideTimeouts = [];

  for (const [categoryId, containers] of allImageContainers.entries()) {
    const isActive = categoryId === id;

    containers.forEach((container, index) => {
      if (isActive) {
        const hasLoaded = container.querySelector('img')?.complete && container.querySelector('img')?.naturalWidth > 0;
        container.style.display = 'block';

        if (!hasLoaded) {
          container.classList.add('loading');
          container.classList.remove('visible');
          return;
        }

        container.classList.remove('loading');
        const delay = Math.min(index * STAGGER_MS, STAGGER_CAP_MS);
        container.style.transitionDelay = `${delay}ms`;
        requestAnimationFrame(() => {
          container.classList.add('visible');
        });
      } else {
        container.style.transitionDelay = '0ms';
        container.classList.remove('visible');
        container.classList.remove('loading');
        const timeout = setTimeout(() => {
          if (!container.classList.contains('visible')) {
            container.style.display = 'none';
          }
        }, FADE_MS);
        hideTimeouts.push(timeout);
      }
    });
  }

  const activeContainers = allImageContainers.get(id) || [];
  images = activeContainers
    .map((container) => container.querySelector('img'))
    .filter((img) => img !== null);
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};
