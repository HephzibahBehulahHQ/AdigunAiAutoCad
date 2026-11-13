# Editor interaction backlog and milestone order

Updated 2026-11-13. This records the remaining interaction work from the user's two pasted function catalogs while the product advances to real engineering components and example projects. The long generic lists are acceptance input, not proof that every item is applicable or implemented.

## Already shipped interaction foundations

Recent merged changes cover drawing-object properties on double-click, multi-selection delete/backspace, one-step z-order, drawing-layer visibility and same-layer selection, select-all components, direct shape resize handles, and pointer-centered wheel zoom. Existing source also contains component placement/move/rotate, sheet navigation/reorder, context actions, project JSON open/save and verified component editing. Each command still requires behavior-level verification; its presence or a screenshot is not proof it works.

## Remaining small-function audit

- **Pointer and selection:** verify single, additive, toggle, box and type-based selection; text/shape/component selection; cursor and field activation; drawing start/confirm/cancel; menu/icon open-close; keyboard focus and touch equivalents.
- **Context actions:** audit copy/cut/paste/duplicate/delete, lock/hide, group/ungroup, alignment/distribution, transform, ordering and property editing for objects, components and sheets. Keep destructive actions undoable.
- **Electrical component actions:** verify real component insertion, movement/rotation, pin hit testing, pin/net connection, wire endpoint preservation, terminal numbering, editable properties, layer behavior and selection from the same electrical net. No generic shape may substitute for a component with real pin metadata.
- **Sheets and views:** verify sheet create/open/close/delete/rename/reorder/duplicate, per-sheet view and object persistence, blank-start behavior, zoom presets/fit, pan, snap, grid and project save/reopen.
- **Palette and drawing:** audit color selection, fill/outline, freehand/line/curve/shape tools, text, image import where supported, export and printing. Unsupported or inapplicable commands stay disabled with a reason.
- **Acceptance for every command:** test the actual click/keyboard/touch action, resulting model change, undo/redo, save/reopen and report impact where relevant. Confirm the approved toolbar, rails, side panels and canvas bounds do not shift, overlap or overflow.

## Current priority

Build source-backed electrical components and meaningful native example projects. The 24 V DC relay/contactor example and the Siemens 3RM12 reversing-starter example remain separate and preserve real terminal identities, derived connectivity/BOMs, and documented limitations. The catalog includes two Siemens SIRIUS 3RV2 motor-protection breakers: 3RV2011-1JA10 (7–10 A) and 3RV2011-0FA10 (0.35–0.5 A). The 0FA10 rating range overlaps the SEW DRN63MS4 nameplate current of 0.405 A and its 400 V motor rating of 0.12 kW matches the motor's 0.12 kW; this does not select a breaker setting or establish application suitability, coordination or construction approval.

The one-sheet DOL motor-feeder example `examples/real-projects/siemens-schneider-sew-dol-starter.adigun.json` is now modeled with the Siemens breaker, Schneider LC1D09BD contactor, source-backed XB5AA42 stop and XB5AA31 start push-buttons, SEW motor, and Phoenix terminal boundaries. Its full pin topology, wire list and BOM have regression coverage. The breaker setting remains unset; the static model does not simulate actuation or protective behavior.
The next verified component milestone adds the IFM IFS204 PNP normally-open inductive sensor and Siemens S7-1200 CPU 1212C DC/DC/DC with all 25 published X10/X11/X12 connector terminals, plus a one-sheet sensor-to-DI a.0 wiring project. The project preserves the sensor L+, L− and output pin mapping, PLC sensor supply/return and 1M common, derives the wire list/BOM/nets, and explicitly leaves unused CPU points open. It is wiring-only: target detection and PLC program execution are not simulated. Focused regression coverage verifies exact pin/net groups, 10 wire segments, five nets, zero open wire endpoints and project round-trip. No workstation layout changes are part of this milestone.


