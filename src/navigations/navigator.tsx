// navigator.tsx
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '@screens/login';
import OtpVerification from '@screens/otp-verification';
import PrivacyPolicy from '@screens/privacy-policy';
import Splash from '@screens/splash';
import {Common, Preferences} from '@utils';
import React, {FC, useEffect, useState} from 'react';
import BottomTab from './bottom-tabs';
import {navigationRef} from './services';
import AttendanceDashboard from '@screens/attendance/attendance-dashboard';
import AttendanceInOut from '@screens/attendance/attendance-mark-inout';
import viewAttendanceReport from '@screens/attendance/view-attendance-report';
import DDAttendanceDashboard from '@screens/attendance/dd-attendance-dashboard';
import DDViewAttendanceReport from '@screens/attendance/dd-view-attendance-report';
import MonthlySalary from '@screens/attendance/payroll/monthly-salary';
import SalaryPaySlip from '@screens/attendance/payroll/salary-pay-slip';
import HolidaysList from '@screens/attendance/holidays-list';
import ContactsList from '@screens/attendance/contacts-list';
//
import SubmitPatrollerTask from '@screens/patroller-task/submit-patroller-task';
import PatrollerTask from '@screens/patroller-task/patroller-task';
//
import ChamberComplaintsList from '@screens/chamber-complaint/chamber-complaints-list';
import AddChamberComplaint from '@screens/chamber-complaint/add-chamber-complaint';
import DeveloperPKPScreen from '@screens/dev-pkp';
//
import CloseTicketScreen from '@screens/tickets/CloseTicketScreen';
import FollowUpScreen from '@screens/tickets/FollowUpScreen';
import TicketDetailsEnhanced from '@screens/tickets/TicketDetails';
import TicketsList from '@screens/tickets/TicketsList';
import {DataType} from '@types';
import {TicketData} from 'src/types/ticket.types';
import OldIRScreen from '@screens/tickets/OldIRScreen';
import NewIRScreen from '@screens/tickets/NewIRScreen';
import MapViewScreen from '@screens/tickets/MapViewScreen';
import StartTicketScreen from '@screens/tickets/StartTicketScreen';
import RoadProjectSurvey from '@screens/road-project-survey';
import DistanceCovered from '@screens/distance-covered';
import VideoRecorder from '@screens/VideoRecording';
import TubeCoreDetailsScreen from '@screens/tickets/TubeCoreDetailsScreen';
import ChamberDetailsScreen from '@screens/tickets/ChamberDetailsScreen';
import {TicketDetailsData} from '../../src/types/ticket.types';
type VideoRecorderRouteParams = {
  projectId: string;
  latLng: string;
  directionResult: string;
};
export interface RootStackParamList {
  Splash: undefined;
  BottomTab: undefined;
  PrivacyPolicy: undefined;
  Login: undefined;
  StartTicketScreen: {
    from: 'ticket-details';
    ticket: TicketDetailsData;
  };

  OtpVerification: {userId: string; password: string; appType: string};
  AttendanceDashboard: {
    shiftType: DataType.ShiftType;
    isViewAllow: boolean;
    isMarkAllow: boolean;
  };
  RoadProject: {};
  AttendanceInOut: {
    from: 'in' | 'out';
    shiftType: DataType.ShiftType;
    behalfOfData: DataType.TodayBehalfOf | null;
  };
  ViewAttendanceReport: undefined;
  DDAttendanceDashboard: {
    shiftType: DataType.ShiftType;
    isViewAllow: boolean;
    isMarkAllow: boolean;
  };
  DDViewAttendanceReport: undefined;
  MonthlySalary: undefined;
  SalaryPaySlip: undefined;
  HolidaysList: undefined;
  ContactsList: undefined;
  //
  PatrollerTask: undefined;
  SubmitPatrollerTask: {
    empID: number;
    selectedChamber: DataType.Chamber | null;
    currentPosition: DataType.Coords | null;
  };
  ChamberComplaintsList: undefined;
  AddChamberComplaint: undefined;
  DeveloperPKPScreen: undefined;
  TicketsList: undefined;
  ChamberDetailsScreen: undefined;
  TicketDetails: {ticketId: string};
  TicketFollowUp: {
    ticketId: string;
    ticketData: TicketData;
  };
  FollowUpScreen: {
    ticketId: string;
    ticketData: TicketData;
    onReturn?: () => void;
  };
  ChamberSelection: {
    ticketId: string;
    currentLocation: {lat: number; lng: number};
  };
  CloseTicketScreen: {
    ticketId: string;
    ticketData: any;
  };
  OldIRScreen: {ticketId: string};
  NewIRScreen: {ticketId: string; chamberDetails?: any};
  TubeCoreDetailsScreen: {issueTypeId: string; ticketId: string};
  MapViewScreen: {latitude: number; longitude: number; title: string};
  IRDetailsScreen: {irId: string; ticketId: string; irData: any};
  VideoRecorder: VideoRecorderRouteParams;

