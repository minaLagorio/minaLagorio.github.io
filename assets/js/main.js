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

let updtTo = null;

let images = new Array();
const imageSizeCache = new Map();
const allImageContainers = new Map();
let currentActiveTab = null;

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
        currentActiveTab = e.currentTarget.dataset.id;
        showCreationImages(e.currentTarget.dataset.id);

        for (let sub of subMenus) {
          sub.classList.remove('active');
          e.currentTarget.classList.add('active');
        }
      });
    }

    currentActiveTab = creationSelectedMenu;
    initializeAllImages();
    showCreationImages(creationSelectedMenu);

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

const initializeAllImages = () => {
  const imageGridElt = document.querySelector('.image-grid');
  const imageOverlay = document.querySelector('.image-overlay');
  
  for (const [id, creationInfo] of Object.entries(CREATION_MENU)) {
    const imgContainers = [];
    const categoryImages = [];
    const grid = [[]];
    
    for(let rowIndex = 0; rowIndex < (creationInfo.lastIndex / 3) * 2; rowIndex++) {
      grid[rowIndex] = [0, 0, 0];
    }
    grid.push([0, 0, 0]);
    
    for (let i = 1; i <= creationInfo.lastIndex; i++) {
      const img = document.createElement('img');
      img.dataset.imageId = `${id}_${i}`;
      img.dataset.category = id;
      
      const imgContainer = document.createElement('figure');
      imgContainer.classList.add('image-container');
      imgContainer.dataset.category = id;
      
      img.addEventListener('click', function(e) {
        imageOverlay.style.display = 'flex';
        imageOverlay.dataset.currentImageId = e.currentTarget.dataset.imageId;
      });
      
      imgContainer.appendChild(img);
      imageGridElt.appendChild(imgContainer);
      imgContainers.push(imgContainer);
      categoryImages.push({ img, container: imgContainer, index: i - 1 });
      
      img.onload = function() {
        const categoryId = this.dataset.category;
        let imageSize;
        if (imageSizeCache.has(this.src)) {
          imageSize = imageSizeCache.get(this.src);
        } else {
          imageSize = { width: this.naturalWidth, height: this.naturalHeight };
          imageSizeCache.set(this.src, imageSize);
        }
        
        const r = imageSize.width / imageSize.height;
        const container = this.parentElement;
        let placed = false;
        
        for(let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
          if (placed) break;
          
          for(let colIndex = 0; colIndex < grid[rowIndex].length; colIndex++) {
            if (grid[rowIndex][colIndex] !== 0) continue;
            
            if (r >= LANDSCAPE_THRESHOLD) {
              if (colIndex + 1 >= grid[rowIndex].length) continue;
              if (grid[rowIndex][colIndex + 1] !== 0) continue;
              
              placed = true;
              grid[rowIndex][colIndex] = 1;
              grid[rowIndex][colIndex + 1] = 1;
              
              container.style.gridRowStart = rowIndex + 1;
              container.style.gridColumnStart = colIndex + 1;
              container.style.gridColumnEnd = `span 2`;
            } else if (r <= PORTRAIT_THRESHOLD) {
              if (rowIndex + 1 >= grid.length) continue;
              if (grid[rowIndex + 1][colIndex] !== 0) continue;
              
              placed = true;
              grid[rowIndex][colIndex] = 1;
              grid[rowIndex + 1][colIndex] = 1;
              
              container.style.gridRowStart = rowIndex + 1;
              container.style.gridRowEnd = `span 2`;
              container.style.gridColumnStart = colIndex + 1;
            } else {
              placed = true;
              grid[rowIndex][colIndex] = 1;
            }
            
            break;
          }
        }
        
        if (currentActiveTab === categoryId) {
          container.style.display = 'block';
          requestAnimationFrame(() => {
            container.classList.add('visible');
          });
        }
      };
      
      img.src = `/assets/images/${img.dataset.imageId}.jpg`;
    }
    
    shuffleArray(categoryImages);
    allImageContainers.set(id, imgContainers);
  }
};

const showCreationImages = (id) => {
  const imageOverlay = document.querySelector('.image-overlay');
  imageOverlay.dataset.currentImageId = undefined;
  
  for (const [categoryId, containers] of allImageContainers.entries()) {
    const isActive = categoryId === id;
    containers.forEach(container => {
      if (isActive) {
        container.style.display = 'block';
        requestAnimationFrame(() => {
          container.classList.add('visible');
        });
      } else {
        container.classList.remove('visible');
        setTimeout(() => {
          if (!container.classList.contains('visible')) {
            container.style.display = 'none';
          }
        }, 200);
      }
    });
  }
  
  const activeContainers = allImageContainers.get(id) || [];
  images = activeContainers.map(container => container.querySelector('img')).filter(img => img !== null);
};

const getImageSize = (url) => {
  if (imageSizeCache.has(url)) {
    return Promise.resolve(imageSizeCache.get(url));
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = { width: img.width, height: img.height };
      imageSizeCache.set(url, size);
      resolve(size);
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };
    img.src = url;
  });
}

const preloadAllImageSizes = () => {
  for (const [id, creationInfo] of Object.entries(CREATION_MENU)) {
    for (let i = 1; i <= creationInfo.lastIndex; i++) {
      const imageId = `${id}_${i}`;
      const url = `/assets/images/${imageId}.jpg`;
      
      if (imageSizeCache.has(url)) {
        continue;
      }
      
      const img = new Image();
      img.onload = () => {
        imageSizeCache.set(url, { width: img.width, height: img.height });
      };
      img.src = url;
    }
  }
}

const shuffleArray = (array) => {
  for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}
