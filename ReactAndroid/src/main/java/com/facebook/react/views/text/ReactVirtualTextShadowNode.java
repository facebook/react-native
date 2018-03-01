// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.text;

/**
 * A virtual text node.
 */
public class ReactVirtualTextShadowNode extends ReactBaseTextShadowNode {

  @Override
  public boolean isVirtual() {
    return true;
  }

  public ReactVirtualTextShadowNode() { }

  private ReactVirtualTextShadowNode(ReactVirtualTextShadowNode node) {
    super(node);
  }

  @Override
  public ReactVirtualTextShadowNode mutableCopy() {
    return new ReactVirtualTextShadowNode(this);
  }
}
