// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

import android.annotation.TargetApi;
import android.app.Application;
import android.content.ComponentCallbacks2;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;

import com.facebook.react.bridge.MemoryPressure;
import com.facebook.react.bridge.MemoryPressureListener;

import static android.content.ComponentCallbacks2.TRIM_MEMORY_BACKGROUND;
import static android.content.ComponentCallbacks2.TRIM_MEMORY_COMPLETE;
import static android.content.ComponentCallbacks2.TRIM_MEMORY_MODERATE;
import static android.content.ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL;

/**
 * Translates and routes memory pressure events to the current catalyst instance.
 */
public class MemoryPressureRouter {
  // Trigger this by sending an intent to your activity with adb shell:
  // am broadcast -a com.facebook.catalyst.ACTION_TRIM_MEMORY_MODERATE
  private static final String ACTION_TRIM_MEMORY_MODERATE =
    "com.facebook.rnfeed.ACTION_TRIM_MEMORY_MODERATE";
  private static final String ACTION_TRIM_MEMORY_CRITICAL =
    "com.facebook.rnfeed.ACTION_TRIM_MEMORY_CRITICAL";

  private final Set<MemoryPressureListener> mListeners =
    Collections.synchronizedSet(new LinkedHashSet<MemoryPressureListener>());
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
  public static boolean handleDebugIntent(Application application, String action) {
    switch (action) {
      case ACTION_TRIM_MEMORY_MODERATE:
        simulateTrimMemory(application, TRIM_MEMORY_MODERATE);
        break;
      case ACTION_TRIM_MEMORY_CRITICAL:
        simulateTrimMemory(application, TRIM_MEMORY_COMPLETE);
      default:
        return false;
    }

    return true;
  }

  MemoryPressureRouter(Context context) {
    context.getApplicationContext().registerComponentCallbacks(mCallbacks);
  }

  /**
   * Add a listener to be notified of memory pressure events.
   */
  public void addMemoryPressureListener(MemoryPressureListener listener) {
    mListeners.add(listener);
  }

  /**
   * Remove a listener previously added with {@link #addMemoryPressureListener}.
   */
  public void removeMemoryPressureListener(MemoryPressureListener listener) {
    mListeners.remove(listener);
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
    // copy listeners array to avoid ConcurrentModificationException if any of the listeners remove
    // themselves in handleMemoryPressure()
    MemoryPressureListener[] listeners =
      mListeners.toArray(new MemoryPressureListener[mListeners.size()]);
    for (MemoryPressureListener listener : listeners) {
      listener.handleMemoryPressure(level);
    }
  }

  private static void simulateTrimMemory(Application application, int level) {
    application.onTrimMemory(level);
  }
}
