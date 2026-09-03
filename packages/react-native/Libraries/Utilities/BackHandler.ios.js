/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HardwareBackPressEvent} from './HardwareBackPressEvent';

type BackPressEventName = 'backPress' | 'hardwareBackPress';
type BackPressHandler = (event: HardwareBackPressEvent) => ?boolean;

export type PredictiveBackPhase = 'start' | 'progress' | 'cancel' | 'commit';
export type PredictiveBackEvent = {
  phase: PredictiveBackPhase,
  progress: number,
  swipeEdge: number,
  touchX: number,
  touchY: number,
};

function emptyFunction(): void {}

type TBackHandler = {
  exitApp(): void,
  addEventListener(
    eventName: BackPressEventName,
    handler: BackPressHandler,
  ): {remove: () => void, ...},
  setInterceptEnabled(enabled: boolean): void,
  addPredictiveBackListener(handler: (event: PredictiveBackEvent) => void): {
    remove: () => void,
    ...
  },
};

const BackHandler: TBackHandler = {
  exitApp: emptyFunction,
  addEventListener(_eventName: BackPressEventName, _handler: BackPressHandler) {
    return {
      remove: emptyFunction,
    };
  },
  setInterceptEnabled(_enabled: boolean): void {},
  addPredictiveBackListener(_handler: (event: PredictiveBackEvent) => void) {
    return {
      remove: emptyFunction,
    };
  },
};

export default BackHandler;
