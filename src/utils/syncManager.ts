import { db, getPendingOrders, markOrderAsSynced } from './offlineDb';
import { supabase } from '../supabaseClient'; // Ensure correct path to your client

export const syncOfflineOrders = async () => {
  if (!navigator.onLine) return; // Don't try if still offline

  const pendingOrders = await getPendingOrders();

  if (pendingOrders.length === 0) return;

  console.log(`Syncing ${pendingOrders.length} offline orders...`);

  for (const order of pendingOrders) {
    try {
      // Assuming 'orders' is your main table in Supabase
      // Adjust the payload structure if necessary to match Supabase requirements
      // For example, remove any local-only fields
      const { data, error } = await supabase.rpc('sell_items', { 
        order_payload: order.payload 
      });

      if (error) {
        console.error('Failed to sync order:', error);
        // Optional: Implement retry logic or move to 'failed' queue
      } else {
        console.log('Synced order:', data);
        
        // Handle Loyalty if customerId was present
        if (order.payload.customerId && data?.order_id) {
            await supabase.from('orders').update({ customer_id: order.payload.customerId }).eq('id', data.order_id);
            const points = Math.floor(order.payload.totalAmount / 100);
            await supabase.rpc('add_loyalty_points', { customer_id: order.payload.customerId, points });
        }

        if (order.id) {
            await markOrderAsSynced(order.id);
        }
      }
    } catch (err) {
      console.error('Error during sync:', err);
    }
  }
};

// Setup a listener for online events
export const setupSyncListener = () => {
  window.addEventListener('online', () => {
    console.log('App is back online. Syncing...');
    syncOfflineOrders();
  });
};
