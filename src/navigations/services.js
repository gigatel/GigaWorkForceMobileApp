import {StackActions} from '@react-navigation/native';
import * as React from 'react';

export const navigationRef = React.createRef();

export const goBack = () => {
  navigationRef.current?.goBack();
};
export const navigate = (routeName, params) => {
  navigationRef.current?.navigate(routeName, params);
};

export const reset = (routeName, params) => {
  navigationRef.current?.reset({
    index: 0,
    routes: [{name: routeName, params: params}],
  });
};

export const resetWithTabs = (index, routeName, params) => {
  navigationRef.current?.reset({
    index: 0,
    routes: [
      {
        name: 'BottomTabs',
        state: {
          routes: [
            {
              name: 'BottomTabs',
              state: {
                index: index, //! Make sure to set the correct index if needed
                routes: [
                  {
                    name: routeName,
                    params,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });
};

export const push = (...args) => {
  navigationRef.current?.dispatch(StackActions.push(...args));
};

export const navName = 'PKP';
