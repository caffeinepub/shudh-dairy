# SUNRISE MILK AND AGRO PRODUCT'S

## Current State

Full e-commerce store with:
- Public store page with product listing, cart, checkout, order tracking, founder section, social media
- Admin panel at /admin with login (OTP two-step), product management (add/edit/delete), order management, store settings, founder info, social media, security (change password)
- Backend stores Products, Orders with ExternalBlob image support
- Backend variables `stableProducts`, `stableOrders`, `nextProductId`, `nextOrderId` are declared with `var` but WITHOUT the `stable` keyword -- this causes them to reset to empty on every canister upgrade, making products disappear

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Backend: Mark `stableProducts`, `stableOrders`, `nextProductId`, `nextOrderId` as `stable var` so they survive canister upgrades and restarts permanently

### Remove
- Nothing

## Implementation Plan

1. Regenerate backend Motoko with all persistent state variables declared as `stable var`:
   - `stable var nextProductId : Nat = 1`
   - `stable var nextOrderId : Nat = 1001`
   - `stable var stableProducts : [Product] = []`
   - `stable var stableOrders : [Order] = []`
2. Keep all existing types (Product, OrderItem, Order), functions (addProduct, updateProduct, deleteProduct, getAllProducts, placeOrder, getOrdersByPhone, getAllOrders, updateOrderStatus, adminLogin), and preupgrade/postupgrade hooks identical
3. No frontend changes needed -- backend API stays the same
