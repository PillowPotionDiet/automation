# Hero Section - Background Colors & Animations Guide

This document provides a comprehensive overview of the hero section styling, background colors, gradients, and animations used in the PillowPotion Toolkit landing page. Use this as a reference for implementing similar hero sections across other pages.

---

## Table of Contents
- [HTML Structure](#html-structure)
- [CSS Variables](#css-variables)
- [Background Layers](#background-layers)
- [Gradient Animations](#gradient-animations)
- [Floating Shapes](#floating-shapes)
- [Particle Canvas Animation](#particle-canvas-animation)
- [Text Animations](#text-animations)
- [Button Animations](#button-animations)
- [Complete CSS Code](#complete-css-code)
- [Complete JavaScript Code](#complete-javascript-code)

---

## HTML Structure

```html
<section class="hero">
    <div class="hero-background">
        <canvas id="particles-canvas"></canvas>
        <div class="hero-gradient"></div>
        <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
        </div>
    </div>
    <div class="container">
        <div class="hero-content">
            <!-- Content goes here -->
        </div>
    </div>
</section>
```

---

## CSS Variables

Define these color variables in your `:root`:

```css
:root {
    /* Primary Gradients */
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --success-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);

    /* Neutral Colors */
    --dark: #1a1a2e;
    --dark-light: #16213e;
    --gray: #6c757d;
    --light-gray: #e9ecef;
    --white: #ffffff;

    /* Text Colors */
    --text-primary: #2d3748;
    --text-secondary: #718096;
    --text-light: #a0aec0;

    /* Transitions */
    --transition-fast: 0.2s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.5s ease;

    /* Border Radius */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 20px;
}
```

---

## Background Layers

### 1. Hero Container
```css
.hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding-top: 80px;
    overflow: hidden;
}
```

### 2. Hero Background Container
```css
.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
}
```

### 3. Particles Canvas
```css
#particles-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}
```

---

## Gradient Animations

### Animated Gradient Overlay
```css
.hero-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
        rgba(102, 126, 234, 0.1) 0%,
        rgba(118, 75, 162, 0.1) 50%,
        rgba(240, 147, 251, 0.1) 100%);
    animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.8;
    }
}
```

**Key Features:**
- **Colors**: Purple to violet to pink gradient
- **Opacity**: 0.1 (10% transparency for subtle effect)
- **Animation**: 15-second fade effect
- **Effect**: Creates breathing, pulsing background

---

## Floating Shapes

### Container
```css
.floating-shapes {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
```

### Base Shape Style
```css
.shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: float 20s infinite ease-in-out;
}
```

### Individual Shapes

#### Shape 1 - Purple Gradient
```css
.shape-1 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    top: 10%;
    left: 10%;
    animation-delay: 0s;
}
```

#### Shape 2 - Pink Gradient
```css
.shape-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, #f093fb, #f5576c);
    top: 50%;
    right: 10%;
    animation-delay: 5s;
}
```

#### Shape 3 - Blue Gradient
```css
.shape-3 {
    width: 250px;
    height: 250px;
    background: linear-gradient(135deg, #4facfe, #00f2fe);
    bottom: 20%;
    left: 20%;
    animation-delay: 10s;
}
```

#### Shape 4 - Green Gradient
```css
.shape-4 {
    width: 350px;
    height: 350px;
    background: linear-gradient(135deg, #43e97b, #38f9d7);
    bottom: 10%;
    right: 30%;
    animation-delay: 15s;
}
```

### Float Animation
```css
@keyframes float {
    0%, 100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(30px, -30px) scale(1.1);
    }
    66% {
        transform: translate(-20px, 20px) scale(0.9);
    }
}
```

**Key Features:**
- **Blur**: 80px for soft, dreamy effect
- **Opacity**: 0.5 (50% transparency)
- **Animation**: 20-second floating motion
- **Delays**: Staggered (0s, 5s, 10s, 15s) for organic movement

---

## Particle Canvas Animation

### JavaScript Particle System

#### Color Palette
```javascript
const colors = [
    'rgba(102, 126, 234,',  // Purple
    'rgba(118, 75, 162,',   // Violet
    'rgba(240, 147, 251,',  // Pink
    'rgba(67, 233, 123,'    // Green
];
```

#### Particle Properties
```javascript
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;        // 1-4px
        this.speedX = Math.random() * 1 - 0.5;    // -0.5 to 0.5
        this.speedY = Math.random() * 1 - 0.5;    // -0.5 to 0.5
        this.opacity = Math.random() * 0.5 + 0.2; // 0.2-0.7
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
}
```

#### Particle Count
```javascript
const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
```

#### Connection Lines
```javascript
// Connects particles within 150px
if (distance < 150) {
    const opacity = (1 - distance / 150) * 0.2;
    ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
    ctx.lineWidth = 1;
}
```

**Key Features:**
- **Particle Size**: 1-4px circles
- **Movement**: Slow, random drift
- **Connections**: Lines drawn between nearby particles (<150px)
- **Colors**: Randomly assigned from palette
- **Count**: Responsive (max 100, scales with screen size)

---

## Text Animations

### Gradient Text
```css
.gradient-text {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientFlow 5s ease infinite;
    background-size: 200% 200%;
}

@keyframes gradientFlow {
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
}
```

**Effect**: Animated gradient text with flowing color movement

---

## Button Animations

### Primary Button
```css
.btn-primary {
    background: var(--primary-gradient);
    color: var(--white);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    transition: var(--transition-normal);
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
}
```

### Ripple Effect
```css
.btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
    width: 300px;
    height: 300px;
}
```

---

## Complete CSS Code

```css
/* Hero Section */
.hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding-top: 80px;
    overflow: hidden;
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
}

#particles-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.hero-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
        rgba(102, 126, 234, 0.1) 0%,
        rgba(118, 75, 162, 0.1) 50%,
        rgba(240, 147, 251, 0.1) 100%);
    animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.8;
    }
}

.floating-shapes {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: float 20s infinite ease-in-out;
}

.shape-1 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    top: 10%;
    left: 10%;
    animation-delay: 0s;
}

.shape-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, #f093fb, #f5576c);
    top: 50%;
    right: 10%;
    animation-delay: 5s;
}

.shape-3 {
    width: 250px;
    height: 250px;
    background: linear-gradient(135deg, #4facfe, #00f2fe);
    bottom: 20%;
    left: 20%;
    animation-delay: 10s;
}

.shape-4 {
    width: 350px;
    height: 350px;
    background: linear-gradient(135deg, #43e97b, #38f9d7);
    bottom: 10%;
    right: 30%;
    animation-delay: 15s;
}

@keyframes float {
    0%, 100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(30px, -30px) scale(1.1);
    }
    66% {
        transform: translate(-20px, 20px) scale(0.9);
    }
}

.hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 900px;
    margin: 0 auto;
}

.gradient-text {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientFlow 5s ease infinite;
    background-size: 200% 200%;
}

@keyframes gradientFlow {
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
}
```

---

## Complete JavaScript Code

```javascript
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    // Set canvas size
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', throttle(resizeCanvas, 250));

    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;

            // Random color from gradient palette
            const colors = [
                'rgba(102, 126, 234,',
                'rgba(118, 75, 162,',
                'rgba(240, 147, 251,',
                'rgba(67, 233, 123,'
            ];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Wrap around edges
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.fillStyle = this.color + this.opacity + ')';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Create particles
    function createParticles() {
        const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Connect nearby particles
    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    const opacity = (1 - distance / 150) * 0.2;
                    ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        connectParticles();

        animationId = requestAnimationFrame(animate);
    }

    // Initialize
    createParticles();
    animate();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    });
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Call on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
});
```

---

## Color Palette Summary

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Primary Purple | `#667eea` | `rgb(102, 126, 234)` | Main gradient start, particles |
| Violet | `#764ba2` | `rgb(118, 75, 162)` | Main gradient end, shape-1 |
| Pink Start | `#f093fb` | `rgb(240, 147, 251)` | Secondary gradient start, shape-2 |
| Pink End | `#f5576c` | `rgb(245, 87, 108)` | Secondary gradient end |
| Blue Start | `#4facfe` | `rgb(79, 172, 254)` | Accent gradient start, shape-3 |
| Blue End | `#00f2fe` | `rgb(0, 242, 254)` | Accent gradient end |
| Green Start | `#43e97b` | `rgb(67, 233, 123)` | Success gradient start, shape-4 |
| Green End | `#38f9d7` | `rgb(56, 249, 215)` | Success gradient end |

---

## Animation Timing Summary

| Element | Duration | Delay | Easing | Loop |
|---------|----------|-------|--------|------|
| Gradient Overlay | 15s | 0s | ease | infinite |
| Floating Shapes | 20s | 0s, 5s, 10s, 15s | ease-in-out | infinite |
| Gradient Text | 5s | 0s | ease | infinite |
| Particle Animation | ~60fps | 0s | linear | infinite |
| Button Ripple | 0.6s | 0s | ease | on hover |

---

## Implementation Checklist

- [ ] Copy HTML structure to new page
- [ ] Include CSS variables in stylesheet
- [ ] Add hero section CSS styles
- [ ] Add animation keyframes
- [ ] Include canvas element with ID `particles-canvas`
- [ ] Add JavaScript particle initialization
- [ ] Call `initParticles()` on DOM ready
- [ ] Test responsive behavior
- [ ] Verify animations on different browsers
- [ ] Optimize particle count for performance

---

## Browser Compatibility

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (with -webkit- prefix)
- **Edge**: ✅ Full support
- **IE11**: ⚠️ Partial support (use fallback gradients)

---

## Performance Tips

1. **Reduce particle count on mobile**: Lower the divisor in particle count calculation
2. **Use `will-change`**: Add `will-change: transform` to animated elements
3. **Debounce resize events**: Already implemented with throttle function
4. **Use CSS transforms**: Hardware-accelerated animations
5. **Limit blur radius**: Heavy filter effects can impact performance

---

## Customization Options

### Change Color Scheme
Update the gradient variables in `:root` and the particle color array

### Adjust Animation Speed
Modify the animation duration values (15s, 20s, 5s)

### Change Particle Density
Adjust the divisor in: `(canvas.width * canvas.height) / 15000`

### Modify Shape Sizes
Change width/height values for `.shape-1` through `.shape-4`

### Adjust Blur Intensity
Modify `filter: blur(80px)` value (lower = sharper, higher = softer)

---

**Created**: 2025-12-11
**Version**: 1.0
**Source**: PillowPotion Toolkit - index.html
