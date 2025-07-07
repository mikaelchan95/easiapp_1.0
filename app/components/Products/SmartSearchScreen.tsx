import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import SmartSearchView from './SmartSearchView';

type SmartSearchRouteProp = RouteProp<RootStackParamList, 'SmartSearch'>;

const SmartSearchScreen: React.FC = () => {
  const route = useRoute<SmartSearchRouteProp>();
  
  const initialQuery = route.params?.query || '';
  const initialCategory = route.params?.category || '';
  
  return (
    <View style={styles.container}>
      <SmartSearchView 
        initialQuery={initialQuery}
        initialCategory={initialCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default SmartSearchScreen; 