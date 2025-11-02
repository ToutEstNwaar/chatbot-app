import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  audioData: Uint8Array;
}

const Waveform: React.FC<WaveformProps> = ({ audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioData || audioData.length === 0) return;

    const height = canvas.height;
    const width = canvas.width;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.clearRect(0, 0, width, height);
    
    const barWidth = 2;
    const gap = 1;
    const numBars = Math.floor(width / (barWidth + gap));
    // Use a subset of the frequency data for a more stable visualization
    const relevantData = Array.from(audioData).slice(0, Math.floor(audioData.length * 0.7));
    const step = Math.max(1, Math.floor(relevantData.length / numBars));
    
    let x = 0;

    for (let i = 0; i < numBars; i++) {
      const index = i * step;
      const value = (relevantData[index] || 0) / 255.0;
      const barHeight = Math.max(2, value * height);

      // Symmetrically draw the bar from the center
      const y = (height - barHeight) / 2;

      // Use a gradient for a nicer look
      const gradient = context.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, "rgb(147 197 253)"); // blue-300
      gradient.addColorStop(1, "rgb(59 130 246)"); // blue-500
      context.fillStyle = gradient;
      
      context.fillRect(x, y, barWidth, barHeight);
      x += barWidth + gap;
    }
  }, [audioData]);

  // Set the canvas resolution explicitly, then scale with CSS for crispness
  return <canvas ref={canvasRef} width="300" height="40" className="w-full h-full" />;
};

export default Waveform;
