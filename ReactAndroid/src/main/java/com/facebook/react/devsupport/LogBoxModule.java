/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = LogBoxModule.NAME)
public class LogBoxModule extends ReactContextBaseJavaModule {

  public static final String NAME = "LogBox";

  private final DevSupportManager mDevSupportManager;
  private @Nullable View mReactRootView;
  private @Nullable LogBoxDialog mLogBoxDialog;

  public LogBoxModule(ReactApplicationContext reactContext, DevSupportManager devSupportManager) {
    super(reactContext);

    mDevSupportManager = devSupportManager;
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (mReactRootView == null) {
              mReactRootView = mDevSupportManager.createRootView("LogBox");
              if (mReactRootView == null) {
                FLog.e(
                    ReactConstants.TAG,
                    "Unable to launch logbox because react was unable to create the root view");
              }
            }
          }
        });
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void show() {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (mLogBoxDialog == null) {
              Activity context = getCurrentActivity();
              if (context == null || context.isFinishing()) {
                FLog.e(
                    ReactConstants.TAG,
                    "Unable to launch logbox because react activity "
                        + "is not available, here is the error that logbox would've displayed: ");
                return;
              }
              mLogBoxDialog = new LogBoxDialog(context, mReactRootView);
              mLogBoxDialog.setCancelable(false);
              mLogBoxDialog.show();
            }
          }
        });
  }

  @ReactMethod
  public void hide() {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (mLogBoxDialog != null) {
              if (mReactRootView.getParent() != null) {
                ((ViewGroup) mReactRootView.getParent()).removeView(mReactRootView);
              }
              mLogBoxDialog.dismiss();
              mLogBoxDialog = null;
            }
          }
        });
  }

  @Override
  public void onCatalystInstanceDestroy() {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (mReactRootView != null) {
              mDevSupportManager.destroyRootView(mReactRootView);
              mReactRootView = null;
            }
          }
        });
  }
}
