import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);

// Global variables
let scene, camera, renderer, particles, animationId;
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
    initJennyGreeting();
    initSkillsProgress();
    initAchievements();
    initQualification();
    initSkillsTitleReveal();
    initProjectCards();
    initContactForm();
    initTypewriter();
    initContactCta();
    initContactTitleReveal();
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
    animationId = null; // null = no frame queued
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Build the wireframe room the camera sits inside
    createInteractivePlayground();
    
    // Position camera
    camera.position.set(0, 0, ROOM.cameraZ);
    camera.rotation.order = 'YXZ'; // yaw (look left/right) first, then pitch (up/down)
    
    // Animation loop (paused while the hero is off screen)
    const hero = document.getElementById('home');
    if (hero) {
        new IntersectionObserver((entries) => {
            heroVisible = entries[0].isIntersecting;
            if (heroVisible) requestRender();
        }).observe(hero);
        initLookPad();
    }
    animate(); // first frame; after this it only renders while the view is moving

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function createInteractivePlayground() {
    // Create cyberpunk grid
    createCyberGrid();
}

// The hero is the inside of a wireframe cube: six grid walls plus brighter edges. The camera stands
// inside it (a little back from the middle) and the mouse turns your head: look left, right, up and
// down to see the other walls, the floor and the ceiling.
const ROOM = { half: 10, divisions: 12, major: 4, cameraZ: 4, maxYaw: 1.3, maxPitch: 0.95, padYawSpeed: 1.7, padPitchSpeed: 1.2 };
let heroVisible = true;
let lookYaw = 0, lookPitch = 0;         // where the camera is looking right now (eased)
let targetYaw = 0, targetPitch = 0;     // where the look pad wants it to look
const stick = { x: 0, y: 0 };           // look pad deflection, -1..1 (screen y: down is positive)
let lastFrameTime = 0;

function createCyberGrid() {
    const H = ROOM.half;
    const step = (2 * H) / ROOM.divisions;
    const minor = [], major = [];

    // each face: the wall at +/-H on one axis, gridded along the other two axes
    // (the outer ring of lines is skipped here; the cube's edges are drawn separately and brighter)
    for (let k = 1; k < ROOM.divisions; k++) {
        const t = -H + k * step;
        const target = k % ROOM.major === 0 ? major : minor;
        for (const side of [-H, H]) {
            target.push(-H, t, side, H, t, side);   // front/back wall, line along x
            target.push(t, -H, side, t, H, side);   // front/back wall, line along y
            target.push(side, t, -H, side, t, H);   // left/right wall, line along z
            target.push(side, -H, t, side, H, t);   // left/right wall, line along y
            target.push(-H, side, t, H, side, t);   // floor/ceiling, line along x
            target.push(t, side, -H, t, side, H);   // floor/ceiling, line along z
        }
    }

    const make = (points, opacity) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const material = new THREE.LineBasicMaterial({ color: 0xff0080, transparent: true, opacity });
        return new THREE.LineSegments(geometry, material);
    };
    scene.add(make(minor, 0.2));
    scene.add(make(major, 0.45));

    // the twelve edges of the cube
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * H, 2 * H, 2 * H)),
        new THREE.LineBasicMaterial({ color: 0xff2d95, transparent: true, opacity: 0.9 })
    );
    scene.add(edges);

    // far walls fade slightly into the dark, which sells the depth
    scene.fog = new THREE.Fog(0x000000, 12, 38);
}

// Renders only while the view is moving. At rest nothing is queued, so an idle hero costs no CPU.
function animate() {
    animationId = null;
    if (!heroVisible) return; // the observer calls requestRender() when the hero comes back

    const now = performance.now();
    const dt = Math.min((now - lastFrameTime) / 1000 || 0.016, 0.05);
    lastFrameTime = now;

    // holding the look pad off-centre keeps turning the view in that direction
    const stickActive = Math.abs(stick.x) > 0.02 || Math.abs(stick.y) > 0.02;
    if (stickActive) {
        targetYaw = Math.max(-ROOM.maxYaw, Math.min(ROOM.maxYaw, targetYaw - stick.x * ROOM.padYawSpeed * dt));
        targetPitch = Math.max(-ROOM.maxPitch, Math.min(ROOM.maxPitch, targetPitch - stick.y * ROOM.padPitchSpeed * dt));
    }

    // ease toward where the pad wants to look
    lookYaw += (targetYaw - lookYaw) * 0.14;
    lookPitch += (targetPitch - lookPitch) * 0.14;
    const settled = Math.abs(targetYaw - lookYaw) < 0.0004 && Math.abs(targetPitch - lookPitch) < 0.0004;
    if (settled) { lookYaw = targetYaw; lookPitch = targetPitch; }

    camera.rotation.y = lookYaw;
    camera.rotation.x = lookPitch;
    renderer.render(scene, camera);

    if (!settled || stickActive) animationId = requestAnimationFrame(animate);
}

