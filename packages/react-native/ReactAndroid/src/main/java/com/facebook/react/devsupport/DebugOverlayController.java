/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.provider.Settings;
import android.view.WindowManager;
import android.widget.FrameLayout;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.ReactConstants;

/**
 * Helper class for controlling overlay view with FPS and JS FPS info that gets added directly
 * to @{link WindowManager} instance.
 */
/* package */ class DebugOverlayController {

  public static void requestPermission(Context context) {
    // Get permission to show debug overlay in dev builds.
    if (!Settings.canDrawOverlays(context)) {
      Intent intent =
          new Intent(
              Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
              Uri.parse("package:" + context.getPackageName()));
      intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      FLog.w(
          ReactConstants.TAG,
          "Overlay permissions needs to be granted in order for react native apps to run in dev mode");
      if (canHandleIntent(context, intent)) {
        context.startActivity(intent);
      }
    }
  }

  private static boolean permissionCheck(Context context) {
    // Get permission to show debug overlay in dev builds.
    // overlay permission not yet granted
    return Settings.canDrawOverlays(context);
  }

  private static boolean hasPermission(Context context, String permission) {
    try {
      PackageInfo info =
          context
              .getPackageManager()
              .getPackageInfo(context.getPackageName(), PackageManager.GET_PERMISSIONS);
      if (info.requestedPermissions != null) {
        for (String p : info.requestedPermissions) {
          if (p.equals(permission)) {
            return true;
          }
        }
      }
    } catch (PackageManager.NameNotFoundException e) {
      FLog.e(ReactConstants.TAG, "Error while retrieving package info", e);
    }
    return false;
  }

  private static boolean canHandleIntent(Context context, Intent intent) {
    PackageManager packageManager = context.getPackageManager();
    return intent.resolveActivity(packageManager) != null;
  }

  private final WindowManager mWindowManager;
  private final ReactContext mReactContext;

  private @Nullable FrameLayout mFPSDebugViewContainer;

  public DebugOverlayController(ReactContext reactContext) {
    mReactContext = reactContext;
    mWindowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
  }

  public void setFpsDebugViewVisible(final boolean fpsDebugViewVisible) {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            if (fpsDebugViewVisible && mFPSDebugViewContainer == null) {
              if (!permissionCheck(mReactContext)) {
                FLog.d(ReactConstants.TAG, "Wait for overlay permission to be set");
                return;
              }
              mFPSDebugViewContainer = new FpsView(mReactContext);
              WindowManager.LayoutParams params =
                  new WindowManager.LayoutParams(
                      WindowManager.LayoutParams.MATCH_PARENT,
                      WindowManager.LayoutParams.MATCH_PARENT,
                      WindowOverlayCompat.TYPE_SYSTEM_OVERLAY,
                      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                          | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                      PixelFormat.TRANSLUCENT);
              mWindowManager.addView(mFPSDebugViewContainer, params);
            } else if (!fpsDebugViewVisible && mFPSDebugViewContainer != null) {
              mFPSDebugViewContainer.removeAllViews();
              mWindowManager.removeView(mFPSDebugViewContainer);
              mFPSDebugViewContainer = null;
            }
          }
        });
  }
}
