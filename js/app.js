/* LA by Night — Player Codex Web App Core */
'use strict';

var DEFAULT_PORTRAIT = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="150" viewBox="0 0 120 150" fill="%2314141e"><rect width="100%" height="100%"/><circle cx="60" cy="55" r="24" fill="%232c2c3e"/><path d="M25 130c0-22 18-38 35-38s35 16 35 38z" fill="%232c2c3e"/></svg>';

var state = {
  data: null,
  activeTab: 'pcs',
  pcCategoryFilter: 'all',
  npcFilter: 'all',
  mapCategoryFilter: 'all',
  mapSearchQuery: '',
  mapViewMode: 'map',
  rulesFilter: 'disciplines',
  armoryFilter: 'weapon_ranged',
  map: null,
  infoWindow: null,
  mapMarkers: [],
  territoryLayers: []
};

var TAB_CONFIG = {
  'kindred': { title: 'Kindred', sub: 'NPC Dossiers' },
  'pcs': { title: 'Player Characters', sub: 'Kindred & Ghouls' },
  'coterie': { title: 'Player Characters', sub: 'Kindred & Ghouls' },
  'map': { title: 'LA Map', sub: 'Territories & Locations' },
  'rules': { title: 'Rules & Systems', sub: 'V20 Reference' },
  'armory': { title: 'Armory', sub: 'Weapons & Equipment' },
  'sessions': { title: 'Chronicle Briefings', sub: 'Session Debriefs' },
  'dice': { title: 'V20 Dice Engine', sub: 'Probability Roller' }
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
  renderPlayerCharacters();
  renderRules();
  renderArmory();
  renderSessions();
  initGlobalSearch();
  
  var hash = window.location.hash.replace('#', '') || 'pcs';
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
    var hash = window.location.hash.replace('#', '') || 'pcs';
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
  if (tabName === 'coterie') tabName = 'pcs';
  state.activeTab = tabName;

  var conf = TAB_CONFIG[tabName] || { title: (tabName ? tabName.toUpperCase() : 'CODEX'), sub: '' };
  var titleEl = document.getElementById('header-tab-title');
  var subEl = document.getElementById('header-tab-subtitle');
  if (titleEl) titleEl.textContent = conf.title;
  if (subEl) subEl.textContent = conf.sub;

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
      } else if (window.google && window.google.maps) {
        google.maps.event.trigger(state.map, 'resize');
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
    var portraitSrc = npc.portrait || DEFAULT_PORTRAIT;
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
  var portraitSrc = npc.portrait || DEFAULT_PORTRAIT;
  var factionClass = 'badge-faction-' + (npc.faction || 'independent').toLowerCase();

  var h = '';
  h += '<div class="dossier-hero">';
  h += '  <div class="dossier-portrait-wrap" onclick="openPortraitLightbox(\'' + portraitSrc + '\', \'' + escapeHtml(npc.name).replace(/'/g, "\\'") + '\', \'' + escapeHtml(npc.clan || 'Kindred').replace(/'/g, "\\'") + '\')" style="cursor:zoom-in;" title="Click to enlarge portrait">';
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

/* ─── GOOGLE MAPS PLATFORM & DIRECTORY ENGINE (ZERO EMOJIS) ─── */
var darkThemeStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0d0d12" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0d0d12" }, { "weight": 2 }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8c8c9e" }] },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d4af37" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6e6e80" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#131a16" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3f5947" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#1b1b26" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#12121c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca3af" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#282637" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#151420" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d4af37" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#171722" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#a88835" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#08080d" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3d4458" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#08080d" }]
  }
];

var TYPE_CONFIG = {
  haven:       { label: 'Haven',            color: '#c41e3a', border: '#ff4d6d' },
  elysium:     { label: 'Elysium',          color: '#d4af37', border: '#ffd700' },
  hangout:     { label: 'Club / Hangout',   color: '#ec4899', border: '#f472b6' },
  club:        { label: 'Club / Hangout',   color: '#ec4899', border: '#f472b6' },
  business:    { label: 'Business / Front', color: '#3b82f6', border: '#60a5fa' },
  front:       { label: 'Business / Front', color: '#3b82f6', border: '#60a5fa' },
  landmark:    { label: 'Landmark',         color: '#10b981', border: '#34d399' },
  neutral:     { label: 'Landmark',         color: '#10b981', border: '#34d399' },
  domain:      { label: 'Domain',           color: '#f59e0b', border: '#fbbf24' },
  blood:       { label: 'Blood Source',     color: '#dc2626', border: '#ef4444' },
  bureaucracy: { label: 'Bureaucracy',      color: '#0284c7', border: '#38bdf8' },
  auditorium:  { label: 'Auditorium',       color: '#8b5cf6', border: '#a78bfa' }
};

function getMapConfigForType(t, isPc) {
  if (isPc) {
    return { label: 'Coterie Base', color: '#d4af37', border: '#ffd700' };
  }
  var norm = (t || 'business').toLowerCase().trim();
  return TYPE_CONFIG[norm] || { label: t || 'Location', color: '#6b7280', border: '#9ca3af' };
}

