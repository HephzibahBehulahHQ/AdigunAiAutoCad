# ifm PN2070 pressure sensor

## Manufacturer evidence

- Manufacturer: ifm electronic
- Model: PN2070
- Exact listed product: PN-400-SER14-MFRKG/US/ /V
- Official product data: <https://www.ifm.com/ae/en/product/PN2070>
- Manufacturer data sheet: <https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf> (PN2070-02, 2024-03-01)
- Manufacturer programming guide: <https://www.ifm.com/us/en/us/learn-more/pressure/pn/programming>
- The listed measuring range is 0–400 bar relative pressure, process port G 1/4 internal thread, and electrical supply 18–30 V DC. The M12 connection diagram maps pin 1 BN to L+, pin 2 WH to OUT2, pin 4 BK to OUT1, and pin 3 BU to L−. OUT2 supports a configurable 0–10 V analog voltage output (scalable 1:5); the listed minimum load resistance is 2000 Ω.
- ifm's programming guide states OUT2 is factory configured for 4–20 mA. Select voltage mode (`ou2 = U`) and verify the analog start/end parameters (`ASP2` / `AEP2`) before connecting it to a 0–10 V input. The project does not claim that a sensor was configured.

## A1/022 connection and limits

- A1/021 records the source-backed interface proposal. A1/022 instantiates B2 and routes pin 2 / OUT2 to Siemens CPU 1212C AI0 / X11:2, with pin 3 / L− referenced to CPU 2M / X11:1 and the X15 0 V DC distribution.
- Siemens documents the CPU 1212C onboard AI0 input range as 0–10 V DC; the A1/022 connection uses that voltage mode.
- This is an authored schematic connection, not evidence of a configured or commissioned device. The OUT2 factory-current setting must be changed to voltage and verified at the sensor before use. The process point is unspecified. A1/023 documents a conditional pressure-scaling relation only; no ASP2/AEP2 values, active conversion, calibration, alarms or PLC logic are assigned.
- Sensor pin identities come from the manufacturer's connection diagram. Project sheet coordinates are drawing locations, not device geometry. Physical installation, pressure medium, range selection, pressure rating, protection, total supply load and application suitability remain unassessed.

## A1/025 accuracy reference

- The PN2070-02 data sheet specifies characteristic deviation below ±0.25% of span BFSL / below ±0.5% at limit setting, for turn-down 1:1. A1/025 uses only the latter published contribution and only for a conditional 0–400 bar span; it is not a full sensor uncertainty statement.
- The sheet pairs that contribution with Siemens CPU input accuracy for an illustrative partial arithmetic sum. Verify voltage mode and the active ASP2/AEP2 values; no configured endpoints or calibration are claimed.

## A1/024 load reference

- The PN2070-02 data sheet lists current consumption below 35 mA and an 18–30 V DC operating range. A1/024 uses the listed upper current bound for a B2 branch comparison; it is not a measured installed current.
- The data sheet is linked above. A1/024 compares this one sensor branch with the exact 6EP1332-5BA00 ratings and does not assess the complete cabinet load or establish supply adequacy.

## CAD catalog representation

- The source-backed `ifm-pn2070` catalog definition preserves all four M12 terminal identities and keeps OUT1 distinct from analog-capable OUT2. It has a dedicated pressure-sensor glyph in the existing workstation renderer.
- Instance notes for the process point and signal configuration are editable; manufacturer ratings and source evidence remain read-only. The 32-sheet reference project contains B2 on A1/022, conditional AI0 scaling on A1/023 and the limited branch-current comparison on A1/024. Its process-point property is intentionally blank because no process point was supplied.

## A1/030 analog output parameter ranges

- The PN2070-02 data sheet lists the analog voltage output as 0–10 V, scalable 1:5, with a minimum load resistance of 2,000 Ω. Its measuring/setting-range table lists analog start point 0–320 bar and analog end point 80–400 bar.
- A1/030 records the listed ranges without inferring configured endpoint pairs or a selected output span. The project assigns no ASP2/AEP2 values, pressure conversion, calibration or PLC scaling behavior.

## A1/031 pressure limits

- The PN2070-02 data sheet lists a 0–400 bar relative measuring range, an 800 bar pressure rating and a minimum burst pressure of 1,700 bar.
- A1/031 records manufacturer values only. It does not select a process operating pressure, establish a design limit, or verify application suitability.

## A1/032 medium temperature

- The PN2070-02 data sheet lists liquids and gases as media and a medium temperature range of −25 to 80 °C.
- A1/032 records this as the sensor's medium-temperature specification, separate from ambient temperature. No process medium, operating temperature or compatibility assessment is assigned.

 
## A1/033 electrical supply data

- The PN2070-02 data sheet lists an operating voltage of 18–30 V DC (to SELV/PELV) and current consumption below 35 mA.
- A1/033 records these manufacturer ratings without validating the installed supply or branch conditions. It does not establish total project load current or PSU headroom.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Electrical data table, 01.03.2024.


## A1/034 power-on delay time

