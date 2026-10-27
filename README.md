# Free Accessibility Tools Directory

A permanent, plain-English directory of **free accessibility software and built-in settings** - screen readers, magnifiers, dictation, text-to-speech, captions, dyslexia-friendly fonts, keyboard-only helpers, and simpler-phone modes - with honest per-tool cards: what it does, where to get it officially, why it is really free, and a beginner verdict. Nothing is bundled, nothing needs an account, and there are no affiliate links. The whole directory is **one offline HTML file** you can open with a double-click, email to a friend, or drop onto any USB stick.

Built with care by **Asdale Dynamics, LLC** as part of Dylan Asdale's beginner-friendly AI education collection (*The Massive AI Manual*, dylanasdale.github.io). It complements this sibling resource:

- **free-large-print-tech-kit** - big-type phone and computer basics for less-techy relatives

Distinctions: the kit covers *big-type basics for everyday apps*; this directory answers *"which free assistive tool fits my eyes, ears, hands, reading, or focus - and where do I get it officially?"*

## How to use it

Open `index.html` in any modern browser - fully offline, no server needed.

1. Pick your situation in the **"I want help with"** chips (seeing, hearing, hands, reading, focus, or speech).
2. Narrow further by **device or browser**, or use the **search** box.
3. Look for the **green "Start here" verdict** if you are new; "Easy win" takes a minute to set up, and "Worth practicing" pays off with some patience.
4. Open the official link on a card and try the tool on something that annoys you every day.

Every card carries a **last-checked date and a recheck-by date** - the day we last verified the tool is genuinely free and working. Free tools change; when in doubt, trust the linked official page over the card.

## Project layout

| Path | Role |
| --- | --- |
| `index.html` | The finished single-file directory (committed, ready to share as-is) |
| `data/tools.json` | The data source of truth - meta block + one object per tool card |
| `template.html` | Page shell; tokens `%%STYLES%%`, `%%CARDS%%`, `%%TOOLS_JSON%%`, `%%APP_JS%%`, `%%UPDATED_ON%%`, `%%NEXT_RECHECK%%` get inlined |
| `assets/styles.css` | Page styles (inlined into `index.html` at build time) |
| `assets/app.js` | Filter + card-rendering logic (inlined; also unit-testable in Node) |
| `scripts/build.js` | Assembles `index.html` from the sources above |
| `scripts/test.js` | Validates JSON schema, filter/render logic, and the built page |
| `LICENSE` | MIT, (c) 2026 Asdale Dynamics, LLC |

## For maintainers: the card fields

Everything the page renders comes from `data/tools.json`. Field rules (enforced by `scripts/test.js`):

