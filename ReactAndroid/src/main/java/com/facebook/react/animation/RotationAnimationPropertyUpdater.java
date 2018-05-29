/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Subclass of {@link AnimationPropertyUpdater} for animating view's rotation
 */
public class RotationAnimationPropertyUpdater extends AbstractSingleFloatProperyUpdater {

  public RotationAnimationPropertyUpdater(float toValue) {
    super(toValue);
  }

  @Override
  protected float getProperty(View view) {
    return view.getRotation();
  }

  @Override
  protected void setProperty(View view, float propertyValue) {
    view.setRotation((float) Math.toDegrees(propertyValue));
  }
}
