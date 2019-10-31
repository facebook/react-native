// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager.util;

import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.R;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Finds views in React Native view hierarchies */
public class ReactFindViewUtil {

  private static final List<OnViewFoundListener> mOnViewFoundListeners = new ArrayList<>();
  private static final Map<OnMultipleViewsFoundListener, Set<String>>
      mOnMultipleViewsFoundListener = new HashMap<>();

  /** Callback to be invoked when a react native view has been found */
  public interface OnViewFoundListener {

    /** Returns the native id of the view of interest */
    String getNativeId();

    /**
     * Called when the view has been found
     *
     * @param view
     */
    void onViewFound(View view);
  }

  /** Callback to be invoked when all react native views with geiven NativeIds have been found */
  public interface OnMultipleViewsFoundListener {

    void onViewFound(View view, String nativeId);
    /**
     * Called when all teh views have been found
     *
     * @param map
     */
  }

  /**
   * Finds a view that is tagged with {@param nativeId} as its nativeID prop under the {@param root}
   * view hierarchy. Returns the view if found, null otherwise.
   *
   * @param root root of the view hierarchy from which to find the view
   */
  public static @Nullable View findView(View root, String nativeId) {
    String tag = getNativeId(root);
    if (tag != null && tag.equals(nativeId)) {
      return root;
    }

    if (root instanceof ViewGroup) {
      ViewGroup viewGroup = (ViewGroup) root;
      for (int i = 0; i < viewGroup.getChildCount(); i++) {
        View view = findView(viewGroup.getChildAt(i), nativeId);
        if (view != null) {
          return view;
        }
      }
    }

    return null;
  }

  /**
   * Finds a view tagged with {@param onViewFoundListener}'s nativeID in the given {@param root}
   * view hierarchy. If the view does not exist yet due to React Native's async layout, a listener
   * will be added. When the view is found, the {@param onViewFoundListener} will be invoked.
   *
   * @param root root of the view hierarchy from which to find the view
   */
  public static void findView(View root, OnViewFoundListener onViewFoundListener) {
    View view = findView(root, onViewFoundListener.getNativeId());
    if (view != null) {
      onViewFoundListener.onViewFound(view);
    }
    addViewListener(onViewFoundListener);
  }

  /**
   * Registers an OnViewFoundListener to be invoked when a view with a matching nativeID is found.
   * Remove this listener using removeViewListener() if it's no longer needed.
   */
  public static void addViewListener(OnViewFoundListener onViewFoundListener) {
    mOnViewFoundListeners.add(onViewFoundListener);
  }

  /** Removes an OnViewFoundListener previously registered with addViewListener(). */
  public static void removeViewListener(OnViewFoundListener onViewFoundListener) {
    mOnViewFoundListeners.remove(onViewFoundListener);
  }

  public static void addViewsListener(OnMultipleViewsFoundListener listener, Set<String> ids) {
    mOnMultipleViewsFoundListener.put(listener, ids);
  }

  public static void removeViewsListener(OnMultipleViewsFoundListener listener) {
    mOnMultipleViewsFoundListener.remove(listener);
  }

  /** Invokes any listeners that are listening on this {@param view}'s native id */
  public static void notifyViewRendered(View view) {
    String nativeId = getNativeId(view);
    if (nativeId == null) {
      return;
    }
    Iterator<OnViewFoundListener> iterator = mOnViewFoundListeners.iterator();
    while (iterator.hasNext()) {
      OnViewFoundListener listener = iterator.next();
      if (nativeId != null && nativeId.equals(listener.getNativeId())) {
        listener.onViewFound(view);
        iterator.remove();
      }
    }

    for (Map.Entry<OnMultipleViewsFoundListener, Set<String>> entry :
        mOnMultipleViewsFoundListener.entrySet()) {
      Set<String> nativeIds = entry.getValue();
      if (nativeIds != null && nativeIds.contains(nativeId)) {
        entry.getKey().onViewFound(view, nativeId);
      }
    }
  }

  private static @Nullable String getNativeId(View view) {
    Object tag = view.getTag(R.id.reactandroid_view_tag_native_id);
    return tag instanceof String ? (String) tag : null;
  }
}
