// Copyright 2004-present Facebook. All Rights Reserved.

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
