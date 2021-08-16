/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import com.facebook.common.logging.FLog;

/**
 * A singleton class that overrides {@link EventDispatcher} with no-op methods, to be used by
 * callers that expect an EventDispatcher when the instance doesn't exist.
 */
public class BlackHoleEventDispatcher implements EventDispatcher {

  private static final EventDispatcher sEventDispatcher = new BlackHoleEventDispatcher();

  public static EventDispatcher get() {
    return sEventDispatcher;
  }

  private BlackHoleEventDispatcher() {}

  @Override
  public void dispatchEvent(Event event) {
    FLog.d(
        getClass().getSimpleName(),
        "Trying to emit event to JS, but the React instance isn't ready. Event: "
            + event.getEventName());
  }

  @Override
  public void dispatchAllEvents() {}

  @Override
  public void addListener(EventDispatcherListener listener) {}

  @Override
  public void removeListener(EventDispatcherListener listener) {}

  @Override
  public void addBatchEventDispatchedListener(BatchEventDispatchedListener listener) {}

  @Override
  public void removeBatchEventDispatchedListener(BatchEventDispatchedListener listener) {}

  @Override
  public void registerEventEmitter(int uiManagerType, RCTEventEmitter eventEmitter) {}

  @Override
  public void unregisterEventEmitter(int uiManagerType) {}

  @Override
  public void onCatalystInstanceDestroyed() {}
}
