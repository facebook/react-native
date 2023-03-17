/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import androidx.annotation.Nullable;

/**
 * Interface that should be implemented by {@link View} subclasses that support {@code overflow}
 * style. This allows the overflow information to be used by {@link TouchTargetHelper} to determine
 * if a View is touchable.
 */
public interface ReactOverflowView {
  /**
   * Gets the overflow state of a view. If set, this should be one of {@link ViewProps#HIDDEN},
   * {@link ViewProps#VISIBLE} or {@link ViewProps#SCROLL}.
   */
  @Nullable
  String getOverflow();
}
