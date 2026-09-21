/* LA by Night — Player Codex Downtime Planner Engine */
'use strict';

(function() {
  // 1. PC Configurations & Canon Metadata
  var DOWNTIME_PCS = {
    'liam_johnson': {
      id: 'liam_johnson',
      sheet_name: 'Liam_Johnson',
      name: 'Liam Johnson ("L.J.")',
      clan: 'Brujah',
      generation: '8th',
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
      blood_pool: '8/10',
      willpower: '5/7',
      health: 'Incapacitated (5 Aggravated Health Levels)',
      is_injured: true,
      notes: 'Healing 5 Aggravated levels requires 25 BP total + 1 day of rest per level unless spending 1 WP + 5 BP/level under the house rule. Chris Partlow has 1 Lethal wound remaining.'
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

  // 3. Four Distinct Action Categories per Day
  var DOWNTIME_CATEGORIES = [
    {
      key: 'feeding',
      title: 'Feeding / Hunting',
      emoji: '🩸',
      descPlaceholder: 'Where & how are you feeding? Vessel, approach, disciplines used...',
      rollPlaceholder: 'Proposed Dice Roll (e.g. Manipulation + Subterfuge Diff 5 / Herd Auto 0)'
    },
    {
      key: 'primary',
      title: 'Primary Action',
      emoji: '🎯',
      descPlaceholder: 'Main project, summit, research, or major task for the night...',
      rollPlaceholder: 'Proposed Dice Roll (e.g. Intelligence + Occult Diff 7 / Charisma + Leadership Diff 6)'
    },
    {
      key: 'secondary',
      title: 'Secondary Action',
      emoji: '⚡',
      descPlaceholder: 'Secondary undertaking or social check-in...',
      rollPlaceholder: 'Proposed Dice Roll (e.g. Wits + Streetwise Diff 6 / Dominate 2)'
    },
    {
      key: 'tertiary',
      title: 'Tertiary Action',
      emoji: '🔧',
      descPlaceholder: 'Minor routine, ghoul check, phone calls, or equipment upkeep...',
      rollPlaceholder: 'Proposed Dice Roll (e.g. Perception + Alertness Diff 6 / None)'
    }
  ];

  var activeCharKey = 'liam_johnson';
  var autoSaveTimer = null;

  // Initialize Downtime Planner
  document.addEventListener('DOMContentLoaded', function() {
    initDowntime();
  });

  function initDowntime() {
    renderDaysContainer();
    setupEventListeners();
    updateCharacterBanner();
    loadDraftForCharacter(activeCharKey);
  }

  // Render 7-day cards structure
  function renderDaysContainer() {
    var container = document.getElementById('downtime-days-container');
    if (!container) return;

    var html = '';
    DOWNTIME_DAYS.forEach(function(d, idx) {
      html += '<div class="downtime-day-card" id="downtime-day-' + d.day + '">';
      html += '  <div class="downtime-day-header" onclick="toggleDowntimeDay(' + d.day + ')">';
      html += '    <div class="downtime-day-title">';
      html += '      <span class="downtime-day-badge">' + d.label + '</span>';
      html += '      <span class="downtime-day-date">' + d.date + '</span>';
      html += '    </div>';
      html += '    <span class="downtime-day-toggle-icon">&#9660;</span>';
      html += '  </div>';
      html += '  <div class="downtime-day-body">';

      DOWNTIME_CATEGORIES.forEach(function(cat) {
        html += '    <div class="downtime-action-group">';
        html += '      <div class="downtime-action-header">';
        html += '        <span class="downtime-action-title ' + cat.key + '">';
        html += '          <span>' + cat.emoji + '</span> ' + cat.title;
        html += '        </span>';
        html += '      </div>';
        html += '      <textarea class="downtime-textarea" data-day="' + d.day + '" data-cat="' + cat.key + '" placeholder="' + cat.descPlaceholder + '"></textarea>';
        html += '      <div class="downtime-roll-wrap">';
        html += '        <span class="downtime-roll-label">Roll:</span>';
        html += '        <input type="text" class="downtime-roll-input" data-day="' + d.day + '" data-cat="' + cat.key + '-roll" placeholder="' + cat.rollPlaceholder + '">';
        html += '      </div>';
        html += '    </div>';
      });

      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  // Setup DOM Event Listeners
  function setupEventListeners() {
    var charSelect = document.getElementById('downtime-char-select');
    if (charSelect) {
      charSelect.addEventListener('change', function(e) {
        // Save previous character's draft before switching
        saveDraftForCharacter(activeCharKey);
        activeCharKey = e.target.value;
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

    // Button: Submit to Google Sheet
    var btnSubmit = document.getElementById('btn-submit-downtime');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', function() {
        submitDowntimeToSheet();
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

    var pc = DOWNTIME_PCS[activeCharKey] || DOWNTIME_PCS['liam_johnson'];

    var healthClass = pc.is_injured ? 'health-warning' : 'health';

    var html = '';
    html += '<div class="downtime-status-vitals">';
    html += '  <span class="downtime-vital-pill" style="border-color:rgba(212,175,55,0.4);color:var(--text-main);font-weight:700;">' + escapeHtml(pc.name) + '</span>';
    html += '  <span class="downtime-vital-pill badge-clan">' + escapeHtml(pc.clan) + '</span>';
    html += '  <span class="downtime-vital-pill" style="background:rgba(212,175,55,0.12);color:var(--gold);">' + escapeHtml(pc.generation) + ' Gen</span>';
    html += '  <span class="downtime-vital-pill bp">Blood: ' + escapeHtml(pc.blood_pool) + '</span>';
    html += '  <span class="downtime-vital-pill wp">Willpower: ' + escapeHtml(pc.willpower) + '</span>';
    html += '  <span class="downtime-vital-pill ' + healthClass + '">Health: ' + escapeHtml(pc.health) + '</span>';
    html += '</div>';

    html += '<div class="downtime-houserule-box">';
    html += '  <strong>ST House Rule:</strong> Heal additional Aggravated damage at 1 WP + 5 BP per level in a single day.';
    html += '</div>';

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
    DOWNTIME_DAYS.forEach(function(d) {
      var dayObj = {
        day: d.day,
        label: d.label,
        date: d.date
      };

      DOWNTIME_CATEGORIES.forEach(function(cat) {
        var descEl = document.querySelector('.downtime-textarea[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');
        var rollEl = document.querySelector('.downtime-roll-input[data-day="' + d.day + '"][data-cat="' + cat.key + '-roll"]');

        dayObj[cat.key] = {
          description: descEl ? descEl.value.trim() : '',
          roll: rollEl ? rollEl.value.trim() : ''
        };
      });

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

    DOWNTIME_DAYS.forEach(function(d) {
      var dayData = null;
      if (data && Array.isArray(data)) {
        dayData = data.find(function(item) { return item.day === d.day; });
      }

      DOWNTIME_CATEGORIES.forEach(function(cat) {
        var descEl = document.querySelector('.downtime-textarea[data-day="' + d.day + '"][data-cat="' + cat.key + '"]');
        var rollEl = document.querySelector('.downtime-roll-input[data-day="' + d.day + '"][data-cat="' + cat.key + '-roll"]');

        if (descEl) {
          descEl.value = (dayData && dayData[cat.key] && dayData[cat.key].description) ? dayData[cat.key].description : '';
        }
        if (rollEl) {
          rollEl.value = (dayData && dayData[cat.key] && dayData[cat.key].roll) ? dayData[cat.key].roll : '';
        }
      });
    });

    var statusEl = document.getElementById('downtime-autosave-status');
    if (statusEl) {
      if (data) {
        statusEl.textContent = 'Loaded saved draft for ' + (DOWNTIME_PCS[charKey] ? DOWNTIME_PCS[charKey].name : charKey);
      } else {
        statusEl.textContent = 'New draft ready';
      }
    }
  }

  // Clear/Reset Draft
  function clearDowntimeDraft() {
    var pc = DOWNTIME_PCS[activeCharKey];
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

    var statusEl = document.getElementById('downtime-autosave-status');
    if (statusEl) statusEl.textContent = 'Draft cleared';

    showToast('Draft cleared for ' + charName, 'info');
  }

  // Submit Downtime to Google Sheet via Webhook
  function submitDowntimeToSheet() {
    var webhookUrl = '';
    try {
      webhookUrl = (localStorage.getItem('downtime_webhook_url') || '').trim();
    } catch (e) {}

    if (!webhookUrl) {
      openWebhookModal();
      showToast('Please configure your Google Apps Script Webhook URL first.', 'error');
      return;
    }

    var pc = DOWNTIME_PCS[activeCharKey] || DOWNTIME_PCS['liam_johnson'];
    var data = collectFormData();

    var submittedAt = new Date().toISOString();
    var submissionId = 'sub_' + pc.id + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    var contentStr = JSON.stringify(data);
    var simpleHash = 0;
    for (var hIdx = 0; hIdx < contentStr.length; hIdx++) {
      simpleHash = ((simpleHash << 5) - simpleHash) + contentStr.charCodeAt(hIdx);
      simpleHash |= 0;
    }

    // Prepare payload with unique identifier and metadata
    var payload = {
      submission_id: submissionId,
      window_id: 'post_session_24',
      character_id: pc.id,
      character: pc.name,
      sheet_name: pc.sheet_name,
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

    fetch(webhookUrl, {
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
      } catch (e) {
        // In case of opaque response or plain text
      }

      if (json && json.status === 'error') {
        throw new Error(json.message || 'Server error');
      }

      var msg = (json && json.message) ? json.message : ('Downtime successfully saved for ' + pc.name + '!');
      showToast('✅ ' + msg, 'success');

      // Save draft timestamp
      saveDraftForCharacter(activeCharKey);
    })
    .catch(function(err) {
      console.error('Submission error:', err);
      showToast('⚠️ Submission failed: ' + err.message, 'error');
    })
    .finally(function() {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
      }
    });
  }

  // Webhook Modal Helpers
  window.openWebhookModal = function() {
    var modal = document.getElementById('downtime-webhook-modal');
    var input = document.getElementById('input-webhook-url');
    if (input) {
      try {
        input.value = localStorage.getItem('downtime_webhook_url') || '';
      } catch (e) {}
    }
    if (modal) modal.classList.add('active');
  };

  window.closeWebhookModal = function() {
    var modal = document.getElementById('downtime-webhook-modal');
    if (modal) modal.classList.remove('active');
  };

  window.saveWebhookUrl = function() {
    var input = document.getElementById('input-webhook-url');
    if (!input) return;
    var url = input.value.trim();
    try {
      localStorage.setItem('downtime_webhook_url', url);
      showToast('Webhook URL saved successfully!', 'success');
      closeWebhookModal();
    } catch (e) {
      showToast('Failed to save to localStorage: ' + e, 'error');
    }
  };

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

})();
