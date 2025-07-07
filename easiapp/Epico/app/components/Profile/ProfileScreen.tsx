import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Mock user data
const user = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+65 8123 4567',
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}><Ionicons name="person" size={36} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickItem}>
            <Ionicons name="cube-outline" size={22} color="#1a1a1a" />
            <Text style={styles.quickLabel}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem}>
            <Ionicons name="gift-outline" size={22} color="#1a1a1a" />
            <Text style={styles.quickLabel}>Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem}>
            <Ionicons name="help-circle-outline" size={22} color="#1a1a1a" />
            <Text style={styles.quickLabel}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* List Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="person-outline" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>Personal Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="location-outline" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>Addresses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="card-outline" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>Payment Methods</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="shield-outline" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>Security</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="notifications-outline" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="settings-outline" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>App Preferences</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo & Features</Text>
          <TouchableOpacity 
            style={styles.sectionItem}
            onPress={() => navigation.navigate('MomentumShowcase')}
          >
            <Ionicons name="trending-up" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>Progress & Momentum</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="help-circle-outline" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sectionItem}>
            <Ionicons name="mail-outline" size={18} color="#666" style={styles.sectionIcon} />
            <Text style={styles.sectionLabel}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color="#D32F2F" style={styles.sectionIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>EASI by Epico v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollContainer: {
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: '#FFFFFF',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginLeft: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quickLabel: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionLabel: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    marginTop: 16,
    marginBottom: 32,
  },
}); 