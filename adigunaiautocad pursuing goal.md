# adigunaiautocad pursuing goal
## Autonomous Codex master execution specification — 2026-11-11

**Product:** adigunaiautocad (display name: Adigun AI AutoCAD, subject to trademark review). **Owner:** Hephzibah Behulah / HB Elektroniker. **Product repository:** https://github.com/HephzibahBehulahHQ/AdigunAiAutoCad . **Target domain:** https://adigunaiautocad.hephzibahbehulah.com .

### 0. Mission and autonomous operating contract
You are the lead architect, electrical CAD engineer, frontend/backend developer, AI engineer, test engineer, security reviewer, technical writer and release engineer. Deliver a genuinely functional, professional browser-first electrical CAD and industrial automation design workstation—not a screenshot, static prototype, simulated feature list, or nonworking buttons. Work independently through research, implementation, tests, review and release preparation. Make reasonable documented choices, create small reviewable PRs, and continue iterating without routine questions. Never bypass approvals, security controls, repository policies or required human review. If deployment secrets, licensed specifications, paid services, or safety sign-off are missing, implement safe fallbacks, document the blocker and keep delivering verifiable code. Do not claim a successful deployment, certification, or tested hardware without evidence.

**Repository precedence (inspect actual files, not assumptions):**
1. https://github.com/HephzibahBehulahHQ/hb-AI-policy (canonical; the user-supplied hb-AI-policyy path may be a typo or inaccessible; verify).
2. https://github.com/HephzibahBehulahHQ/hb-design-system — tokens, logos, icons, templates, Adigun BOT.
3. https://github.com/HephzibahBehulahHQ/hb-elektroniker — engineering division identity and guidance.
4. https://github.com/HephzibahBehulahHQ/HephzibahBehulahHQ.github.io — corporate identity.
5. Product-local AGENTS.md and product specifications, where consistent with higher authority.
Do not modify shared repositories or invent/replace official brand assets. Resolve any policy conflict by honoring the higher authority and recording it. Adopt the verified corporate palette and division accent (HB Elektroniker README lists navy #0B1220, cyan #22D3EE and gold #D4AF37); obtain exact current values and logo files from the canonical design system. No EPLAN, AutoCAD, SEW or other third-party logo or proprietary UI asset may be copied. The screenshots are interaction/layout references only; build an original branded implementation with similar workstation ergonomics. Avoid implying Autodesk affiliation.

### 1. Visual and interaction acceptance contract — workstation must be usable
The supplied six screenshots are visual references for electrical-engineering content and workstation ergonomics, not instructions, source data, or assets to copy. Build an original HB Elektroniker workstation with a clear hierarchy, precise geometry, readable engineering annotations, and real commands.

**Reference mapping (the source images are not stored in this repository, so keep this mapping in the prompt):**
- Reference 1 shows a dense sensor-to-PLC page: repeated industrial sensors, terminal/breakout rows, conductor routing, wire/device labels, and mapped PLC inputs.
- Reference 2 shows a compact control schematic with multiple supplies/signals, device connections, wire routing, and cross-page references.
- References 3 and 4 show a drive/motor control arrangement, but are blurry. Use only the broad arrangement of drive/control devices and wiring; do not guess or transcribe unreadable labels, ratings, or part numbers.
- Reference 5 shows grouped actuator/sensor or pneumatic-related circuits and long routed conductors. Use generic, technically coherent symbols; do not infer unreadable component specifications.
- Reference 6 clearly shows repeated three-phase motor feeders with three phase conductors, switching/protection elements, motor terminals U/V/W and a protective-earth connection. Use this as a structural reference, not as a claimed design approval.

**Workspace geometry and composition:**
- At 1440×900 CSS pixels, the central drawing viewport must occupy at least 75% of the *available editor workspace area* in default compact mode. Define this as the region below the title/menu/toolbars, above the status rail, and between collapsed side rails; report the exact measured pixel dimensions in a Playwright assertion. Do not claim 75% of the entire browser viewport when those surrounding bars are excluded.
- Use a slim title/project-tab strip (24–32px), compact icon-first command toolbar (28–36px), collapsed icon rails (32–40px), and thin status rail (24–32px). Keep controls separated with consistent hit targets, spacing, visible focus, and tooltips. No icon, label, menu, or popup may overlap another control or obscure the active drawing area.
- Project navigator and properties/inspector may expand as docked, resizable workspace panes. Docked panes are persistent editor regions, not transient popovers; opening one must resize/reflow the canvas and never cover controls or silently steal drawing input. On narrow screens, use a safe viewer or responsive layout instead of compressing the editor into an unusable state.
- The central sheet is an editable, crisp engineering drawing with border, grid/rulers, title block, page/sheet references, device tags, pin numbers, connection points, wire/cable identifiers, terminal strips, and legible annotations. Include coherent sample content spanning sensor-to-PLC I/O, control/drive wiring, and three-phase motor feeder structure. Use generic or verified licensed symbols and explicitly illustrative assumptions; never make up vendor part numbers, ratings, certification, or suitability for construction.
- Include fit-to-page, cursor-centered wheel/pinch zoom, pan (middle mouse or space-drag), selection, move, rotate, align, distribute, snap/grid, orthogonal routing, layers, context actions, undo/redo, and precision coordinates only when each command is actually implemented and validated. Clearly mark unsupported commands disabled with a concise reason; never present decorative controls as working features.
- Preserve a large open canvas, fast keyboard access, screen-reader names, high contrast, visible focus, reduced motion, and tablet adaptation. Mobile may default to a safe viewer.

**Original workstation requirements retained alongside the reference-specific additions:**
- Default to a full-viewport desktop editor. At 1440×900, the central schematic canvas must occupy at least 75% of the complete viewport area in default compact mode, measured in Playwright; it must also satisfy the available-workspace measurement above. Do not use a marketing hero, giant cards, or a permanently open chat pane.
- Keep the title/project strip 24–32px and the compact icon-only toolbar 28–36px, grouped for file, edit, drawing, electrical, automation, views, output, and AI. Use no persistent text labels; provide accessible tooltips, aria-labels, shortcuts, and a command palette.
- Left collapsible icon rail: expandable project/page tree, devices, symbol libraries, layers, properties, and macros. Expanded panes are on demand, resizable, detachable where feasible, and hideable in one click.
- Right collapsible icon rail: inspector, electrical rules, terminal strip, BOM, AI assistant, and comments. Keep Adigun BOT optional, unobtrusive, and out of the drafting path; never reserve a permanently open chat pane.
- Bottom 24–32px icon-only tool/status rail: grid, snap, orthogonal, object snap, coordinates, zoom, units, sheet, validation, jobs, and notifications. Small readable values for zoom, coordinates, and active sheet are permitted where engineering precision needs them; commands stay icon-first.
- Support a crisp white sheet and configurable dark drafting mode, fine grid, coordinate rulers, border/title block, page references, line numbers, IEC-style symbols, blue/red/black nets, annotations, true connection dots, terminal rows, device labels, cable IDs, cross-reference arrows, multiple sheets, CAD zoom/pan, and an original generic sample project covering sensor-to-PLC wiring, motor-drive power/control, and terminal strips.
- Provide fast middle-mouse/space-drag pan, wheel/pinch zoom around the cursor, fit-to-page, multi-select, drag, resize, rotate, align, distribute, snapping, undo/redo, context actions, keyboard shortcuts, precision coordinates, layers, and optional mini-map. Each displayed command must be implemented and validated or clearly disabled with its reason.
- Default to compact desktop mode, adapt for tablet, and provide a safe viewer on mobile rather than an unusable editor. Include screen-reader labels, high contrast, visible focus, and reduced motion.
- Compare reference screenshots for workstation geometry and interactions conceptually; never copy pixels or unauthorized visual assets.

### 1.1 Transient menu, toolbar, and flyout interaction contract
Implement a lightweight, accessible controller for transient menus, tool panels, and icon flyouts. The one-open-at-a-time rule applies globally to transient popovers; docked editor panes remain separate workspace regions.
- Every enabled trigger performs its named action or opens its real command panel. Do not add dummy entries or placeholder panels. Unsupported commands must be visibly disabled and explain why.
- Clicking a trigger opens its panel. Clicking the same trigger again closes it. Clicking a different trigger closes the current transient panel and opens only the new one. At most one transient panel may be open at any time.
- On desktop pointer input, keep a panel open while the pointer is inside either its trigger or panel. Close it when the pointer leaves the combined trigger-plus-panel region, with only a short measured grace delay to allow movement between them. Pointer movement alone must not execute a command.
- Clicking outside the active trigger and panel closes it. Escape closes it and returns focus to its trigger. Tab navigation and Enter/Space must provide keyboard access; focus indicators and appropriate button/menu roles, aria-expanded, aria-controls, and menu semantics are required.
- On touch devices, tapping a trigger opens/toggles its panel; tapping a different trigger switches panels; tapping outside closes the open panel. Do not depend on mouseleave/pointerleave for touch. Prevent synthetic mouse events from reopening a panel immediately after a touch.
- Use native DOM event handling (for example click, pointerleave/mouseleave, pointerdown for outside detection, and keydown for Escape) and a small shared state controller. Do not add a heavy UI library solely for these interactions.
- Anchor panels to their triggers, maintain a safe gap, and flip/shift them to remain within the viewport. Set a bounded max height with internal scrolling. Verify at desktop and touch viewport sizes that popovers do not overlap unrelated controls, escape the viewport, or cover the active trigger. Pointer movement from trigger into panel must not close it prematurely.
- Add focused automated tests for: open, toggle closed, switch from one trigger to another, pointer remains within trigger/panel, pointer exit closes after grace delay, outside click closes, Escape closes and restores focus, keyboard opening, touch tap-outside close, no touch-generated duplicate reopen, and exactly one visible transient panel. Include a narrow-viewport test and overlap/overflow assertions. Keep a real-device/manual touch check in release evidence where available.

**Top navigation dropdown invariant (explicit regression requirement):**
- The Electrical, Automation, Panel Design, EPLAN-Style, IEC / DIN / US Standards, and any shared-system top menus open on hover for mouse users and on tap/click for touch and keyboard users.
- Render each dropdown as a vertically stacked, absolutely positioned overlay anchored directly below its trigger, above the toolbar and drawing. It must not participate in document/grid layout or change any page, toolbar, canvas, or panel dimensions or coordinates.
- Keep every option reachable while moving from trigger to panel; close after selection, outside click/tap, or pointer exit from the combined trigger-and-panel region. Switching triggers leaves only the new dropdown open.
- Bound dropdown height to the viewport and scroll inside it with contained scroll chaining. Use an appropriate overlay z-index; preserve all current command behavior and the approved workstation styling.
- Before merging any dropdown change, measure the topbar, toolbar, workspace, editor and drawing bounds before/after open and require unchanged coordinates and dimensions. Exercise every shared-system top menu and its options at desktop size; also verify touch tap-outside close where a touch viewport/device is available. Do not accept any grid-row expansion (including a menu-open state class), content reflow, overlap, or canvas movement.

### 2. Product scope and real CAD engine
Build a coherent electrical engineering CAD platform, prioritizing **2D electrical schematics and control panel design**; do not promise complete mechanical AutoCAD equivalence. Modules:
1. Drawing/document core: projects, folders, sheets, page templates, title blocks, revisions, autosave, version history, reliable serialization, recoverable edits, copy/paste, grouping, layers, lock/hide, symbol definitions, reusable macros and templates.
2. Geometry: world-coordinate model independent of screen pixels, precise primitives (lines, polylines, arcs, circles, rectangles, text, dimensioning), transformations, selection hit-testing, snapping and orthogonal routing, viewport culling, stable IDs and deterministic export.
3. Electrical semantics: typed symbols, pins, ports, net connectivity graph, junction rules, wire numbering, signal names, potential and cross-sheet references, device tags, contact references, terminal strips, cables, conductor colors, core IDs, connection reports, power supplies, protective devices, PLC I/O mapping, sensors, actuators, relays, contactors, motors, VFDs, safety relays and distribution boards.
4. Panel layout: DIN rails, ducts, footprints, mounting plate, clearance annotations, wire routing suggestions, panel schedules, parts/BOM, heat-load estimates as advisory only, configurable component dimensions and manufacturer catalog provenance.
5. Industrial automation: PLC addressing and I/O mapping, electrical control schematics, ladder-logic **viewer/editor with explicit limited scope**, basic interlock logic and signal simulation with deterministic engine; clearly separate conceptual simulation from validated industrial control and safety PLC functionality.
6. Reports: BOM, wire lists, terminal diagrams, cable schedules, device indexes, connection lists, revision logs, sheet index, validation findings, PDF print package, CSV and SVG; DXF import/export via an audited open library with documented subset/roundtrip limitations. DWG only with legally licensed technology; never falsely claim native DWG fidelity.
7. Libraries: versioned IEC/ANSI-style symbols authored in-house or permissively licensed, pin metadata, editable symbols, searchable catalog, import/export, vendor-neutral parts, provenance and license checks.
8. Multi-language UI: German (de-DE), English (en-US), international English; locale-aware units, paper sizes, numbering, decimal separators and documentation templates.
9. Professional workflows: sample projects, project wizard, onboarding, searchable commands, printable engineering documentation, collaboration/roles if backend is enabled, audit trails, backups, restore and offline-first editing where feasible.

### 3. 2026 standards-aware engineering — no unsupported certification claims
Create a maintained **standards registry** with jurisdiction, standard ID, edition, status, applicability, license, authoritative reference, implementation mapping, evidence and last-reviewed date. Research latest authoritative editions before encoding any normative requirement. Start with applicable families, verifying current editions and national deviations:
- Germany/EU: DIN VDE 0100 series / IEC 60364 (LV installations), DIN EN IEC 60204-1 (machine electrical equipment), DIN EN IEC 61439 (LV assemblies), DIN EN IEC 81346 (reference designations), IEC 61082 (electrotechnical documents), IEC 60617 (graphical symbols), IEC 60947 (switchgear), IEC 61131-3 (PLC programming), IEC 62443 (industrial cybersecurity), EN ISO 13849-1 and IEC 62061 (functional safety where applicable), IEC 61355 (document classification), EU Low Voltage/EMC/Machinery regulatory applicability including effective dates and transitions.
- US: NFPA 70 / NEC (jurisdiction-adopted edition), NFPA 79, UL 508A, NFPA 70E, ANSI/IEEE 315 where applicable, relevant NEMA/IEEE/UL families and OSHA context. NEC editions are locally adopted; never assume nationwide adoption of a single edition.
- International: IEC 60364, IEC 60204, IEC 61439, IEC 60617, IEC 61082, IEC 81346, IEC 61131, IEC 62443, ISO 12100, ISO 13849 and IEC 62061 as applicable.
- Distinguish symbol/documentation checks from design safety certification; support configurable rules by project region, edition, system voltage and application. Do not redistribute copyrighted standards texts or use proprietary symbols without permission.
- Implement verifiable **electrical rule checks**: unconnected pins, unintended dangling wires, duplicate device tags, shorted incompatible potentials, missing PE designation, inconsistent wire numbers, terminal conflicts, invalid cross references, mismatched PLC I/O types, basic conductor/circuit warnings and report generation. Safety-critical sizing, short-circuit withstand, selectivity, arc flash and compliance determinations must be clearly advisory or delegated to qualified engineer and verified calculations.
- Every rule has rule ID, edition mapping, severity, explanation, exact sheet/object reference, suggested fix, test fixture and human-review status. Allow documented waivers with audit log.

### 4. AI engineering copilot — Adigun BOT
Reuse the official Adigun BOT component contract from hb-design-system. The copilot is an opt-in, context-aware engineering assistant with:
- natural-language project creation, search, symbol insertion, wiring proposals, BOM explanations, sheet summaries, cross-reference suggestions, localization and documentation generation;
- **preview -> diff -> explicit user confirmation -> deterministic validated edit transaction -> undo** for every modification; no unreviewed autonomous changes to live project, no hidden code execution, no silent external sharing;
- retrieval grounded in the project's own symbols, standards registry, permitted documentation and manufacturer data, with citations and confidence/uncertainty; never fabricate standard clauses or certified safety results;
- typed tools with JSON schemas, permissions, least privilege, prompt-injection defenses, rate limiting, cost controls, redaction, audit logs and provider abstraction; AI credentials only server-side;
- offline/manual CAD remains fully usable without any AI provider key. Clearly label unavailable functions rather than presenting mock results as real.

### 5. Architecture and engineering quality
Inspect existing repo and follow its stack if established; otherwise propose and implement a pragmatic TypeScript monorepo: React + Vite + strict TypeScript, accessible component library derived from approved design tokens, Zustand or equivalent for editor state, SVG or Canvas/WebGL hybrid renderer (choose by measured performance), geometry/connectivity packages independent of UI, workers for heavy ERC/export, schema-validated project JSON with migrations, IndexedDB offline persistence, Playwright + Vitest. Add optional API (Node/TypeScript with Postgres) only when needed for auth, collaboration, server-side AI or storage. Keep deterministic CAD engine, rule engine, AI adapter, UI and persistence isolated and testable. Avoid overengineering and vendor lock-in. No secret values in frontend or repo. Use CSP, secure headers, dependency scanning, license inventory, input sanitization, upload limits, data export/deletion and privacy-by-design.

Data entities: Project, Sheet, Layer, SymbolDefinition, SymbolInstance, Pin, Net, WireSegment, Junction, Terminal, Cable, Device, PLCAddress, Part, PanelFootprint, DrawingPrimitive, Constraint, Revision, ValidationFinding and AuditEvent. Define stable IDs, schema versions, coordinate units, explicit connectivity semantics and migrations. Ensure imported content cannot execute scripts.

### 6. Autonomous phased delivery — every phase has a working demo
**Phase A / discovery:** audit repositories, policy, brand, existing workflows, deployment, current standards sources and licenses. Record architecture decision records and exact acceptance checklist. Create a dedicated feature branch and PR; no silent main edits.
**Phase B / workstation:** functional icon-only shell, high-fidelity workspace, project/page explorer, resizable panels, original branded SVG icons, accessibility, command palette, keyboard shortcuts, sample schematics, viewport layout screenshot tests.
**Phase C / CAD kernel:** precision geometry, model serialization, editing commands, undo/redo, multi-sheet, snap, pan/zoom, symbol creation and reusable libraries; tests for topology and roundtrip.
**Phase D / electrical intelligence:** pins/nets, ERC, cross references, terminal/wire numbering, PLC maps, BOM and deterministic reports; real test projects.
**Phase E / panel/automation:** panel layout, device footprints, wire/terminal schedules, limited PLC logic and transparent simulation.
**Phase F / AI:** provider abstraction, Adigun BOT integration, cited guidance, safe tool previews, validation and consent, graceful no-key mode.
**Phase G / interchange and release:** PDF/SVG/CSV/DXF import/export tests, i18n, documentation, performance, security, accessibility, deployment checks and release candidate.

For each phase: implement -> run checks -> fix failures -> capture screenshots -> update docs and progress -> open/update PR -> proceed when permitted. Do not wait for routine user input. Escalate only credentials, policy conflicts, legal licensing, safety approvals or actions requiring explicit authorization.

### 7. Acceptance tests and release gates
- At 1440×900, assert the central drawing viewport is at least 75% of the complete viewport area and meets the defined available-editor-workspace measurement in compact mode; record measured dimensions. Verify toolbar, rails, status bar, and any open transient panel are keyboard-operable, accessible, within the viewport, and non-overlapping. Compare screenshot references conceptually without copying their assets.
- Create/edit/save/reload a 10-sheet schematic with >=250 symbols and >=1000 wire segments without lost connections; verify deterministic undo/redo and project roundtrip.
- Demonstrate net connectivity, branch junction behavior, cross-sheet references, PLC I/O and terminal indexing; include deliberate faults detected by ERC with sheet/object locations.
- Export print-ready PDF and SVG, CSV BOM/wire/terminal reports and supported DXF subset; reimport test fixture and report unsupported constructs.
- Verify German/US locale switch, project-level region and edition settings, standards registry provenance and explicit engineering disclaimers.
- AI suggested wiring never changes model before approval; unauthorized tool calls are rejected; no-key mode works.
- Automated unit/integration/e2e, a11y checks, visual snapshots, performance budgets, security/dependency/license scans, production build and deployment smoke test. Include the full transient-panel interaction test matrix in section 1.1. Track exact pass/fail/skip and artifacts. No prompt or mockup can guarantee zero defects; release evidence must show no known blocking/high-severity defects and list every unverified or partial requirement.
- Serve correct site on the specified domain after authorized deployment, verify DNS/TLS, route fallback, content-type, asset paths and no blank screen; report actual URL and evidence. Never confuse a GitHub Pages static host with a persistent server runtime: use a separate secure backend host if required.
- Define measurable render and interaction budgets on reference hardware and include CI regression tests; avoid unmeasured "fast" claims.
- Release notes must list completed, partial, unsupported and safety-critical limitations. No fake certifications or simulated screenshots presented as real app output.

### 8. Documentation and operations
Maintain README, AGENTS.md (product-local, subordinate to global policy), architecture/ADRs, data schema, editor shortcuts, symbol authoring guide, AI security guide, standards provenance matrix, locale guide, deployment guide, rollback guide, accessibility report, licensing/SBOM, test evidence and CHANGELOG. Provide original sample projects: IEC-style motor starter, PLC sensor/actuator control, panel terminal layout and ANSI-style control circuit.

### 9. Mandatory Codex behavior and finish condition
Begin by reading actual policy/design/brand repositories and checking branch protection and workflows. Prioritize a working full-screen CAD workstation immediately, then engineering correctness. Maintain a task checklist in the product repository; use issue/PR checkpoints. Never substitute decorative mock screens for working commands. Keep output concise: STATUS; Done; Tested; Blocked; ESTIMATED FINISH TIME (hours/minutes); ETA; Next. Only claim work actually completed. A phase is complete only with tests and demonstrable artifacts. The overall project is complete only when the agreed acceptance suite passes, deployment is verified, documented limitations are explicit and required human approvals are obtained.

### 10. Visual reference brief for mockup and implementation
Generate an original 16:9, 1440×900 concept mockup for the HB Elektroniker-branded Adigun AI AutoCAD electrical CAD workstation. Use the verified authorized brand assets when available; otherwise use a restrained text wordmark and the documented navy #0B1220, cyan #22D3EE, and gold #D4AF37 palette. Do not invent or imitate a logo.

Show a slim 24–32px title/project-tab strip, compact 28–36px cyan-accent icon-first grouped toolbar, narrow 32–40px collapsed left and right icon rails, a very large central white A3-style engineering sheet, and a thin 24–32px icon-only status rail. Include the original brief’s crisp vector typography, no marketing panels, and an unobtrusive small cyan Adigun BOT affordance only when the approved asset and real behavior are available. The sheet should show a coherent, generic sample combining (1) a sensor-to-PLC terminal/I/O row, (2) a compact control/drive wiring group, and (3) a three-phase motor feeder with L1/L2/L3, switching/protection symbols, U/V/W and PE. Use fine grid, coordinate rulers, IEC-style relay/contactor/PLC/sensor symbols, clean black/blue/red wiring, pin numbers, terminal strips, cross references, page border, and title block as in the original visual brief. Include a restrained title block, border, wire paths, generic device tags, pin/terminal labels, and a few legible annotations. Use only labels and component data supported by the actual sample project; when data is unknown, omit it rather than guessing.

Show exactly one transient command flyout open and anchored to its trigger, with no overlap or viewport clipping. It demonstrates the specified open-panel visual state only; the mockup itself cannot demonstrate pointer leave, click-outside, keyboard, or touch behavior. Keep any Adigun BOT affordance small and unobtrusive; omit it if a real approved asset/behavior is unavailable. Use original generic engineering graphics, not EPLAN/AutoCAD/SEW/Festo/SICK branding, logos, screenshots, or copied proprietary artwork. Do not show certification badges or imply construction approval. The mockup is a static concept, not proof that the product or pictured controls have been implemented.

Implementation acceptance uses the same visual geometry and reference interpretation described in section 1. A generated image must not introduce text, ratings, components, functions, or safety claims absent from the implementation's real, reviewable project data. Treat image-generation text as unreliable: validate every visible label manually before using the image as a product reference.

---

## 11. MANDATORY production-grade engineering project library: 50 × 100 sheets (minimum)

**This section supersedes all smaller sample-project requirements as the final release acceptance criterion.** The earlier 10-sheet/250-symbol acceptance case remains a fast CI regression fixture, **not** the product's final project-library scope.

### Required deliverable
Ship **at least 50 DISTINCT, FULLY FUNCTIONAL electrical engineering design projects, each containing at least 100 meaningfully populated, interconnected, editable sheets**: **minimum 5,000 real engineering drawing sheets**. These are genuine native project documents, **not** blank sheets, screenshot backgrounds, static SVG/PDF previews, duplicated filler, mocked APIs, nonfunctional demos, or unverified manufacturer reference designs. Each must open in the editor, permit selection/editing/rewiring, preserve semantic pin/net topology, save/reopen without loss, run ERC, produce cross-references, and generate usable BOM/wiring/terminal reports. All 50 must be accessible from a searchable **Engineering Project Library** with thumbnails, domain, standard profile, complexity, page count and validation status. Bundle compressed/versioned datasets or lazy-download content so first load stays fast; support offline availability for downloaded projects.

### 50 project briefs — each >=100 sheets, independent electrical topology and domain-specific documentation
**Industrial motor/control (01–10):**
01. Reversing three-phase motor starter with interlocks.
02. Star–delta motor starter and timing sequence.
03. VFD-driven conveyor line with sensors and PLC.
04. Multi-axis servo motion cell with encoder feedback.
05. Soft-starter pump station with duty/standby operation.
06. Multi-motor production line with segmented MCC.
07. Industrial fan bank with process instrumentation.
08. Packaging machine power and PLC controls.
09. Hoist/crane control with advisory safety circuits.
10. Hydraulic power unit and electrovalve controls.

**PLC, process and automation (11–20):**
11. Modular PLC I/O cabinet with remote I/O.
12. Water-treatment dosing and monitoring plant.
13. Wastewater lift-station control and telemetry.
14. Food processing line with sensors and drives.
15. Chemical batch reactor instrumentation/control.
16. Brewery/CIP skid automation.
17. Industrial oven heating and temperature loops.
18. HVAC air-handling unit control system.
19. Cold-storage refrigeration supervisory controls.
20. Warehouse automated conveyor/sorter system.

**Building, power and energy (21–30):**
21. Commercial low-voltage distribution board.
22. Industrial subdistribution and feeder schedules.
23. Emergency lighting and transfer-control circuits.
24. Building automation and field controller cabinets.
25. Solar PV inverter and AC distribution documentation.
26. Battery energy storage auxiliary/control circuits.
27. EV charging site electrical/control schematics.
28. Generator ATS supervisory/control panel.
29. UPS monitoring and bypass control system.
30. Data-center auxiliary electrical and alarm panels.

**Manufacturing and robotics (31–40):**
31. Robotic welding cell control cabinet.
32. CNC machine auxiliary electrical controls.
33. Assembly-line safety relay and access interlocks.
34. Pneumatic pick-and-place automation.
35. Injection molding machine auxiliary controls.
36. Printing press multi-drive control.
37. Textile production machine control system.
38. Pharmaceutical filling-line control.
39. Automated palletizer control.
40. Industrial test bench and instrumentation rack.

**Specialized international designs (41–50):**
41. IEC-style European machine control panel.
42. NFPA 79-oriented US machine control panel.
43. UL 508A-oriented panel documentation example.
44. International terminal/cable marshalling cabinet.
45. Marine auxiliary electrical control panel (advisory only).
46. Agricultural irrigation automation controller.
47. Railway station auxiliary control circuits (not signaling safety design).
48. Mining ventilation auxiliary control panel (not hazardous-area certification).
49. Hospital facility auxiliary alarm/monitoring panel (not life-support design).
50. Modular training/commissioning lab with realistic PLC, motors and sensors.

---

### Mandatory 100-sheet content architecture PER PROJECT
Use a project-specific engineering breakdown; a **minimum** viable sheet distribution is:
- 001–005: cover, drawing index, legends, revisions, technical assumptions.
- 006–015: single-line power architecture, supplies, distribution and protection schematics.
- 016–035: power/control circuit schematics with actual connected components and nets.
- 036–055: PLC/remote-I/O and sensor/actuator circuit sheets with mapped addresses.
- 056–070: terminal, cable, wire and interconnection sheets.
- 071–080: panel mounting/layout, DIN rail, enclosure, device placement and connection sheets.
- 081–090: interlocks, drives, diagnostics, alarm and communication wiring sheets.
- 091–100: cross-sheet connections, commissioning checklists, engineering schedules, BOM, validation and revision documentation.
These categories are a baseline, not permission to add meaningless pages. Adapt to each domain; if a sheet is non-schematic, it must still be a meaningful native editable engineering document/report tied to project data. At least **70 sheets per project must contain editable, connected electrical schematics or panel/wiring topology**, not just text/report pages.

### Real-data and generation integrity
Implement a reproducible, seeded **engineering project generator** backed by typed CAD primitives, validated symbol definitions, connection graph, terminal rules, PLC maps and a domain-specific project configuration. Generate projects deterministically from unique, reviewed configurations; ensure distinct device topology, sheet structure, symbol placements, wire paths, labels, cable assignments, power architecture and cross-sheet links. Do not merely rename the same 100-page template 50 times. Include domain-specific component choices with **clearly identified illustrative ratings** and assumptions; no invented vendor part numbers, no falsely approved safety circuits, no assertion of suitability for physical construction. Include documented human engineering review requirements before any real installation.

Each project must include: project metadata, jurisdiction/standard profile, engineering assumptions, minimum 100 unique sheet IDs, named devices, connected pins and nets, cross-page references, project-wide numbering, PLC I/O mapping where applicable, terminal and cable schedules, BOM with source/illustrative status, and ERC results. Use original or properly licensed symbols and fixtures. If a domain lacks PLCs, provide an equivalent meaningful control/interface design rather than fake PLC content.

### Required executable quality gates
1. Automated manifest asserts **exactly or more than 50 distinct projects**, **>=100 meaningful sheets each**, **>=5,000 total**, **>=70 electrically editable connected sheets per project**, unique sheet IDs, and zero empty/filler pages.
2. For **every** project: deserialize all sheets; validate schema, IDs, symbols, pin references, wire graph, terminal/cable references, page cross-references and report generation; save/reload and compare deterministic topology hashes.
3. For **every** project: programmatically perform an edit to a selected real wire/device, undo, redo, save/reload, and confirm changed topology/metadata persisted correctly; prove the editor uses the same engine for user and test operations.
4. For **every** project: ERC runs and returns object-linked findings; any intentional illustrative violations are documented and visible, never hidden or called compliant.
5. Generate PDF print set, BOM CSV, wire list and terminal list from **real model data** for all projects (heavy exports may run in scheduled CI with artifact retention); sample DXF roundtrip for representative sheets.
6. Browser e2e: open at least one project from each of the five categories, navigate to sheet 100, inspect a real symbol and its pin/wire connectivity, modify a wire, save/reopen, verify ERC and export.
7. Performance: lazy-load project list/sheets, virtualize trees, worker-based validation, background export, bounded memory. Benchmark a 100-sheet project and 50-project library on specified test hardware; measure startup, sheet switch, zoom/pan and save latency. Set and enforce realistic documented budgets from actual profiling.
8. Document provenance and disclaimers: **educational/reference engineering designs, not construction-ready or certified** absent independent qualified engineering review. Never represent generated sample schematics as real approved electrical installations.

### Release definition and sequencing
Implement the CAD engine and one fully connected 100-sheet reference project first; then validate generation of 5 distinct projects; then 50. Keep all intermediate deliverables usable. **Do not declare final release complete until the entire 50 × 100 library and all quality gates pass.** Publish a machine-readable library manifest and per-project validation report. Clearly distinguish generated engineering examples from certified project deliverables. No fake progress metrics.

## 12. Binding client requirement: real engineering components only (2026-11-12)

This section is a client acceptance requirement and takes precedence over any wording elsewhere that could be read as permission to use generic or decorative component placeholders.

- Every placed/catalog component must represent a real, identifiable device or engineering item. For commercial parts, record the manufacturer and exact model/part number from an authoritative manufacturer datasheet or catalog, plus the source URL, document revision/date, and retrieval date. For standard-defined items without a commercial part number, use a verified standard symbol/type and document the applicable standard and exact definition.
- Each component definition must include standards-correct vector symbol or part geometry; real pin/terminal names and numbers; pin locations and electrical/mechanical connection types; editable, type-appropriate properties and variable values; and the source/provenance of each factual value. Symbols must connect to actual pins/nets in the project model and remain selectable, editable, and reportable.
- A visible symbol alone is not a component. Do not substitute a square, label, decorative glyph, or approximate icon for a diode, transistor, sensor, PLC module, valve, motor, or other device. Do not claim a component is functional merely because it can be drawn or moved.
- Never invent a manufacturer, part number, pinout, rating, dimension, tolerance, standard clause, or suitability claim. If authoritative data is unavailable or licensing is unclear, exclude/defer that component or mark the capability unavailable with the reason; do not silently fall back to a fake or generic part.
- Project topology and wiring must match the selected components' verified pins and ratings. Keep safety and code-compliance findings advisory until qualified review; sourced components do not make a design construction-ready.
- Do not generate large libraries or repeated project sets by renaming generic templates. A component/project is accepted only after source-backed data validation, pin/net checks, edit/save/reopen, report generation, and explicit provenance review.

### First implementation milestone under this requirement

Start with the electrical CAD model before expanding the symbol count: define and validate a versioned component/symbol/pin/net schema; migrate one real, source-backed electrical device end to end; prove that its displayed geometry, named pins, wire connectivity, editable properties, save/reopen, undo/redo, and BOM/report entry all refer to the same model instance. Add more components in small verified batches. Preserve the approved interface and existing toolbar/canvas/panel geometry throughout.

---

## Appendix A — Mouse interaction function catalog (original 280-item list)

## 1. LEFT-CLICK FUNCTIONS
1. Select Object
2. Select Text
3. Select Shape
4. Select Image
5. Select Layer
6. Select Tool
7. Activate Menu
8. Open Dropdown
9. Place Object
10. Insert Text
11. Draw Shape
12. Draw Line
13. Draw Curve
14. Add Point
15. Select Node
16. Move Cursor
17. Activate Input Field
18. Select Color
19. Apply Fill
20. Apply Outline
21. Select Page
22. Select Slide
23. Select Artboard
24. Select Component
25. Activate Control Point
26. Start Drawing
27. Start Dragging
28. Confirm Placement
29. Select Multiple Objects (Shift + Click)
30. Toggle Selection (Ctrl + Click)

## 2. RIGHT-CLICK FUNCTIONS
31. Open Context Menu
32. Copy
33. Cut
34. Paste
35. Delete
36. Duplicate
37. Rename
38. Group
39. Ungroup
40. Lock Object
41. Unlock Object
42. Hide Object
43. Show Object
44. Bring to Front
45. Send to Back
46. Bring Forward
47. Send Backward
48. Align Objects
49. Distribute Objects
50. Rotate Object
51. Flip Horizontal
52. Flip Vertical
53. Resize Object
54. Transform Object
55. Edit Object
56. Edit Text
57. Edit Nodes
58. Convert to Curves
59. Convert to Shape
60. Convert to Symbol
61. Object Properties
62. Format Object
63. Change Fill
64. Change Outline
65. Change Opacity
66. Change Layer
67. Move to Layer
68. Create New Layer
69. Merge Layers
70. Export Selection
71. Save as Component
72. Add Hyperlink
73. Remove Hyperlink
74. Add Comment
75. Inspect Object
76. Reset Transformation
77. Select Similar Objects
78. Select All
79. Invert Selection
80. Deselect All

## 3. DOUBLE-CLICK FUNCTIONS
81. Edit Text
82. Enter Group
83. Edit Shape
84. Edit Nodes
85. Open Object Properties
86. Open Component
87. Rename Layer
88. Rename Page
89. Rename Slide
90. Edit Symbol
91. Enter Isolation Mode
92. Open Image Editor
93. Edit Table Cell
94. Edit Chart
95. Edit Formula

## 4. MOUSE DRAG FUNCTIONS
96. Move Object
97. Resize Object
98. Rotate Object
99. Draw Selection Box
100. Select Multiple Objects
101. Draw Rectangle
102. Draw Ellipse
103. Draw Freehand Path
104. Draw Bezier Curve
105. Adjust Control Handles
106. Move Anchor Points
107. Adjust Gradient
108. Adjust Transparency
109. Crop Image
110. Pan Canvas
111. Drag Guide
112. Drag Ruler
113. Rearrange Layers
114. Rearrange Slides
115. Rearrange Pages
116. Rearrange Objects
117. Drag and Drop Files
118. Drag and Drop Components
119. Duplicate by Dragging
120. Adjust Object Spacing

## 5. MOUSE WHEEL FUNCTIONS
121. Zoom In
122. Zoom Out
123. Scroll Up
124. Scroll Down
125. Horizontal Scroll
126. Pan Canvas
127. Adjust Brush Size
128. Adjust Tool Value
129. Navigate Pages
130. Navigate Slides

## 6. CANVAS RIGHT-CLICK FUNCTIONS
131. Paste
132. Paste Special
133. Select All
134. Deselect All
135. Add New Object
136. Insert Image
137. Insert Text
138. Insert Shape
139. Insert Table
140. Insert Chart
141. Add Guide
142. Remove Guides
143. Show Grid
144. Hide Grid
145. Snap to Grid
146. Snap to Objects
147. Snap to Guides
148. Change Canvas Color
149. Change Page Size
150. Change Orientation
151. Canvas Properties
152. Page Properties
153. Zoom to Fit
154. Zoom to Selection
155. Reset View
156. Show Rulers
157. Hide Rulers
158. Lock Guides
159. Unlock Guides
160. Export Canvas

## 7. TOOLBAR RIGHT-CLICK FUNCTIONS
161. Customize Toolbar
162. Show Toolbar
163. Hide Toolbar
164. Reset Toolbar
165. Add Tool
166. Remove Tool
167. Rearrange Tools
168. Pin Tool
169. Unpin Tool
170. Tool Settings
171. Tool Properties
172. Reset Tool
173. Assign Shortcut
174. Change Tool Icon
175. Expand Tool Group
176. Collapse Tool Group
177. Show Tool Labels
178. Hide Tool Labels
179. Dock Toolbar
180. Undock Toolbar

## 8. LAYER PANEL MOUSE FUNCTIONS
181. Select Layer
182. Create Layer
183. Delete Layer
184. Duplicate Layer
185. Rename Layer
186. Lock Layer
187. Unlock Layer
188. Hide Layer
189. Show Layer
190. Reorder Layer
191. Merge Layer
192. Flatten Layer
193. Group Layers
194. Ungroup Layers
195. Change Layer Opacity
196. Change Layer Color
197. Move Object Between Layers
198. Expand Layer
199. Collapse Layer
200. Export Layer

## 9. ADVANCED CAD / VECTOR FUNCTIONS
201. Trim
202. Extend
203. Offset
204. Fillet
205. Chamfer
206. Weld
207. Intersect
208. Subtract
209. Combine
210. Break Apart
211. Join Paths
212. Split Path
213. Close Path
214. Simplify Path
215. Smooth Nodes
216. Convert Node Type
217. Add Dimension
218. Edit Dimension
219. Measure Distance
220. Measure Angle
221. Measure Area
222. Set Origin
223. Set Pivot Point
224. Mirror Object
225. Create Array
226. Create Pattern
227. Apply Boolean Operation
228. Extrude Object
229. Apply Perspective
230. Create Clipping Mask

## 10. POWERPOINT / PRESENTATION FUNCTIONS
231. Add Slide
232. Duplicate Slide
233. Delete Slide
234. Hide Slide
235. Change Slide Layout
236. Change Slide Background
237. Add Animation
238. Edit Animation
239. Add Transition
240. Edit Transition
241. Insert Media
242. Insert Chart
243. Insert SmartArt
244. Insert Text Box
245. Add Speaker Notes
246. Start Presentation
247. Preview Animation
248. Arrange Slide Objects
249. Group Slide Objects
250. Export Slide

## 11. ADDITIONAL PROFESSIONAL MOUSE FUNCTIONS
251. Undo
252. Redo
253. Repeat Last Action
254. Open Quick Actions
255. Open Command Search
256. Open Object Inspector
257. Open Properties Panel
258. Open Color Picker
259. Open Font Picker
260. Open Stroke Settings
261. Open Fill Settings
262. Open Effects Panel
263. Open Animation Panel
264. Open History Panel
265. Open Asset Library
266. Open Symbol Library
267. Open Templates
268. Open Plugins
269. Open Help
270. Open Keyboard Shortcuts
271. Copy Style
272. Paste Style
273. Clear Formatting
274. Reset Object
275. Replace Image
276. Relink Asset
277. Embed Asset
278. Detach Component
279. Create Component
280. Preview Object

**TOTAL: 280 MOUSE-INTERACTION FUNCTIONS.**

---

## Appendix B — Component interaction function catalog (original 360-item list)

# COMPONENT FUNCTIONS INSIDE AN ENGINEERING DESIGN CANVAS
**CAD | Electrical Design | Circuit Design | PCB | Mechanical Design | CorelDRAW | PowerPoint | Diagram Editors**

## 1. COMPONENT SELECTION
1. Select Component
2. Multi-Select Components
3. Select All Components
4. Deselect Components
5. Select Connected Components
6. Select Similar Components
7. Select Components by Type
8. Select Components by Layer
9. Select Components by Name
10. Invert Selection

## 2. COMPONENT MOVEMENT
11. Move Component
12. Drag Component
13. Reposition Component
14. Move Multiple Components
15. Move Connected Components
16. Move Component Horizontally
17. Move Component Vertically
18. Move Component Freely
19. Move Component by Coordinates
20. Move Component with Arrow Keys
21. Snap Component to Grid
22. Snap Component to Another Component
23. Align Component to Guide
24. Lock Component Position
25. Unlock Component Position

## 3. COMPONENT CONNECTION
26. Connect Two Components
27. Connect Multiple Components
28. Connect Component Pins
29. Connect Input to Output
30. Connect Output to Input
31. Connect Power Pins
32. Connect Ground Pins
33. Connect Signal Pins
34. Connect Data Ports
35. Connect Control Ports
36. Connect Mechanical Joints
37. Connect Hydraulic Ports
38. Connect Pneumatic Ports
39. Connect Optical Ports
40. Connect Network Ports
41. Auto-Connect Components
42. Disconnect Components
43. Reconnect Components
44. Replace Existing Connection
45. Validate Connection
46. Highlight Connected Components
47. Trace Component Connections
48. Show Connection Path
49. Hide Connection Path
50. Detect Unconnected Components

## 4. WIRING FUNCTIONS
51. Start Wire
52. Draw Wire
53. End Wire
54. Connect Wire to Pin
55. Connect Wire to Terminal
56. Connect Wire to Another Wire
57. Extend Wire
58. Shorten Wire
59. Move Wire
60. Drag Wire
61. Bend Wire
62. Split Wire
63. Join Wires
64. Merge Wires
65. Delete Wire
66. Duplicate Wire
67. Copy Wire
68. Paste Wire
69. Rotate Wire
70. Change Wire Direction
71. Change Wire Thickness
72. Change Wire Color
73. Change Wire Style
74. Change Wire Type
75. Change Wire Material
76. Change Wire Label
77. Add Wire Junction
78. Remove Wire Junction
79. Add Wire Node
80. Remove Wire Node
81. Auto-Route Wire
82. Manual-Route Wire
83. Orthogonal Wire Routing
84. Curved Wire Routing
85. Straight Wire Routing
86. Avoid Wire Crossing
87. Detect Wire Crossing
88. Detect Wire Short Circuit
89. Highlight Wire Path
90. Trace Wire Connection

## 5. COMPONENT ROTATION
91. Rotate Component
92. Rotate 90 Degrees
93. Rotate 180 Degrees
94. Rotate 270 Degrees
95. Rotate Clockwise
96. Rotate Counterclockwise
97. Free Rotation
98. Rotate Around Center
99. Rotate Around Custom Pivot
100. Reset Rotation

## 6. COMPONENT TRANSFORMATION
101. Resize Component
102. Scale Component
103. Stretch Component
104. Flip Horizontally
105. Flip Vertically
106. Mirror Component
107. Skew Component
108. Change Component Orientation
109. Change Component Dimensions
110. Reset Transformation

## 7. COMPONENT EDITING
111. Edit Component
112. Edit Component Properties
113. Edit Component Name
114. Edit Component Label
115. Edit Component Value
116. Edit Component Description
117. Edit Component Parameters
118. Edit Component Dimensions
119. Edit Component Material
120. Edit Component Color
121. Edit Component Shape
122. Edit Component Symbol
123. Edit Component Footprint
124. Edit Component Pins
125. Edit Component Terminals
126. Edit Component Ports
127. Edit Component Metadata
128. Edit Component Reference ID
129. Edit Component Orientation
130. Reset Component Properties

## 8. COMPONENT DUPLICATION
131. Copy Component
132. Cut Component
133. Paste Component
134. Duplicate Component
135. Clone Component
136. Duplicate Connected Components
137. Duplicate Component with Wiring
138. Duplicate Component without Wiring
139. Create Component Array
140. Create Repeated Component Pattern

## 9. COMPONENT GROUPING
141. Group Components
142. Ungroup Components
143. Create Component Assembly
144. Break Component Assembly
145. Add Component to Group
146. Remove Component from Group
147. Move Group
148. Rotate Group
149. Resize Group
150. Lock Group
151. Unlock Group
152. Duplicate Group
153. Connect Component Groups
154. Save Group as Module
155. Convert Group to Reusable Component

## 10. COMPONENT ALIGNMENT
156. Align Left
157. Align Right
158. Align Top
159. Align Bottom
160. Align Center
161. Align Horizontally
162. Align Vertically
163. Distribute Horizontally
164. Distribute Vertically
165. Equalize Spacing
166. Snap to Grid
167. Snap to Component
168. Snap to Connection Point
169. Auto-Align Components
170. Auto-Arrange Components

## 11. COMPONENT PIN AND TERMINAL FUNCTIONS
171. Select Pin
172. Move Pin
173. Add Pin
174. Delete Pin
175. Rename Pin
176. Change Pin Number
177. Change Pin Type
178. Change Pin Direction
179. Connect Pin
180. Disconnect Pin
181. Highlight Pin
182. Show Pin Name
183. Hide Pin Name
184. Show Pin Number
185. Hide Pin Number
186. Swap Pins
187. Lock Pin
188. Unlock Pin
189. Validate Pin Connection
190. Detect Floating Pins

## 12. COMPONENT LAYER FUNCTIONS
191. Move Component to Layer
192. Create Component Layer
193. Delete Component Layer
194. Hide Component Layer
195. Show Component Layer
196. Lock Component Layer
197. Unlock Component Layer
198. Change Component Layer
199. Bring Component Forward
200. Send Component Backward
201. Bring Component to Front
202. Send Component to Back
203. Merge Component Layers
204. Duplicate Component Layer
205. Isolate Component Layer

## 13. COMPONENT CONSTRAINTS
206. Lock Component
207. Unlock Component
208. Fix Component Position
209. Apply Distance Constraint
210. Apply Angle Constraint
211. Apply Alignment Constraint
212. Apply Parallel Constraint
213. Apply Perpendicular Constraint
214. Apply Coincident Constraint
215. Apply Tangent Constraint
216. Apply Symmetry Constraint
217. Apply Rotation Constraint
218. Apply Movement Constraint
219. Remove Constraint
220. Validate Constraints

## 14. COMPONENT SIMULATION
221. Simulate Component
222. Simulate Connected Components
223. Start Simulation
224. Stop Simulation
225. Pause Simulation
226. Resume Simulation
227. Reset Simulation
228. Monitor Component State
229. Monitor Component Voltage
230. Monitor Component Current
231. Monitor Component Power
232. Monitor Component Temperature
233. Monitor Component Frequency
234. Monitor Component Signal
235. Display Simulation Results
236. Highlight Active Connections
237. Detect Simulation Errors
238. Inspect Component Behavior
239. Animate Component Operation
240. Export Simulation Results

## 15. COMPONENT TESTING AND VALIDATION
241. Test Component
242. Test Connection
243. Test Wiring
244. Test Circuit
245. Check Connectivity
246. Check Pin Compatibility
247. Check Electrical Rules
248. Check Design Rules
249. Detect Short Circuits
250. Detect Open Circuits
251. Detect Overlapping Components
252. Detect Invalid Connections
253. Detect Missing Connections
254. Detect Duplicate Connections
255. Detect Component Conflicts
256. Highlight Errors
257. Show Error Details
258. Auto-Fix Supported Errors
259. Generate Validation Report
260. Clear Validation Results

## 16. COMPONENT ORGANIZATION
261. Rename Component
262. Number Component
263. Tag Component
264. Categorize Component
265. Search Component
266. Filter Components
267. Sort Components
268. Hide Component
269. Show Component
270. Isolate Component
271. Highlight Component
272. Add Component Notes
273. Add Component Comments
274. Add Component Documentation
275. Assign Component Identifier
276. Create Component Hierarchy
277. Add Component to Library
278. Remove Component from Library
279. Save Component Template
280. Load Component Template

## 17. COMPONENT REPLACEMENT
281. Replace Component
282. Swap Component
283. Change Component Type
284. Change Component Model
285. Change Component Symbol
286. Change Component Footprint
287. Replace Component While Preserving Connections
288. Replace Component While Preserving Position
289. Replace Component While Preserving Properties
290. Restore Previous Component

## 18. ADVANCED WIRING AND ROUTING
291. Create Wire Bus
292. Connect Component to Bus
293. Add Bus Entry
294. Remove Bus Entry
295. Split Bus
296. Merge Buses
297. Rename Net
298. Assign Net Label
299. Assign Net Class
300. Assign Wire Gauge
301. Assign Wire Length
302. Calculate Wire Length
303. Calculate Wire Resistance
304. Calculate Voltage Drop
305. Auto-Optimize Wiring
306. Route Around Obstacles
307. Route Through Waypoints
308. Add Wire Waypoint
309. Remove Wire Waypoint
310. Move Wire Waypoint
311. Create Differential Pair
312. Route Differential Pair
313. Create Wire Harness
314. Bundle Wires
315. Unbundle Wires
316. Create Terminal Block
317. Connect to Terminal Block
318. Generate Wiring Diagram
319. Generate Netlist
320. Export Wiring Data

## 19. COMPONENT INTERACTION WITH THE CANVAS
321. Drag Component from Sidebar to Canvas
322. Drop Component onto Canvas
323. Preview Component Before Placement
324. Place Component at Cursor
325. Place Multiple Components
326. Cancel Component Placement
327. Undo Component Placement
328. Redo Component Placement
329. Show Component Bounding Box
330. Show Component Selection Handles
331. Show Component Connection Points
332. Show Component Alignment Guides
333. Show Component Dimensions
334. Show Component Coordinates
335. Show Component Tooltip
336. Open Component Context Menu
337. Open Component Properties Panel
338. Open Component Quick Actions
339. Zoom to Component
340. Center Component in View

## 20. PROFESSIONAL CANVAS INTERACTION FUNCTIONS
341. Drag Component Without Disconnecting Wires
342. Drag Component and Automatically Reroute Wires
343. Move Connected Components Together
344. Move Component While Preserving Connection Geometry
345. Rotate Component While Maintaining Connections
346. Duplicate Component with Existing Connections
347. Auto-Snap Wire to Nearest Valid Pin
348. Preview Connection Before Completion
349. Highlight Valid Connection Targets
350. Highlight Invalid Connection Targets
351. Prevent Invalid Pin Connections
352. Automatically Create Wire Junctions
353. Automatically Remove Redundant Junctions
354. Automatically Update Connections After Movement
355. Automatically Recalculate Wire Paths
356. Automatically Update Component Coordinates
357. Automatically Update Component Dimensions
358. Automatically Update Component Labels
359. Automatically Update Netlist
360. Automatically Save Canvas Changes

---

## Appendix C — Global UI/UX standard (GLOBAL-UI-UX-001)

# GLOBAL UI/UX STANDARD
## UNIVERSAL MENU, ICON, DROPDOWN AND FLOATING PANEL BEHAVIOR

**RULE ID:** GLOBAL-UI-UX-001  
**SCOPE:** ALL CURRENT AND FUTURE PROJECTS  
**PRIORITY:** Mandatory Global Development Standard  
**APPLIES TO:** All repositories, websites, web applications, dashboards, desktop applications, engineering software, CAD systems, and future products.

---

## 1. PRIMARY OBJECTIVE

Implement consistent, professional, lightweight, and predictable behavior for all interactive menus, icons, dropdowns, popovers, tooltips, and floating panels.

**GOLDEN RULE:**

Opening or closing a menu, icon panel, or dropdown must NEVER push, resize, reposition, or disturb the underlying application content.

All temporary menus and panels must float above the existing interface.

The underlying page, canvas, workspace, toolbar, sidebar, and other components must remain stationary.

---

## 2. UNIVERSAL MENU AND ICON BEHAVIOR

Apply the following interaction rules to all applicable interactive menus and icons.

### A. OPEN ON CLICK

- Click a menu or icon → its associated content opens.
- Click the same menu or icon again → its content closes.
- Click another menu or icon → the currently open panel closes and the newly selected panel opens.
- Only one transient menu or icon panel may remain open at a time within the same menu system.
- Opening a panel must not alter the surrounding layout.

### B. AUTOMATIC CLOSE ON MOUSE LEAVE

- When the mouse leaves the menu trigger and its associated panel, close the panel automatically.
- Moving the mouse from the trigger into its panel must NOT close it.
- Avoid flickering, accidental closing, or reopening loops.
- Use a short delay where necessary to allow natural mouse movement.
- Do not close a panel while the pointer is still interacting with its contents.

### C. CLICK OUTSIDE TO CLOSE

- Clicking outside an open menu or panel closes it.
- Pressing Escape closes the active panel.
- Opening another transient panel closes the previous one.
- Closing a panel must not reset unrelated application state.

### D. TOUCHSCREEN BEHAVIOR

- Tap a menu or icon to open its content.
- Tap the same trigger to close it.
- Tap another trigger to switch panels.
- Tap outside to close.
- Do not rely on hover or mouseleave for touch devices.
- Support keyboard and accessibility interactions where applicable.

---

## 3. DROPDOWN DISPLAY STANDARD

All dropdown menus must:

1. Open directly beneath or beside their associated trigger.
2. Float above the underlying application interface.
3. Display options in a clean, organized layout.
4. Support vertical lists and appropriate horizontal arrangements.
5. Remain fully interactive while open.
6. Close after selecting a completed command, unless the command requires continued interaction.
7. Support internal scrolling when content exceeds available space.
8. Remain within the visible viewport whenever possible.
9. Automatically reposition near screen boundaries.
10. Maintain appropriate stacking order above normal application content.

**IMPORTANT:**

Dropdowns must NEVER push the page, canvas, workspace, navigation bars, or other elements downward.

---

## 4. ICON AND TOOLBAR BEHAVIOR

Apply the same principles to interactive icons.

Examples include:

- Settings icons
- Search icons
- User profile icons
- Notification icons
- Tool selectors
- Drawing tools
- Engineering commands
- Formatting controls
- Filter icons
- Context menus
- Additional options menus

When an icon opens a temporary panel:

- The panel must appear near its associated icon.
- It must float above the interface.
- It must not change the position of surrounding elements.
- It must close using the defined interaction rules.
- Its existing functionality must remain intact.

Do not apply automatic closing to persistent panels, active editing dialogs, or workflows requiring ongoing user interaction unless explicitly designed for that behavior.

---

## 5. STRICT NO-LAYOUT-SHIFT RULE

**THIS RULE IS MANDATORY.**

Opening or closing any transient menu, dropdown, or icon panel must not cause:

- Page movement
- Canvas displacement
- Workspace resizing
- Toolbar shifting
- Sidebar movement
- Unexpected scrolling
- Content jumping
- Unnecessary component reflow
- Loss of user selection
- Changes to application data

**Expected behavior:**

Click → Panel opens above existing content → User interacts → Panel closes.

**Everything underneath remains stationary.**

---

## 6. TECHNICAL IMPLEMENTATION STANDARD

Use lightweight, maintainable solutions.

Recommended approaches:

- CSS absolute or fixed positioning
- React portals or equivalent framework mechanisms when necessary
- Correct stacking contexts and z-index
- Pointer and click event handling
- Mouseleave handling for desktop
- Click-outside detection
- Escape-key handling
- Appropriate focus management
- Viewport-aware positioning
- Internal overflow scrolling

Avoid unnecessary heavy UI libraries.

Prefer reusable components and shared interaction logic.

Prevent event propagation problems, accidental panel closure, focus loss, and conflicts between nested menus.

For accessibility, support appropriate ARIA attributes, visible focus indicators, keyboard navigation, and focus restoration.

---

## 7. GLOBAL CONSISTENCY REQUIREMENT

All applicable menus and icons across a product must follow the same interaction standard.

Do not implement different opening and closing behaviors without a documented UX reason.

Create or reuse a shared menu/popover component where appropriate.

The same global standard must apply across multiple projects while allowing each product to retain its own branding, visual design, and functionality.

---

## 8. VERIFICATION AND ACCEPTANCE TESTS

Before considering implementation complete, verify:

- Click opens the correct panel.
- Clicking the same trigger closes it.
- Clicking another trigger switches panels.
- Only one transient panel is open at a time.
- Mouse movement into the panel does not close it.
- Mouseleave closes the panel correctly.
- Clicking outside closes it.
- Escape closes it.
- Touch interactions work correctly.
- Keyboard navigation works correctly.
- Panels remain inside the viewport where possible.
- Long menus scroll internally.
- No underlying layout movement occurs.
- All existing commands remain functional.
- No application data is modified unexpectedly.
- No regression is introduced.

Test desktop, mobile, and tablet viewport sizes.

---

## 9. IMPLEMENTATION, MERGE AND DEPLOYMENT

For every project adopting this standard:

1. Inspect the existing menu and icon implementations.
2. Identify inconsistent behavior.
3. Implement the shared interaction standard.
4. Preserve existing application functionality.
5. Run relevant automated and browser tests.
6. Fix verified regressions.
7. Commit the verified changes.
8. Merge into the approved main branch.
9. Deploy using the project's existing deployment workflow.
10. Verify the deployed application.

Do not claim successful deployment without verification.

Do not proceed with unrelated development until the required menu correction and its verification are complete.

---

## 10. PERMANENT REPOSITORY REFERENCE

Store this document in the project's designated goals, governance, or standards repository.

**Recommended filename:**

`GLOBAL_UI_UX_MENU_ICON_STANDARD.md`

**Rule identifier:**

`GLOBAL-UI-UX-001`

Reference this standard from the project's `AGENTS.md` or equivalent development instructions.

For future projects:

- Load this standard during initial project setup.
- Apply it to all relevant interactive menus and icons.
- Include its acceptance tests in the normal development workflow.
- Reuse existing compliant components where practical.
- Do not unnecessarily rewrite working components.

This standard remains active until the project owner explicitly approves a revision.

---

## 11. FINAL CODEX DIRECTIVE

**CODEX:**

Treat GLOBAL-UI-UX-001 as a reusable, project-independent development standard.

Apply it consistently to all applicable current and future software projects.

Never allow transient menus, dropdowns, or icon panels to disturb the underlying interface.

Preserve existing functionality.

Implement, test, commit, merge, deploy, and verify changes according to each project's authorized workflow.

Save and reference this rule in the designated goals or standards repository for future development.

**GLOBAL STANDARD:**

**CLICK TO OPEN → FLOAT ABOVE CONTENT → INTERACT → AUTO-CLOSE ON MOUSE LEAVE OR OUTSIDE CLICK → ZERO LAYOUT SHIFT.**

---

## Appendix D — Real engineering components and project examples

# ELECTRICAL ENGINEERING DESIGN LIBRARY — REAL COMPONENTS FOR 50 INDUSTRIAL PROJECTS

**Requirement:** Every component must represent a real, commercially available engineering device with an identifiable manufacturer, model number, technical specifications, terminals, and electrical connections.

**No dummy components. No placeholder symbols. No fictional manufacturer part numbers.**

The following is a proposed component library for designing the 50 projects. It is **not a claim that these components are already installed in an accessible CAD library**.

## 1. INDUSTRIAL POWER AND DISTRIBUTION COMPONENTS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 1 | Miniature circuit breaker (MCB) | Siemens SENTRON 5SY |
| 2 | Molded-case circuit breaker (MCCB) | Schneider Electric ComPacT NSX |
| 3 | Air circuit breaker (ACB) | ABB SACE Emax 2 |
| 4 | Residual-current circuit breaker (RCCB) | ABB F200 |
| 5 | RCBO | ABB DS201 |
| 6 | Motor protection circuit breaker | Siemens SIRIUS 3RV2 |
| 7 | Fuse switch disconnector | Siemens SENTRON 3NP1 |
| 8 | Industrial fuse | Eaton Bussmann series |
| 9 | Fuse holder | Phoenix Contact |
| 10 | Switch disconnector | ABB OT series |
| 11 | Main isolator | Schneider Electric TeSys Vario |
| 12 | Automatic transfer switch | Socomec ATyS |
| 13 | Surge protection device | DEHNguard |
| 14 | Power distribution block | Phoenix Contact PTFIX |
| 15 | Busbar system | Rittal RiLine |
| 16 | Current transformer | Schneider Electric PowerLogic |
| 17 | Voltage transformer | ABB instrument transformers |
| 18 | Multifunction power meter | Siemens SENTRON PAC |
| 19 | Energy meter | Schneider Electric PowerLogic PM5000 |
| 20 | Power quality analyzer | Janitza UMG 96 |

## 2. MOTOR CONTROL COMPONENTS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 21 | Three-phase contactor | Siemens SIRIUS 3RT2 |
| 22 | Reversing contactor assembly | Schneider Electric TeSys Deca |
| 23 | Thermal overload relay | Siemens SIRIUS 3RU2 |
| 24 | Electronic overload relay | Siemens SIRIUS 3RB3 |
| 25 | Motor starter | Eaton PKZM0 |
| 26 | Soft starter | ABB PSTX |
| 27 | Variable-frequency drive | Siemens SINAMICS G120 |
| 28 | Compact variable-frequency drive | ABB ACS580 |
| 29 | Servo drive | Siemens SINAMICS S210 |
| 30 | Servo motor | Siemens SIMOTICS S-1FK2 |
| 31 | Three-phase induction motor | Siemens SIMOTICS GP |
| 32 | Geared motor | SEW-EURODRIVE DRN series |
| 33 | Motor brake | SEW-EURODRIVE brake systems |
| 34 | Motor braking resistor | Siemens SINAMICS accessories |
| 35 | Motor line reactor | Schneider Electric Altivar accessories |
| 36 | EMC filter | Schaffner FN series |
| 37 | Motor encoder | SICK DFS60 |
| 38 | Motor thermistor relay | Siemens SIRIUS 3RN2 |
| 39 | Motor monitoring relay | Schneider Electric Harmony Control |
| 40 | Motor control center | Siemens SIVACON S8 |

## 3. PLC AND INDUSTRIAL AUTOMATION COMPONENTS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 41 | Compact PLC | Siemens SIMATIC S7-1200 |
| 42 | Modular PLC | Siemens SIMATIC S7-1500 |
| 43 | Safety PLC | Siemens SIMATIC S7-1500F |
| 44 | PLC CPU | Siemens CPU 1511-1 PN |
| 45 | Digital input module | Siemens SM 521 |
| 46 | Digital output module | Siemens SM 522 |
| 47 | Analog input module | Siemens SM 531 |
| 48 | Analog output module | Siemens SM 532 |
| 49 | Remote I/O interface | Siemens ET 200SP |
| 50 | Remote I/O station | WAGO 750 series |
| 51 | PLC power supply | Siemens SITOP |
| 52 | Industrial communication processor | Siemens SIMATIC CP |
| 53 | PLC memory card | Siemens SIMATIC Memory Card |
| 54 | Industrial Ethernet switch | Siemens SCALANCE XC |
| 55 | Industrial router | Siemens SCALANCE M |
| 56 | HMI touch panel | Siemens SIMATIC HMI Unified |
| 57 | Industrial panel PC | Siemens SIMATIC IPC |
| 58 | Industrial edge computer | Siemens Industrial Edge |
| 59 | PLC interface relay | Phoenix Contact PLC-INTERFACE |
| 60 | Signal conditioner | Phoenix Contact MINI Analog Pro |

## 4. INDUSTRIAL SENSORS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 61 | Inductive proximity sensor | SICK IME |
| 62 | Capacitive proximity sensor | ifm KI |
| 63 | Photoelectric sensor | SICK W4 |
| 64 | Ultrasonic sensor | Pepperl+Fuchs UC |
| 65 | Laser distance sensor | SICK DT |
| 66 | Magnetic cylinder sensor | Festo SMT-8M |
| 67 | Mechanical limit switch | Schneider Electric XCK |
| 68 | Rotary encoder | SICK DFS60 |
| 69 | Linear position sensor | Balluff BTL |
| 70 | Pressure transmitter | Endress+Hauser Cerabar |
| 71 | Differential pressure transmitter | Siemens SITRANS P |
| 72 | Temperature transmitter | Endress+Hauser iTEMP |
| 73 | RTD temperature sensor | WIKA TR series |
| 74 | Thermocouple | WIKA TC series |
| 75 | Flowmeter | Endress+Hauser Promag |
| 76 | Level transmitter | Endress+Hauser Micropilot |
| 77 | Level switch | Endress+Hauser Liquiphant |
| 78 | Conductivity sensor | Endress+Hauser Memosens |
| 79 | pH sensor | Endress+Hauser Memosens CPS |
| 80 | Vibration sensor | ifm VSA |

## 5. INDUSTRIAL CONTROL AND SWITCHING

| # | Component | Real manufacturer / product family |
|---|---|---|
| 81 | Start pushbutton | Schneider Electric Harmony XB5 |
| 82 | Stop pushbutton | Schneider Electric Harmony XB5 |
| 83 | Emergency-stop device | Schneider Electric Harmony XB5 |
| 84 | Selector switch | Schneider Electric Harmony XB5 |
| 85 | Key-operated switch | Schneider Electric Harmony XB5 |
| 86 | Pilot light | Schneider Electric Harmony XB5 |
| 87 | Illuminated pushbutton | Schneider Electric Harmony XB5 |
| 88 | Control relay | Finder 55 series |
| 89 | Timer relay | Siemens SIRIUS 3RP |
| 90 | Monitoring relay | Siemens SIRIUS 3UG |
| 91 | Safety relay | Pilz PNOZ X |
| 92 | Safety controller | Pilz PNOZmulti 2 |
| 93 | Solid-state relay | Carlo Gavazzi RGC |
| 94 | Interface relay | Phoenix Contact PLC-RSC |
| 95 | Latching relay | Finder 26 series |
| 96 | Temperature controller | Omron E5CC |
| 97 | PID process controller | Eurotherm 3200 |
| 98 | Signal isolator | Phoenix Contact MINI Analog Pro |
| 99 | Alarm annunciator | Eaton M22 |
| 100 | Industrial buzzer | Werma |

## 6. TERMINALS, WIRING AND CONNECTION COMPONENTS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 101 | Feed-through terminal | Phoenix Contact UK 5 N |
| 102 | Ground terminal | Phoenix Contact USLKG |
| 103 | Fuse terminal | Phoenix Contact UK 5-HESI |
| 104 | Disconnect terminal | Phoenix Contact UT series |
| 105 | Sensor terminal | Phoenix Contact PT series |
| 106 | Multi-level terminal | Phoenix Contact ST series |
| 107 | Terminal jumper | Phoenix Contact FBS |
| 108 | Terminal end plate | Phoenix Contact |
| 109 | Terminal end clamp | Phoenix Contact |
| 110 | DIN rail | Phoenix Contact NS 35 |
| 111 | Wire duct | Panduit |
| 112 | Cable gland | LAPP SKINTOP |
| 113 | Cable marker | Phoenix Contact |
| 114 | Wire marker | Weidmüller |
| 115 | Ferrule | Weidmüller |
| 116 | Ring cable lug | Klauke |
| 117 | Industrial connector | Harting Han |
| 118 | M12 sensor connector | Phoenix Contact |
| 119 | Multipole connector | Harting Han |
| 120 | Industrial Ethernet connector | Siemens IE FC RJ45 |

## 7. INDUSTRIAL POWER SUPPLIES

| # | Component | Real manufacturer / product family |
|---|---|---|
| 121 | 24 V DC power supply | Siemens SITOP PSU6200 |
| 122 | Redundant power supply module | Siemens SITOP RED |
| 123 | DC UPS | Siemens SITOP UPS1600 |
| 124 | Industrial battery module | Siemens SITOP BAT1600 |
| 125 | DC/DC converter | Phoenix Contact QUINT |
| 126 | AC/DC converter | Mean Well SDR |
| 127 | Control transformer | Schneider Electric Phaseo |
| 128 | Isolation transformer | BLOCK |
| 129 | Electronic circuit protector | Phoenix Contact CAPAROC |
| 130 | Power monitoring module | Siemens SITOP |

## 8. PNEUMATIC AND HYDRAULIC COMPONENTS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 131 | Pneumatic solenoid valve | Festo VUVG |
| 132 | Pneumatic valve terminal | Festo VTUG |
| 133 | Pneumatic cylinder | Festo DSBC |
| 134 | Compact pneumatic cylinder | Festo ADN |
| 135 | Pneumatic gripper | Festo DHPS |
| 136 | Air preparation unit | Festo MS series |
| 137 | Pressure regulator | Festo LR |
| 138 | Pressure sensor | Festo SPAN |
| 139 | Flow control valve | Festo GRLA |
| 140 | Vacuum generator | Festo OVEM |
| 141 | Hydraulic directional valve | Bosch Rexroth 4WE |
| 142 | Hydraulic proportional valve | Bosch Rexroth |
| 143 | Hydraulic pressure sensor | Bosch Rexroth |
| 144 | Hydraulic power unit | Bosch Rexroth CytroPac |
| 145 | Hydraulic cylinder | Bosch Rexroth |

## 9. BUILDING, ENERGY AND POWER SYSTEM COMPONENTS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 146 | Solar inverter | SMA Sunny Tripower |
| 147 | Hybrid inverter | Fronius GEN24 |
| 148 | PV DC isolator | ABB OTDC |
| 149 | PV surge protector | DEHNguard |
| 150 | PV connector | Stäubli MC4 |
| 151 | Battery inverter | SMA Sunny Island |
| 152 | Battery energy storage system | Tesla Megapack |
| 153 | EV charging station | ABB Terra |
| 154 | EV charging controller | Phoenix Contact CHARX |
| 155 | Generator controller | ComAp InteliLite |
| 156 | Automatic transfer switch | Socomec ATyS |
| 157 | UPS system | Schneider Electric Galaxy |
| 158 | Power monitoring meter | Schneider Electric PowerLogic |
| 159 | Building automation controller | Siemens Desigo PXC |
| 160 | HVAC actuator | Belimo |
| 161 | HVAC differential pressure sensor | Siemens |
| 162 | Fire alarm interface module | Siemens Cerberus PRO |
| 163 | Emergency lighting controller | Eaton |
| 164 | Refrigeration controller | Danfoss AK-CC |
| 165 | Energy management gateway | Siemens |

## 10. ROBOTICS AND MACHINE SAFETY COMPONENTS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 166 | Industrial robot | ABB IRB 1200 |
| 167 | Industrial robot controller | ABB OmniCore |
| 168 | Collaborative robot | Universal Robots UR10e |
| 169 | Robot gripper | SCHUNK |
| 170 | Robot tool changer | ATI Industrial Automation |
| 171 | Safety light curtain | SICK deTec4 |
| 172 | Safety laser scanner | SICK microScan3 |
| 173 | Safety door switch | Schmersal AZM |
| 174 | Safety relay | Pilz PNOZ |
| 175 | Safety PLC | Siemens S7-1500F |
| 176 | Two-hand control station | Schneider Electric |
| 177 | Emergency-stop pushbutton | Eaton M22 |
| 178 | Safety enabling switch | EUCHNER |
| 179 | Safety encoder | SICK |
| 180 | Safety-rated drive | Siemens SINAMICS |

## 11. ADDITIONAL SPECIALIZED COMPONENTS

| # | Component | Real manufacturer / product family |
|---|---|---|
| 181 | Industrial weighing transmitter | Siemens SIWAREX |
| 182 | Load cell | HBM Z6 |
| 183 | Barcode scanner | SICK CLV |
| 184 | RFID reader | Siemens SIMATIC RF |
| 185 | Machine vision camera | Cognex In-Sight |
| 186 | Industrial lighting | Banner Engineering |
| 187 | Industrial network gateway | HMS Anybus |
| 188 | Modbus gateway | Moxa MGate |
| 189 | Industrial wireless access point | Siemens SCALANCE W |
| 190 | Remote telemetry unit | Schneider Electric SCADAPack |
| 191 | Data logger | Campbell Scientific CR1000X |
| 192 | Industrial alarm dialer | Ewon |
| 193 | Industrial vibration monitor | ifm VSE |
| 194 | Condition monitoring system | SKF IMx |
| 195 | Industrial panel enclosure | Rittal AX |
| 196 | Floor-standing enclosure | Rittal VX25 |
| 197 | Enclosure cooling unit | Rittal Blue e+ |
| 198 | Enclosure thermostat | STEGO |
| 199 | Enclosure heater | STEGO |
| 200 | Cabinet fan/filter unit | Rittal |

---

# 12. REAL PROJECT EXAMPLES — ALL 50 PROJECTS

Each project below uses real equipment families. The listed equipment is a starting bill of materials, **not a completed or verified electrical design**.

| Project | Real components to use |
|---|---|
| 01. Reversing motor starter | Siemens 3RT2, 3RV2, 3RU2, SIMOTICS GP, Harmony XB5 |
| 02. Star–delta starter | Siemens 3RT2 contactors, 3RP timer, 3RU2 overload, SIMOTICS GP |
| 03. VFD conveyor | Siemens S7-1200, SINAMICS G120, SICK W4, SEW DRN |
| 04. Servo motion cell | Siemens S7-1500, SINAMICS S210, SIMOTICS S-1FK2, SICK encoders |
| 05. Duty/standby pump | ABB PSTX, Siemens S7-1200, Endress+Hauser Cerabar |
| 06. Segmented MCC | Siemens SIVACON S8, 3RV2, 3RT2, SENTRON PAC |
| 07. Industrial fan bank | ABB ACS580, Siemens S7-1500, SITRANS P |
| 08. Packaging machine | Siemens S7-1500, ET 200SP, Festo VUVG, SICK W4 |
| 09. Hoist/crane control | SEW drives and brakes, Siemens PLC, SICK encoders |
| 10. Hydraulic power unit | Bosch Rexroth CytroPac, 4WE valves, Siemens PLC |
| 11. Modular PLC cabinet | Siemens S7-1500, ET 200SP, SITOP, SCALANCE |
| 12. Water-treatment plant | Siemens S7-1500, Endress+Hauser Memosens, Promag |
| 13. Wastewater lift station | Schneider SCADAPack, ABB PSTX, Endress+Hauser Micropilot |
| 14. Food processing line | Siemens S7-1500, SEW drives, SICK sensors |
| 15. Chemical batch reactor | Siemens S7-1500, Endress+Hauser temperature/pressure instruments |
| 16. Brewery/CIP skid | Siemens PLC, Endress+Hauser Promag, Memosens sensors |
| 17. Industrial oven | Eurotherm 3200, WIKA thermocouples, Carlo Gavazzi SSR |
| 18. HVAC AHU | Siemens Desigo PXC, Belimo actuators, Siemens sensors |
| 19. Cold storage | Danfoss AK-CC, pressure sensors, refrigeration actuators |
| 20. Warehouse sorter | Siemens S7-1500, SINAMICS G120, SICK scanners |
| 21. LV distribution board | ABB SACE Emax 2, ComPacT NSX, PowerLogic |
| 22. Industrial subdistribution | Siemens SENTRON, Janitza UMG, Phoenix terminals |
| 23. Emergency lighting | Eaton emergency lighting equipment, Socomec ATS |
| 24. Building automation | Siemens Desigo PXC, Belimo, Siemens field sensors |
| 25. Solar PV | SMA Sunny Tripower, Stäubli MC4, ABB OTDC, DEHN |
| 26. Battery storage | Tesla Megapack, Siemens monitoring equipment |
| 27. EV charging | ABB Terra, Phoenix Contact CHARX, PowerLogic |
| 28. Generator ATS | ComAp InteliLite, Socomec ATyS, SENTRON PAC |
| 29. UPS bypass | Schneider Galaxy, Socomec switching, PowerLogic |
| 30. Data-center alarms | Siemens PLC, Phoenix Contact relays, Rittal enclosures |
| 31. Robotic welding | ABB IRB 1200, OmniCore, Siemens safety PLC |
| 32. CNC auxiliary controls | Siemens S7-1500, SINAMICS, SICK sensors |
| 33. Assembly-line safety | Pilz PNOZmulti 2, SICK deTec4, Schmersal AZM |
| 34. Pneumatic pick-and-place | Festo DSBC, VUVG, SMT-8M, Siemens PLC |
| 35. Injection molding | Siemens PLC, Bosch Rexroth hydraulics, WIKA sensors |
| 36. Printing press | Siemens SINAMICS S210, S7-1500, SICK encoders |
| 37. Textile machine | ABB ACS580, Siemens PLC, SICK sensors |
| 38. Pharmaceutical filling | Siemens PLC, Festo pneumatics, Cognex vision |
| 39. Automated palletizer | ABB robot, Siemens PLC, SICK scanners |
| 40. Industrial test bench | Siemens PLC, HBM load cells, Janitza meters |
| 41. IEC machine panel | Siemens SIRIUS, SIMATIC, Phoenix Contact, Rittal |
| 42. NFPA 79 machine panel | Rockwell Automation, Allen-Bradley, Panduit |
| 43. UL 508A panel example | Rockwell Automation, Eaton, Panduit, Rittal |
| 44. Marshalling cabinet | Phoenix Contact terminals, Weidmüller markers, Harting |
| 45. Marine auxiliary panel | ABB switching, Siemens monitoring, approved marine equipment |
| 46. Irrigation automation | Siemens S7-1200, Festo valves, Endress+Hauser sensors |
| 47. Railway auxiliary controls | Siemens PLC, Phoenix Contact terminals, industrial relays |
| 48. Mining ventilation | ABB ACS580, Siemens PLC, industrial sensors |
| 49. Hospital auxiliary alarms | Siemens monitoring, Phoenix Contact relays, Rittal cabinets |
| 50. Training laboratory | Siemens S7-1200, SIRIUS contactors, Festo valves, SICK sensors |

---

# 13. COMPONENT DATA REQUIRED INSIDE THE ENGINEERING CANVAS

Every real component entered into the library should contain these **30 fields**:

1. Manufacturer
2. Manufacturer part number
3. Product family
4. Component category
5. Component description
6. Electrical symbol
7. IEC symbol representation
8. ANSI/NFPA symbol representation, where applicable
9. Rated operating voltage
10. Rated operating current
11. Rated power
12. Operating frequency
13. Terminal numbers
14. Terminal names
15. Pin definitions
16. Connection types
17. Electrical characteristics
18. Mechanical dimensions
19. Mounting method
20. Protection rating
21. Operating temperature
22. Manufacturer datasheet
23. Manufacturer installation manual
24. Wiring diagram
25. Connection diagram
26. Compatible accessories
27. Compatible components
28. Component reference designation
29. Component revision/version
30. Verified source and verification date

**Important:** Not every field applies to every component. A mechanical enclosure, for example, does not have an operating current or electrical pinout.

---

# 14. REAL ENGINEERING PROJECT DOCUMENTATION — 100+ SHEETS PER PROJECT

Each of the 50 projects should have its own independent documentation package.

| Sheet range | Documentation |
|---|---|
| 001–005 | Cover, project information, revision history |
| 006–010 | Drawing index and standards |
| 011–020 | Electrical power distribution |
| 021–030 | Motor and drive circuits |
| 031–040 | PLC and control circuits |
| 041–050 | Sensors and instrumentation |
| 051–060 | Safety and interlocking circuits |
| 061–070 | Terminal and wiring diagrams |
| 071–080 | Cable schedules and connections |
| 081–090 | Equipment layouts and panel drawings |
| 091–100 | Bills of materials, testing and commissioning |
| 101–110 | Installation and maintenance documentation |
| 111–120 | Calculations, verification and project-specific documentation |

**120 sheets per project × 50 projects = 6,000 sheets.**

These are proposed documentation structures, not completed drawings. Sheet allocation must be adapted to each project's actual topology, and every sheet must contain meaningful project-specific information.

---

---

## Appendix E — Deferred interface requirements and full component catalog

### Deferred header account/presence control

The user requested a later compact account icon immediately beside the Command Search control at the top right. Its status must reflect real application account/session state: red when offline and green when online, with an accessible name and hover/focus tooltip. This is deferred until the project has a real account/presence source. Fit it inside the existing header allocation; do not increase header height or shift the navigation, toolbar, panels, or canvas. Record before/after geometry and verify no layout movement when implemented.


### Component interaction catalog and presentation rule

The user supplied the 360-item engineering-canvas interaction catalog as the functional backlog for component, connection, wiring, rotation, editing, duplication, grouping, alignment, pins, layers, constraints, simulation, validation, organization, replacement, routing, placement, and professional canvas interactions. Treat these as progressive product requirements, not decorative menu labels.

**Presentation invariant:** expose applicable actions through floating context submenus, right-click menus, and direct mouse gestures in the existing CAD workspace. Do not add permanent toolbar rows, enlarge panels, shift the canvas, or alter approved header/tool geometry. Context menus must remain above content and scroll internally. Show an action only when it is valid for the selected object and implemented by the current model; never use a placeholder action. Continue implementing product-relevant items as real, testable milestones, with a capability/backlog audit to track what remains. Electrical wire routing, component pin connectivity, editable real symbols, connected movement, undo/redo, multi-selection/grouping, alignment/distribution, and validation remain core CAD priorities. Cross-domain features (for example hydraulic/optical ports or presentation animation) need an explicit model and should not be claimed as electrical CAD functionality without implementation.


### Full user-supplied component function catalog

**CAD | Electrical Design | Circuit Design | PCB | Mechanical Design | CorelDRAW | PowerPoint | Diagram Editors**

### 1. COMPONENT SELECTION
1. Select Component
2. Multi-Select Components
3. Select All Components
4. Deselect Components
5. Select Connected Components
6. Select Similar Components
7. Select Components by Type
8. Select Components by Layer
9. Select Components by Name
10. Invert Selection

### 2. COMPONENT MOVEMENT
11. Move Component
12. Drag Component
13. Reposition Component
14. Move Multiple Components
15. Move Connected Components
16. Move Component Horizontally
17. Move Component Vertically
18. Move Component Freely
19. Move Component by Coordinates
20. Move Component with Arrow Keys
21. Snap Component to Grid
22. Snap Component to Another Component
23. Align Component to Guide
24. Lock Component Position
25. Unlock Component Position

### 3. COMPONENT CONNECTION
26. Connect Two Components
27. Connect Multiple Components
28. Connect Component Pins
29. Connect Input to Output
30. Connect Output to Input
31. Connect Power Pins
32. Connect Ground Pins
33. Connect Signal Pins
34. Connect Data Ports
35. Connect Control Ports
36. Connect Mechanical Joints
37. Connect Hydraulic Ports
38. Connect Pneumatic Ports
39. Connect Optical Ports
40. Connect Network Ports
41. Auto-Connect Components
42. Disconnect Components
43. Reconnect Components
44. Replace Existing Connection
45. Validate Connection
46. Highlight Connected Components
47. Trace Component Connections
48. Show Connection Path
49. Hide Connection Path
50. Detect Unconnected Components

### 4. WIRING FUNCTIONS
51. Start Wire
52. Draw Wire
53. End Wire
54. Connect Wire to Pin
55. Connect Wire to Terminal
56. Connect Wire to Another Wire
57. Extend Wire
58. Shorten Wire
59. Move Wire
60. Drag Wire
61. Bend Wire
62. Split Wire
63. Join Wires
64. Merge Wires
65. Delete Wire
66. Duplicate Wire
67. Copy Wire
68. Paste Wire
69. Rotate Wire
70. Change Wire Direction
71. Change Wire Thickness
72. Change Wire Color
73. Change Wire Style
74. Change Wire Type
75. Change Wire Material
76. Change Wire Label
77. Add Wire Junction
78. Remove Wire Junction
79. Add Wire Node
80. Remove Wire Node
81. Auto-Route Wire
82. Manual-Route Wire
83. Orthogonal Wire Routing
84. Curved Wire Routing
85. Straight Wire Routing
86. Avoid Wire Crossing
87. Detect Wire Crossing
88. Detect Wire Short Circuit
89. Highlight Wire Path
90. Trace Wire Connection

### 5. COMPONENT ROTATION
91. Rotate Component
92. Rotate 90 Degrees
93. Rotate 180 Degrees
94. Rotate 270 Degrees
95. Rotate Clockwise
96. Rotate Counterclockwise
97. Free Rotation
98. Rotate Around Center
99. Rotate Around Custom Pivot
100. Reset Rotation

### 6. COMPONENT TRANSFORMATION
101. Resize Component
102. Scale Component
103. Stretch Component
104. Flip Horizontally
105. Flip Vertically
106. Mirror Component
107. Skew Component
108. Change Component Orientation
109. Change Component Dimensions
110. Reset Transformation

### 7. COMPONENT EDITING
111. Edit Component
112. Edit Component Properties
113. Edit Component Name
114. Edit Component Label
115. Edit Component Value
116. Edit Component Description
117. Edit Component Parameters
118. Edit Component Dimensions
119. Edit Component Material
120. Edit Component Color
121. Edit Component Shape
122. Edit Component Symbol
123. Edit Component Footprint
124. Edit Component Pins
125. Edit Component Terminals
126. Edit Component Ports
127. Edit Component Metadata
128. Edit Component Reference ID
129. Edit Component Orientation
130. Reset Component Properties

### 8. COMPONENT DUPLICATION
131. Copy Component
132. Cut Component
133. Paste Component
134. Duplicate Component
135. Clone Component
136. Duplicate Connected Components
137. Duplicate Component with Wiring
138. Duplicate Component without Wiring
139. Create Component Array
140. Create Repeated Component Pattern

### 9. COMPONENT GROUPING
141. Group Components
142. Ungroup Components
143. Create Component Assembly
144. Break Component Assembly
145. Add Component to Group
146. Remove Component from Group
147. Move Group
148. Rotate Group
149. Resize Group
150. Lock Group
151. Unlock Group
152. Duplicate Group
153. Connect Component Groups
154. Save Group as Module
155. Convert Group to Reusable Component

### 10. COMPONENT ALIGNMENT
156. Align Left
157. Align Right
158. Align Top
159. Align Bottom
160. Align Center
161. Align Horizontally
162. Align Vertically
163. Distribute Horizontally
164. Distribute Vertically
165. Equalize Spacing
166. Snap to Grid
167. Snap to Component
168. Snap to Connection Point
169. Auto-Align Components
170. Auto-Arrange Components

### 11. COMPONENT PIN AND TERMINAL FUNCTIONS
171. Select Pin
172. Move Pin
173. Add Pin
174. Delete Pin
175. Rename Pin
176. Change Pin Number
177. Change Pin Type
178. Change Pin Direction
179. Connect Pin
180. Disconnect Pin
181. Highlight Pin
182. Show Pin Name
183. Hide Pin Name
184. Show Pin Number
185. Hide Pin Number
186. Swap Pins
187. Lock Pin
188. Unlock Pin
189. Validate Pin Connection
190. Detect Floating Pins

### 12. COMPONENT LAYER FUNCTIONS
191. Move Component to Layer
192. Create Component Layer
193. Delete Component Layer
194. Hide Component Layer
195. Show Component Layer
196. Lock Component Layer
197. Unlock Component Layer
198. Change Component Layer
199. Bring Component Forward
200. Send Component Backward
201. Bring Component to Front
202. Send Component to Back
203. Merge Component Layers
204. Duplicate Component Layer
205. Isolate Component Layer

### 13. COMPONENT CONSTRAINTS
206. Lock Component
207. Unlock Component
208. Fix Component Position
209. Apply Distance Constraint
210. Apply Angle Constraint
211. Apply Alignment Constraint
212. Apply Parallel Constraint
213. Apply Perpendicular Constraint
214. Apply Coincident Constraint
215. Apply Tangent Constraint
216. Apply Symmetry Constraint
217. Apply Rotation Constraint
218. Apply Movement Constraint
219. Remove Constraint
220. Validate Constraints

### 14. COMPONENT SIMULATION
221. Simulate Component
222. Simulate Connected Components
223. Start Simulation
224. Stop Simulation
225. Pause Simulation
226. Resume Simulation
227. Reset Simulation
228. Monitor Component State
229. Monitor Component Voltage
230. Monitor Component Current
231. Monitor Component Power
232. Monitor Component Temperature
233. Monitor Component Frequency
234. Monitor Component Signal
235. Display Simulation Results
236. Highlight Active Connections
237. Detect Simulation Errors
238. Inspect Component Behavior
239. Animate Component Operation
240. Export Simulation Results

### 15. COMPONENT TESTING AND VALIDATION
241. Test Component
242. Test Connection
243. Test Wiring
244. Test Circuit
245. Check Connectivity
246. Check Pin Compatibility
247. Check Electrical Rules
248. Check Design Rules
249. Detect Short Circuits
250. Detect Open Circuits
251. Detect Overlapping Components
252. Detect Invalid Connections
253. Detect Missing Connections
254. Detect Duplicate Connections
255. Detect Component Conflicts
256. Highlight Errors
257. Show Error Details
258. Auto-Fix Supported Errors
259. Generate Validation Report
260. Clear Validation Results

### 16. COMPONENT ORGANIZATION
261. Rename Component
262. Number Component
263. Tag Component
264. Categorize Component
265. Search Component
266. Filter Components
267. Sort Components
268. Hide Component
269. Show Component
270. Isolate Component
271. Highlight Component
272. Add Component Notes
273. Add Component Comments
274. Add Component Documentation
275. Assign Component Identifier
276. Create Component Hierarchy
277. Add Component to Library
278. Remove Component from Library
279. Save Component Template
280. Load Component Template

### 17. COMPONENT REPLACEMENT
281. Replace Component
282. Swap Component
283. Change Component Type
284. Change Component Model
285. Change Component Symbol
286. Change Component Footprint
287. Replace Component While Preserving Connections
288. Replace Component While Preserving Position
289. Replace Component While Preserving Properties
290. Restore Previous Component

### 18. ADVANCED WIRING AND ROUTING
291. Create Wire Bus
292. Connect Component to Bus
293. Add Bus Entry
294. Remove Bus Entry
295. Split Bus
296. Merge Buses
297. Rename Net
298. Assign Net Label
299. Assign Net Class
300. Assign Wire Gauge
301. Assign Wire Length
302. Calculate Wire Length
303. Calculate Wire Resistance
304. Calculate Voltage Drop
305. Auto-Optimize Wiring
306. Route Around Obstacles
307. Route Through Waypoints
308. Add Wire Waypoint
309. Remove Wire Waypoint
310. Move Wire Waypoint
311. Create Differential Pair
312. Route Differential Pair
313. Create Wire Harness
314. Bundle Wires
315. Unbundle Wires
316. Create Terminal Block
317. Connect to Terminal Block
318. Generate Wiring Diagram
319. Generate Netlist
320. Export Wiring Data

### 19. COMPONENT INTERACTION WITH THE CANVAS
321. Drag Component from Sidebar to Canvas
322. Drop Component onto Canvas
323. Preview Component Before Placement
324. Place Component at Cursor
325. Place Multiple Components
326. Cancel Component Placement
327. Undo Component Placement
328. Redo Component Placement
329. Show Component Bounding Box
330. Show Component Selection Handles
331. Show Component Connection Points
332. Show Component Alignment Guides
333. Show Component Dimensions
334. Show Component Coordinates
335. Show Component Tooltip
336. Open Component Context Menu
337. Open Component Properties Panel
338. Open Component Quick Actions
339. Zoom to Component
340. Center Component in View

### 20. PROFESSIONAL CANVAS INTERACTION FUNCTIONS
341. Drag Component Without Disconnecting Wires
342. Drag Component and Automatically Reroute Wires
343. Move Connected Components Together
344. Move Component While Preserving Connection Geometry
345. Rotate Component While Maintaining Connections
346. Duplicate Component with Existing Connections
347. Auto-Snap Wire to Nearest Valid Pin
348. Preview Connection Before Completion
349. Highlight Valid Connection Targets
350. Highlight Invalid Connection Targets
351. Prevent Invalid Pin Connections
352. Automatically Create Wire Junctions
353. Automatically Remove Redundant Junctions
354. Automatically Update Connections After Movement
355. Automatically Recalculate Wire Paths
356. Automatically Update Component Coordinates
357. Automatically Update Component Dimensions
358. Automatically Update Component Labels
359. Automatically Update Netlist
360. Automatically Save Canvas Changes


## 2026-11-12 incremental execution record

- Preserved the approved workstation interface and added A1/007 as a separate, source-backed IFM IFS204 / Siemens S7-1200 sensor input example.
- A1/007 contains editable Siemens 6ES7212-1AE40-0XB0, IFM IFB3004BBPKG/US-104 and Phoenix Contact 3212144 instances with named, connectable terminals and the original example's ten wire segments. Terminal references continue as X7/X8 because X1–X6 are used on A1/006.
- Verified the seven-sheet project model: 19 component instances, 252 wire segments, 31 sheet-local nets and 0 open endpoints. Existing A1/006 remains at 15 components, 242 wires and 26 nets; A1/007 has 4 components, 10 wires and 5 nets.
- Kept A1/006 and A1/007 electrically separate. The candidate tie points on A1/006 resolve to unlabeled control nets, so no 24 V / 0 V connection is asserted without source evidence. Cross-sheet electrical links remain a future milestone after the interface is verified.
- Supply adequacy, protection coordination, PLC/sensor behavior, motor behavior and construction readiness are not established. A1/008–A1/100 remain unauthored.
- Next: source and document an interface definition, then continue with A1/008 in small verified PRs, merging and deploying after each accepted milestone.


## 2026-11-12 incremental execution record — A1/008

- Added the source-backed Siemens SITOP PSU100C 6EP1332-5BA00 component, terminal-aware schematic glyph and inspector fields within the existing workstation layout. The two physical output-minus screws are documented as one shared return endpoint; power conversion and isolation behavior are not simulated.
- Added Phoenix Contact PT 16 N-PE 3212147 as a source-backed protective-conductor terminal. Its two connection points use explicit model-local indexes because the manufacturer does not number them; the rail bonding foot is documented but not a separate modeled endpoint.
- Added A1/008 with five source-backed external terminal boundaries for L, N, PE, +24 V DC and 0 V DC. The page has six component instances, five routed wires and five local nets. It remains electrically separate from A1/006 and A1/007; no upstream supply, input protective device, output load or cross-sheet connection is asserted.
- Verified the eight-sheet project model: 25 components, 257 wire segments, 36 sheet-local nets, zero open wire endpoints and five nets on A1/008. The component register and project README now reflect the modeled devices and boundaries; A1/009–A1/100 remain unauthored.
- Supply capacity, protection coordination, conductor sizing, installation suitability and construction readiness are not established. Continue only from official source-backed device and terminal data.



## 2026-11-12 incremental execution record — A1/009

- Added reciprocal, visibly rendered off-page connector references within the existing drawing canvas. The engine validates each link against an exact open wire endpoint and a real target-sheet component; project JSON preserves the links when saved and reopened.
- Connected the Siemens SITOP PSU100C +24 V and 0 V outputs at A1/008 X12/X13 to the Siemens CPU 1212C L+ and M supply terminals on A1/007 through X7/X8. A1/006 remains electrically separate.
- Added four orthogonal endpoint wires and two cross-sheet links. The project now contains 8 sheets, 25 components, 261 wires, 36 sheet-local nets, 34 global nets, 4 local link endpoints and 0 unlinked endpoints.
- Verified save/reopen, reciprocal targets and exact global pin groups. Focused local suite: 52 tests passed. The approved workstation geometry was not changed; connector graphics render inside the existing sheet canvas.
- No downstream load, total current, protection coordination, supply adequacy, behavior simulation or construction approval is established.
- Next: continue the 100-sheet reference project in similarly small, source-backed increments.


## 2026-11-12 incremental execution record — off-page navigation

- Extended the A1/009 cross-sheet connectors to work as keyboard-accessible links. Mouse click, Enter, and Space open the referenced sheet and select the named terminal in the existing Properties panel.
- Connector targets remain checked against the project model; deleting a linked sheet removes its stale links, and renaming a referenced component updates the connector label.
- Preserved the workstation shell geometry. Focused suite now includes a navigation regression alongside project link, pin-group and save/reopen checks.
- Next: continue with the next small, source-backed project milestone after this interaction increment is merged and deployed.


## 2026-11-12 incremental execution record — A1/009 distribution page

- Added A1/009 with source-backed Phoenix Contact PT 16 N OG 3212144 terminals X14/X15 and four orthogonal wires. The reciprocal +24 V and 0 V links now route through A1/008, A1/009, and A1/007, preserving the existing workstation interface.
- Updated the opening-set drawing index, component register, assumptions, README, and project roadmap to reflect the authored page and its limits.
- Project analysis reports 9 sheets, 27 components, 265 wire segments, 38 sheet-local nets, 34 project-wide nets, eight linked open endpoints, and zero unlinked endpoints. The supply has no modeled total-current or protection-coordination result.
- Focused local suite: 54 tests passed; save/reopen and exact global pin groups are covered. Push, merge, and deployment are pending this increment's PR and CI.
- Next: push this focused increment, merge after green checks, and verify the deployed project before starting another page.


## 2026-11-12 incremental execution record — A1/010

- Added A1/010 with Phoenix Contact PLC-RSC-24DC/21 relay K2 driven from Siemens CPU 1212C DQ a.0. Connected the PLC 1L output group to the existing source-backed +24 V rail and returned coil A2 to 0 V through A1/009. The sourced coil draws 9 mA typically; the polarity-sensitive input and the relay contacts remain unsimulated. No contact-side load is specified.
- Preserved the existing workstation interface. Expanded only the electrical project, drawing index, component register, assumptions, README, roadmap, and regression coverage. Updated project description and revision records; A1/011–A1/100 remain unauthored.
- Expected project analysis after validation: 10 sheets, 28 components, 275 wire segments, 42 local nets, 35 global nets, 14 linked endpoints, and zero unlinked endpoints. No total load-current or protection-coordination result is claimed.
- Next: run focused checks, then push a dedicated PR and wait for green CI before merging and verifying Pages production.


## 2026-11-12 incremental execution record — A1/011

- Added A1/011 with the source-backed Schneider Electric LC1D09BD contactor KM4. Routed the Phoenix Contact K2 relay common from +24 V, K2:14 to KM4:A1, and KM4:A2 to 0 V through A1/009. KM4 main and auxiliary contacts remain open; no downstream power load is specified.
- Recorded manufacturer-supported coil and relay data: Schneider FAQ FA33405 lists 2.4 W average at 20 °C and nominal Uc (100 mA at 24 V DC); Phoenix Contact specifies K2 at 2 A DC13, 24 V DC. These ratings are a reference only and do not establish total supply adequacy or protection coordination.
- Preserved the workstation interface. Updated the opening-set description, index, register, revision/assumptions, README, roadmap, source record and regressions. A1/012–A1/100 remain unauthored.
- Expected analysis after verification: 11 sheets, 29 components, 287 wire segments, 46 local nets, 36 global nets, 20 linked endpoints and zero unlinked endpoints.
- Next: verify the project and focused tests, then ship this increment in a dedicated PR and verify the deployment.


## 2026-11-12 incremental execution record — A1/012

- Added A1/012 with source-backed Schneider Electric XB5AA31 S2 (NO 13–14) and XB5AA42 S3 (NC 21–22). Their contact outputs route to Siemens CPU 1212C X10:8 / DI a.1 and X10:9 / DI a.2. +24 V is branched from the existing X14 net; the CPU's existing 0 V common remains the input reference. No PLC program, command behavior, or safety function is represented.
- Added exact open-end cross-sheet links, reciprocal connector references, editable drawing content, BOM entries, index/register/revision/assumption updates, and route/connectivity regressions. Preserved the workstation interface.
- Current model analysis: 12 sheets, 31 components, 299 wire segments, 51 sheet-local nets, 38 project-wide nets, 11 cross-sheet connections pairing 26 endpoints, and zero unlinked endpoints. A1/013–A1/100 remain unauthored.
- Next: run the focused CAD regression suite, then push a dedicated PR, merge only after green CI, deploy, verify production, and continue at A1/013.


## 2026-11-12 incremental execution record — A1/013

- Added the editable PLC I/O assignment schedule. Wired Schneider LC1D09BD KM4 built-in NO auxiliary 13–14 from +24 V at Phoenix Contact X14 to Siemens CPU 1212C X10:10 / DI a.3 using explicit reciprocal cross-sheet links. The schedule maps this feedback as I0.3 and preserves Q0.0/DQ a.0 → K2 coil A1.
- The official Schneider LC1D09BD data sheet identifies auxiliary NO terminals 13–14 and NC 21–22; the existing Siemens CPU terminal map supplies X10:10 identity. No PLC program, feedback interpretation, contactor actuation, or safety behavior is modeled. Preserved the workstation interface.
- Analysis: 13 sheets, 31 components, 307 wire segments, 54 sheet-local nets, 39 global nets, thirteen cross-sheet links pairing 30 endpoints, and zero unlinked endpoints. Regression covers the exact X14/KM4:13 net, KM4:14/CPU X10:10 connection, assignment schedule and save/reopen.
- Next: finish verification, publish this focused change, merge after green CI, deploy, verify production, and continue with A1/014.


## 2026-11-12 incremental execution record — A1/014

- Added a source-backed PLC input point: wired Schneider LC1D09BD KM4 built-in NC auxiliary contact 21–22 to Siemens CPU 1212C X10:11 / DI a.4. The NC contact is supplied from the existing X14 +24 V net through KM4:13–21; 22 routes across the explicit A1/011↔A1/007 link to the CPU input. A1/014 documents assignment I0.4.
- Siemens S7-1200 System Manual V4.5 Table A-46 identifies X10:11 as DI a.4 for CPU 1212C DC/DC/DC 6ES7212-1AE40-0XB0. Schneider LC1D09BD manufacturer data identifies 21–22 as NC. PLC logic, diagnostics, contactor actuation and safety behavior remain unsimulated. Interface geometry unchanged.
- Analysis: 14 sheets, 31 component instances, 311 wire segments, 56 sheet-local nets, 40 global nets, fourteen cross-sheet links pairing 32 endpoints and zero unlinked endpoints. Tests cover the X14/KM4:21 supply net, KM4:22/X10:11 connection, route orthogonality and save/reopen.
- Next: verify tests, publish this focused increment, merge after green CI, confirm production, then continue at A1/015.


## 2026-11-12 incremental execution record — A1/015

- Wired the source-backed Phoenix Contact PLC-RSC-24DC/21 K2 normally closed contact 11–12 to Siemens CPU 1212C X10:12 / DI a.5. A1/015 documents the point as I0.5. Manufacturer sourcing already records terminal 12 as NC and contact operation as unsimulated.
- Updated the drawing index, cover, component register, assumptions, project status, revision and source-backed example documentation. Preserved the workstation interface; no PLC logic, relay state, or diagnostic meaning is modeled.
- Analysis: 15 sheets, 31 component instances, 314 wire segments, 58 sheet-local nets, 41 global nets, fifteen cross-sheet links pairing 34 endpoints, and zero unlinked endpoints. Regression verifies K2:12↔CPU X10:12, source terminal identities, orthogonal routing and save/reopen.
- Next: run verification, publish this focused increment, merge after green CI, confirm production, and continue at A1/016.


## 2026-11-12 incremental execution record — A1/016

- Branched the source-backed Phoenix Contact K2 normally open output terminal 14 to Siemens CPU 1212C X10:13 / DI a.6. The branch remains on the existing K2:14 net that feeds KM4 coil A1; A1/016 records assignment I0.6. Split the existing wire at an explicit junction before routing the branch to preserve net topology.
- Updated the drawing index, cover, component register, assumptions, project status and source-backed example documentation. Preserved the workstation interface; relay switching, PLC logic and diagnostics remain unsimulated.
- Analysis: 16 sheets, 31 component instances, 318 wire segments, 59 sheet-local nets, 41 global nets, sixteen cross-sheet links pairing 36 endpoints and zero unlinked endpoints. Regression checks exact K2:14/CPU X10:13/KM4:A1 membership, orthogonal routes and save/reopen.
- Next: run tests, publish this focused increment, merge after CI passes, verify production, and continue at A1/017.


## 2026-11-12 incremental execution record — A1/017

- Added A1/017 as a native PLC I/O allocation summary for modeled I0.0–I0.6 and Q0.0, while explicitly recording I0.7 / CPU X10:14 as unassigned within the modeled scope. No components or topology were invented; PLC logic, address configuration and signal interpretation remain outside this static model.
- Updated the drawing index, project status, README, roadmap, revision and this progress record. Preserved the workstation interface and `index.html`.
- Model validation passed: 17 sheets, 31 component instances, 318 wire segments, 59 sheet-local nets, 41 project-wide nets, 16 cross-sheet links pairing 36 endpoints, and zero unlinked endpoints. Regression asserts all nine allocation entries and save/reopen.
- Next: finish full regressions, publish a dedicated PR, merge only after green CI, deploy and verify production, then continue at A1/018.


## 2026-11-12 incremental execution record — A1/018

- Routed the existing Siemens SIRIUS 3RU2126-4AB0 overload relay F1 NO trip contact 97–98 into Siemens CPU 1212C DI a.7 / I0.7. X14 supplies +24 V DC to terminal 97; terminal 98 returns to X10:14. The existing F1 NC 95–96 contactor-control path remains unchanged. No new component was added.
- Siemens Equipment Manual identifies 97–98 as an NO trip signal and says the overload relay auxiliary contacts are suitable for PLCs. Added a source record and explicit limits: no overload trip/reset simulation, PLC logic/alarm interpretation, protection validation, or safety behavior.
- Updated I0.7 allocation on A1/017, the index, cover, assumptions, revision, README and roadmap. Preserved the approved interface.
- Model validation: 18 sheets, 31 components, 324 wire segments, 62 sheet-local nets, 42 project-wide nets, eighteen cross-sheet connections pairing 40 endpoints, and zero unlinked endpoints.
- Next: run regressions, publish a dedicated A1/018 PR, merge after green CI, deploy, verify production, then continue at A1/019.


## 2026-11-12 incremental execution record — A1/019

- Added A1/019 as a native CPU 1212C digital-output allocation schedule. Q0.0 / X12:2 / DQ a.0 remains assigned to Phoenix Contact K2 coil A1; Q0.1–Q0.5 are explicitly unassigned within the modeled project scope. X12:6 / 2L is recorded as a group common, not an output. No devices or wires were added.
- Updated the current Siemens S7-1200 System Manual source record (V4.7, Tables A-49/A-50), drawing index, cover, revision record, component register, assumptions, README and roadmap. Preserved the approved workstation interface and `index.html`.
- Next: run model regressions, publish a focused A1/019 PR, merge only after green CI, deploy and verify production, then continue at A1/020.


- A1/019 follow-up: corrected the A1/009 supply note wording and added a regression assertion for the exact text; no model or topology changed.


## 2026-11-12 incremental execution record — A1/020

- Added A1/020 as a native Siemens CPU 1212C analog-input allocation schedule. X11:1 / 2M is the analog common; AI0 / X11:2 and AI1 / X11:3 are the source-backed 0–10 V DC channels and remain unassigned within the modeled scope. No signal sources, devices or wires were added.
- Updated the current Siemens System Manual V4.7 CPU source record, drawing index, cover, revision, component register, assumptions, README and roadmap. No interface changes.
- Next: run model regressions, publish a focused A1/020 PR, merge only after green CI, deploy and verify production, then continue at A1/021.


## 2026-11-12 incremental execution record — A1/021 and A1/022 catalog tranche

- A1/021 added a source-backed ifm PN2070 interface proposal; the candidate OUT2-to-AI0 route remains unwired and AI0 remains unassigned.
- A1/022 catalog tranche adds the PN2070 definition with four manufacturer pins, sourced output defaults, editable process/signal notes, and a dedicated symbol in the existing workstation shell. No project instance, circuit, or interface-layout change is included.
- Verification before PR: 68 local regression tests and whitespace checks pass. Next: publish/merge/deploy after green CI; then author the physical A1/022 circuit only after the 2M and 0 V references are confirmed.


## 2026-11-13 incremental execution record — A1/023–A1/026

- A1/023 recorded the Siemens CPU 1212C AI0 raw range and conditional scaling relation; PR #89 merged to main. A1/024 compared the PN2070 branch load with the exact SITOP ratings without claiming supply adequacy; PR #90 merged. A1/025 recorded a conditional partial PN2070 / CPU accuracy stack; PR #91 merged and the 25-sheet deployed project was verified.
- Added A1/026 as a text-only CPU 1212C AI0 resolution reference. It derives 9.765625 mV and 0.390625 bar ideal code intervals, and a ±0.1953125 bar ideal rounding contribution for a conditional linear 0–400 bar / 0–10 V span. These are mathematical idealizations, not guaranteed effective resolution or measured performance. No component, wire or workstation interface change.
- Updated the project cover/status, drawing index, revision record, component reference, README, roadmap and this execution log. The project now has 26 sheets, 32 component instances, 335 wire segments, 67 sheet-local nets, 43 project-wide nets, 21 explicit cross-sheet connections, and zero unlinked endpoints.
- PR #92 passed GitHub Actions run #179 and merged as `a693b438f758a724ab0fbea5f1cb55a317595983`. The live Pages project JSON confirmed 26 sheets. Next: continue at A1/027.


## 2026-11-13 incremental execution record — A1/027

- Added a text-only CPU 1212C input response reference from Siemens System Manual V4.7 Tables A-42/A-43: sample time and 95% step response by rejection frequency and smoothing selection. The drawing does not select a PLC setting or claim sensor-to-PLC response.
- No component, wire or workstation interface change. Updated the project cover/status, drawing index, revision record, CPU source record, README, roadmap and this execution log.
- PR #93 passed GitHub Actions run #182 (`cad-engine`) and merged as `0b6e59af5205596b1d07c1565ecdecea444498a3`. The live Pages project JSON confirmed Opening set 2.4 and A1/001–A1/027, including the A1/027 response reference. Next: continue at A1/028.


## 2026-11-13 incremental execution record — A1/028

- Added a text-only CPU 1212C AI0 range reference from Siemens System Manual V4.7 Tables A-41/A-44: rated, overshoot and overflow voltage/data-word bands, with the separate 35 V DC withstand rating called out. It assigns no sensor fault, channel diagnostic, alarm or pressure-conversion behavior.
- Updated the project opening set, index, revision, CPU record, README, roadmap and regression coverage. No component, wire or workstation interface change.
- Local verification: 75/75 CAD tests pass; project analysis reports 28 sheets, 32 components, 335 wire segments, 67 local nets, 43 project-wide nets, 21 cross-sheet connections and zero unlinked endpoints.
- PR #95 passed GitHub Actions run #184 (`cad-engine`); the Pages workflow run #93 deployed merge `00140e78326d596b0a2a4fbaae6a049dae8e7e2f`. A fresh custom-domain JSON fetch confirmed Opening set 2.5, A1/001–A1/028, and the A1/028 CPU range sheet. Next: continue at A1/029.


## 2026-11-13 incremental execution record — A1/029

- Added a text-only Siemens CPU 1212C AI0 cable-limit reference: System Manual V4.7 Table A-41 specifies up to 100 m using shielded twisted pair. The project does not assign installed cable length, construction, route, grounding, electromagnetic environment or measured signal quality.
- Updated the drawing opening set, index, revision record, CPU source record, README, roadmap and regression coverage. No component, wire or workstation interface change.
- Local verification: `node --test cad-engine.test.js` passed 76/76; `git diff --check` passed. PR #97 passed GitHub Actions run #186 and merged as `421fd94a687b8ad8423f270d96626d43e1ff0a4c`. Pages deployment run #95 succeeded; a cache-busted production JSON fetch confirmed Opening set 2.6, A1/001–A1/029 and the A1/029 cable reference.


## 2026-11-13 incremental execution record — A1/030

- Added a text-only ifm PN2070 analog output parameter reference from data sheet PN2070-02: 0–10 V output scalable 1:5, 2,000 Ω minimum load resistance, analog start point parameter range 0–320 bar and analog end point parameter range 80–400 bar. No configured endpoints or output span are assigned.
- Updated the drawing opening set, index, revision record, PN2070 source record, README, roadmap and regression coverage. No component, wire or workstation interface change.
- Local verification: `node --test cad-engine.test.js` passed 77/77; `git diff --check` passed. PR #99 passed GitHub Actions run #188 and merged as `c284242e7d0acf3d153100aa77a09ab9cdf238ce`; Pages run #97 succeeded. A cache-busted production JSON fetch confirmed Opening set 2.7, A1/001–A1/030 and the A1/030 sheet.
- Live review found the A1/030 authoring had overwritten A1/028–A1/029 index/revision entries. PR #100 restored A1/029’s index row and A1/028’s revision record; Actions run #190 passed, merge `3557ab9fbb4dabf10d5f7ead6ac7afd973681c16`, and Pages workflow run `43349737019` completed successfully. Production review then caught A1/028 still missing from the drawing index. PR #101 restored the A1/028 row and added regression coverage for all three index rows; local tests passed 77/77, Actions run #192 passed, and merge `e7983e807ae4a11a2812d765e10f939d9e6503c3` deployed successfully through Pages workflow run `43350339634`. A cache-busted production JSON check confirmed 30 sheets and index rows A1/028, A1/029 and A1/030.
