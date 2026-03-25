// ==========================================
// 全局缩放引擎 (Systematic Game-Scale)
// ==========================================
let LOGICAL_WIDTH = 2000;  
const LOGICAL_HEIGHT = 900; 

function resizeApp() {
    const app = document.getElementById('app-container');
    const prompt = document.getElementById('orientation-prompt');
    if (!app) return;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 横竖屏拦截
    if (windowHeight > windowWidth) {
        if (prompt) prompt.style.display = 'flex';
        app.style.pointerEvents = 'none';
        return;
    } else {
        if (prompt) prompt.style.display = 'none';
        app.style.pointerEvents = 'auto';
    }

    // 1. 无黑边自适应计算
    const scale = windowHeight / LOGICAL_HEIGHT;
    LOGICAL_WIDTH = windowWidth / scale;

    app.style.width = `${LOGICAL_WIDTH}px`;
    app.style.height = `${LOGICAL_HEIGHT}px`;

    // 2. 核心大招：弃用 transform，改用 zoom
    // 清除可能残留的 transform
    app.style.transform = 'none'; 
    // zoom 会触发浏览器的真实矢量重绘，SVG 和文字将绝对高清
    app.style.zoom = scale;

    // 3. 更新 Canvas 高清渲染
    resizeCanvases();
}

// 提取独立的 Canvas 高清自适应逻辑
function resizeCanvases() {
    // 获取设备物理像素比（Mac/iPhone 通常是 2 或 3）
    const dpr = window.devicePixelRatio || 1; 
    
    const bgCanvas = document.getElementById('crypto-canvas');
    if (bgCanvas) {
        // 赋予真实的物理像素点
        bgCanvas.width = LOGICAL_WIDTH * dpr;
        bgCanvas.height = LOGICAL_HEIGHT * dpr;
        // 【关键修复】锁定 CSS 尺寸，防止画布撑爆屏幕
        bgCanvas.style.width = `${LOGICAL_WIDTH}px`;
        bgCanvas.style.height = `${LOGICAL_HEIGHT}px`;
        // 缩放绘图上下文，抹平坐标系差异
        bgCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); 
    }

    const evalCanvas = document.getElementById('eval-canvas');
    if (evalCanvas) {
        evalCanvas.width = LOGICAL_WIDTH * dpr;
        evalCanvas.height = LOGICAL_HEIGHT * dpr;
        evalCanvas.style.width = `${LOGICAL_WIDTH}px`;
        evalCanvas.style.height = `${LOGICAL_HEIGHT}px`;
        evalCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
}

// 监听事件
window.addEventListener('resize', resizeApp);
window.addEventListener('orientationchange', () => { setTimeout(resizeApp, 100); });
resizeApp();

// ==========================================
// 密码学抽卡系统 - 华丽版动画引擎
// ==========================================

let hairCount = parseInt(localStorage.getItem('cryptoGachaHair')) || 14400;
let fateCount = localStorage.getItem('cryptoGachaFate');
fateCount = fateCount !== null ? parseInt(fateCount) : 100;

let currentQueue = [];
let isAnimating = false;
let currentMaxRarity = 3;
let themeRGB = "74, 107, 140";
let currentRevealIndex = 0;
let isSequentialReveal = false;

let pullHistory = JSON.parse(localStorage.getItem('cryptoGachaHistory') || '[]');

// 读取保底与抽卡总数
const stats = JSON.parse(localStorage.getItem('cryptoGachaStats') || '{"pullCount":0,"last5Star":0,"last4Star":0}');
let pullCount = stats.pullCount;
let last5Star = stats.last5Star;
let last4Star = stats.last4Star;

function recordPull(items) {
    const record = {
        timestamp: new Date().toISOString(),
        items: items.map(item => ({
            name: item.name,
            rarity: item.rarity,
            path: item.path
        })),
        totalPulls: pullCount
    };
    
    pullHistory.unshift(record);
    if (pullHistory.length > 50) pullHistory.pop();  // 只保留最近50条
    
    localStorage.setItem('cryptoGachaHistory', JSON.stringify(pullHistory));
    localStorage.setItem('cryptoGachaStats', JSON.stringify({
        pullCount,
        last5Star,
        last4Star
    }));
}

// ==========================================
// 加载动画 - 3D晶格系统
// ==========================================
const evalCanvas = document.getElementById('eval-canvas');
const evalCtx = evalCanvas.getContext('2d');
let latticeNodes = [];
let floatTexts = [];
let isEvaluating = false;
let evalSuccessPhase = false;
let evalAngleX = 0, evalAngleY = 0, bgRotation = 0;
let evalAnimationId = null;

