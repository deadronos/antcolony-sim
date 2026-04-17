import { describe, it, expect } from 'vitest';
import { getIndex, getIndexUnsafe, inBounds } from './grid';

describe('Grid Utilities', () => {
    describe('inBounds', () => {
        it('should return true for valid coordinates', () => {
            expect(inBounds(0, 0)).toBe(true);
            expect(inBounds(64, 64)).toBe(true);
            expect(inBounds(127, 127)).toBe(true);
        });

        it('should return false for out of bounds coordinates', () => {
            expect(inBounds(-1, 0)).toBe(false);
            expect(inBounds(0, -1)).toBe(false);
            expect(inBounds(128, 0)).toBe(false);
            expect(inBounds(0, 128)).toBe(false);
            expect(inBounds(200, 200)).toBe(false);
        });
    });

    describe('getIndex', () => {
        it('should return correct index for valid coordinates', () => {
            expect(getIndex(0, 0)).toBe(0);
            expect(getIndex(1, 0)).toBe(1);
            expect(getIndex(0, 1)).toBe(128);
            expect(getIndex(127, 127)).toBe(128 * 127 + 127);
        });

        it('should handle fractional coordinates correctly', () => {
            expect(getIndex(10.3, 20.7)).toBe(getIndex(10, 20));
            expect(getIndex(10.9, 20.1)).toBe(getIndex(10, 20));
        });

        it('should return -1 for negative coordinates', () => {
            expect(getIndex(-1, 0)).toBe(-1);
            expect(getIndex(0, -1)).toBe(-1);
            expect(getIndex(-10, -20)).toBe(-1);
        });

        it('should return -1 for coordinates beyond world bounds', () => {
            expect(getIndex(128, 0)).toBe(-1);
            expect(getIndex(0, 128)).toBe(-1);
            expect(getIndex(200, 200)).toBe(-1);
        });
    });

    describe('getIndexUnsafe', () => {
        it('should return correct index for valid coordinates', () => {
            expect(getIndexUnsafe(0, 0)).toBe(0);
            expect(getIndexUnsafe(1, 0)).toBe(1);
            expect(getIndexUnsafe(0, 1)).toBe(128);
        });

        it('should handle fractional coordinates correctly', () => {
            expect(getIndexUnsafe(10.3, 20.7)).toBe(getIndexUnsafe(10, 20));
        });

        it('should NOT bounds-check - use only when you know coords are valid', () => {
            // Unsafe version doesn't check - useful in hot paths after bounds validation
            expect(getIndexUnsafe(-1, 0)).toBeLessThan(0);
            expect(getIndexUnsafe(0, -1)).toBeLessThan(0);
        });
    });
});
