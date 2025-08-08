import { describe, expect, it } from 'vitest';
import { getItemsSummary, OrderItem } from './order-tracking';

describe('getItemsSummary', () => {
  it('formats items with string values', () => {
    const items: OrderItem[] = [
      { clothingItem: 'Shirt', service: 'Wash', quantity: 2 },
      { clothingItem: 'Pants', service: 'Dry', quantity: 1 },
    ];
    expect(getItemsSummary(items)).toBe('2x Shirt (Wash), 1x Pants (Dry)');
  });

  it('formats items with object values', () => {
    const items: OrderItem[] = [
      { clothingItem: { name: 'Jacket' }, service: { name: 'Dry Clean' }, quantity: 3 },
    ];
    expect(getItemsSummary(items)).toBe('3x Jacket (Dry Clean)');
  });
});
