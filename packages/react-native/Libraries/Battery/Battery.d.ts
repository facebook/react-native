/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';

export interface BatteryState {
  level: number; // 0-100
  isCharging: boolean;
  isLowPowerMode: boolean;
}

export interface BatteryStatic {
  /**
   * Get the current battery state.
   * @returns Promise that resolves to the current battery state, or null if unavailable.
   */
  getBatteryState(): Promise<BatteryState | null>;

  /**
   * Add a handler to battery state changes by listening to the `change` event type
   * and providing the handler.
   */
  addChangeListener(
    callback: (state: BatteryState) => void,
  ): EventSubscription;

  /**
   * Remove a specific change listener.
   */
  removeChangeListener(subscription: EventSubscription): void;

  /**
   * Remove all change listeners.
   */
  removeAllListeners(): void;

  /**
   * Whether the Battery API is available on this platform.
   */
  isAvailable: boolean;
}

declare const Battery: BatteryStatic;
export default Battery;

