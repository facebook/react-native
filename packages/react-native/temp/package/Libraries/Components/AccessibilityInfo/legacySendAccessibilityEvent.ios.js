/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import NativeAccessibilityManager from './NativeAccessibilityManager';

/**
 * This is a function exposed to the React Renderer that can be used by the
 * pre-Fabric renderer to emit accessibility events to pre-Fabric nodes.
 */
function legacySendAccessibilityEvent(
  reactTag: number,
  eventType: string,
): void {
  if (eventType === 'focus' && NativeAccessibilityManager) {
    NativeAccessibilityManager.setAccessibilityFocus(reactTag);
  }
}

module.exports = legacySendAccessibilityEvent;
