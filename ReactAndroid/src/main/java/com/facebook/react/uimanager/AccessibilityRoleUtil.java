// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.support.v4.view.AccessibilityDelegateCompat;
import android.support.v4.view.ViewCompat;
import android.support.v4.view.accessibility.AccessibilityNodeInfoCompat;
import android.view.View;
import android.view.accessibility.AccessibilityNodeInfo;
import com.facebook.react.R;
import com.facebook.react.bridge.ReadableArray;
import java.util.Locale;
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
    LINK("android.widget.ViewGroup"),
    SEARCH("android.widget.EditText"),
    IMAGE("android.widget.ImageView"),
    IMAGEBUTTON("android.widget.ImageView"),
    KEYBOARDKEY("android.inputmethodservice.Keyboard$Key"),
    TEXT("android.widget.ViewGroup"),
    ADJUSTABLE("android.widget.SeekBar");

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

  public static void setRole(final View view, final AccessibilityRole role) {
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
            setRole(info, role, view.getContext());
          }
        });
    }
  }

  /**
   * Strings for setting the Role Description in english
   */

  //TODO: Eventually support fot other languages on talkback

  public static void setRole(AccessibilityNodeInfoCompat nodeInfo, final AccessibilityRole role, final Context context) {
    nodeInfo.setClassName(role.getValue());
    if (Locale.getDefault().getLanguage().equals(new Locale("en").getLanguage())) {
      if (role.equals(AccessibilityRole.LINK)) {
        nodeInfo.setRoleDescription(context.getString(R.string.link_description));
      }
      if (role.equals(AccessibilityRole.SEARCH)) {
        nodeInfo.setRoleDescription(context.getString(R.string.search_description));
      }
      if (role.equals(AccessibilityRole.IMAGE)) {
        nodeInfo.setRoleDescription(context.getString(R.string.image_description));
      }
      if (role.equals(AccessibilityRole.IMAGEBUTTON)) {
        nodeInfo.setRoleDescription(context.getString(R.string.image_button_description));
      }
      if (role.equals(AccessibilityRole.ADJUSTABLE)) {
        nodeInfo.setRoleDescription(context.getString(R.string.adjustable_description));
      }
    }
    if (role.equals(AccessibilityRole.IMAGEBUTTON)) {
      nodeInfo.setClickable(true);
    }
  }

  /**
   * Method for setting accessibilityRole on view properties.
   */
  public static void updateAccessibilityRole(View view, String role) {
    if (role == null) {
      view.setAccessibilityDelegate(null);
    }
    try {
      setRole(view, AccessibilityRole.valueOf(role.toUpperCase()));
    } catch (NullPointerException e) {
      view.setAccessibilityDelegate(null);
    } catch (IllegalArgumentException e) {
      view.setAccessibilityDelegate(null);
    }
  }
}
