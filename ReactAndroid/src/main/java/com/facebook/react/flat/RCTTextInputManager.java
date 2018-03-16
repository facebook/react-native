/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import com.facebook.react.views.textinput.ReactTextInputManager;

public class RCTTextInputManager extends ReactTextInputManager {

  /* package */ static final String REACT_CLASS = ReactTextInputManager.REACT_CLASS;

  @Override
  public RCTTextInput createShadowNodeInstance() {
    return new RCTTextInput();
  }

  @Override
  public Class<RCTTextInput> getShadowNodeClass() {
    return RCTTextInput.class;
  }
}
