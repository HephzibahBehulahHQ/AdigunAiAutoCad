# AdigunAiAutoCad
This is adigunAiAutoCad Project 

## Edit a circuit

The drafting viewport fills the workspace. Model coordinates use positive X to the right and positive Y downward, with negative coordinates available. New sheets start with the print frame hidden. Use **Toggle print frame**, **Fit print frame**, **Fit selection**, or **Go to origin** in the command palette. **Fit drawing to view** includes visible off-frame objects. Pan with middle-button drag or Space + drag, and use the wheel to zoom around the pointer.

In **Drafting settings**, change the display grid and snap intervals independently. Select inches or millimetres for the ruler and cursor readout. Drag from the top ruler for a horizontal guide or from the left ruler for a vertical guide. The Guides controls let you enter exact positions, lock, hide, or delete guides. Guides save with the sheet and stay out of drawing exports.

Use **Export full drawing as SVG** for all visible geometry, including off-frame objects. **Export print frame as SVG** and **Print drawing** use the configured paper size and warn before clipping off-frame geometry.

Open **Symbol Library**, pick a component, then click its position on the sheet. The component stays selected and its editable values appear in **Properties**. Turn off **Snap** for unrestricted movement. Click a pin marker to attach a wire exactly there, or enable **Object Snap** to attach when clicking near a pin.

Use **Wire** to click two pin anchors for an automatic orthogonal route. To draw your own route, click the first pin, click the sheet wherever you want to add bends, then click the destination pin. Press **Enter** to finish a manual route with an open end, or **Esc** to cancel. In **Select** mode, select a wire to change its color or use **Reconnect start** / **Reconnect end**. Moving either component keeps its wire endpoint attached and leaves the manual bends in place.

Drag a selected catalog symbol's corner handle or edit **Symbol scale** in Properties to resize it proportionally. Attached wires follow the pins, and the editor rejects edits that introduce a component overlap. The manufacturer's dimensions remain available separately in Properties.

Click the handle above a selected symbol to rotate it one quarter turn, or set **Rotation** in Properties. Attached wires follow the rotated pins.

To join circuits across sheets, draw a wire with one free end on each sheet. Open **Electrical checks** on either sheet, select both ends under **Connect wire ends across sheets**, and name the connection. The resulting arrows open the corresponding sheets. Use **Remove link** under **Cross-sheet links on this sheet** to free the endpoints for reconnecting. Undo restores the link.

Drawing Undo and Redo follow edit order across sheet navigation and reopen the sheet containing the affected edit. Deleting a sheet clears drawing history.

In **Electrical checks**, use **Export device index CSV** for component references and part numbers across the project, or **Export sheet index CSV** for sheet order, titles, paper formats, scales, and revisions.

**Open** accepts ASCII DXF model-space lines, circles, and straight polylines as editable drawing geometry in a new project. The import converts supported drawing units to millimetres, treats unitless coordinates as millimetres, and preserves the original layer name on each imported entity. Blocks, arcs, bulged polylines, and other unsupported entities are listed when skipped. Use native project JSON to save the imported drawing. DXF geometry has no electrical part or net identities.

The browser bundles [dxf-parser 1.1.2](https://github.com/gdsestimating/dxf-parser) from its pinned npm tarball. The [parser license](vendor/dxf-parser-LICENSE.txt) and [bundled loglevel license](vendor/loglevel-LICENSE.txt) are included.

In the command palette, **Export current sheet as DXF** writes visible lines, circles, and line segments from wires, rectangles and freehand paths in millimetres. The command reports skipped entities, including component symbols, text and unsupported shapes. Use native project JSON for electrical connectivity, sheet structure and drawing styles. The export uses [DXF Writer 2.8.9](https://github.com/dxfjs/writer) under its [MIT license](vendor/dxf-writer-LICENSE.txt).

Use **Print project set** in the command palette to print every sheet in project order. Choose **Save as PDF** in the browser print dialog for a single project PDF.


## Verified reference project increment

The opening set contains 100 authored sheets through A1/100, including the source-backed Siemens/SEW starter, IFM sensor and PLC examples, and PN2070 manufacturer reference records. The authored sheet adds no components or wires; the project retains 38 component instances, 348 routed wire segments, 73 sheet-local nets and 27 explicit cross-sheet connections with no unresolved open endpoints.  See `examples/real-projects/siemens-sew-star-delta-reference.adigun.json`.

## Deployment and release

After an online visit, supported browsers can reload the editor offline. Project Explorer keeps previously opened examples on this device so you can open and save an independent drawing without a network connection.

The GitHub Pages workflow checks the committed example report and publishes the editor, native example files, and validation report. Before client release, run `node scripts/project-library-validation.js --check --require-release-scale` and verify the remaining acceptance criteria in the master specification.
