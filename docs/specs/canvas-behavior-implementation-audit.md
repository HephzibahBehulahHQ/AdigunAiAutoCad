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
- Regression coverage exercises model rename/move/delete, stable link IDs and diagnostics, JSON round-trip/independent copies, paper dimensions, and source-level UI contract checks. Inline-script syntax, `cad-engine.test.js`, project-library validation, and `git diff --check` pass. Live browser workflow is not verified because headless Chrome exits before DevTools startup.
- The New Project dialog lists source-backed catalog examples and opens each as a named copy through the same native JSON loader. Legacy examples retain their existing sheet structure and native JSON format during copying; the source file is not mutated. Model tests verify all seven current catalog entries survive copy, save and reopen; one 100-sheet reference is exercised with edited instance settings, color, wire geometry, labels and cross-sheet connections. The product UI workflow (including local download/close/reopen) is still not verified.

### Remaining gaps

- The editor retains legacy flat `state.sheets` alongside the new model. Legacy projects keep their old prompt-based rename/reorder flow. Section names themselves are not yet editable inline; document operations in the new model are.
- New-model deletion preserves the cross-sheet connection records and stores diagnostics. The existing project analyzer detects missing electrical endpoints; complete rendered FROM/TO reciprocal references and affected-link reporting in the actual UI still need end-to-end verification.
- `cad-engine.js` has project-wide cross-sheet connection analysis and connector helpers. This is useful existing engineering functionality, but it does not prove the full workflow for A5/A6, UI continuation labels, reciprocal references after renumbering, or save/reopen.
- Project JSON remains a manual local save/open workflow, not durable browser-local autosave. Save As uses the browser file picker when available, and Save writes to the selected file handle during the current page session; unsupported browsers retain downloadable JSON. Reopening requires the user to select the saved file. CI Chromium verifies clean project creation, section sheet selection, canvas editing, and Save As/reopen; a separate browser path opens a 100-sheet example as an A1–A4 native copy, edits a component setting and position, changes color, and verifies the saved copy retains its source isolation and cross-sheet connections. The native file picker is mocked. Scale is stored/editable title-block metadata; scaling the drawn geometry is not implemented.
- `customSheetFrame` responds to A-series size/orientation and renders editable project/sheet metadata in sheet coordinates. Full title-block legibility at every paper size, content-footprint collision prevention, and real print/SVG visual behavior are not verified.
- The existing DOL and reference library do not yet constitute a coherent, sectioned, at-least-30-sheet A1–A4 example project. Do not promote the pending flat A2/095 increment or claim the existing example satisfies the new requirement.

## Implementation order

1. Verify new-project creation, inline rename, drag/reorder/section move, tab close/reopen, delete diagnostics, and project isolation through the actual interface.
2. Implement drawing-scale behavior and ensure the title-block footprint stays clear through zoom, pan, print and SVG export.
3. Verify reciprocal cross-sheet continuity, identifiers, diagnostics and supported save/reopen/export across A2 and every section, including A5.
4. Author a source-backed, at-least-30-sheet native A1–A4 example from the repo's engineering topics. Every example must open as an independent editable project copy; verify component edits, values, colors, connections, save-as, close and reopen.
5. Reconcile the pending A2/095 work with the sectioned numbering rule before release. Use a clean branch based on current main, then push, merge only after checks, deploy and verify production in reviewable slices.
6. Run the owner's complete UI acceptance workflow before claiming end-to-end compliance. Report specified, implemented, tested and deployed states separately.

The three linked EplanAI documents are read-only behavior references. AdigunAiAutoCad uses its own code, data, interface geometry and branding.
