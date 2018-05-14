/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

/**
 * ViewManager that creates instances of RCTVirtualText.
 */
public final class RCTVirtualTextManager extends VirtualViewManager<RCTVirtualText> {

  /* package */ static final String REACT_CLASS = "RCTVirtualText";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public RCTVirtualText createShadowNodeInstance() {
    return new RCTVirtualText();
  }

  @Override
  public Class<RCTVirtualText> getShadowNodeClass() {
    return RCTVirtualText.class;
  }
}