Apply this concurrent discovery rule to every example milestone: when official-source research establishes a required component missing from the catalog, add its verified definition, real terminal/pin geometry, supported specifications, editable properties, source record and focused tests in the same milestone. When completing the example exposes a missing CAD function, implement and regression-test that function with the example. Do not substitute generic glyphs or unconnected visual stand-ins for a modeled engineering component. Preserve the approved workstation geometry and verify that any required UI rendering fits the existing layout.

## 100-sheet reference project — topology foundation

The first data-engine milestone adds project-level sheet validation and independent electrical analysis per sheet. Multi-sheet projects now require each drawing object to identify a known sheet; duplicate and unknown sheet IDs are rejected. Coincident coordinates on separate pages produce separate sheet-qualified nets. Single-sheet files retain the existing unscoped-object compatibility path. Focused regression coverage uses the source-backed Phoenix Contact terminal and proves save/reopen plus page isolation.

This is a foundation milestone only. It does not add the 100 pages, cross-sheet references, report pages, or multi-page navigation behavior. Do not count a declared sheet as complete unless it contains real editable project content and passes project-wide validation.

## Cross-sheet connectivity model

The CAD engine validates visible off-page connector references against real target-sheet components and exact open wire endpoints. The existing workspace renderer draws reciprocal references from the same project model, and project JSON keeps links on save and reopen. A1/009 distributes source-backed 24 V DC from X14/X15. A1/010–A1/016 connect the Siemens PLC, Phoenix Contact relay K2 and Schneider contactor KM4 with explicitly linked cross-sheet routes. A1/017 summarizes modeled I/O. A1/018 uses the existing Siemens SIRIUS F1 thermal overload relay’s source-backed NO contact 97–98 for its “tripped” signal and routes X14 +24 V DC through the contact to CPU 1212C X10:14 / DI a.7 / I0.7. The F1 NC 95–96 contactor-control path is unchanged; Siemens describes 97–98 as a signal for a control system and states the auxiliary contacts are suitable for PLCs. A1/019 documents the Siemens CPU 1212C X12 output group: Q0.0 / DQ a.0 is assigned to K2 coil A1; Q0.1–Q0.5 are unassigned in modeled scope, and 2L at X12:6 is an output-group common. This schedule adds no devices or wiring. A1/020 documents the CPU 1212C analog group: X11:1 / 2M is the common; AI0 / X11:2 and AI1 / X11:3 are 0–10 V DC inputs. A1/021 documents a source-backed ifm PN2070 interface proposal. A1/022 connects B2 OUT2 to AI0 and B2 L− to CPU 2M / X15 0 V DC; configure and verify the sensor's voltage mode and ASP2/AEP2 before use. A1/023 records Siemens' 0–10 V / 0–27648 CPU AI0 representation and a conditional scaling relation; no actual endpoints or PLC block are assigned. The twenty-three-sheet project has 32 component instances, 335 wire segments, 67 sheet-local nets, 43 project-wide nets, 47 local endpoints paired by 21 explicit cross-sheet links, and zero unlinked endpoints. The overload setting remains unset. PLC logic, output switching, trip/reset behavior, alarm interpretation, contactor actuation and safety behavior are not simulated. Protection, total load current and application suitability remain unassessed.

Next: continue the 100-sheet project at A1/024 in small, source-backed increments. Preserve approved workstation geometry and verify each authored page with its applicable pin, net, save/reopen, formula, and route checks.


## Component and project source-data guidance

Continue with manufacturer-specific parts and small, internally consistent examples. Record manufacturer and exact part number, applicable ratings, real terminal IDs and positions, symbol representation, editable instance properties, source documents and retrieval dates. Include dimensions, accessories, compatibility and other fields only when the selected manufacturer's source documents support them; applicability varies by component family. Keep component behavior outside the model explicit when it is not implemented.

