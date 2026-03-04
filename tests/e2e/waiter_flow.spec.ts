import { test, expect } from '@playwright/test';

test('Wait Staff Flow: Table -> Order -> Payment', async ({ page }) => {
  // 1. Simulating Localhost Access
  await page.goto('http://localhost:5175');  // Updated port

  // 2. Open a Table
  // Assuming "Table 1" is available and clickable
  await page.getByText('Table 1', { exact: false }).first().click();
  
  // 3. Add Items
  // Click "Espresso" if it exists
  await page.getByText('Espresso', { exact: false }).first().click();
  
  // Add another item with modifiers if possible
  // await page.getByText('Latte').click();
  // await page.getByText('Soy Milk').click(); 
  // await page.getByText('Add to Cart').click();

  // 4. Send to Kitchen
  await page.getByText('Send to Kitchen', { exact: false }).click();
  
  // 5. Verify Kitchen Ticket Sent (Toast or Status Change)
  // await expect(page.getByText('Order Sent')).toBeVisible();

  // 6. Checkout
  await page.getByText('Pay Now', { exact: false }).click();
  await page.getByText('Cash', { exact: false }).click();
  await page.getByText('Complete Payment', { exact: false }).click();

  // 7. Verify Success
  await expect(page.getByText('Payment Successful')).toBeVisible();
});
