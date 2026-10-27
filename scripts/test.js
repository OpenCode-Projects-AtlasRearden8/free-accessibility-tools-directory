#!/usr/bin/env node
'use strict';

/* No-dependency test suite for the free-accessibility-tools-directory.
   Validates:
     1. data/tools.json schema + content rules (fields, enums, dates, official
        hosts only, no affiliate patterns, fresh recheck-by dates)
     2. the pure filter/render logic in assets/app.js
     3. the built page: embedded data, offline assets, static (works-without-JS)
        cards, licensing/disclaimer lines, freshness of the built index.html
   Run with: node scripts/test.js */

const fs = require('fs');
const path = require('path');
const app = require('../assets/app.js');
const build = require('./build.js');

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log('PASS  ' + name);
  } else {
    failed++;
    console.log('FAIL  ' + name + (detail ? ' :: ' + detail : ''));
  }
}

function section(title) {
  console.log('\n=== ' + title + ' ===');
}

/* ---------- 1. Schema + content rules ---------- */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_VALUES = [
  'screen-readers', 'magnifiers', 'dictation', 'text-to-speech',
  'captioning', 'dyslexia-fonts', 'keyboard-only', 'phone-builtins'
];
const NEED_VALUES = ['blind', 'low-vision', 'hard-of-hearing', 'motor-dexterity', 'dyslexia-reading', 'cognitive-focus', 'speech'];
const PLATFORM_VALUES = ['windows', 'macos', 'ios', 'android', 'linux', 'chrome', 'edge', 'firefox', 'web'];
const FREE_VALUES = ['built-in', 'open-source', 'freeware'];
const VERDICT_LEVELS = ['start-here', 'easy', 'with-practice'];
const AFFILIATE_RE = /[?&]ref=|amazon|clickbank|hop\.clickbank|\.taffer|\/aff\//i;
const SECRET_RE = /(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|api[_-]?key\s*[:=]\s*["'][^"']{4,}|bearer\s+[a-zA-Z0-9._-]{15,})/i;

function hostOf(url) {
  return String(url).replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
}

function isValidDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function isFutureDate(value) {
  return isValidDate(value) && new Date(value + 'T00:00:00Z') > new Date();
}

function hostMatchesOfficial(host, domains) {
  return domains.some(function (domain) {
    return host === domain || host.endsWith('.' + domain);
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const data = JSON.parse(fs.readFileSync(build.PATHS.data, 'utf8'));
const meta = data.meta || {};
const tools = Array.isArray(data.tools) ? data.tools : [];

section('JSON schema: data/tools.json');

check('tools.json parses with a meta block and non-empty tools array',
  !!(data.meta && tools.length), 'tools=' + tools.length);

check('at least 25 tools so the directory is useful', tools.length >= 25, 'len=' + tools.length);

check('covers all eight categories',
  CATEGORY_VALUES.every(function (c) { return tools.some(function (t) { return t.category === c; }); }),
  'expected=' + CATEGORY_VALUES.join(','));

check('meta is credited to Asdale Dynamics, LLC', meta.maintainer === 'Asdale Dynamics, LLC', String(meta.maintainer));

check('meta policy renounces affiliate links', typeof meta.policy === 'string' && /affiliat/i.test(meta.policy));

check('meta dates are valid, updatedOn not in the future, nextFullRecheck still ahead',
  isValidDate(meta.updatedOn) && !isFutureDate(meta.updatedOn) &&
  isValidDate(meta.nextFullRecheck) && meta.nextFullRecheck >= todayISO() &&
  meta.nextFullRecheck > meta.updatedOn,
  'updatedOn=' + meta.updatedOn + ' nextFullRecheck=' + meta.nextFullRecheck);

const idsSeen = {};
const errors = [];

tools.forEach(function (t, index) {
  const where = 'tool[' + index + '(' + (t.id || '?') + ')]';

  const required = ['id', 'name', 'category', 'platforms', 'freeStatus', 'oneLiner', 'whatItDoes',
    'proofFree', 'beginnerVerdict', 'sources', 'officialDomains', 'versionHint', 'needs', 'lastChecked', 'recheckBy'];
  required.forEach(function (key) {
    if (!(key in t)) errors.push(where + ' missing field ' + key);
  });

  if (typeof t.id !== 'string' || !/^[a-z0-9-]+$/.test(t.id)) errors.push(where + ' bad id slug');
  if (idsSeen[t.id]) errors.push(where + ' duplicate id');
  idsSeen[t.id] = true;

  if (typeof t.name !== 'string' || t.name.length < 2 || t.name.length > 120) errors.push(where + ' bad name');
  if (typeof t.oneLiner !== 'string' || t.oneLiner.length < 10 || t.oneLiner.length > 220) errors.push(where + ' oneLiner length');
  if (typeof t.whatItDoes !== 'string' || t.whatItDoes.length < 40 || t.whatItDoes.length > 900) errors.push(where + ' whatItDoes length');
  if (typeof t.proofFree !== 'string' || t.proofFree.length < 40 || t.proofFree.length > 700) errors.push(where + ' proofFree length');
  if (typeof t.versionHint !== 'string' || t.versionHint.length < 2 || t.versionHint.length > 160) errors.push(where + ' bad versionHint');

  if (CATEGORY_VALUES.indexOf(t.category) === -1) errors.push(where + ' bad category: ' + t.category);

  if (!Array.isArray(t.platforms) || t.platforms.length < 1 || t.platforms.length > 5 ||
      t.platforms.some(function (p) { return PLATFORM_VALUES.indexOf(p) === -1; })) {
    errors.push(where + ' bad platforms');
  }

  if (FREE_VALUES.indexOf(t.freeStatus) === -1) errors.push(where + ' bad freeStatus: ' + t.freeStatus);

  if (typeof t.license !== 'undefined' &&
      (typeof t.license !== 'string' || t.license.length < 3 || t.license.length > 90)) {
    errors.push(where + ' bad license');
  }

  const verdict = t.beginnerVerdict || {};
  if (!verdict || VERDICT_LEVELS.indexOf(verdict.level) === -1 ||
      typeof verdict.text !== 'string' || verdict.text.length < 10 || verdict.text.length > 500) {
    errors.push(where + ' bad beginnerVerdict');
  }

  if (!Array.isArray(t.needs) || t.needs.length < 1 || t.needs.length > 4 ||
      t.needs.some(function (n) { return NEED_VALUES.indexOf(n) === -1; })) {
    errors.push(where + ' bad needs');
  }

  if (!Array.isArray(t.sources) || t.sources.length < 1 || t.sources.length > 3) {
    errors.push(where + ' bad source count');
  } else {
    t.sources.forEach(function (source) {
      if (!source || typeof source.label !== 'string' || source.label.length < 3 || source.label.length > 140 ||
          typeof source.url !== 'string' || !/^https:\/\//.test(source.url)) {
        errors.push(where + ' malformed or non-https source link: ' + (source && source.url));
      } else if (!hostMatchesOfficial(hostOf(source.url), t.officialDomains || [])) {
        errors.push(where + ' link host outside officialDomains: ' + source.url);
      }
    });
  }

  if (!Array.isArray(t.officialDomains) || t.officialDomains.length < 1 || t.officialDomains.length > 4 ||
      t.officialDomains.some(function (d) { return typeof d !== 'string' || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d); })) {
    errors.push(where + ' bad officialDomains');
  }

  if (!isValidDate(t.lastChecked) || isFutureDate(t.lastChecked)) errors.push(where + ' bad lastChecked');
  if (!isValidDate(t.recheckBy) || t.recheckBy < t.lastChecked) errors.push(where + ' recheckBy must follow lastChecked');
  if (isValidDate(t.recheckBy) && new Date(t.recheckBy + 'T00:00:00Z') < new Date()) {
    /* Intentionally strict: if this fails, the recheck dates have lapsed and the
       whole list needs its quarterly pass (see README recheck routine). */
    errors.push(where + ' recheckBy has passed - time for the scheduled recheck');
  }

  if (AFFILIATE_RE.test(JSON.stringify(t))) errors.push(where + ' affiliate-style pattern found');
});

check('every tool passes all field rules', errors.length === 0, errors.join(' | '));

check('recheck dates present on every card (per-card freshness)',
  tools.every(function (t) { return ISO_DATE.test(t.recheckBy || '') && ISO_DATE.test(t.lastChecked || ''); }));

check('every card synchronizes with the meta dates',
  tools.every(function (t) { return t.lastChecked <= meta.updatedOn && t.recheckBy >= meta.nextFullRecheck; }),
  'meta.updatedOn=' + meta.updatedOn + ' meta.nextFullRecheck=' + meta.nextFullRecheck);

const verdictCounts = tools.reduce(function (acc, t) {
  const level = t.beginnerVerdict && t.beginnerVerdict.level;
  acc[level] = (acc[level] || 0) + 1;
  return acc;
}, {});
check('enough beginner start-here verdicts to anchor the page', (verdictCounts['start-here'] || 0) >= 5,
  JSON.stringify(verdictCounts));

check('labels exist for every need / platform / verdict / category actually used',
  tools.every(function (t) {
    return t.needs.every(function (n) { return app.NEED_LABELS[n]; }) &&
      t.platforms.every(function (p) { return app.PLATFORM_LABELS[p]; }) &&
      app.CATEGORY_META[t.category] &&
      app.VERDICT_META[t.beginnerVerdict.level] &&
      app.FREE_META[t.freeStatus];
  }));

/* ---------- 2. Pure logic in assets/app.js ---------- */

section('Page logic: assets/app.js');

const escaped = app.escapeHtml('<img src=x> & " \' ');
check('escapeHtml neutralizes markup', escaped.indexOf('<img') === -1 &&
  escaped.indexOf('lt;') !== -1 && escaped.indexOf('&') !== -1);

const noFilters = app.filterTools(tools, { need: 'all', platform: 'any', q: '' });
check('filterTools with no filters returns all tools', noFilters.length === tools.length);

const blindOnly = app.filterTools(tools, { need: 'blind', platform: 'any', q: '' });
const manualBlind = tools.filter(function (t) { return t.needs.indexOf('blind') !== -1; });
check('need filter isolates the blind-need cards exactly',
  blindOnly.length === manualBlind.length && blindOnly.length > 0 &&
  blindOnly.every(function (t) { return t.needs.indexOf('blind') !== -1; }),
  'len=' + blindOnly.length);

const iosOnly = app.filterTools(tools, { need: 'all', platform: 'ios', q: '' });
const manualIos = tools.filter(function (t) { return t.platforms.indexOf('ios') !== -1; });
check('platform filter isolates iOS cards exactly',
  iosOnly.length === manualIos.length && iosOnly.length > 0 &&
  iosOnly.every(function (t) { return t.platforms.indexOf('ios') !== -1; }),
  'len=' + iosOnly.length);

const combo = app.filterTools(tools, { need: 'hard-of-hearing', platform: 'windows', q: '' });
check('combined need+platform filter stays correct',
  combo.length > 0 && combo.every(function (t) {
    return t.needs.indexOf('hard-of-hearing') !== -1 && t.platforms.indexOf('windows') !== -1;
  }));

const searched = app.filterTools(tools, { need: 'all', platform: 'any', q: 'magnify' });
check('search finds magnifier content', searched.length >= 1 &&
  searched.some(function (t) { return app.searchFields(t).toLowerCase().indexOf('magnify') !== -1; }));

const gibberish = app.filterTools(tools, { need: 'all', platform: 'any', q: 'zzzzqqq' });
check('nonsense search returns empty state path', gibberish.length === 0);

check('filtering is monotonic (a specific filter is a subset of "all")',
  blindOnly.length < noFilters.length && blindOnly.every(function (t) { return noFilters.indexOf(t) !== -1; }));

const sorted = app.sortTools(tools);
const sortedOk = sorted.every(function (t, i) {
  const prev = sorted[i - 1];
  if (!prev) return true;
  const catPrev = app.CATEGORY_ORDER.indexOf(prev.category);
  const catNow = app.CATEGORY_ORDER.indexOf(t.category);
  if (catPrev !== catNow) return catPrev < catNow;
  const verdictPrev = app.VERDICT_ORDER.indexOf(prev.beginnerVerdict.level);
  const verdictNow = app.VERDICT_ORDER.indexOf(t.beginnerVerdict.level);
  if (verdictPrev !== verdictNow) return verdictPrev < verdictNow;
  return prev.name.toLowerCase() <= t.name.toLowerCase();
});
check('sortTools orders by category, then verdict, then name', sortedOk && sorted.length === tools.length);

const groupedVerdictOk = app.CATEGORY_ORDER.every(function (category) {
  const group = sorted.filter(function (t) { return t.category === category; });
  return group.every(function (t, i) {
    return i === 0 ||
      app.VERDICT_ORDER.indexOf(group[i - 1].beginnerVerdict.level) <=
      app.VERDICT_ORDER.indexOf(t.beginnerVerdict.level);
  });
});
check('within every category the friendliest verdicts lead', groupedVerdictOk);

const sections = app.renderSections(tools);
check('renderSections emits a card section for each category',
  (sections.match(/class="category"/g) || []).length === app.CATEGORY_ORDER.length);
check('renderSections emits exactly one card per tool',
  (sections.match(/<article/g) || []).length === tools.length,
  'articles=' + (sections.match(/<article/g) || []).length);

let cardChecksOk = true;
const cardDetails = [];
tools.forEach(function (t) {
  const card = app.renderCard(t);
  const bits = {
    hasArticle: card.indexOf('<article') === 0,
    hasId: card.indexOf('data-tool-id="' + t.id + '"') !== -1,
    hasName: card.indexOf(app.escapeHtml(t.name)) !== -1,
    hasOneLiner: card.indexOf(app.escapeHtml(t.oneLiner)) !== -1,
    hasProof: card.indexOf(app.escapeHtml(t.proofFree)) !== -1,
    hasRecheck: card.indexOf(t.recheckBy) !== -1,
    hasChecked: card.indexOf('Checked ' + t.lastChecked) !== -1,
    hasVerdict: card.indexOf(app.VERDICT_META[t.beginnerVerdict.level].label) !== -1,
    linkCount: (card.match(/<a href=/g) || []).length === t.sources.length,
    targetsBlank: card.indexOf('target="_blank"') !== -1 && card.indexOf('rel="noopener noreferrer"') !== -1,
    clean: card.indexOf('undefined') === -1 && card.indexOf('[object') === -1
  };
  if (!Object.keys(bits).every(function (k) { return bits[k]; })) {
    cardChecksOk = false;
    cardDetails.push(t.id + ' :: ' + JSON.stringify(bits));
  }
});
check('renderCard produces complete HTML for every tool', cardChecksOk, cardDetails.join(' | '));

check('renderSections of an empty set collapses to empty string',
  app.renderSections(app.filterTools(tools, { need: 'all', platform: 'any', q: 'zzzzqqq' })) === '');
check('empty state copy mentions the way back',
  app.renderEmptyState().indexOf('Everything') !== -1);

/* ---------- 3. Built page: offline single file ---------- */

section('Built page: index.html');

let indexHtml = null;
try {
  indexHtml = fs.readFileSync(build.PATHS.output, 'utf8');
} catch (e) {
  /* handled below */
}

check('index.html exists (run: npm run build)', indexHtml !== null);
if (indexHtml) {
  const rendered = build.render(build.loadSources());
  check('index.html is up to date with sources (not stale)',
    rendered === indexHtml, 'stale file - run "npm run build" then re-commit');

  check('starts with a doctype', /^<!doctype html>/i.test(indexHtml.trim()));
  check('has utf-8 charset', /charset=["']?utf-8/i.test(indexHtml));
  check('declares English language', /<html lang="en">/.test(indexHtml));
  check('title mentions the directory', /<title>[^<]*Free Accessibility Tools/i.test(indexHtml));

  /* Counts must ignore the verbatim-embedded app.js source (which legitimately
     contains those markup strings), so only scan the static markup that lives
     before the first script tag. */
  const scriptStart = indexHtml.indexOf('<script id="tools-data"');
  const staticHtml = scriptStart > -1 ? indexHtml.slice(0, scriptStart) : indexHtml;

  check('exactly one h1', (staticHtml.match(/<h1[ >]/g) || []).length === 1);
  check('one h2 heading per category', (staticHtml.match(/<h2[ >]/g) || []).length === app.CATEGORY_ORDER.length,
    'h2s=' + (staticHtml.match(/<h2[ >]/g) || []).length);

  const articleCount = (staticHtml.match(/<article/g) || []).length;
  check('static cards baked in for JavaScript-off readers',
    articleCount === tools.length, 'articles=' + articleCount);
  check('static category sections present',
    (staticHtml.match(/<section class="category"/g) || []).length === app.CATEGORY_ORDER.length);

  const jsonMatch = indexHtml.match(/<script id="tools-data" type="application\/json">([\s\S]*?)<\/script>/);
  check('embedded tools JSON present in its own script tag', !!jsonMatch);
  if (jsonMatch) {
    let embeddedOk = false;
    let embedded = null;
    try {
      embedded = JSON.parse(jsonMatch[1]);
      embeddedOk = JSON.stringify(embedded) === JSON.stringify(data);
    } catch (e) { embeddedOk = false; }
    check('embedded JSON parses and equals data/tools.json', embeddedOk);
    check('no "<" survives inside embedded JSON (script-safe escaping)',
      jsonMatch[1].indexOf('<') === -1);
  }

  const appSource = fs.readFileSync(build.PATHS.app, 'utf8');
  const styleSource = fs.readFileSync(build.PATHS.styles, 'utf8');
  check('app.js source embedded verbatim (same file as tested)', indexHtml.includes(appSource));
  check('styles embedded verbatim', indexHtml.includes(styleSource));

  check('no external script/link/img/iframe sources (fully offline)',
    !/(?:script|img|iframe|source)\b[^>]*\b(src|href)\s*=\s*["']?https?:/i.test(indexHtml) &&
    !/<link\b[^>]*\bhref\s*=\s*["']?https?:/i.test(indexHtml) &&
    !/<(?:script|img|iframe|link|source)\b[^>]*\b(src|href)\s*=\s*["']\/\/[^"']/i.test(indexHtml));

  check('every card source URL appears in the page',
    tools.every(function (t) { return t.sources.every(function (s) { return indexHtml.indexOf(s.url) !== -1; }); }));

  check('need chips + platform select + search are labeled and wired',
    /id="app-root"/.test(indexHtml) &&
    appSource.includes('for="platform-filter"') &&
    appSource.includes('chip-btn') && appSource.includes('data-need') &&
    appSource.includes('aria-pressed') &&
    appSource.includes('role="status"'));

  check('results counter updates politely',
    indexHtml.includes('aria-live="polite"'));

  check('no affiliate or store links in the page',
    AFFILIATE_RE.test(indexHtml) === false);

  check('license + credit line present inside the page footer',
    indexHtml.includes('Copyright (c) 2026 Asdale Dynamics, LLC') &&
    indexHtml.includes('MIT License'));

  check('plain-English disclaimers present',
    indexHtml.includes('not medical, legal, or financial advice') &&
    indexHtml.includes('Educational information only'));

  check('companion kit is credited by name',
    indexHtml.includes('Free Large-Print Tech Kit'));

  check('dashed-control characters cleaned from output',
    indexHtml.indexOf('%%') === -1);

  check('intro carries the update and recheck dates',
    indexHtml.indexOf(meta.updatedOn) !== -1 && indexHtml.indexOf(meta.nextFullRecheck) !== -1);

  check('no secrets committed into page or data',
    !SECRET_RE.test(indexHtml) && !SECRET_RE.test(JSON.stringify(data)));

  const kb = (Buffer.byteLength(indexHtml, 'utf8') / 1024).toFixed(1);
  check('single-file size stays lean for offline sharing (< 250 KB)', Number(kb) < 250, kb + ' KB');
}

/* ---------- Summary ---------- */

console.log('\n' + (failed === 0 ? 'ALL PASS' : 'FAILURES: ' + failed) +
  '  (' + passed + ' passed, ' + failed + ' failed)');
process.exit(failed === 0 ? 0 : 1);
