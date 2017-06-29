// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.text;

/**
 * A virtual text node. Should only be a child of a ReactTextShadowNode.
 */
public class ReactVirtualTextShadowNode extends ReactTextShadowNode {

  @Override
  public boolean isVirtual() {
    return true;
  }
}
