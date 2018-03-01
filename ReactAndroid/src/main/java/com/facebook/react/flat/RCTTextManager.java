/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

/**
 * ViewManager that creates instances of RCTText.
 */
public final class RCTTextManager extends FlatViewManager {

  /* package */ static final String REACT_CLASS = "RCTText";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public RCTText createShadowNodeInstance() {
    return new RCTText();
  }

  @Override
  public Class<RCTText> getShadowNodeClass() {
    return RCTText.class;
  }
}
