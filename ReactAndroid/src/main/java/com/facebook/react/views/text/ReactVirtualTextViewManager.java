/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.view.View;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

/**
 * Manages raw text nodes. Since they are used only as a virtual nodes any type of native view
 * operation will throw an {@link IllegalStateException}
 */
@ReactModule(name = ReactVirtualTextViewManager.REACT_CLASS)
public class ReactVirtualTextViewManager extends BaseViewManager<View, ReactVirtualTextShadowNode> {

  @VisibleForTesting
  public static final String REACT_CLASS = "RCTVirtualText";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public View createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException("Attempt to create a native view for RCTVirtualText");
  }

  @Override
  public void updateExtraData(View view, Object extraData) {}

  @Override
  public Class<ReactVirtualTextShadowNode> getShadowNodeClass() {
    return ReactVirtualTextShadowNode.class;
  }

  @Override
  public ReactVirtualTextShadowNode createShadowNodeInstance() {
    return new ReactVirtualTextShadowNode();
  }
}