function initMap() {
  if (state.map) return;
  if (!window.google || !window.google.maps) {
    var fallbackContainer = document.getElementById('codex-map') || document.getElementById('leaflet-map');
    if (fallbackContainer && !fallbackContainer.dataset.initFailed) {
      fallbackContainer.dataset.initFailed = 'true';
      fallbackContainer.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#d4af37;text-align:center;padding:20px;background:#0d0d12;"><div style="font-family:var(--font-serif);font-size:16px;font-weight:700;margin-bottom:8px;">Initializing LA Territory Map...</div><div style="font-size:12px;color:#9c9cae;">Connecting to Google Maps Platform. If this persists, please verify your internet connection.</div></div>';
      setTimeout(function() {
        if (window.google && window.google.maps && !state.map) {
          fallbackContainer.innerHTML = '';
          initMap();
        }
      }, 600);
    }
    return;
  }

  var container = document.getElementById('codex-map') || document.getElementById('leaflet-map');
  if (!container) return;
  container.innerHTML = '';

  var darkStyledMapType = new google.maps.StyledMapType(darkThemeStyle, { name: 'Nocturnal' });

  state.map = new google.maps.Map(container, {
    center: { lat: 34.0522, lng: -118.28 },
    zoom: 11,
    minZoom: 9,
    maxZoom: 18,
    mapId: "DEMO_MAP_ID",
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    backgroundColor: '#0a0a0c'
  });

  state.map.mapTypes.set('dark', darkStyledMapType);
  state.map.setMapTypeId('dark');

  state.infoWindow = new google.maps.InfoWindow();
  state.map.addListener('click', function() {
    if (state.infoWindow) state.infoWindow.close();
  });

  // Territories (Sect Influence Zones)
  var territories = (state.data && state.data.territories) || {};
  state.territoryLayers = [];
  Object.keys(territories).forEach(function(key) {
    var t = territories[key];
    if (t.polygon && t.polygon.length >= 3) {
      var paths = t.polygon.map(function(pt) {
        return { lat: Number(pt[0]), lng: Number(pt[1]) };
      });
      var poly = new google.maps.Polygon({
        paths: paths,
        strokeColor: t.color || '#e63946',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: t.fillColor || t.color || '#e63946',
        fillOpacity: (t.fillOpacity !== undefined ? t.fillOpacity : 0.2),
        map: state.map
      });
      poly.addListener('click', function() {
        if (state.infoWindow) state.infoWindow.close();
      });
      state.territoryLayers.push(poly);
    }
  });

  renderMapMarkers();
  renderMapDirectory();
}

function getFilteredLocations() {
  var locations = (state.data && state.data.locations) || [];
  var cat = state.mapCategoryFilter;
  var q = (state.mapSearchQuery || '').toLowerCase().trim();

  return locations.filter(function(loc) {
    if (!loc.lat || !loc.lng) return false;

    if (cat !== 'all') {
      if (cat === 'pc_haven') {
        if (!loc.is_pc_location) return false;
      } else if (cat === 'haven') {
        if (!(loc.is_haven || loc.map_type === 'haven') || loc.is_pc_location) return false;
      } else if (cat === 'elysium') {
        if (loc.map_type !== 'elysium') return false;
      } else if (cat === 'club') {
        if (loc.map_type !== 'club' && loc.map_type !== 'hangout') return false;
      } else if (cat === 'front') {
        if (loc.map_type !== 'front' && loc.map_type !== 'business') return false;
      } else if (cat === 'domain') {
        if (loc.map_type !== 'domain') return false;
      }
    }

    if (q) {
      var nameMatch = (loc.name || '').toLowerCase().includes(q);
      var distMatch = (loc.district || '').toLowerCase().includes(q);
      var descMatch = (loc.description || '').toLowerCase().includes(q);
      var charMatch = loc.characters && loc.characters.some(function(c) {
        return (c.name || '').toLowerCase().includes(q);
      });
      if (!nameMatch && !distMatch && !descMatch && !charMatch) return false;
    }

    return true;
  });
}

