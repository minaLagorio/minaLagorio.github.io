const CREATION_MENU = {
  'imprime': {
    id: 'imprime',
    name: 'Design imprimé',
    lastIndex: 15,
  },
  'illustration': {
    id: 'illustration',
    name: 'Illustration',
    lastIndex: 39,
  },
  'typo': {
    id: 'typo',
    name: 'Typos',
    lastIndex: 16,
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

const BASE_WIDTH = 2979;
const BASE_HEIGHT = 1458;

const LANDSCAPE_THRESHOLD = BASE_WIDTH / BASE_HEIGHT;
const PORTRAIT_THRESHOLD = BASE_HEIGHT / BASE_WIDTH;

let updtTo = null;

let images = new Array();

window.onload = async () => {
  /* Menu */
  const mobileIcon = document.querySelector('.mobile-icon');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileIcon) {
    let isMenuDisplayed = false;
    mobileIcon.addEventListener('click', (evt) => {
      navMenu.style.display = isMenuDisplayed ? 'none' : 'block';
      isMenuDisplayed = !isMenuDisplayed;
    });
  }
  /********/

  /* Creations */
  if (document.querySelector('#creations')) {
    const urlHash = window.location.hash.substring(1);

    let creationSelectedMenu = urlHash ? urlHash : DEFAULT_MENU;
    const subMenus = document.querySelectorAll('.creation-link');

    for (let sub of subMenus) {
      sub.classList.remove('active');
      if (sub.dataset.id === creationSelectedMenu) {
        sub.classList.add('active');
      }
    }

    const imageOverlay = document.querySelector('.image-overlay');
    const leftBtn = document.querySelector('.left-button');
    const rightBtn = document.querySelector('.right-button')

    for(let s of subMenus) {
      s.addEventListener('click', (e) => {
        loadCreationImages(e.currentTarget.dataset.id);

        for (let sub of subMenus) {
          sub.classList.remove('active');
          e.currentTarget.classList.add('active');
        }
      });
    }

    await loadCreationImages(creationSelectedMenu);

    imageOverlay.addEventListener('click', function(e) {
      if (e.target !== leftBtn && e.target !== rightBtn) {
        imageOverlay.style.display = 'none';
      }
    });

    const observer = new MutationObserver((mutations, observer) => {
      mutations.forEach((mutation) => {
        if (typeof mutation.target.dataset.currentImageId === "undefined") {
          return;
        }

        const currentImage = document.querySelector(`[data-image-id=${mutation.target.dataset.currentImageId}]`);

        if (currentImage === null) {
          return;
        }

        const clonedImage = currentImage.cloneNode(true);

        clonedImage.dataset.imageId = undefined;

        document.querySelector('.image-overlay .image').replaceChildren(clonedImage);
      });
    })
    
    observer.observe(imageOverlay, {
      attributes: true, // this can be omitted
      attributeFilter: ["data-current-image-id"]
    });

    const leftBtnEvt = (e) => {
      e.preventDefault();
      const currentImg = document.querySelector(`[data-image-id=${imageOverlay.dataset.currentImageId}]`);
      const previousImg = currentImg.parentElement.previousElementSibling;
  
      if (previousImg === null) {
        imageOverlay.dataset.currentImageId  = images[images.length - 1].dataset.imageId;
        return;
      }
  
      imageOverlay.dataset.currentImageId = previousImg.children[0].dataset.imageId;
    }
    const rightBtnEvt = (e) => {
      e.preventDefault();
      const currentImg = document.querySelector(`[data-image-id=${imageOverlay.dataset.currentImageId}]`);
      const nextImg = currentImg.parentElement.nextElementSibling;
  
      if (nextImg === null) {
        imageOverlay.dataset.currentImageId = images[0].dataset.imageId;
        return;
      }
  
      imageOverlay.dataset.currentImageId = nextImg.children[0].dataset.imageId;
    }
  
    leftBtn.addEventListener('click', leftBtnEvt);
    rightBtn.addEventListener('click', rightBtnEvt);
  }
  /*************/

  /* Blog */
  const blockLinks = document.querySelectorAll('.block-link');

  for (const b of blockLinks) {
    b.addEventListener('click', function(e) {
      if (this.dataset.url) {
        window.location.href = this.dataset.url;
      }
    });
  }
  /********/
}

const loadCreationImages = async (id, leftBtn, rightBtn) => {
  resetGrid();
  
  const imageGridElt = document.querySelector('.image-grid');
  const imageOverlay = document.querySelector('.image-overlay');

  imageOverlay.dataset.currentImageId = undefined;

  const creationInfo = CREATION_MENU[id];

  let grid = [[]];

  // * 2 to give enough rows for placing images
  for(let rowIndex = 0; rowIndex < (creationInfo.lastIndex / 3) * 2; rowIndex++) {
    grid[rowIndex] = [0, 0, 0]; // 3 columns   
  }

  grid.push([0, 0, 0]);

  images = new Array();
  
  for (let i = 1; i <= creationInfo.lastIndex; i++) {
    const img = document.createElement('img');

    img.dataset.imageId = `${id}_${i}`;
    img.src = `/assets/images/${img.dataset.imageId}.jpg`;
    img.loading = 'lazy';

    images.push(img);
  }

  shuffleArray(images);

  const imgContainers = [];

  for(let i = 0; i < images.length; i++) {
    const imgContainer = document.createElement('figure');
    imgContainer.classList.add('image-container');

    const img = images[i];

    img.addEventListener('click', function(e) {
      imageOverlay.style.display = 'flex';
      imageOverlay.dataset.currentImageId = e.currentTarget.dataset.imageId;
    });

    imgContainer.appendChild(img);

    const imageSize = await getImageSize(img.src);

    const r = imageSize.width / imageSize.height;

    imgContainers.push(imgContainer);

    let placed = false;
    for(let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
      if (placed) {
        break;
      }

      for(let colIndex = 0; colIndex < grid[rowIndex].length; colIndex++) {
        // place taken
        if (grid[rowIndex][colIndex] !== 0) {
          continue;
        }

        if (r >= LANDSCAPE_THRESHOLD) {
          if (colIndex + 1 >= grid[rowIndex].length) {
            continue;
          }
          if (grid[rowIndex][colIndex + 1] !== 0) {
            continue;
          }

          placed = true;

          grid[rowIndex][colIndex] = i + 1;
          grid[rowIndex][colIndex + 1] = i + 1;

          imgContainer.style.gridRowStart = rowIndex + 1;
          imgContainer.style.gridColumnStart = colIndex + 1;
          imgContainer.style.gridColumnEnd = `span 2`;
        } else if (r <= PORTRAIT_THRESHOLD) {
          if (rowIndex + 1 >= grid.length) {
            continue;
          }
          if (grid[rowIndex + 1][colIndex] !== 0) {
            continue;
          }

          placed = true;

          grid[rowIndex][colIndex] = i + 1;
          grid[rowIndex + 1][colIndex] = i + 1;

          imgContainer.style.gridRowStart = rowIndex + 1;
          imgContainer.style.gridRowEnd = `span 2`;
          imgContainer.style.gridColumnStart = colIndex + 1;
        } else {
          placed = true;
          grid[rowIndex][colIndex] = i + 1;
        }

        break;
      }

    }

    if (updtTo) {
      clearTimeout(updtTo);
    }

    updtTo = setTimeout(() => {
      for (let c of imgContainers) {
        imageGridElt.appendChild(c);
      }
      
      const loadingElements = imageGridElt.querySelectorAll('.loading');
      loadingElements.forEach(element => element.remove());
    }, (0.5 + Math.random()) * 1000);
  }

  return images;
};

const getImageSize = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new   
 Error(`Failed to load image from URL: ${url}`));
    };
    img.src = url;
  });
}

const shuffleArray = (array) => {
  for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

const resetGrid = () => {
  if (updtTo) {
    clearTimeout(updtTo);
  }

  const imageGridElt = document.querySelector('.image-grid');

  imageGridElt.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const imgLoader = document.createElement('div');

    imgLoader.className = 'image-container loading';

    if (i === 1) {
      imgLoader.style = 'grid-row: 1 / span 2; grid-column-start: 2;';
    } else if (i === 3) {
      imgLoader.style = 'grid-row-start: 3; grid-column: 1 / span 2;';
    }

    imageGridElt.appendChild(imgLoader);
  }
}