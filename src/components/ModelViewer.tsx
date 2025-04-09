"use client";
import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import {
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Info,
  X,
  Home,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CameraViewConfig {
  direction: [number, number, number];
}

interface ModelViewerProps {
  modelUrl: string;
  slicePlane?: 'axial' | 'coronal' | 'sagittal';
  slicePosition?: number;
  className?: string;
}

export interface ModelViewerHandle {
  fitToView: () => void;
  getModel: () => THREE.Group | null;
}

const cameraViews: Record<string, CameraViewConfig> = {
  front: { direction: [0, 0, 1] },
  back: { direction: [0, 0, -1] },
  left: { direction: [-1, 0, 0] },
  right: { direction: [1, 0, 0] },
  top: { direction: [0, 1, 0] },
  bottom: { direction: [0, -1, 0] },
};

const ModelViewer = forwardRef<ModelViewerHandle, ModelViewerProps>(
  ({ modelUrl = "", slicePlane, slicePosition = 0.5, className }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [status, setStatus] = useState<string>("Initializing...");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showViewOptions, setShowViewOptions] = useState<boolean>(false);
    const [activeView, setActiveView] = useState<string | null>(null);

    // Refs for Three.js objects
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const modelRef = useRef<THREE.Group | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const distanceRef = useRef<number>(0);
    const clippingPlaneRef = useRef<THREE.Plane | null>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      fitToView,
      getModel: () => modelRef.current,
    }));

    const fitToView = () => {
      if (!modelRef.current || !cameraRef.current || !controlsRef.current) return;

      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());

      const distance = size * 0.75;
      distanceRef.current = distance;

      cameraRef.current.position.copy(center).add(new THREE.Vector3(0, 0, distance));
      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      cameraRef.current.near = size / 100;
      cameraRef.current.far = size * 100;
      cameraRef.current.updateProjectionMatrix();

      setStatus("Model fitted to view");
    };

    const setCameraView = (view: string) => {
      if (!modelRef.current || !cameraRef.current || !controlsRef.current) return;

      const config = cameraViews[view];
      if (!config) return;

      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const distance = distanceRef.current;
      const directionVector = new THREE.Vector3(...config.direction).normalize();
      const newCameraPos = center.clone().add(directionVector.multiplyScalar(distance));

      cameraRef.current.position.copy(newCameraPos);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      setStatus(`View set to ${view}`);
      setActiveView(view);
    };

    // Setup clipping plane for slicing
    useEffect(() => {
      if (!modelRef.current || !slicePlane || !rendererRef.current) return;

      rendererRef.current.localClippingEnabled = true;
      
      if (!clippingPlaneRef.current) {
        clippingPlaneRef.current = new THREE.Plane();
      }

      const normal = new THREE.Vector3();
      switch(slicePlane) {
        case 'axial': normal.set(0, 0, 1); break;
        case 'coronal': normal.set(0, 1, 0); break;
        case 'sagittal': normal.set(1, 0, 0); break;
      }

      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // Calculate slice position in world coordinates
      const slicePos = new THREE.Vector3(
        center.x + (size.x * (slicePosition - 0.5)),
        center.y + (size.y * (slicePosition - 0.5)),
        center.z + (size.z * (slicePosition - 0.5))
      );

      clippingPlaneRef.current.setFromNormalAndCoplanarPoint(normal, slicePos);

      modelRef.current.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.material.clippingPlanes = [clippingPlaneRef.current!];
          child.material.clipShadows = true;
          child.material.needsUpdate = true;
        }
      });
    }, [slicePlane, slicePosition]);

    useEffect(() => {
      const mountNode = mountRef.current;
      if (!mountNode) return;

      // Initialize Three.js scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      sceneRef.current = scene;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight1.position.set(1, 1, 1);
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight2.position.set(-1, -1, -1);
      scene.add(directionalLight2);

      const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
      directionalLight3.position.set(0, 1, 0);
      scene.add(directionalLight3);

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        mountNode.clientWidth / mountNode.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 1, 2);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.localClippingEnabled = true;
      rendererRef.current = renderer;
      mountNode.appendChild(renderer.domElement);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Load model
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/");
      loader.setDRACOLoader(dracoLoader);
      setIsLoading(true);

      loader.load(
        modelUrl,
        (gltf: GLTF) => {
          if (modelRef.current) {
            scene.remove(modelRef.current);
          }

          modelRef.current = gltf.scene;
          scene.add(modelRef.current);

          // Enable shadows and clipping
          modelRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (clippingPlaneRef.current) {
                child.material.clippingPlanes = [clippingPlaneRef.current];
                child.material.clipShadows = true;
              }
            }
          });

          setStatus(`Model loaded: ${modelUrl.split("/").pop() || "Unknown"}`);
          setIsLoading(false);
          fitToView();
        },
        (xhr) => {
          const percent = (xhr.loaded / xhr.total) * 100;
          setLoadingProgress(percent);
          setStatus(`Loading model: ${percent.toFixed(2)}%`);
        },
        (error) => {
          console.error("Error loading model:", error);
          setStatus(`Error loading model: ${error instanceof Error ? error.message : "Unknown error"}`);
          setIsLoading(false);
        }
      );

      // Handle resize
      const handleResize = () => {
        if (!cameraRef.current || !mountNode) return;
        cameraRef.current.aspect = mountNode.clientWidth / mountNode.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (mountNode && renderer.domElement) {
          mountNode.removeChild(renderer.domElement);
        }
        renderer.dispose();
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }
      };
    }, [modelUrl]);

    const toggleViewOptions = () => setShowViewOptions(!showViewOptions);

    const handleZoomIn = () => {
      if (!cameraRef.current) return;
      cameraRef.current.fov = Math.max(10, cameraRef.current.fov - 5);
      cameraRef.current.updateProjectionMatrix();
    };

    const handleZoomOut = () => {
      if (!cameraRef.current) return;
      cameraRef.current.fov = Math.min(100, cameraRef.current.fov + 5);
      cameraRef.current.updateProjectionMatrix();
    };

    return (
      <div className={cn("relative h-full w-full bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden border border-gray-800", className)}>
        <div ref={mountRef} className="h-full w-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="bg-black/60 p-8 rounded-xl border border-gray-800 flex flex-col items-center max-w-md">
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
              <div className="text-white text-xl font-medium mb-4">{status}</div>
              <div className="w-full max-w-xs mb-2">
                <Progress value={loadingProgress} className="h-2" />
              </div>
              <div className="text-gray-400 text-sm">
                {loadingProgress.toFixed(0)}% Complete
              </div>
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full border border-gray-800 text-xs flex items-center gap-1.5 z-10 shadow-lg">
          <Info className="h-3.5 w-3.5 text-primary" />
          <span>{status}</span>
        </div>

        {/* Control bar */}
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/70 backdrop-blur-md border border-gray-800 rounded-full px-1.5 py-1.5 flex items-center shadow-lg">
            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-white hover:bg-gray-800/70"
                      onClick={fitToView}
                    >
                      <Home className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fit to View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showViewOptions ? "secondary" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-10 w-10 rounded-full text-white",
                        showViewOptions ? "bg-gray-700" : "hover:bg-gray-800/70"
                      )}
                      onClick={toggleViewOptions}
                    >
                      <Compass className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Views</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-white hover:bg-gray-800/70"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-white hover:bg-gray-800/70"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* View options panel */}
          {showViewOptions && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md border border-gray-800 rounded-xl p-3 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-300">Views</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => setShowViewOptions(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(cameraViews).map(([view]) => (
                  <TooltipProvider key={view}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeView === view ? "default" : "secondary"}
                          size="sm"
                          className={cn(
                            "w-full text-white border border-gray-700/50",
                            activeView === view
                              ? "bg-primary hover:bg-primary/90"
                              : "bg-gray-800/70 hover:bg-gray-700/70"
                          )}
                          onClick={() => setCameraView(view)}
                        >
                          {view === "front" && <ArrowUp className="h-4 w-4" />}
                          {view === "back" && <ArrowDown className="h-4 w-4" />}
                          {view === "left" && <ArrowLeft className="h-4 w-4" />}
                          {view === "right" && <ArrowRight className="h-4 w-4" />}
                          {view === "top" && <ArrowUp className="h-4 w-4" />}
                          {view === "bottom" && <ArrowDown className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{`${view.charAt(0).toUpperCase() + view.slice(1)} View`}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ModelViewer.displayName = "ModelViewer";

export default ModelViewer;