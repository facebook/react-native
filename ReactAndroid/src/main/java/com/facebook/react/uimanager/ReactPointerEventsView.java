/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.view.View;

/**
 * This interface should be implemented be native {@link View} subclasses that support pointer
 * events handling. It is used to find the target View of a touch event.
 */
public interface ReactPointerEventsView {

  /**
   * Return the PointerEvents of the View.
   */
  PointerEvents getPointerEvents();
}
