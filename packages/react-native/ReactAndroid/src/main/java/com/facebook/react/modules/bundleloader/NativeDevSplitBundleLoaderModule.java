/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.bundleloader;

import com.facebook.fbreact.specs.NativeDevSplitBundleLoaderSpec;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.DebugServerException;
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = NativeDevSplitBundleLoaderSpec.NAME)
public class NativeDevSplitBundleLoaderModule extends NativeDevSplitBundleLoaderSpec {
  private static final String REJECTION_CODE = "E_BUNDLE_LOAD_ERROR";

  private final DevSupportManager mDevSupportManager;

  public NativeDevSplitBundleLoaderModule(
      ReactApplicationContext reactContext, DevSupportManager devSupportManager) {
    super(reactContext);
    mDevSupportManager = devSupportManager;
  }

  @Override
  public void loadBundle(String bundlePath, final Promise promise) {
    mDevSupportManager.loadSplitBundleFromServer(
        bundlePath,
        new DevSplitBundleCallback() {
          @Override
          public void onSuccess() {
            promise.resolve(true);
          }

          @Override
          public void onError(String url, Throwable cause) {
            String message =
                cause instanceof DebugServerException
                    ? ((DebugServerException) cause).getOriginalMessage()
                    : "Unknown error fetching '" + url + "'.";
            promise.reject(REJECTION_CODE, message, cause);
          }
        });
  }
}
