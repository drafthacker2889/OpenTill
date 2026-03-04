import Dexie, { Table } from 'dexie';

// Interface for pending offline orders
export interface OfflineOrder {
  id?: number; // Auto-incremented ID for IndexedDB
  payload: any; // The full order payload usually sent to Supabase
  created_at: number; // Timestamp
  table_id?: string;
  status: 'pending' | 'syncing' | 'synced';
}

export interface OfflineKitchenTicket {
  id?: number; // Auto-incremented
  table_number: string;
  items: any[];
  status: 'PENDING' | 'COMPLETED' | 'VOIDED';
  created_at: string;
  is_offline: boolean; // Flag to identify locally
}

export class OfflineDatabase extends Dexie {
  orders!: Table<OfflineOrder>;
  kitchenTickets!: Table<OfflineKitchenTicket>;

  constructor() {
    super('OpenTillOfflineDB');
    this.version(2).stores({
      orders: '++id, created_at, status',
      kitchenTickets: '++id, status, created_at'
    });
  }
}

export const db = new OfflineDatabase();

export const saveOfflineOrder = async (orderPayload: any) => {
  await db.orders.add({
    payload: orderPayload,
    created_at: Date.now(),
    status: 'pending'
  });
};

export const saveOfflineKitchenTicket = async (ticket: OfflineKitchenTicket) => {
    await db.kitchenTickets.add(ticket);
};

export const getPendingOrders = async () => {
  return await db.orders.where('status').equals('pending').toArray();
};

export const getOfflineKitchenTickets = async () => {
    return await db.kitchenTickets.where('status').notEqual('COMPLETED').toArray();
};

export const markOrderAsSynced = async (id: number) => {
  await db.orders.delete(id);
};
