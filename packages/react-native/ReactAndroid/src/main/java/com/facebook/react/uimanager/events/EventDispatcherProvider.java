/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

/**
 * An interface that can be implemented by a {@link com.facebook.react.bridge.ReactContext} to
 * provide a first-class API for accessing the {@link EventDispatcher} from the {@link
 * com.facebook.react.bridge.UIManager}.
 */
public interface EventDispatcherProvider {

  /**
   * This method should always return an EventDispatcher, even if the instance doesn't exist; in
   * that case it should return the empty {@link BlackHoleEventDispatcher}.
   *
   * @return An {@link EventDispatcher} to emit events to JS.
   */
  EventDispatcher getEventDispatcher();
}
