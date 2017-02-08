/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;

public final class RCTImageViewManager extends FlatViewManager {

  private @Nullable AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final @Nullable Object mCallerContext;

  public RCTImageViewManager() {
    this(null, null);
  }

  public RCTImageViewManager(
    AbstractDraweeControllerBuilder draweeControllerBuilder,
    Object callerContext) {
    mDraweeControllerBuilder = draweeControllerBuilder;
    mCallerContext = callerContext;
  }

  @Override
  public String getName() {
    return "RCTImageView";
  }

  @Override
  public RCTImageView createShadowNodeInstance() {
    return new RCTImageView(new DrawImageWithDrawee());
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
