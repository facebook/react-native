/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import Pressability, {
  type EventHandlers,
  type PressabilityConfig,
} from './Pressability';
import {useEffect, useRef} from 'react';

export default function usePressability(
  config: PressabilityConfig,
): EventHandlers {
  const pressabilityRef = useRef<?Pressability>(null);
  if (pressabilityRef.current == null) {
    pressabilityRef.current = new Pressability(config);
  }
  const pressability = pressabilityRef.current;

  // On the initial mount, this is a no-op. On updates, `pressability` will be
  // re-configured to use the new configuration.
  useEffect(() => {
    pressability.configure(config);
  }, [config, pressability]);

  // On unmount, reset pending state and timers inside `pressability`. This is
  // a separate effect because we do not want to reset when `config` changes.
  useEffect(() => {
    return () => {
      pressability.reset();
    };
  }, [pressability]);

  return pressability.getEventHandlers();
}
