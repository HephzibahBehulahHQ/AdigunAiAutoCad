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
