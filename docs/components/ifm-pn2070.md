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

## Proposed interface and limits

- A1/021 records a candidate mapping from pin 2 / OUT2 to Siemens CPU 1212C AI0 / X11:2, with the analog return referenced to 2M / X11:1. The Siemens CPU source record identifies AI0 as a 0–10 V DC input and X11:1 as 2M.
- This is a compatibility and allocation proposal only. The project contains no PN2070 instance or circuit wiring on A1/021; AI0 remains unassigned in the connected model. No pressure values, analog conversion, calibration, scaling, alarms or PLC logic are modeled.
- Sensor pin identities come from the manufacturer's connection diagram. Project sheet coordinates are drawing locations, not device geometry. Physical installation, pressure medium, range selection, pressure rating, protection, total supply load and application suitability remain unassessed.

## CAD catalog representation

- The source-backed `ifm-pn2070` catalog definition preserves all four M12 terminal identities and keeps OUT1 distinct from analog-capable OUT2. It has a dedicated pressure-sensor glyph in the existing workstation renderer.
- Instance notes for the process point and signal configuration are editable; manufacturer ratings and source evidence remain read-only. The component has no instance in the 21-sheet reference project yet.
