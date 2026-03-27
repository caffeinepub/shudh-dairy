# Shree Nath Dairy

## Current State
Checkout flow has a single payment path: order placed → UPI QR shown on confirmation screen.

## Requested Changes (Diff)

### Add
- Payment method selection step in checkout: Cash on Delivery vs Prepaid/UPI
- New `payment` step in checkout flow for prepaid orders — shows UPI QR and "I Have Paid" button
- When customer clicks "I Have Paid", order status is auto-updated to "Confirmed" via `updateOrderStatus` backend call
- Confirmation screen shows payment method badge (green for Prepaid, amber for COD)

### Modify
- `CartDrawer.tsx`: add payment method state, selection UI, payment step, and auto-confirm logic
- COD orders continue to "Pending" status; prepaid orders are auto-confirmed

### Remove
- UPI QR from the confirmation screen (it now appears in the dedicated payment step)

## Implementation Plan
1. Add `paymentMethod` state and `"payment"` step to CartDrawer
2. Add payment method selection cards (COD / Prepaid) in checkout form
3. Add payment step UI with QR code and "I Have Paid" button
4. Call `actor.updateOrderStatus("", BigInt(orderId), "Confirmed")` on payment confirmation
5. Update ConfirmationStep to show payment method badge
