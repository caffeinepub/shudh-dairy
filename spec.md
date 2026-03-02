# SUNRISE MILK AND AGRO PRODUCT'S

## Current State

A Motoko + React e-commerce store for dairy products (Ghee, Paneer). Features:
- Public StorePage with product grid, category filters, search, cart drawer
- Admin login (/admin) with username/password auth
- Admin dashboard (/admin/dashboard) to add/edit/delete products (name, description, price, weight, category, inStock)
- Products have a hardcoded image field mapped by category (no per-product image upload)
- Store header has a text logo with a cow emoji, no real logo image
- Theme is hardcoded OKLCH tokens in index.css (warm parchment + saffron-gold)
- No theme customization from the admin panel

## Requested Changes (Diff)

### Add
- Product image upload: each product can have a custom photo uploaded via the admin dashboard (add/edit modal). Uses blob-storage component.
- Store logo upload: admin can upload a logo image that replaces the cow emoji + text in the store header. Stored via blob-storage.
- Theme/color customization: admin can set a primary color and background color for the store from the admin dashboard. Settings saved to backend.
- Backend: new fields on Product — imageUrl (Text). New settings type for storeSettings (logoUrl, primaryColor, bgColor).
- Backend: new canister methods — uploadLogo, getStoreSettings, updateStoreSettings.

### Modify
- ProductCard: use product.imageUrl if set, otherwise fall back to category default image.
- StorePage header: show uploaded logo image if set, otherwise fall back to cow emoji + text.
- StorePage: load store settings from backend and apply primary color + bg color as CSS variables dynamically.
- AdminDashboard add/edit product modal: add image upload field using blob-storage.
- AdminDashboard: add a "Store Settings" section for logo upload + theme color pickers.

### Remove
- Nothing removed.

## Implementation Plan

1. Select blob-storage component.
2. Regenerate Motoko backend with:
   - Product type gains imageUrl: Text field
   - addProduct / updateProduct include imageUrl param
   - StoreSettings type: logoUrl, primaryColor, bgColor
   - getStoreSettings() and updateStoreSettings() methods
3. Frontend:
   - Wire blob-storage upload hook for product image in admin modal (upload file → get URL → store in form)
   - Wire blob-storage upload hook for logo in admin Store Settings panel
   - Store Settings panel: color pickers for primary and background colors
   - StorePage: fetch storeSettings on load, apply colors as inline CSS variables on root element
   - StorePage header: display logo image if set
   - ProductCard: use product.imageUrl if set, else category fallback
