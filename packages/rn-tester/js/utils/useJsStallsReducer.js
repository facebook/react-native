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

import type {RNTesterJsStallsState} from '../types/RNTesterTypes';
import {
  RNTesterJsStallsReducer,
  RNTesterJsStallsActionsType,
} from './RNTesterJsStallsReducer';
import {initialJsStallsState} from './testerStateUtils';

const useJsStallsReducer = (): {
  state: RNTesterJsStallsState,
  onEnableForceJsStalls: Function,
  onDisableForceJsStalls: Function,
  onEnableJsStallsTracking: Function,
  onDisableJsStallsTracking: Function,
} => {
  const [state, dispatch] = React.useReducer<Function, Object>(
    RNTesterJsStallsReducer,
    initialJsStallsState,
  );

  const {stallInterval} = state;

  const onDisableForceJsStalls = () => {
    clearInterval(stallInterval || 0);
    dispatch({
      type: RNTesterJsStallsActionsType.STOP_JS_STALLS,
      data: {
        stallInterval: null,
      },
    });
  };

  const onEnableForceJsStalls = () => {
    const intervalId = setInterval(() => {
      const start = Date.now();
      console.warn('burn CPU');
      while (Date.now() - start < 100) {}
    }, 300);
    dispatch({
      type: RNTesterJsStallsActionsType.START_JS_STALLS,
      data: {stallInterval: intervalId},
    });
  };

  const onEnableJsStallsTracking = () => {
    require('react-native/Libraries/Interaction/JSEventLoopWatchdog').install({
      thresholdMS: 25,
    });
    dispatch({
      type: RNTesterJsStallsActionsType.START_TRACK_JS_STALLS,
    });
    require('react-native/Libraries/Interaction/JSEventLoopWatchdog').addHandler(
      {
        onStall: ({busyTime}) => {
          dispatch({
            type: RNTesterJsStallsActionsType.UPDATE_TRACK_JS_STALLS,
            data: {
              busyTime,
            },
          });
        },
      },
    );
  };

  const onDisableJsStallsTracking = () => {
    console.warn('Cannot disable yet....');
  };

  return {
    state,
    onDisableForceJsStalls,
    onEnableForceJsStalls,
    onEnableJsStallsTracking,
    onDisableJsStallsTracking,
  };
};

export default useJsStallsReducer;