function requestRender() {
    if (animationId === null && heroVisible) {
        lastFrameTime = performance.now();
        animationId = requestAnimationFrame(animate);
    }
}

// The look pad: a small round joystick. Push the knob toward a direction to turn that way (right =
// look right, up = look up); let go and the knob springs back while the view stays where it is.
// Arrow keys work too when the pad is focused. Not shown on phones, where the cube is static.
function initLookPad() {
    const pad = document.getElementById('lookPad');
    const knob = pad && pad.querySelector('.look-pad-knob');
    if (!pad || !knob) return;

    let activeId = null;

    const setKnob = (nx, ny, travel) => {
        pad.style.setProperty('--kx', `${(nx * travel).toFixed(1)}px`);
        pad.style.setProperty('--ky', `${(ny * travel).toFixed(1)}px`);
    };

    const steer = (e) => {
        const r = pad.getBoundingClientRect();
        const travel = r.width / 2 - knob.offsetWidth / 2; // how far the knob may leave the centre
        let dx = e.clientX - (r.left + r.width / 2);
        let dy = e.clientY - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy);
        if (len > travel) { dx = (dx / len) * travel; dy = (dy / len) * travel; }
        stick.x = dx / travel;
        stick.y = dy / travel;
        setKnob(stick.x, stick.y, travel);
        requestRender();
    };

    const release = (e) => {
        if (activeId === null || e.pointerId !== activeId) return;
        activeId = null;
        stick.x = 0; stick.y = 0;
        pad.classList.remove('is-active');
        setKnob(0, 0, 0);
    };

    pad.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        activeId = e.pointerId;
        pad.classList.add('is-active');
        try { pad.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
        steer(e);
    });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === activeId) steer(e); });
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);

    // On phones and touch-only devices the cube is static (the pad is hidden by CSS). If a window is
    // narrowed to that size after the view was turned, put it back in the centre.
    const staticMq = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)');
    const recentre = () => {
        if (!staticMq.matches) return;
        targetYaw = 0; targetPitch = 0;
        stick.x = 0; stick.y = 0;
        requestRender();
    };
    recentre();
    staticMq.addEventListener('change', recentre);

    // keyboard: arrow keys nudge the view
    pad.addEventListener('keydown', (e) => {
        const step = 0.2;
        const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        const m = moves[e.key];
        if (!m) return;
        e.preventDefault();
        targetYaw = Math.max(-ROOM.maxYaw, Math.min(ROOM.maxYaw, targetYaw + m[0]));
        targetPitch = Math.max(-ROOM.maxPitch, Math.min(ROOM.maxPitch, targetPitch + m[1]));
        requestRender();
    });
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    requestRender();
}

