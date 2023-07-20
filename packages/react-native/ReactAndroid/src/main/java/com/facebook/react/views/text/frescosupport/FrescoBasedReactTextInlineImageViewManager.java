/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.frescosupport;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

/**
 * Manages Images embedded in Text nodes using Fresco. Since they are used only as a virtual nodes
 * any type of native view operation will throw an {@link IllegalStateException}.
 */
@ReactModule(name = FrescoBasedReactTextInlineImageViewManager.REACT_CLASS)
public class FrescoBasedReactTextInlineImageViewManager
    extends BaseViewManager<View, FrescoBasedReactTextInlineImageShadowNode> {

  public static final String REACT_CLASS = "RCTTextInlineImage";

  private final @Nullable AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final @Nullable Object mCallerContext;

  public FrescoBasedReactTextInlineImageViewManager() {
    this(null, null);
  }

  public FrescoBasedReactTextInlineImageViewManager(
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
  public FrescoBasedReactTextInlineImageShadowNode createShadowNodeInstance() {
    return new FrescoBasedReactTextInlineImageShadowNode(
        (mDraweeControllerBuilder != null)
            ? mDraweeControllerBuilder
            : Fresco.newDraweeControllerBuilder(),
        mCallerContext);
  }

  @Override
  public Class<FrescoBasedReactTextInlineImageShadowNode> getShadowNodeClass() {
    return FrescoBasedReactTextInlineImageShadowNode.class;
  }

  @Override
  public void updateExtraData(View root, Object extraData) {}
}
