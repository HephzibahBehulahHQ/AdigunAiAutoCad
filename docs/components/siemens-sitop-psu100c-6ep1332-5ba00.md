# Siemens SITOP PSU100C · 6EP1332-5BA00

## Manufacturer evidence

- Manufacturer: Siemens
- Official operating instructions: <https://support.industry.siemens.com/cs/attachments/65647808/PSU100C_Handbuch_englisch_en-US.pdf>
- Document: C98130-A7599-A1-2-762937, 06/2013; reviewed 2026-11-12.
- The order table and technical data identify this exact variant as a single-phase supply with an 85–264 V AC or 110–300 V DC input range and a 24 V DC, 2.5 A output.
- Section 2.2 identifies line input terminals L, N and PE, plus DC output terminals + and −. Siemens specifies one screw connection each for L, N, PE and +, and two screw connections for −.
- The manual records primary/secondary galvanic isolation, an IP20 rating and rail mounting to EN 60715 35 × 7.5/15 mm.

## CAD representation

- The source-backed symbol exposes L, N, PE, + and − as connectable schematic endpoints. Its single − endpoint represents the two physical − screw connections as one shared functional return. Individual screw positions are not drawn because the source model does not provide their schematic coordinates here.
- Pin coordinates are schematic locations, not a physical footprint. No input-to-output internal connection is asserted; the static net model does not simulate power conversion, startup, protection response or isolation behavior.
- Editable instance fields are marking, position and comment. Manufacturer identity and ratings remain source-linked and read-only.
- Rated output current and voltage are reference specifications only. Input protection coordination, source selection and application suitability are not established by this component record.

