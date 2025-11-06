import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import Account from '@screens/account';
import Home from '@screens/home';
import Settings from '@screens/settings';
import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
const Tab = createBottomTabNavigator();
const TAB_NAMES = ['Home', 'Account', 'Settings'];
const TAB_ICONS = [IMAGES.home, IMAGES.account, IMAGES.settings];
const TAB_ICONS_FILL = [
  IMAGES.homeFill,
  IMAGES.accountFill,
  IMAGES.settingsFill,
];
export interface BottomTabParamsList {
  AudioTab: undefined;
  VideoTab: undefined;
  FavoritesTab: undefined;
  SettingsTab: undefined;
}
const BottomTab: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={TabBar}
      initialRouteName={'Home'}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Account" component={Account} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

const TabBar: React.FC<any> = ({state, descriptors, navigation}) => {
  return (
    <>
      <View style={[styles.tabView]}>
        {state.routes.map((route: any, index: number) => {
          const {options} = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={TAB_NAMES[index]}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.buttonsView}>
              <TabIcons index={index} active={isFocused} />
              <TabLabel title={TAB_NAMES[index]} active={isFocused} />
            </TouchableOpacity>
          );
        })}
      </View>
      <SafeAreaView style={[styles.safearea]} />
    </>
  );
};

const TabIcons: React.FC<{index: number; active: boolean}> = ({
  index,
  active,
}) => {
  const color = active ? COLORS.PRIMARY : COLORS.TEXT_DARK;
  return (
    <>
      {index === 0 ? (
        <TabIcon
          active={active}
          color={color}
          icon={active ? TAB_ICONS_FILL[index] : TAB_ICONS[index]}
        />
      ) : index === 1 ? (
        <TabIcon
          active={active}
          color={color}
          icon={active ? TAB_ICONS_FILL[index] : TAB_ICONS[index]}
        />
      ) : index === 2 ? (
        <TabIcon
          active={active}
          color={color}
          icon={active ? TAB_ICONS_FILL[index] : TAB_ICONS[index]}
        />
      ) : (
        <TabIcon
          active={active}
          color={color}
          icon={active ? TAB_ICONS_FILL[index] : TAB_ICONS[index]}
        />
      )}
    </>
  );
};
const TabIcon: React.FC<{icon: number; color: string; active: boolean}> = ({
  icon,
  color,
  active,
}) => {
  return (
    <Image
      // animation={active ? 'bounce' : undefined}
      // useNativeDriver={true}
      // iterationCount={'infinite'}
      // duration={2500}
      source={icon}
      resizeMode={'contain'}
      style={{height: SIZE.MS(24), width: SIZE.MS(24)}}
      tintColor={color}
    />
  );
};

const TabLabel: React.FC<{title: string; active: boolean}> = ({
  title,
  active,
}) => {
  return (
    <Text
      style={
        (styles.tabLabel, {color: active ? COLORS.PRIMARY : COLORS.TEXT_DARK})
      }>
      {title}
    </Text>
  );
};

const styles = StyleSheet.create({
  tabView: {
    flexDirection: 'row',
    height: SIZE.MVS(60),
    borderTopWidth: 1,
    borderColor: COLORS.TEXT_PLACEHOLDER,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
  buttonsView: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  tabLabel: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(12),
    textAlign: 'center',

    marginTop: SIZE.MVS(2),
  },
  safearea: {
    flex: 0,
  },
});

export default BottomTab;
