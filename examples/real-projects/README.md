# Open an example as your own editable project

Choose a numbered project in **Project Explorer → List** to open an independent editable copy. AdigunAiAutoCad preserves its native sheet structure and editor objects instead of flattening the drawing. Editing the copy does not change the catalog file. Components and wires retain their identities, instance settings, geometry, colors, and connections. Manufacturer records stay separate from project-specific values. **New Project** contains the blank A1–A4 engineering template; add sheets from each section's + button.

Use **Save project locally** to download the `.adigun.json` project under its project name. Use **Open project file** to reopen that saved file and continue editing. SVG imports are read-only artwork and are not editable example projects.

**Bill of materials → Export CSV** includes verified components from every project sheet. **Electrical checks → Export wire list CSV** includes wires from every project sheet and follows explicit cross-sheet connections.

**Electrical checks → Export terminal list CSV** lists each modeled terminal pin with its sheet, strip and position fields, marking, part number, and other pins on the same project net. **Export PLC I/O list CSV** lists the verified CPU hardware channels and their wired net members. Hardware channel names come from the catalog. Configured PLC memory addresses are outside the export.

Select a wire to edit its **Cable ID** and **Core ID** in Properties. **Electrical checks → Export cable schedule CSV** lists the assigned wire segments and their net pin references. The SITOP example assigns W-B1 and W-B2 to the modeled sensor conductors. These assignments document the schematic and leave cable procurement and installed route lengths open.

# 24 V DC relay-operated contactor coil

Open this project as an editable copy from **Project Explorer → List**.

This 72-sheet reference includes wiring, net and wire schedules, continuity diagrams, editable terminal and device layouts, and catalog-backed operating, mounting and termination references. Its four verified parts and 15 orthogonal wire segments form four project-wide nets. Three native cross-sheet connections link the coil schematic on A2/001 to the X3 return on A2/004 and the separate X1 supply and PLC command on A2/015. The BOM and wire list are derived from the editable objects.

## Intended circuit

- X1 level 1 carries the external +24 V DC feed to K1 common terminal 11.
- X1 level 2 carries the external PLC Q0.0 output to K1 coil A1. K1 coil A2 returns through X3.
- K1 normally-open contact 14 feeds KM1 coil A1; KM1 coil A2 returns through X3.
- X1's two levels stay electrically separate. The two pins on each level connect to each other. X3 provides a single return level.
- The model shows static relay contacts. It does not simulate relay actuation, prove a PLC output's suitability, or model an upstream 24 V supply.

## Verified source records

- Phoenix Contact PLC-RSC- 24DC/21, item 2966171: <https://www.phoenixcontact.com/en-pc/products/relay-module-plc-rsc-24dc-21-2966171?type=pdf>
- Phoenix Contact PTTB 2,5, item 3210567: <https://www.phoenixcontact.com/en-us/products/multi-level-terminal-block-pttb-25-3210567>
- Phoenix Contact PT 2,5, item 3209510: <https://www.phoenixcontact.com/en-pc/products/feed-through-terminal-block-pt-25-3209510>


# IFM IFS204 inductive sensor to Siemens S7-1200 PLC input

Open this project as an editable copy from **Project Explorer → List**. The one-sheet wiring example uses the IFM IFS204 (manufacturer part IFB3004BBPKG/US-104), Siemens SIMATIC S7-1200 CPU 1212C DC/DC/DC (6ES7212-1AE40-0XB0), and two Phoenix Contact PT 16 N OG terminals as external 24 V DC supply boundaries.

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

Open this project as an editable copy from **Project Explorer → List**. The 100-sheet reference includes the original wiring, net and wire schedules, component and manufacturer registers, terminal interface sheets, an editable XT1 rail view, derived continuity diagrams, and open installation and handover checks. The wiring model uses one Siemens SIRIUS 3RM1201-1AA04 starter, one SEW-EURODRIVE DRN63MS4 motor, and thirteen Phoenix Contact PT 16 N OG terminals. It contains 33 orthogonal wire segments and 17 isolated nets. All seven motor terminals are represented; U2/V2/W2 form an explicit star link while each winding remains a separate external terminal.

- SEW motor data, DRN63MS4, 400 V / 50 Hz / 4-pole: <https://download.sew-eurodrive.com/download/pdf/30590116.pdf>
- SEW terminal identification and star connection manual: <https://download.sew-eurodrive.com/download/pdf/25957074.pdf>
- Siemens starter catalog: <https://mall.industry.siemens.com/mall/en/en/Catalog/Product/?mlfb=3RM1201-1AA04>
- Siemens article data sheet, July 2022 archive: <https://media.distributordatasolutions.com/siemenscomplete/2022q3/documents/e26eb7bdd5b6d456ac5fe570ec1c4bab0788cfde.pdf>
- Siemens article data sheet, 16 December 2025 (manufacturer PDF hosted by Mouser): <https://www.mouser.com/datasheet/3/5917/4/3RM12011AA04_datasheet_en.pdf>

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

