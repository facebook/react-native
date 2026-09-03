/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeDeviceEventManager from '../../Libraries/NativeModules/specs/NativeDeviceEventManager';
import {setEventInitTimeStamp} from '../../src/private/webapis/dom/events/internals/EventInternals';
import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import {HardwareBackPressEvent} from './HardwareBackPressEvent';

const DEVICE_BACK_EVENT = 'hardwareBackPress';
const PREDICTIVE_BACK_EVENT = 'predictiveBack';

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
type PredictiveBackListener = (event: PredictiveBackEvent) => void;

const _backPressSubscriptions: Array<BackPressHandler> = [];
const _predictiveBackSubscriptions: Array<PredictiveBackListener> = [];

RCTDeviceEventEmitter.addListener(DEVICE_BACK_EVENT, function (nativeEvent) {
  const options = {};
  const nativeTimestamp = nativeEvent?.timeStamp;
  if (nativeTimestamp != null) {
    setEventInitTimeStamp(options, nativeTimestamp);
  }
  const event = new HardwareBackPressEvent(options);
  for (let i = _backPressSubscriptions.length - 1; i >= 0; i--) {
    if (_backPressSubscriptions[i]?.(event)) {
      return;
    }
  }

  BackHandler.exitApp();
});

RCTDeviceEventEmitter.addListener(
  PREDICTIVE_BACK_EVENT,
  function (nativeEvent) {
    const event: PredictiveBackEvent = {
      phase: nativeEvent?.phase ?? 'progress',
      progress: nativeEvent?.progress ?? 0,
      swipeEdge: nativeEvent?.swipeEdge ?? 2,
      touchX: nativeEvent?.touchX ?? 0,
      touchY: nativeEvent?.touchY ?? 0,
    };
    for (let i = _predictiveBackSubscriptions.length - 1; i >= 0; i--) {
      _predictiveBackSubscriptions[i]?.(event);
    }
  },
);

/**
 * Detects hardware button presses for back navigation and lets you register
 * event listeners for the system's back action. Event subscriptions are called
 * in reverse order (i.e. last registered subscription first). If one
 * subscription returns `true`, earlier subscriptions are not called.
 *
 * @see https://reactnative.dev/docs/backhandler
 * @platform android
 */
type TBackHandler = {
  readonly exitApp: () => void,
  readonly addEventListener: (
    eventName: BackPressEventName,
    handler: BackPressHandler,
  ) => {remove: () => void, ...},
  /**
   * Android only. When true, React Native consumes the back gesture so
   * BackHandler can pop an in-app screen. On Android 16+, a view tagged
   * with nativeID "predictiveBackFrontPane" is scrubbed during the swipe
   * unless a native PredictiveBackHandler is registered. When false, the
   * system predictive-back animation can run; BackHandler still observes
   * app-exit commit.
   */
  readonly setInterceptEnabled: (enabled: boolean) => void,
  /**
   * Android only. Observes in-app predictive-back phases. Progress is
   * throttled and is not suitable for 60fps animation; native libraries
   * should use PredictiveBackHandler on ReactActivity instead.
   */
  readonly addPredictiveBackListener: (handler: PredictiveBackListener) => {
    remove: () => void,
    ...
  },
};
const BackHandler: TBackHandler = {
  /**
   * Programmatically exit the app.
   */
  exitApp: function (): void {
    if (!NativeDeviceEventManager) {
      return;
    }

    NativeDeviceEventManager.invokeDefaultBackPressHandler();
  },

  setInterceptEnabled: function (enabled: boolean): void {
    if (!NativeDeviceEventManager) {
      return;
    }

    NativeDeviceEventManager.setInterceptEnabled(enabled);
  },

  /**
   * Listen for the `hardwareBackPress` event. The handler should return `true`
   * to prevent the event from bubbling to earlier registered listeners.
   */
  addEventListener: function (
    eventName: BackPressEventName,
    handler: BackPressHandler,
  ): {remove: () => void, ...} {
    if (_backPressSubscriptions.indexOf(handler) === -1) {
      _backPressSubscriptions.push(handler);
    }
    return {
      remove: (): void => {
        const index = _backPressSubscriptions.indexOf(handler);
        if (index !== -1) {
          _backPressSubscriptions.splice(index, 1);
        }
      },
    };
  },

  /**
   * Listen for in-app predictive-back phases (`start`, `progress`,
   * `cancel`, `commit`). Returning a value does not consume the gesture;
   * use `setInterceptEnabled` or a native `PredictiveBackHandler` for that.
   */
  addPredictiveBackListener: function (handler: PredictiveBackListener): {
    remove: () => void,
    ...
  } {
    if (_predictiveBackSubscriptions.indexOf(handler) === -1) {
      _predictiveBackSubscriptions.push(handler);
    }
    return {
      remove: (): void => {
        const index = _predictiveBackSubscriptions.indexOf(handler);
        if (index !== -1) {
          _predictiveBackSubscriptions.splice(index, 1);
        }
      },
    };
  },
};

export default BackHandler;