- The PN2070-02 data sheet lists a power-on delay time of 0.3 s.
- A1/034 records this device specification without assigning startup sequence, ready-signal, PLC scan, or total system response behavior.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Electrical data table, 01.03.2024.


## A1/035 electrical protection characteristics

- The PN2070-02 data sheet lists protection class III and reverse-polarity protection as “yes”.
- A1/035 records those manufacturer product specifications only. It does not assess project installation, wiring faults, protective devices or functional safety.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Electrical data table, 01.03.2024.


## A1/036 minimum insulation resistance

- The PN2070-02 data sheet lists minimum insulation resistance as 100 MΩ with “500 V DC” in the table.
- A1/036 records the listed manufacturer value and condition only. No project insulation measurement or installation test is represented; the table notation is not a test instruction for the installed circuit or assembled product.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Electrical data table, 01.03.2024.


## A1/037 switching-output ratings

- The PN2070-02 data sheet lists a permanent switching-output current rating of 250 mA, maximum switching-output voltage drop of 2 V, and switching frequency below 500 Hz. It also lists pulsed short-circuit protection and overload protection.
- A1/037 records product data only. It assigns no output channel, PNP/NPN mode, configured function or load, and does not assess load suitability or protection coordination.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Outputs table, 01.03.2024.


## A1/038 switching-point ranges (CMPT 2)

- In the data-sheet section labelled “Factory setting / CMPT = 2”, the PN2070-02 lists SP from 2.5 to 400 bar, rP from 1 to 398.5 bar, a minimum SP/rP difference of 2 bar, and 0.5 bar steps.
- A1/038 records the listed parameter ranges without asserting that CMPT=2 or any threshold is configured in the project. They are not selected process limits or safety settings.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Measuring/setting range table, 01.03.2024.


## A1/039 switching-point ranges (CMPT 3 high resolution)

- In the data-sheet section labelled “Status_B High Resolution / CMPT = 3”, the PN2070-02 lists SP from 2.5 to 400 bar, rP from 0.9 to 398.4 bar, a minimum SP/rP difference of 1.7 bar, and 0.1 bar steps.
- A1/039 records the listed parameter ranges without asserting that CMPT=3 or any threshold is configured in the project. They are not selected process limits or safety settings.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Measuring/setting range table, 01.03.2024.


## A1/040 recommended tightening torque

- The PN2070-02 data sheet lists a G 1/4 internal-thread process connection (DIN EN ISO 1179-2) and a recommended tightening torque of 25 to 35 N·m. It states that the recommendation depends on lubrication, the seal and the pressure load.
- A1/040 records the manufacturer recommendation only. The project does not specify an installed seal, lubrication or applied torque, and this page does not select an installation value or assess the project pressure connection.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Mechanical data table, 01.03.2024.


## A1/041 ambient and storage temperatures

- The PN2070-02 data sheet lists an ambient temperature of −25 to 80 °C and a storage temperature of −40 to 100 °C.
- A1/041 records these product ratings only. It does not specify the installed sensor's ambient or storage conditions or assess site suitability.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Operating conditions table, 01.03.2024.


## A1/042 minimum pressure cycles

- The PN2070-02 data sheet lists minimum pressure cycles as 100 million.
- A1/042 records the manufacturer-listed product datum only. The project does not define a pressure-cycle profile or load history, and this value is not a project service-life, maintenance-interval or installed-system endurance claim.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Mechanical data table, 01.03.2024.


## A1/043 dimensions and weight

- The PN2070-02 data sheet lists dimensions as Ø 34 mm / L 90.7 mm and weight as 238.5 g.
- A1/043 records those product mechanical data only. They do not define the electrical schematic's scale, installation clearances or total assembly mass.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Mechanical data table, 01.03.2024.


## A1/044 integrated restrictor element

- The PN2070-02 data sheet lists no integrated restrictor element and states that one can be retrofitted.
- A1/044 records this product datum only. It does not represent a restrictor installation or retrofit, assess suitability, or claim hydraulic performance for this application.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Mechanical data table, 01.03.2024.


## A1/045 protection ratings

- The PN2070-02 data sheet lists protection ratings IP 65 and IP 67.
- A1/045 records the manufacturer product data only. It does not verify the installed connector, seals, cable or enclosure and does not claim an ingress-protection rating for the assembled project.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Operating conditions table, 01.03.2024.


## A1/046 shock and vibration data

- The PN2070-02 data sheet lists shock resistance DIN EN 60068-2-27 at 50 g (11 ms) and vibration resistance DIN EN 60068-2-6 at 20 g (10 to 2000 Hz).
- A1/046 records these manufacturer-listed values only. It does not assess installed machine vibration or shock or assign mounting conditions or application suitability.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Tests / approvals table, 01.03.2024.


## A1/047 wetted-parts material

- The PN2070-02 data sheet lists the wetted-parts material as stainless steel (630 / 1.4542 / 17-4 PH).
- A1/047 records the manufacturer-listed identifier only. No process medium or chemical exposure is specified, and this entry does not establish chemical compatibility or corrosion suitability.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Mechanical data table, 01.03.2024.


## A1/048 listed materials

