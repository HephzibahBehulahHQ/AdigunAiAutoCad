# AdigunAiAutoCad
This is adigunAiAutoCad Project 

## Edit a circuit

Open **Symbol Library**, pick a component, then click its position on the sheet. The component stays selected and its editable values appear in **Properties**. Turn off **Snap** for unrestricted movement. Click a pin marker to attach a wire exactly there, or enable **Object Snap** to attach when clicking near a pin.

Use **Wire** to click two pin anchors or drag between them. In **Select** mode, select a wire to change its color or use **Reconnect start** / **Reconnect end** and click the new connection point. Press **Esc** to cancel a pending connection.


## Verified reference project increment

The opening set contains 100 authored sheets through A1/100, including the source-backed Siemens/SEW starter, IFM sensor and PLC examples, and PN2070 manufacturer reference records. The authored sheet adds no components or wires; the project retains 32 component instances, 335 routed wire segments, 67 sheet-local nets and 21 explicit cross-sheet connections with no unresolved open endpoints.  See `examples/real-projects/siemens-sew-star-delta-reference.adigun.json`.
