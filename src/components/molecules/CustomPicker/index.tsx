import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';

export type PickerItem = {label: string; value: string};

type Props = {
  label?: string;
  placeholder?: string;
  data: PickerItem[];
  selectedValue?: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
  errorText?: string;
};

const CustomPicker: React.FC<Props> = ({
  label,
  placeholder = 'Select',
  data,
  selectedValue = null,
  onSelect,
  disabled = false,
  errorText,
}) => {
  const [visible, setVisible] = useState(false);

  const selectedLabel = useMemo(
    () => data.find(d => d.value === selectedValue)?.label ?? '',
    [data, selectedValue],
  );

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        disabled={disabled}
        onPress={() => setVisible(true)}
        android_ripple={{color: '#e2e8f0'}}
        style={[
          styles.selector,
          disabled && {opacity: 0.6},
          !!errorText && {borderColor: '#ef4444'},
        ]}>
        <Text style={[styles.valueText, !selectedLabel && {color: '#8a8a8a'}]}>
          {selectedLabel || placeholder}
        </Text>
        {/* down-arrow without any icon library */}
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      {!!errorText && <Text style={styles.error}>{errorText}</Text>}

      {/* Inbuilt RN Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        statusBarTranslucent>
        {/* dim overlay */}
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          {/* stop propagation so inner taps don't close */}
          <Pressable style={styles.sheet}>
            <FlatList
              data={data}
              keyExtractor={item => item.value}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({item}) => {
                const isSelected = item.value === selectedValue;
                return (
                  <Pressable
                    android_ripple={{color: '#e5e7eb'}}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onSelect(item.value);
                      setVisible(false);
                    }}>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {item.label}
                    </Text>
                    {isSelected ? <Text style={styles.tick}>✓</Text> : null}
                  </Pressable>
                );
              }}
              contentContainerStyle={{paddingVertical: 6}}
              style={{maxHeight: '60%'}}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default CustomPicker;

const styles = StyleSheet.create({
  wrapper: {marginVertical: 8},
  label: {fontSize: 14, color: '#64748b', marginBottom: 6},
  selector: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    // subtle elevation/shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 2,
    elevation: 2,
  },
  valueText: {fontSize: 15, color: '#111827'},
  chevron: {fontSize: 18, color: '#111827', marginLeft: 8},
  error: {color: '#ef4444', marginTop: 4, fontSize: 12},

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 16,
    elevation: 6,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {backgroundColor: '#eef6ff'},
  optionText: {fontSize: 15, color: '#111827', paddingVertical: 8},
  optionTextSelected: {fontWeight: '600', color: '#2563eb'},
  tick: {fontSize: 16, color: '#2563eb', marginLeft: 12},
  sep: {height: StyleSheet.hairlineWidth, backgroundColor: '#e5e7eb'},
});
