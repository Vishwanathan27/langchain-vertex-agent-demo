import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface GoldParticlesProps {
  count?: number;
  intensity?: 'light' | 'medium' | 'heavy';
  trigger?: boolean;
}

const GoldParticles: React.FC<GoldParticlesProps> = ({
  count = 50,
  intensity = 'light',
  trigger = true
}) => {
  const { isDark } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  useEffect(() => {
    if (!trigger || !windowSize.width || !windowSize.height) return;

    const generateParticles = () => {
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * windowSize.width,
          y: -20,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.6 + 0.2,
          duration: Math.random() * 4 + 3,
          delay: Math.random() * 2
        });
      }
      
      setParticles(newParticles);
    };

    generateParticles();
    
    const interval = setInterval(generateParticles, 
      intensity === 'heavy' ? 2000 : 
      intensity === 'medium' ? 4000 : 8000
    );

    return () => clearInterval(interval);
  }, [count, intensity, trigger, windowSize]);

  if (!isDark || !trigger) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-amber-300 to-yellow-400"
            style={{
              width: particle.size,
              height: particle.size,
              left: particle.x,
              opacity: particle.opacity,
            }}
            initial={{ y: -20, opacity: 0, scale: 0 }}
            animate={{ 
              y: windowSize.height + 20,
              opacity: [0, particle.opacity, 0],
              scale: [0, 1, 0.5, 0],
              x: particle.x + Math.sin(Date.now() * 0.001) * 100
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "linear",
              repeat: Infinity
            }}
            exit={{ opacity: 0, scale: 0 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GoldParticles;