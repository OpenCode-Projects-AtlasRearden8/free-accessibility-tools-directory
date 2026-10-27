/* Free Accessibility Tools - page logic.
   Written as a small UMD-ish module so the same file can run in the
   browser (DOM wiring) and in Node (the build's static card render and
   the dependency-free unit tests). */
(function (global) {
  'use strict';

  var CATEGORY_ORDER = [
    'screen-readers',
    'magnifiers',
    'dictation',
    'text-to-speech',
    'captioning',
    'dyslexia-fonts',
    'keyboard-only',
    'phone-builtins'
  ];

  var CATEGORY_META = {
    'screen-readers': {
      label: 'Screen readers',
      note: 'Hear the screen: menus, messages, and buttons spoken aloud so you can navigate without seeing it.'
    },
    'magnifiers': {
      label: 'Magnifiers',
      note: 'Enlarge whatever is on screen, from a small following lens to the whole display.'
    },
    'dictation': {
      label: 'Dictation',
      note: 'Speak instead of typing - messages, documents, even running the whole computer by voice.'
    },
    'text-to-speech': {
      label: 'Text to speech',
      note: 'Have written text spoken aloud so you can listen instead of reading.'
    },
    'captioning': {
      label: 'Captions',
      note: 'Turn spoken audio into readable text in real time, on the device you already own.'
    },
    'dyslexia-fonts': {
      label: 'Easier reading: fonts and calm page layouts',
      note: 'Reader-friendly fonts and decluttered pages that make reading less of a fight.'
    },
    'keyboard-only': {
      label: 'Keyboard-only helpers',
      note: 'Run the whole computer without reaching for the mouse.'
    },
    'phone-builtins': {
      label: 'Simpler phones and everyday settings',
      note: 'Accessibility modes and settings Apple and Google already ship with the phone.'
    }
  };

  var VERDICT_ORDER = ['start-here', 'easy', 'with-practice'];

  var VERDICT_META = {
    'start-here': { label: 'Start here', className: 'verdict-start' },
    'easy': { label: 'Easy win', className: 'verdict-easy' },
    'with-practice': { label: 'Worth practicing', className: 'verdict-practice' }
  };

  var FREE_META = {
    'built-in': 'Built in',
    'open-source': 'Open source',
    'freeware': 'Freeware'
  };

  var NEED_LABELS = {
    'blind': 'Blind',
    'low-vision': 'Low vision',
    'hard-of-hearing': 'Hard of hearing',
    'motor-dexterity': 'Motor & dexterity',
    'dyslexia-reading': 'Dyslexia & reading',
    'cognitive-focus': 'Focus & attention',
    'speech': 'Speech'
  };

  var PLATFORM_LABELS = {
    'windows': 'Windows PC',
    'macos': 'Mac',
    'ios': 'iPhone / iPad',
    'android': 'Android phone',
    'linux': 'Linux',
    'chrome': 'Chrome browser',
    'edge': 'Edge browser',
    'firefox': 'Firefox browser',
    'web': 'Any web browser'
  };

  var NEED_OPTIONS = [{ value: 'all', label: 'Everything' }].concat(
    Object.keys(NEED_LABELS).map(function (value) {
      return { value: value, label: NEED_LABELS[value] };
    })
  );

  var PLATFORM_OPTIONS = [{ value: 'any', label: 'Any device' }].concat(
    Object.keys(PLATFORM_LABELS).map(function (value) {
      return { value: value, label: PLATFORM_LABELS[value] };
    })
  );

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&' + 'amp;')
      .replace(/</g, '&' + 'lt;')
      .replace(/>/g, '&' + 'gt;')
      .replace(/"/g, '&' + 'quot;')
      .replace(/'/g, '&#39;');
  }

  function searchFields(tool) {
    return [
      tool.name,
      tool.oneLiner,
      tool.whatItDoes,
      tool.proofFree,
      tool.versionHint,
      tool.license || ''
    ].join(' ');
  }

  function matchesNeed(tool, need) {
    if (!need || need === 'all') return true;
    return Array.prototype.indexOf.call(tool.needs || [], need) !== -1;
  }

  function matchesPlatform(tool, platform) {
    if (!platform || platform === 'any') return true;
    return Array.prototype.indexOf.call(tool.platforms || [], platform) !== -1;
  }

  function matchesQuery(tool, query) {
    if (!query) return true;
    return searchFields(tool).toLowerCase().indexOf(String(query).toLowerCase()) !== -1;
  }

  function filterTools(tools, state) {
    var need = state && state.need ? state.need : 'all';
    var platform = state && state.platform ? state.platform : 'any';
    var query = state && state.q ? state.q : '';
    return tools.filter(function (tool) {
      return matchesNeed(tool, need) && matchesPlatform(tool, platform) && matchesQuery(tool, query);
    });
  }

  function compareTools(a, b) {
    var catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    var verdictDiff =
      VERDICT_ORDER.indexOf(a.beginnerVerdict.level) - VERDICT_ORDER.indexOf(b.beginnerVerdict.level);
    if (verdictDiff !== 0) return verdictDiff;
    var an = String(a.name).toLowerCase();
    var bn = String(b.name).toLowerCase();
    return an < bn ? -1 : an > bn ? 1 : 0;
  }

  function sortTools(tools) {
    return tools.slice().sort(compareTools);
  }

  function platformText(tool) {
    return (tool.platforms || [])
      .map(function (platform) {
        return PLATFORM_LABELS[platform] || platform;
      })
      .join(', ');
  }

  function renderCard(tool) {
    var verdict = VERDICT_META[tool.beginnerVerdict.level] || VERDICT_META['easy'];
    var sourcesHtml = (tool.sources || [])
      .map(function (source) {
        return (
          '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(source.label) +
          '</a>'
        );
      })
      .join('');
    var stats = [
      ['Why it is free', tool.proofFree],
      ['Works on', platformText(tool)],
      ['Version and limits', tool.versionHint]
    ];
    if (tool.license) stats.push(['License', tool.license]);
    var statsHtml = stats
      .map(function (pair) {
        return (
          '<li><span class="stat-label">' + escapeHtml(pair[0]) + '</span><b>' +
          escapeHtml(pair[1]) + '</b></li>'
        );
      })
      .join('');

    return (
      '<article class="card" data-tool-id="' + escapeHtml(tool.id) + '">' +
      '<header class="card-head">' +
      '<h3>' + escapeHtml(tool.name) + '</h3>' +
      '<p class="chips">' +
      '<span class="chip verdict-chip ' + verdict.className + '">' + escapeHtml(verdict.label) + '</span>' +
      '<span class="chip">' + escapeHtml(FREE_META[tool.freeStatus] || tool.freeStatus) + '</span>' +
      '</p>' +
      '</header>' +
      '<p class="blurb">' + escapeHtml(tool.oneLiner) + '</p>' +
      '<p class="does">' + escapeHtml(tool.whatItDoes) + '</p>' +
      '<p class="verdict ' + verdict.className + '"><b>' + escapeHtml(verdict.label) + '</b><span>' +
      escapeHtml(tool.beginnerVerdict.text) + '</span></p>' +
      '<ul class="stats">' + statsHtml + '</ul>' +
      '<footer class="card-foot">' + sourcesHtml +
      '<span class="checked">Checked ' + escapeHtml(tool.lastChecked) +
      ' - recheck due ' + escapeHtml(tool.recheckBy) + '</span>' +
      '</footer>' +
      '</article>'
    );
  }

  function renderSections(tools) {
    return CATEGORY_ORDER.map(function (category) {
      var group = tools.filter(function (tool) {
        return tool.category === category;
      });
      if (!group.length) return '';
      var meta = CATEGORY_META[category] || { label: category, note: '' };
      return (
        '<section class="category" data-category="' + escapeHtml(category) + '">' +
        '<h2>' + escapeHtml(meta.label) + '</h2>' +
        '<p class="category-note">' + escapeHtml(meta.note) + '</p>' +
        '<div class="card-grid">' +
        group
          .slice()
          .sort(compareTools)
          .map(renderCard)
          .join('') +
        '</div>' +
        '</section>'
      );
    }).join('');
  }

  function renderEmptyState() {
    return (
      '<div class="empty-state">' +
      '<h3>No card matches that combination yet</h3>' +
      '<p>Choose "Everything", clear the search box, or pick "Any device" - there is almost certainly a free tool here that helps.</p>' +
      '</div>'
    );
  }

  function renderApp(root, tools) {
    var state = { need: 'all', platform: 'any', q: '' };

    root.innerHTML =
      '<div class="controls">' +
      '<fieldset class="control-group need-chips">' +
      '<legend>I want help with</legend>' +
      '<div class="chip-row">' +
      NEED_OPTIONS.map(function (option) {
        var pressed = option.value === 'all' ? 'true' : 'false';
        return (
          '<button type="button" class="chip-btn" data-need="' + escapeHtml(option.value) +
          '" aria-pressed="' + pressed + '">' + escapeHtml(option.label) + '</button>'
        );
      }).join('') +
      '</div>' +
      '</fieldset>' +
      '<div class="control-group">' +
      '<label for="platform-filter">Device or browser</label>' +
      '<select id="platform-filter">' +
      PLATFORM_OPTIONS.map(function (option) {
        return '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + '</option>';
      }).join('') +
      '</select>' +
      '</div>' +
      '<div class="control-group control-grow">' +
      '<label for="tool-search">Search</label>' +
      '<input id="tool-search" type="search" placeholder=\'Try "captions" or "magnify"\' aria-label="Search tools">' +
      '</div>' +
      '</div>' +
      '<p id="result-count" class="result-count" role="status" aria-live="polite"></p>' +
      '<section id="cards" class="cards-area" aria-label="Tool cards"></section>';

    var chips = Array.prototype.slice.call(root.querySelectorAll('.chip-btn'));
    var platformSelect = root.querySelector('#platform-filter');
    var searchInput = root.querySelector('#tool-search');
    var cardsEl = root.querySelector('#cards');
    var countEl = root.querySelector('#result-count');

    function draw() {
      var visible = filterTools(tools, state);
      countEl.textContent = 'Showing ' + visible.length + ' of ' + tools.length + ' cards';
      cardsEl.innerHTML = visible.length ? renderSections(visible) : renderEmptyState();
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.need = chip.getAttribute('data-need');
        chips.forEach(function (other) {
          other.setAttribute('aria-pressed', other === chip ? 'true' : 'false');
        });
        draw();
      });
    });

    platformSelect.addEventListener('change', function () {
      state.platform = platformSelect.value;
      draw();
    });

    searchInput.addEventListener('input', function () {
      state.q = searchInput.value;
      draw();
    });

    draw();
  }

  function init() {
    if (typeof document === 'undefined' || !document.getElementById) return;
    var root = document.getElementById('app-root');
    var dataEl = document.getElementById('tools-data');
    if (!root || !dataEl) return;
    var data;
    try {
      data = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }
    var tools = Array.isArray(data) ? data : data && data.tools ? data.tools : [];
    if (!tools.length) return;
    renderApp(root, tools);
  }

  var api = {
    CATEGORY_ORDER: CATEGORY_ORDER,
    CATEGORY_META: CATEGORY_META,
    VERDICT_ORDER: VERDICT_ORDER,
    VERDICT_META: VERDICT_META,
    FREE_META: FREE_META,
    NEED_LABELS: NEED_LABELS,
    NEED_OPTIONS: NEED_OPTIONS,
    PLATFORM_LABELS: PLATFORM_LABELS,
    PLATFORM_OPTIONS: PLATFORM_OPTIONS,
    escapeHtml: escapeHtml,
    searchFields: searchFields,
    matchesNeed: matchesNeed,
    matchesPlatform: matchesPlatform,
    matchesQuery: matchesQuery,
    filterTools: filterTools,
    sortTools: sortTools,
    compareTools: compareTools,
    platformText: platformText,
    renderCard: renderCard,
    renderSections: renderSections,
    renderEmptyState: renderEmptyState,
    renderApp: renderApp,
    init: init
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.FreeAccessibilityApp = api;
  }

  if (typeof document !== 'undefined' && document.getElementById) {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