Open this project as an editable copy from **Project Explorer → List**. This one-sheet example contains a Siemens 3RV2011-0FA10 three-pole motor-protection breaker, Schneider Electric LC1D09BD 24 V DC contactor, XB5AA42 stop push-button (NC, 21–22), XB5AA31 start push-button (NO, 13–14), a SEW DRN63MS4 three-phase motor, and six Phoenix Contact PT 16 N OG feed-through terminals.

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

The project opens with its electrical circuit in A2 and a separate editable A3/001 panel-front layout. Component front dimensions and Q1's 400 V clearance requirements come from the linked Siemens data sheets; the 500 × 400 mm backplate, rail positions, terminal arrangement and component placement are explicitly preliminary project assumptions. S0/S1 door locations remain unassigned and M1 remains external. The layout is diagrammatic, does not duplicate electrical BOM entries and is not construction-ready.


# 100-sheet star-delta reference project opening set

Open this project as an editable copy from **Project Explorer → List**. This is an honest sixty-nine-sheet opening set for the planned 100-sheet reference project:
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
- A1/038 ifm PN2070 CMPT=2 switching-point parameter ranges, without configuring thresholds; A1/039 CMPT=3 high-resolution ranges, without configuring thresholds; A1/040 PN2070 tightening-torque recommendation and dependencies, without assigning an installed value; A1/041 ambient and storage temperature ratings, without assigning site conditions; A1/042 minimum pressure cycles, without inferring project service life; A1/043 PN2070 dimensions and weight, without assigning installation geometry; A1/044 integrated-restrictor product datum, without assigning a retrofit; A1/045 product IP ratings, without claiming assembly protection; A1/046 manufacturer shock/vibration values, without assigning application suitability; A1/047 wetted-parts material identifier, without assigning chemical compatibility; A1/048 overall materials list, without assigning part locations; A1/049 M12 connector specification, without selecting cable hardware; A1/050–A1/055 manufacturer display, process connection, housing rotation, programming button, pressure type and vacuum resistance references; A1/056 PN2070 PNP/NPN switching output designs and configurable NO/NC function, without selecting project settings; A1/057 short-circuit and overload protection specifications without claiming project protection performance; A1/058 maximum analogue-output response time without assigning damping or system response; A1/059 analogue-output damping parameter range without selecting a device setting; A1/060 process-value damping range without selecting a sensor setting; A1/061 programmable delay range without selecting a delay; A1/062 manufacturer response-time rating without assigning system behavior; A1/063 CMPT=2 IO-Link minimum process cycle time without assigning a device or master configuration; A1/064 CMPT=3 minimum process cycle time without assigning a device profile or master cycle; A1/065 CMPT=2 IO-Link pressure resolution without assigning device mode; A1/066 CMPT=3 IO-Link pressure resolution without assigning device mode; A1/067 CMPT=2 cyclical pressure field width without assigning a decoded payload; A1/068 CMPT=3 cyclical pressure field width without assigning a decoded payload; A1/069 CMPT=3 device status field width without defining diagnostic codes

