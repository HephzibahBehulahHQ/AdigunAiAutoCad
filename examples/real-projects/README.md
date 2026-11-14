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

Open `siemens-sew-star-delta-reference.adigun.json` using **Open project file**. This is an honest sixty-nine-sheet opening set for the planned 100-sheet reference project:
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


## Project library validation

`library.json` is the machine-readable index of the source-backed examples and their distinct electrical topologies. To regenerate the per-project model report, run `node scripts/project-library-validation.js --write`; to verify that the committed report still matches the manifest, CAD engine, component catalog, and project files, run `node scripts/project-library-validation.js --check`. The committed report records measured sheet, component, wire, net, BOM, and connectivity counts. It currently validates five distinct topologies, while the first gate of five distinct 100-sheet projects remains incomplete; only the star-delta reference package currently meets the 100-sheet threshold.


# DOL motor feeder — second 100-sheet reference project opening (A2/001)

Open `siemens-schneider-sew-dol-reference.adigun.json` from the workstation's **Open project file** command. The project has fifty authored sheets: source-backed DOL schematic A2/001, scope A2/002, component register A2/003, revision history A2/004, design basis A2/005, index A2/006, pin/net schedule A2/007, wire schedules A2/008–A2/009, manufacturer source register A2/010, Q1/KM1 reference A2/011, M1 reference A2/012, S0/S1 reference A2/013, X1–X6 boundary reference A2/014, control path A2/015, three-phase power path A2/016, application-input omissions register A2/017, KM1 coil-demand reference A2/018, DOL seal-in path reference A2/019, KM1 AC-3 catalog-rating reference A2/020, KM1 dimensions/mounting reference A2/021, KM1 terminal torque reference A2/022, and KM1 terminal conductor-options reference A2/023, KM1 coil voltage-limits reference A2/024, KM1 AC-3 electrical durability reference A2/025, KM1 rated insulation voltage reference A2/026, KM1 rated impulse withstand voltage reference A2/027, KM1 operating-rate reference A2/028, KM1 signalling-circuit minimum switching reference A2/029, KM1 auxiliary-contact non-overlap-time reference A2/030, KM1 front-face IP20 reference A2/031, KM1 ambient-temperature reference A2/032, KM1 operating-altitude reference A2/033, and KM1 environmental-classification reference A2/034, and KM1 vibration-and-shock ratings reference A2/035, KM1 mechanical-durability reference A2/036, KM1 rated-breaking-capacity reference A2/037, KM1 rated-making-capacity reference A2/038, KM1 conventional free-air thermal-current reference A2/039, and KM1 power-dissipation reference A2/040, KM1 signalling-circuit rated-making-capacity reference A2/041, and signalling-circuit frequency reference A2/042. The remaining 51 sheets are not authored or represented as blank placeholders. The source-backed model remains 11 component instances, 38 orthogonal wire segments, 15 derived nets, six BOM rows, zero open endpoints, and zero geometry errors. A2/016 maps the three incoming phases through Q1 and KM1 to M1, and separately lists the star-point and PE net groups. Each row is regression-checked against the engine's pin and wire analysis. The pages explicitly do not imply switching, motor, protection, PE adequacy, or installation behavior. A2/018 records Schneider Electric FAQ FA33405 coil consumption (2.4 W average at 20 °C; 100 mA at 24 V). This is one-coil nominal data, not a total-load or supply-adequacy result. A2/019 documents the conditional S0 NC and parallel S1/KM1 auxiliary-NO path to KM1:A1 from A2/001 net analysis; contact and coil behavior remain unsimulated. A2/020 records the manufacturer's 9 A AC-3 catalog rating for LC1D09BD at Ue ≤440 V AC and ambient ≤60 °C; it does not determine application suitability or coordination. A2/021 records the manufacturer's 45 × 77 × 95 mm dimensions, 93/95 mm depth conditions, and rail/plate mounting support; it does not define panel layout, spacing, or installation clearance. A2/022 records the product data sheet's 1.7 N·m power/control terminal torque and screwdriver options; the project has no installed termination record. A2/023 records all 12 manufacturer screw-clamp conductor combinations; the project does not select cable types or cross-sections. A2/024 records the manufacturer's DC coil operating and drop-out ranges at 60 °C; actual coil voltage and switching remain unmodeled. A2/025 records the manufacturer's 2 Mcycles electrical durability condition at 9 A AC-3 and Ue ≤440 V AC; this is not a project life estimate. A2/026 records the contactor's 690 V IEC and 600 V CSA/UL rated insulation values by circuit; they do not establish project insulation coordination. A2/027 records its 6 kV IEC rated impulse withstand voltage. A2/028 records the 3,600 cycles/hour maximum operating rate at ambient temperature up to 60 °C as a component rating, not project switching duty. A2/029 records the manufacturer-listed minimum switching current of 5 mA and voltage of 17 V for the signalling circuit; PLC input compatibility and installation behavior remain unverified. A2/030 records the manufacturer-listed 1.5 ms non-overlap time between the NC and NO auxiliary contacts on energisation and de-energisation; project switching and response timing remain unmodeled. A2/031 records IP20 for the contactor front face under IEC 60529; no enclosure or assembly protection rating is established. A2/032 records the manufacturer-listed operating and storage ambient ranges, separately identifying the at-Uc ambient value; project site conditions are unspecified. A2/033 records the listed 3,000 m operating altitude without derating in temperature as a component statement, not a project site assessment. A2/034 records pollution degree 3 and TH conforming to IEC 60068-2-30 as component catalog characteristics; it does not establish site conditions or project installation suitability. A2/035 records the listed vibration values (2 Gn open, 4 Gn closed, 5–300 Hz) and shock values (10 Gn/11 ms open, 15 Gn/11 ms closed); project exposure and installation suitability remain unestablished. A2/036 records the manufacturer-listed 30 Mcycles mechanical durability rating; this is not a project service-life estimate. A2/037 records the rated breaking capacity of 250 A at 440 V for the power circuit under IEC 60947; it does not establish project prospective fault current, protective-device coordination, or assembly short-circuit rating. A2/038 records the distinct Irms rated making capacity of 250 A at 440 V for the power circuit; it does not establish project fault conditions, switching duty, or coordination. A2/039 records conventional free-air thermal current Ith of 25 A for the power circuit and 10 A for the signalling circuit at ambient up to 60 °C; these are not project conductor or protection selections. A2/040 records power dissipation per pole of 0.2 W in AC-3 and 1.56 W in AC-1; these do not determine project loss or enclosure thermal design. A2/041 records 140 A AC and 250 A DC signalling-circuit rated making capacity per IEC 60947-5-1. A2/042 records the 25–400 Hz signalling-circuit frequency range. A2/043 records all seven manufacturer Icw current-duration points, split by circuit; these component ratings do not establish project fault current, interruption capability, or protective-device coordination. A2/044 records the manufacturer-listed 20 A gG type 2 and 25 A gG type 1 associated power-circuit fuse ratings at ≤690 V, plus a 10 A gG signalling-circuit fuse conforming to IEC 60947-5-1; these conditions do not select a project fuse, Q1 breaker or establish application coordination. This educational static reference is not construction-ready.

