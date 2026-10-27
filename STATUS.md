# STATUS - free-accessibility-tools-directory

Last updated: 2026-10-27

## What was built

A static, offline, single-file directory of **35 free accessibility tools and built-in settings** (screen readers, magnifiers, dictation, text-to-speech, captions, dyslexia-friendly fonts, keyboard-only helpers, and simpler-phone modes), maintained by Asdale Dynamics, LLC as part of Dylan Asdale's beginner-friendly AI education collection.

- `index.html` - the finished directory: generated, ~143 KB, works offline by double-clicking, no external scripts/styles/images, no bundled downloads, no keys, no affiliate links, no tracking.
- Per-tool cards: what the tool does, where to get it officially, a concrete "why it is free" proof (license text, who ships it, what is not charged), version/limit hints, a color-coded beginner verdict (green "Start here" / blue "Easy win" / amber "Worth practicing"), and per-card `lastChecked` + `recheckBy` dates (all 2026-10-27 / 2027-01-27 at initial release).
- **Need-based filters**: 7 "I want help with" chips (blind, low vision, hard of hearing, motor & dexterity, dyslexia & reading, focus & attention, speech), a device/browser select (Windows, Mac, iPhone/iPad, Android, Linux, plus browser-specific entries and web), and text search; results and counts update live.
- **Hybrid rendering**: the build inlines all 35 cards statically into the HTML, so the directory remains fully readable with JavaScript switched off (all links are plain HTML); JavaScript adds the filters.
- JSON-driven: `data/tools.json` is the source of truth (meta policy + tool cards); `npm run build` inlines it + CSS + JS + static cards into the single file.
- Links go only to each tool's official home, matched per card against an `officialDomains` whitelist (apple.com, support.microsoft.com, google.com, nvaccess.org, orca.gnome.org, mozilla.org, cross-plus-a.com, brailleinstitute.org/google.com fonts mirror, opendyslexic.org, vimium.github.io/github.com) - enforced by tests.
- `scripts/test.js` - dependency-free test suite validating JSON schema, filter/render logic, and the built page (including a stale-artifact check).
- `README.md` - maintenance guide (field rules, quarterly recheck routine, rebuild + test workflow).
- `LICENSE` - MIT, Copyright (c) 2026 Asdale Dynamics, LLC.

Built-in features cover Apple, Google, and Microsoft accessibility (Narrator, Magnifier, Live Captions, Voice Access, VoiceOver, TalkBack, Immersive Reader, AssistiveTouch, and friends); downloads cover NVDA, Orca, Balabolka, Atkinson Hyperlegible, OpenDyslexic, and Vimium. Complements the **Free Large-Print Tech Kit** (big-type basics), per the README and page footer.

## How to run / verify

- Use: open `index.html` in a browser (no server needed).
- Build: `npm run build` (or `node scripts/build.js`) - regenerates `index.html` from sources.
- Test: `npm test` (or `node scripts/test.js`).

## Verification results

- `npm run build` - "Built index.html (142.6 KB, single file, offline) with 35 tool cards from 5 sources."
- `npm test` - **ALL PASS: 53 passed, 0 failed** (2026-10-27), covering:
  - JSON schema (35/35 cards: field types, unique slugs, all 8 categories present, enums for category/need/platform/freeStatus/verdict, ISO dates with `recheckBy` still ahead of today, https-only links restricted to each card's `officialDomains`, no affiliate patterns in any field)
  - filter logic (need chips behave exactly and are monotonic subsets, platform filter exact, search matches name/blurb/details, sorting by category then verdict then name with friendliest verdicts leading each category)
  - card rendering (all 35 cards render complete HTML with escaped name, one-liner, proof, verdict, links with `target="_blank"` + `rel="noopener noreferrer"`, checked/recheck dates; nothing leaks `undefined`)
  - built page (single file, verbatim-embedded sources, static no-JS cards baked in: one h2 per category and 35 articles before the scripts, embedded JSON equals `data/tools.json`, no external/network assets, no affiliate/store links, license + disclaimer + companion-kit lines intact, per-card source URLs all present, no committed secrets, < 250 KB)
- Sanity probes: `filterTools` need counts (blind 5, low-vision 13, hard-of-hearing 6, motor 11, dyslexia-reading 8, focus 4, speech 1) and platform counts (windows/ios/android 10 each, macos 8, linux 1, web 4) match a manual walk of the data; the combined windows + hard-of-hearing filter returns exactly `windows-live-captions`; the first static card (NVDA) renders correct markup.

## Known gaps

- **Data currency**: all 35 cards were hand-checked against official sources on 2026-10-27, but free-tool details (versions, limits, name changes like Apple's "Spoken Content" becoming "Read & Speak") drift quickly - this is why every card carries `lastChecked`/`recheckBy` dates and the page tells readers to trust the linked official page. The test suite fails once a `recheckBy` date passes, nudging the quarterly recheck documented in the README.
- Built-in feature paths vary by OS version and phone maker (Samsung layers its own menus on Android); cards note the common case and the search-in-Settings fallback.
- No real-browser QA here: card rendering is validated in Node (pure functions) plus static markup checks, not in Safari/Firefox/Chrome visual runs.
- The single-file design means edits require a rebuild (`npm run build`) before `index.html` reflects them; the test suite catches stale artifacts.
- Tools covered are the highest-traffic free options; niche screen magnifiers, Linux-specific dictation, and commercial software's free tiers are deliberately out of scope to keep the directory honest and beginner-sized.