Every page has editable native drawing content. A1/006 contains the Siemens/SEW star-delta starter and its existing F1:95–96 NC contactor-control path; A1/018 adds only the separate F1:97–98 NO trip signal to the 24 V DC PLC circuit. A1/007 adds the PLC 1L output-group supply, DQ a.0 channel, and command-input routes. A1/008 documents the Siemens 6EP1332-5BA00 supply and sourced Phoenix Contact input/PE/output terminals. A1/009 routes X14/X15 between supply, PLC, relay, contactor and operator inputs. A1/010 uses CPU DQ a.0 to drive Phoenix Contact PLC-RSC-24DC/21 relay K2. A1/011 routes K2:14 to the source-backed Schneider LC1D09BD 24 V DC coil KM4 and returns A2 to 0 V. A1/012 routes Schneider XB5AA31 NO contact 13–14 to CPU DI a.1 and XB5AA42 NC contact 21–22 to DI a.2. A1/013–A1/016 record KM4 and K2 status inputs I0.3–I0.6. A1/017 summarizes I0.0–I0.6 and Q0.0; A1/018 routes Siemens SIRIUS 3RU2126-4AB0 F1 NO trip contact 97–98 to CPU 1212C X10:14 / DI a.7 / I0.7, powered from X14. A1/019 records the existing CPU 1212C X12 output allocation: Q0.0 / DQ a.0 drives K2 coil A1; Q0.1–Q0.5 are unassigned in this modeled scope, and X12:6 / 2L is a group common, not an output channel. A1/020 records the CPU analog inputs; X11:1 / 2M is the analog common, not a channel. A1/021 documents the ifm PN2070 interface and its 4–20 mA factory default. A1/022 models B2 OUT2 to AI0 / X11:2 and B2 L− to CPU 2M / X11:1 and X15 0 V DC. A1/023 records CPU AI0's 0–10 V / 0–27648 rated representation and a conditional relation using verified ASP2/AEP2 endpoints; no executable PLC scaling or pressure point is assigned. Configure and verify voltage mode and endpoints at the device before use. Siemens’ System Manual V4.7 specifies the CPU terminal map and scaling method. PLC logic, output switching, trip/reset behavior and alarm interpretation are not simulated. The completed A1/100 project has 32 component instances, 335 wire segments, 67 sheet-local nets and 43 deterministic project-wide nets. Forty-seven sheet-local endpoints are paired by twenty-one explicit cross-sheet links, leaving zero unlinked wire endpoints. The overload setting remains unset; upstream AC, protection, total load current, protection coordination and supply suitability are not established. A1/024 compares B2 alone with SITOP ratings; it does not establish total load or supply adequacy. A1/025 conditionally stacks only the published PN2070 and CPU input accuracy contributions for an illustrative 0–400 bar span; it is not a complete uncertainty budget or configured result. A1/026 derives an ideal 10-bit AI0 quantization interval only; it is not measured or guaranteed performance. A1/027 records CPU response specifications by smoothing/rejection setting without selecting a configuration or claiming system response. A1/028 records the CPU rated, overshoot and overflow code bands without assigning sensor-fault or diagnostic behavior. A1/029 records Siemens’ manufacturer cable limit without assigning installed cable details. A1/030 records ifm PN2070 analog output options without assigning configured endpoint pairs. A1/031 records PN2070 manufacturer pressure limits without assigning operating conditions. A1/032 records PN2070 medium-temperature limits without assigning process conditions. A1/050–A1/069 add only manufacturer display, mechanical/process connection, output, protection, response, delay, IO-Link and process-data references; the PN2070 configured mode, project operating conditions and system response remain unassigned. A1/070–A1/100 contain authored manufacturer-reference content; the current validation report confirms 100/100 authored sheets and zero empty sheets. The static project is not construction-ready.

Component source records: [Siemens SITOP PSU100C 6EP1332-5BA00](../../docs/components/siemens-sitop-psu100c-6ep1332-5ba00.md), [Phoenix Contact PT 16 N-PE 3212147](../../docs/components/phoenix-contact-pt-16-n-pe-3212147.md), [Phoenix Contact PLC-RSC-24DC/21 2966171](../../docs/components/phoenix-contact-2966171.md), [Schneider Electric LC1D09BD](../../docs/components/schneider-electric-lc1d09bd.md), [Siemens CPU 1212C](../../docs/components/siemens-s7-1200-cpu-1212c.md), [Siemens SIRIUS 3RU2126-4AB0 overload relay](../../docs/components/siemens-3ru2126-4ab0.md), and [ifm PN2070](../../docs/components/ifm-pn2070.md). The Siemens CPU record also documents A1/026's idealized AI0 resolution reference, A1/027's source-published input response options, and A1/028's rated/overshoot/overflow code ranges and A1/029's maximum cable length and A1/030's PN2070 analog output ranges. Manufacturer records document terminal identities, ratings and stated behaviors; the contactor coil consumption source is Schneider Electric FAQ FA33405. Coil switching, total supply load and protection are not simulated or assessed.



For A1/008, the PT 16 N-PE endpoints labeled 1 and 2 are model-local indexes; Phoenix Contact confirms two connections but does not assign those numbers.


For A1/070, the PN2070-02 CMPT=3 cyclical binary switching information field is 2 bits; this records field width only and assigns no state-code meanings or project output configuration.

For A1/071, ifm lists DeviceID 638 for Status_B High Resolution / CMPT=3; this manufacturer association does not establish the installed device configuration.

For A1/072, ifm lists DeviceID 459 for Factory setting / CMPT=2; this manufacturer association does not establish the installed device configuration.

For A1/073, the ifm PN2070-02 profile table lists Smart Sensor - SSP 0 Generic Profiled Sensor under Factory setting / CMPT=2; this does not assert an active device configuration.

For A1/074, the ifm PN2070-02 profile table lists Smart Sensor - SSP 3.1 Measuring Sensor under Status_B High Resolution / CMPT=3; this does not assert an active device configuration.

For A1/075, the ifm PN2070-02 profile table lists Common - I&D Identification and Diagnosis under Status_B High Resolution / CMPT=3; this does not imply actual diagnosis data or master configuration.

For A1/076, the ifm PN2070-02 IO-Link table lists an acyclical application-specific tag function for Factory setting / CMPT=2; no configured tag value or active profile is asserted.

