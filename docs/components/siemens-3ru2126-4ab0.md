# Siemens SIRIUS 3RU2126-4AB0 thermal overload relay

## Identity and ratings

- Manufacturer part number: `3RU2126-4AB0`.
- Thermal motor-overload relay, frame size S0, Class 10, adjustable release range 11–16 A, three main poles, screw terminals, and manual/automatic reset selection.
- The modeled instance is F1 on A1/006. Its current setting remains unset; this record does not establish motor suitability or protection coordination.

## Auxiliary contact terminals

Siemens identifies 95–96 as an NC auxiliary contact and 97–98 as an NO auxiliary contact. On overload, 95–96 disconnects the contactor; 97–98 provides the “tripped” signal. Siemens says the auxiliary contacts have high contact reliability and are suitable for PLCs. A1/018 routes only 97–98 into the separate 24 V DC PLC input circuit: X14 +24 V DC → F1:97; F1:98 → CPU 1212C X10:14 / DI a.7 (I0.7). The existing F1:95–96 contactor-control path is unchanged.

The project is a static connection model. It does not simulate overload trip/reset behavior, PLC logic or alarm interpretation, protection adequacy, safety behavior, or whether a trip condition occurs.

## Manufacturer sources

- [Siemens SIRIUS 3RU thermal overload relays equipment manual](https://support.industry.siemens.com/cs/attachments/60298164/manual_SIRIUS_overload_relay_3RU_3RB_en-US.pdf), document A5E03656507420A/RS-AF/007, 07/2024: terminal labels (page 54), response on overload (page 71), and PLC-suitable auxiliary contact behavior (page 145).
- [Siemens 3RU2126-4AB0 product data sheet](https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2126-4AB0): product identity, frame size, trip class, and adjustable range.
