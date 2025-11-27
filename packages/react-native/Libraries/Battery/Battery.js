/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';
import type {BatteryState} from './NativeBattery';
import typeof INativeBattery from './NativeBattery';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import EventEmitter from '../vendor/emitter/EventEmitter';

export type {BatteryState};

type Battery = {
  level: number,
  isCharging: boolean,
  isLowPowerMode: boolean,
};

let lazyState: ?{
  +NativeBattery: INativeBattery,
  // Cache the battery state to reduce the cost of reading it between changes.
  // NOTE: If `NativeBattery` is null, this will always be null.
  battery: ?Battery,
  // NOTE: This is non-nullable to make it easier for `onChangedListener` to
  // return a non-nullable `EventSubscription` value. This is not the common
  // path, so we do not have to over-optimize it.
  +eventEmitter: EventEmitter<{change: [Battery]}>,
};

/**
 * Ensures that all state and listeners are lazily initialized correctly.
 */
function getState(): $NonMaybeType<typeof lazyState> {
  if (lazyState != null) {
    return lazyState;
  }
  const eventEmitter = new EventEmitter<{change: [Battery]}>();
  // NOTE: Avoid initializing `NativeBattery` until it is actually used.
  const NativeBattery = require('./NativeBattery').default;
  if (NativeBattery == null) {
    // Assign `null` to avoid re-initializing on subsequent invocations.
    lazyState = {
      NativeBattery: null,
      battery: null,
      eventEmitter,
    };
  } else {
    const state: $NonMaybeType<typeof lazyState> = {
      NativeBattery,
      battery: null,
      eventEmitter,
    };
    new NativeEventEmitter<{
      batteryStateDidChange: [BatteryState],
    }>(NativeBattery).addListener('batteryStateDidChange', newBatteryState => {
      state.battery = {
        level: newBatteryState.level,
        isCharging: newBatteryState.isCharging,
        isLowPowerMode: newBatteryState.isLowPowerMode,
      };
      eventEmitter.emit('change', state.battery);
    });
    lazyState = state;
  }
  return lazyState;
}

/**
 * Returns the current battery state. This value may change, so the
 * value should not be cached without either listening to changes or using
 * the `useBattery` hook (if available).
 */
export async function getBatteryState(): Promise<?BatteryState> {
  const state = getState();
  const {NativeBattery} = state;
  if (NativeBattery != null) {
    return await NativeBattery.getBatteryState();
  }
  return null;
}

/**
 * Add an event handler that is fired when battery state changes.
 */
export function addChangeListener(
  listener: (battery: Battery) => void,
): EventSubscription {
  const {eventEmitter} = getState();
  return eventEmitter.addListener('change', listener);
}

/**
 * Remove a specific event listener.
 */
export function removeChangeListener(subscription: EventSubscription): void {
  subscription.remove();
}

/**
 * Remove all event listeners.
 */
export function removeAllListeners(): void {
  const state = getState();
  const {eventEmitter} = state;
  eventEmitter.removeAllListeners('change');
}

class BatteryImpl {
  isAvailable: boolean;

  constructor() {
    const state = getState();
    this.isAvailable = state.NativeBattery != null;
  }

  /**
   * Get the current battery state.
   *
   * @returns Promise that resolves to the current battery state, or null if unavailable.
   */
  async getBatteryState(): Promise<?BatteryState> {
    return await getBatteryState();
  }

  /**
   * Add a handler to battery state changes by listening to the `change` event type
   * and providing the handler.
   */
  addChangeListener(
    callback: (state: Battery) => void,
  ): EventSubscription {
    return addChangeListener(callback);
  }

  /**
   * Remove a specific change listener.
   */
  removeChangeListener(subscription: EventSubscription): void {
    subscription.remove();
  }

  /**
   * Remove all change listeners.
   */
  removeAllListeners(): void {
    const {eventEmitter} = getState();
    eventEmitter.removeAllListeners('change');
  }
}

const Battery: BatteryImpl = new BatteryImpl();
export default Battery;

