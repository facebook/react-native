/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityEvent;
import androidx.core.view.AccessibilityDelegateCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.R;
import com.facebook.react.bridge.AssertionException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;

@Nullsafe(Nullsafe.Mode.LOCAL)
class ReactScrollViewAccessibilityDelegate extends AccessibilityDelegateCompat {
  private final String TAG = ReactScrollViewAccessibilityDelegate.class.getSimpleName();

  @Override
  public void onInitializeAccessibilityEvent(View host, AccessibilityEvent event) {
    super.onInitializeAccessibilityEvent(host, event);
    if (host instanceof ReactScrollView || host instanceof ReactHorizontalScrollView) {
      onInitializeAccessibilityEventInternal(host, event);
    } else {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new AssertionException(
              "ReactScrollViewAccessibilityDelegate should only be used with ReactScrollView or"
                  + " ReactHorizontalScrollView, not with class: "
                  + host.getClass().getSimpleName()));
    }
  }

  @Override
  public void onInitializeAccessibilityNodeInfo(View host, AccessibilityNodeInfoCompat info) {
    super.onInitializeAccessibilityNodeInfo(host, info);
    if (host instanceof ReactScrollView || host instanceof ReactHorizontalScrollView) {
      onInitializeAccessibilityNodeInfoInternal(host, info);
    } else {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new AssertionException(
              "ReactScrollViewAccessibilityDelegate should only be used with ReactScrollView or"
                  + " ReactHorizontalScrollView, not with class: "
                  + host.getClass().getSimpleName()));
    }
  }
  ;

  private void onInitializeAccessibilityEventInternal(View view, AccessibilityEvent event) {
    final ReadableMap accessibilityCollection =
        (ReadableMap) view.getTag(R.id.accessibility_collection);

    if (accessibilityCollection != null) {
      event.setItemCount(accessibilityCollection.getInt("itemCount"));
      View contentView;
      if (view instanceof ViewGroup) {
        ViewGroup viewGroup = (ViewGroup) view;
        contentView = viewGroup.getChildAt(0);
      } else {
        return;
      }
      Integer firstVisibleIndex = null;
      Integer lastVisibleIndex = null;

      if (!(contentView instanceof ViewGroup)) {
        return;
      }

      for (int index = 0; index < ((ViewGroup) contentView).getChildCount(); index++) {
        View nextChild = ((ViewGroup) contentView).getChildAt(index);
        boolean isVisible;
        if (view instanceof ReactScrollView) {
          ReactScrollView scrollView = (ReactScrollView) view;
          isVisible = scrollView.isPartiallyScrolledInView(nextChild);
        } else if (view instanceof ReactHorizontalScrollView) {
          ReactHorizontalScrollView scrollView = (ReactHorizontalScrollView) view;
          isVisible = scrollView.isPartiallyScrolledInView(nextChild);
        } else {
          return;
        }
        ReadableMap accessibilityCollectionItem =
            (ReadableMap) nextChild.getTag(R.id.accessibility_collection_item);

        if (!(nextChild instanceof ViewGroup)) {
          return;
        }

        int childCount = ((ViewGroup) nextChild).getChildCount();

        // If this child's accessibilityCollectionItem is null, we'll check one more
        // nested child.
        // Happens when getItemLayout is not passed in FlatList which adds an additional
        // View in the hierarchy.
        if (childCount > 0 && accessibilityCollectionItem == null) {
          View nestedNextChild = ((ViewGroup) nextChild).getChildAt(0);
          if (nestedNextChild != null) {
            ReadableMap nestedChildAccessibility =
                (ReadableMap) nestedNextChild.getTag(R.id.accessibility_collection_item);
            if (nestedChildAccessibility != null) {
              accessibilityCollectionItem = nestedChildAccessibility;
            }
          }
        }

        if (isVisible && accessibilityCollectionItem != null) {
          if (firstVisibleIndex == null) {
            firstVisibleIndex = accessibilityCollectionItem.getInt("itemIndex");
          }
          lastVisibleIndex = accessibilityCollectionItem.getInt("itemIndex");
        }

        if (firstVisibleIndex != null && lastVisibleIndex != null) {
          event.setFromIndex(firstVisibleIndex);
          event.setToIndex(lastVisibleIndex);
        }
      }
    }
  }

  private void onInitializeAccessibilityNodeInfoInternal(
      View view, AccessibilityNodeInfoCompat info) {

    final AccessibilityRole accessibilityRole = AccessibilityRole.fromViewTag(view);

    if (accessibilityRole != null) {
      ReactAccessibilityDelegate.setRole(info, accessibilityRole, view.getContext());
    }

    final ReadableMap accessibilityCollection =
        (ReadableMap) view.getTag(R.id.accessibility_collection);

    if (accessibilityCollection != null) {
      int rowCount = accessibilityCollection.getInt("rowCount");
      int columnCount = accessibilityCollection.getInt("columnCount");
      boolean hierarchical = accessibilityCollection.getBoolean("hierarchical");

      AccessibilityNodeInfoCompat.CollectionInfoCompat collectionInfoCompat =
          AccessibilityNodeInfoCompat.CollectionInfoCompat.obtain(
              rowCount, columnCount, hierarchical);
      info.setCollectionInfo(collectionInfoCompat);
    }

    if (view instanceof ReactScrollView) {
      ReactScrollView scrollView = (ReactScrollView) view;
      info.setScrollable(scrollView.getScrollEnabled());
    } else if (view instanceof ReactHorizontalScrollView) {
      ReactHorizontalScrollView scrollView = (ReactHorizontalScrollView) view;
      info.setScrollable(scrollView.getScrollEnabled());
    }
  }
}
;
