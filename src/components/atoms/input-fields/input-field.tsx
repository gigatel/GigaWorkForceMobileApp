// import {
//   DocumentPickerResponse,
//   pick,
//   types,
// } from '@react-native-documents/picker';
import Buttons from '../buttons';
import {COLORS, FONTS, IMAGES, SIZE} from '@res';
import React, {useState} from 'react';

import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
// import DatePicker from './date-picker';

interface InputFieldProps extends TextInputProps {
  type?: 'default' | 'loginMobile' | 'search';
  title?: string;
  value?: string;
  dateValue?: Date | string;
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
  placeholder?: string;
  placeholderTextColor?: string;
  viewStyle?: ViewStyle;
  innerViewStyle?: ViewStyle;
  inputStyle?: TextInputProps['style'];
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  isRequired?: boolean;
  editable?: boolean;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onSubmitEditing?: () => void;
  onSearchClear?: () => void;
  ref?: React.LegacyRef<TextInput>;
}

const InputField: React.FC<InputFieldProps> = React.forwardRef<
  TextInput,
  InputFieldProps
>(
  (
    {
      type = 'default',
      title,
      value,
      placeholder = '',
      placeholderTextColor,
      isRequired,
      viewStyle,
      innerViewStyle,
      inputStyle,
      maxLength,
      multiline,
      numberOfLines,
      editable = true,
      onChangeText,
      onSubmitEditing,
      onSearchClear,
      ...rest
    },
    ref,
  ) => {
    const [isFocused, setFocused] = useState(false);
    return (
      <>
        <View style={[styles.outerContainer, viewStyle]}>
          {title && (
            <Text style={styles.titleText}>
              {title}
              {isRequired && <Text style={styles.requiredText}>{'*'}</Text>}
            </Text>
          )}
          <View
            style={[
              styles.innerContainer,
              {borderColor: isFocused ? COLORS.PRIMARY : COLORS.BORDER_DEFAULT},
              innerViewStyle,
            ]}>
            {type === 'loginMobile' && (
              <Text style={styles.flagText}>{'🇮🇳+91 '}</Text>
            )}
            {type === 'search' && (
              <Image source={IMAGES.search} style={styles.searchIcon} />
            )}
            <TextInput
              ref={ref as React.LegacyRef<TextInput>}
              editable={editable}
              placeholderTextColor={
                placeholderTextColor ?? COLORS.TEXT_PLACEHOLDER
              }
              value={value}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
              }}
              placeholder={`${placeholder}`}
              style={[
                styles.inputStyle,
                multiline && styles.multiline,
                inputStyle,
              ]}
              caretHidden={false}
              onChangeText={onChangeText}
              onSubmitEditing={onSubmitEditing}
              secureTextEntry={false}
              maxLength={maxLength}
              multiline={multiline ?? false}
              numberOfLines={numberOfLines ?? 1}
              autoCorrect={false}
              {...rest}
            />
            {type === 'search' && value !== '' && (
              <Buttons
                type={'icon'}
                icon={IMAGES.close}
                iconStyle={styles.closeButtonIcon}
                viewStyle={styles.closeButton}
                onPress={onSearchClear}
              />
            )}
          </View>
        </View>
      </>
    );
  },
);
InputField.displayName = 'InputField';
export default React.memo(InputField);

const styles = StyleSheet.create({
  closeButton: {
    height: '100%',
    width: SIZE.MS(35),
    borderRadius: 0,
  },
  closeButtonIcon: {
    width: SIZE.MS(18),
    height: SIZE.MS(18),
    resizeMode: 'contain',
    tintColor: COLORS.PRIMARY_DARK,
  },
  searchIcon: {
    width: SIZE.MS(25),
    height: SIZE.MS(25),
    resizeMode: 'contain',
    tintColor: COLORS.BORDER_DEFAULT,
  },
  multiline: {
    height: SIZE.MS(80),
  },
  requiredText: {
    fontSize: SIZE.MS(16),
    color: COLORS.ERROR,
    fontFamily: FONTS.BOLD,
  },
  titleText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MS(17),
    color: COLORS.PRIMARY_DARK,
    marginTop: SIZE.MVS(10),
    marginBottom: SIZE.MVS(10),
  },
  outerContainer: {
    marginHorizontal: SIZE.MS(16),
  },
  innerContainer: {
    borderWidth: SIZE.MS(1),
    maxHeight: SIZE.MS(50),
    padding: SIZE.MS(8),
    paddingVertical: SIZE.MS(15),
    borderRadius: SIZE.MS(6),
    borderColor: COLORS.BORDER_DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
  },
  inputStyle: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    fontFamily: FONTS.MEDIUM,
    flex: 1,
  },
  flagText: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_DARK,
    fontFamily: FONTS.MEDIUM,
  },
});
