/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.devsupport.interfaces;

import com.facebook.react.bridge.NativeDeltaClient;
import com.facebook.react.devsupport.DevBundlesContainer;

import javax.annotation.Nullable;

public interface DevBundleDownloadListener {
  void onSuccess(String sourceURL, DevBundlesContainer bundlesContainer, @Nullable NativeDeltaClient nativeDeltaClient);
  void onProgress(@Nullable String status, @Nullable Integer done, @Nullable Integer total);

  void onFailure(Exception cause);
}
