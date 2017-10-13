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
