/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.devloading;

import android.util.Log;
import com.facebook.fbreact.specs.NativeDevLoadingViewSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.module.annotations.ReactModule;

/** {@link NativeModule} that allows JS to show dev loading view. */
@ReactModule(name = NativeDevLoadingViewSpec.NAME)
public class DevLoadingModule extends NativeDevLoadingViewSpec {

  public DevLoadingModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public void showMessage(final String message, final Double color, final Double backgroundColor) {

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            Log.w(NAME, "Showing Message in DevLoadingModule java.");
          }
        });
  }

  @Override
  public void hide() {

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            Log.w(NAME, "Hiding Message in DevLoadingModule java.");
          }
        });
  }
}
