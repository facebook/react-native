/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.view.View;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Button;
import android.widget.RadioButton;

/**
 * Helper class containing logic for setting accessibility View properties.
 */
/* package */ class AccessibilityHelper {

  private static final String BUTTON = "button";
  private static final String RADIOBUTTON_CHECKED = "radiobutton_checked";
  private static final String RADIOBUTTON_UNCHECKED = "radiobutton_unchecked";

  private static final View.AccessibilityDelegate BUTTON_DELEGATE =
      new View.AccessibilityDelegate() {
        @Override
        public void onInitializeAccessibilityEvent(View host, AccessibilityEvent event) {
          super.onInitializeAccessibilityEvent(host, event);
          event.setClassName(Button.class.getName());
        }

        @Override
        public void onInitializeAccessibilityNodeInfo(View host, AccessibilityNodeInfo info) {
          super.onInitializeAccessibilityNodeInfo(host, info);
          info.setClassName(Button.class.getName());
        }
      };

  private static final View.AccessibilityDelegate RADIOBUTTON_CHECKED_DELEGATE =
      new View.AccessibilityDelegate() {
        @Override
        public void onInitializeAccessibilityEvent(View host, AccessibilityEvent event) {
          super.onInitializeAccessibilityEvent(host, event);
          event.setClassName(RadioButton.class.getName());
          event.setChecked(true);
        }

        @Override
        public void onInitializeAccessibilityNodeInfo(View host, AccessibilityNodeInfo info) {
          super.onInitializeAccessibilityNodeInfo(host, info);
          info.setClassName(RadioButton.class.getName());
          info.setCheckable(true);
          info.setChecked(true);
        }
      };

  private static final View.AccessibilityDelegate RADIOBUTTON_UNCHECKED_DELEGATE =
      new View.AccessibilityDelegate() {
        @Override
        public void onInitializeAccessibilityEvent(View host, AccessibilityEvent event) {
          super.onInitializeAccessibilityEvent(host, event);
          event.setClassName(RadioButton.class.getName());
          event.setChecked(false);
        }

        @Override
        public void onInitializeAccessibilityNodeInfo(View host, AccessibilityNodeInfo info) {
          super.onInitializeAccessibilityNodeInfo(host, info);
          info.setClassName(RadioButton.class.getName());
          info.setCheckable(true);
          info.setChecked(false);
        }
      };

  public static void updateAccessibilityComponentType(View view, String componentType) {
    if (componentType == null) {
      view.setAccessibilityDelegate(null);
      return;
    }
    switch (componentType) {
      case BUTTON:
        view.setAccessibilityDelegate(BUTTON_DELEGATE);
        break;
      case RADIOBUTTON_CHECKED:
        view.setAccessibilityDelegate(RADIOBUTTON_CHECKED_DELEGATE);
        break;
      case RADIOBUTTON_UNCHECKED:
        view.setAccessibilityDelegate(RADIOBUTTON_UNCHECKED_DELEGATE);
        break;
      default:
        view.setAccessibilityDelegate(null);
        break;
    }
  }

  public static void sendAccessibilityEvent(View view, int eventType) {
    view.sendAccessibilityEvent(eventType);
  }

}
