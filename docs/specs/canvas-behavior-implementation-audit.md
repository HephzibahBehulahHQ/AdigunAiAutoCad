# Canvas behavior compliance audit

Date: 2026-11-15
Product: AdigunAiAutoCad

## Result

The merged foundation implements the empty sectioned-project scaffold and several document-management behaviors. This increment adds an in-app path for opening example files as independent editable native copies. The application and example library do **not** yet comply with all of the owner's canvas and native-example requirements. The requirement document is saved separately; writing it is not evidence of implementation.

## Verified current behavior and gaps

### Implemented in this slice

- Moving or rotating a linked wire updates only its matching off-page endpoint. Undo and redo restore both the wire and its reference point. A local Chrome check verified coordinate edits, rotation, undo/redo, native save, and project connectivity analysis.

- Component reference changes from Properties and the context menu use the same operation. Undo and redo restore objects together with their connector targets. Local Chrome verified that renaming a linked component, undoing, redoing, and rotating the component each produced a valid save with its attached wire. The existing menu and toolbar markup stayed unchanged.

- The existing Properties inspector edits object layer, stroke color, and applicable line weight and type. Changes are undoable, and layer visibility is saved with the native project. Local Chrome verified component style changes, undo/redo, and reopen with the reassigned layer hidden. The menu and toolbar markup stayed unchanged.

- Electrical checks shows project-wide connectivity counts and navigable findings for unresolved wire endpoints, duplicate device tags, pins without directly attached wires, drawing geometry errors, and unresolved references from sheet deletion. Download electrical check report exports JSON with the sheet index, counts, findings and any analysis errors. Local Chrome verified download and the surviving location of a deleted-sheet reference. These model rules have no standards edition mapping. Other rule families and waiver history remain open.

- `cad-engine.js` defines a stable project model with empty A1–A4 sections, shared metadata, open tabs, and cross-sheet connection storage. It supports A5 onward and uncapped sheet creation with stable IDs and project-wide sequential numbering. Engine operations rename/move/delete sheets while retaining identities and connections; deleting a referenced sheet records an unresolved-reference diagnostic.
- `index.html` creates a named, empty project with A1–A4 in the existing editor shell. Sections collapse/expand and have sidebar add controls. Adding a sheet does not activate the canvas; selecting opens it; closing a canvas tab leaves the document. Project sheets support inline rename and drag/drop reorder or section moves.
- The inspector edits shared project metadata and per-sheet title-block values. A-series size/orientation update sheet coordinates and frame geometry; print and SVG export use full sheet dimensions. The title block uses the required fixed identities. Project JSON carries the project model, title fields, active sheet, open views and cross-sheet connections; exported filenames use the project title.
- Regression coverage exercises model rename/move/delete, stable link IDs and diagnostics, JSON round-trip/independent copies, paper dimensions, and source-level UI contract checks. GitHub Chromium CI verifies startup, new-project sections, sheet creation/selection, native drawing edits, Save As/reopen, editable example copies, and title-block fields/placement.
- Project Explorer's List view numbers and groups the source-backed catalog examples; selecting one opens an independent native copy through the same project loader. New Project shows only the blank A1–A4 project template, with no example list or blank sheets. The Symbol Library remains the component and symbol catalogue. Legacy examples retain their native JSON structure, and their source files remain unchanged. Chromium covers the example copy workflow, component values/positions/colors, wire editing, source isolation, and Save As/reopen.

### Remaining gaps

- SVG files open as read-only image previews. Local headless Chrome verified that preview and close preserve the native drawing, active sheet, and project save path. Importing SVG elements as editable CAD objects remains open.

- The editor retains legacy flat `state.sheets` alongside the new model. Legacy projects keep their old prompt-based rename/reorder flow. Section names themselves are not yet editable inline; document operations in the new model are.
- Deleting a native sheet moves each affected connection record into its unresolved-reference diagnostic. Surviving connections stay active, and the Project Explorer lists the unresolved references after save and reopen. The existing project analyzer detects missing electrical endpoints; complete rendered FROM/TO reciprocal references and affected-link reporting in the actual UI still need end-to-end verification.
- `cad-engine.js` has project-wide cross-sheet connection analysis and connector helpers. This is useful existing engineering functionality, but it does not prove the full workflow for A5/A6, UI continuation labels, reciprocal references after renumbering, or save/reopen.
- The workspace stores the latest validated native-project draft in browser-local storage. Recover browser draft is an explicit action, and normal startup still opens the empty workspace. Storage availability depends on the browser profile and its quota. Save As remains the workflow for a named project file. Save As uses the browser file picker when available, and Save writes to the selected file handle during the current page session; unsupported browsers retain downloadable JSON. Reopening requires the user to select the saved file. CI Chromium verifies clean project creation, section sheet selection, canvas editing, and Save As/reopen; a separate browser path opens a 100-sheet example as an A1–A4 native copy, edits settings and positions on two components, changes component color, adds a wire on A2, and verifies the saved copy retains its source isolation and resolvable cross-sheet wire endpoints. The native file picker is mocked. The sheet inspector accepts a positive drawing scale ratio or Fit to page. Explicit ratios transform the drawing about the sheet origin and retain the editable drawing coordinates. A local headless Chrome smoke test verified a 1:2 canvas and SVG transform, the visible scale label, A3 SVG dimensions, and the A3 print setup. Fit to page uses the rendered title block height for its reserved strip. Physical print output and clearance for manual scales still require verification.
- `customSheetFrame` responds to A-series size/orientation and renders editable project metadata in a compact lower-right title block. Chromium checks its fields, branding and A3 footprint; legibility at every paper size, content-footprint collision prevention, and real print/SVG visual behavior remain unverified.
- The DOL reference now has 100 authored sheets classified into A1–A4 (6/19/5/70), including editable panel layout A3/001. A2/095 records SEW thermal-class options without selecting the installed M1 class; A2/096 records motor temperature-sensor order-code options without claiming any option is installed on M1. The project meets its 100-sheet target. A2/097 lists the evidence needed to verify installed M1 and site conditions. A2/098 and A2/099 track Q1 protection and KM1 control-supply evidence. Source A2 labels are legacy identifiers; editable copies group sheets by assigned section and apply section-prefixed project-order numbers.

## Implementation order

1. Local headless Chrome exercised inline rename and cancel, drag reorder within a section, section moves, tab close/reopen and deletion of an unlinked sheet. A local Chrome check also verified linked-sheet deletion, retention of an unrelated connection, diagnostic persistence through save and reopen, and isolation from a newly created project.
2. Verify drawing-scale behavior in Chromium and ensure the title-block footprint stays clear through zoom, pan, print and SVG export.
3. Verify reciprocal cross-sheet continuity, identifiers, diagnostics and supported save/reopen/export across A2 and every section, including A5.
4. Author a source-backed, at-least-30-sheet native A1–A4 example from the repo's engineering topics. Every example must open as an independent editable project copy; verify component edits, values, colors, connections, save-as, close and reopen.
5. After verifying the 100-sheet DOL package, continue the library with the next distinct topology. Verify section assignment, project-order numbering, model validation and copy save/reopen in each slice. Preserve source-backed data and verify deployment in reviewable slices.
6. Run the owner's complete UI acceptance workflow before claiming end-to-end compliance. Report specified, implemented, tested and deployed states separately.

The three linked EplanAI documents are read-only behavior references. AdigunAiAutoCad uses its own code, data, interface geometry and branding.
