// src/services/inventory.integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// MOCK OR REAL SUPABASE URL?
// For this script, we assume connecting to the real dev project for integration testing.
// In a CI/CD pipeline, you'd spin up a local docker container or use a test project.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Inventory & Sales RPC Integration', () => {

  it('Deducts stock correctly after sale', async () => {
    // 1. Get a product variant with stock tracking
    const { data: variants } = await supabase
        .from('variants')
        .select('*')
        .eq('track_stock', true)
        .gt('stock_quantity', 10)
        .limit(1);

    if (!variants || variants.length === 0) {
        console.warn("Skipping test: No suitable variant found.");
        return;
    }

    const testItem = variants[0];
    const initialStock = testItem.stock_quantity;
    const sellQty = 2;

    // 2. Execute Sale (RPC)
    const payload = {
        userId: null, // Anon/Kiosk
        branchId: null, 
        totalAmount: testItem.price * sellQty,
        paymentMethod: 'CASH_TEST',
        items: [{
            id: testItem.id,
            name: testItem.name,
            price: testItem.price,
            quantity: sellQty,
            modifiers: []
        }]
    };

    const { data, error } = await supabase.rpc('sell_items', { order_payload: payload });
    expect(error).toBeNull();
    expect(data.success).toBe(true);

    // 3. Verify Stock Deduction
    const { data: updated } = await supabase
        .from('variants')
        .select('stock_quantity')
        .eq('id', testItem.id)
        .single();

    expect(updated).not.toBeNull();
    if (updated) {
        expect(updated.stock_quantity).toBe(initialStock - sellQty);
    }
  });
});
