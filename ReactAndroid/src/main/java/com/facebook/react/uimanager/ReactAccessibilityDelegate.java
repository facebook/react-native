// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager;

import android.os.Bundle;
import android.content.Context;
import androidx.core.view.AccessibilityDelegateCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.AccessibilityActionCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.CollectionItemInfoCompat;
import android.text.SpannableString;
import android.text.style.URLSpan;
import androidx.core.view.AccessibilityDelegateCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.CollectionItemInfoCompat;
import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.R;

import java.util.HashMap;
import java.util.Locale;
import javax.annotation.Nullable;

/**
 * Utility class that handles the addition of a "role" for accessibility to
 * either a View or AccessibilityNodeInfo.
 */

public class ReactAccessibilityDelegate extends AccessibilityDelegateCompat {

  private static int sCounter = 0x3f000000;

  public static final HashMap<String, Integer> sActionIdMap= new HashMap<>();
  static {
    sActionIdMap.put("activate", AccessibilityActionCompat.ACTION_CLICK.getId());
    sActionIdMap.put("longpress", AccessibilityActionCompat.ACTION_LONG_CLICK.getId());
    sActionIdMap.put("increment", AccessibilityActionCompat.ACTION_SCROLL_FORWARD.getId());
    sActionIdMap.put("decrement", AccessibilityActionCompat.ACTION_SCROLL_BACKWARD.getId());      
  }

  /**
   * These roles are defined by Google's TalkBack screen reader, and this list
   * should be kept up to date with their implementation. Details can be seen in
   * their source code here:
   *
   * <p>
   * https://github.com/google/talkback/blob/master/utils/src/main/java/Role.java
   */

  public enum AccessibilityRole {
    NONE, BUTTON, LINK, SEARCH, IMAGE, IMAGEBUTTON, KEYBOARDKEY, TEXT, ADJUSTABLE, SUMMARY, HEADER, ALERT, CHECKBOX,
    COMBOBOX, MENU, MENUBAR, MENUITEM, PROGRESSBAR, RADIO, RADIOGROUP, SCROLLBAR, SPINBUTTON,
    SWITCH, TAB, TABLIST, TIMER, TOOLBAR;

