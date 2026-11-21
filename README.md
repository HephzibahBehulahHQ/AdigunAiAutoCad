# AdigunAiAutoCad
This is adigunAiAutoCad Project 

## Edit a circuit

Open **Symbol Library**, pick a component, then click its position on the sheet. The component stays selected and its editable values appear in **Properties**. Turn off **Snap** for unrestricted movement. Click a pin marker to attach a wire exactly there, or enable **Object Snap** to attach when clicking near a pin.

Use **Wire** to click two pin anchors or drag between them. In **Select** mode, select a wire to change its color or use **Reconnect start** / **Reconnect end** and click the new connection point. Press **Esc** to cancel a pending connection.

To join circuits across sheets, draw a wire with one free end on each sheet. Open **Electrical checks** on either sheet, select both ends under **Connect wire ends across sheets**, and name the connection. The resulting arrows open the corresponding sheets. Use **Remove link** under **Cross-sheet links on this sheet** to free the endpoints for reconnecting. Undo restores the link.


## Verified reference project increment

The opening set contains 100 authored sheets through A1/100, including the source-backed Siemens/SEW starter, IFM sensor and PLC examples, and PN2070 manufacturer reference records. The authored sheet adds no components or wires; the project retains 32 component instances, 335 routed wire segments, 67 sheet-local nets and 21 explicit cross-sheet connections with no unresolved open endpoints.  See `examples/real-projects/siemens-sew-star-delta-reference.adigun.json`.

## Deployment and release

The GitHub Pages workflow checks the committed example report and publishes the editor, native example files, and validation report. Before client release, run `node scripts/project-library-validation.js --check --require-release-scale` and verify the remaining acceptance criteria in the master specification.