The user's separate 50-project list is a candidate backlog and starting BOM idea, not a set of verified designs. The proposed 120 sheets per project / 6,000-sheet target is an aspiration, not completed documentation or a release criterion. Select and validate each example against official sources before adding it.

Future account indicator: add a compact user icon beside Command Search only when that milestone is reached; show offline red and online green states while preserving current header geometry and preventing layout shift. Treat it as a later isolated UI milestone; do not make room by moving or resizing existing header controls.


## Completed library increment — star-delta component records

Added source-backed Siemens 3RT2026-2KB40 contactor, 3RU2126-4AB0 overload relay, 3RV2021-4AA10 motor-protection breaker, 3RP2576-2NW30 timer, and SEW DRN132M4 motor definitions, including manufacturer terminal identities, editable overload/delay settings and dedicated timer/overload rendering in the existing shell. The timer and protection behaviors remain unsimulated. A draft full schematic was rejected after connectivity analysis revealed unintended wire joins; publish an example only after route/topology regression tests prove the intended independent nets.


## Completed project increment — star-delta starter

Added an editable source-backed Siemens/SEW star-delta starter project with a dedicated regression asserting all 26 exact pin nets, all 242 orthogonal wire segments, BOM quantities, save/reopen stability, and the eight intentionally unwired auxiliary terminals. Q1/F1 current settings and timer delay remain unselected. The static net model does not simulate contactor, overload, timer, or motor states. The project view includes the full drawing extents; workstation geometry and panels were not changed.

A1/022 connects the verified ifm PN2070 B2 instance to CPU AI0, X14 +24 V DC and X15 / CPU 2M common. A1/023 documents the conditional raw-value-to-pressure relation from Siemens' CPU 1212C AI0 range and ifm's configurable output endpoints. The existing workspace shell is unchanged; endpoints, process point, calibration and executable PLC scaling remain unassigned.


## Completed project increment — PN2070 branch load reference

A1/024 compares the ifm PN2070-02 B2 maximum listed current with Siemens SITOP PSU100C 6EP1332-5BA00 output ratings. The drawing records the 24 V ±3% output range and PN2070 input range, and labels the 2.5 A (+50 °C) and 0.75 A (+70 °C) comparison. Regression coverage preserves the 24-sheet project metrics, verifies save/reopen, source records and the stated limits. This is a B2-only allocation reference; total cabinet loading, voltage drop, protection, conductor sizing and supply adequacy remain unassessed. The workspace interface and electrical topology are unchanged.

Next project increment: A1/025, selected from verified project evidence after this milestone.


## Completed project increment — conditional PN2070 / CPU accuracy reference

A1/025 records a limited arithmetic sum of the ifm PN2070-02 limit-setting characteristic deviation and the Siemens CPU 1212C analog-input accuracy. The calculation is conditional on a verified 0–400 bar / 0–10 V mapping: less than ±14 bar at 25 °C and less than ±16 bar across the CPU's rated temperature range. It is not a complete uncertainty budget, measured accuracy, active device configuration or calibration. The page adds no component or wire and the workstation interface is unchanged.

Next project increment: A1/026, selected from verified project evidence after this milestone.


## Completed project increment — CPU 1212C analog resolution reference

A1/026 records the Siemens CPU 1212C built-in analog input's published 10-bit resolution and derives an idealized code interval for a conditional 0–400 bar / 0–10 V sensor mapping. The page states the resulting 0.390625 bar ideal interval and ±0.1953125 bar rounding contribution as mathematical derivations, not guaranteed measurement performance. It distinguishes the 0–27648 PLC data-word representation from analog converter resolution and excludes noise, effective bits, smoothing configuration, sensor error and field measurements. No component, wire or interface change is made.

Next project increment: A1/027, selected from verified project evidence after this milestone.


## Completed project increment — CPU 1212C analog input response reference

