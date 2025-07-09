document.addEventListener('DOMContentLoaded', () => {
    const imageContainer = document.querySelector('.profile-container');
    const image = document.querySelector('.profile-pic');
    const canvas = document.getElementById('particle-canvas');

    if (!imageContainer || !image || !canvas) {
        console.error("Hero section elements not found!");
        return;
    }

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    // --- Particle Class ---
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            // Add a slight random brightness to the original color
            const brightness = Math.random() * 0.4 + 0.8; // 80% to 120% brightness
            this.color = this.adjustColor(color, brightness);
            this.size = Math.random() * 3 + 1; // Particle size
            this.velocityX = (Math.random() - 0.5) * 25; // Initial explosion speed
            this.velocityY = (Math.random() - 0.5) * 25;
            this.gravity = 0.2; // Gravity effect
            this.alpha = 1;
            this.friction = 0.97; // Slows down particles over time
            this.life = Math.random() * 80 + 50; // Particle lifespan
        }

        // Helper to adjust color brightness
        adjustColor(color, factor) {
            const [r, g, b] = color.match(/\d+/g).map(Number);
            return `rgb(${Math.min(255, r * factor)}, ${Math.min(255, g * factor)}, ${Math.min(255, b * factor)})`;
        }

        draw() {
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        update() {
            this.life--;
            if (this.life <= 0) {
                this.alpha -= 0.05;
            }
            this.velocityX *= this.friction;
            this.velocityY *= this.friction;
            this.velocityY += this.gravity;
            this.x += this.velocityX;
            this.y += this.velocityY;
        }
    }

    // --- Core Functions ---
    function prepareCanvas() {
        const rect = image.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Draw the image onto the canvas to get pixel data
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles = [];
        // Sample pixels with a step for better performance
        const step = 4;
        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const index = (y * canvas.width + x) * 4;
                const alpha = imageData[index + 3];

                if (alpha > 128) { // Only create particles for non-transparent pixels
                    const r = imageData[index];
                    const g = imageData[index + 1];
                    const b = imageData[index + 2];
                    const color = `rgb(${r},${g},${b})`;
                    particles.push(new Particle(x, y, color));
                }
            }
        }
    }

    function animate() {
        // Add a motion blur / trailing effect
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color').trim() || '#020205';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let particlesStillAlive = false;
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].alpha > 0) {
                particlesStillAlive = true;
            }
        }

        if (particlesStillAlive) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            // Animation finished, reset for next click
            canvas.style.opacity = '0';
            image.classList.remove('hidden');
            imageContainer.style.pointerEvents = 'auto';
        }
    }

    // --- Event Listener ---
    imageContainer.addEventListener('click', () => {
        // Prevent multiple clicks while animation is running
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        prepareCanvas();

        if (particles.length === 0) return;

        // Hide original image and show canvas
        image.classList.add('hidden');
        canvas.style.opacity = '1';
        imageContainer.style.pointerEvents = 'none';

        animate();
    });

});