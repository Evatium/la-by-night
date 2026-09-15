/* LA by Night — Player Codex Web App Core */
'use strict';

var state = {
  data: null,
  activeTab: 'kindred',
  npcFilter: 'all',
  rulesFilter: 'disciplines',
  armoryFilter: 'weapon_ranged',
  map: null,
  mapMarkers: [],
  territoryLayers: []
};

document.addEventListener('DOMContentLoaded', function() {
  initApp();
});

function initApp() {
  if (window.CODEX_DATA) {
    state.data = window.CODEX_DATA;
    setupUI();
  } else {
    fetch('data/codex_data.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        state.data = data;
        setupUI();
      })
      .catch(function(err) {
        console.error('Failed to load codex data:', err);
        var el = document.getElementById('view-kindred');
        if (el) el.innerHTML = '<p style="color:#e62e3d;padding:20px;">Error loading Codex data. Please try refreshing.</p>';
      });
  }
}

function setupUI() {
  setupNavigation();
  renderKindred();
  renderCoterie();
  renderRules();
  renderArmory();
  renderSessions();
  initGlobalSearch();
  
  var hash = window.location.hash.replace('#', '') || 'kindred';
  switchTab(hash);
}

function setupNavigation() {
  var navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = btn.getAttribute('data-tab');
      window.location.hash = tab;
      switchTab(tab);
    });
  });

  window.addEventListener('hashchange', function() {
    var hash = window.location.hash.replace('#', '') || 'kindred';
    switchTab(hash);
  });
}

function toggleDrawer() {
  var drawer = document.getElementById('codex-drawer');
  var backdrop = document.getElementById('drawer-backdrop');
  if (drawer) drawer.classList.toggle('active');
  if (backdrop) backdrop.classList.toggle('active');
}

function closeDrawer() {
  var drawer = document.getElementById('codex-drawer');
  var backdrop = document.getElementById('drawer-backdrop');
  if (drawer) drawer.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
}

function navigateFromDrawer(tab, subTab) {
  closeDrawer();
  window.location.hash = tab;
  switchTab(tab);
  if (tab === 'rules' && subTab) {
    var btn = document.querySelector('#rules-filter-bar button[onclick*="' + subTab + '"]');
    if (btn) setRulesFilter(subTab, btn);
  }
}

function switchTab(tabName) {
  state.activeTab = tabName;
  
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-tab') === tabName);
  });

  document.querySelectorAll('.drawer-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-drawer-tab') === tabName);
  });

  document.querySelectorAll('.view-panel').forEach(function(panel) {
    panel.classList.toggle('active', panel.id === 'view-' + tabName);
  });

  if (tabName === 'map') {
    setTimeout(function() {
      if (!state.map) {
        initMap();
      } else {
        state.map.invalidateSize();
      }
    }, 200);
  }
}

