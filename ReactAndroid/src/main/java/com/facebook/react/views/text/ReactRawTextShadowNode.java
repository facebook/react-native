/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * <p>This source code is licensed under the BSD-style license found in the LICENSE file in the root
 * directory of this source tree. An additional grant of patent rights can be found in the PATENTS
 * file in the same directory.
 */
package com.facebook.react.views.text;

import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.annotations.ReactProp;
import javax.annotation.Nullable;

/**
 * {@link ReactShadowNode} class for pure raw text node (aka {@code textContent} in terms of DOM).
 * Raw text node can only have simple string value without any attributes, properties or state.
 */
public class ReactRawTextShadowNode extends ReactShadowNodeImpl {

  @VisibleForTesting public static final String PROP_TEXT = "text";

  private @Nullable String mText = null;

  @ReactProp(name = PROP_TEXT)
  public void setText(@Nullable String text) {
    mText = text;
    markUpdated();
  }

  public @Nullable String getText() {
    return mText;
  }

  @Override
  public boolean isVirtual() {
    return true;
  }
}
