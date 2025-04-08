'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Dynamic import for ModelViewer with SSR disabled (WebXR + three.js-friendly)
const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false })

// Placeholder Slicer Component
const Slicer = ({ modelUrl }: { modelUrl: string }) => (
  <div className="w-full h-full bg-gray-950 flex items-center justify-center text-gray-400">
    Slicer Placeholder for: {modelUrl.split('/').pop()}
  </div>
)

export default function WebXRLayout() {
  const [activeTab, setActiveTab] = useState<'model' | 'slicer'>('model')
  const [selectedModel, setSelectedModel] = useState<string>('/models/1_1.glb')

  const handleTabChange = (tab: 'model' | 'slicer') => setActiveTab(tab)
  const handleModelChange = (modelUrl: string) => setSelectedModel(modelUrl)

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden">
      {/* Top Tab Bar */}
      <div className="flex justify-center items-center bg-gray-900 border-b border-gray-800 shadow-md">
        <div className="flex space-x-2 p-2">
          <Button
            variant={activeTab === 'model' ? 'default' : 'ghost'}
            className={cn(
              'text-white rounded-xl px-6 py-2',
              activeTab === 'model' ? 'bg-primary' : 'hover:bg-gray-800'
            )}
            onClick={() => handleTabChange('model')}
          >
            Model Viewer
          </Button>
          <Button
            variant={activeTab === 'slicer' ? 'default' : 'ghost'}
            className={cn(
              'text-white rounded-xl px-6 py-2',
              activeTab === 'slicer' ? 'bg-primary' : 'hover:bg-gray-800'
            )}
            onClick={() => handleTabChange('slicer')}
          >
            Slicer
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow relative overflow-hidden">
        {/* Keep both components mounted; use visibility instead of conditionally rendering */}
        <div className={cn('absolute inset-0', activeTab !== 'model' && 'hidden')}>
          <ModelViewer modelUrl={selectedModel} />
        </div>
        <div className={cn('absolute inset-0', activeTab !== 'slicer' && 'hidden')}>
          <Slicer modelUrl={selectedModel} />
        </div>
      </div>

      {/* Bottom Model Selector */}
      <div className="bg-gray-900 border-t border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <span className="text-sm text-gray-400">Select Model:</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className={cn(
                'rounded-lg bg-gray-800 hover:bg-gray-700 text-white',
                selectedModel === '/models/1_1.glb' && 'border border-primary'
              )}
              onClick={() => handleModelChange('/models/1_1.glb')}
            >
              Model 1
            </Button>
            <Button
              variant="secondary"
              className={cn(
                'rounded-lg bg-gray-800 hover:bg-gray-700 text-white',
                selectedModel === '/models/2_1.glb' && 'border border-primary'
              )}
              onClick={() => handleModelChange('/models/2_1.glb')}
            >
              Model 2
            </Button>
            <Button
              variant="secondary"
              className={cn(
                'rounded-lg bg-gray-800 hover:bg-gray-700 text-white',
                selectedModel === '/models/3_1.glb' && 'border border-primary'
              )}
              onClick={() => handleModelChange('/models/3_1.glb')}
            >
              Model 3
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}