/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

/**
 * ViewManager that creates instances of RCTTextInlineImage.
 */
/* package */ final class RCTTextInlineImageManager extends VirtualViewManager<RCTTextInlineImage> {

  @Override
  public String getName() {
    return "RCTTextInlineImage";
  }

  @Override
  public RCTTextInlineImage createShadowNodeInstance() {
    return new RCTTextInlineImage();
  }

  @Override
  public Class<RCTTextInlineImage> getShadowNodeClass() {
    return RCTTextInlineImage.class;
  }
}
