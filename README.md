# 🚀 Interactive Developer Portfolio Website

A modern, interactive portfolio website built with HTML5, CSS3, JavaScript, Three.js, and GSAP animations. Perfect for software developers and game developers looking to showcase their skills with impressive 3D elements and smooth animations.

## ✨ Features

### 🎨 **Visual Design**
- **Modern & Clean**: Professional design with gradient accents and smooth transitions
- **Responsive Layout**: Fully responsive design that works on all devices
- **Dark/Light Theme**: Elegant color scheme with CSS custom properties
- **Typography**: Beautiful fonts (Inter + JetBrains Mono) for optimal readability

### 🌟 **3D & Interactive Elements**
- **Three.js Background**: Interactive 3D particle system in the hero section
- **Mouse Interaction**: Particles respond to mouse movement for engaging user experience
- **Floating Elements**: Animated icons and 3D cubes throughout the page
- **Perspective Effects**: 3D transforms and depth for modern aesthetics

### 🎭 **Animations & Transitions**
- **GSAP Animations**: Smooth, professional animations using GSAP library
- **Scroll Triggers**: Elements animate as they come into view
- **Staggered Animations**: Sequential animations for visual appeal
- **Hover Effects**: Interactive hover states with smooth transitions

### 📱 **User Experience**
- **Smooth Scrolling**: Seamless navigation between sections
- **Mobile Menu**: Responsive hamburger menu for mobile devices
- **Form Handling**: Interactive contact form with animations
- **Loading States**: Visual feedback for user interactions

### 🛠 **Technical Features**
- **ES6 Modules**: Modern JavaScript with import/export
- **Performance Optimized**: Efficient animations and 3D rendering
- **Cross-browser Compatible**: Works on all modern browsers
- **SEO Optimized**: Proper meta tags and semantic HTML

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone <your-repo-url>
   cd developer-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
developer-portfolio/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── main.js            # JavaScript functionality and 3D graphics
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## 🎨 Customization Guide

### Personal Information
Update the following in `index.html`:

1. **Name and Title**
   ```html
   <span class="title-name">Your Name</span>
   <span class="title-role">Software & Game Developer</span>
   ```

2. **About Section**
   ```html
   <p class="about-intro">
       Your personal introduction here...
   </p>
   ```

3. **Experience**
   ```html
   <div class="experience-item">
       <span class="year">2020 - Present</span>
       <span class="role">Your Role</span>
   </div>
   ```

4. **Contact Information**
   ```html
   <p>your.email@example.com</p>
   <p>linkedin.com/in/yourprofile</p>
   <p>github.com/yourusername</p>
   ```

### Skills & Technologies
Modify the skills section in `index.html`:

```html
<div class="skill-item" data-skill="YourSkill">
    <div class="skill-icon">SK</div>
    <span class="skill-name">Your Skill</span>
    <div class="skill-level">
        <div class="skill-bar" data-level="85"></div>
    </div>
</div>
```

### Projects
Update the projects section with your own work:

```html
<div class="project-card" data-category="web">
    <div class="project-image">
        <!-- Add your project image here -->
        <img src="path/to/your/image.jpg" alt="Project Name">
    </div>
    <div class="project-content">
        <h3>Your Project Name</h3>
        <p>Project description...</p>
        <div class="project-tags">
            <span class="tag">Technology</span>
        </div>
    </div>
</div>
```

### Colors & Styling
Customize the color scheme in `styles.css`:

```css
:root {
    --primary-color: #6366f1;      /* Main brand color */
    --secondary-color: #10b981;    /* Accent color */
    --accent-color: #f59e0b;      /* Highlight color */
    --text-primary: #1f2937;      /* Main text color */
    --bg-primary: #ffffff;         /* Background color */
}
```

### 3D Background
Modify the Three.js particle system in `main.js`:

```javascript
function createParticles() {
    const particleCount = 1000;  // Adjust particle count
    // ... customize particle properties
}
```

## 🔧 Advanced Customization

### Adding New Sections
1. Add HTML structure in `index.html`
2. Style with CSS in `styles.css`
3. Add animations in `main.js`

### Custom Animations
Use GSAP for custom animations:

```javascript
gsap.from('.your-element', {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out'
});
```

### 3D Elements
Add custom Three.js objects:

```javascript
// Create custom geometry
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

## 📱 Responsive Design

The website is fully responsive with breakpoints at:
- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: 480px - 767px
- **Small Mobile**: Below 480px

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📦 Dependencies

- **Three.js**: 3D graphics and WebGL rendering
- **GSAP**: Professional animations and scroll triggers
- **Vite**: Fast development server and build tool

## 🚀 Performance Tips

1. **Optimize Images**: Use WebP format and appropriate sizes
2. **Lazy Loading**: Implement lazy loading for images
3. **Minimize 3D Elements**: Reduce particle count on mobile devices
4. **CSS Optimization**: Use CSS transforms instead of position changes

## 🐛 Troubleshooting

### Common Issues

1. **3D Background Not Showing**
   - Check browser WebGL support
   - Ensure Three.js is properly imported

2. **Animations Not Working**
   - Verify GSAP is installed and imported
   - Check console for JavaScript errors

3. **Mobile Menu Issues**
   - Ensure CSS media queries are correct
   - Check JavaScript event listeners

### Performance Issues

1. **Slow Animations**
   - Reduce particle count in Three.js
   - Optimize GSAP animations

2. **High Memory Usage**
   - Clean up Three.js resources
   - Dispose of unused animations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Three.js** for 3D graphics
- **GSAP** for animations
- **Font Awesome** for icons
- **Google Fonts** for typography

## 📞 Support

If you need help or have questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

---

**Happy Coding! 🎉**

This portfolio website showcases modern web development techniques and provides an excellent foundation for developers to present their skills and projects professionally.
