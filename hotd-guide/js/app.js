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

    // Update dragon labels in faction headers
    const blackAliveDragons = getFactionDragonCount('blacks');
    const greenAliveDragons = getFactionDragonCount('greens');

    blacksDragonLabel.textContent = `${blackAliveDragons} dragones`;
    greensDragonLabel.textContent = `${greenAliveDragons} dragones`;
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

  // --- Sub-navigation ---
  function switchSubView(subview) {
    // Hide all sub-views
    $$('.sub-view').forEach(v => v.classList.remove('active'));
    // Show target
    const target = $(`#sub-${subview}`);
    if (target) target.classList.add('active');
    // Update sub-nav
    $$('.sub-nav a').forEach(link => {
      link.classList.toggle('active', link.dataset.subview === subview);
    });
    // Render on switch
    if (subview === 'tree') renderTree();
    else if (subview === 'houses') renderHouses();
    else if (subview === 'timeline') renderTimeline();
  }

  // --- RENDER: Houses ---
  function renderHouses() {
    const container = $('#sub-houses');
    container.innerHTML = '';

    // Extended house data with relationships
    const houses = {
      '👑 Targaryen': [
        { id: 'viserys', name: 'Viserys I Targaryen', rel: 'Rey de los Siete Reinos', alive: false },
        { id: 'rhaenyra', name: 'Rhaenyra Targaryen', rel: 'Hija de Viserys · Heredera al trono', alive: true },
        { id: 'daemon', name: 'Daemon Targaryen', rel: 'Hermano de Viserys · 2° esposo de Rhaenyra', alive: true },
        { id: 'aegon_ii', name: 'Aegon II Targaryen', rel: 'Hijo de Viserys · Rey usurpador', alive: true },
        { id: 'aemond', name: 'Aemond Targaryen', rel: 'Hijo de Viserys · Jinete de Vhagar', alive: true },
        { id: 'helaena', name: 'Helaena Targaryen', rel: 'Hija de Viserys · Esposa de Aegon II', alive: true },
        { id: 'daeron', name: 'Daeron Targaryen', rel: 'Hijo de Viserys · Jinete de Tessarion', alive: true },
        { id: 'rhaenys', name: 'Rhaenys Targaryen', rel: 'Prima de Viserys · La Reina Que Nunca Fue', alive: false },
        { id: 'baela', name: 'Baela Targaryen', rel: 'Hija de Daemon y Laena · Prometida de Jace', alive: true },
        { id: 'rhaena', name: 'Rhaena Targaryen', rel: 'Hija de Daemon y Laena · Gemela de Baela', alive: true },
        { id: 'jacaerys', name: 'Jacaerys Velaryon', rel: 'Hijo de Rhaenyra · Heredero · Jinete de Vermax', alive: true },
        { id: 'lucerys', name: 'Lucerys Velaryon', rel: 'Hijo de Rhaenyra · Jinete de Arrax · Asesinado', alive: false },
        { id: 'aemma', name: 'Aemma Arryn', rel: '1° esposa de Viserys · Madre de Rhaenyra', alive: false, hasCard: false },
        { id: 'jaehaerys', name: 'Jaehaerys Targaryen', rel: 'Hijo de Aegon II y Helaena · Asesinado', alive: false, hasCard: false },
      ],
      '🌊 Velaryon': [
        { id: 'corlys', name: 'Corlys Velaryon', rel: 'Señor de Marcaderiva · La Serpiente Marina', alive: true },
        { id: 'laenor', name: 'Laenor Velaryon', rel: 'Hijo de Corlys · 1° esposo de Rhaenyra', alive: true, hasCard: false },
        { id: 'laena', name: 'Laena Velaryon', rel: 'Hija de Corlys · 2° esposa de Daemon', alive: false, hasCard: false },
      ],
      '🏰 Hightower': [
        { id: 'otto', name: 'Otto Hightower', rel: 'Mano del Rey · Padre de Alicent', alive: true },
        { id: 'alicent', name: 'Alicent Hightower', rel: 'Hija de Otto · 2° esposa de Viserys', alive: true },
      ],
      '🔨 Strong': [
        { id: 'larys', name: 'Larys Strong', rel: 'Señor de Harrenhal · Maestro de los Susurros', alive: true },
        { id: 'harwin', name: 'Harwin Strong', rel: 'Hijo de Lyonel · Amante de Rhaenyra · Padre de Jace, Luke', alive: false, hasCard: false },
        { id: 'lyonel', name: 'Lyonel Strong', rel: 'Mano del Rey Viserys · Padre de Harwin y Larys', alive: false, hasCard: false },
      ],
      '🐉 Brotes de Dragón': [
        { id: 'addam', name: 'Addam of Hull', rel: 'Hijo bastardo de Corlys · Jinete de Seasmoke', alive: true },
        { id: 'hugh', name: 'Hugh Hammer', rel: 'Bastardo Targaryen · Herrero · Jinete de Vermithor', alive: true },
        { id: 'ulf', name: 'Ulf White', rel: 'Bastardo Targaryen · Jinete de Silverwing', alive: true },
      ],
    };

    // Check if character has a full card
    function hasCard(id) {
      return data.characters.some(c => c.id === id);
    }

    let html = '<div class="houses-grid">';
    Object.entries(houses).forEach(([house, chars]) => {
      if (chars.length === 0) return;
      html += `<div class="house-card">
        <h3 class="house-name">${house} <span class="house-count">${chars.length}</span></h3>
        <div class="house-char-list">`;
      chars.forEach(c => {
        const charData = data.characters.find(ch => ch.id === c.id);
        const isDead = !c.alive;
        const clickable = hasCard(c.id);
        html += `<div class="house-char${isDead ? ' dead' : ''}${clickable ? ' clickable' : ''}"${clickable ? ` data-char="${c.id}"` : ''}>
          <div class="house-char-avatar">${charData ? createAvatarHTML(charData) : c.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
          <div class="house-char-info">
            <div class="house-char-name">${c.name}</div>
            <div class="house-char-rel">${c.rel}</div>
          </div>
        </div>`;
      });
      html += `</div></div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    // Click handlers (only for characters with cards)
    container.querySelectorAll('.house-char.clickable').forEach(el => {
      el.addEventListener('click', () => openDetail(el.dataset.char));
    });
  }

  // --- RENDER: Family Tree ---
  function renderTree() {
    const container = $('#sub-tree');
    container.innerHTML = '<div class="tree-container"></div>';
    const treeEl = container.querySelector('.tree-container');

    const viserys = data.characters.find(c => c.id === 'viserys');

    let html = `<div class="family-tree">`;

    // Root: Viserys I with image
    html += `<div class="ft-root">
      <div class="ft-person ft-main" data-char="viserys">
        <div class="ft-avatar">${createAvatarHTML(viserys)}</div>
        <div class="ft-name-lg">Viserys I Targaryen</div>
        <div class="ft-title">Rey de los Siete Reinos</div>
      </div>
    </div>`;

    // Spouses row
    const alicent = data.characters.find(c => c.id === 'alicent');
    html += `<div class="ft-spouses-wrap">
      <div class="ft-spouse" data-char="aemma">
        <div class="ft-name ft-dead">Aemma Arryn †</div>
        <div class="ft-detail">Primera esposa de Viserys · Madre de Rhaenyra</div>
      </div>
      <div class="ft-spouse-divider">⚭</div>
      <div class="ft-spouse" data-char="alicent">
        <div class="ft-name">Alicent Hightower</div>
        <div class="ft-detail">Segunda esposa de Viserys · Madre de Aegon II</div>
      </div>
    </div>`;

    // Branch container
    html += `<div class="ft-connector-v"></div>`;
    html += `<div class="ft-branches">`;

    // ── BRANCH 1: Rhaenyra + Daemon ── (TEAM BLACK)
    const rhaenyra = data.characters.find(c => c.id === 'rhaenyra');
    const daemon = data.characters.find(c => c.id === 'daemon');
    const rhaenyraKids = ['jacaerys','lucerys','baela','rhaena']; // Joffrey omitted (no card)

    html += `<div class="ft-branch ft-branch-black">
      <div class="ft-branch-label">👑 Rama de Rhaenyra</div>
      <div class="ft-couple">
        <div class="ft-person" data-char="rhaenyra">
          <div class="ft-name">Rhaenyra Targaryen</div>
          <div class="ft-detail">Hija de Viserys y Aemma</div>
        </div>
        <div class="ft-married">⚭</div>
        <div class="ft-person" data-char="daemon">
          <div class="ft-name">Daemon Targaryen</div>
          <div class="ft-detail">Tío y segundo esposo</div>
        </div>
      </div>
      <div class="ft-kids-label">Hijos</div>
      <div class="ft-kids">${rhaenyraKids.map(id => {
        const ch = data.characters.find(c => c.id === id);
        if (!ch) return '';
        var role = '';
        if (ch.dragon) { var dr = getDragon(ch.dragon); if (dr) role = 'Jinete de ' + dr.name; }
        else if (id === 'rhaena') role = 'Sin drag\u00f3n';
        return '<div class="ft-child' + (!ch.alive ? ' dead' : '') + '" data-char="' + id + '">' +
          '<span class="ft-child-name">' + ch.name + (!ch.alive ? ' \u2020' : '') + '</span>' +
          '<span class="ft-child-role">' + role + '</span></div>';
      }).join('')}</div>\n    </div>`;
    // BRANCH 2: Alicent's children (TEAM GREEN)
    html += `<div class="ft-branch ft-branch-green">
      <div class="ft-branch-label">🏹 Rama de Alicent</div>
      <div class="ft-couple">
        <div class="ft-person" data-char="aegon_ii">
          <div class="ft-name">Aegon II Targaryen</div>
          <div class="ft-detail">Primogénito de Alicent</div>
        </div>
        <div class="ft-married">⚭</div>
        <div class="ft-person" data-char="helaena">
          <div class="ft-name">Helaena Targaryen</div>
          <div class="ft-detail">Hermana-esposa</div>
        </div>
      </div>
      <div class="ft-kids-label">Hijos</div>
      <div class="ft-kids">
        <div class="ft-child dead">
          <span class="ft-child-name">Jaehaerys Targaryen †</span>
          <span class="ft-child-role">Asesinado por Sangre y Queso</span>
        </div>
      </div>
      <div class="ft-siblings-label">Hermanos</div>
      <div class="ft-siblings">
        ${['aemond','daeron'].map(id => {
          const ch = data.characters.find(c => c.id === id);
          if (!ch) return '';
          var role = '';
          if (ch.dragon) { var dr = getDragon(ch.dragon); if (dr) role = 'Jinete de ' + dr.name; }
          return '<div class="ft-child' + (!ch.alive ? ' dead' : '') + '" data-char="' + id + '">' +
            '<span class="ft-child-name">' + ch.name + (!ch.alive ? ' \u2020' : '') + '</span>' +
            '<span class="ft-child-role">' + role + '</span></div>';
        }).join('')}
      </div>
    </div>`;

    html += `</div>`; // end ft-branches
    html += `</div>`; // end family-tree
    treeEl.innerHTML = html;

    // Click handlers
    treeEl.querySelectorAll('[data-char]').forEach(el => {
      el.addEventListener('click', () => openDetail(el.dataset.char));
    });
  }

  // --- RENDER: Timeline ---
  function renderTimeline() {
    const container = $('#sub-timeline');

    const events = [
      { season: 'Antes', episode: '', date: '101 CA', title: 'Gran Consejo de Harrenhal',
        desc: 'Viserys I es elegido rey sobre Rhaenys Targaryen, la Reina Que Nunca Fue.', icon: '👑' },
      { season: 'Antes', episode: '', date: '~112 CA', title: 'Rhaenyra nombrada heredera',
        desc: 'Viserys I nombra a Rhaenyra como su heredera tras la muerte de Aemma.', icon: '📜' },
      { season: 'S1', episode: 'E1', date: '', title: 'Muerte de Aemma Arryn',
        desc: 'La reina Aemma muere en un parto forzado. Viserys nombra a Rhaenyra heredera.', icon: '💔' },
      { season: 'S1', episode: 'E5', date: '', title: 'Rhaenyra se casa con Laenor',
        desc: 'Matrimonio político entre Rhaenyra y Laenor Velaryon.', icon: '💍' },
      { season: 'S1', episode: 'E7', date: '', title: 'Aemond reclama a Vhagar',
        desc: 'Aemond monta a Vhagar por primera vez. Pelea con los hijos de Rhaenyra; Lucerys le corta un ojo.', icon: '🐉' },
      { season: 'S1', episode: 'E8', date: '', title: 'Muerte de Viserys I',
        desc: 'El rey Viserys muere en paz, pero Alicent malinterpreta sus últimas palabras.', icon: '🕊️' },
      { season: 'S1', episode: 'E9', date: '', title: 'Coronación de Aegon II',
        desc: 'Aegon II es coronado rey por los Verdes. Comienza la usurpación.', icon: '👑' },
      { season: 'S1', episode: 'E10', date: '', title: 'Muerte de Lucerys Velaryon',
        desc: 'Aemond y Vhagar matan a Lucerys y su dragón Arrax en Bastión de Tormentas. La Danza de los Dragones comienza oficialmente.', icon: '💀' },
      { season: 'S2', episode: 'E1', date: '', title: 'Sangre y Queso',
        desc: 'Daemon envía asesinos a Desembarco del Rey. El hijo de Helaena, Jaehaerys, es asesinado.', icon: '🗡️' },
      { season: 'S2', episode: 'E4', date: '', title: 'Batalla de Reposo del Cuervo',
        desc: 'Aemond y Vhagar tienden una emboscada. Rhaenys y su dragón Meleys mueren. Aegon II y Sunfyre caen gravemente heridos.', icon: '⚔️' },
      { season: 'S2', episode: 'E7', date: '', title: 'La Siembra Roja',
        desc: 'Rhaenyra recluta jinetes de dragón. Hugh Hammer doma a Vermithor. Ulf White doma a Silverwing. Addam reclama a Seasmoke.', icon: '🔥' },
      { season: 'S2', episode: 'E8', date: '', title: 'Caída de Sunfyre',
        desc: 'Sunfyre muere por sus heridas. Aegon II huye de Desembarco del Rey. Aemond asume como Regente.', icon: '🐉' },
    ];

    let html = '<div class="timeline"><div class="timeline-line"></div>';
    events.forEach((ev, i) => {
      const side = i % 2 === 0 ? 'left' : 'right';
      html += `<div class="timeline-item ${side}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-icon">${ev.icon}</span>
            <span class="timeline-season">${ev.season}${ev.episode ? ' ' + ev.episode : ''}</span>
            ${ev.date ? `<span class="timeline-date">${ev.date}</span>` : ''}
          </div>
          <h3 class="timeline-title">${ev.title}</h3>
          <p class="timeline-desc">${ev.desc}</p>
        </div>
      </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
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

    // Sub-nav click handlers
    $$('.sub-nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const subview = link.dataset.subview;
        if (subview) switchSubView(subview);
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
