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


# IFM IFS204 inductive sensor to Siemens S7-1200 PLC input

Open `ifm-ifs204-siemens-s7-1200-sensor-input.adigun.json` from **Open project file**. The one-sheet wiring example uses the IFM IFS204 (manufacturer part IFB3004BBPKG/US-104), Siemens SIMATIC S7-1200 CPU 1212C DC/DC/DC (6ES7212-1AE40-0XB0), and two Phoenix Contact PT 16 N OG terminals as external 24 V DC supply boundaries.

The drawing connects sensor pin 1 (L+) to CPU sensor supply X10:4, pin 3 (L−) to X10:5, and pin 4 (PNP normally-open output) to digital input DI a.0 at X10:7. CPU input common 1M at X10:6 is tied to 0 V at X10:2. The component records preserve all 25 CPU X10/X11/X12 terminals and the sensor’s three populated M12 contacts. The example contains 10 orthogonal wire segments, five derived nets, and no dangling wire endpoints or geometry errors; unused CPU pins and the field sides of the two supply terminals remain intentionally open.

This is a sourced wiring drawing. It does not simulate target detection, sensor switching, PLC program logic, output loading or machine behavior. The two terminal blocks mark supply boundaries; no power supply or PLC program is included. Verify the installation, sensor suitability, input wiring, grounding and application safety against current manufacturer documentation and qualified engineering review before applying it to equipment.

## Manufacturer sources

- Siemens CPU 1212C product record: <https://mall.industry.siemens.com/mall/en/gb/Catalog/Product/6ES72121AE400XB0>
- Siemens S7-1200 System Manual V4.7, Tables A-49 and A-50: <https://cache.industry.siemens.com/dl/files/302/109977302/att_1307432/v1/s71200_system_manual_en-US.pdf>
- ifm IFS204 data sheet, EN-GB, 26.06.2025: <https://media.ifm.com/dam/546f88cf-4cdf-47ac-b6ee-bee685c33458/Original/IFS204-02_EN-GB.pdf>
- Phoenix Contact PT 16 N OG, item 3212144: <https://www.phoenixcontact.com/en-lt/products/feed-through-terminal-block-pt-16-n-og-3212144>
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

- Siemens S7-1200 System Manual V4.7, CPU 1212C DC/DC/DC terminal assignments, Tables A-49 and A-50: <https://cache.industry.siemens.com/dl/files/302/109977302/att_1307432/v1/s71200_system_manual_en-US.pdf>
- Siemens 3RV2011-0FA10 data sheet and SIRIUS 3RV equipment manual: <https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-0FA10> and <https://support.industry.siemens.com/cs/attachments/60279172/manual_SIRIUS_circuit_breaker_3RV_en-US.pdf>
- Schneider Electric LC1D09BD data sheet and product page: <https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF> and <https://www.se.com/us/en/product/LC1D09BD/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vdc-coil-open-style/>
- Schneider Electric XB5AA31 data sheet and XB5AA42 product data: <https://iportal.se.com/Contents/docs/SQD-XB5AA31_DATA%20SHEET.PDF> and <https://www.se.com/id/id/product/XB5AA42/red-flush-complete-pushbutton-%C3%B822-spring-return-1nc-unmarked/>
- SEW DRN63MS4 motor data and terminal diagram: <https://download.sew-eurodrive.com/download/pdf/30590116.pdf> and <https://download.sew-eurodrive.com/download/pdf/25957074.pdf>
- Phoenix Contact PT 16 N OG, item 3212144: <https://www.phoenixcontact.com/en-lt/products/feed-through-terminal-block-pt-16-n-og-3212144>


## Verified star-delta component library

