/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {AsyncStorage} from 'react-native';

import type {RNTesterState} from '../types/RNTesterTypes';

export const useAsyncStorageReducer = (
  reducer: Function,
  initialState: RNTesterState,
  storageKey: string,
): [RNTesterState, Function] => {
  const [state, dispatch] = React.useReducer<Function, Object>(
    reducer,
    initialState,
  );

  React.useEffect(() => {
    if (state !== initialState) {
      AsyncStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, storageKey, initialState]);

  return [state, dispatch];
};
