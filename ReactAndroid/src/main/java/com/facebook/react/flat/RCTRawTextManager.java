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
 * ViewManager that creates instances of RCTRawText.
 */
/* package */ final class RCTRawTextManager extends VirtualViewManager<RCTRawText> {

  @Override
  public String getName() {
    return "RCTRawText";
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
