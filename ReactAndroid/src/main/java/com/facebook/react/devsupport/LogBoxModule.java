/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.NativeLogBoxSpec;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.SurfaceDelegate;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = NativeLogBoxSpec.NAME)
public class LogBoxModule extends NativeLogBoxSpec {

  public static final String NAME = "LogBox";

  private final DevSupportManager mDevSupportManager;
  private final SurfaceDelegate mSurfaceDelegate;

  /**
   * LogBoxModule can be rendered in different surface. By default, it will use LogBoxDialog to wrap
   * the content of logs. In other platform (for example VR), a surfaceDelegate can be provided so
   * that the content can be wrapped in custom surface.
   */
  public LogBoxModule(ReactApplicationContext reactContext, DevSupportManager devSupportManager) {
    super(reactContext);

    mDevSupportManager = devSupportManager;

    @Nullable SurfaceDelegate surfaceDelegate = devSupportManager.createSurfaceDelegate(NAME);
    if (surfaceDelegate != null) {
      mSurfaceDelegate = surfaceDelegate;
    } else {
      mSurfaceDelegate = new LogBoxDialogSurfaceDelegate(devSupportManager);
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mSurfaceDelegate.createContentView("LogBox");
          }
        });
  }

  @Override
  public void show() {
    if (!mSurfaceDelegate.isContentViewReady()) {
      return;
    }

    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mSurfaceDelegate.show();
          }
        });
  }

  @Override
  public void hide() {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mSurfaceDelegate.hide();
          }
        });
  }

  @Override
  public void invalidate() {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mSurfaceDelegate.destroyContentView();
          }
        });
  }
}
