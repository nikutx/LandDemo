# LandDemo

Click anywhere in Great Britain and get an instant, plain-English planning appraisal of that
point: which designations it sits inside, how constrained it is, who decides an application,
and what to do next. Save the sites worth considering and they rank themselves, easiest first.

Everything comes from government open data at request time. There is no back end and no API
key; the shortlist is the only thing kept, and it stays in your own browser.

**Live demo: [nikutx.github.io/LandDemo](https://nikutx.github.io/LandDemo/)**

---

## Why I built it

I wrote this as a working sample for a front-end role, and picked land data because it is the
kind of domain where a good interface earns its keep: the underlying facts are public, but
they are scattered across sixteen datasets and written for planners rather than for the people
making decisions.

Two things make it a tool rather than a readout:

1. **It answers the question people actually ask.** Nobody appraises a single site — they
   triage several. Saved sites are ranked least constrained first, so an hour of clicking
   around produces an order to work through instead of sixteen browser tabs.
2. **The same engine has two faces.** The panel is one caller; the other is the identical
   logic described as callable tools with JSON Schema, so an AI assistant can ask the same
   questions and get structured answers back.

Open the *Agent tool calls* panel in the bottom-left to see the calls behind the appraisal on
screen, and the tool manifest beside them.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Vue 3, `<script setup>` Composition API |
| Language | TypeScript, strict |
| Build | Vite |
| State | Pinia |
| Styling | Tailwind CSS v4 |
| Map | MapLibre GL, OpenFreeMap basemap |
| Tests | Vitest |

## Data sources

| Source | Used for |
| --- | --- |
| [planning.data.gov.uk](https://www.planning.data.gov.uk) | 16 designation datasets — Green Belt, National Landscape, flood risk, conservation areas, listed buildings, SSSI, ancient woodland, TPOs, Article 4, agricultural land and more |
| [postcodes.io](https://postcodes.io) | Reverse geocoding to district, parish and ward — i.e. who decides the application |

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests
npm run typecheck  # vue-tsc, no emit
npm run build      # production build
```

## Three decisions worth explaining

**One request, not sixteen.** Each designation is a separate dataset, so the obvious approach
is sixteen parallel queries. Browsers only open around six connections per host, so those
sixteen queue into three waves. The API accepts repeated `dataset=` parameters, so the whole
check goes in one request instead — and the appraisal lands in roughly a second.

**Ask for five fields, not the whole record.** The default response includes each designation's
boundary geometry. The Cotswolds National Landscape boundary alone is about **1 MB** of
coordinates, and the sentence "this site is in a National Landscape" needs none of it.
Requesting only the five fields the appraisal reads takes that response from **1,062,090 bytes
to 152** — the single change that took the lookup from over twelve seconds to about one.

**Geometry loads after the appraisal, not before it.** The boundaries are only needed to draw
the map, so they are fetched separately once the panel is already readable. The text never
waits on a megabyte of polygon.

## Scoring

The planning-difficulty score is a transparent heuristic, not a valuation. Each designation
carries a weight for how much it constrains development; the heaviest one dominates and further
designations add with diminishing weight, because a Green Belt site is hard whether or not it
also has a tree preservation order. The weights are in `src/lib/datasets.ts` and the maths is
in `src/lib/appraisal.ts`, both deliberately easy to argue with.

It is indicative only. Local plan policy, allocation, access and site history decide real
outcomes, and none of those are in this demo.

## Layout

```
src/
  lib/
    datasets.ts        designations checked, with weights and what each means
    planningData.ts    API client — batched lookup, lazy boundaries, geocoding
    appraisal.ts       scoring and the plain-English narrative
    agentTools.ts      the same engine as JSON Schema tools for an AI agent
    examples.ts        the sample sites offered under the search
    appraisal.test.ts  scoring, banding and narrative
  stores/
    site.ts            current lookup; aborts superseded requests
    shortlist.ts       saved sites, ranked, persisted to localStorage
    shortlist.test.ts  ranking, deduping and the pasteable summary
  components/
    MapCanvas.vue      MapLibre map and boundary rendering
    SitePanel.vue      the appraisal
    ShortlistPanel.vue saved sites, least constrained first
    TracePanel.vue     tool calls and manifest
    InfoOverlay.vue    what this is, and how it is built
```

Deployment is a GitHub Actions workflow: it runs the tests and the type check, builds, and
publishes to GitHub Pages on every push to `main`.

## Not included

No accounts, no persistence, no server. Every request goes straight from the browser to the
public APIs above. Nothing here is derived from any commercial land platform — the datasets,
the weightings and the wording are all from public sources and my own reading of them.
