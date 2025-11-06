import * as Forground from './Forground';

import React, {useEffect} from 'react';
import {AppState, PermissionsAndroid, Platform} from 'react-native';
import {MapStateType} from '.';

let prevState: string | null = null;

const BackgroundLocation: React.FC<MapStateType> = props => {
  const [enabled, setEnabled] = React.useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', () => {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      ).then(result => {
        setEnabled(result);
      });
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    ).then(result => {
      const osVersion = Platform.Version;
      setEnabled((typeof osVersion === 'number' && osVersion <= 28) || result);
    });
  }, []);

  useEffect(() => {
    if (!enabled || prevState === props.loginToken) {
      return;
    }
    prevState = props.loginToken;

    if (props.isBgAllow && props.loginToken) {
      Forground.startWatch();
    } else {
      Forground.clearWatch();
    }
  }, [enabled, props]);

  return <></>;
};

export default BackgroundLocation;
