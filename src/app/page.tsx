"use client";

import { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

// --- Components ---

/**
 * Background3D (은하수 마우스 트레일 전용)
 */
interface TrailParticle {
    x: number;
    y: number;
    z: number;
    age: number;
    maxAge: number;
    speedX: number;
    speedY: number;
    textureIndex: number;
    active: boolean;
    size: number;
}

import { useThree } from "@react-three/fiber";

function TrailParticles({ mousePos }: { mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
    const count = 300;
    const iconCount = 9;
    const iconPaths = Array.from({ length: 9 }, (_, i) => `/assets/${i + 1}.png`); // 1.png ~ 9.png

    const textures = useLoader(THREE.TextureLoader, iconPaths);

    // 파티클 상태 관리
    const [particles] = useState<TrailParticle[]>(() => {
        const temp: TrailParticle[] = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: 0,
                y: 0,
                z: 0,
                age: 0,
                maxAge: 1.5 + Math.random() * 2.5,
                speedX: (Math.random() - 0.5) * 0.02,
                speedY: (Math.random() - 0.5) * 0.02,
                textureIndex: Math.floor(Math.random() * iconCount),
                active: false,
                size: 0.5 + Math.random() * 1.5, // 사용자 니즈에 맞춰 크기를 다양하게 조절
            });
        }
        return temp;
    });

    // 텍스처별 InstancedMesh 참조
    const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);

    const lastMousePos = useRef({ x: 0, y: 0 });
    const { viewport } = useThree();

    // 임시 Object3D 인스턴스 (행렬 계산용)
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(() => {
        const currentMouseX = mousePos.current.x;
        const currentMouseY = mousePos.current.y;

        const dist = Math.sqrt(
            Math.pow(currentMouseX - lastMousePos.current.x, 2) +
            Math.pow(currentMouseY - lastMousePos.current.y, 2)
        );

        // 마우스가 이동할 때 파티클 활성화 (1번 프레임에 2개씩)
        if (dist > 0.002) {
            for (let k = 0; k < 2; k++) {
                const inactive = particles.find((p) => !p.active);
                if (inactive) {
                    inactive.active = true;
                    // 마우스 위치 (중앙 기준 -1~1 범위에서 뷰포트 크기로 변환)
                    inactive.x = currentMouseX * (viewport.width / 2) + (Math.random() - 0.5) * 0.3;
                    inactive.y = -currentMouseY * (viewport.height / 2) + (Math.random() - 0.5) * 0.3;
                    inactive.z = 1 + Math.random();
                    inactive.age = 0;
                    inactive.textureIndex = Math.floor(Math.random() * iconCount);
                }
            }
            lastMousePos.current = { x: currentMouseX, y: currentMouseY };
        }

        // 텍스처별로 몇 번째 인스턴스를 그릴지 카운팅
        const counters = new Array(iconCount).fill(0);

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            const ti = p.textureIndex;

            if (p.active) {
                p.age += 0.016; // 대략 60fps 기준
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.age >= p.maxAge) {
                    p.active = false;
                }
            }

            if (p.active && meshRefs.current[ti]) {
                const mesh = meshRefs.current[ti];
                const instanceId = counters[ti];

                // 위치 및 크기 설정
                dummy.position.set(p.x, p.y, p.z);

                // 시간이 지날수록 크기가 점진적으로 작아지게 설정
                const scaleProgression = Math.max(0, 1 - (p.age / p.maxAge));
                const currentSize = p.size * scaleProgression;

                dummy.scale.set(currentSize, currentSize, currentSize);
                dummy.rotation.z = p.age * 0.5; // 살짝 회전 효과
                dummy.updateMatrix();

                mesh!.setMatrixAt(instanceId, dummy.matrix);
                counters[ti]++;
            }
        }

        // 업데이트 된 행렬 렌더링 반영 및 남는 인스턴스 숨김 공간 처리
        for (let ti = 0; ti < iconCount; ti++) {
            const mesh = meshRefs.current[ti];
            if (mesh) {
                mesh.count = counters[ti]; // 실제로 활성화된 만큼만 렌더링
                mesh.instanceMatrix.needsUpdate = true;
            }
        }
    });

    return (
        <>
            {textures.map((tex, idx) => (
                <instancedMesh
                    key={idx}
                    ref={(el) => {
                        meshRefs.current[idx] = el;
                    }}
                    args={[undefined, undefined, count]} // 최대 수량 보장
                >
                    {/* 투명 이미지를 렌더링하기 위한 평면 지오메트리 */}
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial
                        map={tex}
                        transparent
                        depthWrite={false}
                        alphaTest={0.01}
                        blending={THREE.NormalBlending}
                    />
                </instancedMesh>
            ))}
        </>
    );
}

