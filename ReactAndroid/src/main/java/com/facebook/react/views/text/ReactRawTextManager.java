/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.view.View;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;

/**
 * Manages raw text nodes (aka {@code textContent} in terms of DOM). Since they are used only as a
 * virtual nodes, any type of native view operation will throw an {@link IllegalStateException}.
 */
@ReactModule(name = ReactRawTextManager.REACT_CLASS)
public class ReactRawTextManager extends ViewManager<View, ReactRawTextShadowNode> {

  @VisibleForTesting public static final String REACT_CLASS = "RCTRawText";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactTextView createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException("Attempt to create a native view for RCTRawText");
  }

  @Override
  public void updateExtraData(View view, Object extraData) {}

  @Override
  public Class<ReactRawTextShadowNode> getShadowNodeClass() {
    return ReactRawTextShadowNode.class;
  }

  @Override
  public ReactRawTextShadowNode createShadowNodeInstance() {
    return new ReactRawTextShadowNode();
  }
}
