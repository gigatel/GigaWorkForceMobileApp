import {useNavigation} from '@react-navigation/native';
import {COLORS, SIZE} from '@res';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface HeaderProps {
  headerTitle: string;
  customHeader?: React.ReactNode;
  secondaryTitle?: string;
}

export const Header = ({
  headerTitle,
  secondaryTitle,
  customHeader,
}: HeaderProps) => {
  const navigation = useNavigation();
  return (
    <View>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {customHeader ? (
            customHeader
          ) : (
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              {secondaryTitle && (
                <Text style={styles.secondaryTitle}>{secondaryTitle}</Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.networkIndicator} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(12),
    elevation: 4,
  },
  backButton: {
    padding: SIZE.MS(8),
  },
  backText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(20),
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: SIZE.MS(28),
    height: SIZE.MS(28),
    borderRadius: SIZE.MS(14),
    backgroundColor: COLORS.WARNING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: COLORS.TEXT_DARKER,
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(18),
    fontWeight: 'bold',
  },
  headerRight: {
    width: SIZE.MS(32),
    alignItems: 'flex-end',
  },
  networkIndicator: {
    width: SIZE.MS(8),
    height: SIZE.MS(8),
    borderRadius: SIZE.MS(4),
    backgroundColor: COLORS.SUCCESS,
  },
  headerTitleContainer: {
    flexDirection: 'column',
    gap: SIZE.MVS(4),
    alignItems: 'center',
  },
  secondaryTitle: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(12),
    fontWeight: 'condensed',
  },
});
