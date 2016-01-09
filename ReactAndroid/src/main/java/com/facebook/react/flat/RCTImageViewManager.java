/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

/* package */ final class RCTImageViewManager extends FlatViewManager {

  private static final boolean USE_IMAGEPIPELINE_DIRECTLY = false;

  @Override
  public String getName() {
    return "RCTImageView";
  }

  @Override
  public RCTImageView createShadowNodeInstance() {
    if (USE_IMAGEPIPELINE_DIRECTLY) {
      return new RCTImageView(new DrawImageWithPipeline());
    } else {
      return new RCTImageView(new DrawImageWithDrawee());
    }
  }

  @Override
  public Class<RCTImageView> getShadowNodeClass() {
    return RCTImageView.class;
  }
}
