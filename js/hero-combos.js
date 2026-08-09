/**
 * Shared hero badge combo router
 * --------------------------------
 * Listens to the three hero chips and fires named CustomEvents when a
 * secret sequence is completed. Terminal, blackboard, and pet easter
 * eggs register through this module.
 */

document.addEventListener('DOMContentLoaded', () => {
    const chips = document.querySelectorAll('#hero-stats .stat-chip[data-chip]');
    if (!chips.length) return;

    const COMBOS = [
        {
            name: 'terminal',
            sequence: ['ozgrav', 'ozgrav', 'phd', 'comp', 'comp', 'comp'],
        },
        {
            name: 'blackboard',
            sequence: ['phd', 'ozgrav', 'ozgrav', 'comp'],
        },
        {
            name: 'pet',
            sequence: ['comp', 'ozgrav', 'phd', 'phd'],
        },
    ];

    const progress = COMBOS.map(() => 0);
    let comboResetTimer = null;
    let overlayActive = false;

    window.HeroCombos = {
        isOverlayActive() {
            return overlayActive;
        },
        setOverlayActive(active) {
            overlayActive = !!active;
        },
    };

    chips.forEach((chip) => {
        chip.addEventListener('click', () => handleChipInput(chip));
        chip.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleChipInput(chip);
            }
        });
    });

    function handleChipInput(chip) {
        if (overlayActive) return;

        chip.classList.remove('chip-pressed');
        void chip.offsetWidth;
        chip.classList.add('chip-pressed');

        const key = chip.getAttribute('data-chip');

        clearTimeout(comboResetTimer);
        comboResetTimer = setTimeout(() => {
            for (let i = 0; i < progress.length; i++) progress[i] = 0;
        }, 3500);

        for (let i = 0; i < COMBOS.length; i++) {
            const combo = COMBOS[i];
            if (key === combo.sequence[progress[i]]) {
                progress[i]++;
                if (progress[i] === combo.sequence.length) {
                    for (let j = 0; j < progress.length; j++) progress[j] = 0;
                    clearTimeout(comboResetTimer);
                    document.dispatchEvent(new CustomEvent('hero-combo:' + combo.name));
                    return;
                }
            } else {
                progress[i] = key === combo.sequence[0] ? 1 : 0;
            }
        }
    }
});
