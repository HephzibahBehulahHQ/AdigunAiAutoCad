# Siemens SIMATIC S7-1200 CPU 1212C DC/DC/DC

## Manufacturer evidence

- Manufacturer: Siemens
- Product: SIMATIC S7-1200 CPU 1212C DC/DC/DC
- Exact article number: 6ES7212-1AE40-0XB0
- Official S7-1200 System Manual, V4.5 (05/2021): <https://cache.industry.siemens.com/dl/files/241/109797241/att_1066673/v1/s71200_system_manual_en-US_en-US.pdf>
- Table A-46 identifies X10 pin 11 as digital input DI a.4 for this exact CPU variant. The same table maps X10 pins 7–14 to DI a.0–a.7.

## CAD representation

- The catalog model preserves the CPU's 25 manufacturer-designated X10/X11/X12 terminals. A1/014 uses the existing CPU instance and routes the existing X10:11 terminal; it does not add a duplicate PLC.
- The cross-sheet drawing connects KM4's source-backed normally closed auxiliary contact terminals 21–22 to DI a.4. It documents wiring topology only. No PLC program, input logic, diagnostic alarm, or contactor behavior is modeled.
- Pin coordinates are schematic connection locations, not a physical PLC footprint. Verify the selected hardware, wiring method and application against current Siemens documentation and qualified engineering review.
