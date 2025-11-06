import {Buttons} from '@atoms';
import {COLORS, FONTS, SIZE} from '@res';
import React from 'react';
import {
  ColorValue,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface ModalSheetProps {
  show: boolean;
  animationType?: 'slide' | 'fade';
  title?: '' | string;
  primaryTitle?: string;
  closeTitle?: string;
  deleteTitle?: string;
  children?: React.ReactNode;
  onClosePress?: () => void;
  onClose?: () => void;
  onPrimaryPress?: (date?: Date) => void;
  onDeletePress?: () => void;
  style?: ViewStyle;
  viewStyle?: ViewStyle;
  navColor?: ColorValue;
}

const ModalSheet: React.FC<ModalSheetProps> = ({
  show,
  animationType,
  children,
  title,
  style,
  viewStyle,
  navColor,
  primaryTitle,
  closeTitle,
  deleteTitle,
  onPrimaryPress,
  onClose,
  onClosePress,
  onDeletePress,
}) => {
  return (
    <Modal
      statusBarTranslucent
      transparent
      onRequestClose={onClose}
      visible={show}
      style={style}
      animationType={animationType ?? 'slide'}>
      <TouchableOpacity
        onPress={onClosePress}
        activeOpacity={onClosePress ? 0.9 : 1}
        style={[styles.modalView]}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.innerView, viewStyle]}>
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={styles.devider} />
          {children}
        </TouchableOpacity>
        <View>
          <View style={styles.buttonContainer}>
            {onDeletePress && (
              <Buttons
                type={'delete'}
                title={deleteTitle || 'Delete'}
                viewStyle={styles.buttonView}
                onPress={onDeletePress}
              />
            )}
            {onClosePress && (
              <Buttons
                type={'close'}
                title={closeTitle || 'Close'}
                viewStyle={styles.buttonView}
                onPress={onClosePress}
              />
            )}
            {onPrimaryPress && (
              <Buttons
                type={'primary'}
                title={primaryTitle || 'Done'}
                viewStyle={styles.buttonView}
                onPress={onPrimaryPress}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
      <SafeAreaView
        style={[styles.safeArea, {backgroundColor: navColor ?? COLORS.WHITE}]}
      />
    </Modal>
  );
};

export default React.memo(ModalSheet);

const styles = StyleSheet.create({
  bottomButtonRowView: {
    paddingBottom: SIZE.MVS(10),
  },
  safeArea: {flex: 0, backgroundColor: COLORS.WHITE},
  modalView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.BLACK_RGBA_65,
  },
  innerView: {
    padding: SIZE.MS(15),
    borderTopLeftRadius: SIZE.MS(20),
    borderTopRightRadius: SIZE.MS(20),
    maxHeight: '85%',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SIZE.MS(25),
  },
  title: {
    fontSize: SIZE.MS(18),
    fontFamily: FONTS.BOLD,
    textAlign: 'center',
    color: COLORS.PRIMARY,
  },
  devider: {
    height: SIZE.MS(1.5),
    width: '90%',
    alignSelf: 'center',
    borderRadius: SIZE.MS(12),
    marginVertical: SIZE.MVS(10),
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingTop: SIZE.MS(20),
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SIZE.MS(15),
    paddingBottom: SIZE.MVS(10),
  },
  buttonView: {
    flex: 1,
    marginHorizontal: SIZE.MS(5),
  },
  resetButtonView: {
    flex: 1,
    marginHorizontal: SIZE.MS(5),
    marginTop: SIZE.MS(15),
    borderColor: COLORS.BUTTON_DANGER,
  },
  resetTitle: {
    color: COLORS.BUTTON_DANGER,
    fontFamily: FONTS.MEDIUM,
  },
  doneTitle: {
    fontFamily: FONTS.EXTRA_BOLD,
    fontSize: SIZE.MS(16),
  },
  closeButtonView: {
    flex: 1,
    marginHorizontal: SIZE.MS(5),
    marginTop: SIZE.MS(15),
  },
  closeButtonTitle: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MS(16),
  },
});
