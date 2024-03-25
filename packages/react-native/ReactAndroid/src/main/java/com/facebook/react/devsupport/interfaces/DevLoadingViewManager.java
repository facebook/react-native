/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces;

import androidx.annotation.Nullable;

/** Interface to display loading messages on top of the screen. */
public interface DevLoadingViewManager {

  void showMessage(final String message);

  void updateProgress(
      final @Nullable String status, final @Nullable Integer done, final @Nullable Integer total);

  void hide();
}
