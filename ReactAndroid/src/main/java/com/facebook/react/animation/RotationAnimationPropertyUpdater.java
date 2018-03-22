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
