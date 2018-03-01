/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

/**
 * ViewManager that creates instances of RCTTextInlineImage.
 */
public final class RCTTextInlineImageManager extends VirtualViewManager<RCTTextInlineImage> {

  /* package */ static final String REACT_CLASS = "RCTTextInlineImage";

  @Override
  public String getName() {
    return REACT_CLASS;
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
