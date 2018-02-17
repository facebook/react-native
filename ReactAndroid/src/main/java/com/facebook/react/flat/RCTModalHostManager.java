/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.views.modal.ReactModalHostManager;

public class RCTModalHostManager extends ReactModalHostManager {

  /* package */ static final String REACT_CLASS = ReactModalHostManager.REACT_CLASS;

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new FlatReactModalShadowNode();
  }

  @Override
  public Class<? extends LayoutShadowNode> getShadowNodeClass() {
    return FlatReactModalShadowNode.class;
  }
}
