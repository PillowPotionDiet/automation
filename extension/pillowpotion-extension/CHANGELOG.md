# Changelog

All notable changes to the PillowPotion extension will be documented in this file.

## [3.0.0] - 2026-01-01

### Changed - Complete PillowPotion Rebrand

#### Branding Changes
- **Extension Name:** "VEO Automation" → "PillowPotion - AI Video Automation"
- **Author:** Removed original author references → PillowPotion
- **Email:** kylenguyenaws@gmail.com → pillowpotion.com@gmail.com
- **Website:** kylenguyen.me → https://automation.pillowpotion.com/public/
- **Version:** Major version bump from 2.1.3 to 3.0.0

#### UI/UX Changes
- Removed Discord integration (replaced with support link to PillowPotion website)
- Changed Discord icon (pi-discord) to support icon (pi-question-circle)
- Updated all UI text references to PillowPotion branding

#### Localization Changes
- **Removed** Vietnamese language support completely
- **Removed** Chinese language support completely
- **English only** - Extension now supports English language exclusively
- Removed language selector from settings
- Reduced bundle size by ~66KB through language removal

#### Technical Changes
- Updated `manifest.json` with new branding metadata
- Modified service worker to redirect to PillowPotion website
- Updated all minified JavaScript bundles with new branding
- Removed language objects from main UI bundle (reduced from 761KB to 695KB)
- Updated all documentation (README.md, INSTALLATION.md)

#### Files Modified
- `manifest.json` - Core extension metadata
- `src/ui/side-panel/index.html` - Page title
- `assets/index.ts-D8XxzeM2.js` - Service worker URLs
- `assets/index.html-B-tB0sk2.js` - Main UI bundle (branding, languages, Discord)
- `README.md` - Full documentation
- `INSTALLATION.md` - Installation guide

### Removed
- Vietnamese (`vi`) language translations
- Chinese (`zh`) language translations
- Language selector UI component
- Discord community link
- All references to original author

### Performance Improvements
- **-66KB bundle size** reduction from language removal
- Faster load times with smaller JavaScript payload
- Simplified codebase with single language support

---

## [2.1.3] - Previous Version

### Features (Pre-Rebrand)
- Multi-language support (English, Vietnamese, Chinese)
- Discord community integration
- Side panel UI with PrimeVue components
- Batch processing for Google Flow AI
- Auto-download functionality
- Project folder organization
- Tab management and zoom control

---

## Migration Guide (2.1.3 → 3.0.0)

### For Users
1. **Language Settings:** If you were using Vietnamese or Chinese, the extension now defaults to English only
2. **Discord Link:** Discord community link replaced with PillowPotion support website
3. **Support:** For help, visit https://automation.pillowpotion.com/public/

### For Developers
1. **Bundle Changes:** Main UI bundle reduced by 66KB
2. **Language Objects:** Only `en` language object remains
3. **Service Worker:** URL redirects now point to PillowPotion domain
4. **Manifest:** Updated to version 3.0.0 with new branding

---

## Notes

- This is a **major version release** (3.0.0) due to breaking changes
- Language support reduced to English only
- All branding completely replaced
- Extension functionality remains the same
- Compatible with all Google Flow AI features

---

**Maintained by:** PillowPotion
**Website:** https://automation.pillowpotion.com/public/
**License:** All rights reserved - PillowPotion
