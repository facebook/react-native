/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.SurfaceDelegate;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.util.RNLog;

/**
 * The implementation of SurfaceDelegate with {@link Activity}. This is the default SurfaceDelegate
 * for Mobile.
 */
public class LogBoxDialogSurfaceDelegate implements SurfaceDelegate {

  private @Nullable View mReactRootView;
  private @Nullable LogBoxDialog mDialog;
  private final DevSupportManager mDevSupportManager;

  LogBoxDialogSurfaceDelegate(DevSupportManager devSupportManager) {
    mDevSupportManager = devSupportManager;
  }

  @Override
  public void createContentView(String appKey) {
    Assertions.assertCondition(
        appKey.equals("LogBox"), "This surface manager can only create LogBox React application");
    mReactRootView = mDevSupportManager.createRootView("LogBox");
    if (mReactRootView == null) {
      RNLog.e("Unable to launch logbox because react was unable to create the root view");
    }
  }

  @Override
  public boolean isContentViewReady() {
    return mReactRootView != null;
  }

  @Override
  public void destroyContentView() {
    if (mReactRootView != null) {
      mDevSupportManager.destroyRootView(mReactRootView);
      mReactRootView = null;
    }
  }

  @Override
  public void show() {
    if (isSurfaceVisible() || !isContentViewReady()) {
      return;
    }

    final @Nullable Activity context = mDevSupportManager.getCurrentActivity();
    if (context == null || context.isFinishing()) {
      RNLog.e(
          "Unable to launch logbox because react activity "
              + "is not available, here is the error that logbox would've displayed: ");
      return;
    }

    mDialog = new LogBoxDialog(context, mReactRootView);
    mDialog.setCancelable(false);
    mDialog.show();
  }

  @Override
  public void hide() {
    if (!isSurfaceVisible()) {
      return;
    }

    if (mReactRootView != null && mReactRootView.getParent() != null) {
      ((ViewGroup) mReactRootView.getParent()).removeView(mReactRootView);
    }

    mDialog.dismiss();
    mDialog = null;
  }

  private boolean isSurfaceVisible() {
    return mDialog != null;
  }
}