For A1/077, the ifm PN2070-02 IO-Link table lists an acyclical application-specific tag function for Status_B High Resolution / CMPT=3; no configured tag value or active profile is asserted.

For A1/078, ifm lists PN2070 IO-Link master port type A, or type B when pin 2 is not connected; the project wiring and selected master port are not assigned.

For A1/079, the ifm PN2070-02 Factory setting / CMPT=2 profile lists Device identification, Process data variable, and Device diagnosis; actual configured values or diagnosis are not asserted.

For A1/080, the ifm PN2070-02 interface table lists IO-Link transmission type COM2 at 38,4 kBaud; no observed or configured link speed is asserted.

For A1/081, the ifm PN2070-02 interface table lists IO-Link revision 1.1; negotiated master/device behavior is not asserted.

For A1/082, the ifm PN2070-02 Interfaces table lists SIO mode as supported; project operation in that mode is not assigned.

For A1/083, the ifm PN2070-02 Interfaces table lists IEC 61131-9 as its SDCI standard; no project compliance or implementation assessment is made.

For A1/084, ifm lists an integrated watchdog for the PN2070-02; no timing, fault handling or project safety behavior is assigned.

For A1/085, ifm lists 2 digital outputs and 1 analogue output for the PN2070-02; no channel mapping or simultaneous usage is assigned.


For A1/086, ifm lists PN2070-02 switch point accuracy below ±0.4% of the span at turn-down 1:1; no threshold, span selection or project accuracy is assigned.


For A1/087, ifm lists PN2070-02 repeatability below ±0.1% of span for temperature fluctuations below 10 K at turn-down 1:1; no project measurement or operating temperature condition is assigned.


For A1/088, ifm lists PN2070-02 long-term stability below ±0.05% of span per 6 months at turn-down 1:1; no project drift measurement, service life or maintenance interval is claimed.


For A1/089, ifm lists zero-point and span temperature coefficients of 0.2% of span per 10 K for −25 to 80 °C; no site temperature, project correction or measurement is assigned.


For A1/090, ifm lists PN2070-02 hysteresis deviation below ±0.1% of span at turn-down 1:1; no device setting or measured project behavior is assigned.


For A1/091, ifm lists PN2070-02 MTTF as 129 years; this product datum is not a project reliability calculation, service-life claim or maintenance interval.


For A1/092, ifm's PN2070-02 EMC row references DIN EN 61000-6-2 and DIN EN 61000-6-3; no project compliance or test result is claimed.


## SITOP 24 V DC two-branch distribution

Open **SITOP 24 V DC two-branch terminal distribution** from Project Explorer. A2/001 contains the SITOP PSU100C DC output. A2/002 distributes the separate +24 V and 0 V nets through four Phoenix Contact PT 2,5 terminals in strip XT1. A2/003 and A2/004 wire the ifm IFS204 and PN2070 sensors. A2/005 maps IFS204 OUT to CPU 1212C DI a.0 and PN2070 OUT2 to AI0. A2/006 carries Q0.0 to interface relay K1. A2/007 routes the K1 normally open contact to the KM1 coil and returns KM1 auxiliary feedback to DI a.1. A2/008 wires the normally open Start request to I0.2. A2/009 wires the normally closed operational Stop request to I0.3. A2/010 carries KM1 normally closed feedback through terminal strip XT2 to I0.4. A2/011 routes separate line, neutral and PE terminals to the SITOP input. A2/012 routes K1 normally closed status through XT2:3 to I0.5. Thirty-one native links connect the twelve sheets.

The analog connection assumes PN2070 OUT2 is configured for 0–10 V. Its factory mode is 4–20 mA. The contactor main poles remain unwired. Upstream supply, cabinet bonding, branch protection, conductor sizing, and controller logic remain outside the example. [SITOP component record](../../docs/components/siemens-sitop-psu100c-6ep1332-5ba00.md) [PN2070 component record](../../docs/components/ifm-pn2070.md) [LC1D09BD component record](../../docs/components/schneider-electric-lc1d09bd.md)

## Project library validation

`library.json` indexes the source-backed examples and their distinct electrical topologies. Run `node scripts/project-library-validation.js --write` to regenerate the report and `node scripts/project-library-validation.js --check` to check it against the current files and CAD engine.

The validator saves and reopens each example with the native CAD engine. It compares project data and a SHA-256 fingerprint of the project-wide nets, cross-sheet connections, and unresolved endpoints.

It also generates the BOM, wire list, terminal list, PLC I/O list, and cable schedule CSV for each example, checks that their contents survive save and reopen, and records their fingerprints.

The report counts authored sheets and electrically connected sheets separately. A connected sheet participates in a wired net that joins at least two component pins, including nets with explicit cross-sheet links. Run `node scripts/project-library-validation.js --check --require-release-scale` to enforce the library size requirement of 50 distinct topologies, 100 authored sheets and 70 connected sheets per qualifying project, and at least 5,000 qualifying sheets in total.


