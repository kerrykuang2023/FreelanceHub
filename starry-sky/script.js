/**
 * 炫酷星空动画
 * Starry Sky Animation
 */

class StarrySky {
    constructor() {
        this.canvas = document.getElementById('starCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.meteors = [];
        this.ripples = [];
        this.explosions = [];
        this.mouse = { x: 0, y: 0 };
        this.isRunning = true;
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsTime = 0;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createStars();
        this.bindEvents();
        this.animate(0);
        this.updateStats();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createStars() {
        const starCount = Math.floor((this.canvas.width * this.canvas.height) / 3000);
        this.stars = [];
        
        for (let i = 0; i < starCount; i++) {
            this.stars.push(new Star(this.canvas));
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createStars();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.createRipple(e.clientX, e.clientY);
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.createExplosion(e.clientX, e.clientY);
        });
        
        document.getElementById('toggleAnimation').addEventListener('click', () => {
            this.toggleAnimation();
        });
        
        document.getElementById('addMeteor').addEventListener('click', () => {
            this.addMeteor();
        });
        
        document.getElementById('clearEffects').addEventListener('click', () => {
            this.clearEffects();
        });
    }
    
    createRipple(x, y) {
        if (Math.random() > 0.7) {
            this.ripples.push(new Ripple(x, y));
        }
    }
    
    createExplosion(x, y) {
        this.explosions.push(new Explosion(x, y));
    }
    
    addMeteor() {
        this.meteors.push(new Meteor(this.canvas));
    }
    
    clearEffects() {
        this.ripples = [];
        this.explosions = [];
        this.meteors = [];
    }
    
    toggleAnimation() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('toggleAnimation');
        btn.textContent = this.isRunning ? '暂停动画' : '继续动画';
        if (this.isRunning) {
            this.animate(0);
        }
    }
    
    updateStats() {
        document.getElementById('starCount').textContent = this.stars.length;
    }
    
    animate(currentTime) {
        if (!this.isRunning) return;
        
        // 计算 FPS
        this.frameCount++;
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
            document.getElementById('fps').textContent = this.fps;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制星星
        this.stars.forEach(star => {
            star.update(deltaTime);
            star.draw(this.ctx);
        });
        
        // 随机生成流星
        if (Math.random() < 0.005) {
            this.meteors.push(new Meteor(this.canvas));
        }
        
        // 更新和绘制流星
        this.meteors = this.meteors.filter(meteor => {
            meteor.update(deltaTime);
            meteor.draw(this.ctx);
            return meteor.isActive();
        });
        
        // 更新和绘制涟漪
        this.ripples = this.ripples.filter(ripple => {
            ripple.update(deltaTime);
            ripple.draw(this.ctx);
            return ripple.isActive();
        });
        
        // 更新和绘制爆炸效果
        this.explosions = this.explosions.filter(explosion => {
            explosion.update(deltaTime);
            explosion.draw(this.ctx);
            return explosion.isActive();
        });
        
        requestAnimationFrame((time) => this.animate(time));
    }
}

/**
 * 星星类
 */
class Star {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseOpacity = Math.random() * 0.5 + 0.3;
        this.opacity = this.baseOpacity;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.color = this.getRandomColor();
    }
    
    getRandomColor() {
        const colors = [
            '#ffffff',
            '#ffe9c4',
            '#d4fbff',
            '#ffd4e5',
            '#e8d4ff'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(deltaTime) {
        this.twinklePhase += this.twinkleSpeed;
        this.opacity = this.baseOpacity + Math.sin(this.twinklePhase) * 0.2;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加发光效果
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

/**
 * 流星类
 */
class Meteor {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width + 200;
        this.y = -100;
        this.length = Math.random() * 80 + 50;
        this.speed = Math.random() * 10 + 15;
        this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
        this.opacity = 1;
        this.decay = 0.01;
    }
    
    update(deltaTime) {
        this.x -= Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.opacity -= this.decay;
    }
    
    draw(ctx) {
        if (this.opacity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        const tailX = this.x + Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;
        
        const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        
        // 流星头部发光
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    isActive() {
        return this.opacity > 0 && this.y < this.canvas.height + 100;
    }
}

/**
 * 涟漪类
 */
class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 50;
        this.opacity = 0.6;
        this.growthSpeed = 2;
    }
    
    update(deltaTime) {
        this.radius += this.growthSpeed;
        this.opacity -= 0.01;
    }
    
    draw(ctx) {
        if (this.opacity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = '#64c8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    isActive() {
        return this.opacity > 0;
    }
}

/**
 * 爆炸效果类
 */
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(x, y));
        }
    }
    
    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.isActive();
        });
    }
    
    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
    
    isActive() {
        return this.particles.length > 0;
    }
}

/**
 * 粒子类
 */
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 3 + 1;
        this.opacity = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = this.getRandomColor();
    }
    
    getRandomColor() {
        const colors = ['#ffffff', '#64c8ff', '#ffd700', '#ff6b6b', '#a8e6cf'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.opacity -= this.decay;
    }
    
    draw(ctx) {
        if (this.opacity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isActive() {
        return this.opacity > 0;
    }
}

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    new StarrySky();
});
