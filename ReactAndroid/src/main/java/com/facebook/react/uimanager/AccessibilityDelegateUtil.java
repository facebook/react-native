// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager;

import android.content.Context;
import android.support.v4.view.AccessibilityDelegateCompat;
import android.support.v4.view.ViewCompat;
import android.support.v4.view.accessibility.AccessibilityNodeInfoCompat;
import android.support.v4.view.accessibility.AccessibilityNodeInfoCompat.CollectionItemInfoCompat;
import android.text.SpannableString;
import android.text.style.URLSpan;
import android.view.View;
import com.facebook.react.R;
import java.util.Locale;
import javax.annotation.Nullable;

/**
 * Utility class that handles the addition of a "role" for accessibility to either a View or
 * AccessibilityNodeInfo.
 */

public class AccessibilityDelegateUtil {

  /**
   * These roles are defined by Google's TalkBack screen reader, and this list should be kept up to
   * date with their implementation. Details can be seen in their source code here:
   *
   * <p>https://github.com/google/talkback/blob/master/utils/src/main/java/Role.java
   */

  public enum AccessibilityRole {
    NONE,
    BUTTON,
    LINK,
    SEARCH,
    IMAGE,
    IMAGEBUTTON,
    KEYBOARDKEY,
    TEXT,
    ADJUSTABLE,
    SUMMARY,
    HEADER;

    public static String getValue(AccessibilityRole role) {
      switch (role) {
        case NONE:
          return null;
        case BUTTON:
          return "android.widget.Button";
        case LINK:
          return "android.widget.ViewGroup";
        case SEARCH:
          return "android.widget.EditText";
        case IMAGE:
          return "android.widget.ImageView";
        case IMAGEBUTTON:
          return "android.widget.ImageView";
        case KEYBOARDKEY:
          return "android.inputmethodservice.Keyboard$Key";
        case TEXT:
          return "android.widget.ViewGroup";
        case ADJUSTABLE:
          return "android.widget.SeekBar";
        case SUMMARY:
          return "android.widget.ViewGroup";
        case HEADER:
          return "android.widget.ViewGroup";
        default:
          throw new IllegalArgumentException("Invalid accessibility role value: " + role);
      }
    }

    public static AccessibilityRole fromValue(@Nullable String value) {
      for (AccessibilityRole role : AccessibilityRole.values()) {
        if (role.name().equalsIgnoreCase(value)) {
          return role;
        }
      }
      throw new IllegalArgumentException("Invalid accessibility role value: " + value);
    }
  }

  private AccessibilityDelegateUtil() {
    // No instances
  }

  public static void setDelegate(final View view) {
    final String accessibilityHint = (String) view.getTag(R.id.accessibility_hint);
    final AccessibilityRole accessibilityRole = (AccessibilityRole) view.getTag(R.id.accessibility_role);
    // if a view already has an accessibility delegate, replacing it could cause problems,
    // so leave it alone.
    if (!ViewCompat.hasAccessibilityDelegate(view) &&
      (accessibilityHint != null || accessibilityRole != null)) {
      ViewCompat.setAccessibilityDelegate(
        view,
        new AccessibilityDelegateCompat() {
          @Override
          public void onInitializeAccessibilityNodeInfo(
            View host, AccessibilityNodeInfoCompat info) {
            super.onInitializeAccessibilityNodeInfo(host, info);
            if (!(accessibilityHint == null)) {
              String contentDescription=(String)info.getContentDescription();
              if (contentDescription != null) {
                contentDescription = contentDescription + ", " + accessibilityHint;
                info.setContentDescription(contentDescription);
              } else {
                info.setContentDescription(accessibilityHint);
              }
            }

            setRole(info, accessibilityRole, view.getContext());
          }
        });
    }
  }

  /**
   * Strings for setting the Role Description in english
   */

  //TODO: Eventually support for other languages on talkback

  public static void setRole(AccessibilityNodeInfoCompat nodeInfo, AccessibilityRole role, final Context context) {
    if (role == null) {
      role = AccessibilityRole.NONE;
    }
    nodeInfo.setClassName(AccessibilityRole.getValue(role));
    if (Locale.getDefault().getLanguage().equals(new Locale("en").getLanguage())) {
      if (role.equals(AccessibilityRole.LINK)) {
        nodeInfo.setRoleDescription(context.getString(R.string.link_description));

        if (nodeInfo.getContentDescription() != null) {
          SpannableString spannable = new SpannableString(nodeInfo.getContentDescription());
          spannable.setSpan(new URLSpan(""), 0, spannable.length(), 0);
          nodeInfo.setContentDescription(spannable);
        }

        if (nodeInfo.getText() != null) {
          SpannableString spannable = new SpannableString(nodeInfo.getText());
          spannable.setSpan(new URLSpan(""), 0, spannable.length(), 0);
          nodeInfo.setText(spannable);
        }
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
      if (role.equals(AccessibilityRole.HEADER)) {
        nodeInfo.setRoleDescription(context.getString(R.string.header_description));
        final AccessibilityNodeInfoCompat.CollectionItemInfoCompat itemInfo =
          AccessibilityNodeInfoCompat.CollectionItemInfoCompat.obtain(0, 1, 0, 1, true);
        nodeInfo.setCollectionItemInfo(itemInfo);
      }
    }
    if (role.equals(AccessibilityRole.IMAGEBUTTON)) {
      nodeInfo.setClickable(true);
    }
  }
}
