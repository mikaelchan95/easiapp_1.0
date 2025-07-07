# Monochrome Map Implementation

## Overview

This document outlines the changes made to implement a monochrome (black and white/grayscale) map UI for the location picker components in the EASI app.

## Changes Made

### 1. Google Maps Style Configuration

Updated the `mapStyle` array in `app/config/googleMaps.ts` to use a monochrome color palette with:
- Black and dark gray for base elements
- Lighter grays for labels and less important features
- Pure black for water bodies
- Various shades of gray for roads and landscape elements
- Removed all blue and green colors from the previous styling

### 2. Map Components Styling

#### LocationMapView.tsx
- Changed delivery zone circles to use black and dark gray stroke colors
- Updated fill colors to use transparent black with different opacities
- Changed all marker colors from colored (green, blue, orange) to black
- Updated instruction text to reference "dark areas" instead of "blue areas"

#### LocationBottomSheet.tsx
- Updated the static map visualization:
  - Changed delivery zone borders from green/blue to black/dark gray
  - Updated delivery zone backgrounds to use transparent black with different opacities
  - Changed the location marker icon color from orange to black

#### LocationPickerScreen.tsx
- Updated zone circles and markers to use monochrome colors
- **Fixed a critical issue with the map provider:**
  - Changed the provider from conditional `Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined` to always use `provider="google"`
  - This ensures that on iOS, the Google Maps provider is used with our custom monochrome style instead of the default Apple Maps style
  - Without this fix, iOS devices would still show a colored map despite the style changes

## Visual Result

The map now has a consistent monochrome aesthetic with:
- Dark gray/black base for the map
- Black and gray roads
- Black water
- All UI elements (markers, circles) using black and grayscale colors
- No colored elements in the map view

This change provides a more elegant, minimalist aesthetic that better matches the app's design language. 