import {StyleSheet, Text, View, StatusBar} from 'react-native';
import React, {useState, useEffect} from 'react';
import {RootStackParamList} from '@navigation/navigator';
import {BackHeader, ModalSheet} from '@molecules';
import {Screen} from '@organisms';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {RootState, StoreDispatch} from '@reducers';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS, FONTS, IMAGES, SIZE, STYLES} from '@res';
import {DataType, ScreenProps} from '@types';
import CustomPicker from 'src/components/molecules/CustomPicker/index';
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChamberDetailsScreen'
>;

const ChamberDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<string | null>('gigatel');
  const companies = [
    {label: 'GIGATEL SOLUTIONS PRIVATE LIMITED', value: 'gigatel'},
    {label: 'SPARK TELECOM SERVICES', value: 'spark'},
    {label: 'TOPTECH NETWORKS LTD', value: 'toptech'},
  ];
  return (
    <Screen statusBgColor={COLORS.PRIMARY} preset={'scroll'}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
      <Text>Details Chamber Screen</Text>
    </Screen>
  );
};

export default ChamberDetailsScreen;
