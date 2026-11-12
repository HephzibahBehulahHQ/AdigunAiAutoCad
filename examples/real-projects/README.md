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


# Siemens 3RM12 reversing starter and SEW DRN63MS4 motor

Open `siemens-3rm12-reversing-starter.adigun.json` from **Open project file**. The one-sheet model uses one Siemens SIRIUS 3RM1201-1AA04 starter, one SEW-EURODRIVE DRN63MS4 motor, and thirteen Phoenix Contact PT 16 N OG terminals. It contains 33 orthogonal wire segments and 17 isolated nets. All seven motor terminals are represented; U2/V2/W2 form an explicit star link while each winding remains a separate external terminal.

- SEW motor data, DRN63MS4, 400 V / 50 Hz / 4-pole: <https://download.sew-eurodrive.com/download/pdf/30590116.pdf>
- SEW terminal identification and star connection manual: <https://download.sew-eurodrive.com/download/pdf/25957074.pdf>
- Siemens starter catalog: <https://mall.industry.siemens.com/mall/en/en/Catalog/Product/?mlfb=3RM1201-1AA04>

The sourced motor table gives 0.12 kW, 0.405 A, 1380 rpm, 0.83 Nm and power factor 0.64 at 400 V / 50 Hz. Siemens publishes a maximum 0.12 kW motor rating and a 0.1–0.5 A adjustment range. These nameplate/catalog values fit the published rating envelope; this is not a protection coordination, application suitability or construction approval. Motor performance, starter switching, protection, safety and load behavior are not simulated. NOT FOR CONSTRUCTION without application-specific engineering review.


# Siemens SIRIUS 3RV2011-1JA10 motor-protection breaker

The component catalog includes the Siemens SIRIUS 3RV2011-1JA10 as a source-backed three-pole motor-protection breaker with six independent external terminals, line-side 1/L1, 3/L2, 5/L3 and load-side 2/T1, 4/T2, 6/T3. The editable overload setting is optional until an engineer supplies an application-specific value; any entered value is range-checked against the manufacturer's 7–10 A adjustment range.

- Siemens 3RV2011-1JA10 product data sheet: <https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-1JA10>
- Siemens SIRIUS 3RV motor-starter-protector equipment manual: <https://support.industry.siemens.com/cs/attachments/60279172/manual_SIRIUS_circuit_breaker_3RV_en-US.pdf>

This part is not inserted into the DRN63MS4 motor example: its 7–10 A setting range does not match the motor's documented 0.405 A rated current. The CAD model does not simulate contact state, trip behavior, fault interruption, selection or coordination. Use manufacturer data and qualified application review before selecting protection; NOT FOR CONSTRUCTION.


# Siemens SIRIUS 3RV2011-0FA10 low-current motor-protection breaker

The catalog also includes the SIRIUS 3RV2011-0FA10, a size S00, Class 10, three-pole breaker with the same six externally connectable terminal identities documented for the 3RV2 family: 1/L1, 3/L2, 5/L3 and 2/T1, 4/T2, 6/T3. Its manufacturer-published overload adjustment range is 0.35–0.5 A, its instantaneous magnetic release is 6.5 A, and its published 400 V motor power is 0.12 kW. The SEW DRN63MS4 motor data records 0.405 A and 0.12 kW at 400 V / 50 Hz, so these catalog/nameplate values overlap. This ratings-envelope comparison does not select a setting or establish application suitability, short-circuit coordination, conductor sizing or construction approval.

- Siemens 3RV2011-0FA10 product data sheet: <https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10>
- Siemens SIRIUS 3RV motor-starter-protector equipment manual: <https://support.industry.siemens.com/cs/attachments/60279172/manual_SIRIUS_circuit_breaker_3RV_en-US.pdf>
- SEW DRN63MS4 motor data: <https://download.sew-eurodrive.com/download/pdf/30590116.pdf>

The DOL motor-feeder example below uses this variant. Its range overlaps the motor's catalog current, but that alone does not select an overload setting or establish application suitability. The CAD model does not simulate contact state, trip behavior, fault interruption or coordination. NOT FOR CONSTRUCTION without qualified engineering review.


# DOL motor feeder — Siemens, Schneider Electric and SEW-EURODRIVE

Open `siemens-schneider-sew-dol-starter.adigun.json` from the workstation's **Open project file** command. This one-sheet example contains a Siemens 3RV2011-0FA10 three-pole motor-protection breaker, Schneider Electric LC1D09BD 24 V DC contactor, XB5AA42 stop push-button (NC, 21–22), XB5AA31 start push-button (NO, 13–14), a SEW DRN63MS4 three-phase motor, and six Phoenix Contact PT 16 N OG feed-through terminals.

The drawing wires incoming L1/L2/L3 through Q1 and KM1 to motor U1/V1/W1, the U2/V2/W2 star point, PE, the KM1 coil, and the stop/start holding circuit. S1 NO and KM1 auxiliary NO 13–14 share parallel control branches after S0 NC; coil A2 returns to the external 0 V terminal. KM1 auxiliary NC 21–22 remains a real, separately connectable contact pair and is intentionally unused in this circuit. Terminal blocks mark the external supply boundaries; their open field-side pins are intentional. The 0.35–0.5 A breaker setting is deliberately unset.

The engine derives 15 nets, the 38-wire list and BOM from editable component instances and orthogonal wire routes. The static CAD model documents button and contactor behavior but does not simulate button actuation, contactor coil operation, overload trips, short-circuit interruption, protection coordination or installation suitability. The rating overlap alone does not choose a setting or establish engineering approval. NOT FOR CONSTRUCTION without qualified application review.

## Manufacturer sources

- Siemens 3RV2011-0FA10 data sheet and SIRIUS 3RV equipment manual: <https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10> and <https://support.industry.siemens.com/cs/attachments/60279172/manual_SIRIUS_circuit_breaker_3RV_en-US.pdf>
- Schneider Electric LC1D09BD data sheet and product page: <https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF> and <https://www.se.com/us/en/product/LC1D09BD/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vdc-coil-open-style/>
- Schneider Electric XB5AA31 data sheet and XB5AA42 product data: <https://iportal.se.com/Contents/docs/SQD-XB5AA31_DATA%20SHEET.PDF> and <https://www.se.com/id/id/product/XB5AA42/red-flush-complete-pushbutton-%C3%B822-spring-return-1nc-unmarked/>
- SEW DRN63MS4 motor data and terminal diagram: <https://download.sew-eurodrive.com/download/pdf/30590116.pdf> and <https://download.sew-eurodrive.com/download/pdf/25957074.pdf>
- Phoenix Contact PT 16 N OG, item 3212144: <https://www.phoenixcontact.com/en-lt/products/feed-through-terminal-block-pt-16-n-og-3212144>
