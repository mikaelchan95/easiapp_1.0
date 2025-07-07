# Uber-Style Location Picker Implementation

## Overview

This document outlines the implementation of the new Uber-style location picker, which provides a more intuitive and user-friendly way for users to select their delivery locations.

## Key Features

### 1. Dual Input UI
- Two location inputs (pickup and dropoff) similar to Uber's interface
- Clear visual distinction between origin and destination
- Smooth transition between map view and search view

### 2. Interactive Map
- Centered pin for precise location selection
- Animated transitions for a polished feel
- Monochrome map styling for a clean, modern look

### 3. Search Functionality
- Search overlay with location suggestions
- Recent and saved locations
- Clean, focused search experience

### 4. User-Friendly Navigation
- Intuitive back button behavior
- Clear confirmation button
- Streamlined user flow

## Components Structure

```
UberStyleLocationPicker
├── Header
├── Map View
│   └── Center Pin Marker
├── Search Overlay
│   └── Location Suggestions
└── Location Card
    ├── Input Fields
    └── Confirm Button
```

## User Flow

1. User taps on location in header
2. UberStyleLocationScreen opens with map view
3. User can:
   - Select a location on the map
   - Tap an input field to search for a location
   - Use the current location button
4. After selecting a location, user taps "Confirm"
5. Selected location is passed back to the calling screen

## Implementation Details

### Animation System

The component uses React Native's Animated API to create smooth transitions between states:

- `searchBarHeight` - Controls the height of the search overlay
- `searchBarOpacity` - Controls the opacity of the search overlay
- `cardTranslateY` - Controls the vertical position of the location card

### Location Data Structure

The location picker works with the existing `LocationSuggestion` type:

```typescript
interface LocationSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  coordinate?: Coordinate;
  // Other properties...
}
```

### Map Integration

The component uses `react-native-maps` with Google Maps provider and custom monochrome styling defined in `GOOGLE_MAPS_CONFIG.mapStyle`.

## Future Enhancements

1. **Location History** - Store and display recently selected locations
2. **Saved Favorites** - Allow users to save favorite locations
3. **Advanced Filtering** - Filter locations by type (home, work, etc.)
4. **Real-time Location Updates** - Update map as user moves
5. **Draggable Pin** - Allow users to drag the pin to adjust location precisely

## Design Considerations

### Visual Design
- Clean, minimal interface with appropriate spacing
- Focus on the map as the primary interaction point
- Clear visual hierarchy with the most important actions prominently displayed

### User Experience
- Reduced cognitive load with familiar Uber-like patterns
- Seamless transitions between states
- Clear feedback on user actions

## Integration Guide

To use the UberStyleLocationPicker in other screens:

1. Import the component:
   ```typescript
   import UberStyleLocationScreen from '../components/Location/UberStyleLocationScreen';
   ```

2. Navigate to the screen:
   ```typescript
   navigation.navigate('UberStyleLocationScreen');
   ```

3. Handle the selected location in the calling screen by providing an `onLocationSelect` callback. 