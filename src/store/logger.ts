import { Common } from '@utils';

export const errorLogger = (store) => (next) => (action) => {
  if (action.type.endsWith('/rejected')) {
    console.group(
      `%c Error at %c${action.type}`,
      'color: white; background-color: red; padding: 2px;',
      'color: red; font-weight: bold;',
    );
    Common.error('Payload:', action.payload);
    console.groupEnd();
  }

  return next(action);
};
