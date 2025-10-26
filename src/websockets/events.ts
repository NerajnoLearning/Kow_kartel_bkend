/**
 * WebSocket Event Names
 */

// Booking Events
export const BOOKING_EVENTS = {
  // Emitted when a new booking is created
  CREATED: 'booking:created',

  // Emitted when a booking is updated
  UPDATED: 'booking:updated',

  // Emitted when a booking status changes
  STATUS_CHANGED: 'booking:status_changed',

  // Emitted when a booking is cancelled
  CANCELLED: 'booking:cancelled',

  // Emitted when a booking is confirmed
  CONFIRMED: 'booking:confirmed',

  // Emitted when a booking starts
  STARTED: 'booking:started',

  // Emitted when a booking is completed
  COMPLETED: 'booking:completed',

  // Emitted when a booking is deleted
  DELETED: 'booking:deleted',
} as const;

// Payment Events
export const PAYMENT_EVENTS = {
  // Emitted when a payment intent is created
  INTENT_CREATED: 'payment:intent_created',

  // Emitted when a payment succeeds
  SUCCEEDED: 'payment:succeeded',

  // Emitted when a payment fails
  FAILED: 'payment:failed',

  // Emitted when a refund is processed
  REFUNDED: 'payment:refunded',
} as const;

// Equipment Events
export const EQUIPMENT_EVENTS = {
  // Emitted when equipment is created
  CREATED: 'equipment:created',

  // Emitted when equipment is updated
  UPDATED: 'equipment:updated',

  // Emitted when equipment status changes
  STATUS_CHANGED: 'equipment:status_changed',

  // Emitted when equipment is deleted
  DELETED: 'equipment:deleted',

  // Emitted when equipment availability changes
  AVAILABILITY_CHANGED: 'equipment:availability_changed',
} as const;

// System Events
export const SYSTEM_EVENTS = {
  // Connection confirmed
  CONNECTED: 'connected',

  // Error occurred
  ERROR: 'error',

  // Notification
  NOTIFICATION: 'notification',
} as const;

export type BookingEventName = typeof BOOKING_EVENTS[keyof typeof BOOKING_EVENTS];
export type PaymentEventName = typeof PAYMENT_EVENTS[keyof typeof PAYMENT_EVENTS];
export type EquipmentEventName = typeof EQUIPMENT_EVENTS[keyof typeof EQUIPMENT_EVENTS];
export type SystemEventName = typeof SYSTEM_EVENTS[keyof typeof SYSTEM_EVENTS];