function buildPopupHTML(loc) {
  var isPc = !!loc.is_pc_location;
  var isHaven = !!(loc.is_haven || loc.map_type === 'haven');
  var cfg = getMapConfigForType(loc.map_type, isPc);

  var html = '<div class="map-noir-popup" style="min-width:240px;max-width:320px;font-family:var(--font-sans);color:#e4e4eb;line-height:1.5;">';
  html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:4px;">';
  html += '  <div style="font-size:15px;font-weight:700;color:#ffd700;font-family:var(--font-serif);line-height:1.3;">' + escapeHtml(loc.name) + '</div>';
  if (isPc) {
    html += '  <span class="badge" style="background:rgba(212,175,55,0.25);color:#ffd700;border:1px solid #ffd700;font-size:9.5px;font-weight:800;white-space:nowrap;padding:1px 5px;border-radius:3px;">[COTERIE BASE]</span>';
  } else if (loc.map_type === 'elysium') {
    html += '  <span class="badge" style="background:rgba(212,175,55,0.2);color:#ffd700;border:1px solid rgba(212,175,55,0.5);font-size:9.5px;font-weight:700;white-space:nowrap;padding:1px 5px;border-radius:3px;">[ELYSIUM]</span>';
  } else if (isHaven) {
    html += '  <span class="badge" style="background:rgba(196,30,58,0.2);color:#ff6b81;border:1px solid rgba(196,30,58,0.5);font-size:9.5px;font-weight:700;white-space:nowrap;padding:1px 5px;border-radius:3px;">[HAVEN]</span>';
  }
  html += '</div>';

  html += '<div style="display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap;">';
  html += '  <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;padding:2px 7px;border-radius:4px;background:' + cfg.color + '33;color:' + cfg.border + ';border:1px solid ' + cfg.color + '88;">' + escapeHtml(cfg.label) + '</span>';
  if (loc.district) {
    html += '  <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;background:rgba(255,255,255,0.06);color:#a0a0b8;border:1px solid rgba(255,255,255,0.12);">' + escapeHtml(loc.district) + '</span>';
  }
  html += '</div>';

  if (loc.description) {
    var desc = loc.description;
    if (desc.length > 260) desc = desc.substring(0, 260) + '...';
    html += '<div style="font-size:12px;line-height:1.45;color:#e4e4ee;margin-bottom:8px;">' + escapeHtml(desc).replace(/\n/g, '<br>') + '</div>';
  }

  if (loc.notes) {
    html += '<div style="font-size:11px;color:#ffe599;background:rgba(212,175,55,0.12);padding:5px 9px;border-left:3px solid #ffd700;border-radius:3px;margin-bottom:8px;line-height:1.4;">' + escapeHtml(loc.notes) + '</div>';
  }

  if (loc.characters && loc.characters.length > 0) {
    var pcResidents = loc.characters.filter(function(c) { return c.is_pc || c.type === 'pc'; });
    var npcResidents = loc.characters.filter(function(c) { return !(c.is_pc || c.type === 'pc'); });

    html += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.12);font-size:11.5px;">';
    if (pcResidents.length > 0) {
      html += '<div style="margin-bottom:3px;color:#ffd700;"><strong style="font-size:10.5px;text-transform:uppercase;letter-spacing:0.3px;">Known Coterie:</strong> ' + pcResidents.map(function(c){ return '<span style="color:#ffd700;font-weight:600;">' + escapeHtml(c.name) + '</span>' + (c.relationship ? ' <span style="font-size:10.5px;color:#a0a0b8;">(' + escapeHtml(c.relationship) + ')</span>' : ''); }).join(', ') + '</div>';
    }
    if (npcResidents.length > 0) {
      html += '<div style="color:#c4c4d4;"><strong style="font-size:10.5px;text-transform:uppercase;letter-spacing:0.3px;color:#ff6b81;">Known Kindred:</strong> ' + npcResidents.map(function(c){ return '<span style="color:#e4e4ee;font-weight:600;">' + escapeHtml(c.name) + '</span>' + (c.relationship ? ' <span style="font-size:10.5px;color:#a0a0b8;">(' + escapeHtml(c.relationship) + ')</span>' : ''); }).join(', ') + '</div>';
    }
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function createMarker(loc) {
  if (!loc.lat || !loc.lng || !state.map) return null;
  var isPc = !!loc.is_pc_location;
  var cfg = getMapConfigForType(loc.map_type, isPc);

  var pinEl = document.createElement('div');
  pinEl.className = 'custom-pin-element' + (isPc ? ' pc-pin' : '');

  if (isPc) {
    var halo = document.createElement('div');
    halo.className = 'pc-pin-halo';
    pinEl.appendChild(halo);
  }

  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "32");
  svg.setAttribute("viewBox", "0 0 24 32");
  svg.style.display = "block";
  svg.style.overflow = "visible";
  svg.style.filter = "drop-shadow(0 2px 5px rgba(0,0,0,0.85))";

  var path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", "M12 0C5.373 0 0 5.373 0 12C0 20.5 12 32 12 32C12 32 24 20.5 24 12C24 5.373 18.627 0 12 0Z");
  path.setAttribute("fill", cfg.color);
  path.setAttribute("stroke", isPc ? "#ffd700" : cfg.border);
  path.setAttribute("stroke-width", isPc ? "2" : "1.5");
  svg.appendChild(path);

  var circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "11.5");
  circle.setAttribute("r", "7");
  circle.setAttribute("fill", "#121216");
  circle.setAttribute("opacity", "0.9");
  svg.appendChild(circle);

  var dot = document.createElementNS(svgNS, "circle");
  dot.setAttribute("cx", "12");
  dot.setAttribute("cy", "11.5");
  dot.setAttribute("r", "3.2");
  dot.setAttribute("fill", isPc ? "#ffd700" : cfg.border);
  svg.appendChild(dot);

  pinEl.appendChild(svg);

  if (isPc) {
    var star = document.createElement('div');
    star.className = 'pc-star-badge';
    star.textContent = '★';
    pinEl.appendChild(star);
  }

  var marker;
  if (window.google && google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
    marker = new google.maps.marker.AdvancedMarkerElement({
      map: state.map,
      position: { lat: Number(loc.lat), lng: Number(loc.lng) },
      content: pinEl,
      title: loc.name
    });

    marker.addListener('click', function() {
      if (state.infoWindow) {
        state.infoWindow.setContent(buildPopupHTML(loc));
        state.infoWindow.open({
          anchor: marker,
          map: state.map,
          shouldFocus: false
        });
      }
    });
  } else {
    marker = new google.maps.Marker({
      map: state.map,
      position: { lat: Number(loc.lat), lng: Number(loc.lng) },
      title: loc.name
    });
    marker.addListener('click', function() {
      if (state.infoWindow) {
        state.infoWindow.setContent(buildPopupHTML(loc));
        state.infoWindow.open(state.map, marker);
      }
    });
  }

  return marker;
}

function renderMapMarkers() {
  if (!state.map) return;

  state.mapMarkers.forEach(function(entry) {
    if (entry.marker) {
      if (entry.marker.map !== undefined) entry.marker.map = null;
      else if (typeof entry.marker.setMap === 'function') entry.marker.setMap(null);
    }
  });
  state.mapMarkers = [];

  var filtered = getFilteredLocations();

  filtered.forEach(function(loc) {
    var marker = createMarker(loc);
    if (marker) {
      state.mapMarkers.push({ loc: loc, marker: marker });
    }
  });
}