function renderKindred() {
  var npcs = (state.data && state.data.npcs) || [];
  var container = document.getElementById('npc-grid');
  if (!container) return;

  var filter = state.npcFilter.toLowerCase();
  var filtered = npcs.filter(function(n) {
    if (filter === 'all') return true;
    return (n.faction || '').toLowerCase() === filter;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:#9c9cae;grid-column:1/-1;padding:20px;">No Kindred discovered in this faction yet.</p>';
    return;
  }

  var html = '';
  filtered.forEach(function(npc) {
    var portraitSrc = npc.portrait || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="130" fill="%2316161f"><rect width="100%" height="100%"/><text x="50%" y="50%" fill="%239c9cae" font-size="24" text-anchor="middle" dominant-baseline="middle">🧛</text></svg>';
    var factionClass = 'badge-faction-' + (npc.faction || 'independent').toLowerCase();

    html += '<div class="npc-card" onclick="openDossier(' + npc.id + ')">';
    html += '  <div class="npc-card-img-wrap">';
    html += '    <img class="npc-card-img" src="' + portraitSrc + '" alt="' + escapeHtml(npc.name) + '" loading="lazy">';
    html += '  </div>';
    html += '  <div class="npc-card-body">';
    html += '    <div class="npc-card-name">' + escapeHtml(npc.name) + '</div>';
    if (npc.aliases) {
      html += '    <div class="npc-card-aliases">' + escapeHtml(npc.aliases) + '</div>';
    }
    html += '    <div class="npc-badges">';
    html += '      <span class="badge ' + factionClass + '">' + escapeHtml(npc.faction || 'Independent') + '</span>';
    html += '      <span class="badge badge-clan">' + escapeHtml(npc.clan || 'Kindred') + '</span>';
    html += '    </div>';
    html += '    <div class="npc-card-concept">' + escapeHtml(npc.concept || '') + '</div>';
    html += '  </div>';
    html += '</div>';
  });

  container.innerHTML = html;
}

function setNpcFilter(faction, btn) {
  state.npcFilter = faction;
  document.querySelectorAll('#npc-filter-bar .filter-pill').forEach(function(p) {
    p.classList.remove('active');
  });
  if (btn) btn.classList.add('active');
  renderKindred();
}

function openDossier(npcId) {
  var npcs = (state.data && state.data.npcs) || [];
  var npc = npcs.find(function(n) { return n.id === npcId; });
  if (!npc) return;

  var modal = document.getElementById('dossier-modal');
  var content = document.getElementById('dossier-content');
  var portraitSrc = npc.portrait || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" fill="%2316161f"><rect width="100%" height="100%"/><text x="50%" y="50%" fill="%239c9cae" font-size="32" text-anchor="middle" dominant-baseline="middle">🧛</text></svg>';
  var factionClass = 'badge-faction-' + (npc.faction || 'independent').toLowerCase();

  var h = '';
  h += '<div class="dossier-hero">';
  h += '  <div class="dossier-portrait-wrap">';
  h += '    <img class="dossier-portrait" src="' + portraitSrc + '" alt="' + escapeHtml(npc.name) + '">';
  h += '  </div>';
  h += '  <div class="dossier-meta">';
  h += '    <h2>' + escapeHtml(npc.name) + '</h2>';
  if (npc.aliases) h += '    <div class="dossier-alias">' + escapeHtml(npc.aliases) + '</div>';
  h += '    <div class="npc-badges">';
  h += '      <span class="badge ' + factionClass + '">' + escapeHtml(npc.faction || 'Independent') + '</span>';
  h += '      <span class="badge badge-clan">' + escapeHtml(npc.clan || 'Kindred') + '</span>';
  h += '    </div>';
  if (npc.concept) {
    h += '    <p style="font-size:12px;color:#f0f0f5;margin-top:6px">' + escapeHtml(npc.concept) + '</p>';
  }
  h += '  </div>';
  h += '</div>';


  if (npc.functions && npc.functions.length > 0) {
    h += '<div class="dossier-section">';
    h += '  <div class="dossier-section-title">Known Role in Los Angeles</div>';
    h += '  <ul class="dossier-bullet-list">';
    npc.functions.forEach(function(fn) {
      h += '    <li>' + escapeHtml(fn) + '</li>';
    });
    h += '  </ul>';
    h += '</div>';
  }

  if (npc.tropes && npc.tropes.length > 0) {
    h += '<div class="dossier-section">';
    h += '  <div class="dossier-section-title">Reputation & Whispers</div>';
    h += '  <div style="display:flex;flex-wrap:wrap;gap:6px">';
    npc.tropes.forEach(function(t) {
      h += '    <span class="badge badge-clan" style="font-size:11px">' + escapeHtml(t) + '</span>';
    });
    h += '  </div>';
    h += '</div>';
  }

  content.innerHTML = h;
  modal.classList.add('active');
}

function closeDossier() {
  var modal = document.getElementById('dossier-modal');
  if (modal) modal.classList.remove('active');
}

function initMap() {
  if (state.map || !window.L) return;

  var container = document.getElementById('leaflet-map');
  if (!container) return;

  state.map = L.map('leaflet-map', {
    center: [34.0522, -118.28],
    zoom: 11,
    minZoom: 9,
    maxZoom: 16,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(state.map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.map);

  var territories = (state.data && state.data.territories) || {};
  Object.keys(territories).forEach(function(key) {
    var t = territories[key];
    if (t.polygon && t.polygon.length > 0) {
      var poly = L.polygon(t.polygon, {
        color: t.color || '#e63946',
        fillColor: t.fillColor || t.color || '#e63946',
        fillOpacity: t.fillOpacity || 0.2,
        weight: 2
      }).addTo(state.map);
      poly.bindTooltip('<strong>' + escapeHtml(t.name) + '</strong><br>' + escapeHtml(t.description || ''), {
        sticky: true
      });
      state.territoryLayers.push(poly);
    }
  });

  var locations = (state.data && state.data.locations) || [];
  locations.forEach(function(loc) {
    if (!loc.lat || !loc.lng) return;

    var color = '#ef4444';
    var iconEmoji = '📍';
    if (loc.map_type === 'elysium') { color = '#d4af37'; iconEmoji = '🏛️'; }
    else if (loc.map_type === 'club' || loc.map_type === 'hangout') { color = '#3b82f6'; iconEmoji = '🍸'; }
    else if (loc.map_type === 'haven') { color = '#8b5cf6'; iconEmoji = '🏰'; }
    else if (loc.map_type === 'front') { color = '#10b981'; iconEmoji = '🏢'; }

    var customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: '<div style="background:' + color + ';width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 0 8px rgba(0,0,0,0.6);font-size:14px;">' + iconEmoji + '</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    var marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(state.map);

    var popupHtml = '<div style="color:#111;font-family:sans-serif;max-width:240px;">';
    popupHtml += '<h4 style="margin:0 0 4px 0;font-size:14px;color:#8b0000;">' + escapeHtml(loc.name) + '</h4>';
    popupHtml += '<div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:6px;">' + escapeHtml(loc.district || '') + ' &bull; ' + escapeHtml(loc.map_type || '') + '</div>';
    if (loc.description) {
      popupHtml += '<p style="font-size:12px;margin:0 0 6px 0;line-height:1.4;">' + escapeHtml(loc.description.substring(0, 160)) + '...</p>';
    }
    if (loc.characters && loc.characters.length > 0) {
      popupHtml += '<div style="font-size:11px;border-top:1px solid #ddd;padding-top:4px;margin-top:4px;"><strong>Known Kindred:</strong> ' + loc.characters.map(function(c){ return escapeHtml(c.name); }).join(', ') + '</div>';
    }
    popupHtml += '</div>';

    marker.bindPopup(popupHtml);
    state.mapMarkers.push(marker);
  });
}

function toggleTerritories(btn) {
  var show = !btn.classList.contains('active');
  btn.classList.toggle('active', show);
  state.territoryLayers.forEach(function(poly) {
    if (show) state.map.addLayer(poly);
    else state.map.removeLayer(poly);
  });
}

function renderRules() {
  var container = document.getElementById('rules-content');
  if (!container || !state.data) return;

  var filter = state.rulesFilter;
  var html = '';

  if (filter === 'disciplines') {
    var discMap = state.data.disciplines || {};
    var discKeys = Object.keys(discMap).sort();

    html += '<div class="accordion-group">';
    discKeys.forEach(function(key, idx) {
      var d = discMap[key];
      var powers = d.powers || [];

      html += '<div class="accordion-item" id="disc-acc-' + idx + '">';
      html += '  <div class="accordion-header" onclick="toggleAccordion(this)">';
      html += '    <span class="accordion-title">' + escapeHtml(d.name || key) + '</span>';
      html += '    <span class="accordion-arrow">▼</span>';
      html += '  </div>';
      html += '  <div class="accordion-body">';
      if (d.description) {
        html += '    <p style="font-style:italic;margin-bottom:10px;">' + escapeHtml(d.description) + '</p>';
      }
      powers.forEach(function(p) {
        var dotsStr = '●'.repeat(p.level || 1);
        html += '    <div class="discipline-power-card">';
        html += '      <div class="discipline-power-header">';
        html += '        <span class="power-name">' + escapeHtml(p.name) + '</span>';
        html += '        <span class="power-dots">' + dotsStr + '</span>';
        html += '      </div>';
        if (p.system || p.cost || p.dice_pool) {
          html += '      <div style="font-size:11px;color:#d4af37;margin-bottom:4px;">';
          if (p.cost) html += '<strong>Cost:</strong> ' + escapeHtml(p.cost) + ' &bull; ';
          if (p.dice_pool) html += '<strong>Pool:</strong> ' + escapeHtml(p.dice_pool);
          html += '      </div>';
        }
        html += '      <div class="power-desc">' + escapeHtml(p.description || p.system || '') + '</div>';
        html += '    </div>';
      });
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';
  } else if (filter === 'combat') {
    var mechanics = state.data.mechanics || [];
    html += '<div class="accordion-group">';
    mechanics.forEach(function(m, idx) {
      html += '<div class="accordion-item ' + (idx === 0 ? 'open' : '') + '">';
      html += '  <div class="accordion-header" onclick="toggleAccordion(this)">';
      html += '    <span class="accordion-title">' + escapeHtml(m.title) + '</span>';
      html += '    <span class="accordion-arrow">▼</span>';
      html += '  </div>';
      html += '  <div class="accordion-body">';
      html += '    <pre style="white-space:pre-wrap;font-family:inherit;font-size:12px;line-height:1.6;">' + escapeHtml(m.content) + '</pre>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';
  } else if (filter === 'glossary') {
    var glossary = (state.data.glossary && state.data.glossary.terms) || state.data.glossary || {};
    var terms = Object.keys(glossary).sort();

    html += '<div class="accordion-group">';
    terms.forEach(function(term) {
      var def = typeof glossary[term] === 'string' ? glossary[term] : (glossary[term].definition || glossary[term].desc || '');
      html += '<div class="accordion-item">';
      html += '  <div class="accordion-header" onclick="toggleAccordion(this)">';
      html += '    <span class="accordion-title">' + escapeHtml(term) + '</span>';
      html += '    <span class="accordion-arrow">▼</span>';
      html += '  </div>';
      html += '  <div class="accordion-body">';
      html += '    <p>' + escapeHtml(def) + '</p>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

function setRulesFilter(cat, btn) {
  state.rulesFilter = cat;
  document.querySelectorAll('#rules-filter-bar .filter-pill').forEach(function(p) {
    p.classList.remove('active');
  });
  if (btn) btn.classList.add('active');
  renderRules();
}

function toggleAccordion(header) {
  var item = header.parentElement;
  item.classList.toggle('open');
}

function filterRulesSearch(query) {
  var q = (query || '').toLowerCase().trim();
  var items = document.querySelectorAll('#rules-content .accordion-item');
  items.forEach(function(el) {
    var text = el.innerText.toLowerCase();
    el.style.display = text.includes(q) ? 'block' : 'none';
    if (q && text.includes(q)) el.classList.add('open');
  });
}

function renderArmory() {
  var container = document.getElementById('armory-grid');
  if (!container || !state.data) return;

  var items = state.data.items || [];
  var filter = state.armoryFilter;

  var filtered = items.filter(function(i) {
    if (filter === 'all') return true;
    if (filter === 'weapon_ranged') return i.category === 'weapon_ranged';
    if (filter === 'weapon_melee') return i.category === 'weapon_melee' || i.category === 'weapon_thrown';
    if (filter === 'armor') return i.category === 'armor' || i.category === 'shield';
    if (filter === 'gear') return ['explosive', 'toxin', 'hazard', 'ammo', 'sight', 'ritual_supplies', 'gear'].indexOf(i.category) !== -1;
    return i.category === filter;
  });

  var html = '';
  filtered.forEach(function(item) {
    html += '<div class="armory-card">';
    html += '  <div class="armory-header">';
    html += '    <span class="armory-name">' + escapeHtml(item.name) + '</span>';
    var displayType = item.type || (item.category ? item.category.replace('weapon_', '') : 'item');
    html += '    <span class="armory-type">' + escapeHtml(displayType) + '</span>';
    html += '  </div>';

    var statList = [];
    if (item.damage) statList.push({label: 'Damage', val: item.damage + (item.damage_type ? '/' + item.damage_type : '')});
    if (item.diff) statList.push({label: 'Diff', val: '' + item.diff});
    if (item.rating) statList.push({label: 'Armor', val: '' + item.rating});
    if (item.dex_penalty) statList.push({label: 'Dex Pen', val: '' + item.dex_penalty});
    if (item.range) statList.push({label: 'Range', val: '' + item.range});
    if (item.rate) statList.push({label: 'Rate', val: '' + item.rate});
    if (item.clip) statList.push({label: 'Clip', val: '' + item.clip});
    if (item.conceal) {
      var cMap = {'P':'Pocket','J':'Jacket','T':'Trenchcoat','N':'None'};
      statList.push({label: 'Conceal', val: cMap[item.conceal] || item.conceal});
    }

    if (statList.length > 0) {
      var cols = Math.min(statList.length, 4);
      html += '  <div class="armory-stats-table" style="grid-template-columns:repeat(' + cols + ', 1fr);">';
      statList.forEach(function(st) {
        html += '    <div><span class="armory-stat-label">' + escapeHtml(st.label) + '</span><div class="armory-stat-val">' + escapeHtml(st.val) + '</div></div>';
      });
      html += '  </div>';
    }

    if (item.notes) {
      html += '  <div class="armory-notes">' + escapeHtml(item.notes) + '</div>';
    }
    html += '</div>';
  });

  container.innerHTML = html || '<p style="color:#9c9cae;padding:20px;">No items found in this category.</p>';
}

function setArmoryFilter(cat, btn) {
  state.armoryFilter = cat;
  document.querySelectorAll('#armory-filter-bar .filter-pill').forEach(function(p) {
    p.classList.remove('active');
  });
  if (btn) btn.classList.add('active');
  renderArmory();
}

function filterArmorySearch(query) {
  var q = (query || '').toLowerCase().trim();
  var cards = document.querySelectorAll('#armory-grid .armory-card');
  cards.forEach(function(c) {
    var text = c.innerText.toLowerCase();
    c.style.display = text.includes(q) ? 'flex' : 'none';
  });
}

function initGlobalSearch() {
  var input = document.getElementById('global-search-input');
  if (!input) return;
  input.addEventListener('input', function(e) {
    var q = e.target.value.toLowerCase().trim();
    var resultsBox = document.getElementById('global-search-results');
    if (!q) {
      resultsBox.innerHTML = '';
      return;
    }

    var h = '';
    var npcs = (state.data && state.data.npcs) || [];
    var matchNpcs = npcs.filter(function(n) {
      return (n.name + ' ' + (n.aliases||'') + ' ' + (n.clan||'') + ' ' + (n.concept||'')).toLowerCase().includes(q);
    });
    if (matchNpcs.length > 0) {
      h += '<div style="font-size:11px;color:#e62e3d;margin-bottom:6px;font-weight:700;">KINDRED (' + matchNpcs.length + ')</div>';
      matchNpcs.forEach(function(n) {
        h += '<div class="npc-card" style="margin-bottom:8px;padding:8px;cursor:pointer;" onclick="closeGlobalSearch();openDossier(' + n.id + ')">';
        h += '  <strong>' + escapeHtml(n.name) + '</strong> (' + escapeHtml(n.clan || 'Kindred') + ') - <span style="color:#9c9cae;font-size:12px;">' + escapeHtml(n.concept || '') + '</span>';
        h += '</div>';
      });
    }

    var items = (state.data && state.data.items) || [];
    var matchItems = items.filter(function(i) {
      return (i.name + ' ' + (i.notes||'') + ' ' + (i.type||'')).toLowerCase().includes(q);
    }).slice(0, 6);
    if (matchItems.length > 0) {
      h += '<div style="font-size:11px;color:#d4af37;margin:12px 0 6px 0;font-weight:700;">ARMORY (' + matchItems.length + ')</div>';
      matchItems.forEach(function(i) {
        h += '<div style="background:#1c1c27;padding:8px;border-radius:6px;margin-bottom:4px;font-size:12px;">';
        h += '  <strong>' + escapeHtml(i.name) + '</strong> - ' + escapeHtml(i.notes || (i.damage ? 'Damage ' + i.damage : ''));
        h += '</div>';
      });
    }

    resultsBox.innerHTML = h || '<p style="color:#9c9cae;font-size:12px;padding:10px;">No matching results found.</p>';
  });
}

function openGlobalSearch() {
  var modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.add('active');
    setTimeout(function() {
      document.getElementById('global-search-input').focus();
    }, 100);
  }
}

function closeGlobalSearch() {
  var modal = document.getElementById('search-modal');
  if (modal) modal.classList.remove('active');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatParagraphs(text) {
  if (!text) return '';
  return text.split(/\n\n+/).map(function(p) {
    return '<p style="margin-bottom:8px;">' + escapeHtml(p.trim()) + '</p>';
  }).join('');
}

function renderDots(value, max) {
  var val = parseInt(value) || 0;
  var maxDots = max || 5;
  var html = '<span class="pc-dot-track">';
  for (var i = 1; i <= maxDots; i++) {
    if (i <= val) {
      html += '●';
    } else {
      html += '<span class="pc-dot-empty">○</span>';
    }
  }
  html += '</span>';
  return html;
}

function getStatNum(obj, key) {
  if (!obj) return 0;
  var val = obj[key] !== undefined ? obj[key] : (obj[key.toLowerCase()] !== undefined ? obj[key.toLowerCase()] : 0);
  if (typeof val === 'string' && val.includes('(')) {
    val = val.split('(')[0].trim();
  }
  return parseInt(val) || 0;
}

function renderCoterie() {
  var pcs = (state.data && state.data.pcs) || [];
  var container = document.getElementById('pc-grid');
  if (!container) return;

  if (pcs.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">No Coterie dossiers published yet.</p>';
    return;
  }

  var html = '';
  pcs.forEach(function(pc, idx) {
    var portraitSrc = pc.portrait || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" fill="%2316161f"><rect width="100%" height="100%"/><text x="50%" y="50%" fill="%239c9cae" font-size="32" text-anchor="middle" dominant-baseline="middle">🧛</text></svg>';

    html += '<div class="npc-card" onclick="openPcSheet(' + idx + ')" style="cursor:pointer;" title="Tap to open full V20 Character Sheet">';
    html += '  <div class="npc-portrait-wrap">';
    html += '    <img class="npc-portrait" src="' + portraitSrc + '" alt="' + escapeHtml(pc.name) + '" loading="lazy">';
    html += '  </div>';
    html += '  <div class="npc-info">';
    html += '    <h3 class="npc-name">' + escapeHtml(pc.name) + '</h3>';
    html += '    <div class="npc-badges">';
    html += '      <span class="badge badge-clan">' + escapeHtml(pc.clan || 'Kindred') + '</span>';
    html += '      <span class="badge" style="background:rgba(212,175,55,0.15);color:var(--gold);">' + escapeHtml(pc.generation || '8th') + '</span>';
    html += '    </div>';
    if (pc.concept) {
      html += '    <div class="npc-concept">' + escapeHtml(pc.concept) + '</div>';
    }
    if (pc.nature && pc.demeanor) {
      html += '    <div style="font-size:11px;color:var(--text-muted);margin-top:6px;"><strong>Archetype:</strong> ' + escapeHtml(pc.nature) + ' / ' + escapeHtml(pc.demeanor) + '</div>';
    }
    html += '    <div style="margin-top:10px;">';
    html += '      <span class="badge" style="background:rgba(230,46,61,0.15);color:var(--crimson-vivid);border:1px solid var(--border-accent);font-size:11px;font-weight:600;">📜 Open Character Sheet &rarr;</span>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  });

  container.innerHTML = html;
}

function openPcSheet(idx) {
  var pcs = (state.data && state.data.pcs) || [];
  var pc = pcs[idx];
  if (!pc) return;

  var modal = document.getElementById('pc-sheet-modal');
  var content = document.getElementById('pc-sheet-content');
  if (!modal || !content) return;

  var portraitSrc = pc.portrait || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" fill="%2316161f"><rect width="100%" height="100%"/><text x="50%" y="50%" fill="%239c9cae" font-size="32" text-anchor="middle" dominant-baseline="middle">🧛</text></svg>';

  // Tactical calculations
  var phys = (pc.attributes && pc.attributes.physical) || {};
  var soc = (pc.attributes && pc.attributes.social) || {};
  var ment = (pc.attributes && pc.attributes.mental) || {};
  var discs = pc.disciplines || {};

  var dex = getStatNum(phys, 'Dexterity');
  var wits = getStatNum(ment, 'Wits');
  var cel = getStatNum(discs, 'Celerity');
  var sta = getStatNum(phys, 'Stamina');
  var fort = getStatNum(discs, 'Fortitude');

  var init = dex + wits + cel;
  var soak = sta + fort;
  var aggSoak = fort;

  var h = '';

  // 1. Hero Showcase
  h += '<div class="pc-view-hero">';
  h += '  <img class="pc-portrait-lg" src="' + portraitSrc + '" alt="' + escapeHtml(pc.name) + '">';
  h += '  <div class="pc-hero-meta">';
  h += '    <div class="pc-hero-title">' + escapeHtml(pc.name) + '</div>';
  if (pc.player) h += '<div style="font-size:12px;color:var(--text-muted);">Player: ' + escapeHtml(pc.player) + '</div>';
  h += '    <div class="pc-hero-badges">';
  h += '      <span class="badge badge-clan">' + escapeHtml(pc.clan || 'Kindred') + '</span>';
  h += '      <span class="badge" style="background:rgba(212,175,55,0.15);color:var(--gold);">' + escapeHtml(pc.generation || '8th') + '</span>';
  h += '      <span class="badge" style="border-color:var(--gold);color:var(--gold);">⚡ XP: ' + escapeHtml(pc.xp || '0') + '</span>';
  h += '    </div>';
  h += '    <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">';
  if (pc.concept) h += '<div><strong>Concept:</strong> ' + escapeHtml(pc.concept) + '</div>';
  if (pc.sire && pc.sire !== 'N/A') h += '<div><strong>Sire:</strong> ' + escapeHtml(pc.sire) + '</div>';
  if (pc.nature && pc.demeanor) h += '<div><strong>Nature / Demeanor:</strong> ' + escapeHtml(pc.nature) + ' / ' + escapeHtml(pc.demeanor) + '</div>';
  h += '    </div>';
  h += '  </div>';
  h += '</div>';

  // 2. Vitals & Virtues Card
  var virtues = pc.virtues || {};
  var conscience = virtues['Conscience/Conviction'] || virtues['Conscience'] || virtues['Conviction'] || '3';
  var selfControl = virtues['Self-Control/Instinct'] || virtues['Self-Control'] || virtues['Instinct'] || '3';
  var courage = virtues['Courage'] || '3';

  h += '<div class="pc-vitals-card">';
  h += '  <div class="pc-vitals-row">';
  h += '    <div class="pc-vital-box">';
  h += '      <span class="pc-vital-label">Humanity / Path</span>';
  h += '      <div class="pc-vital-val" style="color:var(--gold);">' + escapeHtml(pc.humanity || '7') + ' ' + renderDots(pc.humanity || 7, 10) + '</div>';
  h += '    </div>';
  h += '    <div class="pc-vital-box">';
  h += '      <span class="pc-vital-label">Willpower</span>';
  h += '      <div class="pc-vital-val">' + escapeHtml(pc.willpower || '5') + '</div>';
  h += '    </div>';
  h += '    <div class="pc-vital-box">';
  h += '      <span class="pc-vital-label">Blood Pool</span>';
  h += '      <div class="pc-vital-val" style="color:var(--crimson-vivid);">' + escapeHtml(pc.blood_pool || '10') + ' <span style="font-size:11px;color:var(--text-muted);font-weight:normal;">(' + escapeHtml(pc.blood_per_turn || '1') + '/turn)</span></div>';
  h += '    </div>';
  h += '  </div>';

  h += '  <div class="pc-tactical-banner" style="margin-bottom:8px;">';
  h += '    <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--gold);">Virtues:</span>';
  h += '    <div class="pc-tac-pill">Conscience: <span class="pc-tac-val">' + conscience + '</span></div>';
  h += '    <div class="pc-tac-pill">Self-Control: <span class="pc-tac-val">' + selfControl + '</span></div>';
  h += '    <div class="pc-tac-pill">Courage: <span class="pc-tac-val">' + courage + '</span></div>';
  h += '  </div>';

  h += '  <div class="pc-tactical-banner">';
  h += '    <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--crimson-vivid);">Tactical Readout:</span>';
  h += '    <div class="pc-tac-pill">⚡ Initiative: <span class="pc-tac-val">' + init + '</span></div>';
  h += '    <div class="pc-tac-pill">🛡️ Bashing / Lethal Soak: <span class="pc-tac-val">' + soak + '</span></div>';
  h += '    <div class="pc-tac-pill">🔥 Aggravated Soak: <span class="pc-tac-val">' + aggSoak + '</span></div>';
  h += '  </div>';
  h += '</div>';

  // 3. Attributes Grid
  h += '<div class="pc-attr-grid">';
  
  // Physical
  h += '<div class="pc-attr-col">';
  h += '  <div class="pc-attr-col-header">Physical</div>';
  ['Strength', 'Dexterity', 'Stamina'].forEach(function(attr) {
    var val = getStatNum(phys, attr) || 1;
    h += '  <div class="pc-attr-row">';
    h += '    <span>' + attr + '</span>';
    h += '    <div style="display:flex;align-items:center;gap:6px;">';
    h += '      <span style="font-size:11px;color:var(--text-muted);">' + val + '</span> ' + renderDots(val, 5);
    h += '    </div>';
    h += '  </div>';
  });
  h += '</div>';

  // Social
  h += '<div class="pc-attr-col">';
  h += '  <div class="pc-attr-col-header">Social</div>';
  ['Charisma', 'Manipulation', 'Appearance'].forEach(function(attr) {
    var val = getStatNum(soc, attr) || 1;
    h += '  <div class="pc-attr-row">';
    h += '    <span>' + attr + '</span>';
    h += '    <div style="display:flex;align-items:center;gap:6px;">';
    h += '      <span style="font-size:11px;color:var(--text-muted);">' + val + '</span> ' + renderDots(val, 5);
    h += '    </div>';
    h += '  </div>';
  });
  h += '</div>';

  // Mental
  h += '<div class="pc-attr-col">';
  h += '  <div class="pc-attr-col-header">Mental</div>';
  ['Perception', 'Intelligence', 'Wits'].forEach(function(attr) {
    var val = getStatNum(ment, attr) || 1;
    h += '  <div class="pc-attr-row">';
    h += '    <span>' + attr + '</span>';
    h += '    <div style="display:flex;align-items:center;gap:6px;">';
    h += '      <span style="font-size:11px;color:var(--text-muted);">' + val + '</span> ' + renderDots(val, 5);
    h += '    </div>';
    h += '  </div>';
  });
  h += '</div>';

  h += '</div>'; // End pc-attr-grid

  // 4. Abilities Grid
  var ab = pc.abilities || {};
  var talents = ab.talents || {};
  var skills = ab.skills || {};
  var knowledges = ab.knowledges || {};

  h += '<div class="pc-attr-grid">';

  // Talents
  h += '<div class="pc-attr-col">';
  h += '  <div class="pc-attr-col-header">Talents</div>';
  var talentList = ['Alertness', 'Athletics', 'Awareness', 'Brawl', 'Empathy', 'Expression', 'Intimidation', 'Leadership', 'Streetwise', 'Subterfuge'];
  talentList.forEach(function(t) {
    var val = getStatNum(talents, t);
    if (val > 0) {
      h += '  <div class="pc-attr-row">';
      h += '    <span>' + t + '</span>';
      h += '    <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:11px;color:var(--text-muted);">' + val + '</span> ' + renderDots(val, 5) + '</div>';
      h += '  </div>';
    }
  });
  h += '</div>';

  // Skills
  h += '<div class="pc-attr-col">';
  h += '  <div class="pc-attr-col-header">Skills</div>';
  var skillList = ['Animal Ken', 'Crafts', 'Drive', 'Etiquette', 'Firearms', 'Larceny', 'Melee', 'Performance', 'Stealth', 'Survival'];
  skillList.forEach(function(s) {
    var val = getStatNum(skills, s);
    if (val > 0) {
      h += '  <div class="pc-attr-row">';
      h += '    <span>' + s + '</span>';
      h += '    <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:11px;color:var(--text-muted);">' + val + '</span> ' + renderDots(val, 5) + '</div>';
      h += '  </div>';
    }
  });
  h += '</div>';

  // Knowledges
  h += '<div class="pc-attr-col">';
  h += '  <div class="pc-attr-col-header">Knowledges</div>';
  var knowList = ['Academics', 'Computer', 'Finance', 'Investigation', 'Law', 'Medicine', 'Occult', 'Politics', 'Science', 'Technology'];
  knowList.forEach(function(k) {
    var val = getStatNum(knowledges, k);
    if (val > 0) {
      h += '  <div class="pc-attr-row">';
      h += '    <span>' + k + '</span>';
      h += '    <div style="display:flex;align-items:center;gap:6px;"><span style="font-size:11px;color:var(--text-muted);">' + val + '</span> ' + renderDots(val, 5) + '</div>';
      h += '  </div>';
    }
  });
  h += '</div>';

  h += '</div>'; // End pc-attr-grid

  // 5. Disciplines
  var discKeys = Object.keys(discs);
  if (discKeys.length > 0) {
    h += '<div class="pc-section-card">';
    h += '  <div class="pc-section-title">Disciplines</div>';
    h += '  <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;">';
    discKeys.forEach(function(dName) {
      var dVal = parseInt(discs[dName]) || 1;
      h += '    <div style="background:var(--bg-surface);padding:8px 12px;border-radius:6px;border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">';
      h += '      <strong style="color:var(--text-main);">' + escapeHtml(dName) + '</strong>';
      h += '      <div>' + renderDots(dVal, 5) + '</div>';
      h += '    </div>';
    });
    h += '  </div>';
    h += '</div>';
  }

  // 6. Backgrounds
  var bgs = pc.backgrounds || {};
  var bgKeys = Object.keys(bgs);
  if (bgKeys.length > 0) {
    h += '<div class="pc-section-card">';
    h += '  <div class="pc-section-title">Backgrounds</div>';
    h += '  <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;">';
    bgKeys.forEach(function(bgKey) {
      var bgVal = bgs[bgKey];
      var dots = 1;
      var desc = '';
      if (typeof bgVal === 'object' && bgVal !== null) {
        dots = parseInt(bgVal.value) || 1;
        desc = bgVal.description || '';
      } else {
        dots = parseInt(bgVal) || 1;
      }
      h += '    <div style="background:var(--bg-surface);padding:8px 12px;border-radius:6px;border:1px solid var(--border-subtle);">';
      h += '      <div style="display:flex;justify-content:space-between;align-items:center;">';
      h += '        <strong style="color:var(--text-main);">' + escapeHtml(bgKey) + '</strong>';
      h += '        <div>' + renderDots(dots, 5) + '</div>';
      h += '      </div>';
      if (desc) h += '    <div style="font-size:11px;color:var(--gold);margin-top:4px;">' + escapeHtml(desc) + '</div>';
      h += '    </div>';
    });
    h += '  </div>';
    h += '</div>';
  }

  // 7. Merits & Flaws
  var merits = pc.merits || [];
  var flaws = pc.flaws || [];
  if (merits.length > 0 || flaws.length > 0) {
    h += '<div class="pc-section-card">';
    h += '  <div class="pc-section-title">Merits &amp; Flaws</div>';
    if (merits.length > 0) {
      h += '  <div style="margin-bottom:12px;">';
      h += '    <div style="font-size:11px;font-weight:700;color:#34d399;text-transform:uppercase;margin-bottom:6px;">Merits</div>';
      merits.forEach(function(m) {
        h += '    <div class="merit-card">';
        h += '      <strong style="color:#34d399;">' + escapeHtml(m.name) + '</strong>';
        if (m.value) h += ' <span style="font-size:11px;color:var(--text-muted);">(' + escapeHtml(m.value) + ' pt)</span>';
        if (m.desc) h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;line-height:1.4;">' + escapeHtml(m.desc) + '</div>';
        h += '    </div>';
      });
      h += '  </div>';
    }
    if (flaws.length > 0) {
      h += '  <div>';
      h += '    <div style="font-size:11px;font-weight:700;color:#f87171;text-transform:uppercase;margin-bottom:6px;">Flaws</div>';
      flaws.forEach(function(f) {
        h += '    <div class="flaw-card">';
        h += '      <strong style="color:#f87171;">' + escapeHtml(f.name) + '</strong>';
        if (f.value) h += ' <span style="font-size:11px;color:var(--text-muted);">(' + escapeHtml(f.value) + ' pt)</span>';
        if (f.desc) h += '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;line-height:1.4;">' + escapeHtml(f.desc) + '</div>';
        h += '    </div>';
      });
      h += '  </div>';
    }
    h += '</div>';
  }

  // 8. Equipment
  var eqList = pc.equipment || [];
  if (eqList.length > 0) {
    h += '<div class="pc-section-card">';
    h += '  <div class="pc-section-title">Equipment &amp; Possessions</div>';
    h += '  <div style="display:flex;flex-wrap:wrap;gap:6px;">';
    eqList.forEach(function(item) {
      h += '    <span class="badge" style="background:var(--bg-surface);border:1px solid var(--border-subtle);color:var(--text-main);padding:4px 10px;font-size:12px;">🗡️ ' + escapeHtml(item) + '</span>';
    });
    h += '  </div>';
    h += '</div>';
  }

  content.innerHTML = h;
  modal.classList.add('active');
}

function closePcSheet() {
  var modal = document.getElementById('pc-sheet-modal');
  if (modal) modal.classList.remove('active');
}

function renderSessions() {
  var sessions = (state.data && state.data.sessions) || [];
  var container = document.getElementById('sessions-list');
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">No Chronicle Briefings published yet.</p>';
    return;
  }

  var html = '';
  sessions.forEach(function(s) {
    html += '<div class="session-card">';
    html += '  <div class="session-card-header">';
    html += '    <span class="session-number-badge">Session ' + s.id + '</span>';
    if (s.date) html += '    <span class="session-date">📅 ' + escapeHtml(s.date) + '</span>';
    html += '  </div>';
    html += '  <h3 class="session-title">' + escapeHtml(s.title) + '</h3>';
    if (s.summary) {
      html += '  <div class="session-summary">' + escapeHtml(s.summary) + '</div>';
    }
    html += '</div>';
  });

  container.innerHTML = html;
}

function updateDiceSlider(val, id) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function rollV20Dice() {
  var pool = parseInt(document.getElementById('dice-pool-slider').value) || 1;
  var diff = parseInt(document.getElementById('dice-diff-slider').value) || 6;

  var rolls = [];
  var successes = 0;
  var ones = 0;

  for (var i = 0; i < pool; i++) {
    var r = Math.floor(Math.random() * 10) + 1;
    rolls.push(r);
    if (r >= diff) successes++;
    if (r === 1) ones++;
  }

  var netSuccesses = successes - ones;
  var verdict = '';
  var verdictColor = '';

  if (netSuccesses > 0) {
    verdict = 'SUCCESS (' + netSuccesses + ' ' + (netSuccesses === 1 ? 'Success' : 'Successes') + ')';
    verdictColor = '#10b981';
  } else if (successes === 0 && ones > 0) {
    verdict = '💀 BOTCH! (' + ones + ' ' + (ones === 1 ? 'One' : 'Ones') + ')';
    verdictColor = '#ef4444';
  } else {
    verdict = 'FAILURE (0 Net Successes)';
    verdictColor = '#9c9cae';
  }

  var verdictEl = document.getElementById('dice-verdict');
  verdictEl.textContent = verdict;
  verdictEl.style.color = verdictColor;

  var tray = document.getElementById('dice-tray');
  tray.innerHTML = rolls.map(function(r) {
    var cls = 'fail';
    if (r === 10) cls = 'crit';
    else if (r >= diff) cls = 'success';
    else if (r === 1) cls = 'botch';
    return '<div class="dice-die ' + cls + '">' + r + '</div>';
  }).join('');

  var breakdown = document.getElementById('dice-breakdown');
  breakdown.textContent = pool + 'd10 vs Diff ' + diff + ' | ' + successes + ' successes, ' + ones + ' ones = Net ' + netSuccesses;

  document.getElementById('dice-result-wrap').style.display = 'block';
}