A1/027 records Siemens CPU 1212C built-in analog-input sample times and 0–10 V step responses at 95% for each published rejection-frequency and smoothing choice. It states the CPU input values without assigning a PLC configuration or claiming sensor-to-PLC response. Sensor dynamics, PLC scan and end-to-end behavior remain outside the model. No component, wire or interface change is made.

Next project increment: A1/028, selected from verified project evidence after this milestone.


## Completed project increment — CPU 1212C analog input range representation

A1/028 records Siemens CPU 1212C built-in AI rated, overshoot and overflow voltage/data-word bands from System Manual V4.7 Tables A-41/A-44. It distinguishes the separate 35 V DC maximum withstand specification from the 0–10 V rated measuring range and does not assign sensor-fault, channel diagnostic, alarm or pressure conversion behavior. The increment adds no components, wires or workstation interface changes.

Next project increment: A1/029, Siemens Table A-41 analog cable length and shielding reference.


## Completed project increment — CPU 1212C analog input cable limit

A1/029 records Siemens System Manual V4.7 Table A-41 maximum analog input cable length of 100 m using shielded twisted pair. It does not claim this project has such a cable or that installation, routing, grounding or noise performance is validated. No component, wire or interface change.

Next project increment: A1/030, ifm PN2070 analog output parameter ranges.


## Completed project increment — PN2070 analog output parameter ranges

A1/030 records ifm PN2070-02 output voltage, scale capability, minimum load resistance and the manufacturer-listed analog start/end parameter ranges. It does not assign configured endpoint pairs or a selected output span. No component, wire or interface change.

## Completed project increment — PN2070 manufacturer pressure limits

A1/031 records the PN2070-02 800 bar pressure rating and 1,700 bar minimum burst pressure alongside its 0–400 bar measuring range. It does not assign an operating pressure, design limit or suitability determination. No component, wire or interface change.

## Completed project increment — PN2070 medium temperature

A1/032 records the ifm PN2070-02 medium range of −25 to 80 °C and its listed media (liquids and gases). It does not assign a process medium, operating temperature or compatibility assessment. No component, wire or interface change.

Next project increment: A1/049, selected from verified project evidence after this milestone.


## Completed project increment — PN2070 electrical supply data

A1/033 records the ifm PN2070-02 operating-voltage range of 18–30 V DC (to SELV/PELV) and current consumption below 35 mA. It does not verify installed supply or branch conditions, total project load current or PSU headroom. No component, wire or interface change.


## Completed project increment — PN2070 power-on delay time

A1/034 records the ifm PN2070-02 manufacturer-listed power-on delay time of 0.3 s. It does not assign a startup sequence, ready signal, PLC scan setting or end-to-end response. No component, wire or interface change.


## Completed project increment — PN2070 electrical protection characteristics

A1/035 records the ifm PN2070-02 manufacturer-listed protection class III and reverse-polarity protection. It does not assess project installation, wiring faults, protective devices or functional safety. No component, wire or interface change.


## Completed project increment — PN2070 minimum insulation resistance

A1/036 records the manufacturer-listed minimum insulation resistance of 100 MΩ with the data-sheet notation 500 V DC. It claims no project insulation measurement, installation test or electrical-safety result and does not direct testing of installed wiring or the assembled sensor. No component, wire or interface change.


## Completed project increment — PN2070 switching-output ratings

A1/037 records the ifm PN2070-02 listed switching-output current rating, voltage drop, switching frequency and protection entries. It assigns no channel, electrical mode, configured function or load and makes no suitability or protection-coordination claim. No component, wire or interface change.


## Completed project increment — PN2070 CMPT 2 switching-point ranges

A1/038 records the data-sheet CMPT=2 SP/rP parameter ranges, minimum difference and setting increment. It does not configure CMPT, thresholds, process pressure, output behavior or safety settings. No component, wire or interface change.


A1/039 records source-listed PN2070 CMPT=3 high-resolution set-point/reset-point ranges and steps without configuring thresholds, CMPT, process pressure, output behavior or safety settings. No component, wire or interface change.


