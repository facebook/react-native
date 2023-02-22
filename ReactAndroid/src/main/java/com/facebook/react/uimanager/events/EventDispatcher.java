/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import com.facebook.react.uimanager.common.UIManagerType;

public interface EventDispatcher {

  /** Sends the given Event to JS, coalescing eligible events if JS is backed up. */
  void dispatchEvent(Event event);

  void dispatchAllEvents();

  /** Add a listener to this EventDispatcher. */
  void addListener(EventDispatcherListener listener);

  /** Remove a listener from this EventDispatcher. */
  void removeListener(EventDispatcherListener listener);

  void addBatchEventDispatchedListener(BatchEventDispatchedListener listener);

  void removeBatchEventDispatchedListener(BatchEventDispatchedListener listener);

  @Deprecated
  void registerEventEmitter(@UIManagerType int uiManagerType, RCTEventEmitter eventEmitter);

  void registerEventEmitter(@UIManagerType int uiManagerType, RCTModernEventEmitter eventEmitter);

  void unregisterEventEmitter(@UIManagerType int uiManagerType);

  void onCatalystInstanceDestroyed();
}
