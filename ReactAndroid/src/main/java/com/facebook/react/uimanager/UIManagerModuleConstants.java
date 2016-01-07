/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.HashMap;
import java.util.Map;

import android.text.InputType;
import android.util.DisplayMetrics;
import android.view.accessibility.AccessibilityEvent;
import android.widget.ImageView;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.events.TouchEventType;

/**
 * Constants exposed to JS from {@link UIManagerModule}.
 */
/* package */ class UIManagerModuleConstants {

  public static final String ACTION_DISMISSED = "dismissed";
  public static final String ACTION_ITEM_SELECTED = "itemSelected";

  /* package */ static Map getBubblingEventTypeConstants() {
    return MapBuilder.builder()
        .put(
            "topChange",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onChange", "captured", "onChangeCapture")))
        .put(
            "topSelect",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onSelect", "captured", "onSelectCapture")))
        .put(
            TouchEventType.START.getJSEventName(),
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of(
                    "bubbled",
                    "onTouchStart",
                    "captured",
                    "onTouchStartCapture")))
        .put(
            TouchEventType.MOVE.getJSEventName(),
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of(
                    "bubbled",
                    "onTouchMove",
                    "captured",
                    "onTouchMoveCapture")))
        .put(
            TouchEventType.END.getJSEventName(),
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of(
                    "bubbled",
                    "onTouchEnd",
                    "captured",
                    "onTouchEndCapture")))
        .build();
  }

  /* package */ static Map getDirectEventTypeConstants() {
    return MapBuilder.builder()
        .put("topSelectionChange", MapBuilder.of("registrationName", "onSelectionChange"))
        .put("topLoadingStart", MapBuilder.of("registrationName", "onLoadingStart"))
        .put("topLoadingFinish", MapBuilder.of("registrationName", "onLoadingFinish"))
        .put("topLoadingError", MapBuilder.of("registrationName", "onLoadingError"))
        .put("topLayout", MapBuilder.of("registrationName", "onLayout"))
        .build();
  }

  public static Map<String, Object> getConstants(DisplayMetrics displayMetrics) {
    HashMap<String, Object> constants = new HashMap<String, Object>();
    constants.put(
        "UIView",
        MapBuilder.of(
            "ContentMode",
            MapBuilder.of(
                "ScaleAspectFit",
                ImageView.ScaleType.CENTER_INSIDE.ordinal(),
                "ScaleAspectFill",
                ImageView.ScaleType.CENTER_CROP.ordinal())));

    constants.put(
        "UIText",
        MapBuilder.of(
            "AutocapitalizationType",
            MapBuilder.of(
                "none",
                InputType.TYPE_CLASS_TEXT,
                "characters",
                InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS,
                "words",
                InputType.TYPE_TEXT_FLAG_CAP_WORDS,
                "sentences",
                InputType.TYPE_TEXT_FLAG_CAP_SENTENCES)));

    constants.put(
        "Dimensions",
        MapBuilder.of(
            "windowPhysicalPixels",
            MapBuilder.of(
                "width",
                displayMetrics.widthPixels,
                "height",
                displayMetrics.heightPixels,
                "scale",
                displayMetrics.density,
                "fontScale",
                displayMetrics.scaledDensity,
                "densityDpi",
                displayMetrics.densityDpi)));

    constants.put(
        "StyleConstants",
        MapBuilder.of(
            "PointerEventsValues",
            MapBuilder.of(
                "none",
                PointerEvents.NONE.ordinal(),
                "boxNone",
                PointerEvents.BOX_NONE.ordinal(),
                "boxOnly",
                PointerEvents.BOX_ONLY.ordinal(),
                "unspecified",
                PointerEvents.AUTO.ordinal())));

    constants.put(
        "PopupMenu",
        MapBuilder.of(
            ACTION_DISMISSED,
            ACTION_DISMISSED,
            ACTION_ITEM_SELECTED,
            ACTION_ITEM_SELECTED));

    constants.put(
      "AccessibilityEventTypes",
      MapBuilder.of(
          "typeWindowStateChanged",
          AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED,
          "typeViewClicked",
          AccessibilityEvent.TYPE_VIEW_CLICKED));

    return constants;
  }
}
