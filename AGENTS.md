# You are helping the user adapt the Yusir platform into a modular system with the Ecolance brand identity.

## Goal
Complete the transformation of the Yusir platform into a modular system, fixing functionality, adding missing features, and applying the new Ecolance visual identity.

## Constraints & Preferences
- (none)

## Progress
### Done
- Created `src/` entirely: `core/`, `modules/`, `shared/` with 5 entry points
- Map Module: `MapManager.js` (Singleton), `LayerManager.js`, `MarkerFactory.js`, `PopupFactory.js`, `GeoJsonService.js`, `MapEvents.js`
- Governorates / Districts / FieldData Modules
- Stores Module: `StoreRepository.js`, `StoreService.js`, `StoreController.js`, `StoreSidebar.js`, `StoreCard.js`
- Cart Module: `CartManager.js`, `CartStorage.js`, `CartUI.js`
- Checkout Module: `CheckoutManager.js` (Event-driven)
- Reviews Module: `ReviewService.js`, `ReviewUI.js`
- Search Module: `SearchController.js` — Arabic Nominatim + Debounce
- Users: `AuthService.js` (fixed `pass`, added `getMerchants`/`saveMerchants`)
- Shared: `Toast.js`
- Fixed PickMarker in Admin (L.marker + draggable: true)
- Added District Dropdown in Admin (from DistrictService)
- Removed 6 old files: `app.js`, `admin.js`, `merchant.js`, `login.js`, `super-admin.js`, `config.js`
- Updated `README.md`
- Converted all HTML to `type="module"` (5 pages)
- Updated APP_CONFIG
- Map: Esri World Imagery default with layer switcher
- Category Bar
- Cart Items: Cards
- Git: resolved PR #8 conflicts, merged `dev` into `main`, pushed to GitHub
- Hidden Zoom Controls + Attribution
- Products added directly to cart without ProductModal
- Redesigned Checkout Modal
- Hidden scrollbar in payment window and store interface
- Sidebar products in 2 columns on mobile
- Added mobile field for merchant in super admin
- Unified product image dimensions via `aspect-ratio` + `object-fit: cover`
- Added Cropper.js for image cropping
- Connected statistics (total products, available, out of stock)
- Added Excel export/import (SheetJS)
- Added product edit modal with all fields
- Added `stock_qty` field
- Redesigned `dashboard.css` with global standards
- Replaced project font with Cairo
- Added store location map in merchant panel (Leaflet Drag Marker)
- **Replaced platform name and logo with `src/assets/ecolance.png`** on all pages
- **Updated colors to Ecolance identity**: `--primary: #F28E6B`, `--accent: #1E2A3A`
- Updated all colors in `style.css`, `dashboard.css`, `admin.css`, `login.html`, `PopupFactory.js`, `MarkerFactory.js`, `merchant-main.js`
- Added orange bottom border to topbar
- Updated Login page background to Navy with gradient
- **Exported demo merchant account**: `merchant@demo.com` / `demo123`
- **Fixed merchant-main.js**: added `_initLogout()`, null guards for all DOM and libraries (L, Cropper, XLSX), fixed `onerror` for images, fixed `_saveStore()`, improved `_renderProducts()` using `innerHTML` instead of `appendChild` + `innerHTML +=`
- **Fixed super-admin-main.js**: null guards for all DOM functions (`_initPlanSelect`, `_initEvents`, `_addMerchant`, `_render`)
- **Fixed super-admin.html**: try-catch in inline session check
- **Fixed dom.js**: `startsWith("data")` → `startsWith("data-")` + added typeof v === "function" for `startsWith("on")`
- **Reduced logo**: `brand-logo` → `height: 22px; max-width: 100px` (reduced from 28px/120px)
- **Added flex-shrink:0 for logo and its containers** in `style.css` and `dashboard.css` to prevent stretching in Flexbox
- **Cart responsive**: Media Query at `max-width: 450px`
- **Fixed product image sizes**: `max-height: 200px` and `pc-img-wrap`
- **Fixed logo in super-admin and merchant**: was showing at full size because `style.css` is not imported in `super-admin.html` and `merchant.html`. Added `.brand-logo` definition directly in `dashboard.css`.
- **Satellite map for merchant**: Replaced OSM layer with Esri World Imagery in `merchant-main.js:84`
- **Added governorate and district dropdowns in merchant panel**: Replaced "City" field with two dropdowns (Governorate + District), populated from `yem_admin1.geojson` and `yem_admin2.geojson`. Selecting governorate filters districts automatically. Saves `gov_code` and `dist_code` with the store.
- Added governorate and district to Excel export.
- **Linked governorate/district selection to map**: Selecting a governorate flies (`flyToBounds`) to its GeoJSON bounds; selecting a district flies (`flyTo`) to its `center_lat`/`center_lon`. District field resets when governorate changes.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- ES6 Modules (`type="module"`) for all pages
- `MapManager` Singleton for single map instance
- `EventBus` Observer for component communication
- Repository Pattern (StoreRepository, CartStorage, AuthService)
- Factory Pattern (MarkerFactory, PopupFactory)
- Marker click → Popup only; Sidebar → via "View Store" button
- Satellite (Esri) as default layer with OSM toggle option
- Complete separation of Business Logic (`*Service.js`) and UI (`*UI.js`/`*Controller.js`)
- Images cropped before saving (Cropper.js) instead of saving raw image
- Quantity (`stock_qty`) instead of Boolean for out-of-stock detection
- SheetJS (xlsx) for Excel export/import
- Leaflet Drag Marker for merchant store location selection
- **Brand colors**: `#F28E6B` (coral orange) + `#1E2A3A` (dark navy)
- **Safe operations**: All DOM functions protected with null checks; external libraries verified before use
- **Location data from GeoJSON**: `yem_admin1.geojson` for governorates, `yem_admin2.geojson` for districts — saves `gov_code` and `dist_code` in store data

