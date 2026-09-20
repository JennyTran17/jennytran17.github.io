import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Global variables
let scene, camera, renderer, particles, animationId;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initThreeJS();
    initPreloader();
    initEventListeners();
    // Pinned sections first: they insert scroll spacers that push everything
    // below them (including Skills) further down the page. Anything that
    // measures scroll position for a section after these must run afterward,
    // or it will compute against a too-short document and fire prematurely.
    initManifestoReveal();
    initExperienceGallery();
    initScrollAnimations();
    initSkillsProgress();
    initSkillsTitleReveal();
    initProjectCards();
    initContactForm();
    initSideNav();

    // Refresh after fonts and images settle
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 500);
});

// Manifesto section: pins while scroll progressively colors each word
// white -> pink, left to right; releases the pin once fully colored
function initManifestoReveal() {
    const section = document.querySelector('.manifesto');
    const textEl = document.getElementById('manifestoText');
    if (!section || !textEl) return;

    const words = splitIntoWords(textEl);
    if (!words.length) return;

    // Short pin distance: fills up in roughly 3 scroll actions instead of a long scrub
    ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=650',
        pin: true,
        scrub: 0.3,
        onUpdate: (self) => {
            const progress = self.progress * words.length;
            words.forEach((word, i) => {
                const wordProgress = gsap.utils.clamp(0, 1, progress - i);
                word.style.color = gsap.utils.interpolate('#ffffff', '#ff0080', wordProgress);
            });
        }
    });
}

// Wraps each word of an element's text in its own span, for staggered per-word animation
function splitIntoWords(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    const words = [];
    const parts = text.split(/\s+/);
    parts.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        el.appendChild(span);
        words.push(span);
        if (i < parts.length - 1) {
            el.appendChild(document.createTextNode(' '));
        }
    });
    return words;
}

// Experience gallery: a windowed 3-item carousel. The first item starts active
// at the top slot (no previous item to center against). From the second item
// onward, the track shifts up one slot per step so the active item sits in the
// middle, with the previous item shrinking above it and the next item previewed below.
function initExperienceGallery() {
    const windowEl = document.getElementById('expWindow');
    const track = document.getElementById('expTrack');
    if (!windowEl || !track) return;

    const items = Array.from(track.querySelectorAll('.exp-item'));
    if (!items.length) return;

    // Measure a non-active item so the active item's scale-up doesn't skew the height
    const itemHeight = (items[1] || items[0]).getBoundingClientRect().height;
    windowEl.style.height = `${itemHeight * 3}px`;

    ScrollTrigger.create({
        trigger: '.timeline',
        start: 'top top',
        end: () => `+=${(items.length - 1) * 420}`,
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
            const progress = self.progress * (items.length - 1);
            // No shift while the first item is active (it stays in the top slot);
            // from the second item on, shift up one slot per step to keep it centered
            const offset = Math.max(progress - 1, 0);
            gsap.set(track, { y: -offset * itemHeight });

            // Scale/opacity track the same continuous progress as the track position,
            // so an item only finishes scaling up exactly as it settles into the middle
            items.forEach((item, i) => {
                const distance = Math.min(Math.abs(progress - i), 1);
                gsap.set(item, {
                    scale: gsap.utils.interpolate(1.08, 0.88, distance),
                    opacity: gsap.utils.interpolate(1, 0.4, distance)
                });
                item.classList.toggle('active', distance < 0.05);
            });
        }
    });
}

// Preloader / intro animation
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) {
        initAnimations();
        return;
    }

    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        preloader.remove();
        document.body.classList.remove('is-loading');
        initAnimations();
    };

    // Safety net so the intro can never hang the site if something interrupts the tween
    const fallback = setTimeout(finish, 6000);

    const nameEl = preloader.querySelector('.preloader-name');
    const copyrightEl = preloader.querySelector('.preloader-copyright');
    const roleEl = preloader.querySelector('.preloader-role');
    const markEl = preloader.querySelector('.preloader-mark');
    const topPanel = preloader.querySelector('.preloader-panel--top');
    const bottomPanel = preloader.querySelector('.preloader-panel--bottom');
    const letters = splitIntoLetters(nameEl);

    gsap.set(letters, { yPercent: 140, opacity: 0 });
    gsap.set(copyrightEl, { y: 14, opacity: 0 });
    gsap.set(roleEl, { y: 16, opacity: 0 });

    gsap.timeline({ onComplete: () => { clearTimeout(fallback); finish(); } })
        // Letters float up into place, slowly
        .to(letters, {
            yPercent: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.07,
            ease: 'power3.out'
        })
        .to(copyrightEl, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out'
        }, '-=0.3')
        .to(roleEl, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
        }, '-=0.15')
        .to({}, { duration: 0.7 }) // hold before the reveal
        // Screen splits open at the middle to reveal the page
        .to(topPanel, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 'split')
        .to(bottomPanel, { yPercent: 100, duration: 0.9, ease: 'power4.inOut' }, 'split')
        .to(markEl, { opacity: 0, duration: 0.45, ease: 'power2.out' }, 'split');
}

