/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Subclass of {@link AnimationPropertyUpdater} for animating view's opacity
 */
public class OpacityAnimationPropertyUpdater extends AbstractSingleFloatProperyUpdater {

  public OpacityAnimationPropertyUpdater(float toOpacity) {
    super(toOpacity);
  }

  public OpacityAnimationPropertyUpdater(float fromOpacity, float toOpacity) {
    super(fromOpacity, toOpacity);
  }

  @Override
  protected float getProperty(View view) {
    return view.getAlpha();
  }

  @Override
  protected void setProperty(View view, float propertyValue) {
    view.setAlpha(propertyValue);
  }
}