A1/040 records the PN2070-02 manufacturer-recommended tightening torque and listed dependencies on lubrication, seal and pressure load. It does not assign an installed value or change project geometry, components, wires or interface.


A1/041 records manufacturer-listed PN2070 ambient and storage temperatures. It assigns no project site conditions and makes no suitability claim; no component, wire or interface changes.


A1/042 records the manufacturer-listed minimum PN2070 pressure cycles without inferring project service life, maintenance interval or system endurance. No component, wire or interface changes.


A1/043 records source-listed PN2070 dimensions and product weight without treating them as schematic scale, installation clearance or assembly mass. No component, wire or interface changes.


A1/044 records the PN2070-02 integrated-restrictor datum without representing a retrofit or hydraulic performance. No component, wire or interface changes.


A1/045 records the PN2070 manufacturer-listed IP 65/IP 67 ratings without claiming installed or assembled-project ingress protection. No component, wire or interface changes.


A1/046 records the PN2070 manufacturer-listed shock and vibration test values without claiming installed-system qualification or application suitability. No component, wire or interface changes.


A1/047 records the PN2070-02 wetted-parts material identifier without inferring chemical compatibility or corrosion suitability. No component, wire or interface changes.


A1/048 records the PN2070-02 product materials list without assigning specific part locations, chemical compatibility or corrosion suitability. No component, wire or interface changes.



A1/049 records the PN2070-02 M12, A-coded, four-contact gold-plated connector specification. It selects no cable or mating connector and makes no physical-fit or installed-compatibility claim. No component, wire or interface change.

Next project increment: A1/050, selected from verified project evidence after this milestone.


A1/050 records the PN2070-02 display-unit LEDs, switching-status LEDs and 4-digit red/green value display. It assigns no unit selection, indicator-state meaning, thresholds or remote behavior. No component, wire or interface change.

Next project increment: A1/051, selected from verified project evidence after this milestone.


A1/051 records the PN2070-02 G 1/4 internal-thread process connection designation and listed DIN EN ISO 1179-2 reference. No mating fitting or seal is selected, and no mechanical or installation suitability is inferred. No component, wire or interface change.

Next project increment: A1/052, selected from verified project evidence after this milestone.


A1/052 records the PN2070-02 upper-housing 345° rotation callout. It assigns no installed rotation angle, mounting clearance or installation suitability. No component, wire or interface change.

Next project increment: A1/053, selected from verified project evidence after this milestone.


A1/053 records the PN2070-02 programming-button callout from the technical drawing. It does not document the button function or assign an operating sequence. No component, wire or interface change.

Next project increment: A1/054, selected from verified project evidence after this milestone.


A1/054 records the PN2070-02 relative-pressure classification. It does not specify the project pressure reference or derive an absolute-pressure conversion. No component, wire or interface change.

Next project increment: A1/055, selected from verified project evidence after this milestone.


A1/055 records the PN2070-02 vacuum-resistance value of −1000 mbar (−0.1 MPa). It assigns no project vacuum condition or application suitability. No component, wire or interface change.

Next project increment: A1/056, selected from verified project evidence after this milestone.


A1/056 records the PN2070-02 PNP/NPN switching output designs and parameterisable normally open/normally closed output function. It selects no project polarity or output function. No component, wire or interface change.

Next project increment: A1/057, selected from verified project evidence after this milestone.


A1/057 records the PN2070-02 pulsed short-circuit and overload protection specifications for the output. It establishes no project protection performance, external circuit protection or coordination. No component, wire or interface change.

Next project increment: A1/058, selected from verified project evidence after this milestone.


A1/058 records the PN2070-02 maximum analogue-output response time of 3 ms. It does not define configured damping or system response. No component, wire or interface change.

Next project increment: A1/059, selected from verified project evidence after this milestone.


