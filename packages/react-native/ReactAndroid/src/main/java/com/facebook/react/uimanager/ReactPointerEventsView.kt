/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/**
 * This interface should be implemented be native [View] subclasses that support pointer events
 * handling. It is used to find the target View of a touch event.
 */
public interface ReactPointerEventsView {

  /** The PointerEvents of the View. */
  public val pointerEvents: PointerEvents
}