    public static String getValue(AccessibilityRole role) {
      switch (role) {
        case BUTTON:
          return "android.widget.Button";
        case SEARCH:
          return "android.widget.EditText";
        case IMAGE:
          return "android.widget.ImageView";
        case IMAGEBUTTON:
          return "android.widget.ImageButon";
        case KEYBOARDKEY:
          return "android.inputmethodservice.Keyboard$Key";
        case TEXT:
          return "android.widget.TextView";
        case ADJUSTABLE:
          return "android.widget.SeekBar";
        case CHECKBOX:
          return "android.widget.CheckBox";
        case RADIO:
          return "android.widget.RadioButton";
        case SPINBUTTON:
          return "android.widget.SpinButton";
        case SWITCH:
          return "android.widget.Switch";
        case NONE:
        case LINK:
        case SUMMARY:
        case HEADER:
        case ALERT:
        case COMBOBOX:
        case MENU:
        case MENUBAR:
        case MENUITEM:
        case PROGRESSBAR:
        case RADIOGROUP:
        case SCROLLBAR:
        case TAB:
        case TABLIST:
        case TIMER:
        case TOOLBAR:
          return "android.view.View";
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

  private final HashMap<Integer, String> mAccessibilityActionsMap;

  public ReactAccessibilityDelegate() {
    super();
    mAccessibilityActionsMap = new HashMap<Integer, String>();
  }

  @Override
  public void onInitializeAccessibilityNodeInfo(View host, AccessibilityNodeInfoCompat info) {
    super.onInitializeAccessibilityNodeInfo(host, info);
    final AccessibilityRole accessibilityRole = (AccessibilityRole) host.getTag(R.id.accessibility_role);
    if (accessibilityRole != null) {
      setRole(info, accessibilityRole, host.getContext());
    }

    // states are changable.
    final ReadableArray accessibilityStates = (ReadableArray) host.getTag(R.id.accessibility_states);
    if (accessibilityStates != null) {
      setState(info, accessibilityStates, host.getContext());
    }
    final ReadableArray accessibilityActions = (ReadableArray) host.getTag(R.id.accessibility_actions);
    if (accessibilityActions != null) {
      for (int i = 0; i < accessibilityActions.size(); i++) {
        final ReadableMap action = accessibilityActions.getMap(i);
        if (!action.hasKey("name")) {
          throw new IllegalArgumentException("Unknown accessibility action.");
        }
        int actionId = sCounter;
        String actionLabel = action.hasKey("label") ? action.getString("label") : null;
        if (sActionIdMap.containsKey(action.getString("name"))) {
          actionId = sActionIdMap.get(action.getString("name"));
        } else {
          sCounter++;
        }
        mAccessibilityActionsMap.put(actionId, action.getString("name"));
        final AccessibilityActionCompat accessibilityAction = new AccessibilityActionCompat(actionId, actionLabel);
        info.addAction(accessibilityAction);
      }
    }
  }

  @Override
  public boolean performAccessibilityAction(View host, int action, Bundle args) {
    if (mAccessibilityActionsMap.containsKey(action)) {
      final WritableMap event = Arguments.createMap();
      event.putString("actionName", mAccessibilityActionsMap.get(action));
      ReactContext reactContext = (ReactContext)host.getContext();
      reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
          host.getId(),
          "performAction",
          event);
      return true;
    }
    return super.performAccessibilityAction(host, action, args);
  }

  public static void setState(AccessibilityNodeInfoCompat info, ReadableArray accessibilityStates, Context context) {
    for (int i = 0; i < accessibilityStates.size(); i++) {
      String state = accessibilityStates.getString(i);
      switch (state) {
        case "selected":
          info.setSelected(true);
          break;
        case "disabled":
          info.setEnabled(false);
          break;
        case "checked":
          info.setCheckable(true);
          info.setChecked(true);
          if (info.getClassName().equals("android.widget.Switch")) {
            info.setText(context.getString(R.string.state_on_description));
          }
          break;
        case "unchecked":
          info.setCheckable(true);
          info.setChecked(false);
          if (info.getClassName().equals("android.widget.Switch")) {
            info.setText(context.getString(R.string.state_off_description));
          }
          break;
        case "hasPopup":
          info.setCanOpenPopup(true);
          break;
      }
    }
  }

  /**
   * Strings for setting the Role Description in english
   */

  // TODO: Eventually support for other languages on talkback

  public static void setRole(AccessibilityNodeInfoCompat nodeInfo, AccessibilityRole role, final Context context) {
    if (role == null) {
      role = AccessibilityRole.NONE;
    }
    nodeInfo.setClassName(AccessibilityRole.getValue(role));
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
    } else if (role.equals(AccessibilityRole.SEARCH)) {
      nodeInfo.setRoleDescription(context.getString(R.string.search_description));
    } else if (role.equals(AccessibilityRole.IMAGE)) {
      nodeInfo.setRoleDescription(context.getString(R.string.image_description));
    } else if (role.equals(AccessibilityRole.IMAGEBUTTON)) {
      nodeInfo.setRoleDescription(context.getString(R.string.imagebutton_description));
      nodeInfo.setClickable(true);
    } else if (role.equals(AccessibilityRole.SUMMARY)) {
      nodeInfo.setRoleDescription(context.getString(R.string.summary_description));
    } else if (role.equals(AccessibilityRole.HEADER)) {
      nodeInfo.setRoleDescription(context.getString(R.string.header_description));
      final AccessibilityNodeInfoCompat.CollectionItemInfoCompat itemInfo =
        AccessibilityNodeInfoCompat.CollectionItemInfoCompat.obtain(0, 1, 0, 1, true);
      nodeInfo.setCollectionItemInfo(itemInfo);
    } else if (role.equals(AccessibilityRole.ALERT)) {
      nodeInfo.setRoleDescription(context.getString(R.string.alert_description));
    } else if (role.equals(AccessibilityRole.COMBOBOX)) {
      nodeInfo.setRoleDescription(context.getString(R.string.combobox_description));
    } else if (role.equals(AccessibilityRole.MENU)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menu_description));
    } else if (role.equals(AccessibilityRole.MENUBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menubar_description));
    } else if (role.equals(AccessibilityRole.MENUITEM)) {
      nodeInfo.setRoleDescription(context.getString(R.string.menuitem_description));
    } else if (role.equals(AccessibilityRole.PROGRESSBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.progressbar_description));
    } else if (role.equals(AccessibilityRole.RADIOGROUP)) {
      nodeInfo.setRoleDescription(context.getString(R.string.radiogroup_description));
    } else if (role.equals(AccessibilityRole.SCROLLBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.scrollbar_description));
    } else if (role.equals(AccessibilityRole.SPINBUTTON)) {
      nodeInfo.setRoleDescription(context.getString(R.string.spinbutton_description));
    } else if (role.equals(AccessibilityRole.TAB)) {
      nodeInfo.setRoleDescription(context.getString(R.string.rn_tab_description));
    } else if (role.equals(AccessibilityRole.TABLIST)) {
      nodeInfo.setRoleDescription(context.getString(R.string.tablist_description));
    } else if (role.equals(AccessibilityRole.TIMER)) {
      nodeInfo.setRoleDescription(context.getString(R.string.timer_description));
    } else if (role.equals(AccessibilityRole.TOOLBAR)) {
      nodeInfo.setRoleDescription(context.getString(R.string.toolbar_description));
    }
  }

  public static void setDelegate(final View view) {
    // if a view already has an accessibility delegate, replacing it could cause
    // problems,
    // so leave it alone.
    if (!ViewCompat.hasAccessibilityDelegate(view)
        && (view.getTag(R.id.accessibility_role) != null ||
          view.getTag(R.id.accessibility_states) != null ||
          view.getTag(R.id.accessibility_actions) != null)) {
      ViewCompat.setAccessibilityDelegate(view, new ReactAccessibilityDelegate());
    }
  }
}
