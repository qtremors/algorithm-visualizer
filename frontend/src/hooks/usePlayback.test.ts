import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePlayback } from './usePlayback';
import type { AlgorithmStep } from '../types';

describe('usePlayback Hook', () => {
    const mockSteps: AlgorithmStep[] = [
        { type: 'info', payload: {}, snapshot: [], message: 'Step 1', line: 1 },
        { type: 'compare', payload: {}, snapshot: [], message: 'Step 2', line: 2 },
        { type: 'swap', payload: {}, snapshot: [], message: 'Step 3', line: 3 },
    ];

    it('should initialize with correct defaults', () => {
        const { result } = renderHook(() => usePlayback(mockSteps));

        expect(result.current.currentStepIndex).toBe(0);
        expect(result.current.isPlaying).toBe(false);
        expect(result.current.currentStep).toEqual(mockSteps[0]);
    });

    it('should advance to the next step', () => {
        const { result } = renderHook(() => usePlayback(mockSteps));

        act(() => {
            result.current.nextStep();
        });

        expect(result.current.currentStepIndex).toBe(1);
        expect(result.current.currentStep).toEqual(mockSteps[1]);
    });

    it('should go back to the previous step', () => {
        const { result } = renderHook(() => usePlayback(mockSteps));

        act(() => {
            result.current.nextStep();
        });

        act(() => {
            result.current.nextStep();
        });

        act(() => {
            result.current.prevStep();
        });

        expect(result.current.currentStepIndex).toBe(1);
    });

    it('should reset to the start', () => {
        const { result } = renderHook(() => usePlayback(mockSteps));

        act(() => {
            result.current.nextStep();
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.currentStepIndex).toBe(0);
        expect(result.current.isPlaying).toBe(false);
    });

    it('should calculate estimated remaining time correctly', () => {
        const { result } = renderHook(() => usePlayback(mockSteps));

        // Default speed is 200ms
        // Steps length is 3. Current index 0. Remaining steps: 2 (indices 1, 2)
        // Formula: (length - current - 1) * speed
        // (3 - 0 - 1) * 200 = 400ms
        expect(result.current.estimatedRemainingTime).toBe(400);

        act(() => {
            result.current.nextStep();
        });

        // (3 - 1 - 1) * 200 = 200ms
        expect(result.current.estimatedRemainingTime).toBe(200);
    });
});
