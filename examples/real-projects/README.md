# 24 V DC relay-operated contactor coil

Open `24v-relay-contactor-control.adigun.json` from the workstation's **Open project file** command.

This is a one-sheet, source-backed wiring example using five verified component instances: one Phoenix Contact PLC interface relay, one Schneider Electric TeSys D contactor, and three Phoenix Contact PT 16 N OG feed-through terminals. It contains 13 orthogonal wire segments and four pin/net groups. The project JSON is validated against the CAD engine's schema; its BOM and wire list are derived from the same component and wire instances.

## Intended circuit

- X1 is the external PLC Q0.0 output boundary and feeds K1 coil A1; K1 coil A2 returns through X3.
- X2 is the external +24 V DC feed to K1 common terminal 11.
- K1 normally-open contact 14 feeds KM1 coil A1; KM1 coil A2 returns through X3.
- X1–X3 are feed-through terminals. Their two connection pins are internally connected in the part model.
- The model shows static relay contacts. It does not simulate relay actuation, prove a PLC output's suitability, or model an upstream 24 V supply.

## Verified source records

- Phoenix Contact PLC-RSC- 24DC/21, item 2966171: <https://www.phoenixcontact.com/en-pc/products/relay-module-plc-rsc-24dc-21-2966171?type=pdf>
- Phoenix Contact PT 16 N OG, item 3212144: <https://www.phoenixcontact.com/en-lt/products/feed-through-terminal-block-pt-16-n-og-3212144>
- Schneider Electric TeSys D LC1D09BD: <https://www.se.com/us/en/product/LC1D09BD/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vdc-coil-open-style/> and <https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF>

## Scope and review

This is a control-wiring example, not a complete motor starter or construction package. It intentionally omits mains switching, motor, upstream protection, conductor sizing, panel layout, relay-state simulation and safety coordination. Verify the component variants, supply, external PLC interface and application limits against current manufacturer documentation and qualified engineering review before adapting it.


# Siemens SIRIUS 3RM12 reversing starter

Open `siemens-3rm12-reversing-starter.adigun.json` from the workstation's **Open project file** command. This one-sheet example uses one source-backed Siemens reversing starter and fifteen Phoenix Contact PT 16 N OG feed-through terminals as explicit line-side, motor-side and control/signal boundaries. Its schematic wires connect all fifteen manufacturer-designated 3RM1 pins to those terminal blocks. The CAD model derives the BOM and wire list from those instances and routes.

- Siemens 3RM1201-1AA04 product catalog: <https://mall.industry.siemens.com/mall/en/en/Catalog/Product/?mlfb=3RM1201-1AA04>
- Siemens SIRIUS 3RM1 Equipment Manual, 09/2024: <https://cache.industry.siemens.com/dl/files/730/66295730/att_919653/v3/manual_motorstarter_SIRIUS_3RM1_en-US.pdf>
- Phoenix Contact PT 16 N OG, item 3212144: <https://www.phoenixcontact.com/en-lt/products/feed-through-terminal-block-pt-16-n-og-3212144>

The project records line terminals 1/L1, 3/L2, 5/L3; motor terminals 2/T1, 4/T2, 6/T3; control terminals A1, A2, IN1–IN3; 24 V DC run output OUT; and fault signaling terminals 95, 96, 98. It models wiring only. It does not include a motor or upstream protection, select conductor size, verify application suitability, simulate direction switching/protective trips/signal contacts, or provide a construction package. Siemens rates 3RM1201-1AA04 at 0.1–0.5 A and a maximum motor power of 0.12 kW at 400 V AC; confirm motor/application fit before use. NOT FOR CONSTRUCTION without qualified engineering review.
