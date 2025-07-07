import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

type OrderTrackingRouteProp = RouteProp<RootStackParamList, 'OrderTracking'>;

// Mock order statuses
const ORDER_STATUSES = [
  { id: 'received', label: 'Order Received', icon: 'receipt-outline', description: 'Your order has been confirmed and is being processed.' },
  { id: 'preparing', label: 'Being Prepared', icon: 'cube-outline', description: 'We are preparing your items for delivery.' },
  { id: 'outForDelivery', label: 'Out for Delivery', icon: 'car-outline', description: 'Your order is on its way to you.' },
  { id: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline', description: 'Your order has been delivered. Enjoy!' },
];

const OrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OrderTrackingRouteProp>();
  const { orderId } = route.params;
  
  // Mock order details - in a real app, this would come from an API
  const [order, setOrder] = useState({
    id: orderId,
    status: 'received',
    driverName: 'Alex Johnson',
    driverPhone: '+65 9123 4567',
    estimatedDelivery: 'Wednesday, 10 July',
    timeSlot: '3pm - 6pm',
    items: [
      { id: '1', name: 'Macallan 12 Year Old Sherry Oak', quantity: 1 },
      { id: '2', name: 'Macallan 18 Year Old Sherry Cask', quantity: 1 },
    ],
    address: {
      street: '123 Marina Bay Sands',
      unit: '#12-34',
      city: 'Singapore',
      postalCode: '018956',
    }
  });
  
  // Auto-progress the order status for demo purposes
  useEffect(() => {
    const progressStatuses = ['received', 'preparing', 'outForDelivery', 'delivered'];
    const currentIndex = progressStatuses.indexOf(order.status);
    
    if (currentIndex < progressStatuses.length - 1) {
      const timer = setTimeout(() => {
        setOrder(prev => ({
          ...prev,
          status: progressStatuses[currentIndex + 1]
        }));
      }, 10000); // Progress every 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [order.status]);
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  const handleContactDriver = () => {
    // In a real app, this would initiate a call
    console.log('Contacting driver:', order.driverPhone);
  };
  
  const getCurrentStatusIndex = () => {
    return ORDER_STATUSES.findIndex(status => status.id === order.status);
  };
  
  const currentStatusIndex = getCurrentStatusIndex();
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Order ID */}
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order Number</Text>
          <Text style={styles.orderId}>{order.id}</Text>
        </View>
        
        {/* Status Timeline */}
        <View style={styles.timelineContainer}>
          {ORDER_STATUSES.map((status, index) => {
            const isActive = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            
            return (
              <View key={status.id} style={styles.timelineItem}>
                <View style={styles.iconColumn}>
                  <View style={[
                    styles.statusIcon,
                    isActive && styles.activeStatusIcon,
                    isCurrent && styles.currentStatusIcon
                  ]}>
                    <Ionicons
                      name={status.icon as any}
                      size={20}
                      color={isActive ? '#fff' : '#ccc'}
                    />
                  </View>
                  {index < ORDER_STATUSES.length - 1 && (
                    <View style={[
                      styles.connector,
                      index < currentStatusIndex && styles.activeConnector
                    ]} />
                  )}
                </View>
                
                <View style={styles.statusContent}>
                  <Text style={[
                    styles.statusLabel,
                    isActive && styles.activeStatusLabel
                  ]}>
                    {status.label}
                  </Text>
                  <Text style={styles.statusDescription}>
                    {status.description}
                  </Text>
                  
                  {isCurrent && status.id === 'outForDelivery' && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={handleContactDriver}
                    >
                      <Ionicons name="call-outline" size={16} color="#fff" />
                      <Text style={styles.contactButtonText}>Contact Driver</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        
        {/* Delivery Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Delivery Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Estimated Delivery</Text>
              <Text style={styles.detailValue}>{order.estimatedDelivery}, {order.timeSlot}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Delivery Address</Text>
              <Text style={styles.detailValue}>
                {order.address.street}{order.address.unit ? `, ${order.address.unit}` : ''}
              </Text>
              <Text style={styles.detailValue}>
                {order.address.city}, {order.address.postalCode}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Items</Text>
              {order.items.map(item => (
                <Text key={item.id} style={styles.detailValue}>
                  {item.quantity}x {item.name}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  orderIdContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  timelineContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  timelineItem: {
    flexDirection: 'row',
  },
  iconColumn: {
    alignItems: 'center',
    width: 40,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStatusIcon: {
    backgroundColor: '#4CAF50',
  },
  currentStatusIcon: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  connector: {
    width: 2,
    height: 40,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  activeConnector: {
    backgroundColor: '#4CAF50',
  },
  statusContent: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 24,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  activeStatusLabel: {
    color: '#1a1a1a',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    paddingLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default OrderTrackingScreen; 