/**
 * Star Background Generator
 * Generates a stochastic star field using box-shadows for performance.
 */

document.addEventListener('DOMContentLoaded', () => {
    let nebulaContainer = document.querySelector('.global-nebula');

    // Auto-inject container if missing
    if (!nebulaContainer) {
        nebulaContainer = document.createElement('div');
        nebulaContainer.className = 'global-nebula';

        // Prepend to body to ensure it's behind everything
        document.body.prepend(nebulaContainer);
    }

    // Create star layers
    const layerCount = 3;
    const starCounts = [700, 200, 100]; // Small, Medium, Large
    const sizes = [1, 2, 3]; // Pixel sizes

    for (let i = 0; i < layerCount; i++) {
        const layer = document.createElement('div');
        layer.classList.add('star-layer');
        // ... rest of star generation logic remains same but improved for clarity below

        // Generate shadow string
        let shadows = [];
        const count = starCounts[i];

        for (let j = 0; j < count; j++) {
            const x = Math.random() * 100; // vw
            const y = Math.random() * 100; // vh
            const alpha = Math.random() * 0.8 + 0.2;
            shadows.push(`${x}vw ${y}vh 0 rgba(255, 255, 255, ${alpha})`);
        }

        layer.style.boxShadow = shadows.join(',');
        layer.style.width = `${sizes[i]}px`;
        layer.style.height = `${sizes[i]}px`;
        layer.style.position = 'absolute';
        layer.style.top = '0';
        layer.style.left = '0';
        layer.style.background = 'transparent';

        nebulaContainer.appendChild(layer);
    }
});
