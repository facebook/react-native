import React from 'react';
import {AsyncStorage} from 'react-native';


export const useAsyncStorageReducer = (reducer, initialState, storageKey) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  React.useEffect(() => {
    if (state !== initialState) {
      AsyncStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, storageKey, initialState]);

  return [state, dispatch];
};
