export const DesignSystem = {
    colors: {
        background: '#000000',
        foreground: '#00ff41',
        primary: '#003b00',
        accent: '#00fa00',
        matrixGreen: '#00ff41',
        matrixGreenDim: '#008f11',
        matrixGreenDark: '#003b00',
        status: {
            critical: '#ff0000',
            high: '#ff8c00',
            medium: '#ffff00',
            low: '#00ff41',
        },
    },
    statusColors: {
        CRITICAL: 'text-[#ff0000] border-[#ff0000] glow-red',
        HIGH: 'text-[#ff8c00] border-[#ff8c00] glow-orange',
        MEDIUM: 'text-[#ffff00] border-[#ffff00] glow-yellow',
        LOW: 'text-[#00ff41] border-[#00ff41] glow-green',
    },
    layout: {
        scanline: 'scan-line',
        cardShadow: 'card-shadow',
        terminalText: 'terminal-text',
    },
};
