import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {DataType, ScreenProps} from '@types';

const SearchCustomer: React.FC<ScreenProps.SearchCustomer> = ({
  navigation,
  route,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Customer Screen</Text>
    </View>
  );
};

export default SearchCustomer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
});
