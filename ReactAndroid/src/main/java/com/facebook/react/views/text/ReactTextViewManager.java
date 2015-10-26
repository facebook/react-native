/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import javax.annotation.Nullable;

import android.text.Spannable;
import android.text.Spanned;
import android.text.TextUtils;
import android.view.Gravity;
import android.widget.TextView;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.common.annotations.VisibleForTesting;

/**
 * Manages instances of spannable {@link TextView}.
 *
 * This is a "shadowing" view manager, which means that the {@link NativeViewHierarchyManager} will
 * not manage children of native {@link TextView} instances returned by this manager. Instead we use
 * @{link ReactTextShadowNode} hierarchy to calculate a {@link Spannable} text representing the
 * whole text subtree.
 */
public class ReactTextViewManager extends BaseViewManager<ReactTextView, ReactTextShadowNode> {

  @VisibleForTesting
  public static final String REACT_CLASS = "RCTText";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactTextView createViewInstance(ThemedReactContext context) {
    return new ReactTextView(context);
  }

  // maxLines can only be set in master view (block), doesn't really make sense to set in a span
  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = ViewDefaults.NUMBER_OF_LINES)
  public void setNumberOfLines(ReactTextView view, int numberOfLines) {
    view.setMaxLines(numberOfLines);
    view.setEllipsize(TextUtils.TruncateAt.END);
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public void setTextAlign(ReactTextView view, @Nullable String textAlign) {
    if (textAlign == null || "auto".equals(textAlign)) {
      view.setGravity(Gravity.NO_GRAVITY);
    } else if ("left".equals(textAlign)) {
      view.setGravity(Gravity.LEFT);
    } else if ("right".equals(textAlign)) {
      view.setGravity(Gravity.RIGHT);
    } else if ("center".equals(textAlign)) {
      view.setGravity(Gravity.CENTER_HORIZONTAL);
    } else {
      throw new JSApplicationIllegalArgumentException("Invalid textAlign: " + textAlign);
    }
  }

  @ReactProp(name = ViewProps.LINE_HEIGHT, defaultFloat = Float.NaN)
  public void setLineHeight(ReactTextView view, float lineHeight) {
    if (Float.isNaN(lineHeight)) { // NaN will be used if property gets reset
      view.setLineSpacing(0, 1);
    } else {
      view.setLineSpacing(PixelUtil.toPixelFromSP(lineHeight), 0);
    }
  }

  @Override
  public void updateExtraData(ReactTextView view, Object extraData) {
    view.setText((Spanned) extraData);
  }

  @Override
  public ReactTextShadowNode createShadowNodeInstance() {
    return new ReactTextShadowNode(false);
  }

  @Override
  public Class<ReactTextShadowNode> getShadowNodeClass() {
    return ReactTextShadowNode.class;
  }
}
