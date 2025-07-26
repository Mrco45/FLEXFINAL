import { OrderStatus } from './types';

export const ALL_STATUSES: OrderStatus[] = [
  OrderStatus.NewOrder,
  OrderStatus.InProgress,
  OrderStatus.ReadyForPickup,
  OrderStatus.Completed,
];

export const STATUS_COLORS: Record<OrderStatus, { base: string; text: string; border: string }> = {
  [OrderStatus.NewOrder]: { base: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  [OrderStatus.InProgress]: { base: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  [OrderStatus.ReadyForPickup]: { base: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  [OrderStatus.Completed]: { base: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
};
