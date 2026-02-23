/**
 * Easter Egg: Black Hole Event Horizon
 * Clicking the profile picture 5 times triggers an animation where a 
 * black hole forms in the center and slowly consumes the image.
 */

document.addEventListener('DOMContentLoaded', () => {
    const profileImg = document.getElementById('profile-img');

    if (!profileImg) return;

    let clickCount = 0;
    let clickTimeout;

    // Tiny visual feedback on click
    profileImg.addEventListener('mousedown', () => {
        profileImg.style.transform = 'scale(0.95)';
    });

    profileImg.addEventListener('mouseup', () => {
        profileImg.style.transform = 'scale(1)';
    });

    profileImg.addEventListener('mouseleave', () => {
        profileImg.style.transform = 'scale(1)';
    });

    profileImg.addEventListener('click', () => {
        clickCount++;

        // Reset count if they stop clicking after 2 seconds
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            clickCount = 0;
        }, 2000);

        if (clickCount >= 5) {
            triggerBlackHole();
            clickCount = 0; // Prevent multiple triggers
        }
    });

    function triggerBlackHole() {
        const frame = profileImg.closest('.profile-frame');

        // Stop hovering scale effects taking over
        profileImg.style.pointerEvents = 'none';
        profileImg.style.position = 'relative';
        profileImg.style.zIndex = '1';

        // Animate the image getting sucked in over 5s
        profileImg.classList.add('getting-eaten');

        // Form the black hole in the middle of the frame
        const blackHole = document.createElement('div');
        blackHole.className = 'event-horizon';

        // Add optional shake animation to body
        if (!document.getElementById('shake-anim')) {
            const style = document.createElement('style');
            style.id = 'shake-anim';
            style.textContent = `
                @keyframes rumble {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate3d(-2px, 1px, 0); }
                    20%, 40%, 60%, 80% { transform: translate3d(2px, -1px, 0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.style.animation = 'rumble 5s ease-in forwards';

        frame.appendChild(blackHole);

        // Ensure frame has relative positioning for the absolute centered black hole
        frame.style.position = 'relative';
    }
});