function renderMapDirectory() {
  var container = document.getElementById('map-directory-list');
  if (!container) return;

  var filtered = getFilteredLocations();

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">No locations found matching filter criteria.</p>';
    return;
  }

  var html = '';
  filtered.forEach(function(loc) {
    var isPc = loc.is_pc_location;
    var isHaven = !!(loc.is_haven || loc.map_type === 'haven');

    html += '<div class="loc-directory-card' + (isPc ? ' pc-card' : '') + '">';
    html += '  <div class="loc-dir-header">';
    html += '    <div class="loc-dir-name">' + escapeHtml(loc.name) + '</div>';
    html += '    <div class="loc-dir-badges">';
    if (isPc) {
      html += '      <span class="badge" style="background:rgba(212,175,55,0.25);color:#ffd700;border:1px solid #ffd700;font-size:9.5px;font-weight:800;">[COTERIE BASE]</span>';
    } else if (loc.map_type === 'elysium') {
      html += '      <span class="badge" style="background:rgba(212,175,55,0.2);color:#ffd700;font-size:9.5px;font-weight:700;">[ELYSIUM]</span>';
    } else if (isHaven) {
      html += '      <span class="badge" style="background:rgba(196,30,58,0.2);color:#ff6b81;font-size:9.5px;font-weight:700;">[HAVEN]</span>';
    } else if (loc.map_type === 'club' || loc.map_type === 'hangout') {
      html += '      <span class="badge" style="background:rgba(56,189,248,0.15);color:#38bdf8;font-size:9.5px;font-weight:700;">[CLUB]</span>';
    } else if (loc.map_type === 'front' || loc.map_type === 'business') {
      html += '      <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;font-size:9.5px;font-weight:700;">[FRONT]</span>';
    } else if (loc.map_type === 'domain') {
      html += '      <span class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;font-size:9.5px;font-weight:700;">[DOMAIN]</span>';
    }
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="loc-dir-district" style="font-size:11px;color:var(--gold);text-transform:uppercase;font-weight:600;letter-spacing:0.8px;">' + escapeHtml(loc.district || 'Los Angeles') + '</div>';

    if (loc.description) {
      html += '  <div class="loc-dir-desc">' + escapeHtml(loc.description) + '</div>';
    }

    if (loc.characters && loc.characters.length > 0) {
      var pcResidents = loc.characters.filter(function(c) { return c.is_pc || c.type === 'pc'; });
      var npcResidents = loc.characters.filter(function(c) { return !(c.is_pc || c.type === 'pc'); });

      html += '  <div class="loc-dir-residents">';
      if (pcResidents.length > 0) {
        html += '    <div style="color:var(--gold);margin-bottom:2px;"><strong>Coterie:</strong> ' + pcResidents.map(function(c){ return escapeHtml(c.name); }).join(', ') + '</div>';
      }
      if (npcResidents.length > 0) {
        html += '    <div><strong>Known Kindred:</strong> ' + npcResidents.map(function(c){ return escapeHtml(c.name); }).join(', ') + '</div>';
      }
      html += '  </div>';
    }

    html += '  <div class="loc-dir-actions">';
    html += '    <button type="button" class="btn-locate-map" onclick="focusLocationOnMap(' + loc.lat + ',' + loc.lng + ',\'' + escapeHtml(loc.name).replace(/'/g, "\\'") + '\')">Locate on Map &rarr;</button>';
    html += '  </div>';
    html += '</div>';
  });

  container.innerHTML = html;
}

function setMapCategoryFilter(cat, btn) {
  state.mapCategoryFilter = cat;
  var bar = document.getElementById('map-filter-bar');
  if (bar) {
    bar.querySelectorAll('.filter-pill').forEach(function(p) { p.classList.remove('active'); });
  }
  if (btn) btn.classList.add('active');

  renderMapMarkers();
  renderMapDirectory();
}

function filterMapLocations(query) {
  state.mapSearchQuery = query;
  renderMapMarkers();
  renderMapDirectory();
}

function switchMapMode(mode) {
  state.mapViewMode = mode;
  var mapCanvas = document.getElementById('map-canvas-container');
  var dirList = document.getElementById('map-directory-list');
  var btnMap = document.getElementById('btn-mode-map');
  var btnList = document.getElementById('btn-mode-list');

  if (mode === 'map') {
    if (mapCanvas) mapCanvas.style.display = 'block';
    if (dirList) dirList.style.display = 'none';
    if (btnMap) btnMap.classList.add('active');
    if (btnList) btnList.classList.remove('active');
    if (state.map && window.google && window.google.maps) {
      setTimeout(function() {
        google.maps.event.trigger(state.map, 'resize');
      }, 100);
    }
  } else {
    if (mapCanvas) mapCanvas.style.display = 'none';
    if (dirList) dirList.style.display = 'flex';
    if (btnMap) btnMap.classList.remove('active');
    if (btnList) btnList.classList.add('active');
    renderMapDirectory();
  }
}

function focusLocationOnMap(lat, lng, locName) {
  switchMapMode('map');
  if (!state.map) {
    initMap();
  }
  if (!state.map) return;

  state.map.panTo({ lat: Number(lat), lng: Number(lng) });
  state.map.setZoom(15);

  var entry = state.mapMarkers.find(function(m) {
    return m.loc.name === locName || (Math.abs(m.loc.lat - lat) < 0.0001 && Math.abs(m.loc.lng - lng) < 0.0001);
  });
  if (entry && state.infoWindow) {
    state.infoWindow.setContent(buildPopupHTML(entry.loc));
    if (window.google && google.maps.marker && google.maps.marker.AdvancedMarkerElement && entry.marker instanceof google.maps.marker.AdvancedMarkerElement) {
      state.infoWindow.open({
        anchor: entry.marker,
        map: state.map,
        shouldFocus: false
      });
    } else {
      state.infoWindow.open(state.map, entry.marker);
    }
  }
}

