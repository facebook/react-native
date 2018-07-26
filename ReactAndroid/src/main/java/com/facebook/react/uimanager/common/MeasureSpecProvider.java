// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager.common;

import android.view.View;

/**
 * Interface for a {@link View} subclass that provides the width and height measure specs from its
 * measure pass. This is currently used to re-measure the root view by reusing the specs for yoga
 * layout calculations.
 */
public interface MeasureSpecProvider {

  int getWidthMeasureSpec();

  int getHeightMeasureSpec();
}
