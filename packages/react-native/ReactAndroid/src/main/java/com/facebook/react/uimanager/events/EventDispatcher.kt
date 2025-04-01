/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

public interface EventDispatcher {
  /** Sends the given Event to JS, coalescing eligible events if JS is backed up. */
  public fun dispatchEvent(event: Event<*>)

  public fun dispatchAllEvents()

  /** Add a listener to this EventDispatcher. */
  public fun addListener(listener: EventDispatcherListener)

  /** Remove a listener from this EventDispatcher. */
  public fun removeListener(listener: EventDispatcherListener)

  public fun addBatchEventDispatchedListener(listener: BatchEventDispatchedListener)

  public fun removeBatchEventDispatchedListener(listener: BatchEventDispatchedListener)

  @Deprecated("Private API, should only be used when the concrete implementation is known.")
  public fun onCatalystInstanceDestroyed()
}
