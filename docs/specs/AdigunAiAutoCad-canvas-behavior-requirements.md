Continue your existing work on **AdigunAiAutoCad**. Apply the following requirements to its project structure, sidebar, drawing sheets and canvas. These instructions guide the current implementation; preserve completed work and existing engineering functionality.

**1. Inspect the current implementation first**

Read the repository’s current instructions, master plan, project model, persistence logic and approved interface requirements. Identify what already works, preserve it, and implement the missing behaviour through the existing interface. Do not restart the application or replace its shell.

Use **AdigunAiAutoCad** as the software identity. References below to project structure and electrical documentation describe required behaviour, not proprietary EPLAN source code or assets.

**2. Treat each engineering installation as ONE project**

A complete installation must be one coordinated project containing its overview, electrical drawings, panel layouts and final documentation. Do not split those documents into separate projects.

“Installation of a 3 kVA Inverter” was only an example used to explain this structure. Do not assume every project must be an inverter installation.

**3. Create these default sections automatically**

When the user selects **Create New Project**, create one named project with four empty section containers in the existing sidebar:

| Section | Default purpose |
| --- | --- |
| **A1 — General information** | Overview, title page, contents, equipment/device information, symbols, abbreviations and design basis. |
| **A2 — Electrical design** | Connected electrical schematics, power and control circuits, terminals, cables, protection and earthing. |
| **A3 — Panel layout and installation** | Physical equipment arrangement, mounting, cable routing and installation details corresponding to the electrical design. |
| **A4 — Final documentation** | Material lists, connection reports, summaries, inspections, commissioning and handover information. |

These are containers within the same project. Do not create four separate projects or automatically fill them with unnecessary blank sheets.

A1–A4 are defaults, not a limit. Allow users to create A5, A6 and further sections when required.

**4. Make the sidebar behave like folders and files in VS Code**

Each section must:

- Expand and collapse.
- Display its own small **+** control.
- Create a new sheet inside that section every time its **+** is activated.
- Support repeated sheet creation without an arbitrary fixed sheet-count cap.
- Offer the same behaviour for default and user-created sections.

Keep creation, organisation and renaming within the existing sidebar. Do not introduce large screens or modal dialogs for routine sheet management. Use scalable rendering/navigation for large projects.

**5. Separate creating a sheet from opening it**

Activating a section’s **+** adds a real sheet to the project and sidebar. It must not automatically switch the canvas away from the sheet currently being edited.

Selecting a sheet in the sidebar opens that sheet’s drawing in the canvas. Selecting another sheet switches to that document while preserving existing work.

Every sheet must be an independently editable document with its own content and a stable internal identity.

**6. Allow inline sheet renaming**

Support double-clicking a sheet name to rename it inline. A right-click **Rename** command may activate the same inline field.

Display the section and current sheet name together, for example:

- **A1/0012**
- **A1/Power**, after renaming the sheet to “Power.”

Synchronise the sidebar label, canvas/tab label, title block and displayed cross-references. Keep immutable internal IDs separate from editable names and display numbers.

**7. Support dragging, reordering and moving sheets**

Let users drag sheets in the sidebar like PowerPoint slides. For example, moving the first sheet to the fifth position must update the document order without losing its contents.

Support moving sheets between sections while preserving their identity and electrical connections.

Use continuous default numeric ordering across the project. If A1 ends at **A1/005**, the next numbered sheet in A2 starts at **A2/006**. Reordering or inserting sheets must update affected display numbers and references consistently.

Custom names remain attached to their sheets. Renumbering must never silently change which document an electrical reference targets.

**8. Distinguish closing a canvas tab from deleting a sheet**

The sidebar represents the project’s document structure. Canvas tabs represent open views of those documents.

- **Close canvas tab:** close the view, preserve the sheet and its work, and keep its sidebar entry.
- **Reopen:** selecting the sidebar entry opens the preserved document again.
- **Delete from sidebar:** explicitly remove the sheet from the project through a separate delete action.

Never delete a document because its canvas tab was closed. Do not silently discard edits when closing a view. Support undo for document deletion where the existing history system permits it.

If a deleted sheet has electrical references, identify the affected links and show unresolved-reference diagnostics. Never silently reconnect them to a different sheet.

**9. Make electrical sheets parts of one connected schematic**

**Cross-sheet electrical continuity is mandatory for A2 drawings.** Apply the same rule to electrical drawings in every other current or future section, including A5 and A6. Do not hard-code continuity support to A2 alone.

Sheets must not become disconnected illustrations merely because they are separate documents or tabs.

For every connection continuing between sheets:

- Show an incoming continuation/interruption symbol identifying **where it comes FROM**.
- Show an outgoing continuation/interruption symbol identifying **where it goes TO**.
- Include the actual potential or signal name, destination/source sheet and grid coordinate.
- Provide a matching reciprocal reference at the other endpoint.
- Preserve net identity, terminal identity and cable/core identity where applicable.

For example, a conductor leaving **A2/005:B8** for **A2/006:A2** must have matching references at both ends. If it then continues to **A5/007**, that sheet must participate in the same reference system.

Follow the actual circuit topology. A continuation may lead to a nonadjacent sheet or a different section. Do not invent connections merely to link consecutive page numbers.

Identify **L1, L2, L3, N, PE, DC polarities and control signals** where actually present. Do not add nonexistent phases to a single-phase or DC circuit. Use appropriate conductor identification and colours; colour alone must never substitute for electrical identity.

Declare actual sources, loads, external interfaces and intentional spare terminals. Documentation-only pages should reference their underlying electrical data rather than display artificial conductor lines.

**10. Preserve connectivity through every editing operation**

Renaming, reordering, moving or renumbering a sheet must update displayed references while preserving the underlying electrical connection graph.