class LatticeNode {
    constructor() {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = Math.random() * 100 + 250;
        this.baseX = r * Math.sin(phi) * Math.cos(theta);
        this.baseY = r * Math.sin(phi) * Math.sin(theta);
        this.baseZ = r * Math.cos(phi);
        this.x = this.baseX;
        this.y = this.baseY;
        this.z = this.baseZ;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    update(time) {
        const breathe = Math.sin(time * 0.001 + this.pulsePhase) * 10;
        const scale = 1 + breathe * 0.002;
        this.x = this.baseX * scale;
        this.y = this.baseY * scale;
        this.z = this.baseZ * scale;
    }
}

function initEvalCanvas() {
    latticeNodes = Array.from({ length: 80 }, () => new LatticeNode());
    floatTexts = [];
}

function drawEvalCanvas(time = 0) {
    if (!isEvaluating) return;
    
    evalCtx.fillStyle = 'rgba(2, 3, 6, 0.2)';
    evalCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    const cx = LOGICAL_WIDTH / 2;
    const cy = LOGICAL_HEIGHT / 2;
    
    if (evalSuccessPhase) {
        evalAngleY += 0.008;
        evalAngleX += 0.004;
    } else {
        evalAngleY += 0.002;
        evalAngleX += 0.001;
    }
    
    bgRotation += 0.001;
    
    // 绘制背景圆环
    evalCtx.save();
    evalCtx.translate(cx, cy);
    evalCtx.rotate(bgRotation);
    
    for (let i = 0; i < 3; i++) {
        evalCtx.beginPath();
        evalCtx.arc(0, 0, 300 + i * 50, 0, Math.PI * 2);
        evalCtx.strokeStyle = evalSuccessPhase 
            ? `rgba(${themeRGB}, ${0.15 - i * 0.03})` 
            : `rgba(255, 255, 255, ${0.03 - i * 0.01})`;
        evalCtx.lineWidth = 1;
        evalCtx.setLineDash([10, 30, 5, 30]);
        evalCtx.stroke();
    }
    evalCtx.restore();
    
    // 计算投影
    const cosX = Math.cos(evalAngleX), sinX = Math.sin(evalAngleX);
    const cosY = Math.cos(evalAngleY), sinY = Math.sin(evalAngleY);
    
    let projectedNodes = latticeNodes.map(node => {
        node.update(time);
        
        let y1 = node.y;
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.z * cosY + node.x * sinY;
        let x2 = x1;
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = z1 * cosX + y1 * sinX;
        let scale = 800 / (800 + z2);
        
        return {
            x: cx + x2 * scale,
            y: cy + y2 * scale,
            z: z2,
            scale: scale,
            original: node
        };
    });
    
    // 绘制连接线
    evalCtx.lineWidth = evalSuccessPhase ? 2 : 1;
    for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
            const dx = projectedNodes[i].x - projectedNodes[j].x;
            const dy = projectedNodes[i].y - projectedNodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
                evalCtx.beginPath();
                evalCtx.moveTo(projectedNodes[i].x, projectedNodes[i].y);
                evalCtx.lineTo(projectedNodes[j].x, projectedNodes[j].y);
                
                const alpha = (1 - dist / 150) * (evalSuccessPhase ? 0.8 : 0.4);
                evalCtx.strokeStyle = evalSuccessPhase
                    ? `rgba(${themeRGB}, ${alpha})`
                    : `rgba(100, 150, 255, ${alpha * 0.5})`;
                
                if (evalSuccessPhase) {
                    evalCtx.createRadialGradient = 15;
                    evalCtx.shadowColor = `rgb(${themeRGB})`;
                } else {
                    evalCtx.createRadialGradient = 0;
                }
                
                evalCtx.stroke();
                evalCtx.createRadialGradient = 0;
            }
        }
    }
    
    // 绘制节点
    projectedNodes.forEach((p, idx) => {
        const size = evalSuccessPhase ? 12 : 8;
        
        evalCtx.beginPath();
        evalCtx.arc(p.x, p.y, size * p.scale, 0, Math.PI * 2);
        evalCtx.strokeStyle = evalSuccessPhase 
            ? `rgba(${themeRGB}, ${0.8 * p.scale})` 
            : `rgba(100, 150, 255, ${0.3 * p.scale})`;
        evalCtx.lineWidth = 2 * p.scale;
        evalCtx.stroke();
        
        evalCtx.beginPath();
        evalCtx.arc(p.x, p.y, 4 * p.scale, 0, Math.PI * 2);
        if (evalSuccessPhase) {
            evalCtx.fillStyle = '#fff';
            evalCtx.createRadialGradient = 25 * p.scale;
            evalCtx.shadowColor = `rgb(${themeRGB})`;
        } else {
            evalCtx.fillStyle = p.z < 0 ? '#4a90e2' : '#9013fe';
            evalCtx.createRadialGradient = 8;
            evalCtx.shadowColor = evalCtx.fillStyle;
        }
        evalCtx.fill();
        evalCtx.createRadialGradient = 0;
    });
    
    // 浮动文字
    if (!evalSuccessPhase && Math.random() < 0.06) {
        const randomNode = projectedNodes[Math.floor(Math.random() * projectedNodes.length)];
        floatTexts.push({
            text: EVAL_PHRASES[Math.floor(Math.random() * EVAL_PHRASES.length)],
            x: randomNode.x,
            y: randomNode.y,
            life: 1.0,
            isSuccess: false,
            velocityY: -1.5
        });
    }
    
    if (evalSuccessPhase && Math.random() < 0.5) {
        const randomNode = projectedNodes[Math.floor(Math.random() * projectedNodes.length)];
        const successMsg = currentMaxRarity === 5 ? "★★★★★ CCF-A ACCEPTED" 
            : (currentMaxRarity === 4 ? "★★★★ CCF-B VERIFIED" : "⚠️ FATAL OOM");
        floatTexts.push({
            text: successMsg,
            x: randomNode.x,
            y: randomNode.y,
            life: 1.0,
            isSuccess: true,
            velocityY: -2
        });
    }
    
    // 绘制浮动文字
    evalCtx.font = "bold 13px 'JetBrains Mono'";
    for (let i = floatTexts.length - 1; i >= 0; i--) {
        let t = floatTexts[i];
        const textWidth = evalCtx.measureText(t.text).width;
        
        evalCtx.fillStyle = `rgba(5, 8, 20, ${t.life * 0.9})`;
        evalCtx.fillRect(t.x - textWidth/2 - 10, t.y - 15, textWidth + 20, 20);
        
        evalCtx.fillStyle = t.isSuccess 
            ? `rgba(${themeRGB}, ${t.life})` 
            : (t.text.includes('❌') ? `rgba(255, 80, 80, ${t.life})` : `rgba(200, 200, 255, ${t.life})`);
        evalCtx.textAlign = 'center';
        evalCtx.fillText(t.text, t.x, t.y);
        
        t.y += t.velocityY;
        t.life -= 0.015;
        
        if (t.life <= 0) floatTexts.splice(i, 1);
    }
    
    evalAnimationId = requestAnimationFrame((t) => drawEvalCanvas(t));
}