function toggleTerritories(btn) {
  var show = !btn.classList.contains('active');
  btn.classList.toggle('active', show);
  state.territoryLayers.forEach(function(poly) {
    poly.setMap(show ? state.map : null);
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
      html += '    <span class="accordion-arrow">&#9660;</span>';
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
      html += '    <span class="accordion-arrow">&#9660;</span>';
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
      html += '    <span class="accordion-arrow">&#9660;</span>';
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
    html += '    <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">';
    html += '      <span class="armory-type">' + escapeHtml(displayType) + '</span>';
    if (item.legality) {
      var legLower = item.legality.toLowerCase();
      var legClass = 'legality-muted';
      if (legLower.includes('legal otc') || legLower.includes('legal in california') || legLower.includes('legal (')) {
        legClass = 'legality-green';
      } else if (legLower.includes('regulated') || legLower.includes('restricted') || legLower.includes('legal to buy')) {
        legClass = 'legality-amber';
      } else if (legLower.includes('prohibited') || legLower.includes('illegal') || legLower.includes('nfa') || legLower.includes('destructive')) {
        legClass = 'legality-red';
      } else if (legLower.includes('technocratic')) {
        legClass = 'legality-cyan';
      } else if (legLower.includes('occult')) {
        legClass = 'legality-purple';
      }
      html += '      <span class="armory-legality-badge ' + legClass + '">' + escapeHtml(item.legality) + '</span>';
    }
    html += '    </div>';
    html += '  </div>';

    // Pricing Bar
    if ((item.price !== null && item.price !== undefined) || (item.price_black_market !== null && item.price_black_market !== undefined) || item.is_purchasable) {
      var hasPrice = false;
      var priceHtml = '  <div class="armory-pricing-bar">';
      if (item.price !== null && item.price !== undefined) {
        hasPrice = true;
        priceHtml += '    <div class="armory-price-pill msrp"><span class="armory-price-label">MSRP</span><span class="armory-price-val">$' + Number(item.price).toLocaleString() + '</span></div>';
      } else if (item.is_purchasable && item.legality !== 'Environmental / Inherent') {
        hasPrice = true;
        priceHtml += '    <div class="armory-price-pill msrp-na"><span class="armory-price-label">MSRP</span><span class="armory-price-val">N/A (Illicit)</span></div>';
      }
      if (item.price_black_market !== null && item.price_black_market !== undefined) {
        hasPrice = true;
        priceHtml += '    <div class="armory-price-pill street"><span class="armory-price-label">Street</span><span class="armory-price-val">$' + Number(item.price_black_market).toLocaleString() + '</span></div>';
      }
      priceHtml += '  </div>';
      if (hasPrice) {
        html += priceHtml;
      }
    }

    var statList = [];
    if (item.damage) statList.push({label: 'Damage', val: item.damage + (item.damage_type ? '/' + item.damage_type : '')});
    if (item.diff) statList.push({label: 'Diff', val: '' + item.diff});
    if (item.rating) statList.push({label: 'Armor', val: '' + item.rating});
    if (item.dex_penalty) statList.push({label: 'Dex Pen', val: '' + item.dex_penalty});
    if (item.range) statList.push({label: 'Range', val: '' + item.range});
    if (item.rate) statList.push({label: 'Rate', val: '' + item.rate});
    if (item.clip) statList.push({label: 'Clip', val: '' + item.clip});
    if (item.blast_area) statList.push({label: 'Blast', val: '' + item.blast_area});
    if (item.blast_power) statList.push({label: 'Power', val: '' + item.blast_power});
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
    var pcs = (state.data && state.data.pcs) || [];
    var matchPcs = pcs.filter(function(p) {
      return (p.name + ' ' + (p.clan || '') + ' ' + (p.player || '') + ' ' + (p.concept || '')).toLowerCase().includes(q);
    });
    if (matchPcs.length > 0) {
      h += '<div style="font-size:11px;color:var(--gold);margin-bottom:6px;font-weight:700;">PLAYER CHARACTERS (' + matchPcs.length + ')</div>';
      matchPcs.forEach(function(p) {
        var pIdx = pcs.indexOf(p);
        var typeLabel = p.type === 'Ghoul' ? 'Ghoul' : (p.clan || 'Kindred');
        h += '<div class="npc-card" style="margin-bottom:8px;padding:8px;cursor:pointer;" onclick="closeGlobalSearch();openPcSheet(' + pIdx + ')">';
        h += '  <strong>' + escapeHtml(p.name) + '</strong> (' + escapeHtml(typeLabel) + ') - <span style="color:#9c9cae;font-size:12px;">' + escapeHtml(p.concept || '') + '</span>';
        h += '</div>';
      });
    }

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

    var locations = (state.data && state.data.locations) || [];
    var matchLocs = locations.filter(function(l) {
      return (l.name + ' ' + (l.district || '') + ' ' + (l.description || '')).toLowerCase().includes(q);
    }).slice(0, 4);
    if (matchLocs.length > 0) {
      h += '<div style="font-size:11px;color:var(--gold);margin:12px 0 6px 0;font-weight:700;">LOCATIONS (' + matchLocs.length + ')</div>';
      matchLocs.forEach(function(l) {
        h += '<div style="background:var(--bg-surface);padding:8px;border-radius:6px;margin-bottom:4px;font-size:12px;cursor:pointer;" onclick="closeGlobalSearch();switchTab(\'map\');focusLocationOnMap(' + l.lat + ',' + l.lng + ',\'' + escapeHtml(l.name).replace(/'/g, "\\'") + '\')">';
        h += '  <strong>' + escapeHtml(l.name) + '</strong> (' + escapeHtml(l.district || '') + ') - <span style="color:var(--text-muted);">' + escapeHtml((l.description || '').substring(0, 70)) + '...</span>';
        h += '</div>';
      });
    }

    var items = (state.data && state.data.items) || [];
    var matchItems = items.filter(function(i) {
      return (i.name + ' ' + (i.notes||'') + ' ' + (i.type||'') + ' ' + (i.legality||'')).toLowerCase().includes(q);
    }).slice(0, 6);
    if (matchItems.length > 0) {
      h += '<div style="font-size:11px;color:var(--gold);margin:12px 0 6px 0;font-weight:700;">ARMORY (' + matchItems.length + ')</div>';
      matchItems.forEach(function(i) {
        var priceStr = '';
        if (i.price !== null && i.price !== undefined) priceStr += 'MSRP: $' + Number(i.price).toLocaleString() + ' ';
        if (i.price_black_market !== null && i.price_black_market !== undefined) priceStr += 'Street: $' + Number(i.price_black_market).toLocaleString();
        h += '<div style="background:var(--bg-surface);padding:8px;border-radius:6px;margin-bottom:4px;font-size:12px;cursor:pointer;" onclick="closeGlobalSearch();switchTab(\'armory\');">';
        h += '  <strong>' + escapeHtml(i.name) + '</strong> ' + (priceStr ? '<span style="color:var(--gold);font-size:11px;">(' + escapeHtml(priceStr.trim()) + ')</span>' : '') + ' - <span style="color:var(--text-muted);">' + escapeHtml(i.notes || (i.damage ? 'Damage ' + i.damage : '')) + '</span>';
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

function getStatSpec(obj, key) {
  if (!obj) return '';
  var raw = obj[key] !== undefined ? obj[key] : (obj[key.toLowerCase()] !== undefined ? obj[key.toLowerCase()] : '');
  if (typeof raw === 'string' && raw.includes('(') && raw.includes(')')) {
    return raw.substring(raw.indexOf('(') + 1, raw.indexOf(')')).trim();
  }
  return '';
}

/* ─── PLAYER CHARACTERS (KINDRED & GHOULS) VIEW ENGINE ─── */
function setPcCategoryFilter(cat, btn) {
  state.pcCategoryFilter = cat;
  var filterBar = document.getElementById('pc-filter-bar');
  if (filterBar) {
    filterBar.querySelectorAll('.filter-pill').forEach(function(p) {
      p.classList.remove('active');
    });
  }
  if (btn) btn.classList.add('active');
  renderPlayerCharacters();
}

function renderPlayerCharacters() {
  var pcs = (state.data && state.data.pcs) || [];
  var container = document.getElementById('pc-directory-list');
  if (!container) return;

  var filter = (state.pcCategoryFilter || 'all').toLowerCase();
  var filtered = pcs.filter(function(pc) {
    if (filter === 'all') return true;
    var pcType = (pc.type || 'Vampire').toLowerCase();
    if (filter === 'vampire') {
      return pcType === 'vampire' || pcType === 'kindred';
    }
    if (filter === 'ghoul') {
      return pcType === 'ghoul' || pcType === 'retainer' || pcType === 'mortal';
    }
    return pcType === filter;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:30px;text-align:center;">No player characters match the selected filter.</p>';
    return;
  }

  var html = '';
  filtered.forEach(function(pc) {
    var realIdx = pcs.indexOf(pc);
    var pcType = (pc.type || 'Vampire').toLowerCase();
    var isGhoul = (pcType === 'ghoul' || pcType === 'retainer');
    var isMortal = (pcType === 'mortal');

    var typeBadge = '';
    if (isGhoul) {
      typeBadge = '<span class="badge-pc-ghoul">[Ghoul - Retainer]</span>';
    } else if (isMortal) {
      typeBadge = '<span class="badge-pc-mortal">[Mortal]</span>';
    } else {
      typeBadge = '<span class="badge-pc-vampire">[Vampire - ' + escapeHtml(pc.clan || 'Kindred') + ']</span>';
    }

    var portraitSrc = pc.portrait || DEFAULT_PORTRAIT;

    html += '<div class="pc-compact-card has-thumb" onclick="openPcSheet(' + realIdx + ')" role="button" tabindex="0">';
    html += '  <div class="pc-card-layout">';
    html += '    <div class="pc-card-portrait-wrap">';
    html += '      <img class="pc-card-thumb" src="' + portraitSrc + '" alt="' + escapeHtml(pc.name) + '" loading="lazy">';
    html += '    </div>';
    html += '    <div class="pc-card-body-wrap">';
    html += '      <div class="pc-compact-header">';
    html += '        <div>';
    html += '          <div class="pc-compact-name">' + escapeHtml(pc.name) + '</div>';
    if (pc.player) {
      html += '          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Player: ' + escapeHtml(pc.player) + '</div>';
    }
    html += '        </div>';
    html += '        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">';
    html +=            typeBadge;
    if (!isGhoul && !isMortal && pc.generation) {
      html += '          <span class="badge" style="background:rgba(212,175,55,0.15);color:var(--gold);">' + escapeHtml(pc.generation) + '</span>';
    }
    html += '        </div>';
    html += '      </div>';
    html += '      <div class="pc-compact-meta">';
    if (pc.concept) {
      html += '        <div class="pc-compact-meta-item"><strong>Concept:</strong> ' + escapeHtml(pc.concept) + '</div>';
    }
    if (isGhoul && pc.domitor) {
      html += '        <div class="pc-compact-meta-item"><strong>Domitor:</strong> ' + escapeHtml(pc.domitor) + '</div>';
    } else if (!isGhoul && !isMortal && pc.sire && pc.sire !== 'N/A') {
      html += '        <div class="pc-compact-meta-item"><strong>Sire:</strong> ' + escapeHtml(pc.sire) + '</div>';
    }
    if (pc.nature && pc.demeanor) {
      html += '        <div class="pc-compact-meta-item"><strong>Archetype:</strong> ' + escapeHtml(pc.nature) + ' / ' + escapeHtml(pc.demeanor) + '</div>';
    }
    html += '      </div>';
    html += '      <div class="pc-compact-footer">';
    html += '        <button type="button" class="btn-view-sheet-pill">View Character Sheet &rarr;</button>';
    html += '      </div>';
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

  var portraitSrc = pc.portrait || DEFAULT_PORTRAIT;
  var pcType = (pc.type || 'Vampire').toLowerCase();
  var isGhoul = (pcType === 'ghoul' || pcType === 'retainer');
  var isMortal = (pcType === 'mortal');

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

  // 1. Hero Showcase (Portrait revealed inside sheet modal on click)
  h += '<div class="pc-view-hero">';
  h += '  <img class="pc-portrait-lg" src="' + portraitSrc + '" alt="' + escapeHtml(pc.name) + '" onclick="openPortraitLightbox(\'' + portraitSrc + '\', \'' + escapeHtml(pc.name).replace(/'/g, "\\'") + '\', \'' + escapeHtml(pc.clan || 'Kindred').replace(/'/g, "\\'") + '\')" style="cursor:zoom-in;" title="Click to enlarge portrait">';
  h += '  <div class="pc-hero-meta">';
  h += '    <div class="pc-hero-title">' + escapeHtml(pc.name) + '</div>';
  if (pc.player) h += '<div style="font-size:12px;color:var(--text-muted);">Player: ' + escapeHtml(pc.player) + '</div>';
  h += '    <div class="pc-hero-badges">';
  if (isGhoul) {
    h += '      <span class="badge-pc-ghoul">[Ghoul - Retainer]</span>';
  } else if (isMortal) {
    h += '      <span class="badge-pc-mortal">[Mortal]</span>';
  } else {
    h += '      <span class="badge badge-clan">' + escapeHtml(pc.clan || 'Kindred') + '</span>';
    if (pc.generation) {
      h += '      <span class="badge" style="background:rgba(212,175,55,0.15);color:var(--gold);">' + escapeHtml(pc.generation) + '</span>';
    }
  }
  if (pc.xp) {
    h += '      <span class="badge" style="border-color:var(--gold);color:var(--gold);">XP: ' + escapeHtml(pc.xp) + '</span>';
  }
  h += '    </div>';
  h += '    <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">';
  if (pc.concept) h += '<div><strong>Concept:</strong> ' + escapeHtml(pc.concept) + '</div>';
  if (isGhoul && pc.domitor) {
    h += '<div><strong>Domitor:</strong> ' + escapeHtml(pc.domitor) + '</div>';
  } else if (!isGhoul && !isMortal && pc.sire && pc.sire !== 'N/A') {
    h += '<div><strong>Sire:</strong> ' + escapeHtml(pc.sire) + '</div>';
  }
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
  h += '      <span class="pc-vital-label">' + (isGhoul ? 'Vitae Pool' : (isMortal ? 'Blood Points' : 'Blood Pool')) + '</span>';
  h += '      <div class="pc-vital-val" style="color:var(--crimson-vivid);">' + escapeHtml(pc.blood_pool || (isGhoul ? '2' : '10')) + ' <span style="font-size:11px;color:var(--text-muted);font-weight:normal;">(' + escapeHtml(pc.blood_per_turn || '1') + '/turn)</span></div>';
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
  h += '    <div class="pc-tac-pill">Initiative: <span class="pc-tac-val">' + init + '</span></div>';
  h += '    <div class="pc-tac-pill">Bashing / Lethal Soak: <span class="pc-tac-val">' + soak + '</span></div>';
  h += '    <div class="pc-tac-pill">Aggravated Soak: <span class="pc-tac-val">' + aggSoak + '</span></div>';
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

  h += '</div>';

  // 4. Abilities Grid
  var ab = pc.abilities || {};
  var talents = ab.talents || {};
  var skills = ab.skills || {};
  var knowledges = ab.knowledges || {};

  h += '<div class="pc-attr-grid">';

  function renderAbilityCol(title, catItems, stdList) {
    var colHtml = '<div class="pc-attr-col">';
    colHtml += '  <div class="pc-attr-col-header">' + title + '</div>';

    // 1. Standard traits (always rendered, 0 dots if unpossessed)
    stdList.forEach(function(trait) {
      var val = getStatNum(catItems, trait);
      var spec = getStatSpec(catItems, trait);
      colHtml += '  <div class="pc-attr-row">';
      colHtml += '    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
      colHtml += '      <span>' + trait + '</span>';
      if (spec) {
        colHtml += '      <span class="badge" style="background:rgba(212,175,55,0.15);color:var(--gold);font-size:10px;padding:1px 5px;border-radius:3px;border:1px solid rgba(212,175,55,0.3);">' + escapeHtml(spec) + '</span>';
      }
      colHtml += '    </div>';
      colHtml += '    <div style="display:flex;align-items:center;gap:6px;">';
      colHtml += '      <span style="font-size:11px;color:var(--text-muted);">' + val + '</span> ' + renderDots(val, 5);
      colHtml += '    </div>';
      colHtml += '  </div>';
    });

    // 2. Custom/secondary traits
    var stdLower = stdList.map(function(s) { return s.toLowerCase(); });
    Object.keys(catItems).forEach(function(k) {
      if (stdLower.indexOf(k.toLowerCase()) === -1) {
        var val = getStatNum(catItems, k);
        var spec = getStatSpec(catItems, k);
        var cleanName = k.replace(/_/g, ' ');
        colHtml += '  <div class="pc-attr-row">';
        colHtml += '    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
        colHtml += '      <span>' + escapeHtml(cleanName) + '</span>';
        if (spec) {
          colHtml += '      <span class="badge" style="background:rgba(212,175,55,0.15);color:var(--gold);font-size:10px;padding:1px 5px;border-radius:3px;border:1px solid rgba(212,175,55,0.3);">' + escapeHtml(spec) + '</span>';
        }
        colHtml += '    </div>';
        colHtml += '    <div style="display:flex;align-items:center;gap:6px;">';
        colHtml += '      <span style="font-size:11px;color:var(--text-muted);">' + val + '</span> ' + renderDots(val, 5);
        colHtml += '    </div>';
        colHtml += '  </div>';
      }
    });

    colHtml += '</div>';
    return colHtml;
  }

  var talentList = ['Alertness', 'Athletics', 'Awareness', 'Brawl', 'Empathy', 'Expression', 'Intimidation', 'Leadership', 'Streetwise', 'Subterfuge'];
  var skillList = ['Animal Ken', 'Crafts', 'Drive', 'Etiquette', 'Firearms', 'Larceny', 'Melee', 'Performance', 'Stealth', 'Survival'];
  var knowList = ['Academics', 'Computer', 'Finance', 'Investigation', 'Law', 'Medicine', 'Occult', 'Politics', 'Science', 'Technology'];

  h += renderAbilityCol('Talents', talents, talentList);
  h += renderAbilityCol('Skills', skills, skillList);
  h += renderAbilityCol('Knowledges', knowledges, knowList);

  h += '</div>';

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
      h += '    <span class="badge" style="background:var(--bg-surface);border:1px solid var(--border-subtle);color:var(--text-main);padding:4px 10px;font-size:12px;">' + escapeHtml(item) + '</span>';
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
    if (s.date) html += '    <span class="session-date">' + escapeHtml(s.date) + '</span>';
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
  var specialty = document.getElementById('dice-specialty-toggle') ? document.getElementById('dice-specialty-toggle').checked : false;
  var willpower = document.getElementById('dice-willpower-toggle') ? document.getElementById('dice-willpower-toggle').checked : false;

  var rolls = [];
  var rawSuccesses = 0;
  var tens = 0;
  var ones = 0;

  for (var i = 0; i < pool; i++) {
    var r = Math.floor(Math.random() * 10) + 1;
    rolls.push(r);
    if (r >= diff) rawSuccesses++;
    if (r === 10) tens++;
    if (r === 1) ones++;
  }

  // If specialty is applied, each 10 yields 1 additional success (10s count as 2 successes)
  var bonusSpecialtySuccesses = specialty ? tens : 0;
  var totalRolledSuccesses = rawSuccesses + bonusSpecialtySuccesses;

  var netSuccesses = 0;
  var verdict = '';
  var verdictColor = '';

  if (willpower) {
    // Willpower rules (V20 Core p. 267):
    // 1. Grants +1 automatic success.
    // 2. Rolled 1s cannot cancel this automatic success (1s only cancel rolled successes).
    // 3. Guarantees the roll CANNOT botch under any circumstances.
    var rolledNet = Math.max(0, totalRolledSuccesses - ones);
    netSuccesses = rolledNet + 1;
    verdict = 'SUCCESS (' + netSuccesses + ' ' + (netSuccesses === 1 ? 'Success' : 'Successes') + ')';
    verdictColor = '#10b981';
  } else {
    // Standard V20 resolution without Willpower
    var rolledNet = totalRolledSuccesses - ones;
    if (totalRolledSuccesses === 0 && ones > 0) {
      netSuccesses = -ones;
      verdict = 'BOTCH! (' + ones + ' ' + (ones === 1 ? 'One' : 'Ones') + ')';
      verdictColor = '#ef4444';
    } else if (rolledNet <= 0) {
      netSuccesses = 0;
      verdict = 'FAILURE (0 Net Successes)';
      verdictColor = '#9c9cae';
    } else {
      netSuccesses = rolledNet;
      verdict = 'SUCCESS (' + netSuccesses + ' ' + (netSuccesses === 1 ? 'Success' : 'Successes') + ')';
      verdictColor = '#10b981';
    }
  }

  var verdictEl = document.getElementById('dice-verdict');
  verdictEl.textContent = verdict;
  verdictEl.style.color = verdictColor;

  var tray = document.getElementById('dice-tray');
  var trayHtml = rolls.map(function(r) {
    var cls = 'fail';
    var label = r;
    if (r === 10) {
      cls = 'crit';
      if (specialty) label = '10<span style="font-size:9px;display:block;line-height:1;margin-top:2px;">(x2)</span>';
    } else if (r >= diff) {
      cls = 'success';
    } else if (r === 1) {
      cls = 'botch';
    }
    return '<div class="dice-die ' + cls + '">' + label + '</div>';
  }).join('');

  if (willpower) {
    trayHtml += '<div class="dice-die wp-die" title="Willpower Auto-Success">+1 WP</div>';
  }

  tray.innerHTML = trayHtml;

  var breakdown = document.getElementById('dice-breakdown');
  var bd = pool + 'd10 vs Diff ' + diff;
  if (specialty) bd += ' [Specialty]';
  if (willpower) bd += ' [Willpower]';
  bd += ' | ' + totalRolledSuccesses + ' rolled successes';
  if (specialty && tens > 0) bd += ' (' + rawSuccesses + ' + ' + tens + ' crit bonus)';
  bd += ', ' + ones + ' ' + (ones === 1 ? 'one' : 'ones');
  if (willpower) bd += ', +1 WP auto';
  bd += ' = Net ' + netSuccesses;

  breakdown.textContent = bd;

  document.getElementById('dice-result-wrap').style.display = 'block';
}

/* ─── PORTRAIT LIGHTBOX VIEWER ─── */
function openPortraitLightbox(imgSrc, title, subtitle) {
  if (!imgSrc || imgSrc === DEFAULT_PORTRAIT) return;
  var modal = document.getElementById('portrait-lightbox-modal');
  var img = document.getElementById('lightbox-img');
  var titleEl = document.getElementById('lightbox-title');
  var subEl = document.getElementById('lightbox-subtitle');
  if (!modal || !img) return;

  img.src = imgSrc;
  img.alt = title || 'Character Portrait';
  if (titleEl) titleEl.textContent = title || '';
  if (subEl) subEl.textContent = subtitle || '';

  modal.classList.add('active');
}

function closePortraitLightbox() {
  var modal = document.getElementById('portrait-lightbox-modal');
  if (modal) modal.classList.remove('active');
}

// Global Escape key listener to close active modals
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closePortraitLightbox();
    closePcSheet();
    closeDossier();
    closeGlobalSearch();
  }
});
