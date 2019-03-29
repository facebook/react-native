/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Subclass of {@link AnimationPropertyUpdater} for animating view's X scale
 */
public class ScaleXAnimationPropertyUpdater extends AbstractSingleFloatProperyUpdater {

  public ScaleXAnimationPropertyUpdater(float toValue) {
    super(toValue);
  }

  public ScaleXAnimationPropertyUpdater(float fromValue, float toValue) {
    super(fromValue, toValue);
  }

  @Override
  protected float getProperty(View view) {
    return view.getScaleX();
  }

  @Override
  protected void setProperty(View view, float propertyValue) {
    view.setScaleX(propertyValue);
  }
}
