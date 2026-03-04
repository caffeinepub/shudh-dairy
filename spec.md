# SUNRISE MILK AND AGRO PRODUCT'S

## Current State

A full e-commerce store for dairy products (Ghee and Paneer). The store has:
- Public storefront with product listing, cart, checkout, order tracking
- Admin panel with product management, orders, store settings, founder info, social media, security
- Backend using blob-storage component for product images

The root issue: the backend uses `var products = List.empty<Product>()` (volatile in-memory) alongside `stable var stableProducts`. On every canister upgrade/restart, the in-memory list resets to empty. Products are never reloaded from stableProducts on startup. This causes products to disappear after every deployment.

A secondary issue: image data is passed as `Storage.ExternalBlob` to the backend canister, which exceeds ICP message size limits when base64 data URLs are involved, causing "Operation failed" errors.

## Requested Changes (Diff)

### Add
- Nothing new — pure fix

### Modify
- Backend: remove blob-storage dependency entirely; store product images as plain `Text` (imageUrl); all product/order data in stable variables only; no in-memory lists
- Backend: `addProduct` returns the new product's `Nat` id so the frontend can link the image immediately
- Frontend: update all backend calls to pass `imageUrl: Text` instead of `ExternalBlob`; images stored in localStorage keyed by product id

### Remove
- Backend: remove blob-storage Mixin import and ExternalBlob image field from Product type
- Backend: remove volatile `var products` and `var orders` List variables

## Implementation Plan

1. Regenerate backend with stable-only storage, imageUrl as Text, addProduct returns Nat id
2. Update frontend AdminDashboard to call addProduct/updateProduct with imageUrl string
3. Update frontend StorePage to read product.imageUrl (string) instead of ExternalBlob
4. Ensure fallback category images still work when imageUrl is empty
