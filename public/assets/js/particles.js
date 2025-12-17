/**
 * AI Video Generator - Particles Animation
 * Creates animated particle effects for hero sections and backgrounds
 */

class ParticleSystem {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isRunning = false;

        // Default options
        this.options = {
            particleCount: options.particleCount || 80,
            particleColor: options.particleColor || 'rgba(255, 255, 255, 0.5)',
            lineColor: options.lineColor || 'rgba(255, 255, 255, 0.1)',
            particleRadius: options.particleRadius || 2,
            lineDistance: options.lineDistance || 150,
            speed: options.speed || 0.5,
            interactive: options.interactive !== false,
            interactiveRadius: options.interactiveRadius || 150,
            ...options
        };

        this.mouse = {
            x: null,
            y: null,
            radius: this.options.interactiveRadius
        };

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.setupEventListeners();
        this.start();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push(new Particle(this));
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        if (this.options.interactive) {
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            });

            this.canvas.addEventListener('mouseleave', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    animate() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Draw connections
        this.connectParticles();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    connectParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.options.lineDistance) {
                    const opacity = 1 - (distance / this.options.lineDistance);
                    this.ctx.strokeStyle = this.options.lineColor.replace('0.1', opacity * 0.2);
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this.resize);
    }
}

class Particle {
    constructor(system) {
        this.system = system;
        this.canvas = system.canvas;
        this.ctx = system.ctx;
        this.options = system.options;

        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.vx = (Math.random() - 0.5) * this.options.speed;
        this.vy = (Math.random() - 0.5) * this.options.speed;
        this.radius = Math.random() * this.options.particleRadius + 1;
        this.originalRadius = this.radius;
    }

    update() {
        // Movement
        this.x += this.vx;
        this.y += this.vy;

        // Boundary check
        if (this.x < 0 || this.x > this.canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > this.canvas.height) this.vy = -this.vy;

        // Mouse interaction
        if (this.options.interactive && this.system.mouse.x !== null) {
            const dx = this.system.mouse.x - this.x;
            const dy = this.system.mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.system.mouse.radius) {
                // Push particles away from mouse
                const force = (this.system.mouse.radius - distance) / this.system.mouse.radius;
                const angle = Math.atan2(dy, dx);
                this.x -= Math.cos(angle) * force * 2;
                this.y -= Math.sin(angle) * force * 2;

                // Grow particle when near mouse
                this.radius = this.originalRadius + force * 3;
            } else {
                this.radius = this.originalRadius;
            }
        }
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.options.particleColor;
        this.ctx.fill();
    }
}

/**
 * Gradient Background Animation
 * Creates smooth gradient transitions
 */
class GradientAnimation {
    constructor(elementId, colors) {
        this.element = document.getElementById(elementId);
        if (!this.element) return;

        this.colors = colors || [
            { start: '#667eea', end: '#764ba2' },
            { start: '#f093fb', end: '#f5576c' },
            { start: '#4facfe', end: '#00f2fe' },
            { start: '#43e97b', end: '#38f9d7' }
        ];

        this.currentIndex = 0;
        this.animationId = null;
        this.start();
    }

    start() {
        this.animate();
    }

    animate() {
        const nextIndex = (this.currentIndex + 1) % this.colors.length;
        const current = this.colors[this.currentIndex];
        const next = this.colors[nextIndex];

        this.element.style.background = `linear-gradient(135deg, ${current.start} 0%, ${current.end} 100%)`;
        this.element.style.transition = 'background 3s ease-in-out';

        setTimeout(() => {
            this.element.style.background = `linear-gradient(135deg, ${next.start} 0%, ${next.end} 100%)`;
            this.currentIndex = nextIndex;
            this.animationId = setTimeout(() => this.animate(), 3000);
        }, 100);
    }

    stop() {
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
    }
}

/**
 * Floating Shapes Animation
 * Creates animated floating shape elements
 */
class FloatingShapes {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.options = {
            shapeCount: options.shapeCount || 5,
            colors: options.colors || [
                'linear-gradient(135deg, #667eea, #764ba2)',
                'linear-gradient(135deg, #f093fb, #f5576c)',
                'linear-gradient(135deg, #4facfe, #00f2fe)',
                'linear-gradient(135deg, #43e97b, #38f9d7)'
            ],
            minSize: options.minSize || 100,
            maxSize: options.maxSize || 400,
            blur: options.blur || 80,
            opacity: options.opacity || 0.3,
            ...options
        };

