export const CSI_MASTERFORMAT_OPTIONS = [
    { code: '01 00 00', title: 'General Requirements' },
    { code: '02 00 00', title: 'Existing Conditions' },
    { code: '03 00 00', title: 'Concrete' },
    { code: '04 00 00', title: 'Masonry' },
    { code: '05 00 00', title: 'Metals' },
    { code: '06 00 00', title: 'Wood, Plastics, and Composites' },
    { code: '07 00 00', title: 'Thermal and Moisture Protection' },
    { code: '08 00 00', title: 'Openings' },
    { code: '09 00 00', title: 'Finishes' },
    { code: '10 00 00', title: 'Specialties' },
    { code: '11 00 00', title: 'Equipment' },
    { code: '12 00 00', title: 'Furnishings' },
    { code: '13 00 00', title: 'Special Construction' },
    { code: '14 00 00', title: 'Conveying Equipment' },
    { code: '21 00 00', title: 'Fire Suppression' },
    { code: '22 00 00', title: 'Plumbing' },
    { code: '23 00 00', title: 'Heating, Ventilating, and Air Conditioning (HVAC)' },
    { code: '25 00 00', title: 'Integrated Automation' },
    { code: '26 00 00', title: 'Electrical' },
    { code: '27 00 00', title: 'Communications' },
    { code: '28 00 00', title: 'Electronic Safety and Security' },
];

export const findCsiByCode = (code) => {
    if (!code) return null;
    return CSI_MASTERFORMAT_OPTIONS.find((option) => option.code === code) || null;
};

