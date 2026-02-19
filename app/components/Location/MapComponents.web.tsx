import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type MapViewProps = {
  children?: React.ReactNode;
  style?: any;
  onMapReady?: () => void;
  [key: string]: any;
};

const MapView = forwardRef<any, MapViewProps>(
  ({ children, style, onMapReady }: MapViewProps, ref) => {
    useImperativeHandle(ref, () => ({
      animateToRegion: () => {},
    }));

    useEffect(() => {
      if (onMapReady) {
        onMapReady();
      }
    }, [onMapReady]);

    return <View style={[styles.mapView, style]}>{children}</View>;
  }
);

MapView.displayName = 'MapView';

export const Marker: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <View pointerEvents="none">{children}</View>;
};

export const Circle: React.FC = () => null;

export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  mapView: {
    width: '100%',
    height: '100%',
  },
});

export default MapView;
