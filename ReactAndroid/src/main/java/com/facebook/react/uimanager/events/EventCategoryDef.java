/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import static com.facebook.react.uimanager.events.EventCategoryDef.CONTINUOUS;
import static com.facebook.react.uimanager.events.EventCategoryDef.CONTINUOUS_END;
import static com.facebook.react.uimanager.events.EventCategoryDef.CONTINUOUS_START;
import static com.facebook.react.uimanager.events.EventCategoryDef.DISCRETE;
import static com.facebook.react.uimanager.events.EventCategoryDef.UNSPECIFIED;

import androidx.annotation.IntDef;

/**
 * Java specific declaration of the `RawEvent::Category` enum. Keep in sync with
 * `renderer/core/RawEvent.h`.
 */
@IntDef(value = {CONTINUOUS_START, CONTINUOUS_END, UNSPECIFIED, DISCRETE, CONTINUOUS})
public @interface EventCategoryDef {
  /** Start of a continuous event. To be used with touchStart. */
  int CONTINUOUS_START = 0;

  /** End of a continuous event. To be used with touchEnd. */
  int CONTINUOUS_END = 1;

  /**
   * Priority for this event will be determined from other events in the queue. If it is triggered
   * by continuous event, its priority will be default. If it is not triggered by continuous event,
   * its priority will be discrete.
   */
  int UNSPECIFIED = 2;

  /** Forces discrete type for the event. Regardless if continuous event is ongoing. */
  int DISCRETE = 3;

  /** Forces continuous type for the event. Regardless if continuous event isn't ongoing. */
  int CONTINUOUS = 4;
}
