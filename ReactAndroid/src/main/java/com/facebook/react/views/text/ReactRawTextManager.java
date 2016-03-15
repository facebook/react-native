/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.ThemedReactContext;

/**
 * Manages raw text nodes. Since they are used only as a virtual nodes any type of native view
 * operation will throw an {@link IllegalStateException}
 */
public class ReactRawTextManager extends ReactTextViewManager {

  @VisibleForTesting
  public static final String REACT_CLASS = "RCTRawText";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactTextView createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException("RKRawText doesn't map into a native view");
  }

  @Override
  public void updateExtraData(ReactTextView view, Object extraData) {
  }

  @Override
  public ReactTextShadowNode createShadowNodeInstance() {
    return new ReactTextShadowNode(true);
  }

  @Override
  public Class<ReactTextShadowNode> getShadowNodeClass() {
    return ReactTextShadowNode.class;
  }
}