// Wraps each character of an element's text in its own span for per-letter animation
function splitIntoLetters(el) {
    const text = el.textContent;
    el.textContent = '';
    const letters = [];
    text.split('').forEach(char => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = char === ' ' ? ' ' : char;
        el.appendChild(span);
        letters.push(span);
    });
    return letters;
}

// Three.js 3D Background
function initThreeJS() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create interactive 3D playground
    createInteractivePlayground();
    
    // Position camera
    camera.position.z = 8;
    
    // Animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function createInteractivePlayground() {
    // Create one big interactive cube
    createMainCube();
    
    // Create cyberpunk grid
    createCyberGrid();
}

function createMainCube() {
    // Create one large interactive cube with enhanced materials
    const geometry = new THREE.BoxGeometry(4, 4, 4);
    
    // Create wireframe material with glow effect
    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0080,
        transparent: true,
        opacity: 0.9,
        wireframe: true
    });
    
    // Create solid material for faces
    const faceMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0080,
        transparent: true,
        opacity: 0.3,
        shininess: 100
    });
    
    // Create wireframe cube
    const wireframeCube = new THREE.Mesh(geometry, wireframeMaterial);
    wireframeCube.position.set(0, 0, 0);
    
    // Create solid cube for depth
    const solidCube = new THREE.Mesh(geometry, faceMaterial);
    solidCube.position.set(0, 0, 0);
    
    // Group the cubes
    const mainCube = new THREE.Group();
    mainCube.add(wireframeCube);
    mainCube.add(solidCube);
    
    // Store cube for interaction
    window.mainCube = mainCube;
    scene.add(mainCube);
    
    // Add cube rotation controls
    initCubeControls();
    
    // Add ambient glow
    addCubeGlow();
}

function initCubeControls() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Mouse down event
    document.addEventListener('mousedown', (event) => {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    // Mouse up event
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Mouse move event
    document.addEventListener('mousemove', (event) => {
        if (isDragging && window.mainCube) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };
            
            // Rotate cube based on mouse movement
            window.mainCube.rotation.y += deltaMove.x * 0.01;
            window.mainCube.rotation.x += deltaMove.y * 0.01;
            
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });
    
    // Touch events for mobile
    document.addEventListener('touchstart', (event) => {
        isDragging = true;
        previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    document.addEventListener('touchmove', (event) => {
        if (isDragging && window.mainCube) {
            event.preventDefault();
            const deltaMove = {
                x: event.touches[0].clientX - previousMousePosition.x,
                y: event.touches[0].clientY - previousMousePosition.y
            };
            
            window.mainCube.rotation.y += deltaMove.x * 0.01;
            window.mainCube.rotation.x += deltaMove.y * 0.01;
            
            previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
    });
}

function createCyberGrid() {
    const gridGeometry = new THREE.BufferGeometry();
    const gridMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff0080, 
        transparent: true, 
        opacity: 0.4 
    });
    
    const gridPoints = [];
    const gridSize = 25;
    const gridStep = 1.5;
    
    // Vertical lines
    for (let x = -gridSize; x <= gridSize; x += gridStep) {
        gridPoints.push(x, -15, -15);
        gridPoints.push(x, 15, -15);
        gridPoints.push(x, -15, 15);
        gridPoints.push(x, 15, 15);
    }
    
    // Horizontal lines
    for (let z = -gridSize; z <= gridSize; z += gridStep) {
        gridPoints.push(-25, -15, z);
        gridPoints.push(25, -15, z);
        gridPoints.push(-25, 15, z);
        gridPoints.push(25, 15, z);
    }
    
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    scene.add(grid);
}

function addCubeGlow() {
    // Add point light for cube glow
    const cubeLight = new THREE.PointLight(0xff0080, 2, 20);
    cubeLight.position.set(0, 0, 0);
    scene.add(cubeLight);
    
    // Add ambient light for overall scene
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Add directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xff40a0, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
}

// Removed floating orbs function

function animate() {
    animationId = requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    // Enhanced auto-rotation for the main cube when not being dragged
    if (window.mainCube && !window.isDragging) {
        window.mainCube.rotation.y += 0.008;
        window.mainCube.rotation.x += 0.005;
        window.mainCube.rotation.z += 0.003;
        
        // Add subtle floating motion
        window.mainCube.position.y = Math.sin(time * 0.5) * 0.5;
    }
    
    // Dynamic scene movement based on mouse position with easing
    const targetRotationY = mouseX * 0.00003;
    const targetRotationX = mouseY * 0.00003;
    
    scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.1;
    scene.rotation.x += (targetRotationX - scene.rotation.x) * 0.1;

    renderer.render(scene, camera);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Mouse movement for 3D interaction
function initEventListeners() {
    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// GSAP Animations
function initAnimations() {
    // Hero section animations
    gsap.from('.hero-title .title-line', {
        duration: 1,
        y: 50,
        opacity: 0,
        delay: 0.2,
        ease: 'power3.out'
    });
    
    gsap.from('.hero-title .title-role', {
        duration: 1,
        y: 50,
        opacity: 0,
        delay: 0.6,
        ease: 'power3.out'
    });
    
    gsap.from('.hero-description', {
        duration: 1,
        y: 30,
        opacity: 0,
        delay: 0.8,
        ease: 'power3.out'
    });
    
    gsap.from('.hero-buttons', {
        duration: 1,
        y: 30,
        opacity: 0,
        delay: 1,
        ease: 'power3.out'
    });
    
    // Floating elements animation
    gsap.to('.floating-icon', {
        y: -20,
        rotation: 360,
        duration: 6,
        ease: 'power2.inOut',
        stagger: 1.5,
        repeat: -1,
        yoyo: true
    });
    
    // Logo cube animation
    gsap.to('.logo-cube', {
        rotation: 360,
        duration: 4,
        ease: 'none',
        repeat: -1
    });
}

// Scroll-triggered animations
function initScrollAnimations() {
    // About section animations
    gsap.from('.about-text', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        },
        duration: 1,
        x: -50,
        opacity: 0,
        ease: 'power3.out'
    });
    
    gsap.from('.about-visual', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        },
        duration: 1,
        x: 50,
        opacity: 0,
        ease: 'power3.out'
    });
    
    // Skills section animations
    gsap.from('.skill-group', {
        scrollTrigger: {
            trigger: '.skills',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        },
        duration: 0.8,
        y: 50,
        opacity: 0,
        stagger: 0.2,
        ease: 'power3.out'
    });

    // Contact section animations
    gsap.from('.contact-info', {
        scrollTrigger: {
            trigger: '.contact',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        },
        duration: 1,
        x: -50,
        opacity: 0,
        ease: 'power3.out'
    });
    
    gsap.from('.contact-form', {
        scrollTrigger: {
            trigger: '.contact',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        },
        duration: 1,
        x: 50,
        opacity: 0,
        ease: 'power3.out'
    });

    ScrollTrigger.refresh();
}

