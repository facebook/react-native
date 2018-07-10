// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager;

import android.annotation.TargetApi;
import android.os.Build;
import android.support.v4.view.AccessibilityDelegateCompat;
import android.support.v4.view.ViewCompat;
import android.support.v4.view.accessibility.AccessibilityNodeInfoCompat;
import android.view.View;
import android.view.accessibility.AccessibilityNodeInfo;
import javax.annotation.Nullable;

/**
 * Utility class that handles the addition of a "role" for accessibility to either a View or
 * AccessibilityNodeInfo.
 */

public class AccessibilityRoleUtil {

  /**
   * These roles are defined by Google's TalkBack screen reader, and this list should be kept up to
   * date with their implementation. Details can be seen in their source code here:
   *
   * <p>https://github.com/google/talkback/blob/master/utils/src/main/java/Role.java
   */

  public enum AccessibilityRole {
    NONE(null),
    BUTTON("android.widget.Button"),
    IMAGE("android.widget.ImageView"),
    KEYBOARD_KEY("android.inputmethodservice.Keyboard$Key"),
    TEXT("android.widget.ViewGroup"),
    TAB_BAR("android.widget.TabWidget");

    @Nullable private final String mValue;

    AccessibilityRole(String type) {
      mValue = type;
    }

    @Nullable
    public String getValue() {
      return mValue;
    }

    public static AccessibilityRole fromValue(String value) {
      for (AccessibilityRole role : AccessibilityRole.values()) {
        if (role.getValue() != null && role.getValue().equals(value)) {
          return role;
        }
      }
      return AccessibilityRole.NONE;
    }
  }

  private AccessibilityRoleUtil() {
    // No instances
  }

  public static void setRole(View view, final AccessibilityRole role) {
    // if a view already has an accessibility delegate, replacing it could cause problems,
    // so leave it alone.
    if (!ViewCompat.hasAccessibilityDelegate(view)) {
      ViewCompat.setAccessibilityDelegate(
        view,
        new AccessibilityDelegateCompat() {
          @Override
          public void onInitializeAccessibilityNodeInfo(
            View host, AccessibilityNodeInfoCompat info) {
            super.onInitializeAccessibilityNodeInfo(host, info);
            setRole(info, role);
          }
        });
    }
  }

  public static void setRole(AccessibilityNodeInfoCompat nodeInfo, final AccessibilityRole role) {
    nodeInfo.setClassName(role.getValue());
  }

  /**
   * Variables and methods for setting accessibilityRole on view properties.
   */
  private static final String NONE = "none";
  private static final String BUTTON = "button";
  private static final String IMAGE = "image";
  private static final String KEYBOARDKEY = "keyboardkey";
  private static final String TEXT = "text";
  private static final String TABBAR = "tabbar";

  public static void updateAccessibilityRole(View view, String role) {
    if (role == null) {
      view.setAccessibilityDelegate(null);
    }
    switch (role) {
      case NONE:
        break;
      case BUTTON:
        setRole(view, AccessibilityRoleUtil.AccessibilityRole.BUTTON);
        break;
      case IMAGE:
        setRole(view, AccessibilityRoleUtil.AccessibilityRole.IMAGE);
        break;
      case KEYBOARDKEY:
        setRole(view, AccessibilityRoleUtil.AccessibilityRole.KEYBOARD_KEY);
        break;
      case TEXT:
        setRole(view, AccessibilityRoleUtil.AccessibilityRole.TEXT);
        break;
      case TABBAR:
        setRole(view, AccessibilityRoleUtil.AccessibilityRole.TAB_BAR);
        break;
      default:
        view.setAccessibilityDelegate(null);
    }
  }
}
