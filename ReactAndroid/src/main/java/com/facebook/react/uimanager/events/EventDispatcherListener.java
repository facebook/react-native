// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager.events;

/**
 * Interface used to intercept events dispatched by {#link EventDispatcher}
 */
public interface EventDispatcherListener {
  /**
   * Called on every time an event is dispatched using {#link EventDispatcher#dispatchEvent}. Will be
   * called from the same thread that the event is being dispatched from.
   * @param event Event that was dispatched
   */
  void onEventDispatch(Event event);
}