The catalog includes Siemens SIRIUS 3RT2026-2KB40 contactor, 3RU2126-4AB0 thermal overload relay, 3RV2021-4AA10 motor-protection breaker, and 3RP2576-2NW30 star-delta timing relay, plus the SEW-EURODRIVE DRN132M4 motor. The records preserve source-backed manufacturer part numbers, external terminal identities, adjustable settings and ratings; internal switching, overload trip behavior and timer operation are not simulated. No complete star-delta wiring example is released until topology and route tests pass. Sources: [Siemens contactor](https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RT2026-2KB40), [Siemens overload relay](https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2126-4AB0), [Siemens motor-protection breaker](https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2021-4AA10), [Siemens timing relay](https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RP25762NW30), [SEW-EURODRIVE DRN operating data](https://download.sew-eurodrive.com/download/pdf/30590116.pdf).


## Source-backed star-delta starter example

`siemens-sew-star-delta-starter.adigun.json` is a saved, editable static project built from Siemens SIRIUS 3RV2021-4AA10, 3RT2026-2KB40 (three contactors), 3RU2126-4AB0, 3RP2576-2NW30, Schneider XB5 stop/start operators, Phoenix Contact 3212144 feed-through terminals, and the SEW-EURODRIVE DRN132M4 (7.5 kW, 15.2 A at 400 V / 50 Hz). Its 26 explicitly tested nets cover the three-phase feeder, six motor winding ends, PE, stop/start seal-in, overload trip contact and timer star/delta outputs with cross-interlocks. The Q1/F1 overload settings and K1 time are intentionally unset; protection coordination, suitability and switching behavior are not simulated. See the manufacturer source links above and verify application engineering before using a drawing for installation.


# 100-sheet star-delta reference project opening set

Open `siemens-sew-star-delta-reference.adigun.json` using **Open project file**. This is an honest twenty-one-sheet opening set for the planned 100-sheet reference project:
- A1/001 cover and project status
- A1/002 authored drawing index
- A1/003 source-backed component register derived from the model BOM
- A1/004 revision record
- A1/005 design assumptions and limitations
- A1/006 the existing Siemens/SEW connected star-delta schematic
- A1/007 the IFM IFS204 / Siemens S7-1200 sensor input example
- A1/008 the Siemens SITOP PSU100C supply boundary reference
- A1/009 the source-backed 24 V DC distribution terminals between the supply and PLC
- A1/010 the source-backed Siemens PLC output to Phoenix Contact relay interface
- A1/011 the PLC relay contact output to a source-backed Schneider Electric contactor coil
- A1/012 source-backed Schneider operator NO/NC contacts wired to Siemens PLC inputs DI a.1 and DI a.2
- A1/013 editable PLC I/O assignment schedule, including KM4 auxiliary status contact to DI a.3
- A1/014 source-backed KM4 NC auxiliary feedback wired to PLC DI a.4 and documented in the I/O schedule
- A1/015 source-backed K2 NC relay contact wired to PLC DI a.5 and documented in the I/O schedule
- A1/016 K2 NO output branch to PLC DI a.6 and the existing KM4 coil circuit
- A1/017 consolidated PLC I/O allocation summary; I0.7 is later assigned from F1:97–98 on A1/018
- A1/018 source-backed Siemens F1 NO trip signal 97–98 wired to CPU DI a.7 / I0.7
- A1/019 Siemens CPU 1212C digital-output allocation; Q0.0 drives K2 and Q0.1–Q0.5 are unassigned in the modeled scope
- A1/020 CPU 1212C analog-input allocation; AI0 / X11:2 is assigned to PN2070 B2 OUT2 on A1/022; AI1 / X11:3 remains unassigned
- A1/021 ifm PN2070 pressure-sensor interface proposal; A1/022 models B2 OUT2 to AI0 and B2 L− to CPU 2M / X15 0 V DC
- A1/023 PN2070 / CPU 1212C AI0 scaling reference; Siemens rated raw range and conditional formula, with device endpoints unassigned
- A1/024 PN2070 B2 current allocation versus the exact SITOP PSU100C rating, with total-load and supply-adequacy limits stated
- A1/025 a conditional partial sensor / CPU analog accuracy stack for a verified 0–400 bar span
- A1/026 a conditional idealized CPU 1212C 10-bit analog quantization reference for that span
- A1/027 the CPU 1212C input sample time and 95% step response by smoothing and rejection frequency
- A1/028 the CPU 1212C rated, overshoot and overflow data-word bands, with diagnostic behavior left unspecified
- A1/029 the Siemens CPU 1212C maximum analog cable length and shielded twisted-pair requirement, without assigning installed cable details
- A1/030 ifm PN2070 analog output parameter ranges, without assigning configured endpoints
- A1/031 ifm PN2070 pressure rating and burst-pressure reference, without assigning operating conditions
- A1/032 ifm PN2070 medium-temperature reference, without assigning process conditions
- A1/033 ifm PN2070 operating-voltage and current-consumption ratings, without claiming supply adequacy
- A1/034 ifm PN2070 power-on delay specification, without assigning startup or system response behavior
- A1/035 ifm PN2070 protection-class and reverse-polarity specifications, without claiming installation or safety performance
- A1/036 ifm PN2070 minimum insulation-resistance reference; no project test result is claimed
- A1/037 ifm PN2070 switching-output specifications, without assigning an output or load
- A1/038 ifm PN2070 CMPT=2 switching-point parameter ranges, without configuring thresholds; A1/039 CMPT=3 high-resolution ranges, without configuring thresholds

Every page has editable native drawing content. A1/006 contains the Siemens/SEW star-delta starter and its existing F1:95–96 NC contactor-control path; A1/018 adds only the separate F1:97–98 NO trip signal to the 24 V DC PLC circuit. A1/007 adds the PLC 1L output-group supply, DQ a.0 channel, and command-input routes. A1/008 documents the Siemens 6EP1332-5BA00 supply and sourced Phoenix Contact input/PE/output terminals. A1/009 routes X14/X15 between supply, PLC, relay, contactor and operator inputs. A1/010 uses CPU DQ a.0 to drive Phoenix Contact PLC-RSC-24DC/21 relay K2. A1/011 routes K2:14 to the source-backed Schneider LC1D09BD 24 V DC coil KM4 and returns A2 to 0 V. A1/012 routes Schneider XB5AA31 NO contact 13–14 to CPU DI a.1 and XB5AA42 NC contact 21–22 to DI a.2. A1/013–A1/016 record KM4 and K2 status inputs I0.3–I0.6. A1/017 summarizes I0.0–I0.6 and Q0.0; A1/018 routes Siemens SIRIUS 3RU2126-4AB0 F1 NO trip contact 97–98 to CPU 1212C X10:14 / DI a.7 / I0.7, powered from X14. A1/019 records the existing CPU 1212C X12 output allocation: Q0.0 / DQ a.0 drives K2 coil A1; Q0.1–Q0.5 are unassigned in this modeled scope, and X12:6 / 2L is a group common, not an output channel. A1/020 records the CPU analog inputs; X11:1 / 2M is the analog common, not a channel. A1/021 documents the ifm PN2070 interface and its 4–20 mA factory default. A1/022 models B2 OUT2 to AI0 / X11:2 and B2 L− to CPU 2M / X11:1 and X15 0 V DC. A1/023 records CPU AI0's 0–10 V / 0–27648 rated representation and a conditional relation using verified ASP2/AEP2 endpoints; no executable PLC scaling or pressure point is assigned. Configure and verify voltage mode and endpoints at the device before use. Siemens’ System Manual V4.7 specifies the CPU terminal map and scaling method. PLC logic, output switching, trip/reset behavior and alarm interpretation are not simulated. The thirty-nine-sheet project has 32 component instances, 335 wire segments, 67 sheet-local nets and 43 deterministic project-wide nets. Forty-seven sheet-local endpoints are paired by twenty-one explicit cross-sheet links, leaving zero unlinked wire endpoints. The overload setting remains unset; upstream AC, protection, total load current, protection coordination and supply suitability are not established. A1/024 compares B2 alone with SITOP ratings; it does not establish total load or supply adequacy. A1/025 conditionally stacks only the published PN2070 and CPU input accuracy contributions for an illustrative 0–400 bar span; it is not a complete uncertainty budget or configured result. A1/026 derives an ideal 10-bit AI0 quantization interval only; it is not measured or guaranteed performance. A1/027 records CPU response specifications by smoothing/rejection setting without selecting a configuration or claiming system response. A1/028 records the CPU rated, overshoot and overflow code bands without assigning sensor-fault or diagnostic behavior. A1/029 records Siemens’ manufacturer cable limit without assigning installed cable details. A1/030 records ifm PN2070 analog output options without assigning configured endpoint pairs. A1/031 records PN2070 manufacturer pressure limits without assigning operating conditions. A1/032 records PN2070 medium-temperature limits without assigning process conditions. A1/040–A1/100 remain unauthored. The static project is not construction-ready.

Component source records: [Siemens SITOP PSU100C 6EP1332-5BA00](../../docs/components/siemens-sitop-psu100c-6ep1332-5ba00.md), [Phoenix Contact PT 16 N-PE 3212147](../../docs/components/phoenix-contact-pt-16-n-pe-3212147.md), [Phoenix Contact PLC-RSC-24DC/21 2966171](../../docs/components/phoenix-contact-2966171.md), [Schneider Electric LC1D09BD](../../docs/components/schneider-electric-lc1d09bd.md), [Siemens CPU 1212C](../../docs/components/siemens-s7-1200-cpu-1212c.md), [Siemens SIRIUS 3RU2126-4AB0 overload relay](../../docs/components/siemens-3ru2126-4ab0.md), and [ifm PN2070](../../docs/components/ifm-pn2070.md). The Siemens CPU record also documents A1/026's idealized AI0 resolution reference, A1/027's source-published input response options, and A1/028's rated/overshoot/overflow code ranges and A1/029's maximum cable length and A1/030's PN2070 analog output ranges. Manufacturer records document terminal identities, ratings and stated behaviors; the contactor coil consumption source is Schneider Electric FAQ FA33405. Coil switching, total supply load and protection are not simulated or assessed.



For A1/008, the PT 16 N-PE endpoints labeled 1 and 2 are model-local indexes; Phoenix Contact confirms two connections but does not assign those numbers.

