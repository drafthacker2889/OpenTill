import { db, getPendingOrders, getOfflineKitchenTickets, markOrderAsSynced } from './offlineDb';
import { supabase } from '../supabaseClient'; // Ensure correct path to your client

export const syncOfflineOrders = async () => {
  if (!navigator.onLine) return; // Don't try if still offline

  // 1. Sync Orders
  const pendingOrders = await getPendingOrders();

  if (pendingOrders.length > 0) {
      console.log(`Syncing ${pendingOrders.length} offline orders...`);
      for (const order of pendingOrders) {
        try {
          const { data, error } = await supabase.rpc('sell_items', { 
            order_payload: order.payload 
          });

          if (error) {
            console.error('Failed to sync order:', error);
          } else {
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
  }

  // 2. Sync Kitchen Tickets - DEPRECATED
  // sell_items RPC now creates tickets automatically.
  // We disable this to prevent duplicate tickets on sync.
  /*
  const pendingTickets = await getOfflineKitchenTickets();
  if (pendingTickets.length > 0) {
      console.log(`Syncing ${pendingTickets.length} offline kitchen tickets...`);
      for (const ticket of pendingTickets) {
          try {
              // Try to merge with existing pending ticket for same table first (optional but good)
              // Or just insert as new
              const { error } = await supabase.from('kitchen_tickets').insert({
                  table_number: ticket.table_number,
                  items: ticket.items,
                  status: 'PENDING',
                  created_at: ticket.created_at // Preserve original time
              });

              if (error) {
                  console.error("Failed to sync ticket", error);
              } else {
                  // Mark as COMPLETED locally so we don't sync again
                  // We can delete it or update status. Let's delete.
                  if (ticket.id) await db.kitchenTickets.delete(ticket.id);
              }
          } catch(err) {
              console.error("Error syncing ticket", err);
          }
      }
  }
  */
};

// Setup a listener for online events
export const setupSyncListener = () => {
  window.addEventListener('online', () => {
    console.log('App is back online. Syncing...');
    syncOfflineOrders();
  });
};
