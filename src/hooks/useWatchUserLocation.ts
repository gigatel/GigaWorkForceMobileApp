/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import { useEffect, useRef } from 'react';
import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation';

export const useWatchUserLocation = (
  onUpdate: (pos: GeolocationResponse) => void,
  enable: boolean
) => {
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (enable) {
      watchId.current = Geolocation.watchPosition(
        onUpdate,
        error => {
          console.warn('Location error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 50000,
          distanceFilter: 10,     // trigger if user moves 10 meters
          // Android Only
          interval: 10000,        // check every 10 seconds
          fastestInterval: 5000,  // allow faster updates (5s)

          //iOS Only
          useSignificantChanges: false, // iOS only
        }
      );
    }

    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [enable, onUpdate]);
};