- `id` - short lowercase slug, unique (`nvda`)
- `name` - the tool's plain name, e.g. `NVDA (NonVisual Desktop Access)`
- `category` - one of `screen-readers`, `magnifiers`, `dictation`, `text-to-speech`, `captioning`, `dyslexia-fonts`, `keyboard-only`, `phone-builtins`
- `platforms` - 1-5 of `windows`, `macos`, `ios`, `android`, `linux`, `chrome`, `edge`, `firefox`, `web`
- `freeStatus` - `built-in` (ships with the OS/device), `open-source`, or `freeware`
- `license` - optional short honest description, e.g. `GNU GPL v2 (free and open source)`
- `oneLiner` - one warm sentence
- `whatItDoes` - two or three sentences a beginner can act on
- `proofFree` - the concrete evidence it is free: license text, who ships it, and what is *not* charged
- `beginnerVerdict.level` - `start-here`, `easy`, or `with-practice`; `.text` - one sentence of advice
- `sources` - 1-3 links, each to a domain listed in `officialDomains` (the tool's official home only)
- `versionHint` - honest limits: OS versions, device requirements, language limits
- `needs` - 1-4 of `blind`, `low-vision`, `hard-of-hearing`, `motor-dexterity`, `dyslexia-reading`, `cognitive-focus`, `speech` (drives the chip filter)
- `lastChecked` / `recheckBy` - `YYYY-MM-DD`; bump **both** whenever a card is re-verified, and keep `recheckBy` in the future (the test suite fails loudly once it lapses)

The `meta` block carries the directory title, maintainer (`Asdale Dynamics, LLC`), the no-affiliate policy, and the directory-wide `updatedOn` / `nextFullRecheck` dates.

Example card:

```json
{
  "id": "windows-narrator",
  "name": "Windows Narrator",
  "category": "screen-readers",
  "platforms": ["windows"],
  "freeStatus": "built-in",
  "oneLiner": "The screen reader already inside Windows - press one shortcut and it starts talking.",
  "whatItDoes": "Narrator reads the screen aloud and announces what you type, so you can use Windows without seeing it.",
  "proofFree": "Built into Windows 10 and 11 at no extra charge. There is nothing to download, no account, and no paid tier.",
  "beginnerVerdict": { "level": "start-here", "text": "Nothing to install makes it the fastest yes/no test of whether a screen reader helps you." },
  "sources": [
    { "label": "Complete guide to Narrator (Microsoft Support)", "url": "https://support.microsoft.com/en-us/accessibility/windows/narrator/complete-guide-to-narrator" }
  ],
  "officialDomains": ["microsoft.com"],
  "versionHint": "Windows 10 and 11",
  "needs": ["blind", "low-vision"],
  "lastChecked": "2026-10-27",
  "recheckBy": "2027-01-27"
}
```

## Maintenance routine

Suggested rhythm: **recheck quarterly** (the initial pass is 2026-10-27, next due by 2027-01-27), or before any release.

1. For each card, open its linked official pages and confirm the tool is still free, still works as described, and the URL is alive.
2. Update any text that drifted - prices, versions, limits, verdicts.
3. Bump `lastChecked` (usually to today) and `recheckBy` (about three months out) on every card you verified, plus the meta `updatedOn` / `nextFullRecheck` if this was the full pass.
4. Remove cards for tools that are no longer freely available; add new cards to the right category with the same field discipline.
5. Rebuild and test:

```sh
npm run build   # re-inlines tools.json + assets into index.html
npm test        # schema + logic + page checks (must be all PASS)
```

Commit both `data/tools.json` **and** the rebuilt `index.html` together, so the repo always ships a current single file.

Two hard rules, enforced by tests:

- `index.html` must equal the build output (no stale artifacts get committed by accident).
- Links may only point to each tool's official home (matched against its `officialDomains`) - never mirrors, marketplace listings, or affiliate URLs. No downloads are bundled into this repo.

## Testing details

`scripts/test.js` (run with `npm test`; no dependencies needed) checks the whole project:

1. **Schema** - required fields, unique id slugs, category/need/platform/freeStatus/verdict enums, string lengths, ISO dates (`lastChecked` not in the future, `recheckBy` not lapsed), https-only links restricted to each card's `officialDomains`, and no affiliate-style patterns anywhere in a card.
2. **Logic** - the need-chip and platform filters behave exactly (and are monotonic subsets), search matches name/blurb/details, sorting orders by category, then verdict (friendliest first), then name.
3. **Rendering** - every card renders complete HTML (name, one-liner, proof of free-ness, verdict, links with `target="_blank"` + `rel="noopener noreferrer"`, checked/recheck dates); category sections emit exactly one article per tool; nothing leaks `undefined`.
4. **Page** - `index.html` is byte-identical to a fresh build, its embedded JSON equals `data/tools.json`, the no-JS static cards are baked in, there are no external scripts/styles/images (a true offline single file), and the license, disclaimer, companion-kit, and no-affiliate lines are intact. It also scans for committed secrets and fails loudly if any card's `recheckBy` date has passed.

## Design choices

- **JSON-driven, single file**: the JSON is inlined into `index.html` at build time so double-clicking the file works offline (a fetch from `file://` would fail).
- **Cards work without JavaScript**: the build renders every card statically, so the directory stays readable with JavaScript switched off - fitting, for an accessibility directory.
- **No dependencies**: Node's standard library only; no `node_modules`, no network in build or test.
- **Beginner-first copy**: warm, plain English, never condescending; verdicts tell you *what to do*, not just what we think.
- **Self-enforcing honesty**: every claim about being free is written down per card, dated, and set up for a recheck - the constraints live in the test suite, not in memory.

## Credit and license

Project and content (c) **Asdale Dynamics, LLC**, released under the MIT License - see `LICENSE`. Created by Dylan Asdale as part of a beginner-friendly AI education collection. Not affiliated with Apple, Google, Microsoft, Mozilla, the GNOME Project, or NV Access; all product names are trademarks of their owners. This directory is educational information only - not medical, legal, or financial advice.
