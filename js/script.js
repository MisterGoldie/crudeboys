{
  const body = document.body;

  // helper functions
  const MathUtils = {
    lerp: (a, b, n) => (1 - n) * a + n * b,
    distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  };

  // Mouse position relative to the promo section only.
  let trailRoot = null;
  let trailHovering = false;
  let mousePos = (lastMousePos = cacheMousePos = { x: 0, y: 0 });

  const getPosInTrail = (ev) => {
    if (!trailRoot) return { x: 0, y: 0 };
    const rect = trailRoot.getBoundingClientRect();
    const touch = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]);
    const clientX = touch ? touch.clientX : ev.clientX;
    const clientY = touch ? touch.clientY : ev.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const bindTrailPointer = () => {
    trailRoot = document.getElementById('promoSection');
    if (!trailRoot) return;
    trailRoot.addEventListener('mousemove', (ev) => {
      trailHovering = true;
      mousePos = getPosInTrail(ev);
    });
    trailRoot.addEventListener('mouseenter', (ev) => {
      trailHovering = true;
      mousePos = lastMousePos = getPosInTrail(ev);
    });
    trailRoot.addEventListener('mouseleave', () => {
      trailHovering = false;
    });
    trailRoot.addEventListener(
      'touchstart',
      (ev) => {
        trailHovering = true;
        mousePos = lastMousePos = getPosInTrail(ev);
      },
      { passive: true }
    );
    trailRoot.addEventListener(
      'touchmove',
      (ev) => {
        trailHovering = true;
        mousePos = getPosInTrail(ev);
      },
      { passive: true }
    );
  };

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
      this.DOM = { content: document.querySelector("#imageTrail") || document.querySelector(".content") };
      if (!this.DOM.content) return;
      this.images = [];
      [...this.DOM.content.querySelectorAll("img")].forEach((img) =>
        this.images.push(new Image(img))
      );
      this.imagesTotal = this.images.length;
      if (!this.imagesTotal) return;
      this.imgPosition = 0;
      this.zIndexVal = 1;
      this.threshold = 100;
      requestAnimationFrame(() => this.render());
    }
    render() {
      if (!trailHovering) {
        requestAnimationFrame(() => this.render());
        return;
      }
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

  // Mouse-trail images: desktop-only, WebP, clipped to #promoSection.
  const shouldEnableTrail = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    window.innerWidth >= 830;

  const startImageTrail = () => {
    if (!shouldEnableTrail()) return;
    bindTrailPointer();
    if (!trailRoot) return;

    const imgs = document.querySelectorAll('.content__img[data-src]');
    imgs.forEach((img) => {
      if (!img.getAttribute('src')) img.src = img.getAttribute('data-src');
    });

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      new ImageTrail();
    };

    if (typeof imagesLoaded === 'function') {
      imagesLoaded(imgs, start);
    }
    setTimeout(start, 1200);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startImageTrail);
  } else {
    startImageTrail();
  }

  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    const initialText = document.querySelector('.initial-text');
    const cardsGrid = document.querySelector('.cards-grid');
    const crunoGallery = document.getElementById('crunoGallery');
    const cupsGallery = document.getElementById('cupsGallery');
    let cardsData = null;
    let traitsData = {};
    let rarityRanks = {};
    let cardsById = {};
    let crunoById = {};
    let cupsById = {};
    let galleryToken = 0;

    const COLLECTION_META = {
        crudeboys: { label: 'Crudeboys', market: 'crudeboys' },
        cruno: { label: 'CrUNO', market: 'cruno' },
        cups: { label: 'Cups on Doge', market: 'cups' },
    };

    function formatDogeAmount(n) {
        const digits = n >= 100 ? 0 : 2;
        return Number(n).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: digits,
        });
    }

    function formatUsdAmount(n) {
        const digits = n >= 100 ? 0 : 2;
        return Number(n).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
    }

    function setupCollectionVolume() {
        const nodes = document.querySelectorAll('.collection-volume[data-collection]');
        if (!nodes.length) return;

        const applyStats = (data) => {
            nodes.forEach((el) => {
                const slug = el.getAttribute('data-collection');
                const stats = data.collections && data.collections[slug];
                if (!stats) return;
                const dogeEl = el.querySelector('.volume-doge');
                const usdEl = el.querySelector('.volume-usd');
                if (dogeEl) {
                    dogeEl.textContent = formatDogeAmount(stats.doge) + ' DOGE';
                }
                if (usdEl) {
                    usdEl.textContent = formatUsdAmount(stats.usd) + ' USD';
                }
                el.hidden = false;
            });
        };

        const loadStats = () =>
            fetch('/api/collection-stats', { cache: 'no-store' })
                .then((res) => {
                    if (!res.ok) throw new Error('stats failed');
                    return res.json();
                })
                .then(applyStats)
                .catch(() => {});

        loadStats();
        window.setInterval(() => {
            if (!document.hidden) loadStats();
        }, 60000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) loadStats();
        });
    }

    setupCollectionVolume();

    Promise.all([
        fetch('js/crudeboys_image.json').then(response => response.json()),
        fetch('js/crudeboys_traits.json').then(response => response.json()).catch(() => ({})),
        fetch('js/cruno.json').then(response => response.json()).catch(() => []),
        fetch('js/cups.json').then(response => response.json()).catch(() => [])
    ])
        .then(([cards, traits, cruno, cups]) => {
            cardsData = cards;
            traitsData = traits || {};
            rarityRanks = computeRarityRanks(traitsData);
            cardsById = indexByInscriptionId(cardsData);
            crunoById = indexByInscriptionId(cruno);
            cupsById = indexByInscriptionId(cups);
            setupSearch();
            setupOwnedGallery();
            setupPokerHand();
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

    function normalizeInscriptionId(id) {
        return String(id || '').trim().toLowerCase();
    }

    function indexByInscriptionId(list) {
        const map = {};
        (list || []).forEach((item) => {
            if (!item || !item.id) return;
            const key = normalizeInscriptionId(item.id);
            map[key] = item;
            const base = key.replace(/i\d+$/i, '');
            if (base && !map[base]) map[base] = item;
        });
        return map;
    }

    function lookupByInscriptionId(map, id) {
        if (!id || !map) return null;
        const key = normalizeInscriptionId(id);
        return map[key] || map[key.replace(/i\d+$/i, '')] || null;
    }

    function findCollectible(id) {
        const crude = lookupByInscriptionId(cardsById, id);
        if (crude) {
            return {
                collection: 'crudeboys',
                card: crude,
                attributes: traitsData[crude.id] || traitsData[id] || null,
            };
        }
        const cruno = lookupByInscriptionId(crunoById, id);
        if (cruno) {
            return { collection: 'cruno', card: cruno, attributes: cruno.attributes || null };
        }
        const cups = lookupByInscriptionId(cupsById, id);
        if (cups) {
            return { collection: 'cups', card: cups, attributes: cups.attributes || null };
        }
        return null;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function cardNumberFromName(name) {
        const match = String(name).match(/#(\d+)/);
        return match ? match[1] : null;
    }

    function localCardImage(card) {
        const num = cardNumberFromName(card && card.meta && card.meta.name);
        return num ? `images/crudeboycards/${num}.webp` : null;
    }

    function imageCandidates(card) {
        const local = localCardImage(card);
        return local ? [local] : [];
    }

    function loadImageCandidate(src, timeoutMs) {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            let settled = false;
            const finish = (ok) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                img.onload = null;
                img.onerror = null;
                if (ok) resolve(src);
                else reject(new Error('image load failed'));
            };
            const timer = setTimeout(() => finish(false), timeoutMs);
            img.onload = () => finish(true);
            img.onerror = () => finish(false);
            img.src = src;
        });
    }

    async function resolveCardImage(card, fallbackUrl) {
        const candidates = [...imageCandidates(card)];
        if (
            fallbackUrl &&
            !/^https?:/i.test(fallbackUrl) &&
            !/dweb\.link/i.test(fallbackUrl) &&
            !/ipfs/i.test(fallbackUrl)
        ) {
            candidates.push(fallbackUrl);
        }
        const unique = [...new Set(candidates.filter(Boolean))];

        for (const src of unique) {
            try {
                await loadImageCandidate(src, 8000);
                return src;
            } catch (e) {
                /* try next */
            }
        }
        throw new Error('card image failed to load');
    }

    async function resolveCollectibleImage(entry, fallbackUrl) {
        if (entry.collection === 'crudeboys') {
            return resolveCardImage(entry.card, fallbackUrl);
        }
        const id = entry.card && entry.card.id;
        const candidates = [];
        if (
            fallbackUrl &&
            !/dweb\.link/i.test(fallbackUrl) &&
            !/ipfs/i.test(fallbackUrl)
        ) {
            candidates.push(fallbackUrl);
        }
        if (id) {
            candidates.push(
                `https://cdn.doggy.market/content/${id}`,
                `https://api.doggy.market/inscriptions/${id}/content`
            );
        }
        const unique = [...new Set(candidates.filter(Boolean))];
        for (const src of unique) {
            try {
                await loadImageCandidate(src, 8000);
                return src;
            } catch (e) {
                /* try next */
            }
        }
        throw new Error('collectible image failed to load');
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

    function pokerIdentity(card) {
        const attrs = traitsData[card.id] || {};
        const suitRaw = String(attrs['Card type'] || '').trim().toLowerCase();
        let suit = '';
        if (suitRaw.startsWith('heart')) suit = 'H';
        else if (suitRaw.startsWith('diamond')) suit = 'D';
        else if (suitRaw.startsWith('club')) suit = 'C';
        else if (suitRaw.startsWith('spade')) suit = 'S';
        else if (suitRaw.startsWith('joker')) suit = 'J';

        const rankSources = [
            attrs['Red numbered cards'],
            attrs['Black numbered cards'],
            attrs['Red Face cards'],
            attrs['Black face cards'],
            attrs['Joker cards'],
        ];

        let rank = 0;
        let wild = suit === 'J';
        for (let i = 0; i < rankSources.length; i++) {
            const val = rankSources[i];
            if (!val) continue;
            const text = String(val).toLowerCase();
            if (text.indexOf('joker') !== -1) {
                wild = true;
                rank = 0;
                break;
            }
            if (text.indexOf('ace') !== -1) { rank = 14; break; }
            if (text.indexOf('king') !== -1) { rank = 13; break; }
            if (text.indexOf('queen') !== -1) { rank = 12; break; }
            if (text.indexOf('jack') !== -1) { rank = 11; break; }
            const num = text.match(/(\d+)/);
            if (num) {
                rank = parseInt(num[1], 10);
                break;
            }
        }

        return { card, rank, suit, wild };
    }

    function rankWord(rank, plural) {
        const one = {
            14: 'ace', 13: 'king', 12: 'queen', 11: 'jack', 10: 'ten',
            9: 'nine', 8: 'eight', 7: 'seven', 6: 'six', 5: 'five',
            4: 'four', 3: 'three', 2: 'two'
        };
        const many = {
            14: 'aces', 13: 'kings', 12: 'queens', 11: 'jacks', 10: 'tens',
            9: 'nines', 8: 'eights', 7: 'sevens', 6: 'sixes', 5: 'fives',
            4: 'fours', 3: 'threes', 2: 'twos'
        };
        return (plural ? many : one)[rank] || String(rank);
    }

    function isStraight(sortedDesc) {
        const unique = [];
        sortedDesc.forEach((rank) => {
            if (unique.indexOf(rank) === -1) unique.push(rank);
        });
        if (unique.length !== 5) return false;
        if (unique[0] === 14 && unique[1] === 5 && unique[2] === 4 && unique[3] === 3 && unique[4] === 2) {
            return true;
        }
        return unique[0] - unique[4] === 4;
    }

    function scoreFive(ranks, suits) {
        const sorted = ranks.slice().sort((a, b) => b - a);
        const flush = Boolean(suits[0]) && suits.every((suit) => suit === suits[0]);
        const straight = isStraight(sorted);
        const wheel = straight && sorted[0] === 14 && sorted[1] === 5;
        const straightHigh = wheel ? 5 : sorted[0];
        const counts = {};
        sorted.forEach((rank) => {
            counts[rank] = (counts[rank] || 0) + 1;
        });
        const groups = Object.keys(counts)
            .map((rank) => ({ rank: parseInt(rank, 10), count: counts[rank] }))
            .sort((a, b) => b.count - a.count || b.rank - a.rank);
        const pattern = groups.map((group) => group.count).join('');
        const kick = groups.map((group) => group.rank);

        if (pattern === '5') return { score: 900, kickers: kick, name: 'five of a kind' };
        if (flush && straight) {
            const royal = straightHigh === 14;
            return {
                score: 800,
                kickers: [straightHigh],
                name: royal ? 'royal flush' : 'straight flush'
            };
        }
        if (pattern === '41') return { score: 700, kickers: kick, name: 'four of a kind' };
        if (pattern === '32') return { score: 600, kickers: kick, name: 'full house' };
        if (flush) return { score: 500, kickers: sorted, name: 'flush' };
        if (straight) return { score: 400, kickers: [straightHigh], name: 'straight' };
        if (pattern === '311') return { score: 300, kickers: kick, name: 'three of a kind' };
        if (pattern === '221') return { score: 200, kickers: kick, name: 'two pair' };
        if (pattern === '2111') {
            return { score: 100, kickers: kick, name: 'pair of ' + rankWord(groups[0].rank, true) };
        }
        return { score: 0, kickers: sorted, name: rankWord(sorted[0], false) + ' high' };
    }

    function handBeats(a, b) {
        if (a.score !== b.score) return a.score > b.score;
        const len = Math.max(a.kickers.length, b.kickers.length);
        for (let i = 0; i < len; i++) {
            const av = a.kickers[i] || 0;
            const bv = b.kickers[i] || 0;
            if (av !== bv) return av > bv;
        }
        return false;
    }

    function evaluatePokerHand(idents) {
        const wilds = idents.filter((item) => item.wild);
        const naturals = idents.filter((item) => !item.wild);
        let best = { score: -1, kickers: [], name: 'high card' };
        const rankOpts = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
        const suitOpts = ['H', 'D', 'C', 'S'];

        function consider(ranks, suits) {
            const result = scoreFive(ranks, suits);
            if (best.score < 0 || handBeats(result, best)) best = result;
        }

        function assign(index, wildRanks, wildSuits) {
            if (index === wilds.length) {
                consider(
                    naturals.map((item) => item.rank).concat(wildRanks),
                    naturals.map((item) => item.suit).concat(wildSuits)
                );
                return;
            }
            for (let r = 0; r < rankOpts.length; r++) {
                for (let s = 0; s < suitOpts.length; s++) {
                    wildRanks.push(rankOpts[r]);
                    wildSuits.push(suitOpts[s]);
                    assign(index + 1, wildRanks, wildSuits);
                    wildRanks.pop();
                    wildSuits.pop();
                }
            }
        }

        assign(0, [], []);
        return best;
    }

    function setupPokerHand() {
        const youEl = document.querySelector('.poker-hand-you');
        const cpuEl = document.querySelector('.poker-hand-cpu');
        const youNameEl = document.querySelector('.poker-you-name');
        const cpuNameEl = document.querySelector('.poker-cpu-name');
        const resultEl = document.querySelector('.poker-result');
        const scoreEl = document.querySelector('.poker-score');
        const dealBtn = document.querySelector('.poker-deal');
        if (!youEl || !cpuEl || !resultEl || !dealBtn || !cardsData) return;

        const deck = cardsData
            .map(pokerIdentity)
            .filter((item) => item.wild || (item.rank >= 2 && item.suit));

        let youWins = 0;
        let cpuWins = 0;
        let busy = false;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const fadeMs = reduceMotion ? 0 : 320;
        const cardInMs = reduceMotion ? 0 : 380;
        const staggerMs = reduceMotion ? 0 : 70;

        function wait(ms) {
            return new Promise((resolve) => window.setTimeout(resolve, ms));
        }

        function nextPaint() {
            return new Promise((resolve) => {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(resolve);
                });
            });
        }

        function revealCard(el) {
            el.style.willChange = 'opacity, transform';
            el.classList.add('is-in');
            el.addEventListener('transitionend', () => {
                el.style.willChange = 'auto';
            }, { once: true });
        }

        function renderScore() {
            if (!scoreEl) return;
            scoreEl.style.opacity = '0';
            window.setTimeout(() => {
                scoreEl.textContent = 'you ' + youWins + ' — ' + cpuWins + ' cpu';
                scoreEl.style.opacity = '1';
            }, fadeMs || 16);
        }

        function fadeText(el, text) {
            if (!el) return Promise.resolve();
            el.style.opacity = '0';
            return wait(fadeMs).then(() => {
                el.textContent = text || '';
                el.style.opacity = text ? '1' : '0';
            });
        }

        function fadeOutHand(el) {
            const cards = Array.prototype.slice.call(el.querySelectorAll('.poker-card'));
            if (!cards.length) {
                el.innerHTML = '';
                return Promise.resolve();
            }
            if (reduceMotion) {
                el.innerHTML = '';
                return Promise.resolve();
            }
            cards.forEach((card) => {
                card.classList.add('is-out');
            });
            return wait(fadeMs + 40).then(() => {
                el.innerHTML = '';
            });
        }

        function preloadSrc(src) {
            return new Promise((resolve) => {
                if (!src) {
                    resolve(src);
                    return;
                }
                const img = new window.Image();
                img.onload = () => resolve(src);
                img.onerror = () => resolve(src);
                img.src = src;
            });
        }

        function shuffleTen() {
            const copy = deck.slice();
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = copy[i];
                copy[i] = copy[j];
                copy[j] = tmp;
            }
            return { you: copy.slice(0, 5), cpu: copy.slice(5, 10) };
        }

        function renderHand(el, hand) {
            el.innerHTML = '';
            const srcs = hand.map((item) => localCardImage(item.card));
            return Promise.all(srcs.map(preloadSrc)).then(() => {
                const buttons = hand.map((item, index) => {
                    const imageSrc = srcs[index];
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'poker-card';
                    btn.innerHTML = `
                        <img src="${imageSrc}" alt="${item.card.meta.name}" decoding="async">
                        <span>${item.card.meta.name}</span>
                    `;
                    btn.addEventListener('click', () => {
                        showCardDetails(item.card.id, item.card.meta.name, imageSrc);
                    });
                    el.appendChild(btn);
                    return btn;
                });

                return nextPaint().then(() => {
                    buttons.forEach((btn, index) => {
                        if (reduceMotion) {
                            btn.classList.add('is-in');
                            return;
                        }
                        window.setTimeout(() => revealCard(btn), index * staggerMs);
                    });
                    return wait(cardInMs + Math.max(0, buttons.length - 1) * staggerMs);
                });
            });
        }

        function deal() {
            if (busy) return;
            busy = true;
            dealBtn.disabled = true;

            const round = shuffleTen();
            const youHand = evaluatePokerHand(round.you);
            const cpuHand = evaluatePokerHand(round.cpu);

            Promise.all([
                fadeOutHand(youEl),
                fadeOutHand(cpuEl),
                fadeText(youNameEl, ''),
                fadeText(cpuNameEl, ''),
                fadeText(resultEl, 'drawing...'),
            ])
                .then(() => renderHand(youEl, round.you))
                .then(() => fadeText(youNameEl, youHand.name))
                .then(() => renderHand(cpuEl, round.cpu))
                .then(() => fadeText(cpuNameEl, cpuHand.name))
                .then(() => {
                    let outcome = 'split pot';
                    if (handBeats(youHand, cpuHand)) {
                        youWins += 1;
                        outcome = 'you win';
                    } else if (handBeats(cpuHand, youHand)) {
                        cpuWins += 1;
                        outcome = 'cpu wins';
                    }
                    return fadeText(resultEl, outcome);
                })
                .then(() => {
                    renderScore();
                    busy = false;
                    dealBtn.disabled = false;
                })
                .catch(() => {
                    busy = false;
                    dealBtn.disabled = false;
                });
        }

        dealBtn.addEventListener('click', deal);
        if (scoreEl) scoreEl.textContent = 'you 0 — 0 cpu';
    }

    function setupOwnedGallery() {
        if (!cardsGrid && !crunoGallery && !cupsGallery) return;

        const collectibleNumber = (entry) => {
            if (entry.collection === 'cups') {
                return parseInt((entry.attributes && entry.attributes['Cup Number']) || '0', 10) || 0;
            }
            return parseInt(cardNumberFromName(entry.card.meta.name) || '0', 10);
        };

        const collectibleDisplayName = (entry) => {
            const raw = (entry.card && entry.card.meta && entry.card.meta.name) || '';
            if (entry.collection === 'cups') {
                return raw.replace(/\s*#\d+\s*$/, '').trim() || raw;
            }
            return raw;
        };

        const clearHost = (host) => {
            if (!host) return;
            host.innerHTML = '';
            host.hidden = true;
        };

        const setHostStatus = (host, text) => {
            if (!host) return;
            if (!text) {
                clearHost(host);
                return;
            }
            host.hidden = false;
            host.innerHTML = `<div class="gallery-status">${escapeHtml(text)}</div>`;
        };

        const mountCards = (host, items) => {
            if (!host || !items.length) return [];
            host.hidden = false;
            const grid = document.createElement('div');
            grid.className = 'gallery-grid';
            host.appendChild(grid);
            return items.map((item) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'gallery-card gallery-card-' + item.collection;
                button.innerHTML = `
                    <div class="gallery-card-loading">...</div>
                    <span class="gallery-card-name">${escapeHtml(collectibleDisplayName(item))}</span>
                `;
                grid.appendChild(button);
                return { button, item };
            });
        };

        const renderDisconnected = () => {
            setHostStatus(cardsGrid, 'Connect wallet to view your crudes');
            clearHost(crunoGallery);
            clearHost(cupsGallery);
        };

        const renderOwnedCards = async (ownedDoginals, token) => {
            const owned = ownedDoginals
                .map((entry) => {
                    const found = findCollectible(entry.id);
                    if (!found) return null;
                    return {
                        ...found,
                        fallbackUrl: entry.imageUrl || null,
                    };
                })
                .filter(Boolean);

            const byCollection = {
                crudeboys: [],
                cruno: [],
                cups: [],
            };
            owned.forEach((item) => {
                if (byCollection[item.collection]) byCollection[item.collection].push(item);
            });
            Object.keys(byCollection).forEach((id) => {
                byCollection[id].sort((a, b) => collectibleNumber(a) - collectibleNumber(b));
            });

            if (cardsGrid) {
                if (!byCollection.crudeboys.length) {
                    setHostStatus(cardsGrid, 'No Crudeboys in this wallet');
                } else {
                    setHostStatus(cardsGrid, 'Your Crudes (' + byCollection.crudeboys.length + ')');
                }
            }

            if (byCollection.cruno.length) {
                setHostStatus(crunoGallery, 'Your CrUNOS (' + byCollection.cruno.length + ')');
            } else {
                clearHost(crunoGallery);
            }

            if (byCollection.cups.length) {
                setHostStatus(cupsGallery, 'Your Cups (' + byCollection.cups.length + ')');
            } else {
                clearHost(cupsGallery);
            }

            const jobs = [
                ...mountCards(cardsGrid, byCollection.crudeboys),
                ...mountCards(crunoGallery, byCollection.cruno),
                ...mountCards(cupsGallery, byCollection.cups),
            ];

            const CONCURRENCY = 8;
            let cursor = 0;

            const loadOne = async ({ button, item }) => {
                if (token !== galleryToken) return;
                const name = collectibleDisplayName(item);
                try {
                    const imageSrc = await resolveCollectibleImage(item, item.fallbackUrl);
                    if (token !== galleryToken) return;
                    button.innerHTML = `
                        <img src="${imageSrc}" alt="${escapeHtml(name)}">
                        <span class="gallery-card-name">${escapeHtml(name)}</span>
                    `;
                    button.onclick = () => showCardDetails(item.card.id, name, imageSrc);
                } catch (e) {
                    if (token !== galleryToken) return;
                    button.innerHTML = `
                        <div class="gallery-card-loading">?</div>
                        <span class="gallery-card-name">${escapeHtml(name)}</span>
                    `;
                    button.onclick = () =>
                        showCardDetails(item.card.id, name, item.card.meta.image || '');
                }
            };

            const workers = Array.from({ length: Math.min(CONCURRENCY, jobs.length) || 0 }, async () => {
                while (cursor < jobs.length) {
                    if (token !== galleryToken) return;
                    const index = cursor++;
                    await loadOne(jobs[index]);
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

            setHostStatus(cardsGrid, 'Loading your crudes...');
            clearHost(crunoGallery);
            clearHost(cupsGallery);

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
                setHostStatus(cardsGrid, err.message || 'Could not load wallet doginals.');
                clearHost(crunoGallery);
                clearHost(cupsGallery);
            }
        };

        window.addEventListener('crudeboys:wallet', () => {
            refreshGallery();
        });

        refreshGallery();
    }

    window.showCardDetails = function(id, name, image) {
        const doggyMarketUrl = `https://doggy.market/inscription/${id}`;
        const collectible = findCollectible(id);
        const collectionInfo = collectible ? COLLECTION_META[collectible.collection] : null;
        const rankInfo = collectible && collectible.collection === 'crudeboys'
            ? rarityRanks[id] || rarityRanks[collectible.card.id]
            : null;
        const rankHtml = rankInfo
            ? `<p class="modal-rarity-rank">Rarity Rank #${rankInfo.rank} / ${rankInfo.total}</p>`
            : '';
        const collectionHtml = collectionInfo
            ? `<p class="modal-collection">${collectionInfo.label}</p>`
            : '';

        const attributes = (collectible && collectible.attributes) || traitsData[id];
        let traitsHtml = '';
        if (attributes && Object.keys(attributes).length) {
            const rows = Object.entries(attributes)
                .filter(([, value]) => value != null && String(value).trim() !== '')
                .map(([trait, value]) => `
                    <div class="trait">
                        <span class="trait-type">${escapeHtml(trait)}</span>
                        <span class="trait-value">${escapeHtml(value)}</span>
                    </div>
                `).join('');
            traitsHtml = `<div class="card-traits">${rows}</div>`;
        }

        const safeName = escapeHtml(name);
        const modal = document.createElement('div');
        modal.className = 'card-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <img src="${image}" alt="${safeName}">
                <p class="card-name">${safeName}</p>
                ${collectionHtml}
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
                const aiMove = getCpuMove(gameState.board, 'X');
                makeMove(aiMove);
            }, 420);
        }
    }

    function setStatus(text) {
        statusDisplay.style.opacity = '0';
        window.setTimeout(() => {
            statusDisplay.textContent = text;
            statusDisplay.style.opacity = '1';
        }, 180);
    }

    function revealMark(el) {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                el.classList.add('is-in');
            });
        });
    }

    function makeMove(index) {
        gameState.board[index] = gameState.currentPlayer;
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.innerHTML = '';

        if (gameState.currentPlayer === 'O') {
            const img = document.createElement('img');
            img.src = 'images/o.png';
            img.alt = 'O';
            cell.appendChild(img);
            revealMark(img);
        } else {
            const mark = document.createElement('span');
            mark.className = 'xo-mark';
            mark.textContent = 'X';
            cell.appendChild(mark);
            revealMark(mark);
        }

        if (checkWin(gameState.board, gameState.currentPlayer)) {
            setStatus(gameState.currentPlayer === 'X' ? 'You lose!' : 'You win!');
            gameState.gameActive = false;
            return;
        }

        if (checkDraw()) {
            setStatus('Game ended in a draw!');
            gameState.gameActive = false;
            return;
        }

        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
        setStatus(gameState.currentPlayer === 'X' ? "CPU's turn" : 'Your turn');
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

    function emptyCells(board) {
        return board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
    }

    function findWinningMove(board, player) {
        for (let i = 0; i < 9; i++) {
            if (board[i] !== '') continue;
            board[i] = player;
            const wins = checkWin(board, player);
            board[i] = '';
            if (wins) return i;
        }
        return null;
    }

    function randomMove(board) {
        const open = emptyCells(board);
        return open[Math.floor(Math.random() * open.length)];
    }

    function getCpuMove(board, player) {
        const opponent = player === 'X' ? 'O' : 'X';

        if (emptyCells(board).length === 9) {
            return randomMove(board);
        }

        const winMove = findWinningMove(board, player);
        if (winMove !== null && Math.random() < 0.7) return winMove;

        const blockMove = findWinningMove(board, opponent);
        if (blockMove !== null && Math.random() < 0.35) return blockMove;

        return randomMove(board);
    }

    function restartGame() {
        if (restartButton.disabled) return;
        restartButton.disabled = true;
        cells.forEach((cell) => cell.classList.add('is-clearing'));
        statusDisplay.style.opacity = '0';

        window.setTimeout(() => {
            gameState.board = Array(9).fill('');
            gameState.currentPlayer = 'X';
            gameState.gameActive = true;
            cells.forEach((cell) => {
                cell.classList.remove('is-clearing');
                cell.innerHTML = '';
            });
            statusDisplay.textContent = "CPU's turn";
            statusDisplay.style.opacity = '1';
            restartButton.disabled = false;

            window.setTimeout(() => {
                const aiMove = getCpuMove(gameState.board, 'X');
                makeMove(aiMove);
            }, 280);
        }, 220);
    }

    // Add event listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartButton.addEventListener('click', restartGame);

    // Start the game with CPU's move
    setTimeout(() => {
        const aiMove = getCpuMove(gameState.board, 'X');
        makeMove(aiMove);
    }, 500);
  }

  // Initialize the game when the DOM is loaded
  document.addEventListener('DOMContentLoaded', initGame);
}