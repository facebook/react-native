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

import android.view.View;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;

/**
 * Manages Images embedded in Text nodes. Since they are used only as a virtual nodes any type of
 * native view operation will throw an {@link IllegalStateException}
 */
public class ReactTextInlineImageViewManager
    extends ViewManager<View, ReactTextInlineImageShadowNode> {

  static final String REACT_CLASS = "RCTTextInlineImage";

  private final @Nullable AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final @Nullable Object mCallerContext;

  public ReactTextInlineImageViewManager() {
    this(null, null);
  }

  public ReactTextInlineImageViewManager(
      @Nullable AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable Object callerContext) {
    mDraweeControllerBuilder = draweeControllerBuilder;
    mCallerContext = callerContext;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public View createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException("RCTTextInlineImage doesn't map into a native view");
  }

  @Override
  public ReactTextInlineImageShadowNode createShadowNodeInstance() {
    return new ReactTextInlineImageShadowNode(
        (mDraweeControllerBuilder != null) ?
            mDraweeControllerBuilder :
            Fresco.newDraweeControllerBuilder(),
        mCallerContext
    );
  }

  @Override
  public Class<ReactTextInlineImageShadowNode> getShadowNodeClass() {
    return ReactTextInlineImageShadowNode.class;
  }

  @Override
  public void updateExtraData(View root, Object extraData) {
  }

}