# DOL motor feeder — second 100-sheet reference project opening (A2/001)

Open this project as an editable copy from **Project Explorer → List**. The project has 99 legacy A2-numbered sheets through A2/099, plus the A3/001 preliminary panel-layout sheet: source-backed DOL schematic A2/001, scope A2/002, component register A2/003, revision history A2/004, design basis A2/005, index A2/006, pin/net schedule A2/007, wire schedules A2/008–A2/009, manufacturer source register A2/010, Q1/KM1 reference A2/011, M1 reference A2/012, S0/S1 reference A2/013, X1–X6 boundary reference A2/014, control path A2/015, three-phase power path A2/016, application-input omissions register A2/017, KM1 coil-demand reference A2/018, DOL seal-in path reference A2/019, KM1 AC-3 catalog-rating reference A2/020, KM1 dimensions/mounting reference A2/021, KM1 terminal torque reference A2/022, and KM1 terminal conductor-options reference A2/023, KM1 coil voltage-limits reference A2/024, KM1 AC-3 electrical durability reference A2/025, KM1 rated insulation voltage reference A2/026, KM1 rated impulse withstand voltage reference A2/027, KM1 operating-rate reference A2/028, KM1 signalling-circuit minimum switching reference A2/029, KM1 auxiliary-contact non-overlap-time reference A2/030, KM1 front-face IP20 reference A2/031, KM1 ambient-temperature reference A2/032, KM1 operating-altitude reference A2/033, and KM1 environmental-classification reference A2/034, and KM1 vibration-and-shock ratings reference A2/035, KM1 mechanical-durability reference A2/036, KM1 rated-breaking-capacity reference A2/037, KM1 rated-making-capacity reference A2/038, KM1 conventional free-air thermal-current reference A2/039, and KM1 power-dissipation reference A2/040, KM1 signalling-circuit rated-making-capacity reference A2/041, and signalling-circuit frequency reference A2/042. The source package contains 100 authored sheets total: 99 legacy A2-numbered sheets through A2/099 plus A3/001. All sheets contain authored content. In an editable copy, each sheet is grouped by its assigned A1–A4 section and numbered in project order with that section prefix; source A2/095 becomes A2/0021 and A2/096 becomes A2/0022, and A2/097 becomes A2/0023 in section A2. The source-backed model remains 11 component instances, 38 orthogonal wire segments, 15 derived nets, six BOM rows, zero open endpoints, and zero geometry errors. A2/016 maps the three incoming phases through Q1 and KM1 to M1, and separately lists the star-point and PE net groups. Each row is regression-checked against the engine's pin and wire analysis. The pages explicitly do not imply switching, motor, protection, PE adequacy, or installation behavior. A2/018 records Schneider Electric FAQ FA33405 coil consumption (2.4 W average at 20 °C; 100 mA at 24 V). This is one-coil nominal data, not a total-load or supply-adequacy result. A2/019 documents the conditional S0 NC and parallel S1/KM1 auxiliary-NO path to KM1:A1 from A2/001 net analysis; contact and coil behavior remain unsimulated. A2/020 records the manufacturer's 9 A AC-3 catalog rating for LC1D09BD at Ue ≤440 V AC and ambient ≤60 °C; it does not determine application suitability or coordination. A2/021 records the manufacturer's 45 × 77 × 95 mm dimensions, 93/95 mm depth conditions, and rail/plate mounting support; it does not define panel layout, spacing, or installation clearance. A2/022 records the product data sheet's 1.7 N·m power/control terminal torque and screwdriver options; the project has no installed termination record. A2/023 records all 12 manufacturer screw-clamp conductor combinations; the project does not select cable types or cross-sections. A2/024 records the manufacturer's DC coil operating and drop-out ranges at 60 °C; actual coil voltage and switching remain unmodeled. A2/025 records the manufacturer's 2 Mcycles electrical durability condition at 9 A AC-3 and Ue ≤440 V AC; this is not a project life estimate. A2/026 records the contactor's 690 V IEC and 600 V CSA/UL rated insulation values by circuit; they do not establish project insulation coordination. A2/027 records its 6 kV IEC rated impulse withstand voltage. A2/028 records the 3,600 cycles/hour maximum operating rate at ambient temperature up to 60 °C as a component rating, not project switching duty. A2/029 records the manufacturer-listed minimum switching current of 5 mA and voltage of 17 V for the signalling circuit; PLC input compatibility and installation behavior remain unverified. A2/030 records the manufacturer-listed 1.5 ms non-overlap time between the NC and NO auxiliary contacts on energisation and de-energisation; project switching and response timing remain unmodeled. A2/031 records IP20 for the contactor front face under IEC 60529; no enclosure or assembly protection rating is established. A2/032 records the manufacturer-listed operating and storage ambient ranges, separately identifying the at-Uc ambient value; project site conditions are unspecified. A2/033 records the listed 3,000 m operating altitude without derating in temperature as a component statement, not a project site assessment. A2/034 records pollution degree 3 and TH conforming to IEC 60068-2-30 as component catalog characteristics; it does not establish site conditions or project installation suitability. A2/035 records the listed vibration values (2 Gn open, 4 Gn closed, 5–300 Hz) and shock values (10 Gn/11 ms open, 15 Gn/11 ms closed); project exposure and installation suitability remain unestablished. A2/036 records the manufacturer-listed 30 Mcycles mechanical durability rating; this is not a project service-life estimate. A2/037 records the rated breaking capacity of 250 A at 440 V for the power circuit under IEC 60947; it does not establish project prospective fault current, protective-device coordination, or assembly short-circuit rating. A2/038 records the distinct Irms rated making capacity of 250 A at 440 V for the power circuit; it does not establish project fault conditions, switching duty, or coordination. A2/039 records conventional free-air thermal current Ith of 25 A for the power circuit and 10 A for the signalling circuit at ambient up to 60 °C; these are not project conductor or protection selections. A2/040 records power dissipation per pole of 0.2 W in AC-3 and 1.56 W in AC-1; these do not determine project loss or enclosure thermal design. A2/041 records 140 A AC and 250 A DC signalling-circuit rated making capacity per IEC 60947-5-1. A2/042 records the 25–400 Hz signalling-circuit frequency range. A2/043 records all seven manufacturer Icw current-duration points, split by circuit; these component ratings do not establish project fault current, interruption capability, or protective-device coordination. A2/044 records the manufacturer-listed 20 A gG type 2 and 25 A gG type 1 associated power-circuit fuse ratings at ≤690 V, plus a 10 A gG signalling-circuit fuse conforming to IEC 60947-5-1; these conditions do not select a project fuse, Q1 breaker or establish application coordination. This educational static reference is not construction-ready.

