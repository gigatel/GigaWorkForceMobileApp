/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: 𝔾𝕚𝕘𝕒𝕿𝕖𝕝 𝔾𝕦𝕲𝕺𝔽𝕺𝔯𝔠𝕖
 @ 𝔠𝔯𝔦𝔠𝔱𝔦𝔬𝔫: ℙ𝔲𝔰𝔥 ℕ𝔬𝔱𝔦𝔣𝔦𝔠𝔞𝔱𝔦𝔬𝔫𝔰 𝔠𝔠𝔯𝔦𝔌𝔱𝔠𝔣
 */

import { BackHeader } from '@molecules';
import { Screen } from '@organisms';
import { COLORS, CONSTANT, FONTS, SIZE, STYLES } from '@res';
import { RootState, StoreDispatch } from '@reducers';
import { Notification, deleteNotification, markAllAsRead, markAsRead } from '@slices/notifications.slice';
import { ScreenProps } from '@types';
import { Common } from '@utils';
import React, { FC, useCallback, useMemo } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect, useDispatch } from 'react-redux';

interface NotificationItemProps {
  item: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: FC<NotificationItemProps> = ({
  item,
  onRead,
  onDelete,
}) => {
  const handlePress = useCallback(() => {
    if (!item.read) {
      onRead(item.id);
    }
  }, [item.id, item.read, onRead]);

  const timeAgo = useMemo(() => {
    const now = Date.now();
    const diff = now - item.timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    const date = new Date(item.timestamp);
    return date.toLocaleDateString();
  }, [item.timestamp]);

  return (
    <TouchableOpacity
      style={[
        styles.notificationItemContainer,
        !item.read && styles.notificationItemUnread,
      ]}
      onPress={handlePress}
      activeOpacity={CONSTANT.BUTTON_OPACITY}>
      <View style={styles.notificationItemContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.notificationTitle,
              !item.read && styles.notificationTitleUnread,
            ]}
            numberOfLines={2}>
            {item.title}
          </Text>
          {!item.read && (
            <View
              style={styles.unreadBadge}
              testID="unread-badge"
            />
          )}
        </View>
        <Text style={styles.notificationBody} numberOfLines={3}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>{timeAgo}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}>
        <Icon name="delete" size={SIZE.MS(20)} color={COLORS.ERROR} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const NotificationEmptyState: FC = () => (
  <View style={styles.emptyContainer}>
    <Icon name="notifications-none" size={SIZE.MS(64)} color={COLORS.TEXT_LIGHT} />
    <Text style={styles.emptyTitle}>No Notifications</Text>
    <Text style={styles.emptySubtitle}>
      You're all caught up! Check back later for updates.
    </Text>
  </View>
);

interface NotificationScreenProps extends ScreenProps.Notifications {
  notifications: Notification[];
  unreadCount: number;
}

const NotificationScreen: FC<NotificationScreenProps> = ({
  navigation,
  notifications,
  unreadCount,
}) => {
  const dispatch = useDispatch<StoreDispatch>();

  const handleMarkAsRead = useCallback(
    (id: string) => {
      dispatch(markAsRead(id));
    },
    [dispatch],
  );

  const handleDelete = useCallback(
    (id: string) => {
      dispatch(deleteNotification(id));
      Common.showToast('Notification deleted');
    },
    [dispatch],
  );

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount > 0) {
      dispatch(markAllAsRead());
      Common.showToast('All notifications marked as read');
    }
  }, [dispatch, unreadCount]);

  const renderNotification: ListRenderItem<Notification> = useCallback(
    ({ item }) => (
      <NotificationItem
        item={item}
        onRead={handleMarkAsRead}
        onDelete={handleDelete}
      />
    ),
    [handleMarkAsRead, handleDelete],
  );

  return (
    <Screen statusBgColor={COLORS.PRIMARY} preset="fixed">
      <BackHeader
        headerTitle="Notifications"
        onBackPress={() => navigation.goBack()}
      />
      {unreadCount > 0 && (
        <View style={styles.headerBar}>
          <Text style={styles.headerBarText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity 
            onPress={handleMarkAllAsRead}
            activeOpacity={CONSTANT.BUTTON_OPACITY}>
            <Text style={styles.headerBarAction}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={
          notifications.length === 0 ? styles.flatListEmpty : styles.flatList
        }
        ListEmptyComponent={<NotificationEmptyState />}
        scrollEnabled={true}
      />
    </Screen>
  );
};

const MapStateToProps = (state: RootState) => ({
  notifications: state.notifications.items,
  unreadCount: state.notifications.unreadCount,
});

export default connect(MapStateToProps)(NotificationScreen);

const styles = StyleSheet.create({
  flatList: {
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MS(8),
  },
  flatListEmpty: {
    flexGrow: 1,
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MS(8),
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MS(12),
    backgroundColor: COLORS.PRIMARY_LIGHT,
    marginVertical: SIZE.MS(8),
  },
  headerBarText: {
    fontSize: SIZE.MVS(12),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARK,
  },
  headerBarAction: {
    fontSize: SIZE.MVS(12),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
  },
  notificationItemContainer: {
    marginVertical: SIZE.MS(6),
    marginHorizontal: SIZE.MS(4),
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MS(12),
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(8),
    borderLeftWidth: 4,
    borderLeftColor: COLORS.BORDER_DEFAULT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...STYLES.SHADOW_PRIMARY_3,
  },
  notificationItemUnread: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderLeftColor: COLORS.PRIMARY,
  },
  notificationItemContent: {
    flex: 1,
    marginRight: SIZE.MS(8),
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZE.MS(6),
  },
  notificationTitle: {
    fontSize: SIZE.MVS(14),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  notificationTitleUnread: {
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY_DARK,
  },
  unreadBadge: {
    width: SIZE.MS(8),
    height: SIZE.MS(8),
    borderRadius: SIZE.MS(4),
    backgroundColor: COLORS.PRIMARY,
    marginLeft: SIZE.MS(8),
  },
  notificationBody: {
    fontSize: SIZE.MVS(12),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_MEDIUM,
    marginBottom: SIZE.MS(8),
    lineHeight: SIZE.MVS(16),
  },
  notificationTime: {
    fontSize: SIZE.MVS(10),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_LIGHT,
  },
  deleteButton: {
    padding: SIZE.MS(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZE.MS(24),
  },
  emptyTitle: {
    fontSize: SIZE.MVS(18),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_DARK,
    marginTop: SIZE.MS(16),
  },
  emptySubtitle: {
    fontSize: SIZE.MVS(14),
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_LIGHT,
    marginTop: SIZE.MS(8),
    textAlign: 'center',
  },
});
