/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p/>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.statusbar;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.support.v4.view.ViewCompat;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;

import java.util.Map;

import javax.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;

/**
 * {@link NativeModule} that allows changing the appearance of the status bar.
 */
@ReactModule(name = "StatusBarManager")
public class StatusBarModule extends ReactContextBaseJavaModule {

  private static final String ERROR_NO_ACTIVITY = "E_NO_ACTIVITY";
  private static final String ERROR_NO_ACTIVITY_MESSAGE =
    "Tried to change the status bar while not attached to an Activity";

  private static final String HEIGHT_KEY = "HEIGHT";

  public StatusBarModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "StatusBarManager";
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    final Context context = getReactApplicationContext();
    final int heightResId = context.getResources()
      .getIdentifier("status_bar_height", "dimen", "android");
    final float height = heightResId > 0 ?
      PixelUtil.toDIPFromPixel(context.getResources().getDimensionPixelSize(heightResId)) :
      0;

    return MapBuilder.<String, Object>of(
      HEIGHT_KEY, height);
  }

  @ReactMethod
  public void setColor(final int color, final boolean animated, final Promise res) {
    final Activity activity = getCurrentActivity();
    if (activity == null) {
      res.reject(ERROR_NO_ACTIVITY, ERROR_NO_ACTIVITY_MESSAGE);
      return;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      UiThreadUtil.runOnUiThread(
        new Runnable() {
          @TargetApi(Build.VERSION_CODES.LOLLIPOP)
          @Override
          public void run() {
            if (animated) {
              int curColor = activity.getWindow().getStatusBarColor();
              ValueAnimator colorAnimation = ValueAnimator.ofObject(
                new ArgbEvaluator(), curColor, color);

              colorAnimation.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
                @Override
                public void onAnimationUpdate(ValueAnimator animator) {
                  activity.getWindow().setStatusBarColor((Integer) animator.getAnimatedValue());
                }
              });
              colorAnimation
                .setDuration(300)
                .setStartDelay(0);
              colorAnimation.start();
            } else {
              activity.getWindow().setStatusBarColor(color);
            }
            res.resolve(null);
          }
        });
    } else {
      res.resolve(null);
    }
  }

  @ReactMethod
  public void setTranslucent(final boolean translucent, final Promise res) {
    final Activity activity = getCurrentActivity();
    if (activity == null) {
      res.reject(ERROR_NO_ACTIVITY, ERROR_NO_ACTIVITY_MESSAGE);
      return;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      UiThreadUtil.runOnUiThread(
        new Runnable() {
          @TargetApi(Build.VERSION_CODES.LOLLIPOP)
          @Override
          public void run() {
            // If the status bar is translucent hook into the window insets calculations
            // and consume all the top insets so no padding will be added under the status bar.
            View decorView = activity.getWindow().getDecorView();
            if (translucent) {
              decorView.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override
                public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                  WindowInsets defaultInsets = v.onApplyWindowInsets(insets);
                  return defaultInsets.replaceSystemWindowInsets(
                    defaultInsets.getSystemWindowInsetLeft(),
                    0,
                    defaultInsets.getSystemWindowInsetRight(),
                    defaultInsets.getSystemWindowInsetBottom());
                }
              });
            } else {
              decorView.setOnApplyWindowInsetsListener(null);
            }

            ViewCompat.requestApplyInsets(decorView);
            res.resolve(null);
          }
        });
    }
  }

  @ReactMethod
  public void setHidden(final boolean hidden, final Promise res) {
    final Activity activity = getCurrentActivity();
    if (activity == null) {
      res.reject(ERROR_NO_ACTIVITY, ERROR_NO_ACTIVITY_MESSAGE);
      return;
    }
    UiThreadUtil.runOnUiThread(
      new Runnable() {
        @Override
        public void run() {
          if (hidden) {
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
          } else {
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
          }

          res.resolve(null);
        }
      });
  }
}
