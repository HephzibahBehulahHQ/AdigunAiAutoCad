# Editor interaction backlog and milestone order

Updated 2026-11-12. This records the remaining interaction work from the user's two pasted function catalogs while the product advances to real engineering components and example projects. The long generic lists are acceptance input, not proof that every item is applicable or implemented.

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

Apply this concurrent discovery rule to every example milestone: when official-source research establishes a required component missing from the catalog, add its verified definition, real terminal/pin geometry, supported specifications, editable properties, source record and focused tests in the same milestone. When completing the example exposes a missing CAD function, implement and regression-test that function with the example. Do not substitute generic glyphs or unconnected visual stand-ins for a modeled engineering component. Preserve the approved workstation geometry and verify that any required UI rendering fits the existing layout.

Next: source and build the next distinct engineering example, while continuing the interaction audit and preserving the approved workstation geometry.


## Component and project source-data guidance

Continue with manufacturer-specific parts and small, internally consistent examples. Record manufacturer and exact part number, applicable ratings, real terminal IDs and positions, symbol representation, editable instance properties, source documents and retrieval dates. Include dimensions, accessories, compatibility and other fields only when the selected manufacturer's source documents support them; applicability varies by component family. Keep component behavior outside the model explicit when it is not implemented.

The user's separate 50-project list is a candidate backlog and starting BOM idea, not a set of verified designs. The proposed 120 sheets per project / 6,000-sheet target is an aspiration, not completed documentation or a release criterion. Select and validate each example against official sources before adding it.

Future account indicator: add a compact user icon beside Command Search only when that milestone is reached; show offline red and online green states while preserving current header geometry and preventing layout shift. Treat it as a later isolated UI milestone; do not make room by moving or resizing existing header controls.