## DOL reference project status

The source-backed Schneider/Siemens/SEW direct-on-line motor feeder has 100 authored sheets: 99 legacy A2-numbered pages through A2/099 and preliminary panel layout A3/001. Its static topology remains 11 components, 38 wires and 15 nets; manufacturer ratings do not establish project suitability or construction approval. See `siemens-schneider-sew-dol-reference.adigun.json`.


A2/045 records Schneider Electric LC1D09BD rated operational current as 25 A AC-1 at ≤440 V AC and ambient ≤60 °C, separately from the 9 A AC-3 rating. These are utilization-category component ratings, not project load, cable or protection selections.


A2/046 records the Schneider Electric LC1D09BD AC-1 electrical durability condition: 0.6 Mcycles at 25 A and Ue ≤440 V AC. The 2 Mcycles AC-3 condition is separate and refers to 9 A at Ue ≤440 V AC. Neither catalog value predicts service life in this project.


A2/047 records Schneider Electric LC1D09BD B10d values separately: 1,369,863 cycles with nominal load and 20,000,000 cycles with mechanical load, each as listed conforming to EN/ISO 13849-1. These manufacturer data alone do not establish a safety performance level or validate a project safety function.


A2/048 records the manufacturer-listed 1 NC mirror contact conforming to IEC 60947-4-1 and the separately listed 1 NO + 1 NC mechanically linked contacts conforming to IEC 60947-5-1. This catalog designation does not assign a project safety-circuit function or validate safety architecture.


A2/049 records the Schneider Electric LC1D09BD catalog opening time of 16–24 ms and closing time of 53.55–72.45 ms. A2/050 records its manufacturer-listed 28 ms coil time constant and built-in bidirectional peak-limiting diode suppressor. A2/051 records 5.4 W inrush and hold-in ratings at 20 °C and documents that FAQ FA33405 also reports 2.4 W average while referencing LC1D09BD; the sources do not reconcile these figures. A2/052 lists the manufacturer’s Type 1 starter proposal combinations at 415 V AC; they are not project selections. A2/053 records the separate 2.2 kW AC-4 motor rating at 400 V AC. A2/054 records AC-3 motor power bands across five voltage ranges. A2/055 records SEW DRN63MS4 rated power, current, speed, torque, power factor, and efficiency values. A2/056 records Q1’s published class 10 release ranges while keeping its overload setting unset. These are catalog data, not validation of project performance, motor selection, coordination, or application suitability.


A2/057 records the manufacturer’s typical 100,000-cycle mechanical endurance for Q1 main and auxiliary contacts and typical 100,000-cycle electrical endurance. These values do not estimate project service life or switching duty.


A2/058 records Siemens’ published 6 kV surge-voltage resistance rating for Q1. It is a component value and does not establish project insulation coordination or assembly impulse withstand.


