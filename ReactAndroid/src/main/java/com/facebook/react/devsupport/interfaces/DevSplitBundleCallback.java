/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces;

/** Callback class for loading split JS bundles from Metro in development. */
public interface DevSplitBundleCallback {
  /** Called when the split JS bundle has been downloaded and evaluated. */
  void onSuccess();
  /** Called when the split JS bundle failed to load. */
  void onError(String url, Throwable cause);
}
