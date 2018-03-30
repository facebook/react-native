/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