// ==========================================
// 粒子特效系统
// ==========================================
class CardParticles {
    constructor(container, rarity) {
        this.container = container;
        this.rarity = rarity;
        this.particles = [];
        this.colors = this.getColorsByRarity();
        this.init();
    }
    
    getColorsByRarity() {
        switch(this.rarity) {
            case 5: return ['#FFD700', '#FFA500', '#FFEC8B', '#D4AF37'];
            case 4: return ['#C39BD3', '#9B59B6', '#E8D5F2', '#8E44AD'];
            default: return ['#5D6D7E', '#34495E', '#85C1E9', '#2E4053'];
        }
    }
    
    init() {
        const particleCount = this.rarity === 5 ? 50 : (this.rarity === 4 ? 30 : 15);
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle();
        }
    }
    
    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 6 + 2;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 4;
        const duration = Math.random() * 3 + 3;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            left: ${left}%;
            bottom: -10px;
            box-shadow: 0 0 ${size * 2}px ${color};
            animation: particle-float ${duration}s ease-out ${delay}s infinite;
            opacity: 0;
        `;
        
        this.container.appendChild(particle);
        this.particles.push(particle);
    }
    
    destroy() {
        this.particles.forEach(p => p.remove());
        this.particles = [];
    }
}

// ==========================================
// 抽卡核心逻辑
// ==========================================
function updateResources(cost) {
    fateCount -= cost;
    if (fateCount < 0) {
        hairCount += fateCount * 160;
        fateCount = 0;
    }
    localStorage.setItem('cryptoGachaHair', hairCount);
    localStorage.setItem('cryptoGachaFate', fateCount);
    animateNumber('hair-count', hairCount);
    animateNumber('fate-count', fateCount);
}

function updateUI() {
    // 1. 即时更新抽卡总数（引入数字滚动动画，视觉反馈更强）
    animateNumber('pull-count', pullCount);
    
    // 2. 更新保底显示
    const pityDisplay = document.getElementById('pity-display');
    const pityCount = document.getElementById('pity-count');
    if (pityDisplay && pityCount) {
        pityDisplay.style.display = 'flex';
        pityCount.innerText = `${last5Star}/90`;
        
        // 动态变更保底数字颜色，并确保重置时（抽到5星归零）能恢复默认样式
        if (last5Star >= 70) {
            pityCount.style.color = 'var(--star-5)';
            pityCount.style.textShadow = '0 0 10px var(--star-5)';
        } else if (last5Star >= 50) {
            pityCount.style.color = 'var(--star-4)';
            pityCount.style.textShadow = 'none';
        } else {
            pityCount.style.color = '#ffffff'; // 重置为默认白色
            pityCount.style.textShadow = 'none';
        }
    }
}

// 增强容错：确保元素即使初始化时没有数字也不会报错
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const rawText = element.innerText.replace(/,/g, '');
    const startValue = parseInt(rawText) || 0; 
    const duration = 500;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
        element.innerText = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// 替换原有的 rollSingle 函数
function rollSingle() {
    pullCount++;
    last5Star++;
    last4Star++;
    
    // 硬保底90抽必出5星
    if (last5Star >= 90) {
        last5Star = 0;
        last4Star = 0;
        return generateItem(5);
    }
    
    // 10抽必出4星或以上
    if (last4Star >= 10) {
        last4Star = 0;
        return generateItem(Math.random() < 0.5 ? 4 : 5);
    }
    
    // 软保底：50抽后5星概率提升至2%
    let fiveStarRate = last5Star >= 50 ? 0.02 : RARITY_RATES[5];
    let fourStarRate = RARITY_RATES[4];
    
    const r = Math.random();
    let rarity;
    
    if (r < fiveStarRate) {
        rarity = 5;
        last5Star = 0;
        last4Star = 0;
    } else if (r < fiveStarRate + fourStarRate) {
        rarity = 4;
        last4Star = 0;
    } else if (r < fiveStarRate + fourStarRate + RARITY_RATES[3]) {
        rarity = 3;
    } else if (r < fiveStarRate + fourStarRate + RARITY_RATES[3] + RARITY_RATES[2]) {
        rarity = 2;
    } else {
        rarity = 1;
    }
    
    return generateItem(rarity);
}

function generateItem(rarity) {
    const pool = POOLS[rarity];
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { ...item, rarity, pullNumber: pullCount };
}

window.startWarp = function(count) {
    if (isAnimating) return;
    const today = new Date().toDateString();
    let dailyRecord = JSON.parse(localStorage.getItem('dailyPulls') || '{"date":"","count":0}');
    
    // 如果日期不是今天，重置当天的计数
    if (dailyRecord.date !== today) {
        dailyRecord = { date: today, count: 0 };
    }
    
    // 检查加上本次抽卡后是否会超过 90 次
    if (dailyRecord.count + count > 90) {
        showNotification(`今日导师额度已耗尽！已投递 ${dailyRecord.count}/90 次，请明日重试。`, "error");
        return;
    }

    if (hairCount + (fateCount * 160) < count * 160) {
        showNotification("算力已彻底枯竭，请立刻睡觉！", "error");
        return;
    }
    
    // 扣除资源的同时，写入当天的总次数
    dailyRecord.count += count;
    localStorage.setItem('dailyPulls', JSON.stringify(dailyRecord));
    
    isAnimating = true;
    updateResources(count);
    currentQueue = [];
    let hasFourStar = false;
    currentMaxRarity = 3;
    
    for (let i = 0; i < count; i++) {
        let item = rollSingle(); // 这里内部更新了 pullCount 和 last5Star
        if (item.rarity >= 4) hasFourStar = true;
        if (item.rarity > currentMaxRarity) currentMaxRarity = item.rarity;
        currentQueue.push(item);
    }
    
    if (count === 10 && !hasFourStar) {
        currentQueue[9] = { ...POOLS[4][Math.floor(Math.random() * POOLS[4].length)], rarity: 4 };
        if (currentMaxRarity < 4) currentMaxRarity = 4;
    }
    
    if (currentMaxRarity === 5) themeRGB = "212, 175, 55";
    else if (currentMaxRarity === 4) themeRGB = "155, 89, 182";
    else themeRGB = "52, 73, 94";
    
    if (count === 10) {
        currentQueue.sort((a, b) => b.rarity - a.rarity);
    }

    // 在抽卡结果生成后立刻更新前端 UI 并同步本地缓存
    updateUI(); 
    localStorage.setItem('cryptoGachaStats', JSON.stringify({
        pullCount,
        last5Star,
        last4Star
    }));
    
    // 统一记录抽卡历史
    recordPull(currentQueue);
    
    // 进入全屏动画阶段
    playWarpCinematic(count);
};

function showNotification(message, type = "info") {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? 'rgba(231, 76, 60, 0.9)' : 'rgba(46, 204, 113, 0.9)'};
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        font-family: 'JetBrains Mono';
        font-weight: bold;
        z-index: 1000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: notification-slide 0.5s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'notification-slide 0.5s ease-out reverse';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function playWarpCinematic(count) {
    const screens = {
        home: document.getElementById('home-screen'),
        loading: document.getElementById('loading-screen'),
        single: document.getElementById('single-result-screen'),
        multi: document.getElementById('multi-result-screen')
    };
    const flash = document.getElementById('flash-overlay');
    
    const bannerGlass = document.querySelector('.banner-glass');
    const bannerArt = document.querySelector('.banner-art');
    const coreCircle = document.querySelector('.core-circle');

    // 1. 抽卡面板剧烈震颤（过载前兆）
    gsap.to(bannerGlass, {
        x: "random(-10, 10)",
        y: "random(-10, 10)",
        duration: 0.05,
        repeat: 12, 
        yoyo: true,
        onComplete: () => gsap.set(bannerGlass, { x: 0, y: 0 })
    });

    // ==========================================
    // 关键技巧：将灯泡脱离玻璃面板，防止其跟随背景一起变透明
    // ==========================================
    bannerArt.style.animation = 'none'; // 停掉 CSS 的悬浮呼吸
    bannerArt.classList.remove('panic-shake-active'); // 清除可能残留的抖动

    // 2. 左侧 UI 文字向左侧“吹飞”
    gsap.to('.banner-content', { 
        opacity: 0, 
        x: -150, 
        duration: 0.6, 
        delay: 0.2, 
        ease: "power2.in" 
    });

    // 3. 安全消散玻璃背景：只将背景颜色和边框变透明，绝对不碰 opacity，以此保护灯泡显示
    gsap.to(bannerGlass, {
        backgroundColor: "rgba(0,0,0,0)",
        borderColor: "rgba(0,0,0,0)",
        boxShadow: "none",
        scale: 1.05,
        duration: 0.8,
        delay: 0.2,
        ease: "power2.in"
    });

    // 4. 灯泡核心暴走放大，就地冲向屏幕中央
    gsap.to(bannerArt, {
        scale: 6,      // 稍微收敛缩放率防止刺破边界
        x: -500,       // 局部左移
        y: 200,        // 局部下移
        rotationZ: -45,
        duration: 1.2,
        delay: 0.2,
        ease: "expo.in"
    });

    // 5. 核心发光变白
    if(coreCircle) {
        gsap.to(coreCircle, { 
            fill: '#ffffff', 
            duration: 1.0, 
            delay: 0.4,
            ease: "power2.in" 
        });
    }

    // 6. 白屏闪光掩护切换 & 镜头对焦过渡
    const flashTl = gsap.timeline({ delay: 0.9 });
    
    flashTl.to(flash, {
        opacity: 1,
        duration: 0.6,
        ease: "power2.in"
    })
    .call(() => {
        // === 此时屏幕完全白屏，后台偷偷进行 DOM 切换 ===
        screens.home.style.display = 'none';
        screens.loading.style.display = 'flex';

        // 【善后工作】：把灯泡塞回原来的玻璃面板里，并清除所有强制加上的内联样式
        bannerArt.style.animation = ''; 
        gsap.set(bannerArt, { clearProps: "all" });
        gsap.set(bannerGlass, { clearProps: "all" });
        gsap.set('.banner-content', { clearProps: "all" });
        if(coreCircle) gsap.set(coreCircle, { fill: 'url(#core-glow)', clearProps: "all" });

        // 初始化并启动 3D 晶格加载动画
        initEvalCanvas();
        floatTexts = [];
        isEvaluating = true;
        evalSuccessPhase = false;
        drawEvalCanvas();

        // 在白屏下，把 Evaluating 界面设为放大、模糊、透明的状态
        gsap.set('#eval-canvas', { scale: 1.5, filter: "blur(20px)", opacity: 0 });
        gsap.set('#loading-tips', { opacity: 0, y: 40 });
    })
    .to(flash, { opacity: 1, duration: 0.4 }) // 维持白屏死锁
    
    .addLabel("reveal")
    .to('#eval-canvas', {
        scale: 1,
        filter: "blur(0px)",
        opacity: 1,
        duration: 1.2,
        ease: "power3.out"
    }, "reveal") 
    .to(flash, {
        opacity: 0, 
        duration: 1.2, 
        ease: "power2.out"
    }, "reveal") 
    
    // 晶格稳定后，加载提示文字浮现
    .to('#loading-tips', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.2)"
    }, "-=0.6") 
    
    .call(() => {
        // 白屏完全褪去后，等待进入 Success 变色阶段
        setTimeout(() => { evalSuccessPhase = true; }, 1000);
        
        // 打出第二次闪光揭晓抽卡结果
        setTimeout(() => {
            gsap.to(flash, {
                opacity: 1,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    isEvaluating = false;
                    if (evalAnimationId) cancelAnimationFrame(evalAnimationId);
                    screens.loading.style.display = 'none';
                    
                    if (count === 1) {
                        document.getElementById('close-btn').style.display = 'block';
                        isSequentialReveal = false;
                        renderSingle(currentQueue[0], screens.single);
                    } else {
                        document.getElementById('close-btn').style.display = 'none';
                        isSequentialReveal = true;
                        currentRevealIndex = 0;
                        showNextSingleReveal();
                    }
                    
                    // 最终界面展现
                    gsap.to(flash, { opacity: 0, duration: 1.0, ease: "power3.out" });
                }
            });
        }, 2500);
    });
}

// ==========================================
// 结果展示系统
// ==========================================
function showNextSingleReveal() {
    const singleContainer = document.getElementById('single-result-screen');
    const skipBtn = document.getElementById('skip-btn');
    
    if (currentRevealIndex < currentQueue.length) {
        skipBtn.style.display = 'block';
        renderSingle(currentQueue[currentRevealIndex], singleContainer, true);
        currentRevealIndex++;
    } else {
        skipBtn.style.display = 'none';
        singleContainer.style.display = 'none';
        document.getElementById('close-btn').style.display = 'block';
        renderMulti(currentQueue, document.getElementById('multi-result-screen'));
    }
}

window.skipReveal = function(event) {
    if (event) event.stopPropagation();
    
    const singleContainer = document.getElementById('single-result-screen');
    const skipBtn = document.getElementById('skip-btn');
    
    singleContainer.removeEventListener('mousemove', handleCardParallax);
    
    skipBtn.style.display = 'none';
    singleContainer.style.display = 'none';
    document.getElementById('close-btn').style.display = 'block';
    
    renderMulti(currentQueue, document.getElementById('multi-result-screen'));
};

let currentParticles = null;

function renderSingle(item, container, isSequence = false) {
    container.style.display = 'flex';
    container.style.color = COLORS[item.rarity];
    
    document.getElementById('s-path').innerText = `[ ${item.path} ]`;
    document.getElementById('s-name').innerText = item.name;
    document.getElementById('s-desc').innerText = item.desc;
    document.getElementById('s-stars').innerText = '★'.repeat(item.rarity);
    document.getElementById('s-art').innerHTML = item.icon;
    
    const card = document.getElementById('s-card');
    card.style.color = COLORS[item.rarity];

    if (item.rarity >= 5) {
        card.classList.add('ur-breakout');
    } else {
        card.classList.remove('ur-breakout');
    }
    
    if (currentParticles) {
        currentParticles.destroy();
    }
    
    const particlesContainer = card.querySelector('.particles-container') || document.createElement('div');
    particlesContainer.className = 'particles-container';
    if (!card.querySelector('.particles-container')) {
        card.appendChild(particlesContainer);
    }
    currentParticles = new CardParticles(particlesContainer, item.rarity);
    
    gsap.killTweensOf(".single-info, #s-card, .card-art svg");
    
    const tl = gsap.timeline();
    
    tl.fromTo(".single-info",
        { x: -150, opacity: 0, filter: "blur(10px)" },
        { x: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "expo.out" }
    );
    
    tl.fromTo(card,
        { 
            scale: 0.3, 
            opacity: 0, 
            rotationY: -180,
            rotationX: 30
        },
        { 
            scale: 1, 
            opacity: 1, 
            rotationY: -15,
            rotationX: 5,
            duration: 1.4, 
            ease: "elastic.out(1, 0.75)"
        },
        "-=0.6"
    );
    
    tl.fromTo(".card-art svg",
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(2)" },
        "-=0.8"
    );
    
    if (item.rarity >= 4) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, ${COLORS[item.rarity]}40, transparent 70%);
            pointer-events: none;
            z-index: 50;
            opacity: 0;
        `;
        document.body.appendChild(flash);
        
        gsap.to(flash, {
            opacity: 1,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            onComplete: () => flash.remove()
        });
        
        if (item.rarity === 5) {
            gsap.to(container, {
                x: "random(-5, 5)",
                y: "random(-5, 5)",
                duration: 0.05,
                repeat: 10,
                yoyo: true,
                ease: "none"
            });
        }
    }
    
    container.addEventListener('mousemove', handleCardParallax);
    
    container.onclick = (e) => {
        if (e.target.id === 'skip-btn') return;
        container.removeEventListener('mousemove', handleCardParallax);
        
        if (currentParticles) {
            currentParticles.destroy();
            currentParticles = null;
        }
        
        if (isSequence) {
            showNextSingleReveal();
        } else {
            resetToHome();
        }
    };
}