## Next Steps
- Comprehensive testing of all pages (index, admin, merchant, login, super-admin)
- Component documentation (JSDoc)
- Mobile UX improvements
- Connect stores added via merchant panel with `data/stores.geojson`

## Critical Context
- **Rebranding**: Platform name is now "Ecolance" instead of "يُسر"
- **Colors**: Coral orange (`#F28E6B`) + Dark navy (`#1E2A3A`)
- **Logo**: `src/assets/ecolance.png` — `height:22px; max-width:100px` in topbar, `height:52px` on Login page
- **Demo merchant account**: `merchant@demo.com` / `demo123`
- **Super admin account**: `superadmin` / `yusir@2024`
- 6 files deleted from root: all moved to `src/`
- `src/main.js` → index.html | `src/merchant-main.js` → merchant.html | `src/super-admin-main.js` → super-admin.html
- All images stored as Base64 in localStorage
- `dashboard.css` completely rewritten and now contains `brand-logo` definition (because dashboard pages don't import `style.css`)
- Governorate and district data from GeoJSON files in `data/` — loaded asynchronously (`async/await`) in `merchant-main.js`

## Relevant Files
- `src/merchant-main.js`: Merchant panel — product management, image cropping, Excel, Drag Marker map (Esri satellite), logout, **governorate/district dropdowns from GeoJSON with map flyTo linkage**
- `src/super-admin-main.js`: Super admin panel — subscription management (with mobile field)
- `src/modules/users/AuthService.js`: Unified login with automatic demo account export
- `src/modules/map/PopupFactory.js`: Store status (open/closed) with new colors
- `src/modules/map/MarkerFactory.js`: Orange Pin marker
- `src/core/helpers/dom.js`: DOM functions (with data- and on fixes)
- `css/style.css`: Main styles — updated with new colors, `brand-logo` with `flex-shrink:0`
- `css/dashboard.css`: Dashboard styles — updated, now contains `brand-logo` specific for dash-top
- `css/admin.css`: Admin styles — updated
- `src/assets/ecolance.png`: New platform logo
- `login.html`: Login page — Navy background + gradient
- `merchant.html`: Merchant panel — now contains `select#sGov` and `select#sDist`
- `super-admin.html`: Super admin panel — contains try-catch in session check
- `data/yem_admin1.geojson`: Yemen governorate boundaries + `adm1_name1` (Arabic)
- `data/yem_admin2.geojson`: Yemen district boundaries + `adm2_name1` (Arabic) + `adm1_pcode` + `center_lat`/`center_lon`
