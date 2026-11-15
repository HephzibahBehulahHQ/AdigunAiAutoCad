# Canvas behavior compliance audit

Date: 2026-11-15
Product: AdigunAiAutoCad

## Result

The merged foundation implements the empty sectioned-project scaffold and several document-management behaviors. This increment adds an in-app path for opening example files as independent editable native copies. The application and example library do **not** yet comply with all of the owner's canvas and native-example requirements. The requirement document is saved separately; writing it is not evidence of implementation.

## Verified current behavior and gaps

### Implemented in this slice

- `cad-engine.js` defines a stable project model with empty A1–A4 sections, shared metadata, open tabs, and cross-sheet connection storage. It supports A5 onward and uncapped sheet creation with stable IDs and project-wide sequential numbering. Engine operations rename/move/delete sheets while retaining identities and connections; deleting a referenced sheet records an unresolved-reference diagnostic.
- `index.html` creates a named, empty project with A1–A4 in the existing editor shell. Sections collapse/expand and have sidebar add controls. Adding a sheet does not activate the canvas; selecting opens it; closing a canvas tab leaves the document. Project sheets support inline rename and drag/drop reorder or section moves.
- The inspector edits shared project metadata and per-sheet title-block values. A-series size/orientation update sheet coordinates and frame geometry; print and SVG export use full sheet dimensions. The title block uses the required fixed identities. Project JSON carries the project model, title fields, active sheet, open views and cross-sheet connections; exported filenames use the project title.
- Regression coverage exercises model rename/move/delete, stable link IDs and diagnostics, JSON round-trip/independent copies, paper dimensions, and source-level UI contract checks. GitHub Chromium CI verifies startup, new-project sections, sheet creation/selection, native drawing edits, Save As/reopen, editable example copies, and title-block fields/placement.
- Project Explorer's List view numbers and groups the source-backed catalog examples; selecting one opens an independent native copy through the same project loader. New Project shows only the blank A1–A4 project template, with no example list or blank sheets. The Symbol Library remains the component and symbol catalogue. Legacy examples retain their native JSON structure, and their source files remain unchanged. Chromium covers the example copy workflow, component values/positions/colors, wire editing, source isolation, and Save As/reopen.

### Remaining gaps

- The editor retains legacy flat `state.sheets` alongside the new model. Legacy projects keep their old prompt-based rename/reorder flow. Section names themselves are not yet editable inline; document operations in the new model are.
- New-model deletion preserves the cross-sheet connection records and stores diagnostics. The existing project analyzer detects missing electrical endpoints; complete rendered FROM/TO reciprocal references and affected-link reporting in the actual UI still need end-to-end verification.
- `cad-engine.js` has project-wide cross-sheet connection analysis and connector helpers. This is useful existing engineering functionality, but it does not prove the full workflow for A5/A6, UI continuation labels, reciprocal references after renumbering, or save/reopen.
- Project JSON remains a manual local save/open workflow, not durable browser-local autosave. Save As uses the browser file picker when available, and Save writes to the selected file handle during the current page session; unsupported browsers retain downloadable JSON. Reopening requires the user to select the saved file. CI Chromium verifies clean project creation, section sheet selection, canvas editing, and Save As/reopen; a separate browser path opens a 100-sheet example as an A1–A4 native copy, edits settings and positions on two components, changes component color, adds a wire on A2, and verifies the saved copy retains its source isolation and resolvable cross-sheet wire endpoints. The native file picker is mocked. Scale is stored/editable title-block metadata; scaling the drawn geometry is not implemented.
- `customSheetFrame` responds to A-series size/orientation and renders editable project metadata in a compact lower-right title block. Chromium checks its fields, branding and A3 footprint; legibility at every paper size, content-footprint collision prevention, and real print/SVG visual behavior remain unverified.
- The DOL reference now has 96 authored sheets classified into A1–A4 (6/15/5/70), including editable panel layout A3/001. A2/095 adds SEW thermal-class options without selecting the installed M1 class. It clears the 30-sheet floor but remains four authored sheets short of its 100-sheet target; continue with A2/096. Source A2 labels are legacy identifiers; editable copies group sheets by assigned section and apply section-prefixed project-order numbers.

## Implementation order

1. Extend Chromium acceptance to cover inline rename, drag/reorder/section move, tab close/reopen, delete diagnostics, and project isolation through the actual interface.
2. Implement drawing-scale behavior and ensure the title-block footprint stays clear through zoom, pan, print and SVG export.
3. Verify reciprocal cross-sheet continuity, identifiers, diagnostics and supported save/reopen/export across A2 and every section, including A5.
4. Author a source-backed, at-least-30-sheet native A1–A4 example from the repo's engineering topics. Every example must open as an independent editable project copy; verify component edits, values, colors, connections, save-as, close and reopen.
5. After A2/095 merges, continue with A2/096 after confirming section assignment, project-order numbering, model validation and copy save/reopen. Preserve source-backed data and verify deployment in reviewable slices.
6. Run the owner's complete UI acceptance workflow before claiming end-to-end compliance. Report specified, implemented, tested and deployed states separately.

The three linked EplanAI documents are read-only behavior references. AdigunAiAutoCad uses its own code, data, interface geometry and branding.
