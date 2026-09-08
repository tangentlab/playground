# Prairie Quest: skills and environment plan

**Development Reference**: This work aligns with [docs/summary.md](../../docs/summary.md) recommendations.
**Phase**: 4 | **Focus Area**: Technical skills showcase, contextual project links, navigation, responsive interaction.

This is an original top-down 2.5D exploration RPG prototype: a contemporary prairie town, warm pixel colours, oblique rooftops, depth sorting, and small humorous encounters. It takes tonal inspiration from EarthBound without using its characters or assets. The town layout and skill interiors are fictional, not a geographically accurate model of Regina.

## Provisional skill inventory

These are evidenced areas of experimentation in the existing repository, not verified professional qualifications or a complete personal skills inventory. The user can correct or expand them.

| Skill area | Repository evidence | Enterable building | Decoration vocabulary |
| --- | --- | --- | --- |
| JavaScript, browser APIs and interaction development | Browser experiments; `exp/bubbles/`; `docs/summary.md` | The Code Exchange, a fictional brick workshop | CRT displays, code snippets, server rack lights, planning notes, books, coffee cups and workbenches |
| 3D graphics and XR experimentation | `exp/aframe/`, `exp/me/`, `exp/gaussian-splat/` | Powerhouse Discovery Lab, inspired by the Saskatchewan Science Centre | VR headset on a pedestal, floating wireframe cube, optical markers, model turntables, pipes and brick chimney |
| Shaders, particles and animation | `exp/exp1/`, `exp/exp3/`, `exp/gaussian-splat/` | Prairie Pixel Gallery, inspired by MacKenzie Art Gallery | Animated particle paintings, colour swatches, sculptures on plinths, projection walls and gallery benches |
| Web Audio processing and visualization | `exp/music-vis/`, `exp/audio_review/` | Darke Hall Sound Studio | Twin speakers, keyboard, spectrum display, mixing desk, records, acoustic wall panels and cable runs |
| Civic data and creative mapping | `exp/regina-open-data/`, `exp/map/` | Legislative Map Room | Glowing map display, archival map drawers, globe, pathway pinboard, park specimens and stone columns |

The prototype implements representative objects in each room. The decoration vocabulary also includes suggestions for future detail passes. Algorithmic problem solving, rendering performance, and 3D mathematics are supporting skills spanning the rooms rather than additional unsupported professional claims.

## Regina references

- [Wascana Centre attractions](https://www.wascana.ca/attractions/) establishes the lake, Legislature, Science Centre, MacKenzie Art Gallery, and park setting.
- [Wascana Lake](https://www.wascana.ca/attractions/wascana-lake/) describes the former power plant connection and the fountain opposite the Legislature.
- [Darke Hall](https://darkehall.ca/) supplies the performing-arts venue reference for the fictional sound studio.

Exterior vocabulary: limestone and a green dome for the Legislature; brick and a chimney for the Science Centre; an abstract gallery frontage; a peaked brick hall; lake reeds, geese, leafy trees, paths, flower beds, lamps, benches, and a civic fountain. These are simplified artistic interpretations.

## Play

Open `exp/regina-rpg/index.html` in a browser or serve the existing Playground root. No packages or build step are required. A card on the Playground homepage links to the game.

- WASD / arrows move; Shift runs.
- E enters a nearby door, inspects an exhibit, talks, or exits.
- J opens a field guide with evidence and decoration lists. “Find this studio” activates a compass marker.
- Touch devices get a directional pad and action button.
- Visit and inspect all five exhibits to finish the creative circuit. Progress lasts for the current page session.
- Sound is opt-in and plays short discovery/entry chimes.

This is an exploration prototype, with collision, room transitions, dialogue and a five-stamp quest. Completing the circuit unlocks the Goose of Wascana on the south shore: a short turn-based boss encounter. Debug Burst deals steady damage; Reality Shield blocks a counterattack; Particle Storm deals heavy damage; Resonant Recovery heals; Map the Pattern doubles the next attack. The goose telegraphs its stronger attack every third turn. Defeat and retreat allow a fresh attempt; victory awards Prairie Champion for the session. Inventory equipment and a save system are not included.

## Validation

`node exp/regina-rpg/game.test.cjs` checks runtime drawing paths using Canvas/DOM test doubles, collision boundaries, walkable routes to every door and exhibit, entrance/exit transitions, quest stamps and duplicate protection. It does not replace visual or browser interaction testing.
