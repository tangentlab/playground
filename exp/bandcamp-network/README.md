# Guidewire Sound Atlas

A small static experiment that presents Guidewire’s public Bandcamp artist discography as a 3D spatial network. Album covers are projected from 3D coordinates onto an interactive canvas/DOM view, with depth scaling and orbit controls. No JavaScript dependencies or build step.

## Run

From this directory:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open http://127.0.0.1:8766/. No environment variables or dependency installation required. Cover artwork loads directly from Bandcamp; optional Google Fonts fall back to system fonts. A network connection is needed for these remote assets, but the saved metadata works offline.

## Explore

- Drag the scene to orbit in 3D; scroll to zoom.
- Select a cover (or Tab to it and press Enter) to inspect tags and connected releases.
- Follow Listen on Bandcamp to play music on its original release page.
- Switch between constellation, release-date timeline, and sphere layouts.
- Search titles or tags, enable optional auto-orbit, or reset the camera.

Connections use actual shared release tags. Each release contributes its two strongest matches, with ties broken by proximity in discography order; edges are deduplicated. The selected record's connections are highlighted. Many releases share identical tags, so connections are exploratory, not acoustic similarity scores. Spatial positions are illustrative except the timeline X axis, which represents release date.

## Data and refresh

`collection.json` is a public snapshot of the 16 releases visible at https://guidewire.bandcamp.com/music on October 15, 2026. The supplied URL is an artist catalog, so this experiment does not access a fan account's purchased collection. The public release page advertises more releases than the music grid exposes; this snapshot includes only the grid's visible entries, not the full advertised catalog. Artwork URLs, titles, tags, and dates come from public release pages. No credentials, private data, or audio files are downloaded.

To refresh, with Python 3 and curl installed and internet access:

```sh
python3 refresh.py
```

A failed refresh preserves the previous snapshot. Bandcamp markup can change and require updating the parser. Artwork remains remotely hosted and owned by its respective rights holders.

## Validation and limitations

Prototype: no embedded player, login, live synchronization, full-catalog pagination, or inferred audio features. Drag and wheel controls are browser based; physical mobile hardware has not been tested. Auto-orbit starts off. The graph is also navigable via keyboard-selectable record buttons.

Syntax and metadata checks:

```sh
node --check app.js
python3 -m py_compile refresh.py
python3 -m json.tool collection.json > /dev/null
```

Verified: JavaScript and Python syntax; 16 unique release URLs with valid ISO dates, artwork URLs, and tags; desktop rendering and all 16 cover images loaded; connected-release and cover selection; search; timeline and sphere switching; 390px responsive layout with no horizontal overflow. Browser reported no warning or error logs. Physical mobile gestures and audio playback on Bandcamp were not tested.