  [key: string]: any;
}

const Stack = createNativeStackNavigator<RootStackParamList>();
// Recursively read the deepest active route name (works for nested navigators)

const RootStack: FC<{initialRoute: string}> = ({initialRoute}) => {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName={initialRoute}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="BottomTab" component={BottomTab} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen name="OtpVerification" component={OtpVerification} />
      <Stack.Screen name="AttendanceInOut" component={AttendanceInOut} />
      <Stack.Screen
        name="ViewAttendanceReport"
        component={viewAttendanceReport}
      />
      <Stack.Screen
        name="AttendanceDashboard"
        component={AttendanceDashboard}
      />
      <Stack.Screen
        name="DDAttendanceDashboard"
        component={DDAttendanceDashboard}
      />
      <Stack.Screen
        name="DDViewAttendanceReport"
        component={DDViewAttendanceReport}
      />
      <Stack.Screen name="MonthlySalary" component={MonthlySalary} />
      <Stack.Screen name="SalaryPaySlip" component={SalaryPaySlip} />
      <Stack.Screen name="HolidaysList" component={HolidaysList} />
      <Stack.Screen name="ContactsList" component={ContactsList} />
      <Stack.Screen name="VideoRecorder" component={VideoRecorder} />
      <Stack.Screen name="PatrollerTask" component={PatrollerTask} />
      <Stack.Screen
        name="SubmitPatrollerTask"
        component={SubmitPatrollerTask}
      />
      <Stack.Screen
        name="ChamberComplaintsList"
        component={ChamberComplaintsList}
      />
      <Stack.Screen
        name="AddChamberComplaint"
        component={AddChamberComplaint}
      />
      <Stack.Screen name="RoadProject" component={RoadProjectSurvey} />
      <Stack.Screen name="DistanceCovered" component={DistanceCovered} />
      <Stack.Screen name="DeveloperPKPScreen" component={DeveloperPKPScreen} />
      <Stack.Screen
        name="TicketsList"
        component={TicketsList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ChamberDetailsScreen"
        component={ChamberDetailsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="StartTicketScreen" component={StartTicketScreen} />

      <Stack.Screen
        name="TicketDetails"
        component={TicketDetailsEnhanced}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="FollowUpScreen"
        component={FollowUpScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="CloseTicketScreen"
        component={CloseTicketScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="OldIRScreen"
        component={OldIRScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NewIRScreen"
        component={NewIRScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="TubeCoreDetailsScreen"
        component={TubeCoreDetailsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="MapViewScreen"
        component={MapViewScreen}
        options={{headerShown: false}}
      />

      {/* <Stack.Screen
        name="IRDetailsScreen"
        component={IRDetailsScreen}
        options={{headerShown: false}}
      /> */}
    </Stack.Navigator>
  );
};
const RootNavigator = ({}) => {
  const [initialRoute, setInitialRoute] = useState('');
  const getActiveRouteName = (state: any): string | undefined => {
    if (!state) return undefined;
    const route = state.routes?.[state.index ?? 0];
    if (route?.state) return getActiveRouteName(route.state);
    return route?.name;
  };
  // const getActiveRouteName = (state: any): string | undefined => {
  //   if (!state) return undefined;
  //   const route = state.routes?.[state.index ?? 0];
  //   if (route?.state) return getActiveRouteName(route.state);
  //   return route?.name;
  // };
  useEffect(() => {
    const token = Preferences.getData('API_AUTH_TOKEN') ?? null;
    const timer = setTimeout(() => {
      if (token === null || token === undefined) {
        console.log('token', token);
        setInitialRoute('Login');
      } else {
        setInitialRoute('BottomTab');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (initialRoute === '') {
    return <Splash />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Common.log('RootNavigator is ready');
      }}
      onStateChange={state => {
        try {
          const forced = Preferences.getData('FORCE_UPDATE_REQUIRED') === 'yes';
          if (!forced) return;
          const active = getActiveRouteName(state);
          const BLOCKED_TABS = new Set(['Account', 'Settings']);
          if (active && BLOCKED_TABS.has(active)) {
            Common.showToast(
              'Update to Latest App version to access other Tabs',
            );
            navigationRef.current?.navigate('BottomTab', {screen: 'Home'});
          }
        } catch (e) {}
      }}>
      <RootStack initialRoute={initialRoute} />
    </NavigationContainer>
  );
};
export default RootNavigator;
// eslint-disable-next-line no-lone-blocks
{
  /*
  <Button onPress={() => navigation.goBack()}>Go back</Button>
  <Button onPress={() => navigation.popTo('Home')}>Go to Home</Button>
  <Button onPress={() => navigation.popToTop()}>
    Go back to first screen in stack
  </Button>
      */
}
