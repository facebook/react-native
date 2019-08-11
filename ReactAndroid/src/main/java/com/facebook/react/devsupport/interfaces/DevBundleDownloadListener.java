/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.devsupport.interfaces;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeDeltaClient;

public interface DevBundleDownloadListener {
  void onSuccess(@Nullable NativeDeltaClient nativeDeltaClient);

  void onProgress(@Nullable String status, @Nullable Integer done, @Nullable Integer total);

  void onFailure(Exception cause);
}
