# AdigunAiAutoCad
This is adigunAiAutoCad Project 

## Edit a circuit

Open the [pressure-sensor drawing](https://adigunaiautocad.hephzibahbehulah.com/?example=terminal-marshalling&sheet=marshalling-analog-pressure) directly as an editable copy. Example links use the catalog ID in `example` and optionally the stable drawing ID in `sheet`. Save the copy locally to keep your edits.

While editing a published example, use **Copy source example sheet link** in the command palette to share the original drawing. Share the saved project file to send your edits.

Click a wire to open **Properties** for its color, line weight, and line type. Right-click a wire and choose **Select wires on this net** to select its visible segments on the current sheet. A palette stroke color change applies to the selection as one undoable edit.

The drafting viewport fills the workspace. Model coordinates use positive X to the right and positive Y downward, with negative coordinates available. New sheets start with the print frame hidden. Use **Toggle print frame**, **Fit print frame**, **Fit selection**, or **Go to origin** in the command palette. **Fit drawing to view** includes visible off-frame objects. Pan with middle-button drag or Space + drag, and use the wheel to zoom around the pointer.

In **Drafting settings**, change the display grid and snap intervals independently. Select inches or millimetres for the ruler and cursor readout. Drag from the top ruler for a horizontal guide or from the left ruler for a vertical guide. The Guides controls let you enter exact positions, lock, hide, or delete guides. Guides save with the sheet and stay out of drawing exports.

Drag a guide’s marker along its ruler to reposition it. Locked guides keep their position.

Use **Draw distance dimension** and drag between two drawing points to add a measured annotation. Edit the endpoints in Properties. The label follows the sheet’s display units while the endpoints remain in millimetres. The dimension measures its own endpoints and can be repositioned independently.

Use **Export full drawing as SVG** for all visible geometry, including off-frame objects. **Export print frame as SVG** and **Print drawing** use the configured paper size and warn before clipping off-frame geometry.

Select one or more drawing objects and use **Export selection as SVG** to export just those objects, cropped to their bounds.

Use **Export region as SVG** and drag a rectangle to crop the drawing view, including at negative coordinates. The SVG retains geometry outside the rectangle and clips it from view. Use selection export when the file should contain only specific objects.

Set each paper margin independently in Properties. Margins position the print frame and its title block, and are saved with the sheet without moving drawing objects.

For a custom sheet, choose **Custom** in the **Paper size** field in Properties, then set the width and height in millimetres. Print and frame SVG export use the saved dimensions.

Open **Symbol Library**, pick a component, then click its position on the sheet. Placement opens **Properties** for the selected component. A click on a placed component opens its properties as well. Turn off **Snap** for unrestricted movement. Click a pin marker to attach a wire exactly there, or enable **Object Snap** to attach when clicking near a pin.

Shift-click a sidebar symbol to quick-insert it at a clear location in the visible drawing. If no candidate fits, the editor opens the placement preview so you can choose a spot.

To author a reusable symbol, select unrotated lines, rectangles, or circles and run **Create project symbol from selection**. Enter a name and terminal coordinates in millimetres relative to the selection center. The symbol appears under **Project symbols** and stays with the drawing after Save and Open.

Use **Wire** to click two pin anchors for an automatic orthogonal route. To draw your own route, click the first pin, click the sheet wherever you want to add bends, then click the destination pin. Press **Enter** to finish a manual route with an open end, or **Esc** to cancel. In **Select** mode, select a wire to change its color or use **Reconnect start** / **Reconnect end**. Moving either component keeps its wire endpoint attached and leaves the manual bends in place.

Drag a selected catalog symbol's corner handle or edit **Symbol scale** in Properties to resize it proportionally. Attached wires follow the pins, and the editor rejects edits that introduce a component overlap. The manufacturer's dimensions remain available separately in Properties.

To redraw a wire between its existing terminals, select the wire and choose **Reroute wire** in Properties. Click the drawing to set replacement bends, then press **Enter** or choose **Apply wire route**. Applying without bends restores the automatic route. Press **Esc** to cancel.

Click the handle above a selected symbol to rotate it one quarter turn, or set **Rotation** in Properties. Attached wires follow the rotated pins.

To join circuits across sheets, draw a wire with one free end on each sheet. Open **Electrical checks** on either sheet, select both ends under **Connect wire ends across sheets**, and name the connection. The resulting arrows open the corresponding sheets. Use **Remove link** under **Cross-sheet links on this sheet** to free the endpoints for reconnecting. Undo restores the link.

Drawing Undo and Redo follow edit order across sheet navigation and reopen the sheet containing the affected edit. Deleting a sheet clears drawing history.

In **Electrical checks**, use **Export device index CSV** for component references and part numbers across the project, or **Export sheet index CSV** for sheet order, titles, paper formats, scales, and revisions.

Use **Find wires** in the current sheet's Wire List to search by wire ID, net, cable and core, or terminal reference. **Locate wire** zooms to the segment and opens its Properties.

Electrical checks flags wired protective-earth terminals when their connected net has no explicit **PE** potential designation. The finding links to the affected terminals for review.

**Open** accepts ASCII DXF model-space lines, circles, and straight polylines as editable drawing geometry in a new project. The import converts supported drawing units to millimetres, treats unitless coordinates as millimetres, and preserves the original layer name on each imported entity. Blocks, arcs, bulged polylines, and other unsupported entities are listed when skipped. Use native project JSON to save the imported drawing. DXF geometry has no electrical part or net identities.

The browser bundles [dxf-parser 1.1.2](https://github.com/gdsestimating/dxf-parser) from its pinned npm tarball. The [parser license](vendor/dxf-parser-LICENSE.txt) and [bundled loglevel license](vendor/loglevel-LICENSE.txt) are included.

In the command palette, **Export current sheet as DXF** writes visible lines, circles, and line segments from wires, rectangles and freehand paths in millimetres. The PT 2,5-MT disconnect exports as line and circle geometry matching its saved knife position. Project symbols export their line, rectangle, and circle geometry with terminal marks. The command reports other skipped component symbols, text and unsupported shapes. Use native project JSON for electrical connectivity, sheet structure and drawing styles. The export uses [DXF Writer 2.8.9](https://github.com/dxfjs/writer) under its [MIT license](vendor/dxf-writer-LICENSE.txt).

Use **Print project set** in the command palette to print every sheet in project order. Choose **Save as PDF** in the browser print dialog for a single project PDF.


## Verified reference project increment

The opening set contains 100 authored sheets through A1/100, including the source-backed Siemens/SEW starter, IFM sensor and PLC examples, and PN2070 manufacturer reference records. A1/019 now wires the spare PLC output and its return to XT6. The project has 40 component instances, 354 routed wire segments, 76 sheet-local nets and 29 explicit cross-sheet connections with no unresolved open endpoints.  See `examples/real-projects/siemens-sew-star-delta-reference.adigun.json`.

## Deployment and release

After an online visit, supported browsers can reload the editor offline or during a temporary server error. Project Explorer keeps previously opened examples on this device so you can open and save an independent drawing without a network connection.

The GitHub Pages workflow checks the committed example report and publishes the editor, native example files, and validation report. Before client release, run **Verify client release** in GitHub Actions against the candidate branch. It requires the full project library and then runs the Chromium CAD workflow. The equivalent library-only check is `node scripts/project-library-validation.js --check --require-release-scale`. Verify the remaining acceptance criteria in the master specification before delivering the release.

The release count checks declared topology IDs and electrical structure fingerprints. Renaming devices and sheets or rerouting the same connections does not qualify a copy as another project. Matching fingerprints are flagged for review because they do not prove graph equivalence.

The report flags sheets with identical visible editable content even if their IDs or object order differ. Hidden-only sheets count as empty. The check catches exact copies. Engineering review is still required to assess relevance and originality.

The library manifest records the 50 required project briefs and links published examples to the briefs they address. The release report shows which briefs lack a project and which have a qualifying project. Unmapped examples remain available in Project Explorer.
