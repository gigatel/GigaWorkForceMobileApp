import {RadioButton} from '@atoms';
import {COLORS} from '@res';
import React, {useState} from 'react';
import {View, Text, ViewStyle, StyleSheet} from 'react-native';

interface RadioButtonGroupProps<T = string> {
  label?: string;
  options: {
    label: string;
    value: T;
  }[];
  value?: T | null;
  onChange?: (value: T) => void;
  containerStyle?: ViewStyle;
  labelStyle?: ViewStyle;
  disabled?: boolean;
}

export const RadioButtonGroup = <T = string,>({
  label,
  options,
  value,
  onChange,
  containerStyle,
  labelStyle,
  disabled = false,
}: RadioButtonGroupProps<T>) => {
  const [internalValue, setInternalValue] = useState<T | null>(null);

  // Use external value if provided, otherwise use internal state
  const selectedValue = value !== undefined ? value : internalValue;

  const handlePress = (optionValue: T) => {
    if (disabled) return;

    if (onChange) {
      onChange(optionValue);
    } else {
      setInternalValue(optionValue);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <RadioButton
            key={index}
            active={selectedValue === option.value}
            title={option.label}
            onPress={() => handlePress(option.value)}
            viewStyle={styles.radioButton}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  optionsContainer: {
    gap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  radioButton: {
    color: COLORS.TEXT_DARK,
    marginVertical: 4,
  },
});