        this.createShapes();
    }

    createShapes() {
        for (let i = 0; i < this.options.shapeCount; i++) {
            const shape = document.createElement('div');
            const size = Math.random() * (this.options.maxSize - this.options.minSize) + this.options.minSize;

            shape.className = 'floating-shape';
            shape.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${this.options.colors[i % this.options.colors.length]};
                filter: blur(${this.options.blur}px);
                opacity: ${this.options.opacity};
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: floatShape${i} ${15 + Math.random() * 10}s ease-in-out infinite;
                animation-delay: ${-Math.random() * 10}s;
            `;

            this.container.appendChild(shape);

            // Add keyframes
            const style = document.createElement('style');
            style.textContent = `
                @keyframes floatShape${i} {
                    0%, 100% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    25% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(90deg);
                    }
                    50% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(180deg);
                    }
                    75% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(270deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

/**
 * Text Typing Animation
 * Creates typewriter effect for text elements
 */
class TypeWriter {
    constructor(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        if (!this.element) return;

        this.options = {
            strings: options.strings || ['Hello World'],
            typeSpeed: options.typeSpeed || 100,
            backSpeed: options.backSpeed || 50,
            backDelay: options.backDelay || 2000,
            loop: options.loop !== false,
            cursor: options.cursor !== false,
            ...options
        };

        this.stringIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;

        if (this.options.cursor) {
            this.element.style.borderRight = '2px solid currentColor';
            this.element.style.paddingRight = '5px';
            this.element.style.animation = 'blink 0.7s infinite';

            // Add blink animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes blink {
                    0%, 100% { border-color: currentColor; }
                    50% { border-color: transparent; }
                }
            `;
            document.head.appendChild(style);
        }

        this.type();
    }

    type() {
        const currentString = this.options.strings[this.stringIndex];

        if (this.isDeleting) {
            this.element.textContent = currentString.substring(0, this.charIndex - 1);
            this.charIndex--;
        } else {
            this.element.textContent = currentString.substring(0, this.charIndex + 1);
            this.charIndex++;
        }

        let typeSpeed = this.isDeleting ? this.options.backSpeed : this.options.typeSpeed;

        if (!this.isDeleting && this.charIndex === currentString.length) {
            typeSpeed = this.options.backDelay;
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIndex === 0) {
            this.isDeleting = false;
            this.stringIndex = (this.stringIndex + 1) % this.options.strings.length;

            if (!this.options.loop && this.stringIndex === 0) {
                return;
            }
        }

        setTimeout(() => this.type(), typeSpeed);
    }
}

/**
 * Counter Animation
 * Animates numbers counting up
 */
class CounterAnimation {
    constructor(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        if (!this.element) return;

        this.options = {
            start: options.start || 0,
            end: options.end || parseInt(this.element.textContent) || 100,
            duration: options.duration || 2000,
            prefix: options.prefix || '',
            suffix: options.suffix || '',
            separator: options.separator || ',',
            ...options
        };

        this.setupObserver();
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animate();
                    observer.unobserve(this.element);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(this.element);
    }

    animate() {
        const startTime = performance.now();
        const startValue = this.options.start;
        const endValue = this.options.end;
        const duration = this.options.duration;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

            this.element.textContent = this.options.prefix +
                this.formatNumber(currentValue) +
                this.options.suffix;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.options.separator);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ParticleSystem,
        GradientAnimation,
        FloatingShapes,
        TypeWriter,
        CounterAnimation
    };
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Auto-init particles canvas if exists
    const particlesCanvas = document.getElementById('particles-canvas');
    if (particlesCanvas) {
        window.particleSystem = new ParticleSystem('particles-canvas');
    }

    // Auto-init floating shapes if container exists
    const shapesContainer = document.querySelector('.floating-shapes');
    if (shapesContainer && !shapesContainer.hasChildNodes()) {
        new FloatingShapes(shapesContainer.id);
    }

    // Auto-init counters
    document.querySelectorAll('[data-counter]').forEach(el => {
        new CounterAnimation(el.id, {
            end: parseInt(el.dataset.counter)
        });
    });
});
