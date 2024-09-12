const CREATION_MENU = {
  'imprime': {
    id: 'imprime',
    name: 'Design imprimé',
    lastIndex: 13,
  }, 
  'numerique': {
    id: 'numerique',
    name: 'Design Numérique',
    lastIndex: 11,
  }, 
  'illustration': {
    id: 'illustration',
    name: 'Illustration',
    lastIndex: 38,
  },
  'photo': {
    id: 'photo',
    name: 'Photos',
    lastIndex: 10,
  },
};

const DEFAULT_MENU = 'imprime';

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
}

const loadCreationImages = async (id) => {
  const imageGridElt = document.querySelector('.image-grid');

  imageGridElt.innerHTML = '';

  const creationInfo = CREATION_MENU[id];

  let grid = [[]];

  for(let rowIndex = 0; rowIndex < (creationInfo.lastIndex + 1) / 3; rowIndex++) {
    grid[rowIndex] = [0, 0, 0]; // 3 columns   
  }

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

    const imageSize = await getImageSize(img.src);

    const r = imageSize.width / imageSize.height;

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

        placed = true;
        grid[rowIndex][colIndex] = i + 1;

        if (r >= LANDSCAPE_THRESHOLD) {
          console.log(`${id}_${i}.jpg landscape`);
          if (colIndex + 1 >= grid[rowIndex].length) {
            console.log(`${id}_${i}.jpg skipped because outside of row`);
            continue;
          }
          if (grid[rowIndex][colIndex + 1] !== 0) {
            continue;
          }

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

          grid[rowIndex + 1][colIndex] = i + 1;

          imgContainer.style.gridRowStart = rowIndex + 1;
          imgContainer.style.gridRowEnd = `span 2`;
          imgContainer.style.gridColumnStart = colIndex + 1;
        }

        break;
      }
    }

    imgContainer.appendChild(img);

    imageGridElt.appendChild(imgContainer);
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