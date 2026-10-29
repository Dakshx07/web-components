"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

interface SharedLeverArchContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  domElement: HTMLCanvasElement;
  renderFrame: () => void;
  resize: (width: number, height: number) => void;
}

let sharedContext: SharedLeverArchContext | null = null;
let initPromise: Promise<SharedLeverArchContext> | null = null;

/**
 * Singleton WebGL Manager for LeverArch3D
 * Guarantees exactly ONE WebGLRenderer and Canvas across the entire application lifecycle.
 * Eliminates browser WebGL context exhaustion, context loss blocks, and 100% of re-creation overhead.
 */
export const getOrCreateSharedLeverArch = async (): Promise<SharedLeverArchContext> => {
  if (sharedContext) return sharedContext;
  if (initPromise) return initPromise;

  initPromise = new Promise(async (resolve, reject) => {
    try {
      if (typeof window === "undefined") {
        return reject(new Error("SSR environment"));
      }

      await MeshoptDecoder.ready;

      const width = 420;
      const height = 720;

      // 1. Scene setup
      const scene = new THREE.Scene();

      // 2. Camera setup - tight FOV for realistic orthographic-like industrial perspective
      const camera = new THREE.PerspectiveCamera(26, width / height, 0.1, 100);
      camera.position.set(0, 0, 5.2);

      // 3. WebGL Renderer with High-Fidelity PBR Settings
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // 4. Photorealistic Studio Environment (RoomEnvironment gives authentic chrome reflection bands)
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const roomEnv = new RoomEnvironment();
      const envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture;
      scene.environment = envMap;

      // Balanced Directional Studio Lighting
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
      keyLight.position.set(3, 4, 3.5);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xe2e8f0, 1.5);
      fillLight.position.set(-3, -2, 2.5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
      rimLight.position.set(0, 4, -2);
      scene.add(rimLight);

      const frontLight = new THREE.DirectionalLight(0xffffff, 1.4);
      frontLight.position.set(0, 0, 4);
      scene.add(frontLight);

      // 5. Paper Depth Occluders with Circular Cutout Holes
      const occluderMat = new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: true,
      });

      // Left Paper Occluder with holes for left ring prongs
      const leftShape = new THREE.Shape();
      leftShape.moveTo(-2.5, -3.0);
      leftShape.lineTo(-0.047, -3.0);
      leftShape.lineTo(-0.047, 3.0);
      leftShape.lineTo(-2.5, 3.0);
      leftShape.closePath();

      const leftBottomHole = new THREE.Path();
      leftBottomHole.absarc(-0.198, -0.0044, 0.035, 0, Math.PI * 2, true);
      leftShape.holes.push(leftBottomHole);

      const leftTopHole = new THREE.Path();
      leftTopHole.absarc(-0.198, 0.2143, 0.035, 0, Math.PI * 2, true);
      leftShape.holes.push(leftTopHole);

      const leftPaperOccluder = new THREE.Mesh(
        new THREE.ShapeGeometry(leftShape),
        occluderMat
      );
      leftPaperOccluder.renderOrder = 0;
      scene.add(leftPaperOccluder);

      // Right Paper Occluder with holes for right ring prongs
      const rightShape = new THREE.Shape();
      rightShape.moveTo(0.047, -3.0);
      rightShape.lineTo(2.5, -3.0);
      rightShape.lineTo(2.5, 3.0);
      rightShape.lineTo(0.047, 3.0);
      rightShape.closePath();

      const rightBottomHole = new THREE.Path();
      rightBottomHole.absarc(0.1458, -0.0044, 0.035, 0, Math.PI * 2, true);
      rightShape.holes.push(rightBottomHole);

      const rightTopHole = new THREE.Path();
      rightTopHole.absarc(0.1458, 0.2143, 0.035, 0, Math.PI * 2, true);
      rightShape.holes.push(rightTopHole);

      const rightPaperOccluder = new THREE.Mesh(
        new THREE.ShapeGeometry(rightShape),
        occluderMat
      );
      rightPaperOccluder.renderOrder = 0;
      scene.add(rightPaperOccluder);

      const renderFrame = () => {
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      const resize = (newWidth: number, newHeight: number) => {
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
          renderFrame();
        }
      };

      // 6. Load GLTF model into scene
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);

      loader.load(
        "/models/lever-arch-mechanism.glb",
        (gltf) => {
          const loadedModel = gltf.scene;

          // Center geometry around its local origin
          const box = new THREE.Box3().setFromObject(loadedModel);
          const center = new THREE.Vector3();
          box.getCenter(center);
          loadedModel.position.set(-center.x, -center.y, -center.z);

          // 90° Clockwise Horizontal Alignment
          loadedModel.rotation.set(Math.PI / 2, -Math.PI / 2, 0, "XYZ");

          const modelGroup = new THREE.Group();
          modelGroup.add(loadedModel);

          // Recompute transformed bounds
          const alignedBox = new THREE.Box3().setFromObject(modelGroup);
          const alignedSize = new THREE.Vector3();
          alignedBox.getSize(alignedSize);

          const targetSpanWidth = 0.52;
          const scaleFactor = targetSpanWidth / (alignedSize.x || 1);
          modelGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
          modelGroup.position.set(-0.026, 0, 0);

          // PBR Materials configuration
          modelGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = false;
              mesh.receiveShadow = false;
              mesh.renderOrder = 1;

              if (mesh.material) {
                const materials = Array.isArray(mesh.material)
                  ? mesh.material
                  : [mesh.material];

                materials.forEach((mat) => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.color.set(0xffffff);
                    mat.metalness = 0.94;
                    mat.roughness = 0.18;
                    mat.envMap = envMap;
                    mat.envMapIntensity = 2.2;
                    if (mat.normalMap) {
                      mat.normalScale.set(0.2, 0.2);
                    }
                    mat.needsUpdate = true;
                  }
                });
              }
            }
          });

          scene.add(modelGroup);
          renderFrame();

          sharedContext = {
            renderer,
            scene,
            camera,
            domElement: renderer.domElement,
            renderFrame,
            resize,
          };
          resolve(sharedContext);
        },
        undefined,
        (err) => {
          initPromise = null;
          reject(err);
        }
      );
    } catch (e) {
      initPromise = null;
      reject(e);
    }
  });

  return initPromise;
};

