#!/usr/bin/env node
'use strict';

/* Build script assembles the single offline index.html from:
     template.html + assets/styles.css + assets/app.js + data/tools.json
   Cards are also rendered statically at build time, so the page remains
   readable with JavaScript switched off. No dependencies, no network. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  template: path.join(ROOT, 'template.html'),
  styles: path.join(ROOT, 'assets', 'styles.css'),
  app: path.join(ROOT, 'assets', 'app.js'),
  data: path.join(ROOT, 'data', 'tools.json'),
  output: path.join(ROOT, 'index.html')
};

const app = require(PATHS.app);

function loadSources() {
  return {
    template: fs.readFileSync(PATHS.template, 'utf8'),
    styles: fs.readFileSync(PATHS.styles, 'utf8'),
    app: fs.readFileSync(PATHS.app, 'utf8'),
    data: JSON.parse(fs.readFileSync(PATHS.data, 'utf8'))
  };
}

/* Inline JSON goes into <script type="application/json">. Escaping "<"
   prevents "</script" from appearing inside the payload while remaining
   valid JSON - it still parses back to the identical object. */
function embedJson(data) {
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

function validateSources(sources) {
  const markers = ['%%STYLES%%', '%%CARDS%%', '%%TOOLS_JSON%%', '%%APP_JS%%', '%%UPDATED_ON%%', '%%NEXT_RECHECK%%'];
  markers.forEach(function (marker) {
    if (!sources.template.includes(marker)) {
      throw new Error('template.html is missing the ' + marker + ' marker');
    }
  });
  if (/<\/script/i.test(sources.app)) {
    throw new Error('assets/app.js must not contain a literal closing script tag');
  }
  if (/<\/style/i.test(sources.styles)) {
    throw new Error('assets/styles.css must not contain a literal closing style tag');
  }
  if (!sources.data || !Array.isArray(sources.data.tools) || sources.data.tools.length === 0) {
    throw new Error('data/tools.json must contain a non-empty tools array');
  }
  if (!sources.data.meta || !sources.data.meta.updatedOn || !sources.data.meta.nextFullRecheck) {
    throw new Error('data/tools.json meta needs updatedOn and nextFullRecheck dates');
  }
}

function render(sources) {
  validateSources(sources);

  let html = sources.template
    .replace('%%STYLES%%', sources.styles)
    .replace('%%CARDS%%', app.renderSections(sources.data.tools))
    .replace('%%TOOLS_JSON%%', embedJson(sources.data))
    .replace('%%APP_JS%%', sources.app)
    .replace('%%UPDATED_ON%%', String(sources.data.meta.updatedOn))
    .replace('%%NEXT_RECHECK%%', String(sources.data.meta.nextFullRecheck));

  if (html.includes('%%')) {
    throw new Error('Unreplaced %% marker left in output; aborting to avoid a broken build');
  }
  return html;
}

function main() {
  const sources = loadSources();
  const html = render(sources);
  fs.writeFileSync(PATHS.output, html);
  const kb = (fs.statSync(PATHS.output).size / 1024).toFixed(1);
  console.log('Built index.html (' + kb + ' KB, single file, offline) with ' +
    sources.data.tools.length + ' tool cards from ' + Object.keys(PATHS).length + ' sources.');
}

module.exports = { render, loadSources, PATHS };

if (require.main === module) {
  main();
}