- The PN2070-02 data sheet lists materials as stainless steel (630 / 1.4542 / 17-4 PH), stainless steel (316L / 1.4404), PBT+PC-GF30, PBT-GF20 and PC.
- A1/048 records the product material list only. The data sheet does not map every listed material to a specific sensor part; the wetted-parts material is separately listed on A1/047. This list alone does not establish chemical compatibility or corrosion suitability.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Mechanical data table, 01.03.2024.



## A1/049 electrical connector

- The PN2070-02 data sheet specifies one M12 connector, A-coded, with four gold-plated contacts. Pin functions are documented separately on A1/021.
- A1/049 records the sensor connector specification only. No cable or mating connector is selected, and physical fit or installed connection compatibility is not established.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Electrical connection table, 01.03.2024.


## A1/050 display indicators

- The PN2070-02 data sheet lists three green LEDs for display units bar, psi and MPa; two yellow switching-status LEDs; and a 4-digit alphanumeric measured-value display in red/green.
- A1/050 records the display hardware description only. It does not assign a display-unit selection, indicator-state meaning, switching threshold or relationship between display indications and remote PLC signals.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Displays / operating elements table, 01.03.2024.


## A1/051 process connection designation

- The PN2070-02 data sheet specifies a threaded process connection with G 1/4 internal thread, listed as DIN EN ISO 1179-2.
- A1/051 records the manufacturer designation only. No mating fitting or seal is selected, and the record does not establish mechanical compatibility, pressure-interface suitability or installation suitability.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Product characteristics table, 01.03.2024.


## A1/052 upper-housing rotation

- The PN2070-02 technical drawing callout states that the upper housing portion can be rotated 345°.
- A1/052 records the manufacturer callout only. It does not specify an installed rotation angle or establish mounting clearance or installation suitability.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), technical drawing callout, 01.03.2024.


## A1/053 programming-button callout

- The PN2070-02 technical drawing labels a programming button as callout 3.
- A1/053 records the drawing callout only. The data-sheet callout does not document the button’s function or assign an operating sequence.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), technical drawing callout, 01.03.2024.


## A1/054 pressure type

- The PN2070-02 data sheet lists type of pressure as relative pressure.
- A1/054 records that manufacturer classification only. It does not specify a project pressure reference or operating condition and does not derive an absolute-pressure conversion.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Application table, 01.03.2024.


## A1/055 vacuum resistance

- The PN2070-02 data sheet lists vacuum resistance as −1000 mbar (−0.1 MPa).
- A1/055 records the manufacturer value only. It does not assign a project vacuum condition or assess application suitability.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Application table, 01.03.2024.


## A1/056 switching output options

- The PN2070-02 data sheet lists PNP/NPN switching outputs and a parameterisable normally open/normally closed output function.
- A1/056 records the available output options only. It does not select a project polarity or output function.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Outputs table, 01.03.2024.


## A1/057 output protection

- The PN2070-02 data sheet lists pulsed short-circuit protection and overload protection for the output.
- A1/057 records the manufacturer output protection specifications only. It does not establish project protection performance, external circuit protection or coordination.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Outputs table, 01.03.2024.


## A1/058 analogue-output response

- The PN2070-02 data sheet lists a maximum analogue-output response time of 3 ms.
- A1/058 records the manufacturer rating only. It does not define configured damping or system response.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Response times table, 01.03.2024.


## A1/059 analogue-output damping

- The PN2070-02 data sheet lists the analogue-output damping parameter dAA as 0...4 s.
- A1/059 records the available parameter range only. It does not select a device setting or assign system response.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Response times table, 01.03.2024.


## A1/060 process-value damping

- The PN2070-02 data sheet lists the process-value damping parameter dAP as 0...4 s.
- A1/060 records the available parameter range only. It does not select a sensor setting or assign system response.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Response times table, 01.03.2024.


## A1/061 programmable delay

- The PN2070-02 data sheet lists the programmable delay parameters dS and dr as 0...50 s.
- A1/061 records the manufacturer range only. It does not select a switch-on or switch-off delay or define system response.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Response times table, 01.03.2024.


## A1/062 response time

- The PN2070-02 data sheet lists the response time as <1.5 ms.
- A1/062 records the manufacturer rating only. It does not establish project or system response time.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Response times table, 01.03.2024.


## A1/063 IO-Link process cycle time

- The PN2070-02 data sheet lists the minimum IO-Link process cycle time as 2.3 ms for factory setting / CMPT=2.
- A1/063 records the manufacturer profile datum only. It does not assign the device setting, master cycle or application response.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Factory setting / CMPT=2 table, 01.03.2024.


## A1/064 IO-Link process cycle time, CMPT=3

- The PN2070-02 data sheet lists the minimum IO-Link process cycle time as 3 ms for Status_B High Resolution / CMPT=3.
- A1/064 records the manufacturer profile datum only. It does not assign this device profile, master cycle or application response.
- Source: [ifm PN2070-02 data sheet (EN-GB)](https://media.ifm.com/dam/d61b3c6f-dc2b-4fe0-af49-278f0521b2d6/Original/PN2070-02_EN-GB.pdf), Status_B High Resolution / CMPT=3 table, 01.03.2024.
