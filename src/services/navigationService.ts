import {NavigationContainerRef, StackActions} from '@react-navigation/native';
import {createRef} from 'react';

export const navigationRef = createRef<NavigationContainerRef<any>>();

export class NavigationService {
  static navigate(name: string, params?: any) {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    }
  }

  static push(name: string, params?: any) {
    if (navigationRef.current) {
      navigationRef.current.dispatch(StackActions.push(name, params));
    }
  }

  static goBack() {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    }
  }
}
