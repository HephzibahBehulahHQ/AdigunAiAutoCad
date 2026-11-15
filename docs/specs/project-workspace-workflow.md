# AdigunAiAutoCad project workspace workflow

This product-local specification translates the supplied AdigunEplanAI workflow reference into AdigunAiAutoCad's existing document model and interface. The EplanAI repository is reference-only; this file and all implementation changes belong to AdigunAiAutoCad.

## Required behavior

- A fresh visit, reload, or browser-tab return starts with an empty canvas, no active project, and no open drawing tabs. It must not restore a prior in-memory project. Saved project files remain available for explicit opening.
- New Project creates one named project with empty A1 Overview, A2 Electrical, A3 Panel design, and A4 Reports sections. It creates no sheets. Keep the current AutoCad interface and engineering tools.
- Each section's add-sheet control creates a native editable sheet numbered within that section. Creation adds it to the tree; selecting its row opens its canvas tab. Repeated additions remain in their chosen section. Closing a tab must not delete its sheet; deletion remains a separate explicit action.
- Example projects belong in the Project Library. Choosing one opens an independent editable project copy; its original template remains unchanged. Organize overview/general information in A1, circuits and connection documents in A2, physical layouts in A3, and reports/final records in A4.
- Save and Save As must serialize the full native project model. Reopening a saved file must preserve sheets, editable drawing objects, connections, metadata, and project identity. Warn before leaving when unsaved edits exist.
- Keep visual references as interaction guidance. Do not claim pixel-level conformance unless the actual images are available and the rendered UI has been checked.

## Acceptance sequence

Fresh visit → empty workspace → New Project → four empty sections → add one sheet → verify it appears under its selected section without activating a tab → select it → draw/edit native objects → save as a new local file → reopen and verify all model data → reload and verify the workspace is clean → confirm the saved file remains available for explicit reopening.