A2/059 records Siemens’ operating (−20…+60 °C), storage (−50…+80 °C) and transport (−50…+80 °C) ambient-temperature ratings for Q1. These component conditions do not establish project site or enclosure suitability.


A2/060 records Siemens’ 10–95% relative-humidity rating during operation for Q1. This component condition does not establish the project environment or installation suitability.


A2/061 records Siemens’ maximum installation altitude of 2 000 m above sea level for Q1 3RV2011-0FA10. This component limit does not establish project site elevation, derating, or application suitability.


A2/062 records Siemens’ rated operating-voltage range of 20…690 V AC for Q1 3RV2011-0FA10. This component rating is not a project supply specification or an application-suitability conclusion.


A2/063 records Siemens’ rated operating-frequency range of 50…60 Hz for Q1 3RV2011-0FA10. This component rating does not assign the project supply frequency or establish application suitability.


A2/064 records Siemens’ ultimate short-circuit breaking capacity (Icu) of 100 kA at 400 V AC for Q1 3RV2011-0FA10. This component rating does not state the project fault level, assembly short-circuit rating, or protective-device coordination.

A2/065 records Siemens’ operating short-circuit current breaking capacity (Ics) of 100 kA at 400 V AC for Q1 3RV2011-0FA10. This rated service capacity is separate from Icu and does not state the project fault level, assembly short-circuit rating, or protective-device coordination.

A2/066 records Siemens’ listed response value of the 3RV2011-0FA10 instantaneous short-circuit trip unit, 6.5 A. No project current, trip curve, timing, tolerance, coordination, or application suitability is inferred.

A2/067 records Siemens’ 3RV2011-0FA10 AC-3 motor-power ratings of 0.1 kW at 230 V, 0.12 kW at 400 V, 0.1 kW at 500 V, and 0.2 kW at 690 V AC. The 400 V figure is a catalog comparison with M1; it does not by itself establish motor compatibility or application suitability.

A2/068 records Siemens’ maximum 3RV2011-0FA10 operating frequency of 15 1/h in AC-3 and AC-3e. It does not assign the project switching duty or establish an operating sequence or application suitability.

A2/069 records Siemens’ rated operational current of 0.5 A in AC-3 and AC-3e at 400 V AC for Q1 3RV2011-0FA10. This component rating does not set its overload release, establish motor compatibility, or define project current or coordination.

A2/070 records Siemens’ listed phase-failure-detection product function for Q1 3RV2011-0FA10. This catalog feature does not verify project detection, trip response, motor protection, or control behavior.

A2/071 records Siemens’ listed Q1 dimensions of 97 mm high, 45 mm wide, and 97 mm deep, with screw fastening or snap-on mounting on a 35 mm DIN rail. These component data do not define enclosure layout, clearance, or installation.

A2/072 records that Siemens lists ground-fault detection as No for Q1 3RV2011-0FA10. This component limitation does not characterize other project devices or establish the project's ground-fault protection.

A2/073 records Siemens’ listed insulation voltage of 690 V at AC rated value with degree of pollution 3 for Q1 3RV2011-0FA10. Project pollution degree, overvoltage category, insulation coordination, and installation suitability are not established.

A2/074 records Siemens’ front-face protection class IP20 according to IEC 60529 for Q1 3RV2011-0FA10. This component listing does not rate a project enclosure or assembly; project installation and touch-protection conditions remain unspecified.

A2/075 records Siemens’ separate terminal protection-class listing IP20 for Q1 3RV2011-0FA10. This terminal component value does not rate an assembled enclosure or project terminal-access conditions.

A2/076 records Siemens’ 25 g / 11 ms shock-resistance listing for Q1 3RV2011-0FA10 according to IEC 60068-2-27. This is a component rating, not a project shock test or installed-equipment result.


A2/077 records Siemens’ Q1 ambient temperature ranges of −20 to +60 °C during operation and −50 to +80 °C during storage and transport. These component data-sheet conditions do not qualify the project environment or establish installed performance.


A2/078 records Siemens’ 280 g net-weight value for Q1 3RV2011-0FA10. This component value is not an assembly mass calculation; accessories and other installed equipment are outside the listing.


A2/079 records Siemens’ total global warming potential listing of 74.698 kg CO₂ equivalent for Q1 3RV2011-0FA10, and that an EPD is available. This is component data, not the environmental footprint of the project or assembled equipment.


A2/080 records Siemens’ EPD listing of 1.98 kg CO₂ equivalent for the manufacturing stage of Q1 3RV2011-0FA10. This is component lifecycle data, not measured project emissions or an assembly footprint.


A2/081 records Siemens’ EPD listing of 0.134 kg CO₂ equivalent for the sales stage of Q1 3RV2011-0FA10. This is component lifecycle data, not project emissions or an assembly footprint.


