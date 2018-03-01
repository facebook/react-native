/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

/**
 * ViewManager that creates instances of RCTRawText.
 */
public final class RCTRawTextManager extends VirtualViewManager<RCTRawText> {

  /* package */ static final String REACT_CLASS = "RCTRawText";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public RCTRawText createShadowNodeInstance() {
    return new RCTRawText();
  }

  @Override
  public Class<RCTRawText> getShadowNodeClass() {
    return RCTRawText.class;
  }
}
