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
- This is an authored schematic connection, not evidence of a configured or commissioned device. The OUT2 factory-current setting must be changed to voltage and verified at the sensor before use. The process point is unspecified; pressure conversion, calibration, scaling, alarms and PLC logic are not modeled.
- Sensor pin identities come from the manufacturer's connection diagram. Project sheet coordinates are drawing locations, not device geometry. Physical installation, pressure medium, range selection, pressure rating, protection, total supply load and application suitability remain unassessed.

## CAD catalog representation

- The source-backed `ifm-pn2070` catalog definition preserves all four M12 terminal identities and keeps OUT1 distinct from analog-capable OUT2. It has a dedicated pressure-sensor glyph in the existing workstation renderer.
- Instance notes for the process point and signal configuration are editable; manufacturer ratings and source evidence remain read-only. The 22-sheet reference project contains B2 on A1/022. Its process-point property is intentionally blank because no process point was supplied.
