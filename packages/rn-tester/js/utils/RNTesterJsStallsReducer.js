/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {RNTesterJsStallsState} from '../types/RNTesterTypes';

export const RNTesterJsStallsActionsType = {
  START_JS_STALLS: 'START_JS_STALLS',
  STOP_JS_STALLS: 'STOP_JS_STALLS',
  START_TRACK_JS_STALLS: 'START_TRACK_JS_STALLS',
  UPDATE_TRACK_JS_STALLS: 'UPDATE_TRACK_JS_STALLS',
  STOP_TRACK_JS_STALLS: 'STOP_TRACK_JS_STALLS',
};

export const RNTesterJsStallsReducer = (
  state: RNTesterJsStallsState,
  action: {type: string, data: RNTesterJsStallsState},
): RNTesterJsStallsState => {
  const {type, data} = action;
  switch (type) {
    case RNTesterJsStallsActionsType.START_JS_STALLS:
    case RNTesterJsStallsActionsType.STOP_JS_STALLS:
      return {
        ...state,
        stallInterval: data.stallInterval,
      };
    case RNTesterJsStallsActionsType.START_TRACK_JS_STALLS:
      return {
        ...state,
        tracking: true,
      };
    case RNTesterJsStallsActionsType.UPDATE_TRACK_JS_STALLS:
      if (!state.stallInterval) {
        return {
          ...state,
        };
      }
      return {
        ...state,
        busyTime: data.busyTime || state.busyTime,
        filteredStall: state.filteredStall * 0.97 + (data.busyTime || 0) * 0.03,
      };
    case RNTesterJsStallsActionsType.STOP_TRACK_JS_STALLS:
      return {
        ...state,
      };
    default:
      throw new Error(`Invalid action type ${action.type}`);
  }
};