A2/082 records Siemens’ EPD listing of 72.7 kg CO₂ equivalent for the operating stage of Q1 3RV2011-0FA10. This component lifecycle value does not represent this project’s energy use, duty cycle, service life, or assembly footprint.


A2/083 records Siemens’ EPD listing of −0.116 kg CO₂ equivalent after end of life for Q1 3RV2011-0FA10. This is a manufacturer-reported component lifecycle result, not a project removal credit or end-of-life assessment.


A2/084 records Siemens’ Q1 power-loss values of 5.5 W at AC in the hot operating state and 1.8 W per pole at AC in the not-operating state. These component ratings are not a project thermal assessment.


A2/085 records SEW-EURODRIVE’s starting-current ratio I_A/I_N of 3.6 for the 400 V, 50 Hz, four-pole DRN63MS4 catalog table. It is not an installed starting-current measurement or a project protection calculation.


A2/086 records the SEW 400 V, 50 Hz, four-pole DRN63MS4 catalog torque ratios M_A/M_N = 2.7, M_H/M_N = 2.6, and M_K/M_N = 2.7. These ratios do not establish project torque output or motor-load matching.


A2/087 derives a 1.458 A catalog starting-current reference from SEW’s I_N = 0.405 A and I_A/I_N = 3.6 for the 400 V, 50 Hz DRN63MS4 table. The result is not a measured project current.


A2/088 derives M1 torque references from SEW’s rated torque of 0.83 Nm and normalized catalog ratios. These values are not measured project torque or verified load matching.


A2/089 records SEW DRN63MS4 motor mass of 4.9 kg and motor inertia of 2.95 × 10⁻⁴ kg·m² for the matching 400 V, 50 Hz, four-pole catalog row. The values exclude the driven load and do not define total installed inertia.


A2/090 derives approximately 3.08 J of motor-only rotational energy from SEW’s 1380 rpm rated speed and 2.95 × 10⁻⁴ kg·m² motor inertia. The calculation excludes driven-load inertia and does not model acceleration.


A2/091 cross-checks SEW’s 0.12 kW rated output using the listed 0.83 Nm torque and 1380 rpm speed. The arithmetic yields approximately 119.95 W and agrees within catalog rounding; it is not an independent motor test.


A2/092 records the SEW DRN63MS4 230 V delta / 400 V star, 50 Hz winding rating and the catalog operating point of 400 V star. The ideal 400/√3 ≈ 231 V winding relation is not an installation verification.


A2/093 records SEW catalog efficiency at 50%, 75% and 100% load for the DRN63MS4 400 V, 50 Hz, four-pole S1 row. These discrete catalog values are not measurements of this project.


A2/094 records SEW motor nameplate conditions of up to 40 °C ambient and 1000 m installation altitude. Actual site conditions and any required derating remain unassessed. A2/095 records SEW thermal-class options: 130 (B) is the standard asynchronous-motor design, with 155 (F) and 180 (H) available on request; the source does not identify the thermal class ordered for this project's M1 instance. The sheet keeps the three maximum winding-temperature classifications separate from ambient and measured motor temperature. A2/096 records SEW sensor options /TF (PTC thermistor or PTC resistor), /TH (bimetallic thermostat), /PK (Pt1000), and /PT (Pt100), with catalog size ranges; the installed M1 sensor option remains unverified. A2/097 lists the site measurements and delivered motor records needed to verify ambient and altitude, winding thermal class, and fitted sensor terminals. A2/098 tracks missing Q1 settings, fault-current and coordination evidence. A2/099 tracks missing KM1 coil-demand and external control-supply evidence.

## Native section organization when examples are opened as copies

The 97-sheet DOL reference opens as one editable project copy with 6 overview sheets in A1, 16 circuit and connection sheets in A2, 5 installation/layout sheets in A3, and 70 product data and engineering reference sheets in A4. A3/001 is an editable preliminary front-view layout: its 400 × 300 mm backplate envelope and rail positions are project assumptions; device dimensions are linked to manufacturer sources. The footprints are diagrammatic and are not construction drawings or duplicate BOM instances. The 100-sheet star-delta reference opens with 5 overview sheets in A1, 19 circuit and connection sheets in A2, 4 physical dimension/mounting references in A3, and 72 product data and report sheets in A4. Copy creation preserves every source sheet and drawing object, derives the target section from each source sheet's \`projectSectionId\`, and remaps internal sheet references to section-prefixed project-order numbers.

The DOL A3/001 page is a preliminary editable arrangement with explicit project assumptions; it is not a fully dimensioned enclosure assembly or construction-ready panel design. The star-delta A3 pages remain source-backed component installation references. Both examples remain editable so engineers can refine or create project-specific physical layouts after enclosure, thermal, clearance, wiring, and site requirements are established.
