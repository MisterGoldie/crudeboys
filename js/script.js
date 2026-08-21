{
  const body = document.body;

  // helper functions
  const MathUtils = {
    lerp: (a, b, n) => (1 - n) * a + n * b,
    distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  };

  // get the mouse positions
  const getMousePos = (ev) => {
    let posx = 0;
    let posy = 0;
    if (!ev) ev = window.event;
    if (ev.pageX || ev.pageY) {
      posx = ev.pageX;
      posy = ev.pageY;
    } else if (ev.clientX || ev.clientY) {
      posx = ev.clientX + body.scrollLeft + docEl.scrollLeft;
      posy = ev.clientY + body.scrollTop + docEl.scrollTop;
    }
    return { x: posx, y: posy };
  };

  let mousePos = (lastMousePos = cacheMousePos = { x: 0, y: 0 });

  // update the mouse position
  window.addEventListener("mousemove", (ev) => (mousePos = getMousePos(ev)));

  // update the position on touch (mobile/tablet support)
  const getTouchPos = (ev) => {
    const touch = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]);
    if (!touch) return mousePos;
    return { x: touch.pageX, y: touch.pageY };
  };
  window.addEventListener(
    "touchstart",
    (ev) => (mousePos = lastMousePos = getTouchPos(ev)),
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (ev) => (mousePos = getTouchPos(ev)),
    { passive: true }
  );

  const getMouseDistance = () =>
    MathUtils.distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

  class Image {
    constructor(el) {
      this.DOM = { el: el };
      this.defaultStyle = {
        scale: 1,
        x: 0,
        y: 0,
        opacity: 0,
      };
      this.getRect();
    }

    getRect() {
      this.rect = this.DOM.el.getBoundingClientRect();
    }
    isActive() {
      return TweenMax.isTweening(this.DOM.el) || this.DOM.el.style.opacity != 0;
    }
  }

  class ImageTrail {
    constructor() {
      this.DOM = { content: document.querySelector(".content") };
      this.images = [];
      [...this.DOM.content.querySelectorAll("img")].forEach((img) =>
        this.images.push(new Image(img))
      );
      this.imagesTotal = this.images.length;
      this.imgPosition = 0;
      this.zIndexVal = 1;
      this.threshold = 100;
      requestAnimationFrame(() => this.render());
    }
    render() {
      let distance = getMouseDistance();
      cacheMousePos.x = MathUtils.lerp(
        cacheMousePos.x || mousePos.x,
        mousePos.x,
        0.1
      );
      cacheMousePos.y = MathUtils.lerp(
        cacheMousePos.y || mousePos.y,
        mousePos.y,
        0.1
      );

      if (distance > this.threshold) {
        this.showNextImage();

        ++this.zIndexVal;
        this.imgPosition =
          this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;

        lastMousePos = mousePos;
      }

      let isIdle = true;
      for (let img of this.images) {
        if (img.isActive()) {
          isIdle = false;
          break;
        }
      }
      if (isIdle && this.zIndexVal !== 1) {
        this.zIndexVal = 1;
      }

      requestAnimationFrame(() => this.render());
    }
    showNextImage() {
      const img = this.images[this.imgPosition];
      TweenMax.killTweensOf(img.DOM.el);

      new TimelineMax()
        .set(
          img.DOM.el,
          {
            startAt: { opacity: 0, scale: 1 },
            opacity: 1,
            scale: 1,
            zIndex: this.zIndexVal,
            x: cacheMousePos.x - img.rect.width / 2,
            y: cacheMousePos.y - img.rect.height / 2,
          },
          0
        )
        .to(
          img.DOM.el,
          0.9,
          {
            ease: Expo.easeOut,
            x: mousePos.x - img.rect.width / 2,
            y: mousePos.y - img.rect.height / 2,
          },
          0
        )
        .to(
          img.DOM.el,
          1,
          {
            ease: Power1.easeOut,
            opacity: 0,
          },
          0.4
        )
        .to(
          img.DOM.el,
          1,
          {
            ease: Quint.easeOut,
            scale: 0.2,
          },
          0.4
        );
    }
  }

  // preload images
  const preloadImages = () => {
    return new Promise((resolve, reject) => {
      imagesLoaded(document.querySelectorAll(".content__img"), resolve);
    });
  };

  preloadImages().then(() => {
    new ImageTrail();
  });

  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    const initialText = document.querySelector('.initial-text');
    const cardsGrid = document.querySelector('.cards-grid');
    let cardsData = null;
    let traitsData = {};
    let rarityRanks = {};
    let cardsById = {};
    let galleryToken = 0;

    Promise.all([
        fetch('js/crudeboys_image.json').then(response => response.json()),
        fetch('js/crudeboys_traits.json').then(response => response.json()).catch(() => ({}))
    ])
        .then(([cards, traits]) => {
            cardsData = cards;
            traitsData = traits || {};
            rarityRanks = computeRarityRanks(traitsData);
            cardsById = {};
            cardsData.forEach((card) => {
              const key = normalizeInscriptionId(card.id);
              cardsById[key] = card;
              const base = key.replace(/i\d+$/i, '');
              if (base && !cardsById[base]) cardsById[base] = card;
            });
            setupSearch();
            setupOwnedGallery();
        })
        .catch(error => console.error('Error loading cards:', error));

    // Trait-rarity scoring: each trait value contributes (total / count),
    // so rarer values score higher. Cards are then ranked with 1 = rarest.
    function computeRarityRanks(traits) {
        const ids = Object.keys(traits);
        const total = ids.length;
        if (!total) return {};

        const freq = {};
        ids.forEach(id => {
            const attrs = traits[id] || {};
            Object.entries(attrs).forEach(([trait, value]) => {
                const val = String(value).trim();
                if (!freq[trait]) freq[trait] = {};
                freq[trait][val] = (freq[trait][val] || 0) + 1;
            });
        });

        const scored = ids.map(id => {
            const attrs = traits[id] || {};
            let score = 0;
            Object.entries(attrs).forEach(([trait, value]) => {
                const val = String(value).trim();
                const count = (freq[trait] && freq[trait][val]) || 1;
                score += total / count;
            });
            return { id, score };
        });

        scored.sort((a, b) => b.score - a.score);

        const ranks = {};
        scored.forEach((entry, index) => {
            ranks[entry.id] = { rank: index + 1, score: entry.score, total };
        });
        return ranks;
    }

    // Prefer same-origin sources first so mobile / cloudflared tunnels are not
    // blocked by IPFS gateway Cross-Origin-Resource-Policy. External gateways
    // are fallbacks (and for Arweave, where /ipfs-proxy does not exist).
    const IPFS_CID = 'bafybeidm3sremjulcdqefulerybnjqtzcf2o3vvyu5ayg35lbthmhxs5hi';

    function normalizeInscriptionId(id) {
        return String(id || '').trim().toLowerCase();
    }

    function cardNumberFromName(name) {
        const match = String(name).match(/#(\d+)/);
        return match ? match[1] : null;
    }

    function localCardPath(name) {
        const num = cardNumberFromName(name);
        return num ? `images/crudeboycards/${num}.png` : null;
    }

    function imageCandidates(card) {
        const num = cardNumberFromName(card.meta.name);
        const remote = card.meta.image;
        const list = [];

        // Local files when present (localhost / tunnel with crudeboycards/).
        const local = localCardPath(card.meta.name);
        if (local) list.push(local);

        // Browser-friendly gateways first (works on Vercel without serverless proxy).
        if (num) {
            list.push(
                `https://w3s.link/ipfs/${IPFS_CID}/${num}.png`,
                `https://nftstorage.link/ipfs/${IPFS_CID}/${num}.png`
            );
        }

        // Same-origin proxy as backup (local-server.js / Vercel API).
        if (num) list.push(`ipfs-proxy/${num}.png`);

        if (remote) list.push(remote);

        if (num) {
            list.push(
                `https://ipfs.io/ipfs/${IPFS_CID}/${num}.png`,
                `https://${IPFS_CID}.ipfs.dweb.link/${num}.png`
            );
        }

        return [...new Set(list)];
    }

    function resolveCardImage(card, fallbackUrl) {
        return new Promise((resolve, reject) => {
            const candidates = [...imageCandidates(card)];
            // Wallet preview/thumbnail only as last resort after full art fails.
            if (fallbackUrl) candidates.push(fallbackUrl);
            const unique = [...new Set(candidates.filter(Boolean))];
            let i = 0;

            const tryNext = () => {
                if (i >= unique.length) {
                    reject(new Error('card image failed to load'));
                    return;
                }
                const src = unique[i++];
                const img = new window.Image();
                img.onload = () => resolve(src);
                img.onerror = tryNext;
                img.src = src;
            };

            tryNext();
        });
    }

    function findCardByInscriptionId(id) {
        if (!id) return null;
        const key = normalizeInscriptionId(id);
        return (
            cardsById[key] ||
            cardsById[key.replace(/i\d+$/i, '')] ||
            null
        );
    }

    function findCard(searchTerm) {
        if (!cardsData || !searchTerm) return null;
        const term = searchTerm.trim();
        const lower = term.toLowerCase();

        // Exact number lookup: "12", "#12", "Crudeboy #12"
        const numMatch = term.match(/^(?:crudeboy\s*)?#?(\d+)$/i);
        if (numMatch) {
            const n = String(parseInt(numMatch[1], 10));
            return (
                cardsData.find((card) => cardNumberFromName(card.meta.name) === n) || null
            );
        }

        const exact = cardsData.find((card) => card.meta.name.toLowerCase() === lower);
        if (exact) return exact;

        return (
            cardsData.find((card) => card.meta.name.toLowerCase().includes(lower)) || null
        );
    }

    function setupSearch() {
        let searchToken = 0;

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            const token = ++searchToken;

            // Hide initial text when user starts typing
            if (initialText) {
                initialText.style.display = 'none';
            }
            
            if (!searchTerm || !cardsData) {
                searchResults.innerHTML = '<div class="initial-text">View your crudes</div>';
                return;
            }

            const card = findCard(searchTerm);

            if (!card) {
                searchResults.innerHTML = '<div class="info-text">no crude found</div>';
                return;
            }

            // Show a loading indicator while the card image downloads
            searchResults.innerHTML = `
                <div class="card-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">loading...</div>
                </div>
            `;

            resolveCardImage(card)
                .then((imageSrc) => {
                    if (token !== searchToken) return;
                    const rankInfo = rarityRanks[card.id];
                    const rankHtml = rankInfo
                        ? `<div class="rarity-rank">Rarity Rank #${rankInfo.rank} / ${rankInfo.total}</div>`
                        : '';
                    searchResults.innerHTML = `
                        <img src="${imageSrc}" alt="${card.meta.name}" onclick="showCardDetails('${card.id}', '${card.meta.name}', '${imageSrc}')">
                        ${rankHtml}
                        <div class="info-text">click card for details</div>
                    `;
                })
                .catch(() => {
                    if (token !== searchToken) return;
                    searchResults.innerHTML = '<div class="info-text">card image failed to load</div>';
                });
        });
    }

    function setupOwnedGallery() {
        if (!cardsGrid) return;

        const renderDisconnected = () => {
            cardsGrid.innerHTML = `
                <div class="gallery-status">Connect wallet to view your crudes</div>
            `;
        };

        const renderOwnedCards = async (ownedDoginals, token) => {
            const owned = ownedDoginals
                .map((entry) => {
                    const card = findCardByInscriptionId(entry.id);
                    if (!card) return null;
                    return { card, fallbackUrl: entry.imageUrl || null };
                })
                .filter(Boolean)
                .sort((a, b) => {
                    const an = parseInt(cardNumberFromName(a.card.meta.name) || '0', 10);
                    const bn = parseInt(cardNumberFromName(b.card.meta.name) || '0', 10);
                    return an - bn;
                });

            if (!owned.length) {
                cardsGrid.innerHTML = `
                    <div class="gallery-status">No Crudeboys in this wallet</div>
                `;
                return;
            }

            cardsGrid.innerHTML = `
                <div class="gallery-status">Your Crudes (${owned.length})</div>
                <div class="gallery-grid"></div>
            `;
            const grid = cardsGrid.querySelector('.gallery-grid');

            // Load a few at a time so IPFS/proxy is not flooded (mobile + tunnel).
            const CONCURRENCY = 2;
            let cursor = 0;

            const loadOne = async ({ card, fallbackUrl }) => {
                if (token !== galleryToken) return;
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'gallery-card';
                item.innerHTML = `
                    <div class="gallery-card-loading">...</div>
                    <span class="gallery-card-name">${card.meta.name}</span>
                `;
                grid.appendChild(item);

                try {
                    const imageSrc = await resolveCardImage(card, fallbackUrl);
                    if (token !== galleryToken) return;
                    item.innerHTML = `
                        <img src="${imageSrc}" alt="${card.meta.name}">
                        <span class="gallery-card-name">${card.meta.name}</span>
                    `;
                    item.onclick = () => showCardDetails(card.id, card.meta.name, imageSrc);
                } catch (e) {
                    if (token !== galleryToken) return;
                    item.innerHTML = `
                        <div class="gallery-card-loading">?</div>
                        <span class="gallery-card-name">${card.meta.name}</span>
                    `;
                    item.onclick = () =>
                        showCardDetails(card.id, card.meta.name, card.meta.image);
                }
            };

            const workers = Array.from({ length: Math.min(CONCURRENCY, owned.length) }, async () => {
                while (cursor < owned.length) {
                    if (token !== galleryToken) return;
                    const index = cursor++;
                    await loadOne(owned[index]);
                }
            });
            await Promise.all(workers);
        };

        const refreshGallery = async () => {
            const token = ++galleryToken;
            const walletApi = window.CrudeboysWallet;
            const session = walletApi && walletApi.getSession ? walletApi.getSession() : null;

            if (!session || !session.address) {
                renderDisconnected();
                return;
            }

            cardsGrid.innerHTML = `
                <div class="gallery-status">Loading your crudes...</div>
            `;

            try {
                const ownedDoginals = walletApi.getOwnedDoginals
                    ? await walletApi.getOwnedDoginals()
                    : (await walletApi.getOwnedInscriptionIds()).map((id) => ({
                        id,
                        imageUrl: null,
                      }));
                if (token !== galleryToken) return;
                await renderOwnedCards(ownedDoginals, token);
            } catch (err) {
                if (token !== galleryToken) return;
                cardsGrid.innerHTML = `
                    <div class="gallery-status">${err.message || 'Could not load wallet doginals.'}</div>
                `;
            }
        };

        window.addEventListener('crudeboys:wallet', () => {
            refreshGallery();
        });

        // In case wallet restored before cards JSON finished loading.
        refreshGallery();
    }

    window.showCardDetails = function(id, name, image) {
        // Construct Doggy Market inscription URL (id is the inscription ID)
        const doggyMarketUrl = `https://doggy.market/inscription/${id}`;

        const rankInfo = rarityRanks[id];
        const rankHtml = rankInfo
            ? `<p class="modal-rarity-rank">Rarity Rank #${rankInfo.rank} / ${rankInfo.total}</p>`
            : '';

        const attributes = traitsData[id];
        let traitsHtml = '';
        if (attributes && Object.keys(attributes).length) {
            const rows = Object.entries(attributes)
                .filter(([, value]) => value != null && String(value).trim() !== '')
                .map(([trait, value]) => `
                    <div class="trait">
                        <span class="trait-type">${trait}</span>
                        <span class="trait-value">${value}</span>
                    </div>
                `).join('');
            traitsHtml = `<div class="card-traits">${rows}</div>`;
        }

        const modal = document.createElement('div');
        modal.className = 'card-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <img src="${image}" alt="${name}">
                <p class="card-name">${name}</p>
                ${rankHtml}
                ${traitsHtml}
                <div class="card-links">
                    <a href="${doggyMarketUrl}" target="_blank" class="doggy-market-link">View on Doggy Market</a>
                </div>
                <button class="close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const closeModal = () => {
            document.body.style.overflow = previousOverflow;
            modal.remove();
        };

        modal.querySelector('.close-modal').onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
    };
  });

  // Add game initialization
  function initGame() {
    const gameState = {
        board: Array(9).fill(''),
        currentPlayer: 'X',
        gameActive: true,
        isAIGame: true
    };

    const statusDisplay = document.querySelector('.game-status');
    const cells = document.querySelectorAll('.cell');
    const restartButton = document.querySelector('.restart-button');

    function handleCellClick(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const index = parseInt(cell.getAttribute('data-index'), 10);

        if (Number.isNaN(index) || gameState.board[index] !== '' || !gameState.gameActive || gameState.currentPlayer === 'X') return;

        makeMove(index);

        if (gameState.gameActive) {
            setTimeout(() => {
                const aiMove = getBestMove(gameState.board, 'X');
                makeMove(aiMove);
            }, 500);
        }
    }

    function makeMove(index) {
        gameState.board[index] = gameState.currentPlayer;
        const cell = document.querySelector(`[data-index="${index}"]`);
        
        if (gameState.currentPlayer === 'O') {
            const img = document.createElement('img');
            img.src = 'images/o.png';
            img.style.width = '80%';
            img.style.height = '80%';
            img.style.objectFit = 'contain';
            cell.textContent = '';
            cell.appendChild(img);
        } else {
            cell.textContent = gameState.currentPlayer;
        }

        if (checkWin(gameState.board, gameState.currentPlayer)) {
            statusDisplay.textContent = `${gameState.currentPlayer === 'X' ? 'You lose!' : 'You win!'}`;
            gameState.gameActive = false;
            return;
        }

        if (checkDraw()) {
            statusDisplay.textContent = "Game ended in a draw!";
            gameState.gameActive = false;
            return;
        }

        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
        statusDisplay.textContent = `${gameState.currentPlayer === 'X' ? 'CPU' : 'Your'} turn`;
    }

    function checkWin(board, player) {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return winConditions.some(condition => {
            return condition.every(index => board[index] === player);
        });
    }

    function checkDraw() {
        return gameState.board.every(cell => cell !== '');
    }

    function getBestMove(board, player) {
        const opponent = player === 'X' ? 'O' : 'X';

        // For the first move, make it random
        if (board.filter(cell => cell !== '').length === 0) {
            const availableCorners = [0, 2, 6, 8];
            const allFirstMoves = [...availableCorners, 1, 3, 4, 5, 7];
            return allFirstMoves[Math.floor(Math.random() * allFirstMoves.length)];
        }

        // Check for winning move
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = player;
                if (checkWin(board, player)) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }

        // Check for blocking opponent's winning move
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = opponent;
                if (checkWin(board, opponent)) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }

        // Take any available corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(corner => board[corner] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // Take center if available
        if (board[4] === '') return 4;

        // Take any available side
        const sides = [1, 3, 5, 7];
        const availableSides = sides.filter(side => board[side] === '');
        if (availableSides.length > 0) {
            return availableSides[Math.floor(Math.random() * availableSides.length)];
        }

        // Take any available space
        const availableMoves = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    function restartGame() {
        gameState.board = Array(9).fill('');
        gameState.currentPlayer = 'X';
        gameState.gameActive = true;
        cells.forEach(cell => {
            cell.textContent = '';
            const img = cell.querySelector('img');
            if (img) {
                cell.removeChild(img);
            }
        });
        statusDisplay.textContent = "CPU's turn";
        
        setTimeout(() => {
            const aiMove = getBestMove(gameState.board, 'X');
            makeMove(aiMove);
        }, 500);
    }

    // Add event listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartButton.addEventListener('click', restartGame);

    // Start the game with CPU's move
    setTimeout(() => {
        const aiMove = getBestMove(gameState.board, 'X');
        makeMove(aiMove);
    }, 500);
  }

  // Initialize the game when the DOM is loaded
  document.addEventListener('DOMContentLoaded', initGame);
}