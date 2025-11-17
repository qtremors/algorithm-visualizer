import { useState, useEffect, useCallback, useRef } from 'react';
import type { AlgorithmStep } from '../types';

export const usePlayback = (steps: AlgorithmStep[]) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);

  const animationFrameId = useRef<number | null>(null);
  const lastUpdateTime = useRef(0);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  // Reset playback if steps array changes
  useEffect(() => {
    reset();
  }, [steps, reset]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const playbackLoop = useCallback((timestamp: number) => {
    if (timestamp - lastUpdateTime.current >= speedRef.current) {
      lastUpdateTime.current = timestamp;
      setCurrentStepIndex(prevIndex => {
        if (prevIndex >= steps.length - 1) {
          setIsPlaying(false);
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }
    animationFrameId.current = requestAnimationFrame(playbackLoop);
  }, [steps.length]);

  useEffect(() => {
    if (isPlaying) {
      lastUpdateTime.current = performance.now();
      animationFrameId.current = requestAnimationFrame(playbackLoop);
    } else if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, playbackLoop]);

  return {
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    isPlaying,
    speed,
    play,
    pause,
    nextStep,
    prevStep,
    reset,
    setSpeed,
  };
};