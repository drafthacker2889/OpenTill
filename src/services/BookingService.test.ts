import { describe, it, expect } from 'vitest';
import { BookingService } from './BookingService';

describe('BookingService', () => {
  describe('calculateDuration', () => {
    it('should return 90 minutes for 2 people', () => {
      expect(BookingService.calculateDuration(2)).toBe(90);
    });

    it('should return 105 minutes for 4 people', () => {
      expect(BookingService.calculateDuration(4)).toBe(105);
    });

    it('should return 120 minutes for 6 people', () => {
      expect(BookingService.calculateDuration(6)).toBe(120);
    });

    it('should return 180 minutes for large groups', () => {
      expect(BookingService.calculateDuration(12)).toBe(180);
    });
  });
});
