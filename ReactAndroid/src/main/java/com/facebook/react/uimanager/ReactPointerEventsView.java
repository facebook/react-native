/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;

/**
 * This interface should be implemented be native {@link View} subclasses that support pointer
 * events handling. It is used to find the target View of a touch event.
 */
public interface ReactPointerEventsView {

  /** Return the PointerEvents of the View. */
  PointerEvents getPointerEvents();
}