// Page-level listeners
function initEventListeners() {
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

// "Let's Work Together": the pink block covering each line slides away as the section scrolls in,
// like the Skills & Expertise title
function initContactTitleReveal() {
    const masks = document.querySelectorAll('.contact-title-mask');
    if (!masks.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(masks, { xPercent: -100 });
        return;
    }

    gsap.to(masks, {
        xPercent: -100,
        duration: 1,
        ease: 'power4.inOut',
        stagger: 0.15,
        scrollTrigger: {
            trigger: '.contact-cta-title',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        }
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

    // Over the hero the nav is larger; it eases down to normal size as the hero scrolls away
    // and stays there. (On phones the nav is a bottom bar and the CSS ignores --nav-scale.)
    const list = document.querySelector('.side-nav-list');
    const hero = document.getElementById('home');
    if (list && hero) {
        const NAV_SCALE_HERO = 2.1;
        const setScale = (p) => list.style.setProperty('--nav-scale', (NAV_SCALE_HERO - (NAV_SCALE_HERO - 1) * p).toFixed(3));
        setScale(0);
        ScrollTrigger.create({
            start: 0,
            end: () => hero.offsetHeight * 0.9,
            scrub: true,
            onUpdate: (self) => setScale(self.progress),
            onRefresh: (self) => setScale(self.progress)
        });

        // Each link has a black pill behind it over the hero. Once the hero is mostly scrolled
        // away the pills collapse toward the right edge, top to bottom, and re-expand on the way back.
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const collapse = gsap.to(links, {
            '--nav-bg': 0,
            duration: reduce ? 0 : 0.55,
            ease: 'power3.inOut',
            stagger: reduce ? 0 : 0.06,
            paused: true
        });
        ScrollTrigger.create({
            trigger: hero,
            start: 'bottom 50%',
            onEnter: () => collapse.play(),
            onLeaveBack: () => collapse.reverse()
        });
        collapse.progress(window.scrollY > hero.offsetHeight * 0.5 ? 1 : 0); // page loaded already scrolled
    }
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

// "Hello, I'm Jenny" (the line under PORTFOLIO) detaches from the hero and slides down to the
// About heading as you scroll. A fixed copy follows an interpolated path (hero spot -> About
// heading spot) scrubbed to the scroll, shrinking as it goes; once it reaches the heading it
// hands off to the real, identically styled heading.
function initTitleTravel() {
    const src = document.querySelector('.hero-title');
    const dst = document.getElementById('aboutTitle');
    if (!src || !dst) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        dst.classList.add('landed');
        return;
    }

    const clone = src.cloneNode(true);
    clone.classList.add('title-travel');
    clone.setAttribute('aria-hidden', 'true');
    document.body.appendChild(clone);
    src.style.visibility = 'hidden';

    const cloneLine = clone.querySelector('.title-line');
    const cloneName = clone.querySelector('.title-name');
    let sx = 0, sy = 0, tx = 0, ty = 0, endScroll = 1;
    let lineStart = 0, lineEnd = 0, nameStart = 0, nameEnd = 0;

    // position of an element in the document, ignoring transforms and running animations
    const docPos = (el) => {
        let x = 0, y = 0;
        for (let n = el; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
        return { x, y };
    };
    const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]);

    // sx/sy: where the line sits in the hero; tx/ty: where it must be (viewport coords) at endScroll
    function measure() {
        const start = docPos(src);
        sx = start.x;
        sy = start.y;

        const a = dst.firstElementChild.getBoundingClientRect();
        const tops = Array.from(dst.children).map(el => el.getBoundingClientRect().top);
        const docTop = Math.min(...tops) + window.scrollY;
        endScroll = Math.max(docTop - window.innerHeight * 0.3, 300);
        tx = a.left;
        ty = docTop - endScroll;

        // both words shrink from their hero size to the About heading size
        lineStart = px(src.querySelector('.title-line'), 'fontSize');
        nameStart = px(src.querySelector('.title-name'), 'fontSize');
        lineEnd = px(dst.querySelector('.title-line'), 'fontSize');
        nameEnd = px(dst.querySelector('.title-name'), 'fontSize');
        return endScroll;
    }

    function apply(p) {
        const landed = p >= 0.999;
        gsap.set(clone, { x: sx + (tx - sx) * p, y: sy + (ty - sy) * p });
        cloneLine.style.fontSize = `${lineStart + (lineEnd - lineStart) * p}px`;
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

    // the heading's width changes once the web fonts load, so re-measure then
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
}

// Hovering (or tapping) PORTFOLIO in the hero pops up a small greeting next to the cursor.
// The three messages rotate, so each new hover shows the next one.
function initJennyGreeting() {
    const name = document.querySelector('.hero-portfolio');
    if (!name) return;

    const messages = ['Lovely to see you', 'Welcome to my portfolio', 'I\u2019d love to work with you'];
    let next = 0;
    let hideTimer = null;

    const bubble = document.createElement('div');
    bubble.className = 'jenny-greeting';
    bubble.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bubble);

    gsap.set(bubble, { xPercent: 0, scale: 0.6, transformOrigin: '0% 100%' });
    const moveX = gsap.quickTo(bubble, 'x', { duration: 0.25, ease: 'power3.out' });
    const moveY = gsap.quickTo(bubble, 'y', { duration: 0.25, ease: 'power3.out' });
    // keep the bubble on screen, e.g. when tapping near the right edge of a phone
    const bx = (e) => Math.max(8, Math.min(e.clientX + 16, innerWidth - bubble.offsetWidth - 8));
    const by = (e) => Math.max(8, e.clientY - 44);
    const place = (e) => { moveX(bx(e)); moveY(by(e)); };

    const show = (e) => {
        clearTimeout(hideTimer);
        bubble.textContent = messages[next];
        next = (next + 1) % messages.length;
        gsap.set(bubble, { x: bx(e), y: by(e) });
        gsap.killTweensOf(bubble, 'opacity,scale');
        gsap.to(bubble, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2.2)' });
        // a finger leaves no hover, so let the bubble fade by itself on touch screens
        if (e.pointerType === 'touch') hideTimer = setTimeout(hide, 1600);
    };
    const hide = () => {
        gsap.killTweensOf(bubble, 'opacity,scale');
        gsap.to(bubble, { opacity: 0, scale: 0.6, duration: 0.2, ease: 'power2.in' });
    };

    name.addEventListener('pointerenter', show);
    name.addEventListener('pointermove', place);
    name.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') hide(); });
}

// Achievement cards rise in one after another as the grid scrolls into view
function initAchievements() {
    const cards = document.querySelectorAll('.ach-card');
    if (!cards.length) return;
    gsap.from(cards, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        clearProps: 'transform,opacity',   // hand control back to the CSS hover lift
        scrollTrigger: { trigger: '.ach-grid', start: 'top 85%', once: true }
    });
}

// Certificate cards rise in one after another as the grid scrolls into view
function initQualification() {
    const cards = document.querySelectorAll('.qual-card');
    if (!cards.length) return;
    gsap.from(cards, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        clearProps: 'transform,opacity', // hand control back to the CSS hover lift
        scrollTrigger: { trigger: '.qual-grid', start: 'top 85%', once: true }
    });
}