## DOL reference project status

The source-backed Schneider/Siemens/SEW direct-on-line motor feeder has 50 authored sheets through A2/050. Its static topology remains 11 components, 38 wires and 15 nets; manufacturer ratings do not establish project suitability or construction approval. See `siemens-schneider-sew-dol-reference.adigun.json`.


A2/045 records Schneider Electric LC1D09BD rated operational current as 25 A AC-1 at ≤440 V AC and ambient ≤60 °C, separately from the 9 A AC-3 rating. These are utilization-category component ratings, not project load, cable or protection selections.


A2/046 records the Schneider Electric LC1D09BD AC-1 electrical durability condition: 0.6 Mcycles at 25 A and Ue ≤440 V AC. The 2 Mcycles AC-3 condition is separate and refers to 9 A at Ue ≤440 V AC. Neither catalog value predicts service life in this project.


A2/047 records Schneider Electric LC1D09BD B10d values separately: 1,369,863 cycles with nominal load and 20,000,000 cycles with mechanical load, each as listed conforming to EN/ISO 13849-1. These manufacturer data alone do not establish a safety performance level or validate a project safety function.


A2/048 records the manufacturer-listed 1 NC mirror contact conforming to IEC 60947-4-1 and the separately listed 1 NO + 1 NC mechanically linked contacts conforming to IEC 60947-5-1. This catalog designation does not assign a project safety-circuit function or validate safety architecture.


A2/049 records the Schneider Electric LC1D09BD catalog opening time of 16–24 ms and closing time of 53.55–72.45 ms. A2/050 records its manufacturer-listed 28 ms coil time constant and built-in bidirectional peak-limiting diode suppressor. A2/051 records 5.4 W inrush and hold-in ratings at 20 °C and documents that FAQ FA33405 also reports 2.4 W average while referencing LC1D09BD; the sources do not reconcile these figures. A2/052 lists the manufacturer’s Type 1 starter proposal combinations at 415 V AC; they are not project selections. A2/053 records the separate 2.2 kW AC-4 motor rating at 400 V AC, distinct from the 4 kW AC-3 rating. Neither establishes this project’s motor compatibility or switching duty.
