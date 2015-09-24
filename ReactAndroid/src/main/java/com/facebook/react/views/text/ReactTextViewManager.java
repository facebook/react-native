/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import android.text.Spannable;
import android.text.Spanned;
import android.text.TextUtils;
import android.view.Gravity;
import android.widget.TextView;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.uimanager.BaseViewPropertyApplicator;
import com.facebook.react.uimanager.CatalystStylesDiffMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIProp;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewManager;
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
public class ReactTextViewManager extends ViewManager<ReactTextView, ReactTextShadowNode> {

  @VisibleForTesting
  public static final String REACT_CLASS = "RCTText";

  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_NUMBER_OF_LINES = ViewProps.NUMBER_OF_LINES;
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_TEXT_ALIGN = ViewProps.TEXT_ALIGN;
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_LINE_HEIGHT = ViewProps.LINE_HEIGHT;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactTextView createViewInstance(ThemedReactContext context) {
    return new ReactTextView(context);
  }

  @Override
  public void updateView(ReactTextView view, CatalystStylesDiffMap props) {
    BaseViewPropertyApplicator.applyCommonViewProperties(view, props);
    // maxLines can only be set in master view (block), doesn't really make sense to set in a span
    if (props.hasKey(PROP_NUMBER_OF_LINES)) {
      view.setMaxLines(props.getInt(PROP_NUMBER_OF_LINES, ViewDefaults.NUMBER_OF_LINES));
      view.setEllipsize(TextUtils.TruncateAt.END);
    }
    // same with textAlign
    if (props.hasKey(PROP_TEXT_ALIGN)) {
      final String textAlign = props.getString(PROP_TEXT_ALIGN);
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
    // same for lineSpacing
    if (props.hasKey(PROP_LINE_HEIGHT)) {
      if (props.isNull(PROP_LINE_HEIGHT)) {
        view.setLineSpacing(0, 1);
      } else {
        float lineHeight =
            PixelUtil.toPixelFromSP(props.getInt(PROP_LINE_HEIGHT, ViewDefaults.LINE_HEIGHT));
        view.setLineSpacing(lineHeight, 0);
      }
    }
  }

  @Override
  public void updateExtraData(ReactTextView view, Object extraData) {
    view.setText((Spanned) extraData);
  }

  @Override
  public ReactTextShadowNode createCSSNodeInstance() {
    return new ReactTextShadowNode(false);
  }
}
