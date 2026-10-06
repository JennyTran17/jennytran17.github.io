import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);

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
    initExperienceTimeline();
    initScrollAnimations();
    initAboutCursor();
    initAboutCursorEntrance();
    initAboutParallax();
    initTitleTravel();
    initSkillsProgress();
    initSkillsTitleReveal();
    initProjectCards();
    initContactForm();
    initTypewriter();
    initFogReveal();
    initContactCta();
    initContactMatrixBg();
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
    const container = document.querySelector('.manifesto-container');
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
            // Subtle parallax drift as the text fills, layering it against the
            // About section and marquee that scroll past before it
            if (container) {
                gsap.set(container, { y: -30 * self.progress });
            }
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

// Experience timeline: a horizontal track you click-drag (with momentum). The latest
// experience starts centred; the dot nearest the centre becomes active as you drag.
function initExperienceTimeline() {
    const windowEl = document.getElementById('tlWindow');
    const track = document.getElementById('tlTrack');
    if (!windowEl || !track) return;

    const items = Array.from(track.querySelectorAll('.tl-item'));
    if (!items.length) return;

    let draggable = null;
    let moved = false;

    const itemWidth = () => items[0].getBoundingClientRect().width;
    // Track x that centres item i in the window
    const centerX = (i) => windowEl.clientWidth / 2 - (items[i].offsetLeft + items[i].offsetWidth / 2);

    const updateActive = () => {
        const x = gsap.getProperty(track, 'x');
        const mid = windowEl.clientWidth / 2;
        let best = 0, bestDist = Infinity;
        items.forEach((item, i) => {
            const d = Math.abs(item.offsetLeft + item.offsetWidth / 2 + x - mid);
            if (d < bestDist) { bestDist = d; best = i; }
        });
        items.forEach((item, i) => item.classList.toggle('active', i === best));
    };

    const layout = () => {
        const x0 = windowEl.clientWidth / 2 - itemWidth() / 2;
        // Padding lets the first and last items reach the centre
        track.style.paddingLeft = `${x0}px`;
        track.style.paddingRight = `${x0}px`;
        const minX = centerX(items.length - 1);
        const maxX = centerX(0);
        if (draggable) {
            draggable.applyBounds({ minX, maxX });
            draggable.update();
        }
        return { minX, maxX };
    };

    const { minX, maxX } = layout();
    gsap.set(track, { x: maxX });
    updateActive();

    draggable = Draggable.create(track, {
        type: 'x',
        trigger: windowEl,
        bounds: { minX, maxX },
        edgeResistance: 0.85,
        inertia: true,
        dragClickables: true,
        onPress() { moved = false; layout(); }, // re-measure in case fonts/layout shifted
        onDragStart() { moved = true; windowEl.classList.add('dragging'); },
        onDrag: updateActive,
        onThrowUpdate: updateActive,
        onRelease() { windowEl.classList.remove('dragging'); },
        onThrowComplete: updateActive
    })[0];

    // Clicking a dot glides that event to the centre (ignored when it was really a drag)
    items.forEach((item, i) => {
        item.querySelector('.tl-dot').addEventListener('click', () => {
            if (moved) return;
            gsap.killTweensOf(track);
            gsap.to(track, {
                x: centerX(i),
                duration: 0.9,
                ease: 'power3.out',
                onUpdate: () => { draggable.update(); updateActive(); }
            });
        });
    });

    // Fonts/images finishing late can change widths after init
    window.addEventListener('load', () => { layout(); });
    window.addEventListener('resize', () => {
        const b = layout();
        gsap.set(track, { x: Math.min(Math.max(gsap.getProperty(track, 'x'), b.minX), b.maxX) });
        updateActive();
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
        ScrollTrigger.refresh();
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
    // Create cyberpunk grid
    createCyberGrid();
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

// Removed floating orbs function

function animate() {
    animationId = requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
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

// About section: Miro-style collaborator cursors (name tag + message bubble),
// each gently floating near its paragraph, slightly out of phase with each other
function initAboutCursor() {
    const cursors = document.querySelectorAll('.about-cursor');
    if (!cursors.length) return;

    cursors.forEach((cursor, i) => {
        gsap.to(cursor, {
            y: -10,
            duration: 2.2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.4
        });
    });
}

// Parallax: About Me content drifts at a different rate than the page scroll,
// so it settles into place at a slightly different pace than the Manifesto section below it
function initAboutParallax() {
    const aboutContent = document.querySelector('.about-content');
    if (!aboutContent) return;

    gsap.to(aboutContent, {
        y: -70,
        ease: 'none',
        scrollTrigger: {
            trigger: '.about',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
        }
    });
}

// Each About cursor "pops" in (spring scale + fade) as it scrolls into view,
// matching the entrance style on emilianmisera.com
function initAboutCursorEntrance() {
    const cursors = document.querySelectorAll('.about-cursor');
    cursors.forEach((cursor) => {
        gsap.from(cursor, {
            scale: 0.6,
            opacity: 0,
            duration: 0.7,
            ease: 'back.out(1.7)',
            scrollTrigger: {
                trigger: cursor,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });
}

// Scroll-triggered animations
function initScrollAnimations() {

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

    // Hover: dim the other rows and show a preview card that trails the cursor
    const list = document.querySelector('.projects-list');
    const preview = document.createElement('div');
    preview.className = 'project-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = '<span class="project-preview-tags"></span>';
    document.body.appendChild(preview);
    const pTags = preview.querySelector('.project-preview-tags');

    let tx = 0, ty = 0, px = 0, py = 0, rafId = null;
    const follow = () => {
        px += (tx - px) * 0.15;
        py += (ty - py) * 0.15;
        preview.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
        rafId = requestAnimationFrame(follow);
    };
    const canHover = window.matchMedia('(hover: hover) and (min-width: 1001px)').matches;

    if (canHover) {
        cards.forEach(card => {
            const main = card.querySelector('.project-main');
            main.addEventListener('mouseenter', (e) => {
                list.classList.add('hovering');
                card.classList.add('hovered');
                pTags.innerHTML = card.dataset.tech.split(',')
                    .map(t => `<span>${t}</span>`).join('');
                if (rafId === null) {
                    px = tx = e.clientX;
                    py = ty = e.clientY;
                    follow();
                }
                preview.classList.add('show');
            });
            main.addEventListener('mousemove', (e) => { tx = e.clientX + 150; ty = e.clientY - 30; });
            main.addEventListener('mouseleave', () => {
                list.classList.remove('hovering');
                card.classList.remove('hovered');
                preview.classList.remove('show');
                cancelAnimationFrame(rafId);
                rafId = null;
            });
        });
    }

    // Click a row to extend its info panel downwards; only one open at a time
    cards.forEach(card => {
        const main = card.querySelector('.project-main');
        const panel = card.querySelector('.project-panel');
        main.addEventListener('click', () => {
            const open = !card.classList.contains('active');
            cards.forEach(c => {
                const m = c.querySelector('.project-main');
                const p = c.querySelector('.project-panel');
                c.classList.remove('active');
                m.setAttribute('aria-expanded', 'false');
                p.setAttribute('aria-hidden', 'true');
                p.style.removeProperty('--panel-h');
            });
            if (open) {
                card.classList.add('active');
                main.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden', 'false');
                panel.style.setProperty('--panel-h', panel.firstElementChild.scrollHeight + 'px');
            }
        });
    });
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

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Show loading state
        submitBtn.innerHTML = '<span class="loading"></span> Sending...';
        submitBtn.disabled = true;

        // Actually deliver the message via Formspree (the form's action/method above),
        // instead of just faking success locally
        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            });

            if (response.ok) {
                gsap.to(form, {
                    duration: 0.5,
                    scale: 1.05,
                    ease: 'power2.out',
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        form.reset();
                        showNotification('Message sent successfully!', 'success');
                    }
                });
            } else {
                showNotification('Something went wrong sending your message. Please try emailing me directly.', 'error');
            }
        } catch (err) {
            showNotification('Something went wrong sending your message. Please try emailing me directly.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Contact CTA: keeps the form hidden until "Start the project" is clicked
function initContactCta() {
    const cta = document.getElementById('contactCta');
    const content = document.getElementById('contactContent');
    const btn = document.getElementById('startProjectBtn');
    if (!cta || !content || !btn) return;

    btn.addEventListener('click', () => {
        gsap.to(cta, {
            opacity: 0,
            y: -20,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
                cta.style.display = 'none';
                content.hidden = false;
                gsap.fromTo(content,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        onComplete: () => ScrollTrigger.refresh()
                    }
                );
            }
        });
    });
}

// Contact section background: a pink "digital rain" of code characters, canvas-driven
function initContactMatrixBg() {
    const canvas = document.getElementById('matrixCanvas');
    const section = document.querySelector('.contact');
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    const chars = '01$%#@+=*<>{}[]/\\';
    const fontSize = 16;
    let columns = 0;
    let drops = [];
    let rafId = null;
    let lastFrameTime = 0;
    const frameInterval = 110; // ms between updates - slows the fall + character flicker so it reads clearly

    const resize = () => {
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
        columns = Math.max(1, Math.floor(canvas.width / fontSize));
        drops = new Array(columns).fill(0).map(() => Math.random() * -50);
    };

    const draw = (time = 0) => {
        rafId = requestAnimationFrame(draw);

        if (time - lastFrameTime < frameInterval) return;
        lastFrameTime = time;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 0, 128, 0.8)';
        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

        drops.forEach((y, i) => {
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(char, i * fontSize, y * fontSize);
            if (y * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i] += 0.3;
        });
    };

    resize();
    draw();
    window.addEventListener('resize', () => {
        cancelAnimationFrame(rafId);
        resize();
        draw();
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
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
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





// Statement section: types the phrase, holds, deletes, and loops while on screen
function initTypewriter() {
    const el = document.getElementById('typewriterText');
    const section = document.getElementById('statement');
    if (!el || !section) return;

    // Single source of truth: the hidden full-text copy in index.html
    const ghost = section.querySelector('.statement-ghost');
    const phrase = ghost ? ghost.textContent.trim() : '';
    if (!phrase) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = phrase;
        return;
    }

    let timer = null;
    let i = 0;
    let deleting = false;

    const tick = () => {
        i += deleting ? -1 : 1;
        el.textContent = phrase.slice(0, i);
        let delay = deleting ? 25 : 55 + Math.random() * 45;
        if (!deleting && i === phrase.length) { deleting = true; delay = 2600; }
        else if (deleting && i === 0) { deleting = false; delay = 700; }
        timer = setTimeout(tick, delay);
    };

    new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            if (timer === null) timer = setTimeout(tick, 300);
        } else {
            clearTimeout(timer);
            timer = null;
        }
    }, { threshold: 0.3 }).observe(section);
}

// Hero fog: "BE CREATIVE / BE INTERESTING" is one 3D object hidden under blurry haze. The cursor
// wipes the haze away and the words tilt/parallax toward the pointer. Letters can be grabbed and
// thrown: they collide with (and knock loose) the other letters, float around inside the hero, and
// each one eases back into place 9 seconds after it was last disturbed.
function initFogReveal() {
    const hero = document.getElementById('home');
    const bg = hero && hero.querySelector('.hero-background');
    if (!hero || !bg) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const view = document.createElement('canvas');
    view.className = 'hero-fog';
    view.setAttribute('aria-hidden', 'true');
    bg.appendChild(view);

    const grid = bg.querySelector('.cyber-grid');

    const make = () => document.createElement('canvas');
    const mask = make(), tmp = make(), brush = make();
    const vctx = view.getContext('2d');
    const mctx = mask.getContext('2d');
    const tctx = tmp.getContext('2d');
    const measureCtx = make().getContext('2d');

    const LIFE = 4200;          // ms until a wiped spot is fully fogged again
    const RADIUS = 150;         // wipe radius in css px
    const MAX_POINTS = 700;
    const LINES = ['BE CREATIVE', 'BE INTERESTING'];
    const FLOAT_TIME = 9000;    // ms a disturbed letter floats before returning
    const RETURN_TIME = 1800;   // ms for the ease back into place
    const WAKE_SPEED = 70;      // px/s a moving letter needs to knock a resting one loose

    let W = 0, H = 0, dpr = 1, fs = 0;
    let points = [];
    let letters = [];
    let sprites = {};           // char -> { sharp, blur, w (css px) }
    let last = null;
    let visible = true;
    let userMoved = false;
    let drag = null;            // { L, ox, oy, px, py } while a letter is held
    let lastFrame = 0;
    let mx = 0, my = 0, tx = 0, ty = 0; // eased and target pointer position, -1..1

    const font = (size) => `900 ${size}px Inter, "Helvetica Neue", Arial, sans-serif`;
    const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

    // One pre-rendered sprite per distinct character: solid face + stacked dark side walls,
    // and a blurred copy used for the fogged state
    function spriteFor(ch) {
        if (sprites[ch]) return sprites[ch];
        const size = fs * dpr;
        measureCtx.font = font(size);
        const chW = measureCtx.measureText(ch).width;
        const depth = Math.round(size * 0.16);
        const pad = Math.round(30 * dpr);
        const w = Math.ceil(chW + depth + pad * 2);
        const h = Math.ceil(size * 1.2 + depth + pad * 2);

        const sharp = make(), blur = make();
        sharp.width = blur.width = w;
        sharp.height = blur.height = h;

        const ctx = sharp.getContext('2d');
        ctx.font = font(size);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = w / 2 - depth * 0.4;
        const cy = h / 2 - depth * 0.4;
        for (let d = depth; d >= 1; d--) {
            const t = d / depth;
            ctx.fillStyle = `rgb(${Math.round(150 - 110 * t)}, 0, ${Math.round(70 - 45 * t)})`;
            ctx.fillText(ch, cx + d * 0.8, cy + d * 0.8);
        }
        ctx.fillStyle = '#ff2d95'; // solid face, no outline
        ctx.fillText(ch, cx, cy);

        const bctx = blur.getContext('2d');
        bctx.filter = `blur(${14 * dpr}px)`;
        bctx.drawImage(sharp, 0, 0);
        bctx.filter = 'none';

        sprites[ch] = { sharp, blur, w: chW / dpr };
        return sprites[ch];
    }

    function build() {
        const rect = hero.getBoundingClientRect();
        W = Math.max(1, Math.round(rect.width));
        H = Math.max(1, Math.round(rect.height));
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        [view, mask, tmp].forEach(c => { c.width = W * dpr; c.height = H * dpr; });

        fs = W < 700 ? W * 0.092 : Math.min(W * 0.072, 140);
        sprites = {};
        letters = [];

        // lay each line out centred, one entry per visible character
        measureCtx.font = font(fs);
        const lineH = fs * 1.12;
        LINES.forEach((line, li) => {
            const total = measureCtx.measureText(line).width;
            const y = H * 0.4 + li * lineH;
            [...line].forEach((ch, i) => {
                if (ch === ' ') return;
                const before = measureCtx.measureText(line.slice(0, i)).width;
                const w = measureCtx.measureText(ch).width;
                const hx = W / 2 - total / 2 + before + w / 2;
                const sprite = spriteFor(ch);
                letters.push({
                    ch, line: li, par: li === 0 ? 14 : 26, phase: li * 2 + i * 0.15,
                    hx, hy: y, x: hx, y, vx: 0, vy: 0, rot: 0, vr: 0,
                    k: 1, state: 'home', rs: 0, fx: 0, fy: 0, fr: 0, delay: letters.length * 25, active: 0,
                    sprite, r: Math.max(sprite.w * 0.46, fs * 0.27), hitR: Math.max(sprite.w * 0.5, fs * 0.32)
                });
            });
        });

        // soft brush sprite
        const r = RADIUS * dpr;
        brush.width = brush.height = r * 2;
        const bctx = brush.getContext('2d');
        const grad = bctx.createRadialGradient(r, r, 0, r, r, r);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.45, 'rgba(255,255,255,0.85)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        bctx.fillStyle = grad;
        bctx.fillRect(0, 0, r * 2, r * 2);
    }

    // ---- physics ----------------------------------------------------------------------------
    // drawn position of a letter (includes the pointer parallax/float it has at rest)
    function drawnPos(L, now) {
        const t = reduceMotion ? 0 : now;
        const floatY = Math.sin(t * 0.0009 + L.phase) * 5;
        return { x: L.x + mx * L.par * L.k, y: L.y + (my * L.par + floatY) * L.k };
    }

    function letterAt(x, y, now) {
        for (let i = letters.length - 1; i >= 0; i--) {
            const L = letters[i];
            if (L.state === 'return') continue;   // locked while settling back, so it can't be disturbed
            const p = drawnPos(L, now);
            if (Math.hypot(x - p.x, y - p.y) <= L.hitR) return L;
        }
        return null;
    }

    function wake(L, now) {
        if (L.state === 'free') { L.active = now; return; }
        L.state = 'free';
        L.vx = L.vy = L.vr = 0;
        L.active = now;
    }

    function collide(now) {
        for (let i = 0; i < letters.length; i++) {
            for (let j = i + 1; j < letters.length; j++) {
                const A = letters[i], B = letters[j];
                const aLive = A.state === 'free', bLive = B.state === 'free';
                if (A.state === 'return' || B.state === 'return') continue; // returning letters ignore collisions
                if (!aLive && !bLive) continue;
                let dx = B.x - A.x, dy = B.y - A.y;
                let dist = Math.hypot(dx, dy);
                const minD = A.r + B.r;
                if (dist >= minD) continue;
                if (dist < 0.001) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist = Math.hypot(dx, dy); }
                const nx = dx / dist, ny = dy / dist;

                // a moving letter (or the held one) wakes a letter that is at rest or returning
                const aMove = A.drag || Math.hypot(A.vx, A.vy) > WAKE_SPEED;
                const bMove = B.drag || Math.hypot(B.vx, B.vy) > WAKE_SPEED;
                if (!aLive && bMove && minD - dist > 0.5) wake(A, now);
                else if (!bLive && aMove && minD - dist > 0.5) wake(B, now);
                if (A.state !== 'free' || B.state !== 'free') continue;

                const invA = A.drag ? 0 : 1, invB = B.drag ? 0 : 1, invSum = invA + invB;
                if (!invSum) continue;
                const overlap = minD - dist;
                A.x -= nx * overlap * invA / invSum; A.y -= ny * overlap * invA / invSum;
                B.x += nx * overlap * invB / invSum; B.y += ny * overlap * invB / invSum;

                const rvn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
                if (rvn < 0) {
                    const imp = -(1 + 0.88) * rvn / invSum;
                    A.vx -= imp * invA * nx; A.vy -= imp * invA * ny;
                    B.vx += imp * invB * nx; B.vy += imp * invB * ny;
                    if (-rvn > 25) {
                        A.active = B.active = now;
                        if (!A.drag) A.vr += (Math.random() - 0.5) * 6;
                        if (!B.drag) B.vr += (Math.random() - 0.5) * 6;
                    }
                }
            }
        }
    }

    function step(now) {
        const dt = Math.min((now - lastFrame) / 1000 || 0.016, 0.033);
        lastFrame = now;

        // the held letter follows the pointer; its velocity is what it throws with / hits with
        if (drag) {
            const L = drag.L;
            const targetX = Math.min(Math.max(drag.px - drag.ox, L.r), W - L.r);
            const targetY = Math.min(Math.max(drag.py - drag.oy, L.r), H - L.r);
            const nx = L.x + (targetX - L.x) * Math.min(1, dt * 28);
            const ny = L.y + (targetY - L.y) * Math.min(1, dt * 28);
            const vx = (nx - L.x) / dt, vy = (ny - L.y) / dt;
            L.vx += (vx - L.vx) * 0.5;
            L.vy += (vy - L.vy) * 0.5;
            L.x = nx; L.y = ny;
            L.rot *= 1 - Math.min(1, dt * 8);
            L.k = 0;
            L.active = now;
        }

        for (const L of letters) {
            if (L.state !== 'free' || L.drag) continue;
            L.k += (0 - L.k) * Math.min(1, dt * 6);
            L.vx *= Math.pow(0.75, dt);
            L.vy *= Math.pow(0.75, dt);
            L.vr *= Math.pow(0.7, dt);
            // keep them drifting instead of coming to rest
            if (Math.hypot(L.vx, L.vy) < 25) {
                const a = Math.random() * Math.PI * 2;
                L.vx += Math.cos(a) * 12; L.vy += Math.sin(a) * 12;
            }
            if (Math.abs(L.vr) < 0.3) L.vr += (Math.random() - 0.5) * 0.6;
            L.x += L.vx * dt;
            L.y += L.vy * dt;
            L.rot += L.vr * dt;
        }

        collide(now);

        for (const L of letters) {
            if (L.state === 'free') {
                // bounce off the edges of the hero
                const r = L.r;
                if (L.x < r) { L.x = r; L.vx = Math.abs(L.vx) * 0.85; }
                else if (L.x > W - r) { L.x = W - r; L.vx = -Math.abs(L.vx) * 0.85; }
                if (L.y < r) { L.y = r; L.vy = Math.abs(L.vy) * 0.85; }
                else if (L.y > H - r) { L.y = H - r; L.vy = -Math.abs(L.vy) * 0.85; }

                // 9 seconds after it was last disturbed, a letter heads home
                if (!L.drag && now - L.active > FLOAT_TIME) {
                    L.state = 'return';
                    L.rs = now;
                    L.fx = L.x; L.fy = L.y;
                    L.fr = ((L.rot + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
                }
            } else if (L.state === 'return') {
                const p = Math.min(Math.max((now - L.rs - L.delay) / RETURN_TIME, 0), 1);
                const e = easeInOut(p);
                L.x = L.fx + (L.hx - L.fx) * e;
                L.y = L.fy + (L.hy - L.fy) * e;
                L.rot = L.fr * (1 - e);
                L.k = e;
                if (p >= 1) {
                    L.state = 'home';
                    L.x = L.hx; L.y = L.hy; L.rot = 0; L.k = 1;
                    L.vx = L.vy = L.vr = 0;
                }
            }
        }
    }

    // ---- drawing ----------------------------------------------------------------------------
    function drawLetter(ctx, L, img, now) {
        const t = reduceMotion ? 0 : now;
        const k = L.k;
        const floatY = Math.sin(t * 0.0009 + L.phase) * 5;
        ctx.save();
        ctx.translate((L.x + mx * L.par * k) * dpr, (L.y + (my * L.par + floatY) * k) * dpr);
        ctx.rotate(L.rot + mx * 0.04 * k);
        ctx.transform(1, my * 0.04 * k, -mx * 0.1 * k, 1 - Math.abs(my) * 0.04 * k, 0, 0);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
    }

    function render(now) {
        // ease the pointer
        mx += (tx - mx) * 0.08;
        my += (ty - my) * 0.08;
        if (grid && !reduceMotion) grid.style.translate = `${(-mx * 14).toFixed(1)}px ${(-my * 14).toFixed(1)}px`;

        step(now);

        // age out and paint the wipe mask
        points = points.filter(p => now - p.t < LIFE);
        mctx.clearRect(0, 0, mask.width, mask.height);
        const r = RADIUS * dpr;
        for (const p of points) {
            const age = (now - p.t) / LIFE;
            mctx.globalAlpha = Math.pow(1 - age, 1.4);
            mctx.drawImage(brush, p.x * dpr - r, p.y * dpr - r);
        }
        mctx.globalAlpha = 1;

        // sharp letters, only where the mask is
        tctx.globalCompositeOperation = 'source-over';
        tctx.clearRect(0, 0, tmp.width, tmp.height);
        letters.forEach(L => drawLetter(tctx, L, L.sprite.sharp, now));
        tctx.globalCompositeOperation = 'destination-in';
        tctx.drawImage(mask, 0, 0);

        // fog = haze + blurred letters, holes punched where wiped, then the sharp letters
        vctx.globalCompositeOperation = 'source-over';
        vctx.clearRect(0, 0, view.width, view.height);
        vctx.fillStyle = 'rgba(10, 0, 8, 0.62)';
        vctx.fillRect(0, 0, view.width, view.height);
        vctx.globalAlpha = 0.5;
        letters.forEach(L => drawLetter(vctx, L, L.sprite.blur, now));
        vctx.globalAlpha = 1;
        vctx.globalCompositeOperation = 'destination-out';
        vctx.drawImage(mask, 0, 0);
        vctx.globalCompositeOperation = 'source-over';
        vctx.drawImage(tmp, 0, 0);

        // thrown letters are fully visible; they dissolve back into the fog as they return home
        letters.forEach(L => {
            if (L.k >= 0.999) return;
            vctx.globalAlpha = 1 - L.k;
            drawLetter(vctx, L, L.sprite.sharp, now);
        });
        vctx.globalAlpha = 1;
    }

    function loop(now) {
        if (!visible) return;
        render(now);
        requestAnimationFrame(loop);
    }

    // ---- pointer ----------------------------------------------------------------------------
    function addPoint(x, y, t) {
        points.push({ x, y, t });
        if (points.length > MAX_POINTS) points.shift();
    }

    function wipeTo(x, y, t) {
        if (last) {
            const dx = x - last.x, dy = y - last.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 12) return;
            const steps = Math.floor(dist / 12);
            for (let i = 1; i <= steps; i++) {
                addPoint(last.x + (dx * i) / steps, last.y + (dy * i) / steps, t);
            }
        } else {
            addPoint(x, y, t);
        }
        last = { x, y };
    }

    hero.addEventListener('pointermove', (e) => {
        const rect = view.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        userMoved = true;
        tx = Math.max(-1, Math.min(1, (x / rect.width - 0.5) * 2));
        ty = Math.max(-1, Math.min(1, (y / rect.height - 0.5) * 2));
        wipeTo(x, y, performance.now());
        if (drag) {
            drag.px = x; drag.py = y;
        } else if (e.pointerType === 'mouse') {
            hero.style.cursor = letterAt(x, y, performance.now()) ? 'grab' : '';
        }
    });
    hero.addEventListener('pointerleave', () => {
        last = null;
        if (!drag) { tx = ty = 0; hero.style.cursor = ''; }
    });

    // grab a letter
    hero.addEventListener('pointerdown', (e) => {
        const rect = view.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const now = performance.now();
        const L = letterAt(x, y, now);
        if (!L) return;
        const p = drawnPos(L, now);
        L.x = p.x; L.y = p.y; L.k = 0;      // keep it exactly where it is drawn
        L.state = 'free'; L.drag = true; L.vx = L.vy = L.vr = 0; L.active = now;
        drag = { L, ox: x - L.x, oy: y - L.y, px: x, py: y };
        hero.style.cursor = 'grabbing';
        try { hero.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    });
    const release = () => {
        if (!drag) return;
        const L = drag.L;
        const sp = Math.hypot(L.vx, L.vy);
        if (sp > 2200) { L.vx *= 2200 / sp; L.vy *= 2200 / sp; }   // cap the throw
        L.vr = (Math.random() - 0.5) * 8;
        L.drag = false;
        L.active = performance.now();
        drag = null;
        hero.style.cursor = '';
    };
    hero.addEventListener('pointerup', release);
    hero.addEventListener('pointercancel', release);
    // on touch screens, stop the page from scrolling when the finger starts on a letter
    hero.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        const rect = view.getBoundingClientRect();
        if (t && letterAt(t.clientX - rect.left, t.clientY - rect.top, performance.now())) e.preventDefault();
    }, { passive: false });

    new IntersectionObserver((entries) => {
        const was = visible;
        visible = entries[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(loop);
    }).observe(hero);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { points = []; drag = null; build(); }, 150);
    });

    // A short automatic sweep once the intro is gone, so visitors discover the effect
    function demoSweep() {
        if (userMoved) return;
        const start = performance.now();
        const stepSweep = (now) => {
            if (userMoved) return;
            const s = Math.min((now - start) / 1800, 1);
            const rect = view.getBoundingClientRect();
            wipeTo(rect.width * (0.2 + 0.6 * s), rect.height * (0.45 + 0.1 * Math.sin(s * Math.PI * 3)), now);
            if (s < 1) requestAnimationFrame(stepSweep); else last = null;
        };
        requestAnimationFrame(stepSweep);
    }
    const waitForIntro = () => {
        if (document.body.classList.contains('is-loading')) {
            setTimeout(waitForIntro, 300);
        } else {
            setTimeout(demoSweep, 500);
        }
    };
    waitForIntro();

    // The headline font must be loaded before the letters are rasterised
    const start = () => { build(); requestAnimationFrame(loop); };
    const ready = document.fonts && document.fonts.load ? document.fonts.load('900 100px Inter') : Promise.resolve();
    ready.then(start, start);
}

