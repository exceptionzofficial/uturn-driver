import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';

const MyTaskScreen = () => {
  const tasks = [
    { id: '1', title: 'Airport Pickup', date: 'May 30, 2026', status: 'Completed', progress: 100, color: '#10B981' },
    { id: '2', title: 'Local Delivery', date: 'May 31, 2026', status: 'In Progress', progress: 60, color: '#6366F1' },
    { id: '3', title: 'Rental Trip', date: 'June 01, 2026', status: 'Pending', progress: 0, color: '#F59E0B' },
  ];

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskDate}>{item.date}</Text>
        <TouchableOpacity>
          <Icon name="more-vertical" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.taskBody}>
        <View style={[styles.iconWrapper, { backgroundColor: item.color + '20' }]}>
          <Icon name="truck" size={18} color={item.color} />
        </View>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskStatus}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{item.progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${item.progress}%`, backgroundColor: item.color }]} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="sliders" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.light,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  taskCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.light,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  taskDate: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  taskBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    marginLeft: SPACING.md,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  taskStatus: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: SPACING.xs,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default MyTaskScreen;
