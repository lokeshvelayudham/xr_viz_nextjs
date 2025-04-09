'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Slicer from '@/components/SlicerFull'

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-black">
      <div className="text-xs tracking-widest text-gray-500 animate-pulse">LOADING...</div>
    </div>
  )
})


export default function XRPage() {
  const [activeTab, setActiveTab] = useState<'model' | 'slicer'>('model')
  const [selectedModel, setSelectedModel] = useState<string>('/models/1_1.glb')

  const models = [
    { name: 'CV-1', path: '/models/1_1.glb' },
    { name: 'CV-2', path: '/models/1_2.glb' },
    { name: 'CV-3', path: '/models/1_3.glb' },
  ]

  return (
    <div className="flex flex-col h-screen w-full bg-black text-gray-300 overflow-hidden">
      {/* Top Tab Bar */}
      <motion.div 
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex p-0.5 rounded-full bg-black/80 backdrop-blur-md border border-gray-800/50">
          {['model', 'slicer'].map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-full px-4 py-1 text-xs tracking-wider',
                activeTab === tab
                  ? 'text-white bg-gray-800/60'
                  : 'text-gray-500 hover:text-white'
              )}
              onClick={() => setActiveTab(tab as 'model' | 'slicer')}
            >
              {tab.toUpperCase()}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-grow relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {activeTab === 'model' ? (
              <ModelViewer modelUrl={selectedModel} />
            ) : (
              <Slicer  modelUrl={selectedModel} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Model Selector (positioned above branding) */}
      <motion.div
        className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-30"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex gap-1 p-1 rounded-full bg-black/70 backdrop-blur-md border border-gray-800/50">
          {models.map((model) => (
            <Button
              key={model.path}
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-full px-3 py-1 text-xs',
                selectedModel === model.path
                  ? 'text-white bg-gray-800/60'
                  : 'text-gray-500 hover:text-white'
              )}
              onClick={() => setSelectedModel(model.path)}
            >
              {model.name}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Subtle Branding */}
      <motion.div
        className="fixed bottom-2 left-2 text-[0.6rem] text-gray-600 tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        BioInVision
      </motion.div>
    </div>
  )
}