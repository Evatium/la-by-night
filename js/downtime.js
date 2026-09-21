/* LA by Night — Player Codex Downtime Planner Engine */
'use strict';

window.DOWNTIME_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzovjUzIaoaSNQOGFXOhCLmaNOs4ubzpLM9VQkQEt95RQIn81F0RjsiJHUY48NtuTM/exec';

(function() {
  // 1. PC Configurations & Canon Metadata (Kindred & Ghouls)
  var DOWNTIME_PCS = {
    'liam_johnson': {
      id: 'liam_johnson',
      sheet_name: 'Liam_Johnson',
      name: 'Liam Johnson ("L.J.")',
      clan: 'Brujah',
      generation: '8th',
      type: 'Kindred',
      blood_pool: '12/15',
      willpower: '3/5',
      health: 'Full / Uninjured',
      is_injured: false,
      notes: 'Blood Bound to Rachel Teller (Rating 2). Retainer: Rachel Teller (App 5 racer groupie). Contacts: David Martinez (Latin Kings). Primary Haven: Church of the New Dawn (West Covina).'
    },
    'frederic_king': {
      id: 'frederic_king',
      sheet_name: 'Frederic_King',
      name: 'Frederic King',
      clan: 'Malkavian',
      generation: '12th',
      type: 'Kindred',
      blood_pool: '10/11',
      willpower: '6/7',
      health: 'Full / Uninjured',
      is_injured: false,
      notes: 'Cult (Flock) 3, Retainers 3 (Katrine Sterling, John Carmac, George Michael). True Faith 2. Primary Haven: Church of the New Dawn (West Covina).'
    },
    'isabel_turner': {
      id: 'isabel_turner',
      sheet_name: 'Isabel_Turner',
      name: 'Isabel Turner',
      clan: 'Ventrue',
      generation: '9th',
      type: 'Kindred',
      blood_pool: '11/14',
      willpower: '5/6',
      health: 'Full / Uninjured',
      is_injured: false,
      notes: 'Palate Restriction: Only feeds from high-net-worth corporate executives and financiers. Retainer: Personal executive assistant. Primary Haven: Church of the New Dawn (West Covina).'
    },
    'shane_mercer': {
      id: 'shane_mercer',
      sheet_name: 'Shane_Mercer',
      name: 'Elliot "Shane" Mercer',
      clan: 'Toreador',
      generation: '13th',
      type: 'Kindred',
      blood_pool: '8/10',
      willpower: '5/7',
      health: 'Incapacitated (5 Aggravated Health Levels)',
      is_injured: true,
      notes: 'Healing 5 Aggravated levels requires 25 BP total + 1 day of rest per level unless spending 1 WP + 5 BP/level under the house rule. Chris Partlow has 1 Lethal wound remaining.'
    },
    'katrine_sterling': {
      id: 'katrine_sterling',
      sheet_name: 'Katrine_Sterling',
      name: 'Katrine Sterling',
      clan: 'Ghoul',
      generation: 'Ghoul',
      type: 'Ghoul',
      domitor: 'Frederic King',
      blood_pool: '1/1',
      willpower: '6/6',
      health: 'Full / Uninjured',
      is_injured: false,
      notes: 'Domitor: Frederic King. Bound by vitae, handles drones, electronic warfare, and cybersecurity. Ghoul rules: No hunting; 1 Primary Goal per day.'
    },
    'john_carmac': {
      id: 'john_carmac',
      sheet_name: 'John_Carmac',
      name: 'John Carmac',
      clan: 'Ghoul',
      generation: 'Ghoul',
      type: 'Ghoul',
      domitor: 'Frederic King',
      blood_pool: '1/1',
      willpower: '6/6',
      health: 'Full / Uninjured',
      is_injured: false,
      notes: 'Domitor: Frederic King. Manages church PR, mortal cover, and Masquerade scrub operations. Oracular Ability. Ghoul rules: No hunting; 1 Primary Goal per day.'
    },
    'george_michael': {
      id: 'george_michael',
      sheet_name: 'George_Michael',
      name: 'George Michael',
      clan: 'Ghoul',
      generation: 'Ghoul',
      type: 'Ghoul',
      domitor: 'Frederic King',
      blood_pool: '1/1',
      willpower: '5/5',
      health: 'Full / Uninjured',
      is_injured: false,
      notes: 'Domitor: Frederic King. Combat marksman and tactical security. Magic Resistance. Ghoul rules: No hunting; 1 Primary Goal per day.'
    },
    'rachel_teller': {
      id: 'rachel_teller',
      sheet_name: 'Rachel_Teller',
      name: 'Rachel Teller',
      clan: 'Ghoul',
      generation: 'Ghoul',
      type: 'Ghoul',
      domitor: 'Liam Johnson',
      blood_pool: '1/1',
      willpower: '6/6',
      health: 'Full / Uninjured',
      is_injured: false,
      notes: 'Bound to Liam Johnson (Rating 2). Underground street racer, scout, and mechanic. Ghoul rules: No hunting; 1 Primary Goal per day.'
    },
    'chris_partlow': {
      id: 'chris_partlow',
      sheet_name: 'Chris_Partlow',
      name: 'Chris Partlow',
      clan: 'Ghoul',
      generation: 'Ghoul',
      type: 'Ghoul',
      domitor: 'Elliot "Shane" Mercer',
      blood_pool: '1/1',
      willpower: '6/6',
      health: 'Wounded (1 Lethal wound remaining)',
      is_injured: true,
      notes: 'Domitor: Elliot "Shane" Mercer. Retired soldier recovering from 1 Lethal wound. Ghoul rules: No hunting; 1 Primary Goal per day.'
    }
  };

  // 2. 7 Days Schedule (Aug 2 – Aug 8, 2026)
  var DOWNTIME_DAYS = [
    { day: 1, label: 'Day 1', date: 'Sunday, Aug 2, 2026' },
    { day: 2, label: 'Day 2', date: 'Monday, Aug 3, 2026' },
    { day: 3, label: 'Day 3', date: 'Tuesday, Aug 4, 2026' },
    { day: 4, label: 'Day 4', date: 'Wednesday, Aug 5, 2026' },
    { day: 5, label: 'Day 5', date: 'Thursday, Aug 6, 2026' },
    { day: 6, label: 'Day 6', date: 'Friday, Aug 7, 2026' },
    { day: 7, label: 'Day 7', date: 'Saturday, Aug 8, 2026' }
  ];

  // 3. Action Categories (Kindred vs Ghoul)
  var KINDRED_CATEGORIES = [
    {
      key: 'feeding',
      title: 'Feeding / Hunting',
      emoji: '🩸',
      descPlaceholder: 'Where & how are you feeding? Vessel, approach, disciplines used...',
      defaultAttr: 'Manipulation',
      defaultAbil: 'Subterfuge'
    },
    {
      key: 'primary',
      title: 'Primary Action',
      emoji: '🎯',
      descPlaceholder: 'Main project, summit, research, or major task for the night...',
      defaultAttr: 'Intelligence',
      defaultAbil: 'Occult'
    },
    {
      key: 'secondary',
      title: 'Secondary Action',
      emoji: '⚡',
      descPlaceholder: 'Secondary undertaking or social check-in...',
      defaultAttr: 'Wits',
      defaultAbil: 'Streetwise'
    },
    {
      key: 'tertiary',
      title: 'Tertiary Action',
      emoji: '🔧',
      descPlaceholder: 'Minor routine, ghoul check, phone calls, or equipment upkeep...',
      defaultAttr: 'Perception',
      defaultAbil: 'Alertness'
    }
  ];

  var GHOUL_CATEGORIES = [
    {
      key: 'primary',
      title: 'Primary Goal / Assignment',
      emoji: '🎯',
      descPlaceholder: 'Assigned mission, surveillance, drone ops, logistics, or personal task for the day...',
      defaultAttr: 'Perception',
      defaultAbil: 'Alertness'
    }
  ];

  // Standard V20 Attribute & Ability Catalogs (Attributes: Physical, Social, Mental only)
  var V20_ATTRS = {
    'Physical': ['Strength', 'Dexterity', 'Stamina'],
    'Social': ['Charisma', 'Manipulation', 'Appearance'],
    'Mental': ['Perception', 'Intelligence', 'Wits']
  };

  var V20_ABILS = {
    'Talents': ['Alertness', 'Athletics', 'Awareness', 'Brawl', 'Empathy', 'Expression', 'Intimidation', 'Leadership', 'Streetwise', 'Subterfuge'],
    'Skills': ['Animal Ken', 'Crafts', 'Drive', 'Etiquette', 'Firearms', 'Larceny', 'Melee', 'Performance', 'Stealth', 'Survival'],
    'Knowledges': ['Academics', 'Computer', 'Finance', 'Investigation', 'Law', 'Medicine', 'Occult', 'Politics', 'Science', 'Technology']
  };

  var activeCharKey = 'liam_johnson';
  var autoSaveTimer = null;

  // Initialize Downtime Planner
  function initDowntime() {
    renderDaysContainer();
    setupEventListeners();
    updateCharacterBanner();
    loadDraftForCharacter(activeCharKey);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDowntime);
  } else {
    initDowntime();
  }

  // Get active character data from live CODEX_DATA.pcs
  function getCharacterSheet(charKey) {
    if (window.CODEX_DATA && Array.isArray(window.CODEX_DATA.pcs)) {
      var key = (charKey || '').toLowerCase();
      var pcs = window.CODEX_DATA.pcs;
      for (var i = 0; i < pcs.length; i++) {
        var p = pcs[i];
        var name = (p.name || '').toLowerCase();
        if (key === 'liam_johnson' && name.indexOf('liam') !== -1) return p;
        if (key === 'frederic_king' && name.indexOf('frederic') !== -1) return p;
        if (key === 'isabel_turner' && name.indexOf('isabel') !== -1) return p;
        if (key === 'shane_mercer' && (name.indexOf('shane') !== -1 || name.indexOf('mercer') !== -1)) return p;
        if (key === 'katrine_sterling' && name.indexOf('katrine') !== -1) return p;
        if (key === 'john_carmac' && name.indexOf('carmac') !== -1) return p;
        if (key === 'george_michael' && name.indexOf('george') !== -1) return p;
        if (key === 'rachel_teller' && name.indexOf('rachel') !== -1) return p;
        if (key === 'chris_partlow' && (name.indexOf('chris') !== -1 || name.indexOf('partlow') !== -1)) return p;
      }
    }
    return null;
  }

  // Merged live character sheet with fallback metadata
  function getMergedCharacter(charKey) {
    var pc = getCharacterSheet(charKey) || {};
    var meta = DOWNTIME_PCS[charKey] || {};
    
    var isGhoul = (pc.type === 'Ghoul') || (meta.type === 'Ghoul') || (pc.clan === 'Ghoul');
    var bp = pc.blood_pool || meta.blood_pool || (isGhoul ? '1/1' : '10/10');
    var wp = pc.willpower || meta.willpower || '5/5';
    var health = pc.health || meta.health || 'Full / Uninjured';
    var isInjured = (health.toLowerCase().indexOf('injured') !== -1) || 
                    (health.toLowerCase().indexOf('incapacitated') !== -1) || 
                    (health.toLowerCase().indexOf('wounded') !== -1) || 
                    Boolean(meta.is_injured);

    return {
      id: charKey,
      sheet_name: meta.sheet_name || charKey,
      name: pc.name || meta.name || charKey,
      clan: pc.clan || meta.clan || (isGhoul ? 'Ghoul' : 'Kindred'),
      generation: pc.generation || meta.generation || (isGhoul ? 'Ghoul' : 'Unknown'),
      type: isGhoul ? 'Ghoul' : 'Kindred',
      domitor: pc.domitor || meta.domitor || pc.sire || '',
      blood_pool: bp,
      willpower: wp,
      health: health,
      is_injured: isInjured,
      humanity: pc.humanity || meta.humanity || '7',
      notes: meta.notes || '',
      attributes: pc.attributes || {},
      abilities: pc.abilities || {},
      specialties: pc.specialties || {}
    };
  }

  // Retrieve numerical rating for an attribute (strictly Physical, Social, Mental)
  function getAttrRating(charKey, attrName) {
    if (!attrName || attrName === 'None' || attrName === 'Automatic') return 0;
    var pc = getCharacterSheet(charKey);
    if (!pc) return 1;

    if (pc.attributes) {
      for (var cat in pc.attributes) {
        if (pc.attributes.hasOwnProperty(cat) && pc.attributes[cat]) {
          for (var a in pc.attributes[cat]) {
            if (a.toLowerCase() === attrName.toLowerCase()) {
              var val = pc.attributes[cat][a];
              var num = parseInt(val, 10);
              return isNaN(num) ? 0 : num;
            }
          }
        }
      }
    }
    return 1;
  }

  // Retrieve numerical rating for an ability
  function getAbilRating(charKey, abilName) {
    if (!abilName || abilName === 'None') return 0;
    var pc = getCharacterSheet(charKey);
    if (!pc || !pc.abilities) return 0;

    for (var cat in pc.abilities) {
      if (pc.abilities.hasOwnProperty(cat) && pc.abilities[cat]) {
        for (var a in pc.abilities[cat]) {
          if (a.toLowerCase() === abilName.toLowerCase()) {
            var val = pc.abilities[cat][a];
            var num = parseInt(val, 10);
            return isNaN(num) ? 0 : num;
          }
        }
      }
    }
    return 0;
  }

  // Retrieve specialty text for attribute or ability
  function getTraitSpecialty(charKey, traitName) {
    if (!traitName || traitName === 'None' || traitName === 'Automatic') return '';
    var pc = getCharacterSheet(charKey);
    if (!pc) return '';

    if (pc.specialties) {
      for (var k in pc.specialties) {
        if (k.toLowerCase() === traitName.toLowerCase()) {
          return pc.specialties[k];
        }
      }
    }

    // Check parenthetical specialties inside attribute / ability values (e.g. "4 (Tactical)")
    var checkObj = function(obj) {
      if (!obj) return '';
      for (var group in obj) {
        for (var t in obj[group]) {
          if (t.toLowerCase() === traitName.toLowerCase()) {
            var val = String(obj[group][t] || '');
            var m = val.match(/\(([^)]+)\)/);
            if (m) return m[1];
          }
        }
      }
      return '';
    };

    var fromAttr = checkObj(pc.attributes);
    if (fromAttr) return fromAttr;
    var fromAbil = checkObj(pc.abilities);
    if (fromAbil) return fromAbil;

    return '';
  }

  // Determine categories to render based on character type
  function getActiveCategories() {
    var pc = getMergedCharacter(activeCharKey);
    if (pc && pc.type === 'Ghoul') {
      return GHOUL_CATEGORIES;
    }
    return KINDRED_CATEGORIES;
  }

  // Build Attribute <option> tags with live ratings
  function buildAttrOptions(charKey, selectedVal) {
    var html = '<option value="">-- Attribute --</option>';
    html += '<option value="None"' + (selectedVal === 'None' ? ' selected' : '') + '>None / Auto</option>';

    for (var grp in V20_ATTRS) {
      html += '<optgroup label="' + grp + '">';
      V20_ATTRS[grp].forEach(function(attr) {
        var dots = getAttrRating(charKey, attr);
        var isSel = (selectedVal === attr) ? ' selected' : '';
        html += '<option value="' + attr + '"' + isSel + '>' + attr + ' (' + dots + ')</option>';
      });
      html += '</optgroup>';
    }
    return html;
  }

  // Build Ability <option> tags with live ratings
  function buildAbilOptions(charKey, selectedVal) {
    var html = '<option value="None"' + (!selectedVal || selectedVal === 'None' ? ' selected' : '') + '>None (Raw Attribute)</option>';

    for (var grp in V20_ABILS) {
      html += '<optgroup label="' + grp + '">';
      V20_ABILS[grp].forEach(function(abil) {
        var dots = getAbilRating(charKey, abil);
        var isSel = (selectedVal === abil) ? ' selected' : '';
        html += '<option value="' + abil + '"' + isSel + '>' + abil + ' (' + dots + ')</option>';
      });
      html += '</optgroup>';
    }
    return html;
  }

  // Render 7-day cards structure
  function renderDaysContainer() {
    var container = document.getElementById('downtime-days-container');
    if (!container) return;

    var pc = getMergedCharacter(activeCharKey);
    var categories = getActiveCategories();
    var isGhoul = (pc.type === 'Ghoul');

    var html = '';
    DOWNTIME_DAYS.forEach(function(d) {
      html += '<div class="downtime-day-card" id="downtime-day-' + d.day + '">';
      html += '  <div class="downtime-day-header" onclick="toggleDowntimeDay(' + d.day + ')">';
      html += '    <div class="downtime-day-title">';
      html += '      <span class="downtime-day-badge">' + d.label + '</span>';
      html += '      <span class="downtime-day-date">' + d.date + '</span>';
      if (isGhoul) {
        html += '      <span style="font-size:11px;color:var(--gold);margin-left:8px;font-weight:400;">(Ghoul: 1 Primary Goal)</span>';
      }
      html += '    </div>';
      html += '    <span class="downtime-day-toggle-icon">&#9660;</span>';
      html += '  </div>';
      html += '  <div class="downtime-day-body">';

      categories.forEach(function(cat) {
        var initialAttr = cat.defaultAttr || 'Perception';
        var initialAbil = cat.defaultAbil || 'Alertness';

        html += '    <div class="downtime-action-group">';
        html += '      <div class="downtime-action-header">';
        html += '        <span class="downtime-action-title ' + cat.key + '">';
        html += '          <span>' + cat.emoji + '</span> ' + cat.title;
        html += '        </span>';
        html += '      </div>';
        html += '      <textarea class="downtime-textarea" data-day="' + d.day + '" data-cat="' + cat.key + '" placeholder="' + cat.descPlaceholder + '"></textarea>';

        // Dual Dropdown Dice Builder
        html += '      <div class="downtime-dice-builder" data-day="' + d.day + '" data-cat="' + cat.key + '">';
        html += '        <span class="downtime-roll-label">Roll:</span>';
        html += '        <select class="downtime-attr-select" data-day="' + d.day + '" data-cat="' + cat.key + '" onchange="onDiceDropdownChange(' + d.day + ', \'' + cat.key + '\')">';
        html +=            buildAttrOptions(activeCharKey, initialAttr);
        html += '        </select>';
        html += '        <span class="downtime-dice-plus">+</span>';
        html += '        <select class="downtime-abil-select" data-day="' + d.day + '" data-cat="' + cat.key + '" onchange="onDiceDropdownChange(' + d.day + ', \'' + cat.key + '\')">';
        html +=            buildAbilOptions(activeCharKey, initialAbil);
        html += '        </select>';
        html += '        <select class="downtime-diff-select" data-day="' + d.day + '" data-cat="' + cat.key + '" onchange="onDiceDropdownChange(' + d.day + ', \'' + cat.key + '\')">';
        html += '          <option value="Diff 4">Diff 4</option>';
        html += '          <option value="Diff 5">Diff 5</option>';
        html += '          <option value="Diff 6" selected>Diff 6 (Standard)</option>';
        html += '          <option value="Diff 7">Diff 7</option>';
        html += '          <option value="Diff 8">Diff 8</option>';
        html += '          <option value="Diff 9">Diff 9</option>';
        html += '          <option value="Auto 0">Auto 0 (Automatic)</option>';
        html += '        </select>';
        html += '        <span class="downtime-pool-badge" id="pool-badge-' + d.day + '-' + cat.key + '">0 Dice</span>';
        html += '        <span class="downtime-spec-badge" id="spec-badge-' + d.day + '-' + cat.key + '" style="display:none;"></span>';
        html += '        <button type="button" class="downtime-custom-roll-btn" title="Toggle custom roll input" onclick="toggleCustomRoll(' + d.day + ', \'' + cat.key + '\')">✏️ Custom</button>';
        html += '      </div>';

        // Hidden / Custom roll input for overrides or storage
        html += '      <input type="text" class="downtime-roll-input" data-day="' + d.day + '" data-cat="' + cat.key + '-roll" placeholder="Proposed roll string" style="display:none;margin-top:6px;">';
        html += '    </div>';
      });

      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;

    // Calculate initial pools for all rendered cards
    categories.forEach(function(cat) {
      DOWNTIME_DAYS.forEach(function(d) {
        recalculatePool(d.day, cat.key);
      });
    });
  }

  // Recalculate dice pool and update UI + hidden input
  function recalculatePool(day, catKey) {
    var attrSel = document.querySelector('.downtime-attr-select[data-day="' + day + '"][data-cat="' + catKey + '"]');
    var abilSel = document.querySelector('.downtime-abil-select[data-day="' + day + '"][data-cat="' + catKey + '"]');
    var diffSel = document.querySelector('.downtime-diff-select[data-day="' + day + '"][data-cat="' + catKey + '"]');
    var poolBadge = document.getElementById('pool-badge-' + day + '-' + catKey);
    var specBadge = document.getElementById('spec-badge-' + day + '-' + catKey);
    var rollInput = document.querySelector('.downtime-roll-input[data-day="' + day + '"][data-cat="' + catKey + '-roll"]');

    if (!attrSel || !abilSel || !poolBadge) return;

    var attrName = attrSel.value;
    var abilName = abilSel.value;
    var diffVal = diffSel ? diffSel.value : 'Diff 6';

    if (attrName === 'None') {
      poolBadge.textContent = 'Auto 0';
      if (specBadge) specBadge.style.display = 'none';
      if (rollInput && rollInput.style.display === 'none') {
        rollInput.value = 'Auto 0 (No roll required)';
      }
      return;
    }

    var attrDots = getAttrRating(activeCharKey, attrName);
    var abilDots = getAbilRating(activeCharKey, abilName);
    var totalPool = attrDots + (abilName === 'None' ? 0 : abilDots);

    // Specialties check
    var attrSpec = getTraitSpecialty(activeCharKey, attrName);
    var abilSpec = (abilName !== 'None') ? getTraitSpecialty(activeCharKey, abilName) : '';
    var specs = [];
    if (attrSpec) specs.push(attrSpec);
    if (abilSpec && abilSpec !== attrSpec) specs.push(abilSpec);

    poolBadge.textContent = totalPool + ' Dice (' + diffVal + ')';

    if (specBadge) {
      if (specs.length > 0) {
        specBadge.textContent = '★ ' + specs.join(', ');
        specBadge.style.display = 'inline-flex';
      } else {
        specBadge.style.display = 'none';
      }
    }

    // Update the formatted roll string
    if (rollInput && rollInput.style.display === 'none') {
      var rollStr = '';
      if (abilName && abilName !== 'None') {
        rollStr = attrName + ' (' + attrDots + ') + ' + abilName + ' (' + abilDots + ') = ' + totalPool + ' Dice (' + diffVal + ')';
      } else {
        rollStr = attrName + ' (' + attrDots + ') = ' + totalPool + ' Dice (' + diffVal + ')';
      }
      if (specs.length > 0) {
        rollStr += ' [★ ' + specs.join(', ') + ']';
      }
      rollInput.value = rollStr;
    }
  }

  // Global handler for dropdown change
  window.onDiceDropdownChange = function(day, catKey) {
    recalculatePool(day, catKey);
    saveDraftForCharacter(activeCharKey);
  };

  // Toggle custom roll freeform input
  window.toggleCustomRoll = function(day, catKey) {
    var rollInput = document.querySelector('.downtime-roll-input[data-day="' + day + '"][data-cat="' + catKey + '-roll"]');
    if (!rollInput) return;

    if (rollInput.style.display === 'none') {
      rollInput.style.display = 'block';
      rollInput.focus();
    } else {
      rollInput.style.display = 'none';
      recalculatePool(day, catKey);
    }
  };

  // Setup DOM Event Listeners
  function setupEventListeners() {
    var charSelect = document.getElementById('downtime-char-select');
    if (charSelect) {
      charSelect.addEventListener('change', function(e) {
        saveDraftForCharacter(activeCharKey);
        activeCharKey = e.target.value;
        renderDaysContainer();
        updateCharacterBanner();
        loadDraftForCharacter(activeCharKey);
      });
    }

    // Debounced live auto-save on input
    var container = document.getElementById('downtime-days-container');
    if (container) {
      container.addEventListener('input', function() {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(function() {
          saveDraftForCharacter(activeCharKey);
        }, 400);
      });
    }

    // Button: Submit Downtime
    var btnSubmit = document.getElementById('btn-submit-downtime');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', function() {
        submitDowntime();
      });
    }

    // Button: Clear Draft
    var btnClear = document.getElementById('btn-clear-draft');
    if (btnClear) {
      btnClear.addEventListener('click', function() {
        clearDowntimeDraft();
      });
    }
  }

  // Update Character Status Banner
  function updateCharacterBanner() {
    var banner = document.getElementById('downtime-status-banner');
    if (!banner) return;

    var pc = getMergedCharacter(activeCharKey);
    var healthClass = pc.is_injured ? 'health-warning' : 'health';
    var isGhoul = (pc.type === 'Ghoul');

    var html = '';
    html += '<div class="downtime-status-vitals">';
    html += '  <span class="downtime-vital-pill" style="border-color:rgba(212,175,55,0.4);color:var(--text-main);font-weight:700;">' + escapeHtml(pc.name) + '</span>';
    
    if (isGhoul) {
      html += '  <span class="downtime-vital-pill" style="border-color:rgba(59,130,246,0.4);color:#60a5fa;font-weight:600;">Ghoul</span>';
      html += '  <span class="downtime-vital-pill" style="background:rgba(212,175,55,0.12);color:var(--gold);">Domitor: ' + escapeHtml(pc.domitor || 'Coterie') + '</span>';
      html += '  <span class="downtime-vital-pill bp">Vitae: ' + escapeHtml(pc.blood_pool) + '</span>';
    } else {
      html += '  <span class="downtime-vital-pill badge-clan">' + escapeHtml(pc.clan) + '</span>';
      html += '  <span class="downtime-vital-pill" style="background:rgba(212,175,55,0.12);color:var(--gold);">' + escapeHtml(pc.generation) + ' Gen</span>';
      html += '  <span class="downtime-vital-pill bp">Blood: ' + escapeHtml(pc.blood_pool) + '</span>';
    }

    html += '  <span class="downtime-vital-pill wp">Willpower: ' + escapeHtml(pc.willpower) + '</span>';
    html += '  <span class="downtime-vital-pill ' + healthClass + '">Health: ' + escapeHtml(pc.health) + '</span>';
    html += '</div>';

    if (isGhoul) {
      html += '<div class="downtime-houserule-box" style="border-left-color:#60a5fa;background:rgba(59,130,246,0.08);">';
      html += '  <strong>Ghoul Downtime Rules:</strong> Ghouls do not hunt for blood and are allocated <strong>1 Primary Goal / Assignment per day</strong>.';
      html += '</div>';
    } else {
      html += '<div class="downtime-houserule-box">';
      html += '  <strong>ST House Rule:</strong> Heal additional Aggravated damage at 1 WP + 5 BP per level in a single day.';
      html += '</div>';
    }

    if (pc.notes) {
      html += '<div class="downtime-notes-box">';
      html += '  <strong>Active Context:</strong> ' + escapeHtml(pc.notes);
      html += '</div>';
    }

    banner.innerHTML = html;
  }

  // Toggle Day Card Accordion
  window.toggleDowntimeDay = function(dayNum) {
    var card = document.getElementById('downtime-day-' + dayNum);
    if (card) {
      card.classList.toggle('collapsed');
    }
  };

  // Collect current form data into structured object
  function collectFormData() {
    var daysData = [];
    var categories = getActiveCategories();
    var pc = getMergedCharacter(activeCharKey);
    var isGhoul = (pc.type === 'Ghoul');

    DOWNTIME_DAYS.forEach(function(d) {
      var dayObj = {
        day: d.day,
        label: d.label,
        date: d.date
      };

      if (isGhoul) {
        // Ghouls only have primary
        var pDesc = document.querySelector('.downtime-textarea[data-day="' + d.day + '"][data-cat="primary"]');
        var pRoll = document.querySelector('.downtime-roll-input[data-day="' + d.day + '"][data-cat="primary-roll"]');
        var pAttr = document.querySelector('.downtime-attr-select[data-day="' + d.day + '"][data-cat="primary"]');
        var pAbil = document.querySelector('.downtime-abil-select[data-day="' + d.day + '"][data-cat="primary"]');
        var pDiff = document.querySelector('.downtime-diff-select[data-day="' + d.day + '"][data-cat="primary"]');

        dayObj.feeding = { description: '', roll: '' };
        dayObj.primary = {
          description: pDesc ? pDesc.value.trim() : '',
          roll: pRoll ? pRoll.value.trim() : '',
          attr: pAttr ? pAttr.value : '',
          abil: pAbil ? pAbil.value : '',
          diff: pDiff ? pDiff.value : ''
        };
        dayObj.secondary = { description: '', roll: '' };
        dayObj.tertiary = { description: '', roll: '' };
      } else {
        // Kindred have all 4 categories
        KINDRED_CATEGORIES.forEach(function(cat) {
          var descEl = document.querySelector('.downtime-textarea[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');
          var rollEl = document.querySelector('.downtime-roll-input[data-day="' + d.day + '"][data-cat="' + cat.key + '-roll"]');
          var attrEl = document.querySelector('.downtime-attr-select[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');
          var abilEl = document.querySelector('.downtime-abil-select[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');
          var diffEl = document.querySelector('.downtime-diff-select[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');

          dayObj[cat.key] = {
            description: descEl ? descEl.value.trim() : '',
            roll: rollEl ? rollEl.value.trim() : '',
            attr: attrEl ? attrEl.value : '',
            abil: abilEl ? abilEl.value : '',
            diff: diffEl ? diffEl.value : ''
          };
        });
      }

      daysData.push(dayObj);
    });

    return daysData;
  }

  // Save draft for specific character to localStorage
  function saveDraftForCharacter(charKey) {
    try {
      var data = collectFormData();
      var storageKey = 'downtime_draft_' + charKey;
      localStorage.setItem(storageKey, JSON.stringify(data));

      var statusEl = document.getElementById('downtime-autosave-status');
      if (statusEl) {
        var now = new Date();
        var timeStr = now.toTimeString().split(' ')[0];
        statusEl.textContent = 'Draft auto-saved at ' + timeStr;
      }
    } catch (e) {
      console.warn('Unable to auto-save downtime draft:', e);
    }
  }

  // Load draft for specific character from localStorage
  function loadDraftForCharacter(charKey) {
    var storageKey = 'downtime_draft_' + charKey;
    var raw = null;
    try {
      raw = localStorage.getItem(storageKey);
    } catch (e) {
      console.warn('Unable to read downtime draft from localStorage:', e);
    }

    var data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse saved downtime draft:', err);
      }
    }

    var categories = getActiveCategories();

    DOWNTIME_DAYS.forEach(function(d) {
      var dayData = null;
      if (data && Array.isArray(data)) {
        dayData = data.find(function(item) { return item.day === d.day; });
      }

      categories.forEach(function(cat) {
        var descEl = document.querySelector('.downtime-textarea[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');
        var rollEl = document.querySelector('.downtime-roll-input[data-day="' + d.day + '"][data-cat="' + cat.key + '-roll"]');
        var attrSel = document.querySelector('.downtime-attr-select[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');
        var abilSel = document.querySelector('.downtime-abil-select[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');
        var diffSel = document.querySelector('.downtime-diff-select[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');

        if (dayData && dayData[cat.key]) {
          var item = dayData[cat.key];
          if (descEl && item.description !== undefined) descEl.value = item.description;
          if (rollEl && item.roll !== undefined) rollEl.value = item.roll;
          if (attrSel && item.attr) attrSel.value = item.attr;
          if (abilSel && item.abil) abilSel.value = item.abil;
          if (diffSel && item.diff) diffSel.value = item.diff;
        }

        recalculatePool(d.day, cat.key);
      });
    });

    var statusEl = document.getElementById('downtime-autosave-status');
    if (statusEl) {
      var charObj = getMergedCharacter(charKey);
      if (data) {
        statusEl.textContent = 'Loaded saved draft for ' + (charObj ? charObj.name : charKey);
      } else {
        statusEl.textContent = 'New draft ready';
      }
    }
  }

  // Clear/Reset Draft
  function clearDowntimeDraft() {
    var pc = getMergedCharacter(activeCharKey);
    var charName = pc ? pc.name : activeCharKey;
    if (!confirm('Are you sure you want to clear the downtime draft for ' + charName + '?')) {
      return;
    }

    try {
      localStorage.removeItem('downtime_draft_' + activeCharKey);
    } catch (e) {}

    document.querySelectorAll('#downtime-days-container .downtime-textarea').forEach(function(t) {
      t.value = '';
    });
    document.querySelectorAll('#downtime-days-container .downtime-roll-input').forEach(function(i) {
      i.value = '';
    });

    var categories = getActiveCategories();
    categories.forEach(function(cat) {
      DOWNTIME_DAYS.forEach(function(d) {
        recalculatePool(d.day, cat.key);
      });
    });

    var statusEl = document.getElementById('downtime-autosave-status');
    if (statusEl) statusEl.textContent = 'Draft cleared';

    showToast('Draft cleared for ' + charName, 'info');
  }

  // Submit Downtime (Direct, Seamless, 1-Click)
  function submitDowntime() {
    var pc = getMergedCharacter(activeCharKey);
    var data = collectFormData();

    var submittedAt = new Date().toISOString();
    var submissionId = 'sub_' + pc.id + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    var contentStr = JSON.stringify(data);
    var simpleHash = 0;
    for (var hIdx = 0; hIdx < contentStr.length; hIdx++) {
      simpleHash = ((simpleHash << 5) - simpleHash) + contentStr.charCodeAt(hIdx);
      simpleHash |= 0;
    }

    var payload = {
      submission_id: submissionId,
      window_id: 'post_session_24',
      character_id: pc.id,
      character: pc.name,
      sheet_name: pc.sheet_name,
      is_ghoul: (pc.type === 'Ghoul'),
      domitor: pc.domitor || '',
      submitted_at: submittedAt,
      timestamp: submittedAt,
      content_hash: 'h_' + Math.abs(simpleHash).toString(16),
      days: data.map(function(d) {
        return {
          day: d.day,
          feeding: d.feeding,
          primary: d.primary,
          secondary: d.secondary,
          tertiary: d.tertiary
        };
      })
    };

    var btnSubmit = document.getElementById('btn-submit-downtime');
    var originalText = '';
    if (btnSubmit) {
      originalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span> Submitting...';
    }

    // Determine target URL:
    // 1. Configured global webhook or localStorage webhook
    // 2. Local/hosted dashboard /api/downtime/submit
    var webhookUrl = (window.DOWNTIME_WEBHOOK_URL || '').trim();
    if (!webhookUrl) {
      try {
        webhookUrl = (localStorage.getItem('downtime_webhook_url') || '').trim();
      } catch (e) {}
    }

    var targetUrl = webhookUrl || '/api/downtime/submit';

    fetch(targetUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    })
    .then(function(res) {
      return res.text();
    })
    .then(function(text) {
      var json = null;
      try {
        json = JSON.parse(text);
      } catch (e) {}

      if (json && json.status === 'error') {
        throw new Error(json.message || 'Submission error');
      }

      var msg = (json && json.message) ? json.message : ('Downtime successfully saved in Google Sheet for ' + pc.name + '!');
      showToast('✅ ' + msg, 'success', 5000);
      saveDraftForCharacter(activeCharKey);
    })
    .catch(function(err) {
      console.error('Network submission failed:', err);
      // Save locally so work is never lost
      saveDraftForCharacter(activeCharKey);
      showToast('❌ Submission failed: ' + (err.message || 'Network error') + '. Draft saved locally.', 'error', 6000);
    })
    .finally(function() {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
      }
    });
  }

  // Toast Notification System
  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3500;

    var container = document.getElementById('codex-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'codex-toast-container';
      container.className = 'codex-toast-container';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'codex-toast ' + type;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose to window for inline HTML onclick handlers
  window.submitDowntime = submitDowntime;
  window.clearDowntimeDraft = clearDowntimeDraft;
  window.initDowntime = initDowntime;

})();
