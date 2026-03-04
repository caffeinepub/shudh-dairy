# SUNRISE MILK AND AGRO PRODUCT'S

## Current State

A full e-commerce dairy store with:
- Public StorePage showing products loaded from backend canister via `actor.getAllProducts()`
- Admin panel at `/admin/dashboard` for managing products, orders, settings, social media, founder info, and security
- Products stored permanently in backend using stable Motoko variables
- Product images stored via blob-storage component (`ExternalBlob`)
- The `addProduct` and `updateProduct` backend calls accept `ExternalBlob` as the image field
- In the admin's `handleSave`, images are uploaded with `ExternalBlob.fromBytes(bytes).withUploadProgress(...)`
- `StorePage` loads products when `actor` is available and `!actorLoading`
- `getDirectURL()` is called on the product's ExternalBlob to get the image URL

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- **StorePage**: Fix products not appearing -- the `useEffect` dependency on both `actor` and `actorLoading` creates a timing gap where products never load; fix by triggering load whenever `actor` changes (is non-null), regardless of `actorLoading` state. Also ensure a fallback category image is shown if `getDirectURL()` returns empty string.
- **AdminDashboard**: Fix product photo upload -- images are currently uploaded as raw bytes which can exceed ICP message limits for large photos. Fix by resizing/compressing images to max 800x800 before converting to bytes, and using `ExternalBlob.fromBytes(compressedBytes)`. Also ensure the Save button is never disabled due to actor connection state when actor is already available.
- **AdminDashboard**: Fix the `Save` button being disabled when `actorLoading` is true but `actor` is already present -- the button should only be disabled when `actor` is actually null, not when `actorLoading` is true.

### Remove
- Nothing

## Implementation Plan

1. In `StorePage.tsx`:
   - Change the `useEffect` to trigger `loadProductsFromBackend` when `actor` becomes non-null (remove dependency on `actorLoading`)
   - In the `loadProductsFromBackend` function, use `p.image.getDirectURL() || categoryDefaultImage(p.category)` as the image (already done but verify)
   - Add a retry mechanism: if `actor` is null after 2 seconds, retry loading

2. In `AdminDashboard.tsx`:
   - In `handleSave`, add image compression before upload: use Canvas API to resize image to max 800x800px and compress to JPEG 0.75 quality before converting to `Uint8Array`
   - Change the Save button's `disabled` condition from `isSaving || actorLoading || !actor` to `isSaving || !actor`
   - Ensure error messages are clear when image upload fails