Closing a tab must not affect connectivity. Saving, reopening and supported exports must retain connections and reciprocal references.

Validate missing targets, mismatched potentials, broken terminal references and unintended connections. Identical visible names must not silently merge electrically separate circuits.

**11. Include an editable bottom-right drawing title block**

Every sheet must show a title block **inside the canvas, at the bottom-right of the sheet frame**. Anchor it to sheet coordinates, not the browser viewport.

It must remain correctly positioned during zooming, panning, paper-size/orientation changes and supported printing/export. Reserve its footprint so drawing content and cross-reference labels do not overlap it.

Provide editable information including:

- Project title and project/job number.
- Project manager.
- Client/customer and installation location.
- Designer/drawn by, checked by and approved by.
- Drawing date, revision and revision date.
- Drawing/document number.
- Sheet name, description and current section/sheet reference.
- Scale, paper size and orientation through the corresponding actual drawing settings.
- Notes or issue status.

Use shared project metadata for information such as project title and manager. Use sheet-specific fields or overrides for drawing details and revisions. Editing shared information must update the relevant sheets consistently.

Allow editing through the existing inspector/sidebar or direct field interaction. Avoid a large new management screen.

Only these identity texts are fixed and non-editable:

- **Hephzibah Behulah**
- **AdigunAiAutoCad**

Use the repository’s authoritative branding. Do not use **AdigunEplanAI** as this project’s software name. Do not invent trademark symbols, approvals, signatures or certification claims.

**12. Keep panel layouts consistent with the electrical design**

A3 must explain how to physically assemble and install the system documented in the electrical drawings.

Maintain consistent device identifiers across schematics, panel layouts, terminal strips, cable schedules and reports. Distinguish panel-mounted equipment from externally installed equipment. Do not assume every component belongs inside the enclosure.

**13. Save complete project state**

Saving and reopening must preserve:

- Project identity and editable metadata.
- All sections, including user-created sections.
- Sheet identities, names, membership and order.
- Drawing contents and title-block information.
- Electrical connections and cross-sheet references.
- Open canvas views separately from the underlying documents.

Keep projects isolated: editing one project’s metadata or sheets must not change another project.

**14. Use realistic project scope and documented assumptions**

For substantial example projects, plan at least **30 meaningful sheets**, expanding when complexity requires it. This is an example-project planning target, not a requirement to generate 30 empty sheets whenever a user creates a project.

A1–A4 must describe the same installation. Populate sheets with actual engineering content rather than titles alone.

Inspect the repository’s project topics and existing plans before asking the owner for information already available there. Research suitable equipment and make coherent educational assumptions when developing examples. Clearly distinguish assumptions from verified manufacturer information and unresolved installation inputs.

Do not present a planning brief as a completed drawing, a simulation or an approved installation.

**15. Verify the complete workflow before claiming completion**

Test the following through the actual interface:

1. Create a named project and verify empty A1–A4 containers.
2. Add several sheets under different sections without changing the active canvas.
3. Rename a sheet inline to “Power,” select it and verify its editable document and labels.
4. Add A5 and verify identical sheet-management behaviour.
5. Drag sheets into a different order and move one between sections.
6. Connect electrical drawings across sheets, including a connection into A5.
7. Rename and reorder connected sheets; verify updated references and unchanged connectivity.
8. Close a canvas tab; verify its document remains in the sidebar and reopens intact.
9. Delete a referenced sheet in a test project; verify explicit deletion behaviour and affected-link diagnostics.
10. Edit title-block project and sheet fields; verify shared updates, sheet-specific values and protected branding.
11. Save and reopen; verify document contents, organisation, metadata and connections.
12. Inspect supported exports for correct title blocks and cross-references.

Continue in small, reviewable increments. Follow the repository’s checks and authorised merge/deployment workflow. Report separately what is **specified, implemented, tested and deployed**. Do not claim a feature works merely because its requirement has been written down.
## Owner addendum: repository and product boundary

The reference material below belongs to `HephzibahBehulahHQ/adigunEplanAI` and is read-only. Do not edit that repository, create branches or PRs there, merge there, or deploy from there. Apply relevant behavior only in the current `AdigunAiAutoCad` project and its own architecture. Preserve this application's interface geometry and branding. For this product, the fixed identities in the attached rule are **Hephzibah Behulah** and **AdigunAiAutoCad**; do not use **AdigunEplanAI** as its software name.

- Project template reference: https://github.com/HephzibahBehulahHQ/adigunEplanAI/blob/main/docs/3000-solid-engineering-projects-to-work-on/TEMPLATE.md
- Electrical continuity reference: https://github.com/HephzibahBehulahHQ/adigunEplanAI/blob/main/docs/3000-solid-engineering-projects-to-work-on/CONTINUITY.md
- Title-block reference: https://github.com/HephzibahBehulahHQ/adigunEplanAI/blob/main/docs/3000-solid-engineering-projects-to-work-on/TITLE_BLOCK.md

## Owner addendum: examples are editable native projects

Every example project must be a real, fully editable native project, not a static image, decorative drawing, or read-only demonstration. Opening an example creates an independent editable copy; changes must never mutate the original example. Example documents use the same native model, editor tools, and persistence as user-created projects. Components, their editable instance values and supported visual properties, wires, terminals, connections, labels, cross-sheet references, sheets, project information, layouts, and non-branding title-block fields remain editable. Users can save a copy under a new local project name, close it, and reopen it with edits and electrical relationships intact. Fixed identities “Hephzibah Behulah” and “AdigunAiAutoCad” remain protected. Verified manufacturer data stays separate from editable instance/design settings and must not be falsified by replacement or value edits. Examples are not complete until the open, edit, connect, recolor, save-as, close, and reopen workflow is verified.
