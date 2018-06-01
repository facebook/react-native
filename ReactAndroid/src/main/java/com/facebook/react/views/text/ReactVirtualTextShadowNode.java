// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
  protected ReactVirtualTextShadowNode copy() {
    return new ReactVirtualTextShadowNode(this);
  }
}
