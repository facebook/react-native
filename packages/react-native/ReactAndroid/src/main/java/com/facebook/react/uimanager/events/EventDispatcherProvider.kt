/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

/**
 * An interface that can be implemented by a [com.facebook.react.bridge.ReactContext] to provide a
 * first-class API for accessing the [EventDispatcher] from the
 * [com.facebook.react.bridge.UIManager].
 */
public fun interface EventDispatcherProvider {
  /**
   * This should always return an [EventDispatcher], even if the instance doesn't exist; in that
   * case it should return the empty [BlackHoleEventDispatcher].
   *
   * @return An [EventDispatcher] to emit events to JS.
   */
  public fun getEventDispatcher(): EventDispatcher
}
