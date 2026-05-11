"use client";

import { X } from "lucide-react";
import Image from "next/image";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalPosition {
  theta: number;
  phi: number;
  radius: number;
}

export interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
}

export interface ImageData {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

export interface SphereImageGridProps {
  images?: ImageData[];
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
}

interface RotationState {
  x: number;
  y: number;
  z: number;
}

interface VelocityState {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

const sphereMath = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  },
};

function SphereImage({ src, alt, sizes = "120px" }: { src: string; alt: string; sizes?: string }) {
  if (src.includes("supabase.co/storage/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />;
  }

  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" draggable={false} />;
}

export function SphereImageGrid({
  images = [],
  containerSize = 400,
  sphereRadius,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.12,
  hoverScale = 1.2,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  className = "",
}: SphereImageGridProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [rotation, setRotation] = useState<RotationState>({ x: 15, y: 15, z: 0 });
  const [velocity, setVelocity] = useState<VelocityState>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [imagePositions, setImagePositions] = useState<SphericalPosition[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);

  const actualSphereRadius = sphereRadius ?? containerSize * 0.5;
  const baseImageSize = containerSize * baseImageScale;

  const generateSpherePositions = useCallback((): SphericalPosition[] => {
    const positions: SphericalPosition[] = [];
    const imageCount = images.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = 2 * Math.PI / goldenRatio;

    for (let index = 0; index < imageCount; index += 1) {
      const t = index / imageCount;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * index;
      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;

      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
      phi = phi < 90 ? Math.max(5, phi - poleBonus) : Math.min(175, phi + poleBonus);
      phi = 15 + (phi / 180) * 150;

      const deterministicOffset = (((index * 37) % 21) - 10) * 0.9;
      theta = (theta + deterministicOffset) % 360;
      phi = Math.max(0, Math.min(180, phi + (((index * 19) % 11) - 5)));

      positions.push({ theta, phi, radius: actualSphereRadius });
    }

    return positions;
  }, [images.length, actualSphereRadius]);

  const calculateWorldPositions = useCallback((): WorldPosition[] => {
    const positions = imagePositions.map((pos, index) => {
      const thetaRad = sphereMath.degreesToRadians(pos.theta);
      const phiRad = sphereMath.degreesToRadians(pos.phi);
      const rotXRad = sphereMath.degreesToRadians(rotation.x);
      const rotYRad = sphereMath.degreesToRadians(rotation.y);

      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1;
      z = z1;

      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2;
      z = z2;

      const fadeZoneStart = -10;
      const fadeZoneEnd = -30;
      const isVisible = z > fadeZoneEnd;
      const fadeOpacity = z <= fadeZoneStart ? Math.max(0, (z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd)) : 1;
      const isPoleImage = pos.phi < 30 || pos.phi > 150;
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      const distanceRatio = Math.min(distanceFromCenter / actualSphereRadius, 1);
      const centerScale = Math.max(0.3, 1 - distanceRatio * (isPoleImage ? 0.4 : 0.7));
      const depthScale = (z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);

      return {
        x,
        y,
        z,
        scale,
        zIndex: Math.round(1000 + z),
        isVisible,
        fadeOpacity,
        originalIndex: index,
      };
    });

    const adjustedPositions = [...positions];

    for (let i = 0; i < adjustedPositions.length; i += 1) {
      const pos = adjustedPositions[i];
      if (!pos.isVisible) continue;

      let adjustedScale = pos.scale;
      const imageSize = baseImageSize * adjustedScale;

      for (let j = 0; j < adjustedPositions.length; j += 1) {
        if (i === j) continue;
        const other = adjustedPositions[j];
        if (!other.isVisible) continue;

        const otherSize = baseImageSize * other.scale;
        const dx = pos.x - other.x;
        const dy = pos.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (imageSize + otherSize) / 2 + 25;

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const reductionFactor = Math.max(0.4, 1 - (overlap / minDistance) * 0.6);
          adjustedScale = Math.min(adjustedScale, adjustedScale * reductionFactor);
        }
      }

      adjustedPositions[i] = { ...pos, scale: Math.max(0.25, adjustedScale) };
    }

    return adjustedPositions;
  }, [imagePositions, rotation, actualSphereRadius, baseImageSize]);

  const clampRotationSpeed = useCallback(
    (speed: number): number => Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed)),
    [maxRotationSpeed],
  );

  const updateMomentum = useCallback(() => {
    if (isDragging) return;

    setVelocity((prev) => {
      const next = { x: prev.x * momentumDecay, y: prev.y * momentumDecay };
      if (!autoRotate && Math.abs(next.x) < 0.01 && Math.abs(next.y) < 0.01) return { x: 0, y: 0 };
      return next;
    });

    setRotation((prev) => {
      let newY = prev.y;
      if (autoRotate) newY += autoRotateSpeed;
      newY += clampRotationSpeed(velocity.y);
      return {
        x: sphereMath.normalizeAngle(prev.x + clampRotationSpeed(velocity.x)),
        y: sphereMath.normalizeAngle(newY),
        z: prev.z,
      };
    });
  }, [isDragging, momentumDecay, autoRotate, autoRotateSpeed, velocity, clampRotationSpeed]);

  const handleMouseDown = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = event.clientX - lastMousePos.current.x;
      const deltaY = event.clientY - lastMousePos.current.y;
      const rotationDelta = { x: -deltaY * dragSensitivity, y: deltaX * dragSensitivity };

      setRotation((prev) => ({
        x: sphereMath.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
        y: sphereMath.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
        z: prev.z,
      }));
      setVelocity({ x: clampRotationSpeed(rotationDelta.x), y: clampRotationSpeed(rotationDelta.y) });
      lastMousePos.current = { x: event.clientX, y: event.clientY };
    },
    [isDragging, dragSensitivity, clampRotationSpeed],
  );

  const handleTouchStart = useCallback((event: ReactTouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isDragging) return;
      event.preventDefault();
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastMousePos.current.x;
      const deltaY = touch.clientY - lastMousePos.current.y;
      const rotationDelta = { x: -deltaY * dragSensitivity, y: deltaX * dragSensitivity };

      setRotation((prev) => ({
        x: sphereMath.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
        y: sphereMath.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
        z: prev.z,
      }));
      setVelocity({ x: clampRotationSpeed(rotationDelta.x), y: clampRotationSpeed(rotationDelta.y) });
      lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    },
    [isDragging, dragSensitivity, clampRotationSpeed],
  );

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    setImagePositions(generateSpherePositions());
  }, [generateSpherePositions]);

  useEffect(() => {
    const animate = () => {
      updateMomentum();
      animationFrame.current = requestAnimationFrame(animate);
    };

    if (isMounted) animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [isMounted, updateMomentum]);

  useEffect(() => {
    if (!isMounted) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMounted, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const worldPositions = calculateWorldPositions();

  if (!isMounted) {
    return (
      <div
        className="flex animate-pulse items-center justify-center rounded-xl bg-black/5 text-black/35"
        style={{ width: containerSize, height: containerSize }}
      >
        Loading...
      </div>
    );
  }

  if (!images.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-black/20 bg-white/40 text-black/40"
        style={{ width: containerSize, height: containerSize }}
      >
        No images provided
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes loraSphereFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes loraSphereScaleIn { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      <div
        ref={containerRef}
        className={`relative select-none cursor-grab active:cursor-grabbing ${className}`}
        style={{ width: containerSize, height: containerSize, perspective: `${perspective}px` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="relative h-full w-full" style={{ zIndex: 10 }}>
          {images.map((image, index) => {
            const position = worldPositions[index];
            if (!position?.isVisible) return null;

            const imageSize = baseImageSize * position.scale;
            const isHovered = hoveredIndex === index;
            const finalScale = isHovered ? Math.min(hoverScale, hoverScale / position.scale) : 1;

            return (
              <button
                key={image.id}
                type="button"
                className="absolute cursor-pointer select-none transition-transform duration-200 ease-out"
                style={{
                  width: `${imageSize}px`,
                  height: `${imageSize}px`,
                  left: `${containerSize / 2 + position.x}px`,
                  top: `${containerSize / 2 + position.y}px`,
                  opacity: position.fadeOpacity,
                  transform: `translate(-50%, -50%) scale(${finalScale})`,
                  zIndex: position.zIndex,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setSelectedImage(image)}
              >
                <span className="relative block h-full w-full overflow-hidden rounded-full border-2 border-white/30 shadow-xl">
                  <SphereImage src={image.src} alt={image.alt} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          style={{ animation: "loraSphereFadeIn 0.25s ease-out" }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            style={{ animation: "loraSphereScaleIn 0.25s ease-out" }}
          >
            <div className="relative aspect-square">
              <SphereImage src={selectedImage.src} alt={selectedImage.alt} sizes="448px" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black"
                aria-label="Close image"
              >
                <X size={16} />
              </button>
            </div>
            {(selectedImage.title || selectedImage.description) && (
              <div className="p-6">
                {selectedImage.title && <h3 className="text-xl font-medium">{selectedImage.title}</h3>}
                {selectedImage.description && <p className="mt-2 text-sm leading-6 text-black/60">{selectedImage.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function ResponsiveSphereImageGrid(props: Omit<SphereImageGridProps, "containerSize" | "sphereRadius">) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(420);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      const width = wrapper.getBoundingClientRect().width;
      setSize(Math.max(320, Math.min(720, width)));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="flex w-full justify-center">
      <SphereImageGrid {...props} containerSize={size} sphereRadius={size * 0.42} />
    </div>
  );
}
