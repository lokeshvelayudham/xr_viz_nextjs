'use client'
import { useState, useRef } from 'react'
// import * as THREE from 'three'
import dynamic from 'next/dynamic'
import type { ModelViewerHandle } from './ModelViewer'


// Import ModelViewer with proper typing
const ModelViewer = dynamic(() => import('./ModelViewer'), { 
  ssr: false,
  loading: () => <div className="bg-gray-900/50 flex items-center justify-center">Loading 3D...</div>
})

const Slicer = ({ modelUrl }: { modelUrl: string }) => {
  const [activePlane, setActivePlane] = useState<'axial' | 'coronal' | 'sagittal'>('axial')
  const [slicePosition, setSlicePosition] = useState(0.5) // 0-1 range
  const modelRef = useRef<ModelViewerHandle>(null)

  // Generate mock slice visualization
  const generateSlice = (plane: string) => (
    <div className="relative h-full w-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">{plane.toUpperCase()} SLICE</p>
        <p className="text-[0.6rem] text-gray-600">{Math.round(slicePosition * 100)}%</p>
      </div>
      
      {/* Slice position control */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3/4">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={slicePosition}
          onChange={(e) => setSlicePosition(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-2 grid-rows-2 h-screen w-full bg-black overflow-hidden">
      {/* 3D View (Top Left) */}
      <div className="relative border-r border-b border-gray-800">
        <ModelViewer 
          modelUrl={modelUrl} 
          ref={modelRef}
          slicePlane={activePlane}
          slicePosition={slicePosition}
        />
        <div className="absolute top-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
          3D VOLUME
        </div>
      </div>

      {/* Axial Slice (Top Right) */}
      <div 
        className={`relative border-b border-gray-800 ${activePlane === 'axial' ? 'ring-1 ring-blue-400' : ''}`}
        onClick={() => setActivePlane('axial')}
      >
        {generateSlice('axial')}
        <div className="absolute top-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
          AXIAL
        </div>
      </div>

      {/* Coronal Slice (Bottom Left) */}
      <div 
        className={`relative border-r border-gray-800 ${activePlane === 'coronal' ? 'ring-1 ring-blue-400' : ''}`}
        onClick={() => setActivePlane('coronal')}
      >
        {generateSlice('coronal')}
        <div className="absolute top-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
          CORONAL
        </div>
      </div>

      {/* Sagittal Slice (Bottom Right) */}
      <div 
        className={`relative ${activePlane === 'sagittal' ? 'ring-1 ring-blue-400' : ''}`}
        onClick={() => setActivePlane('sagittal')}
      >
        {generateSlice('sagittal')}
        <div className="absolute top-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
          SAGITTAL
        </div>
      </div>

      {/* Plane selection controls */}
      <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 flex gap-2">
        <button 
          className={`px-3 py-1 text-xs rounded-md transition-colors ${activePlane === 'axial' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
          onClick={() => setActivePlane('axial')}
        >
          Axial
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded-md transition-colors ${activePlane === 'coronal' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
          onClick={() => setActivePlane('coronal')}
        >
          Coronal
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded-md transition-colors ${activePlane === 'sagittal' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
          onClick={() => setActivePlane('sagittal')}
        >
          Sagittal
        </button>
      </div>
    </div>
  )
}

export default Slicer