// "Hello, I'm Jenny" detaches from the hero and glides to the About title as you scroll.
// A fixed copy follows an interpolated path (hero spot -> About title spot) scrubbed to the
// scroll; once it reaches the title it hands off to the real, identically styled heading.
function initTitleTravel() {
    const src = document.querySelector('.hero-text');
    const dst = document.getElementById('aboutTitle');
    const hero = document.getElementById('home');
    if (!src || !dst || !hero) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        dst.classList.add('landed');
        return;
    }

    const clone = src.cloneNode(true);
    clone.classList.add('title-travel');
    clone.setAttribute('aria-hidden', 'true');
    document.body.appendChild(clone);
    src.style.visibility = 'hidden';

    const cloneName = clone.querySelector('.title-name');
    let sx = 0, sy = 0, tx = 0, ty = 0, endScroll = 1, nameStart = 0, nameEnd = 0;

    // sx/sy: where the text sits in the hero; tx/ty: where it must be (viewport coords) at endScroll
    function measure() {
        sx = hero.offsetLeft + src.offsetLeft;
        sy = hero.offsetTop + src.offsetTop;

        const a = dst.firstElementChild.getBoundingClientRect();
        const tops = Array.from(dst.children).map(el => el.getBoundingClientRect().top);
        const docTop = Math.min(...tops) + window.scrollY;
        endScroll = Math.max(docTop - window.innerHeight * 0.3, 300);
        tx = a.left;
        ty = docTop - endScroll;
        // Jenny starts at her hero size and ends at the size of the other word
        nameStart = parseFloat(getComputedStyle(src.querySelector('.title-name')).fontSize);
        nameEnd = parseFloat(getComputedStyle(dst.querySelector('.title-name')).fontSize);
        return endScroll;
    }

    function apply(p) {
        const landed = p >= 0.999;
        gsap.set(clone, { x: sx + (tx - sx) * p, y: sy + (ty - sy) * p });
        cloneName.style.fontSize = `${nameStart + (nameEnd - nameStart) * p}px`;
        clone.style.visibility = landed ? 'hidden' : 'visible';
        dst.classList.toggle('landed', landed);
    }

    ScrollTrigger.create({
        start: 0,
        end: () => measure(),
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress)
    });
    measure();
    apply(0);

    // the title's width changes once the web fonts load, so re-measure then
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
}