// Automatically initiate background preload upon client hydration
if (typeof window !== "undefined") {
  getOrCreateSharedLeverArch().catch(() => {});
}

interface LeverArch3DProps {
  className?: string;
  style?: React.CSSProperties;
  isClosing?: boolean;
  isVisible?: boolean;
}

export const LeverArch3D: React.FC<LeverArch3DProps> = ({
  className,
  style,
  isClosing = false,
  isVisible = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;

    getOrCreateSharedLeverArch()
      .then((ctx) => {
        if (isDisposed || !mountRef.current) return;
        const dom = ctx.domElement;
        if (dom.parentElement !== mountRef.current) {
          mountRef.current.appendChild(dom);
        }
        ctx.renderFrame();
        setIsLoaded(true);
      })
      .catch((err: any) => {
        console.warn("LeverArch3D WebGL context init:", err?.message || err);
        if (!isDisposed) {
          setLoadError("WebGL temporarily unavailable");
        }
      });

    const resizeObserver = new ResizeObserver(() => {
      if (!container || isDisposed || !sharedContext) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        sharedContext.resize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      if (sharedContext && container && container.contains(sharedContext.domElement)) {
        container.removeChild(sharedContext.domElement);
      }
    };
  }, []);

  const shouldBeVisible = isVisible && !isClosing;

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position: "absolute",
        width: "420px",
        height: "100%",
        top: 0,
        left: 0,
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 25,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: shouldBeVisible ? 1 : 0,
        transition: "opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
    >
      {!isLoaded && !loadError && (
        <div
          style={{
            position: "absolute",
            width: "3px",
            height: "40%",
            borderRadius: "2px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.4) 100%)",
            opacity: 0.3,
          }}
        />
      )}
      {loadError && (
        <div
          onClick={() => {
            initPromise = null;
            sharedContext = null;
            window.location.reload();
          }}
          style={{
            position: "absolute",
            pointerEvents: "auto",
            cursor: "pointer",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(0, 0, 0, 0.15)",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#1e293b",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          Click to refresh 3D binder
        </div>
      )}
    </div>
  );
};
