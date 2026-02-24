"use client";

import { useRef, useEffect } from "react";

export interface MousePosition {
    x: number;
    y: number;
}

/**
 * 마우스 위치를 추적하여 -1에서 1 사이의 정규화된 좌표를 반환하는 훅
 * 은하수 트레일 등 즉각적인 반응이 필요한 시스템을 위해 이벤트 핸들러를 최적화하며,
 * React 리렌더링을 방지하기 위해 useRef를 사용합니다.
 */
export function useMousePosition() {
    const mousePos = useRef<MousePosition>({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // 화면 중앙을 (0,0)으로 하고 -1 ~ 1 범위로 정규화
            mousePos.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
            mousePos.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return mousePos;
}
