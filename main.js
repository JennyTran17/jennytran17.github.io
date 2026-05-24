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
    initAnimations();
    initEventListeners();
    initScrollAnimations();
    initSkillBars();
    initContactForm();
    initMobileMenu();
});

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
    
    // Enhanced Timeline section animations
    gsap.from('.timeline-item', {
        scrollTrigger: {
            trigger: '.timeline',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        },
        duration: 1,
        y: 80,
        opacity: 0,
        stagger: 0.3,
        ease: 'power3.out',
        onComplete: () => {
            // Add glow effect to timeline markers
            gsap.to('.timeline-marker', {
                boxShadow: '0 0 20px var(--primary-color)',
                duration: 0.5,
                stagger: 0.1
            });
        }
    });
    
    // Add parallax effect to timeline
    gsap.to('.timeline-container', {
        scrollTrigger: {
            trigger: '.timeline',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
        },
        y: -100,
        ease: 'none'
    });
    
    // Skills section animations
    gsap.from('.skill-category', {
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
    
    // Projects section animations
    gsap.from('.project-card', {
        scrollTrigger: {
            trigger: '.projects',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        },
        duration: 0.8,
        y: 50,
        opacity: 0,
        stagger: 0.1,
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

// Skill bars animation
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-bar');
    
    skillBars.forEach(bar => {
        const level = bar.getAttribute('data-level');
        gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });

        ScrollTrigger.create({
            trigger: bar,
            start: 'top 90%',
            once: true,
            onEnter: () => {
                gsap.to(bar, {
                    duration: 1.5,
                    scaleX: level / 100,
                    ease: 'power2.out'
                });
            }
        });
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

// Mobile menu functionality
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!hamburger || !navMenu) return;
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Animate hamburger
        const spans = hamburger.querySelectorAll('span');
        if (hamburger.classList.contains('active')) {
            gsap.to(spans[0], { rotation: 45, y: 8, duration: 0.3 });
            gsap.to(spans[1], { opacity: 0, duration: 0.3 });
            gsap.to(spans[2], { rotation: -45, y: -8, duration: 0.3 });
            
            gsap.fromTo(navMenu, 
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
            );
        } else {
            gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
            gsap.to(spans[1], { opacity: 1, duration: 0.3 });
            gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
            
            gsap.to(navMenu, { opacity: 0, y: -20, duration: 0.3 });
        }
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            
            const spans = hamburger.querySelectorAll('span');
            gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
            gsap.to(spans[1], { opacity: 1, duration: 0.3 });
            gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
        });
    });
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