// 在外部声明缓存
const cachedCard = document.getElementById('s-card');
const cachedGlare = document.getElementById('s-glare');

function handleCardParallax(e) {
    // 直接使用缓存的 DOM 节点
    const rect = cachedCard.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 20;
    const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * 20;
    
    cachedCard.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    
    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
    const percentY = ((e.clientY - rect.top) / rect.height) * 100;
    cachedCard.style.setProperty('--mouse-x', percentX + '%');
    cachedCard.style.setProperty('--mouse-y', percentY + '%');
    
    cachedGlare.style.opacity = 0.6;
}

function renderMulti(items, container) {
    container.style.display = 'flex';
    const grid = document.getElementById('multi-grid');
    grid.innerHTML = '';
    
    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'multi-card';
        card.style.color = COLORS[item.rarity];
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="mc-art">${item.icon}</div>
            <div class="mc-path">${item.path}</div>
            <div class="mc-name" style="color: ${item.rarity >= 4 ? COLORS[item.rarity] : '#fff'}">${item.name}</div>
            <div class="mc-stars">${'★'.repeat(item.rarity)}</div>
        `;
        
        grid.appendChild(card);
    });
    
    gsap.fromTo(".multi-card",
        { 
            z: -800, 
            opacity: 0, 
            rotationY: 90,
            scale: 0.5
        },
        { 
            z: 0, 
            opacity: 1, 
            rotationY: 0,
            scale: 1,
            duration: 1,
            stagger: 0.08,
            ease: "back.out(1.2)"
        }
    );
    
    items.forEach((item, index) => {
        if (item.rarity >= 4) {
            setTimeout(() => {
                const cards = document.querySelectorAll('.multi-card');
                gsap.to(cards[index], {
                    boxShadow: `0 0 60px ${COLORS[item.rarity]}40`,
                    duration: 0.5,
                    yoyo: true,
                    repeat: 3
                });
            }, 1000 + index * 100);
        }
    });

    container.onclick = resetToHome;
}

window.resetToHome = function() {
    const screens = ['single-result-screen', 'multi-result-screen'];
    screens.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    
    document.getElementById('close-btn').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('home-screen').style.display = 'flex';
    
    if (currentParticles) {
        currentParticles.destroy();
        currentParticles = null;
    }
    
    isAnimating = false;
};

// ==========================================
// 初始化
// ==========================================
window.addEventListener('resize', () => {
    if (isEvaluating) initEvalCanvas();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes notification-slide {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes particle-float {
        0% {
            opacity: 0;
            transform: translateY(0) scale(0) rotate(0deg);
        }
        15% {
            opacity: 1;
            transform: translateY(-30px) scale(1) rotate(180deg);
        }
        85% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: translateY(-400px) scale(0.3) rotate(720deg);
        }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    // 初始化右上角资源显示
    document.getElementById('hair-count').innerText = hairCount.toLocaleString();
    document.getElementById('fate-count').innerText = fateCount.toLocaleString();
    
    // 初始化保底和已抽次数显示
    updateUI(); 
});

// ==========================================
// 动效扩展：十连抽恐慌模式 (Pre-Submission Panic)
// ==========================================
const premiumBtn = document.querySelector('.btn-warp.premium');
const bannerArt = document.querySelector('.banner-art');
const coreCircle = document.querySelector('.core-circle');
const coreText = document.querySelector('.core-text');
let panicTween;
let textGlitchInterval;

// 令人绝望的报错词库
const panicWords = ["REJECT", "OOM", "TIMEOUT", "LATEX ERR", "SEGFAULT", "NaN"];

if (premiumBtn) {
    premiumBtn.addEventListener('mouseenter', () => {
        if (isAnimating) return; 

        clearInterval(textGlitchInterval);
        if (panicTween) panicTween.kill();
        gsap.killTweensOf('.warning-label');

        // 1. 使用安全的 CSS 类替代 GSAP 坐标动画，彻底解决脱位问题！
        bannerArt.classList.add('panic-shake-active');

        // 2. 核心文字疯狂轮播报错 (安全修改 SVG 的 attr 属性，字号压低到 65 防止溢出)
        if (coreText) {
            gsap.to(coreText, { fill: '#ff4b4b', attr: { "font-size": 65 }, duration: 0.2 });
            let i = 0;
            textGlitchInterval = setInterval(() => {
                coreText.textContent = panicWords[i % panicWords.length];
                i++;
            }, 80); 
        }

        // 3. 警报标签闪烁
        gsap.to('.warning-label', {
            opacity: 0.3,
            duration: 0.05,
            repeat: -1,
            yoyo: true
        });
    });

    premiumBtn.addEventListener('mouseleave', () => {
        if (isAnimating) return; 

        clearInterval(textGlitchInterval);
        if (panicTween) panicTween.kill();
        gsap.killTweensOf('.warning-label');
        
        // 1. 移除抖动 CSS 类，恢复平滑呼吸
        bannerArt.classList.remove('panic-shake-active');
        
        if (coreCircle) {
            gsap.to(coreCircle, { fill: 'url(#core-glow)', duration: 0.5 });
        }

        // 2. 恢复文字原状 (将 SVG 的 font-size 属性安全恢复到 110)
        if (coreText) {
            gsap.to(coreText, { fill: '#1a1a1a', attr: { "font-size": 110 }, duration: 0.3 });
            coreText.textContent = "NaN";
        }

        gsap.set('.warning-label', { clearProps: 'opacity' });
    });
}

// ==========================================
// 创世级 (UR) 工业过场引擎
// ==========================================
function playURCinematic(onCompleteCallback) {
    const urScreen = document.getElementById('ur-cinematic-screen');
    const terminal = document.getElementById('ur-terminal');
    const genesisFlash = document.getElementById('ur-genesis-flash');
    
    // 隐藏其他界面
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'none';
    
    urScreen.style.display = 'flex';
    terminal.innerHTML = "";
    
    // 打字机内容池
    const bootLines = [
        "[SYS] INITIALIZING ALAN TURING ARCHITECTURE...",
        "[SYS] BYPASSING NP-HARD BARRIER...",
        "   > FACTORING LARGE PRIMES: [SUCCESS]",
        "   > RESOLVING DISCRETE LOGARITHM: [SUCCESS]",
        "   > COLLAPSING QUANTUM STATES...",
        "[WARN] SINGULARITY EVENT IMMINENT.",
        "[WARN] PREPARE FOR GENESIS REVEAL."
    ];

    const tl = gsap.timeline();

    // 1. 终端淡入
    tl.to(terminal, { opacity: 1, duration: 0.5 });

    // 2. 模拟命令行逐行极速打字
    let delayAccumulator = 0.5;
    bootLines.forEach((line, index) => {
        tl.call(() => {
            const p = document.createElement('div');
            p.textContent = line;
            terminal.appendChild(p);
            
            // 微微的荧光闪烁效果
            gsap.fromTo(p, { opacity: 0.2 }, { opacity: 1, duration: 0.1, yoyo: true, repeat: 2 });
        }, null, delayAccumulator);
        delayAccumulator += random(0.2, 0.5); // 随机打字延迟，更有黑客感
    });

    // 3. 乱码抖动坍缩
    tl.to(terminal, {
        scale: 0.9,
        filter: "blur(4px)",
        x: "random(-10, 10)",
        y: "random(-10, 10)",
        duration: 0.8,
        ease: "power4.in"
    }, delayAccumulator);

    // 4. 创世大闪光 (核爆级)
    tl.to(genesisFlash, {
        opacity: 1,
        duration: 0.1,
        ease: "power4.out"
    }, delayAccumulator + 0.8)
    .to(urScreen, { backgroundColor: "#FFF", duration: 0 }) // 底色切白
    .call(() => {
        terminal.style.display = "none"; // 隐藏字
    })
    .to(genesisFlash, {
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => {
            urScreen.style.display = 'none';
            // === 这里调用你展示最终卡面的函数 ===
            if(onCompleteCallback) onCompleteCallback();
        }
    }, "+=0.3"); // 维持白屏 0.3 秒后淡出
}

// 辅助：获取随机数
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// ==========================================
// 密码学牛马 // 独立解耦测试后门 (Gacha Debugger)
// ==========================================

window.GachaDebug = {
    /**
     * 1. 全图鉴单测模式
     * 原理：拦截并伪造一条包含 POOLS 中所有卡片的历史记录，
     * 利用现有的 viewHistoryCard 逻辑进行 3D 渲染测试，不污染抽卡计数器。
     */
    showAllCards: function() {
        if (typeof POOLS === 'undefined') {
            console.error("[DEBUG] 找不到 POOLS 数据，请确保 data.js 已加载。");
            return;
        }

        const allItems = [];
        // 遍历 5星 到 1星 所有卡片
        for (let rarity = 5; rarity >= 1; rarity--) {
            if (!POOLS[rarity]) continue;
            POOLS[rarity].forEach(item => {
                allItems.push({
                    name: item.name,
                    rarity: rarity,
                    path: item.path
                });
            });
        }

        // 伪造一条超级历史记录
        const fakeRecord = {
            timestamp: new Date().toISOString(),
            items: allItems,
            totalPulls: "DEBUG_MODE"
        };

        // 备份原有记录并注入测试记录
        this._backupHistory = localStorage.getItem('cryptoGachaHistory');
        localStorage.setItem('cryptoGachaHistory', JSON.stringify([fakeRecord]));

        // 唤起历史面板
        if (typeof renderHistory === 'function') {
            renderHistory();
            document.getElementById('history-modal').style.display = 'flex';
            console.log(`%c[DEBUG] 已成功注入 ${allItems.length} 张卡片！请在面板中点击卡片测试 3D 渲染。`, 'color: #00ff41; font-weight: bold;');
        }
    },

    /**
     * 2. 强制十连测试模式
     * 原理：直接劫持 currentQueue 并触发 playWarpCinematic，
     * 不扣除资源，不计入保底，纯视觉流测试。
     * @param {number} rarity - 想要测试的星级 (默认 5)
     */
    forceTenPull: function(rarity = 5) {
        if (typeof isAnimating !== 'undefined' && isAnimating) {
            console.warn("[DEBUG] 动画正在进行中，请稍后再试。");
            return;
        }
        
        window.isAnimating = true;
        window.currentQueue = [];
        window.currentMaxRarity = rarity;

        // 塞满 10 张指定星级的卡片
        for (let i = 0; i < 10; i++) {
            const pool = POOLS[rarity];
            const item = pool[Math.floor(Math.random() * pool.length)];
            window.currentQueue.push({ ...item, rarity: rarity });
        }

        // 设置主题色
        if (currentMaxRarity === 5) window.themeRGB = "212, 175, 55";
        else if (currentMaxRarity === 4) window.themeRGB = "155, 89, 182";
        else window.themeRGB = "52, 73, 94";

        console.log(`%c[DEBUG] 强制触发 ${rarity}星 十连动画...`, 'color: #00f0ff; font-weight: bold;');
        
        // 触发过场动画
        if (typeof playWarpCinematic === 'function') {
            playWarpCinematic(10);
        }
    },

    /**
     * 3. 资源无限模式
     */
    infiniteResources: function() {
        window.hairCount = 9999999;
        window.fateCount = 9999;
        localStorage.setItem('cryptoGachaHair', window.hairCount);
        localStorage.setItem('cryptoGachaFate', window.fateCount);
        document.getElementById('hair-count').innerText = window.hairCount.toLocaleString();
        document.getElementById('fate-count').innerText = window.fateCount.toLocaleString();
        console.log("%c[DEBUG] 算力与 DEADLINE 已拉满，导师再也不用担心你的进度了。", 'color: #d4af37;');
    },

    /**
     * 恢复原有历史记录
     */
    restoreHistory: function() {
        if (this._backupHistory) {
            localStorage.setItem('cryptoGachaHistory', this._backupHistory);
            console.log("[DEBUG] 历史记录已恢复。");
        }
    }
};

// 绑定一个隐藏快捷键：在键盘上快速按下 "D" "E" "V" 三个键触发测试面板
let _keys = '';
document.addEventListener('keydown', (e) => {
    _keys += e.key.toLowerCase();
    if (_keys.includes('dev')) {
        GachaDebug.showAllCards();
        GachaDebug.infiniteResources();
        _keys = ''; // 重置
    }
    if (_keys.length > 5) _keys = _keys.slice(-5);
});