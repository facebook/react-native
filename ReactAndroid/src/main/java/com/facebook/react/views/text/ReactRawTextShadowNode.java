/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
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

  public ReactRawTextShadowNode() {}

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

  @Override
  public String toString() {
    return getViewClass() + " [text: " + mText + "]";
  }
}
