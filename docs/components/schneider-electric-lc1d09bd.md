# Schneider Electric LC1D09BD contactor

## Manufacturer evidence

- Manufacturer: Schneider Electric
- Product: TeSys D contactor LC1D09BD
- Official product data sheet: <https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF>
- Official product page: <https://www.se.com/us/en/product/LC1D09BD/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vdc-coil-open-style/>
- The data sheet wiring diagram identifies coil terminals A1/A2, main terminals 1/L1, 3/L2, 5/L3 and 2/T1, 4/T2, 6/T3, plus auxiliary 13/14 (NO) and 21/22 (NC).
- The manufacturer lists a 24 V DC coil with built-in bidirectional peak-limiting diode suppressor, three NO main poles, 1 mechanically linked NO + 1 mechanically linked NC auxiliary contact, 9 A AC-3 at up to 440 V AC, 45 × 77 × 95 mm body dimensions, and mounting on rail or plate.
- The manufacturer data sheet specifies 1.7 N·m tightening torque for power and control screw-clamp terminals, using a flat Ø6 mm or Philips No. 2 screwdriver. This is catalog data, not an installed termination or torque-inspection record.
- The published data sheet identifies IEC 60947-4-1, IEC 60947-5-1 and UL 508 standards. Those product references are not a certification or suitability determination for a particular project.

## CAD representation

- Twelve exposed schematic terminals are modeled with the manufacturer's terminal designations; they remain distinct external endpoints for wire snapping, connectivity analysis and project save/reopen.
- Three main NO poles, one auxiliary NO contact and one auxiliary NC contact are represented separately. `internalConnections` is empty so the static net engine never invents a closed contact or joins circuits based on an assumed coil state.
- Reference prefix is `KM`; instance fields for terminal strip, position, marking and comment are editable. Manufacturer identity and ratings remain read-only and source-linked.
- The drawing is a schematic symbol, not a physical footprint. Body dimensions and mounting support are recorded from the data sheet; actual panel-footprint geometry and contactor actuation simulation are not implemented in this milestone.
- Product ratings are reference data only. Do not treat this symbol, static connectivity, or project as a construction/safety approval; validate a selected product and application against current manufacturer documentation and qualified engineering review.

## Coil consumption source

- Schneider Electric [FAQ FA33405](https://www.se.com/es/es/faqs/FA33405/), modified 2025-04-09, lists average coil consumption of 2.4 W at 20 °C and nominal control voltage for the low-consumption LC1D09–LC1D38 contactors. For LC1D09BD at 24 V DC, 2.4 W / 24 V = 0.10 A (100 mA).
- This is a source-backed nominal reference value. It does not model pickup/transient behavior or establish supply, relay, protection, wiring, or application suitability.


## Manufacturer terminal conductor options

The official data sheet lists these screw-clamp combinations. Cable count, stiffness, cable-end condition and cross-section are product connection limits; they do not select conductors for this project.

| Circuit | Cables | Stiffness | Cable end | Cross-section |
| --- | ---: | --- | --- | ---: |
| power | 1 | flexible | with cable end | 1–4 mm² |
| power | 1 | flexible | without cable end | 1–4 mm² |
| power | 2 | flexible | without cable end | 1–4 mm² |
| power | 2 | flexible | with cable end | 1–2.5 mm² |
| power | 1 | solid | without cable end | 1–4 mm² |
| power | 2 | solid | without cable end | 1–4 mm² |
| control | 2 | flexible | with cable end | 1–2.5 mm² |
| control | 1 | flexible | without cable end | 1–4 mm² |
| control | 2 | flexible | without cable end | 1–4 mm² |
| control | 1 | flexible | with cable end | 1–4 mm² |
| control | 1 | solid | without cable end | 1–4 mm² |
| control | 2 | solid | without cable end | 1–4 mm² |

Source: [Schneider Electric LC1D09BD data sheet](https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF). Actual conductor selection, preparation and installation remain application-specific and are not modeled.
