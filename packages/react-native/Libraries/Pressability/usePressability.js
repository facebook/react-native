/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';
import Pressability, {
  type EventHandlers,
  type PressabilityConfig,
} from './Pressability';
import {useEffect, useInsertionEffect, useRef} from 'react';

declare function usePressability(config: PressabilityConfig): EventHandlers;
declare function usePressability(config: null | void): null | EventHandlers;

// Experiments with using `useInsertionEffect` instead of `useEffect`, which
// changes whether `Pressability` is configured or reset when inm a hidden
// Activity. With `useInsertionEffect`, `Pressability` behaves more like a
// platform control (e.g. Pointer Events), especially with respect to events
// like focus and blur.
const useConfigurationEffect =
  ReactNativeFeatureFlags.configurePressabilityDuringInsertion()
    ? useInsertionEffect
    : useEffect;

/**
 * Creates a persistent instance of `Pressability` that automatically configures
 * itself and resets. Accepts null `config` to support lazy initialization. Once
 * initialized, will not un-initialize until the component has been unmounted.
 *
 * In order to use `usePressability`, do the following:
 *
 *   const config = useMemo(...);
 *   const eventHandlers = usePressability(config);
 *   const pressableView = <View {...eventHandlers} />;
 *
 */
export default function usePressability(
  config: ?PressabilityConfig,
): null | EventHandlers {
  const pressabilityRef = useRef<?Pressability>(null);
  if (config != null && pressabilityRef.current == null) {
    pressabilityRef.current = new Pressability(config);
  }
  const pressability = pressabilityRef.current;

  // On the initial mount, this is a no-op. On updates, `pressability` will be
  // re-configured to use the new configuration.
  useConfigurationEffect(() => {
    if (config != null && pressability != null) {
      pressability.configure(config);
    }
  }, [config, pressability]);

  // On unmount, reset pending state and timers inside `pressability`. This is
  // a separate effect because we do not want to reset when `config` changes.
  useConfigurationEffect(() => {
    if (pressability != null) {
      return () => {
        pressability.reset();
      };
    }
  }, [pressability]);

  return pressability == null ? null : pressability.getEventHandlers();
}
