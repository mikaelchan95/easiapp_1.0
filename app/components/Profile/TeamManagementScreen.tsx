import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import MobileHeader from '../Layout/MobileHeader';
import { isCompanyUser, CompanyUser, CompanyUserRole, getDefaultPermissionsByRole, UserPermissions } from '../../types/user';
import { supabaseService } from '../../services/supabaseService';
import TouchableScale from '../UI/TouchableScale';

interface EditModalData {
  user: CompanyUser;
  name: string;
  email: string;
  role: CompanyUserRole;
  department: string;
  position: string;
  permissions: UserPermissions;
}

export default function TeamManagementScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state } = useContext(AppContext);
  
  // State management
  const [teamMembers, setTeamMembers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalData, setEditModalData] = useState<EditModalData | null>(null);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [invitePosition, setInvitePosition] = useState('');
  const [selectedRole, setSelectedRole] = useState<CompanyUserRole>('staff');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  const { user, company } = state;

  // Load team members
  const loadTeamMembers = async () => {
    if (!company?.id) {
      console.log('⚠️ No company ID available');
      return;
    }
    
    try {
      console.log('🔍 Loading team members for company:', company.id);
      const members = await supabaseService.getTeamMembersByCompany(company.id);
      console.log('✅ Loaded team members:', members.length, 'members');
      setTeamMembers(members);
    } catch (error) {
      console.error('❌ Error loading team members:', error);
      Alert.alert('Error', 'Failed to load team members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, [company?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTeamMembers();
  };

  if (!user || !isCompanyUser(user) || !company) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
        <View style={[styles.statusBarSpacer, { height: insets.top }]} />
        <View style={styles.headerContainer}>
          <MobileHeader 
            title="Team Management" 
            showBackButton={true} 
            showSearch={false}
            showCartButton={false}
          />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.noDataText}>No team information available</Text>
        </View>
      </View>
    );
  }

  const canInviteUsers = user.permissions?.canInviteUsers;
  const canManageUsers = user.permissions?.canManageUsers;

  const getRoleColor = (role: CompanyUserRole) => {
    switch (role) {
      case 'superadmin': return '#9C27B0';
      case 'manager': return '#2196F3';
      case 'approver': return '#FF9800';
      case 'staff': return '#4CAF50';
      default: return COLORS.textSecondary;
    }
  };

  const getRoleIcon = (role: CompanyUserRole) => {
    switch (role) {
      case 'superadmin': return 'shield';
      case 'manager': return 'people';
      case 'approver': return 'verified-user';
      case 'staff': return 'person';
      default: return 'person';
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    if (!company?.id) return;
    
    setInviteLoading(true);
    try {
      console.log('🔄 Starting invite process...');
      const newMember = await supabaseService.inviteTeamMember(
        company.id,
        inviteEmail.trim(),
        selectedRole,
        inviteDepartment.trim() || undefined,
        invitePosition.trim() || undefined
      );
      
      if (newMember) {
        console.log('✅ Invite successful, reloading team members...');
        // Reload team members from database to ensure consistency
        await loadTeamMembers();
        setInviteModalVisible(false);
        resetInviteForm();
        Alert.alert('Success', `Team member ${inviteEmail} has been added successfully!`);
      } else {
        Alert.alert('Error', 'Failed to add team member. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error inviting user:', error);
      Alert.alert('Error', 'Failed to add team member. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteDepartment('');
    setInvitePosition('');
    setSelectedRole('staff');
  };

  const handleEditUser = (member: CompanyUser) => {
    if (!canManageUsers) {
      Alert.alert('Permission Denied', 'You do not have permission to manage users');
      return;
    }
    
    setEditModalData({
      user: member,
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department || '',
      position: member.position || '',
      permissions: { ...member.permissions }
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editModalData) return;
    
    try {
      console.log('🔄 Starting edit process...');
      const updatedMember = await supabaseService.updateTeamMember(
        editModalData.user.id,
        {
          name: editModalData.name,
          email: editModalData.email,
          role: editModalData.role,
          department: editModalData.department,
          position: editModalData.position,
          permissions: editModalData.permissions
        }
      );
      
      if (updatedMember) {
        console.log('✅ Edit successful, reloading team members...');
        // Reload team members from database to ensure consistency
        await loadTeamMembers();
        setEditModalVisible(false);
        setEditModalData(null);
        Alert.alert('Success', 'Team member updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update team member');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      Alert.alert('Error', 'Failed to update team member');
    }
  };

  const handleRemoveUser = (member: CompanyUser) => {
    if (!canManageUsers) {
      Alert.alert('Permission Denied', 'You do not have permission to manage users');
      return;
    }
    
    if (member.id === user.id) {
      Alert.alert('Error', 'You cannot remove yourself from the team');
      return;
    }
    
    Alert.alert(
      'Remove Team Member',
      `Are you sure you want to remove ${member.name} from the team? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Starting remove process...');
              const success = await supabaseService.removeTeamMember(member.id);
              if (success) {
                console.log('✅ Remove successful, reloading team members...');
                // Reload team members from database to ensure consistency
                await loadTeamMembers();
                Alert.alert('Success', 'Team member removed successfully');
              } else {
                Alert.alert('Error', 'Failed to remove team member');
              }
            } catch (error) {
              console.error('❌ Error removing user:', error);
              Alert.alert('Error', 'Failed to remove team member');
            }
          }
        }
      ]
    );
  };

  const renderTeamMember = (member: CompanyUser) => {
    const isCurrentUser = member.id === user.id;
    
    return (
      <TouchableScale
        key={member.id}
        style={styles.memberCard}
        onPress={() => handleEditUser(member)}
        disabled={!canManageUsers}
        activeScale={0.98}
      >
        <View style={styles.memberHeader}>
          <View style={[styles.memberAvatar, { backgroundColor: getRoleColor(member.role) + '20' }]}>
            <MaterialIcons 
              name={getRoleIcon(member.role)} 
              size={24} 
              color={getRoleColor(member.role)} 
            />
          </View>
          
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{member.name}</Text>
              {isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberPosition}>
              {member.position || 'No position'} • {member.department || 'No department'}
            </Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
          </View>
          
          {canManageUsers && !isCurrentUser && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveUser(member)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.memberFooter}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) + '20' }]}>
            <Text style={[styles.roleBadgeText, { color: getRoleColor(member.role) }]}>
              {member.role.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.memberPermissions}>
            {member.permissions?.canApproveOrders && (
              <View style={styles.permissionChip}>
                <Text style={styles.permissionText}>Can Approve</Text>
              </View>
            )}
            {member.permissions?.canManageUsers && (
              <View style={styles.permissionChip}>
                <Text style={styles.permissionText}>Team Admin</Text>
              </View>
            )}
            {member.permissions?.orderLimit && (
              <View style={styles.permissionChip}>
                <Text style={styles.permissionText}>
                  Limit: ${member.permissions.orderLimit.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableScale>
    );
  };

  const renderInviteModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={inviteModalVisible}
      onRequestClose={() => setInviteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite Team Member</Text>
            <TouchableOpacity 
              onPress={() => setInviteModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter email address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!inviteLoading}
            />
            
            <Text style={styles.inputLabel}>Department</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Sales, Marketing, Operations"
              value={inviteDepartment}
              onChangeText={setInviteDepartment}
              editable={!inviteLoading}
            />
            
            <Text style={styles.inputLabel}>Position</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Sales Manager, Marketing Executive"
              value={invitePosition}
              onChangeText={setInvitePosition}
              editable={!inviteLoading}
            />
            
            <Text style={styles.inputLabel}>Role *</Text>
            <View style={styles.roleSelector}>
              {(['staff', 'approver', 'manager'] as CompanyUserRole[]).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    selectedRole === role && styles.roleOptionSelected
                  ]}
                  onPress={() => setSelectedRole(role)}
                  disabled={inviteLoading}
                >
                  <MaterialIcons 
                    name={getRoleIcon(role)} 
                    size={20} 
                    color={selectedRole === role ? '#FFFFFF' : getRoleColor(role)} 
                  />
                  <Text style={[
                    styles.roleOptionText,
                    selectedRole === role && styles.roleOptionTextSelected
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.inviteButton, inviteLoading && styles.inviteButtonDisabled]}
              onPress={handleInviteUser}
              activeOpacity={0.7}
              disabled={inviteLoading}
            >
              {inviteLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.inviteButtonText}>Send Invitation</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderEditModal = () => {
    if (!editModalData) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Team Member</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter name"
                value={editModalData.name}
                onChangeText={(text) => setEditModalData(prev => prev ? {...prev, name: text} : null)}
              />
              
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter email"
                value={editModalData.email}
                onChangeText={(text) => setEditModalData(prev => prev ? {...prev, email: text} : null)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter department"
                value={editModalData.department}
                onChangeText={(text) => setEditModalData(prev => prev ? {...prev, department: text} : null)}
              />
              
              <Text style={styles.inputLabel}>Position</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter position"
                value={editModalData.position}
                onChangeText={(text) => setEditModalData(prev => prev ? {...prev, position: text} : null)}
              />
              
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {(['staff', 'approver', 'manager'] as CompanyUserRole[]).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      editModalData.role === role && styles.roleOptionSelected
                    ]}
                    onPress={() => {
                      const newPermissions = getDefaultPermissionsByRole(role);
                      setEditModalData(prev => prev ? {
                        ...prev, 
                        role,
                        permissions: newPermissions
                      } : null);
                    }}
                  >
                    <MaterialIcons 
                      name={getRoleIcon(role)} 
                      size={20} 
                      color={editModalData.role === role ? '#FFFFFF' : getRoleColor(role)} 
                    />
                    <Text style={[
                      styles.roleOptionText,
                      editModalData.role === role && styles.roleOptionTextSelected
                    ]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.inviteButton}
                onPress={handleSaveEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.inviteButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
        <View style={[styles.statusBarSpacer, { height: insets.top }]} />
        <View style={styles.headerContainer}>
          <MobileHeader 
            title="Team Management" 
            showBackButton={true} 
            showSearch={false}
            showCartButton={false}
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.text} />
          <Text style={[styles.noDataText, { marginTop: SPACING.sm }]}>Loading team members...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />
      
      <View style={styles.headerContainer}>
        <MobileHeader 
          title="Team Management" 
          showBackButton={true} 
          showSearch={false}
          showCartButton={false}
        />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Team Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{teamMembers.length}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {teamMembers.filter(m => m.permissions?.canApproveOrders).length}
            </Text>
            <Text style={styles.statLabel}>Approvers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {teamMembers.filter(m => m.role === 'staff').length}
            </Text>
            <Text style={styles.statLabel}>Staff</Text>
          </View>
        </View>

        {/* Add Member Button */}
        {canInviteUsers && (
          <TouchableScale
            style={styles.addMemberButton}
            onPress={() => setInviteModalVisible(true)}
            activeScale={0.98}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.addMemberButtonText}>Invite Team Member</Text>
          </TouchableScale>
        )}

        {/* Team Members List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members ({teamMembers.length})</Text>
          {teamMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>No team members yet</Text>
              <Text style={styles.emptyStateText}>
                {canInviteUsers 
                  ? 'Start building your team by inviting members' 
                  : 'Ask an admin to invite team members'
                }
              </Text>
            </View>
          ) : (
            teamMembers.map(renderTeamMember)
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderInviteModal()}
      {renderEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  statusBarSpacer: {
    backgroundColor: COLORS.card,
  },
  headerContainer: {
    backgroundColor: COLORS.card,
    zIndex: 10,
    ...SHADOWS.light,
  },
  
  // Stats Card
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  
  // Add Member Button
  addMemberButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  addMemberButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  
  // Section
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h4,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Member Card
  memberCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  youBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    ...TYPOGRAPHY.tiny,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  memberPosition: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  memberEmail: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleBadgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  memberPermissions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  permissionChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    marginBottom: 4,
  },
  permissionText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl + 20,
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
  },
  inputLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    ...TYPOGRAPHY.body,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  roleOption: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleOptionSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  roleOptionText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    marginTop: 4,
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  inviteButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  bottomPadding: {
    height: 100,
  },
}); 