// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react;

import android.content.ComponentCallbacks2;
import android.content.Context;
import android.content.res.Configuration;
import com.facebook.react.bridge.MemoryPressureListener;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Translates and routes memory pressure events to the current catalyst instance.
 */
public class MemoryPressureRouter implements ComponentCallbacks2 {
  private final Set<MemoryPressureListener> mListeners =
    Collections.synchronizedSet(new LinkedHashSet<MemoryPressureListener>());

  MemoryPressureRouter(Context context) {
    context.getApplicationContext().registerComponentCallbacks(this);
  }

  public void destroy(Context context) {
    context.getApplicationContext().unregisterComponentCallbacks(this);
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

  @Override
  public void onTrimMemory(int level) {
    dispatchMemoryPressure(level);
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
  }

  @Override
  public void onLowMemory() {
  }

  private void dispatchMemoryPressure(int level) {
    // copy listeners array to avoid ConcurrentModificationException if any of the listeners remove
    // themselves in handleMemoryPressure()
    MemoryPressureListener[] listeners =
      mListeners.toArray(new MemoryPressureListener[mListeners.size()]);
    for (MemoryPressureListener listener : listeners) {
      listener.handleMemoryPressure(level);
    }
  }
}
