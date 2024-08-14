/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.Layout;
import android.text.Spannable;
import android.text.TextUtils;
import android.text.util.Linkify;
import android.view.Gravity;
import android.view.View;
import androidx.annotation.ColorInt;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.uimanager.BackgroundStyleApplicator;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.LogicalEdge;

/**
 * Abstract class for anchor {@code <Text>}-ish spannable views, such as {@link TextView} or {@link
 * TextEdit}.
 *
 * <p>This is a "shadowing" view manager, which means that the {@link NativeViewHierarchyManager}
 * will NOT manage children of native {@link TextView} instances instantiated by this manager.
 * Instead we use @{link ReactBaseTextShadowNode} hierarchy to calculate a {@link Spannable} text
 * represented the whole text subtree.
 */
public abstract class ReactTextAnchorViewManager<T extends View, C extends ReactBaseTextShadowNode>
    extends BaseViewManager<T, C> {

  private static final int[] SPACING_TYPES = {
    Spacing.ALL,
    Spacing.LEFT,
    Spacing.RIGHT,
    Spacing.TOP,
    Spacing.BOTTOM,
    Spacing.START,
    Spacing.END
  };
  private static final String TAG = "ReactTextAnchorViewManager";

  @ReactProp(name = "accessible")
  public void setAccessible(ReactTextView view, boolean accessible) {
    view.setFocusable(accessible);
  }

  // maxLines can only be set in master view (block), doesn't really make sense to set in a span
  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = ViewDefaults.NUMBER_OF_LINES)
  public void setNumberOfLines(ReactTextView view, int numberOfLines) {
    view.setNumberOfLines(numberOfLines);
  }

  @ReactProp(name = ViewProps.ELLIPSIZE_MODE)
  public void setEllipsizeMode(ReactTextView view, @Nullable String ellipsizeMode) {
    if (ellipsizeMode == null || ellipsizeMode.equals("tail")) {
      view.setEllipsizeLocation(TextUtils.TruncateAt.END);
    } else if (ellipsizeMode.equals("head")) {
      view.setEllipsizeLocation(TextUtils.TruncateAt.START);
    } else if (ellipsizeMode.equals("middle")) {
      view.setEllipsizeLocation(TextUtils.TruncateAt.MIDDLE);
    } else if (ellipsizeMode.equals("clip")) {
      view.setEllipsizeLocation(null);
    } else {
      FLog.w(ReactConstants.TAG, "Invalid ellipsizeMode: " + ellipsizeMode);
      view.setEllipsizeLocation(TextUtils.TruncateAt.END);
    }
  }

  @ReactProp(name = ViewProps.ADJUSTS_FONT_SIZE_TO_FIT)
  public void setAdjustFontSizeToFit(ReactTextView view, boolean adjustsFontSizeToFit) {
    view.setAdjustFontSizeToFit(adjustsFontSizeToFit);
  }

  @ReactProp(name = ViewProps.FONT_SIZE)
  public void setFontSize(ReactTextView view, float fontSize) {
    view.setFontSize(fontSize);
  }

  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = 0.f)
  public void setLetterSpacing(ReactTextView view, float letterSpacing) {
    view.setLetterSpacing(letterSpacing);
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN_VERTICAL)
  public void setTextAlignVertical(ReactTextView view, @Nullable String textAlignVertical) {
    if (textAlignVertical == null || "auto".equals(textAlignVertical)) {
      view.setGravityVertical(Gravity.NO_GRAVITY);
    } else if ("top".equals(textAlignVertical)) {
      view.setGravityVertical(Gravity.TOP);
    } else if ("bottom".equals(textAlignVertical)) {
      view.setGravityVertical(Gravity.BOTTOM);
    } else if ("center".equals(textAlignVertical)) {
      view.setGravityVertical(Gravity.CENTER_VERTICAL);
    } else {
      FLog.w(ReactConstants.TAG, "Invalid textAlignVertical: " + textAlignVertical);
      view.setGravityVertical(Gravity.NO_GRAVITY);
    }
  }

  @ReactProp(name = "selectable")
  public void setSelectable(ReactTextView view, boolean isSelectable) {
    view.setTextIsSelectable(isSelectable);
  }

  @ReactProp(name = "selectionColor", customType = "Color")
  public void setSelectionColor(ReactTextView view, @Nullable Integer color) {
    if (color == null) {
      view.setHighlightColor(
          DefaultStyleValuesUtil.getDefaultTextColorHighlight(view.getContext()));
    } else {
      view.setHighlightColor(color);
    }
  }

  @ReactProp(name = "android_hyphenationFrequency")
  public void setAndroidHyphenationFrequency(ReactTextView view, @Nullable String frequency) {
    if (frequency == null || frequency.equals("none")) {
      view.setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NONE);
    } else if (frequency.equals("full")) {
      view.setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_FULL);
    } else if (frequency.equals("normal")) {
      view.setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NORMAL);
    } else {
      FLog.w(ReactConstants.TAG, "Invalid android_hyphenationFrequency: " + frequency);
      view.setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NONE);
    }
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_RADIUS,
        ViewProps.BORDER_TOP_LEFT_RADIUS,
        ViewProps.BORDER_TOP_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_LEFT_RADIUS
      },
      defaultFloat = Float.NaN)
  public void setBorderRadius(ReactTextView view, int index, float borderRadius) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      @Nullable
      LengthPercentage radius =
          Float.isNaN(borderRadius)
              ? null
              : new LengthPercentage(borderRadius, LengthPercentageType.POINT);
      BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], radius);
    } else {
      if (!Float.isNaN(borderRadius)) {
        borderRadius = PixelUtil.toPixelFromDIP(borderRadius);
      }

      if (index == 0) {
        view.setBorderRadius(borderRadius);
      } else {
        view.setBorderRadius(borderRadius, index - 1);
      }
    }
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(ReactTextView view, @Nullable String borderStyle) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      @Nullable
      BorderStyle parsedBorderStyle =
          borderStyle == null ? null : BorderStyle.fromString(borderStyle);
      BackgroundStyleApplicator.setBorderStyle(view, parsedBorderStyle);
    } else {
      view.setBorderStyle(borderStyle);
    }
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_WIDTH,
        ViewProps.BORDER_LEFT_WIDTH,
        ViewProps.BORDER_RIGHT_WIDTH,
        ViewProps.BORDER_TOP_WIDTH,
        ViewProps.BORDER_BOTTOM_WIDTH,
        ViewProps.BORDER_START_WIDTH,
        ViewProps.BORDER_END_WIDTH,
      },
      defaultFloat = Float.NaN)
  public void setBorderWidth(ReactTextView view, int index, float width) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.values()[index], width);
    } else {
      if (!Float.isNaN(width)) {
        width = PixelUtil.toPixelFromDIP(width);
      }
      view.setBorderWidth(SPACING_TYPES[index], width);
    }
  }

  @ReactPropGroup(
      names = {
        "borderColor",
        "borderLeftColor",
        "borderRightColor",
        "borderTopColor",
        "borderBottomColor"
      },
      customType = "Color")
  public void setBorderColor(ReactTextView view, int index, @Nullable Integer color) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderColor(view, LogicalEdge.ALL, color);
    } else {
      view.setBorderColor(SPACING_TYPES[index], color);
    }
  }

  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public void setIncludeFontPadding(ReactTextView view, boolean includepad) {
    view.setIncludeFontPadding(includepad);
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  public void setDisabled(ReactTextView view, boolean disabled) {
    view.setEnabled(!disabled);
  }

  @ReactProp(name = "dataDetectorType")
  public void setDataDetectorType(ReactTextView view, @Nullable String type) {
    if (type != null) {
      switch (type) {
        case "phoneNumber":
          view.setLinkifyMask(Linkify.PHONE_NUMBERS);
          return;
        case "link":
          view.setLinkifyMask(Linkify.WEB_URLS);
          return;
        case "email":
          view.setLinkifyMask(Linkify.EMAIL_ADDRESSES);
          return;
        case "all":
          view.setLinkifyMask(Linkify.ALL);
          return;
      }
    }

    // "none" case, default, and null type are equivalent.
    view.setLinkifyMask(0);
  }

  @ReactProp(name = "onInlineViewLayout")
  public void setNotifyOnInlineViewLayout(ReactTextView view, boolean notifyOnInlineViewLayout) {
    view.setNotifyOnInlineViewLayout(notifyOnInlineViewLayout);
  }

  @ReactProp(name = ViewProps.BOX_SHADOW, customType = "BoxShadow")
  public void setBoxShadow(ReactTextView view, @Nullable ReadableArray shadows) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBoxShadow(view, shadows);
    }
  }

  @Override
  public void setBackgroundColor(T view, @ColorInt int backgroundColor) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBackgroundColor(view, backgroundColor);
    } else {
      super.setBackgroundColor(view, backgroundColor);
    }
  }
}
