/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces;

import androidx.annotation.Nullable;

public interface DevBundleDownloadListener {
  void onSuccess();

  void onProgress(@Nullable String status, @Nullable Integer done, @Nullable Integer total);

  void onFailure(Exception cause);
}