// Remove this from initScrollAnimations():
// gsap.set('.project-card', { opacity: 0, y: 50 });
// gsap.to('.project-card', { scrollTrigger: ... })

// Add this new function instead:
function initProjectCards() {
    const cards = document.querySelectorAll('.project-card');

    // Set initial state
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));
}

// Skills section progress bar: fills as the skill list scrolls through the viewport
function initSkillsProgress() {
    const section = document.querySelector('.skills');
    const bar = document.getElementById('skillsProgressBar');
    if (!section || !bar) return;

    ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
            gsap.set(bar, { width: `${self.progress * 100}%` });
        }
    });
}

// Skills heading reveal: a pink block sits over each line and slides right-to-left
// to uncover the text underneath
function initSkillsTitleReveal() {
    const masks = document.querySelectorAll('.skills-title-mask');
    if (!masks.length) return;

    gsap.to(masks, {
        xPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        stagger: 0.15,
        scrollTrigger: {
            trigger: '.skills-title',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        }
    });
}

// Contact form handling
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<span class="loading"></span> Sending...';
        submitBtn.disabled = true;
        
        // Simulate form submission (replace with actual form handling)
        setTimeout(() => {
            // Success animation
            gsap.to(form, {
                duration: 0.5,
                scale: 1.05,
                ease: 'power2.out',
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    // Reset form
                    form.reset();
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    // Show success message
                    showNotification('Message sent successfully!', 'success');
                }
            });
        }, 2000);
    });
}

// Vertical side nav: highlights + scales up the link for the section in view
function initSideNav() {
    const links = document.querySelectorAll('.side-nav-link');
    if (!links.length) return;

    const setActive = (id) => {
        links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
    };

    const sections = Array.from(links)
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
            }
        });
    }, {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    gsap.to(notification, {
        duration: 0.5,
        x: 0,
        ease: 'power2.out'
    });
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        gsap.to(notification, {
            duration: 0.3,
            x: 400,
            ease: 'power2.in',
            onComplete: () => notification.remove()
        });
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            gsap.to(notification, {
                duration: 0.3,
                x: 400,
                ease: 'power2.in',
                onComplete: () => notification.remove()
            });
        }
    }, 5000);
}

// Add CSS for floating cubes and cyberpunk styling
const style = document.createElement('style');
style.textContent = `
    .floating-cube {
        position: absolute;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #ff0080 0%, #ff40a0 100%);
        transform: rotate(45deg);
        opacity: 0.1;
        pointer-events: none;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
    
    /* Cyberpunk scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: var(--bg-primary);
    }
    
    ::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 4px;
        box-shadow: var(--neon-glow);
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-color);
    }
`;
document.head.appendChild(style);

// Enhanced interactive elements
setTimeout(() => {
    // Add typing effect to hero title
    addTypingEffect();
}, 1000);

function addTypingEffect() {
    const titleName = document.querySelector('.title-name');
    if (!titleName) return;
    
    const text = titleName.textContent;
    titleName.textContent = '';
    
    let i = 0;
    const typeInterval = setInterval(() => {
        titleName.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
            clearInterval(typeInterval);
            // Add final glow effect
            gsap.to(titleName, {
                filter: 'drop-shadow(0 0 30px rgba(255, 0, 128, 0.8))',
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    }, 100);
}