A1/059 records the PN2070-02 analogue-output damping parameter dAA range of 0...4 s without selecting a setting or assigning system response. No component, wire or interface change.

Next project increment: A1/060, selected from verified project evidence after this milestone.


A1/060 records the PN2070-02 process-value damping parameter dAP range of 0...4 s without selecting a sensor setting or assigning system response. No component, wire or interface change.

Next project increment: A1/061, selected from verified project evidence after this milestone.


A1/061 records the PN2070-02 programmable delay parameters dS and dr range of 0...50 s without selecting a delay or defining system response. No component, wire or interface change.

Next project increment: A1/062, selected from verified project evidence after this milestone.


A1/062 records the PN2070-02 manufacturer response-time rating of <1.5 ms. It does not establish project or system response time. No component, wire or interface change.

Next project increment: A1/063, selected from verified project evidence after this milestone.


A1/063 records the PN2070-02 minimum IO-Link process cycle time of 2.3 ms for factory setting / CMPT=2. It assigns no device configuration, master cycle or application response. No component, wire or interface change.

Next project increment: A1/064, selected from verified project evidence after this milestone.


A1/064 records the PN2070-02 minimum IO-Link process cycle time of 3 ms for Status_B High Resolution / CMPT=3. It assigns no device profile, master cycle or application response. No component, wire or interface change.

Next project increment: A1/065, selected from verified project evidence after this milestone.


A1/065 records the PN2070-02 IO-Link pressure resolution of 0.1 bar for factory setting / CMPT=2. It assigns no device mode and makes no precision claim. No component, wire or interface change.

Next project increment: A1/066, selected from verified project evidence after this milestone.


A1/066 records the PN2070-02 IO-Link pressure resolution of 0.2 bar for Status_B High Resolution / CMPT=3. It assigns no device mode and makes no precision claim. No component, wire or interface change.

Next project increment: A1/067, selected from verified project evidence after this milestone.


A1/067 records the PN2070-02 CMPT=2 cyclical pressure field width of 14 bits. It assigns no profile or decoded payload. No component, wire or interface change.

Next project increment: A1/068, selected from verified project evidence after this milestone.


A1/068 records the PN2070-02 CMPT=3 cyclical pressure field width of 16 bits. It assigns no profile or decoded payload. No component, wire or interface change.

Next project increment: A1/069, selected from verified project evidence after this milestone.


A1/069 records the PN2070-02 CMPT=3 cyclical device status field width of 4 bits. It defines no status codes or diagnostic meaning. No component, wire or interface change.

Next project increment: A1/070, selected from verified project evidence after this milestone.


A1/070 records the PN2070-02 CMPT=3 cyclical binary switching information field width of 2 bits. It assigns no state-code meanings or project output configuration. No component, wire or interface change.

Next project increment: A1/071, selected from verified project evidence after this milestone.


A1/071 records the PN2070-02 manufacturer's DeviceID 638 association with Status_B High Resolution / CMPT=3. This does not establish the installed device configuration. No component, wire or interface change.

Next project increment: A1/072, selected from verified project evidence after this milestone.


A1/072 records the PN2070-02 manufacturer's DeviceID 459 association with Factory setting / CMPT=2. This does not establish the installed device configuration. No component, wire or interface change.

Next project increment: A1/073, selected from verified project evidence after this milestone.


A1/073 records the PN2070-02 Smart Sensor - SSP 0 Generic Profiled Sensor listing under Factory setting / CMPT=2. It makes no claim about master port, IODD or active device configuration. No component, wire or interface change.

Next project increment: A1/074, selected from verified project evidence after this milestone.


A1/074 records the PN2070-02 Smart Sensor - SSP 3.1 Measuring Sensor listing under Status_B High Resolution / CMPT=3. It makes no claim about master port, IODD or active device configuration. No component, wire or interface change.

Next project increment: A1/075, selected from verified project evidence after this milestone.
