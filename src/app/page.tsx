'use client';
// import dynamic from 'next/dynamic';
// import ThreeScene from '@/components/ThreeScene';
import ModelViewer from '@/components/ModelViewer';
// const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false });

export default function Home() {
  return (
    <main>
      {/* <ThreeScene /> */}
     
        <ModelViewer modelUrl="/models/1_2.glb" />
      

    </main>
  );
}