'use client'
import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { ModelViewerHandle } from './ModelViewer'

const ModelViewer = dynamic(() => import('./ModelViewer'), { 
  ssr: false,
  loading: () => <div className="bg-gray-900/50 flex items-center justify-center">Loading 3D...</div>
})

const Slicer = ({ modelUrl }: { modelUrl: string }) => {
  const [activePlane, setActivePlane] = useState<'axial' | 'coronal' | 'sagittal'>('axial')
  const [slicePosition, setSlicePosition] = useState(0.5)
  const modelRef = useRef<ModelViewerHandle>(null)

  const generateSlice = (plane: string) => (
    <div className="relative h-full w-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">{plane.toUpperCase()} SLICE</p>
        <p className="text-[0.6rem] text-gray-600">{Math.round(slicePosition * 100)}%</p>
      </div>
      
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3/4">
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
    <div className="flex items-center justify-center min-h-screen w-full bg-black p-4">
      <div className="flex flex-col items-center w-full max-w-4xl ">
        {/* 4-panel grid */}
        <div className="grid grid-cols-2 grid-rows-2 flex-grow w-full border border-gray-800 rounded-lg overflow-hidden h-[70vh]">
          {/* 3D View (Top Left) */}
          <div className="relative border-r border-b border-gray-800">
            <ModelViewer 
              modelUrl={modelUrl} 
              ref={modelRef}
              slicePlane={activePlane}
              slicePosition={slicePosition}
              className="h-full"
            />
            <div className="absolute top-1 left-1 text-xs text-gray-400 bg-black/50 px-1 py-0.5 rounded">
              3D VOLUME
            </div>
          </div>

          {/* Axial Slice (Top Right) */}
          <div 
            className={`relative border-b border-gray-800 ${activePlane === 'axial' ? 'ring-1 ring-blue-400' : ''}`}
            onClick={() => setActivePlane('axial')}
          >
            {generateSlice('axial')}
            <div className="absolute top-1 left-1 text-xs text-gray-400 bg-black/50 px-1 py-0.5 rounded">
              AXIAL
            </div>
          </div>

          {/* Coronal Slice (Bottom Left) */}
          <div 
            className={`relative border-r border-gray-800 ${activePlane === 'coronal' ? 'ring-1 ring-blue-400' : ''}`}
            onClick={() => setActivePlane('coronal')}
          >
            {generateSlice('coronal')}
            <div className="absolute top-1 left-1 text-xs text-gray-400 bg-black/50 px-1 py-0.5 rounded">
              CORONAL
            </div>
          </div>

          {/* Sagittal Slice (Bottom Right) */}
          <div 
            className={`relative ${activePlane === 'sagittal' ? 'ring-1 ring-blue-400' : ''}`}
            onClick={() => setActivePlane('sagittal')}
          >
            {generateSlice('sagittal')}
            <div className="absolute top-1 left-1 text-xs text-gray-400 bg-black/50 px-1 py-0.5 rounded">
              SAGITTAL
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-3 flex justify-center w-full">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-1 flex gap-1">
            <button 
              className={`px-3 py-1 text-xs rounded-md ${activePlane === 'axial' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => setActivePlane('axial')}
            >
              Axial
            </button>
            <button 
              className={`px-3 py-1 text-xs rounded-md ${activePlane === 'coronal' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => setActivePlane('coronal')}
            >
              Coronal
            </button>
            <button 
              className={`px-3 py-1 text-xs rounded-md ${activePlane === 'sagittal' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => setActivePlane('sagittal')}
            >
              Sagittal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Slicer