function Background3D() {
    const mousePos = useMousePosition();

    return (
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#3D3D3D] to-[#C1C1C1]">
            <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ alpha: true }}>
                <ambientLight intensity={0.4} />
                <Suspense fallback={null}>
                    <TrailParticles mousePos={mousePos} />
                </Suspense>
            </Canvas>
        </div>
    );
}

// --- Main Page ---

export default function Home() {
    return (
        <main className="relative min-h-screen font-sans text-white">
            <Background3D />

            {/* 네비게이션바 (Responsive) */}
            <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center glass border-b border-white/10">
                <div className="text-2xl font-bold tracking-widest font-display text-white">MOUSE I</div>
                <div className="hidden md:flex gap-8 text-sm font-medium tracking-wide">
                    <a href="#" className="text-white/80 hover:text-white transition-colors">HOME</a>
                    <a href="#" className="text-white/80 hover:text-white transition-colors">ABOUT</a>
                    <a href="#" className="text-white/80 hover:text-white transition-colors">WORKS</a>
                    <a href="#" className="text-white/80 hover:text-white transition-colors">CONTACT</a>
                </div>
                {/* 햄버거 메뉴 아이콘 (모바일용) */}
                <div className="md:hidden flex items-center">
                    <button className="text-white focus:outline-none">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </nav>

            {/* 히어로 섹션 */}
            <section className="pt-32 pb-20 px-6 md:px-20 min-h-screen flex flex-col justify-center">
                <div className="max-w-5xl">
                    <h1 className="text-5xl md:text-8xl font-black mb-6 leading-tight drop-shadow-xl font-display text-white">
                        PREMIUM <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
                            SPATIAL EXPERIENCE
                        </span>
                    </h1>
                    <p className="text-lg md:text-2xl max-w-2xl mb-10 text-gray-100 drop-shadow-md font-medium leading-relaxed">
                        차세대 3D 공간 스튜디오와 디지털 비전 추출 기술을 통해 새로운 차원의 인터랙티브 웹 경험을 제공합니다.
                    </p>
                    <div className="flex gap-4 flex-col sm:flex-row">
                        <button className="px-8 py-4 bg-white text-[#3D3D3D] font-bold rounded-full hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                            프로젝트 시작하기
                        </button>
                        <button className="px-8 py-4 bg-black/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-full hover:bg-black/40 transition-all shadow-lg">
                            더 알아보기
                        </button>
                    </div>
                </div>
            </section>

            {/* 특징 섹션 (Grid) */}
            <section className="px-6 md:px-20 py-24 bg-black/10 backdrop-blur-md border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {[
                        { title: "Responsive Layout", desc: "모바일, 태블릿, 데스크탑 등 모든 기기 화면 크기에 맞춰 완벽하게 동작하는 유연한 그리드와 컴포넌트를 설계하였습니다." },
                        { title: "Fluid Interaction", desc: "마우스 커서의 움직임에 반응하는 은하수 파티클 효과와 스크롤에 따른 부드러운 전환 효과를 제공합니다." },
                        { title: "Modern Aesthetics", desc: "#3D3D3D에서 #C1C1C1로 이어지는 세련된 그라데이션 배경과 글래스모피즘(Glassmorphism) UI를 적용했습니다." }
                    ].map((feature, i) => (
                        <div key={i} className="glass border border-white/20 p-8 rounded-3xl hover:bg-white/10 transition-colors cursor-default group transform hover:-translate-y-2 duration-300 shadow-lg">
                            <h3 className="text-2xl font-bold mb-4 font-display text-white tracking-wide">{feature.title}</h3>
                            <p className="text-gray-200 leading-relaxed font-medium">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
