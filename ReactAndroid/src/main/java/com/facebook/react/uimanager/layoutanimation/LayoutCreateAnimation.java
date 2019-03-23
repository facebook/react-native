// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager.layoutanimation;

/**
 * Class responsible for handling layout view creation animation, applied to view whenever a
 * valid config was supplied for the layout animation of CREATE type.
 */
/* package */ class LayoutCreateAnimation extends BaseLayoutAnimation {

  @Override
  boolean isReverse() {
    return false;
  }
}
