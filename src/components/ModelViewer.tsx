"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

import * as THREE from "three"
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
// import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader"
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"

// These imports should work if you have three.js installed
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import {
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Info,
  // Fullscreen,
  X,
  // Maximize2,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CameraViewConfig {
  direction: [number, number, number]
}

interface ModelViewerProps {
  modelUrl: string
}

const cameraViews: Record<string, CameraViewConfig> = {
  front: { direction: [0, 0, 1] },
  back: { direction: [0, 0, -1] },
  left: { direction: [-1, 0, 0] },
  right: { direction: [1, 0, 0] },
  top: { direction: [0, 1, 0] },
  bottom: { direction: [0, -1, 0] },
}

const ModelViewer: React.FC<ModelViewerProps> = ({ modelUrl = "" }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loadingProgress, setLoadingProgress] = useState<number>(0)
  const [status, setStatus] = useState<string>("Initializing...")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showViewOptions, setShowViewOptions] = useState<boolean>(false)
  const [activeView, setActiveView] = useState<string | null>(null)

  // Refs for Three.js objects
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  // Stores the distance computed during fitToView
  const distanceRef = useRef<number>(0)

  // fitToView function: computes model center and the ideal distance
  const fitToView = () => {
    if (!modelRef.current || !cameraRef.current || !controlsRef.current) return

    const box = new THREE.Box3().setFromObject(modelRef.current)
    const size = box.getSize(new THREE.Vector3()).length()
    const center = box.getCenter(new THREE.Vector3())

    const distance = size * 0.75
    distanceRef.current = distance

    // Position camera relative to the center using the initial front view (direction [0,0,1])
    cameraRef.current.position.copy(center).add(new THREE.Vector3(0, 0, distance))
    controlsRef.current.target.copy(center)
    controlsRef.current.update()

    cameraRef.current.near = size / 100
    cameraRef.current.far = size * 100
    cameraRef.current.updateProjectionMatrix()

    setStatus("Model fitted to view")
  }

  // Update view: change only orientation while preserving the distance
  const setCameraView = (view: string) => {
    if (!modelRef.current || !cameraRef.current || !controlsRef.current) return

    const config = cameraViews[view]
    if (!config) return

    // Get the model's bounding box center.
    const box = new THREE.Box3().setFromObject(modelRef.current)
    const center = box.getCenter(new THREE.Vector3())
    // The stored distance from fitToView
    const distance = distanceRef.current
    // Compute the new camera position: center plus the normalized direction times the distance.
    const directionVector = new THREE.Vector3(...config.direction).normalize()
    const newCameraPos = center.clone().add(directionVector.multiplyScalar(distance))
    cameraRef.current.position.copy(newCameraPos)
    controlsRef.current.target.copy(center)
    controlsRef.current.update()

    setStatus(`View set to ${view}`)
    setActiveView(view)
  }

  useEffect(() => {
    if (!mountRef.current) return

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight1.position.set(1, 1, 1)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight2.position.set(-1, -1, -1)
    scene.add(directionalLight2)

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.3)
    directionalLight3.position.set(0, 1, 0)
    scene.add(directionalLight3)

    // Camera
    const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 1, 2)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Load model with DRACOLoader - compressed glb loader
    // Note: Ensure the DRACOLoader decoder files are served from the correct path
    // You can use a CDN or host them yourself
    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/draco/") 
    loader.setDRACOLoader(dracoLoader)
    setIsLoading(true)

    loader.load(
      modelUrl,
      (gltf: GLTF) => {
      
      if (modelRef.current) {
        scene.remove(modelRef.current)
      }

      modelRef.current = gltf.scene
      if (modelRef.current) {
        scene.add(modelRef.current)
      }

      // Enable shadows on meshes
      modelRef.current?.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        }
      })

      setStatus(`Model loaded: ${modelUrl ? modelUrl.split("/").pop() : "Unknown"}`)
      setIsLoading(false)
      fitToView()
      },
      (xhr: ProgressEvent<EventTarget>) => {
      const percent = (xhr.loaded / xhr.total) * 100
      setLoadingProgress(percent)
      setStatus(`Loading model: ${percent.toFixed(2)}%`)
      },
      (error: unknown) => {
      if (error instanceof ErrorEvent) {
        console.error("Error loading model:", error)
        setStatus(`Error loading model: ${error.message}`)
      } else {
        console.error("Unknown error loading model:", error)
        setStatus("Error loading model: Unknown error")
      }
      setIsLoading(false)
      },
    )

    // Event handlers for click and resize
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const handleClick = (event: MouseEvent) => {
      if (!modelRef.current) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(modelRef.current, true)

      if (intersects.length > 0) {
        const tooltip = document.createElement("div")
        tooltip.style.position = "absolute"
        tooltip.style.left = `${event.clientX + 10}px`
        tooltip.style.top = `${event.clientY + 10}px`
        tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
        tooltip.style.color = "white"
        tooltip.style.padding = "8px 12px"
        tooltip.style.borderRadius = "4px"
        tooltip.style.pointerEvents = "none"
        tooltip.textContent = intersects[0].object.name || "Part clicked"
        document.body.appendChild(tooltip)

        setTimeout(() => {
          document.body.removeChild(tooltip)
        }, 3000)
      }
    }

    const handleResize = () => {
      if (!cameraRef.current) return
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    // Add event listeners
    renderer.domElement.addEventListener("click", handleClick)
    window.addEventListener("resize", handleResize)

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("click", handleClick)
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [modelUrl])

  const toggleViewOptions = () => {
    setShowViewOptions(!showViewOptions)
  }

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-gray-900 to-black rounded-lg overflow-hidden border border-gray-800">
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
            <div className="text-gray-400 text-sm">{loadingProgress.toFixed(0)}% Complete</div>
          </div>
        </div>
      )}

      {/* Status indicator - small pill */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full border border-gray-800 text-xs flex items-center gap-1.5 z-10 shadow-lg">
        <Info className="h-3.5 w-3.5 text-primary" />
        <span>{status}</span>
      </div>

      
      {/* Bottom control bar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/70 backdrop-blur-md border border-gray-800 rounded-full px-1.5 py-1.5 flex items-center shadow-lg">
          {/* Main controls */}
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
                      showViewOptions ? "bg-gray-700" : "hover:bg-gray-800/70",
                    )}
                    onClick={toggleViewOptions}
                  >
                    <Compass className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Camera Views</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Camera view options - only shown when view options are toggled */}
        {showViewOptions && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md border border-gray-800 rounded-xl p-3 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-300">Camera Views</h4>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === "front" ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "w-full text-white border border-gray-700/50",
                        activeView === "front"
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-gray-800/70 hover:bg-gray-700/70",
                      )}
                      onClick={() => setCameraView("front")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Front View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === "back" ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "w-full text-white border border-gray-700/50",
                        activeView === "back"
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-gray-800/70 hover:bg-gray-700/70",
                      )}
                      onClick={() => setCameraView("back")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === "top" ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "w-full text-white border border-gray-700/50",
                        activeView === "top" ? "bg-primary hover:bg-primary/90" : "bg-gray-800/70 hover:bg-gray-700/70",
                      )}
                      onClick={() => setCameraView("top")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Top View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === "left" ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "w-full text-white border border-gray-700/50",
                        activeView === "left"
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-gray-800/70 hover:bg-gray-700/70",
                      )}
                      onClick={() => setCameraView("left")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Left View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === "right" ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "w-full text-white border border-gray-700/50",
                        activeView === "right"
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-gray-800/70 hover:bg-gray-700/70",
                      )}
                      onClick={() => setCameraView("right")}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Right View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === "bottom" ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "w-full text-white border border-gray-700/50",
                        activeView === "bottom"
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-gray-800/70 hover:bg-gray-700/70",
                      )}
                      onClick={() => setCameraView("bottom")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bottom View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelViewer
