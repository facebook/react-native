/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.views.image.GlobalImageLoadListener;
import javax.annotation.Nullable;

public final class RCTImageViewManager extends FlatViewManager {

  /* package */ static final String REACT_CLASS = "RCTImageView";

  private @Nullable AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private @Nullable GlobalImageLoadListener mGlobalImageLoadListener;
  private final @Nullable Object mCallerContext;

  public RCTImageViewManager() {
    this(null, null);
  }

  public RCTImageViewManager(
    AbstractDraweeControllerBuilder draweeControllerBuilder,
    Object callerContext) {
    this(draweeControllerBuilder, null, callerContext);
  }

  public RCTImageViewManager(
      AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable GlobalImageLoadListener globalImageLoadListener,
      Object callerContext) {
    mDraweeControllerBuilder = draweeControllerBuilder;
    mGlobalImageLoadListener = globalImageLoadListener;
    mCallerContext = callerContext;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public RCTImageView createShadowNodeInstance() {
    return new RCTImageView(new DrawImageWithDrawee(mGlobalImageLoadListener));
  }

  @Override
  public Class<RCTImageView> getShadowNodeClass() {
    return RCTImageView.class;
  }

  public AbstractDraweeControllerBuilder getDraweeControllerBuilder() {
    if (mDraweeControllerBuilder == null) {
      mDraweeControllerBuilder = Fresco.newDraweeControllerBuilder();
    }
    return mDraweeControllerBuilder;
  }

  public Object getCallerContext() {
    return mCallerContext;
  }
}
