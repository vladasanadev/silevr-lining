'use client';

import { useEffect, useRef } from 'react';
import { Application } from '@splinetool/runtime';

interface SplineCanvasProps {
  splineUrl: string;
  className?: string;
  onLoaded?: () => void;
}

export default function SplineCanvas({ splineUrl, className, onLoaded }: SplineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create new application
    const app = new Application(canvasRef.current);
    appRef.current = app;

    // Load the scene
    app.load(splineUrl)
      .then(() => {
        console.log('Spline scene loaded successfully');
        if (onLoaded) onLoaded();
      })
      .catch(error => {
        console.error('Error loading Spline scene:', error);
      });

    // Handle window resize
    const handleResize = () => {
      if (appRef.current && canvasRef.current) {
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        appRef.current.setSize(width, height);
      }
    };

    // Initial size set
    handleResize();
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (appRef.current) {
        try {
          appRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Spline app:', e);
        }
      }
    };
  }, [splineUrl, onLoaded]);

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}