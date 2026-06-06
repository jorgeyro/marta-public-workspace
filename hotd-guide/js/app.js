/* ========================================
   HOUSE OF THE DRAGON — GUIDE
   App Logic
   ======================================== */

(function() {
  'use strict';

  // --- State ---
  let data = null;
  let dragonsData = null;

  // --- DOM refs ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const blackList = $('#black-characters');
  const greenList = $('#green-characters');
  const dragonList = $('#dragon-list');
  const detailPanel = $('#detail-panel');
  const detailBody = $('#detail-body');
  const detailClose = $('#detail-close');
  const navLinks = $$('.nav-links a, [data-view]');

  const blacksDragonCount = $('#blacks-dragon-count');
  const greensDragonCount = $('#greens-dragon-count');
  const blacksDragonLabel = $('#blacks-dragon-label');
  const greensDragonLabel = $('#greens-dragon-label');

  // --- Load data ---
  async function loadData() {
    try {
      const resp = await fetch('data/characters.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      data = await resp.json();
      dragonsData = data.dragons || [];
      return true;
    } catch (err) {
      console.error('Failed to load character data:', err);
      return false;
    }
  }

  // --- Helpers ---
  function getDragon(id) {
    return dragonsData.find(d => d.id === id);
  }

  function getFactionDragonCount(faction) {
    return dragonsData.filter(d => d.faction === faction && d.alive).length;
  }

  function getFactionTotalDragons(faction) {
    return dragonsData.filter(d => d.faction === faction).length;
  }

  function getInitials(name) {
    // Handle special cases for better initials
    const special = {
      "Addam of Hull": "AH",
      "Rhaenys Targaryen": "RN",
      "Rhaena Targaryen": "RA",
      "Jacaerys Velaryon": "JV",
      "Lucerys Velaryon": "LV",
      "Aegon II Targaryen": "A2",
      "Alicent Hightower": "AH",
      "Rhaenyra Targaryen": "RY",
      "Daemon Targaryen": "DM",
      "Viserys I Targaryen": "V1",
      "Ulf White": "UW",
      "Otto Hightower": "OH",
    };
    if (special[name]) return special[name];

    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    // Take first letter of first and last meaningful parts
    const first = parts[0][0];
    const last = parts.find(p => !['ii', 'iii', 'iv', 'of', 'the', 'de'].includes(p.toLowerCase()) && p.length > 1);
    if (last && last !== parts[0]) {
      return (first + last[0]).toUpperCase();
    }
    return parts.map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function formatList(arr) {
    if (!arr || arr.length === 0) return '—';
    return arr.join(', ');
  }

  function getFactionLabel(faction) {
    if (!faction) return '';
    return data.factions[faction]?.label || faction;
  }

  function getFactionColor(faction) {
    return data.factions[faction]?.color || '#666';
  }

  // --- Render helpers ---
  function createAvatarHTML(char) {
    if (char.image) {
      return `<img class="char-avatar-img" src="${char.image}" alt="${char.name}" loading="lazy">`;
    }
    return getInitials(char.name);
  }

  // --- Render character card ---
  function renderCharCard(char) {
    const isDead = !char.alive;
    const dragon = char.dragon ? getDragon(char.dragon) : null;
    const hasDragon = !!dragon;

    const card = document.createElement('div');
    card.className = `char-card${isDead ? ' dead' : ''}`;
    card.dataset.charId = char.id;

    card.innerHTML = `
      <div class="char-avatar">${createAvatarHTML(char)}</div>
      <div class="char-info">
        <div class="char-name">${char.name}</div>
        <div class="char-actor">${char.actor}</div>
      </div>
      <div class="char-badges">
        ${hasDragon ? '<span class="char-badge badge-dragon">🐉</span>' : ''}
      </div>
      <span class="char-arrow">›</span>
    `;

    card.addEventListener('click', () => openDetail(char.id));
    return card;
  }

  // --- Render dragon card ---
  function renderDragonCard(dragon, index) {
    const isDead = !dragon.alive;
    const isTop3 = index < 3;

    const card = document.createElement('div');
    card.className = `dragon-card${isDead ? ' dead' : ''}`;

    // Determine faction label
    const factionLabel = dragon.faction === 'blacks' ? 'Team Black' : 'Team Green';

    card.innerHTML = `
      <div class="dragon-card-img">
        ${dragon.image ? `<img src="${dragon.image}" alt="${dragon.name}" class="dragon-card-img-src">` : `<div class="dragon-card-img-placeholder">🐉</div>`}
        <div class="dragon-rank${isTop3 ? ' top3' : ''}">#${index + 1}</div>
      </div>
      <div class="dragon-info">
        <div class="dragon-name">${dragon.name}</div>
        <div class="dragon-rider">${dragon.rider}</div>
        <div class="dragon-color">${dragon.color}</div>
      </div>
      <span class="dragon-badge ${dragon.faction}">${factionLabel}</span>
    `;

    card.addEventListener('click', () => openDragonDetail(dragon));
    return card;
  }

  // --- Render character lists ---
  function renderCharacters() {
    if (!data) return;

    const blacks = data.characters.filter(c => c.faction === 'blacks');
    const greens = data.characters.filter(c => c.faction === 'greens');

    // Sort: alive first, then by name
    const sortChars = (a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      return a.name.localeCompare(b.name);
    };

    blacks.sort(sortChars);
    greens.sort(sortChars);

    blackList.innerHTML = '';
    greens.forEach(c => { /* skip, only render in greens column */ });
    greenList.innerHTML = '';

    blacks.forEach(c => blackList.appendChild(renderCharCard(c)));
    greens.forEach(c => greenList.appendChild(renderCharCard(c)));

    // Update dragon counts
    const blackAliveDragons = getFactionDragonCount('blacks');
    const greenAliveDragons = getFactionDragonCount('greens');
    const blackTotalDragons = getFactionTotalDragons('blacks');
    const greenTotalDragons = getFactionTotalDragons('greens');

    blacksDragonCount.textContent = blackAliveDragons;
    greensDragonCount.textContent = greenAliveDragons;

    const blackDead = blackTotalDragons - blackAliveDragons;
    const greenDead = greenTotalDragons - greenAliveDragons;

    blacksDragonLabel.textContent = `${blackAliveDragons} vivos` + (blackDead > 0 ? ` (${blackDead} caídos)` : '');
    greensDragonLabel.textContent = `${greenAliveDragons} vivos` + (greenDead > 0 ? ` (${greenDead} caídos)` : '');
  }

  // --- Render dragon directory ---
  function renderDragons() {
    if (!dragonsData) return;

    // Sort by size rank
    const sorted = [...dragonsData].sort((a, b) => a.size_rank - b.size_rank);
    dragonList.innerHTML = '';
    sorted.forEach((d, i) => dragonList.appendChild(renderDragonCard(d, i)));
  }

  // --- Character detail ---
  function openDetail(charId) {
    const char = data.characters.find(c => c.id === charId);
    if (!char) return;

    const isDead = !char.alive;
    const dragon = char.dragon ? getDragon(char.dragon) : null;
    const faction = char.faction;
    const factionColor = getFactionColor(faction);

    let html = `
      <div class="detail-header">
        <div class="detail-avatar${isDead ? ' dead' : ''}">${createAvatarHTML(char)}</div>
        <div class="detail-header-info">
          <h2 style="color: ${factionColor}">${char.name}</h2>
          <div class="detail-titles">${formatList(char.titles)}</div>
          <div class="detail-actor">Interpretado por ${char.actor}</div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Estado</h3>
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <div class="detail-info-label">Facción</div>
            <div class="detail-info-value">${faction ? getFactionLabel(faction) : '—'}</div>
          </div>
          <div class="detail-info-item">
            <div class="detail-info-label">Situación</div>
            <div class="detail-info-value">${isDead ? '† Fallecido' : '● Vivo'}</div>
          </div>
          ${dragon ? `
          <div class="detail-info-item">
            <div class="detail-info-label">Dragón</div>
            <div class="detail-info-value">${dragon.name}</div>
          </div>` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h3>Biografía</h3>
        <p class="detail-bio">${char.bio}</p>
      </div>

      <div class="detail-section">
        <h3>Familia</h3>
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <div class="detail-info-label">Padres</div>
            <div class="detail-info-value">${formatList(char.parents)}</div>
          </div>
          <div class="detail-info-item">
            <div class="detail-info-label">Cónyuge(s)</div>
            <div class="detail-info-value">${formatList(char.spouse)}</div>
          </div>
          <div class="detail-info-item">
            <div class="detail-info-label">Hijos</div>
            <div class="detail-info-value">${formatList(char.children)}</div>
          </div>
          <div class="detail-info-item">
            <div class="detail-info-label">Hermanos</div>
            <div class="detail-info-value">${formatList(char.siblings)}</div>
          </div>
        </div>
      </div>
    `;

    // Death info
    if (isDead && char.death_cause) {
      html += `
      <div class="detail-section">
        <h3>Muerte</h3>
        <div class="detail-death">
          <div class="detail-death-label">${char.death_episode || ''}</div>
          <div class="detail-death-text">${char.death_cause}</div>
        </div>
      </div>`;
    }

    // Dragon detail link
    if (dragon) {
      html += `
      <div class="detail-section">
        <h3>Dragón</h3>
        <div class="detail-dragon" data-dragon-id="${dragon.id}">
          <div class="detail-dragon-icon">🐉</div>
          <div class="detail-dragon-info">
            <h4>${dragon.name}</h4>
            <p>#${dragon.size_rank} en tamaño · ${dragon.color}</p>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Haz clic para más detalles →</p>
          </div>
        </div>
      </div>`;
    }

    detailBody.innerHTML = html;
    detailPanel.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Attach dragon click
    const dragonLink = detailBody.querySelector('.detail-dragon');
    if (dragonLink) {
      dragonLink.addEventListener('click', () => {
        const dragonId = dragonLink.dataset.dragonId;
        closeDetail();
        setTimeout(() => openDragonDetail(getDragon(dragonId)), 350);
      });
    }
  }

  // --- Dragon detail (uses same panel) ---
  function openDragonDetail(dragon) {
    if (!dragon) return;

    const isDead = !dragon.alive;
    const faction = dragon.faction;
    const factionColor = getFactionColor(faction);

    let html = `
      <div class="detail-header">
        <div class="detail-avatar${isDead ? ' dead' : ''}" style="font-size:1.8rem;background:transparent;border:none;">🐉</div>
        <div class="detail-header-info">
          <h2 style="color: ${factionColor}">${dragon.name}</h2>
          <div class="detail-titles">#${dragon.size_rank} — ${dragon.color}</div>
          <div class="detail-actor">Jinete: ${dragon.rider}</div>
        </div>
      </div>

      ${dragon.image ? `<div class="dragon-detail-img"><img src="${dragon.image}" alt="${dragon.name}" class="dragon-detail-img-src"></div>` : ''}

      <div class="detail-section">
        <h3>Estado</h3>
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <div class="detail-info-label">Facción</div>
            <div class="detail-info-value">${getFactionLabel(faction)}</div>
          </div>
          <div class="detail-info-item">
            <div class="detail-info-label">Situación</div>
            <div class="detail-info-value">${isDead ? '† Caído en batalla' : '● Vivo'}</div>
          </div>
          <div class="detail-info-item">
            <div class="detail-info-label">Tamaño</div>
            <div class="detail-info-value">#${dragon.size_rank} de ${dragonsData.length}</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Descripción</h3>
        <p class="detail-bio">${dragon.bio}</p>
      </div>
    `;

    // Past riders
    if (dragon.past_riders && dragon.past_riders.length > 0) {
      html += `
      <div class="detail-section">
        <h3>Jinetes anteriores</h3>
        <p class="detail-bio" style="color:var(--text-muted)">${formatList(dragon.past_riders)}</p>
      </div>`;
    }

    // Death info
    if (isDead && dragon.death_cause) {
      html += `
      <div class="detail-section">
        <h3>Caída</h3>
        <div class="detail-death">
          <div class="detail-death-text">${dragon.death_cause}</div>
        </div>
      </div>`;
    }

    detailBody.innerHTML = html;
    detailPanel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // --- Close detail ---
  function closeDetail() {
    detailPanel.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- Navigation ---
  function switchView(view) {
    // Hide all views
    $$('.view').forEach(v => v.classList.remove('active'));

    // Show target
    const target = $(`#view-${view}`);
    if (target) target.classList.add('active');

    // Update nav
    navLinks.forEach(link => {
      const linkView = link.dataset.view;
      link.classList.toggle('active', linkView === view);

      // Only nav-links children get the underline
      if (link.closest('.nav-links')) {
        link.classList.toggle('active', linkView === view);
      }
    });

    // Render dragons if switching to that view
    if (view === 'dragons') {
      renderDragons();
    }

    // Update hash
    if (view === 'home') {
      history.replaceState(null, '', window.location.pathname);
    } else {
      history.replaceState(null, '', `#${view}`);
    }
  }

  // --- Init ---
  async function init() {
    const ok = await loadData();
    if (!ok) {
      document.body.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--text-muted);font-family:var(--font-ui);">
          <p>❌ Error al cargar datos de personajes.</p>
          <p style="font-size:0.85rem;margin-top:8px;">Verificá que el archivo <code>data/characters.json</code> existe y es accesible.</p>
        </div>
      `;
      return;
    }

    renderCharacters();

    // Nav click handlers
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        if (view) switchView(view);
      });
    });

    // Detail close
    detailClose.addEventListener('click', closeDetail);

    // Overlay click to close
    const overlay = document.querySelector('.detail-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeDetail);
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDetail();
    });

    // Hash routing
    if (window.location.hash === '#dragons') {
      switchView('dragons');
    }
  }

  // --- Start ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
