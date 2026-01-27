/**
 * NBA Luxury Tax Challenge - Animations
 * Visual effects and particle system
 * Fun animations for students!
 */

class AnimationManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrame = null;
        this.isRunning = false;
    }

    // Initialize the particle canvas
    init() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) {
            console.warn('Particle canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());

        // Start the animation loop
        this.startParticles();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Create floating basketball particles
    startParticles() {
        if (this.isRunning) return;
        this.isRunning = true;

        // Create initial particles
        for (let i = 0; i < 15; i++) {
            this.createParticle();
        }

        // Start animation loop
        this.animate();
    }

    createParticle() {
        const particle = {
            x: Math.random() * (this.canvas?.width || window.innerWidth),
            y: Math.random() * (this.canvas?.height || window.innerHeight),
            size: Math.random() * 20 + 10,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.3 + 0.1,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2
        };
        this.particles.push(particle);
    }

    animate() {
        if (!this.isRunning || !this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;

            // Wrap around screen
            if (particle.x < -50) particle.x = this.canvas.width + 50;
            if (particle.x > this.canvas.width + 50) particle.x = -50;
            if (particle.y < -50) particle.y = this.canvas.height + 50;
            if (particle.y > this.canvas.height + 50) particle.y = -50;

            // Draw basketball
            this.drawBasketball(particle);
        });

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    drawBasketball(particle) {
        if (!this.ctx) return;

        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation * Math.PI / 180);
        this.ctx.globalAlpha = particle.opacity;

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.fill();

        // Draw lines
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 1;

        // Horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(-particle.size, 0);
        this.ctx.lineTo(particle.size, 0);
        this.ctx.stroke();

        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(0, -particle.size);
        this.ctx.lineTo(0, particle.size);
        this.ctx.stroke();

        this.ctx.restore();
    }

    stopParticles() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    // Fun celebration effect - confetti!
    celebrateWin() {
        const colors = ['#FFD700', '#00D26A', '#0066FF', '#FF6B35', '#552583'];
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                container.appendChild(confetti);

                // Remove after animation
                setTimeout(() => confetti.remove(), 4000);
            }, i * 50);
        }

        // Remove container after all confetti is done
        setTimeout(() => container.remove(), 6000);
    }

    // Money falling effect for overspending
    showMoneyFall() {
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;overflow:hidden;';
        document.body.appendChild(container);

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const money = document.createElement('div');
                money.className = 'money-particle';
                money.textContent = '💵';
                money.style.left = Math.random() * 100 + '%';
                money.style.top = '-50px';
                container.appendChild(money);

                setTimeout(() => money.remove(), 3000);
            }, i * 100);
        }

        setTimeout(() => container.remove(), 4000);
    }

    // Screen transition effect
    transitionScreen(fromScreen, toScreen, callback) {
        const from = document.getElementById(fromScreen);
        const to = document.getElementById(toScreen);

        if (!from || !to) {
            console.error('Screen not found');
            if (callback) callback();
            return;
        }

        // Fade out current screen
        from.style.opacity = '0';
        from.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            from.classList.remove('active');
            from.style.opacity = '';
            from.style.transform = '';

            // Fade in new screen
            to.style.opacity = '0';
            to.style.transform = 'translateY(20px)';
            to.classList.add('active');

            // Force reflow
            to.offsetHeight;

            to.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            to.style.opacity = '1';
            to.style.transform = 'translateY(0)';

            setTimeout(() => {
                to.style.transition = '';
                if (callback) callback();
            }, 300);
        }, 300);
    }

    // Animate number change (like a scoreboard)
    animateNumber(element, startValue, endValue, duration = 500) {
        const start = performance.now();
        const diff = endValue - startValue;

        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (diff * easeOut));

            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Pulse effect for important elements
    pulseElement(element) {
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 1500);
    }

    // Shake effect for errors/warnings
    shakeElement(element) {
        element.classList.add('animate-shake');
        setTimeout(() => element.classList.remove('animate-shake'), 500);
    }

    // Card entrance animation
    animateCards(container) {
        const cards = container.querySelectorAll('.decision-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(40px)';

            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    // Stat bar fill animation
    animateStatBar(element, targetWidth) {
        element.style.width = '0%';
        setTimeout(() => {
            element.style.transition = 'width 0.8s ease-out';
            element.style.width = targetWidth + '%';
        }, 100);
    }

    // Trophy bounce for victory
    animateTrophy(element) {
        element.style.animation = 'trophyBounce 1s ease-in-out';
        setTimeout(() => {
            element.style.animation = 'float 3s ease-in-out infinite';
        }, 1000);
    }
}

// Create global instance
const Animations = new AnimationManager();
