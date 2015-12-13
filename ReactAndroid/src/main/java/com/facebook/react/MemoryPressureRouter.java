// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react;

import javax.annotation.Nullable;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.ComponentCallbacks2;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.MemoryPressure;
import com.facebook.react.bridge.ReactContext;

import static android.content.ComponentCallbacks2.TRIM_MEMORY_BACKGROUND;
import static android.content.ComponentCallbacks2.TRIM_MEMORY_MODERATE;
import static android.content.ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL;

/**
 * Translates and routes memory pressure events to the current catalyst instance.
 */
public class MemoryPressureRouter {
  // Trigger this by sending an intent to your activity with adb shell:
  // am start -a "com.facebook.catalyst.ACTION_TRIM_MEMORY" --activity-single-top -n <activity>
  private static final String ACTION_TRIM_MEMORY ="com.facebook.catalyst.ACTION_TRIM_MEMORY";

  private @Nullable CatalystInstance mCatalystInstance;
  private final ComponentCallbacks2 mCallbacks = new ComponentCallbacks2() {
    @Override
    public void onTrimMemory(int level) {
      trimMemory(level);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
    }

    @Override
    public void onLowMemory() {
    }
  };

  @TargetApi(Build.VERSION_CODES.JELLY_BEAN)
  public static boolean handleDebugIntent(Activity activity, String action) {
    switch (action) {
      case ACTION_TRIM_MEMORY:
        simulateTrimMemory(activity, TRIM_MEMORY_MODERATE);
        break;
      default:
        return false;
    }

    return true;
  }

  MemoryPressureRouter(Context context) {
    context.getApplicationContext().registerComponentCallbacks(mCallbacks);
  }

  public void onNewReactContextCreated(ReactContext reactContext) {
    mCatalystInstance = reactContext.getCatalystInstance();
  }

  public void onReactInstanceDestroyed() {
    mCatalystInstance = null;
  }

  public void destroy(Context context) {
    context.getApplicationContext().unregisterComponentCallbacks(mCallbacks);
  }

  private void trimMemory(int level) {
    if (level >= ComponentCallbacks2.TRIM_MEMORY_COMPLETE) {
      dispatchMemoryPressure(MemoryPressure.CRITICAL);
    } else if (level >= TRIM_MEMORY_BACKGROUND || level == TRIM_MEMORY_RUNNING_CRITICAL) {
      dispatchMemoryPressure(MemoryPressure.MODERATE);
    }
  }

  private void dispatchMemoryPressure(MemoryPressure level) {
    if (mCatalystInstance != null) {
      mCatalystInstance.handleMemoryPressure(level);
    }
  }

  private static void simulateTrimMemory(Activity activity, int level) {
    activity.getApplication().onTrimMemory(level);
    activity.onTrimMemory(level);
  }
}
