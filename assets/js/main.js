const CREATION_MENU = {
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
  'imprime': {
    id: 'imprime',
    name: 'Design imprimé',
    lastIndex: 14,
  }, 
  'numerique': {
    id: 'numerique',
    name: 'Design Numérique',
    lastIndex: 13,
  }, 
  'photo': {
    id: 'photo',
    name: 'Photos',
    lastIndex: 10,
  },
};

const DEFAULT_MENU = 'illustration';

const BASE_WIDTH = 2979;
const BASE_HEIGHT = 1458;

const LANDSCAPE_THRESHOLD = BASE_WIDTH / BASE_HEIGHT;
const PORTRAIT_THRESHOLD = BASE_HEIGHT / BASE_WIDTH;

window.onload = () => {
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
    let creationSelectedMenu = DEFAULT_MENU;
    const subMenus = document.querySelectorAll('.creation-link');

    loadCreationImages(creationSelectedMenu);

    for(let s of subMenus) {
      s.addEventListener('click', (e) => {
        creationSelectedMenu = e.currentTarget.dataset.id;
        loadCreationImages(creationSelectedMenu);

        for (let sub of subMenus) {
          sub.classList.remove('active');
          e.currentTarget.classList.add('active');
        }
      });
    }
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

const loadCreationImages = async (id) => {
  const imageGridElt = document.querySelector('.image-grid');

  imageGridElt.innerHTML = '';

  const creationInfo = CREATION_MENU[id];

  let grid = [[]];

  // * 2 to give enough rows for placing images
  for(let rowIndex = 0; rowIndex < (creationInfo.lastIndex / 3) * 2; rowIndex++) {
    grid[rowIndex] = [0, 0, 0]; // 3 columns   
  }

  grid.push([0, 0, 0]);

  const images = new Array();
  
  for (let i = 1; i <= creationInfo.lastIndex; i++) {
    const img = document.createElement('img');

    img.src = `/assets/images/${id}_${i}.jpg`;
    img.loading = 'lazy';

    images.push(img);
  }

  shuffleArray(images);

  for(let i = 0; i < images.length; i++) {
    const imgContainer = document.createElement('figure');
    imgContainer.classList.add('image-container');

    const img = images[i];

    imgContainer.appendChild(img);

    const imageSize = await getImageSize(img.src);

    const r = imageSize.width / imageSize.height;

    imageGridElt.appendChild(imgContainer);

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
  }
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