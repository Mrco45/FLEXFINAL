export enum OrderStatus {
  NewOrder = 'New Order',
  InProgress = 'In Progress',
  ReadyForPickup = 'Ready for Pickup',
  Completed = 'Completed',
}

export interface AttachmentFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 representation
}

// New interface for line items in an order
export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  cost: number;
  width?: number; // Width in cm or user unit
  height?: number; // Height in cm or user unit
}

export interface Order {
  id: string; // "FLEX-UNIQUEID"
  customerName: string;
  phoneNumber: string;
  orderDate: string; // YYYY-MM-DD format
  items: OrderItem[];
  totalCost: number; // This will be calculated from items
  amountPaid: number;
  attachments: AttachmentFile[];
  status: OrderStatus;
}
