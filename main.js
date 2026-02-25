import './style.css';

/**
 * ============================================================================
 * Configuration
 * ============================================================================
 * 여기서 마우스 트레일 효과의 느낌을 쉽게 조절할 수 있습니다.
 */
const CONFIG = {
    // 캔버스 & 렌더링 설정
    fadeSpeed: 0.2,                   // 모션 블러가 지워지는 속도 (0.0 ~ 1.0)
    maxParticles: 150,                // 화면에 유지될 최대 파티클 개수 (성능 최적화용)

    // 파티클 생성 설정
    distanceToGenerate: 1000,          // 이 숫자가 클수록, 꽃잎이 더 드문드문 만들어집니다 (밀도 조절)

    // 파티클 외형
    minSize: 10,                      // 파티클 최소 크기
    maxSize: 30,                      // 파티클 최대 크기
    minOpacity: 0.3,                  // 시인성을 위한 최소 투명도
    maxOpacity: 0.8,                  // 겹쳤을 때 예쁜 최대 투명도
    glowBlur: 65,                     // 네온 빛 번짐 강도 (0으로 할 경우 글로우 꺼짐)

    // 움직임 & 물리 엔진
    minSpeed: 0.2,                    // 떨어지는 최소 속도
    maxSpeed: 0.5,                    // 떨어지는 최대 속도
    decayMin: 0.0001,                  // 꽃잎이 흐려지는 속도 최소치 (작을수록 오래 머묾)
    decayMax: 0.003,                  // 꽃잎이 흐려지는 속도 최대치
    angleRotationBase: 0.006,          // 꽃잎이 회전하는 속도 배율
    spreadMultiplier: 15.0,            // 옆으로 퍼지는 확산 배율
};

/**
 * ============================================================================
 * Canvas Setup
 * ============================================================================
 */
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

let width, height;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 초기 화면 크기 동기화

/**
 * ============================================================================
 * State Management (상태 관리)
 * ============================================================================
 */
const particles = [];
let mouse = { x: width / 2, y: height / 2 };
let lastMouse = { x: width / 2, y: height / 2 };
let isHovering = false;

// 브라우저 화면 안에서 마우스가 움직일 때
window.addEventListener('pointermove', (e) => {
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    isHovering = true;

    // 마우스가 이동한 거리 계산
    const dx = mouse.x - lastMouse.x;
    const dy = mouse.y - lastMouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 이동 거리에 비례하여 파티클 생성 개수 결정
    const particlesToGenerate = Math.max(1, Math.floor(distance / CONFIG.distanceToGenerate));

    for (let i = 0; i < particlesToGenerate; i++) {
        const t = i / particlesToGenerate;
        const x = lastMouse.x + dx * t;
        const y = lastMouse.y + dy * t;

        particles.push(new Particle(x, y));
    }
});

// 마우스가 브라우저 밖으로 나갔을 때
window.addEventListener('pointerleave', () => {
    isHovering = false;
});

/**
 * ============================================================================
 * Utilities (유틸리티 함수군)
 * ============================================================================
 */
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// K-Culture Theme: 태극 무늬의 적/청과 오방색의 황금빛 포인트를 반환
function getRandomKCultureColor() {
    const rand = Math.random();

    if (rand < 0.45) {
        // 태극 양 (Soft Red) - 차분한 붉은 톤
        return `hsl(${randomBetween(340, 355)}, 40%, 45%)`;
    } else if (rand < 0.90) {
        // 태극 음 (Soft Blue) - 차분한 푸른 톤
        return `hsl(${randomBetween(215, 230)}, 40%, 45%)`;
    } else {
        // 오방색 포인트 (Soft Gold) - 차분한 황금빛 톤 (약 10% 확률)
        return `hsl(${randomBetween(40, 55)}, 40%, 45%)`;
    }
}

/**
 * ============================================================================
 * Particle Class (꽃잎 파티클 객체 정의)
 * ============================================================================
 */
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        // CONFIG 설정을 바탕으로 랜덤한 고유 속성 배정
        this.size = randomBetween(CONFIG.minSize, CONFIG.maxSize);
        this.angle = randomBetween(0, 360);
        this.speed = randomBetween(CONFIG.minSpeed, CONFIG.maxSpeed);
        this.color = getRandomKCultureColor();
        this.opacity = randomBetween(CONFIG.minOpacity, CONFIG.maxOpacity);
        this.decay = randomBetween(CONFIG.decayMin, CONFIG.decayMax);

        this.life = 1; // 생명력 (1.0에서 시작하여 0.0이 되면 사라짐)
    }

    update() {
        // 회전하며 넓게 퍼져나가는 애니메이션 각도 및 좌표 계산
        this.angle += this.speed * CONFIG.angleRotationBase;
        this.x += Math.sin(this.angle) * this.speed * CONFIG.spreadMultiplier;
        this.y += Math.cos(this.angle) * this.speed * CONFIG.spreadMultiplier;

        // 크기가 줄어들면서 투명해지도록 처리
        this.life -= this.decay;
        this.size *= 0.96;
    }

    draw() {
        ctx.save();

        // 남은 생명력(life)과 고유 투명도(opacity)를 반영
        ctx.globalAlpha = this.life * this.opacity;

        // 꽃잎이 그려질 고유 위치로 원점 이동 후 회전
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 뾰족한 아몬드/꽃잎 형태 그리기
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.quadraticCurveTo(this.size, 0, 0, this.size);
        ctx.quadraticCurveTo(-this.size, 0, 0, -this.size);
        ctx.closePath();

        // 몽환적인 글로우(빛 번짐) 이펙트 적용
        ctx.shadowBlur = CONFIG.glowBlur;
        ctx.shadowColor = this.color;

        // 색상 채우기
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
    }
}

/**
 * ============================================================================
 * Main Animation Loop (핵심 애니메이션 루프)
 * ============================================================================
 */
function animate() {
    // 1. 반투명한 검은색으로 전체 덮기 (이전 프레임의 잔상이 남아 모션 블러 효과 형성)
    ctx.fillStyle = `rgba(15, 15, 18, ${CONFIG.fadeSpeed})`;
    ctx.fillRect(0, 0, width, height);

    // 2. 색상이 겹칠 때 더 영롱하게 빛나도록 Lighter 블렌딩 모드 적용
    ctx.globalCompositeOperation = 'lighter';

    // 3. 파티클 업데이트 및 화면에 그리기
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.update();
        p.draw();

        // 수명이 다했거나 너무 작아진 꽃잎은 배열에서 삭제하여 메모리 관리
        if (p.life <= 0 || p.size <= 0.1) {
            particles.splice(i, 1);
            i--;
        }
    }

    // 4. 마우스를 매우 빠르게 움직일 경우를 대비한 가드 (프레임 드랍 방지 Limit)
    if (particles.length > CONFIG.maxParticles) {
        particles.splice(0, particles.length - CONFIG.maxParticles);
    }

    // 5. 블렌딩 모드를 기본 상태로 복구
    ctx.globalCompositeOperation = 'source-over';

    // 6. 마우스를 올리고 있을 때 선행하는 작고 하얀 커서 점표시
    if (isHovering) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
    }

    // 7. 다음 프레임 예약 (일반적으로 60fps)
    requestAnimationFrame(animate);
}

// 첫 화면이 렌더링될 때 배경이 투명하게 시작하는 것을 방지하기 위해 칠함
ctx.fillStyle = '#0f0f12';
ctx.fillRect(0, 0, width, height);

// 루프 시작!
animate();
