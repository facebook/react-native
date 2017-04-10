// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager.util;

import javax.annotation.Nullable;

import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.R;

/**
 * Finds views in React Native view hierarchies
 */
public class ReactFindViewUtil {

  /**
   * Finds a view that is tagged with {@param nativeId} as its `nativeID` prop
   */
  public static @Nullable View findViewByNativeId(View view, String nativeId) {
    Object tag = view.getTag(R.id.view_tag_native_id);
    if (tag instanceof String && tag.equals(nativeId)) {
      return view;
    }

    if (view instanceof ViewGroup) {
      ViewGroup viewGroup = (ViewGroup) view;
      for (int i = 0; i < viewGroup.getChildCount(); i++) {
        View v = findViewByNativeId(viewGroup.getChildAt(i), nativeId);
        if (v != null) {
          return v;
        }
      }
    }

    return null;
  }
}
